import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import Registration from "@/models/Registration";
import { findUpcomingEvent, isRegistrationOpen } from "@/lib/events";
import { storeAbstract } from "@/lib/abstract-storage";
import { syncRegistrationToDrive } from "@/lib/registration-drive";
import { getCurrentMember, isAdminRequest } from "@/lib/auth";

const ABSTRACT_MAX_BYTES = 4 * 1024 * 1024;
const ABSTRACT_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx"];

const phoneSchema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number"));

const leaderSchema = z.object({
  name: z.string().trim().min(2).max(80),
  usn: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6,15}$/),
  phone: phoneSchema,
  email: z.string().trim().email("Please enter a valid email address").toLowerCase().optional(),
});

const memberSchema = z.object({
  name: z.string().trim().min(2).max(80),
  year: z.string().trim().min(1).max(30),
  usn: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6,15}$/, "Please enter a valid USN"),
  phone: phoneSchema,
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
});

function addDuplicateIssues(
  teamMembers: { email: string; phone: string; usn: string }[],
  ctx: z.RefinementCtx
) {
  const checks = [
    { key: "email", label: "email ID" },
    { key: "phone", label: "phone number" },
    { key: "usn", label: "USN" },
  ] as const;
  for (const check of checks) {
    const seen = new Map<string, number>();
    teamMembers.forEach((member, index) => {
      const value = member[check.key];
      const previous = seen.get(value);
      if (previous !== undefined) {
        ctx.addIssue({
          code: "custom",
          message: `Team member ${previous + 1} and team member ${index + 1} share the same ${check.label}. Each member must be unique.`,
        });
      } else {
        seen.set(value, index);
      }
    });
  }
}

// The whole Hack-Z application (team, members and abstract) arrives together, so a
// registration only exists in the database once every stage is complete.
const applicationSchema = z
  .object({
    teamName: z.string().trim().min(2).max(80),
    collegeName: z.string().trim().min(2).max(120),
    domain: z.string().trim().min(2).max(80),
    teamSize: z.number().int().min(3).max(4),
    teamMembers: z.array(memberSchema).min(3).max(4),
  })
  .superRefine(({ teamMembers, teamSize }, ctx) => {
    if (teamMembers.length !== teamSize) {
      ctx.addIssue({
        code: "custom",
        message: `Add all ${teamSize} team members before submitting.`,
      });
    }
    addDuplicateIssues(teamMembers, ctx);
  });

// Members and admins can view the HACK-Z registrations and export them.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentMember()) && !(await isAdminRequest())) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();
  const event = await findUpcomingEvent(id);
  if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });

  const registrations = await Registration.find({ event: event._id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({
    event: { name: event.name, slug: event.slug ?? "" },
    registrations: registrations.map((registration) => ({
      id: String(registration._id),
      leaderName: registration.name,
      leaderPhone: registration.phone,
      leaderEmail: registration.email ?? "",
      teamName: registration.teamName ?? "",
      collegeName: registration.collegeName ?? "",
      domain: registration.domain ?? "",
      teamSize: registration.teamSize ?? registration.teamMembers?.length ?? 0,
      teamMembers: registration.teamMembers ?? [],
      abstractSubmittedAt: registration.abstractSubmittedAt ?? null,
      abstracts:
        registration.abstracts?.length
          ? registration.abstracts
          : registration.abstract?.url
            ? [registration.abstract]
            : [],
      abstract: registration.abstract ?? null,
      stage: registration.stage,
      createdAt: registration.createdAt,
    })),
  });
}

// Public: a student registering for an event from the Register Now page / QR code.
// Hack-Z applications arrive in one request, together with the abstract, so a team
// is only stored once every stage is complete.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const registrationId = String(form.get("registrationId") ?? "");
      const applicationRaw = form.get("application");
      const file = form.get("abstract");

      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ message: "Choose an abstract file to upload." }, { status: 400 });
      }
      if (file.size > ABSTRACT_MAX_BYTES) {
        return NextResponse.json({ message: "Abstract file must be under 4 MB." }, { status: 400 });
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ABSTRACT_EXTENSIONS.includes(ext)) {
        return NextResponse.json({ message: "Upload a PDF, DOC, DOCX, PPT or PPTX file." }, { status: 400 });
      }

      await connectDB();
      const event = await findUpcomingEvent(id);
      if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });

      let registration;
      if (registrationId) {
        if (!isValidObjectId(registrationId)) {
          return NextResponse.json({ message: "Registration not found." }, { status: 404 });
        }
        const existing = await Registration.findOne({ _id: registrationId, event: event._id });
        if (!existing) return NextResponse.json({ message: "Registration not found." }, { status: 404 });
        const teamSize = existing.teamSize ?? 3;
        if (existing.stage < 2 || (existing.teamMembers?.length ?? 0) < teamSize) {
          return NextResponse.json(
            { message: "Complete your team details before adding another abstract." },
            { status: 400 }
          );
        }
        registration = existing;
      } else {
        if (!isRegistrationOpen(event)) {
          return NextResponse.json({ message: "Registrations for this event are closed." }, { status: 400 });
        }
        if (!applicationRaw) {
          return NextResponse.json(
            { message: "Complete stages 1 and 2 before submitting your abstract." },
            { status: 400 }
          );
        }
        let application: z.infer<typeof applicationSchema>;
        try {
          application = applicationSchema.parse(JSON.parse(String(applicationRaw)));
        } catch (err) {
          if (err instanceof SyntaxError) {
            return NextResponse.json(
              { message: "Could not read your team details. Fill them again." },
              { status: 400 }
            );
          }
          throw err;
        }

        // Re-applying is allowed: every complete submission is its own entry.
        const leader = application.teamMembers[0];
        registration = await Registration.create({
          event: event._id,
          name: leader.name,
          email: leader.email,
          phone: leader.phone,
          teamName: application.teamName,
          collegeName: application.collegeName,
          domain: application.domain,
          teamSize: application.teamSize,
          teamMembers: application.teamMembers,
          stage: 3,
        });
        // Creates the team's Drive folder before the file is uploaded into it.
        await syncRegistrationToDrive(registration, event.name);
      }

      const uploaded = await storeAbstract(
        Buffer.from(await file.arrayBuffer()),
        file.name,
        file.type,
        "hack-z",
        registration.driveFolderId
      ).catch(async (err) => {
        // Never keep a registration that has no abstract.
        if (!registrationId) await registration.deleteOne();
        throw err;
      });

      const entry = {
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        url: uploaded.url,
        publicId: uploaded.publicId,
        resourceType: uploaded.resourceType,
        submittedAt: new Date(),
      };
      registration.abstracts.push(entry);
      // Keep the legacy field populated for older consumers; never overwrite it.
      if (!registration.abstract?.url) {
        registration.abstract = entry;
      }
      registration.abstractSubmittedAt = entry.submittedAt;
      registration.stage = 3;
      await registration.save();
      await syncRegistrationToDrive(registration, event.name);

      return NextResponse.json(
        {
          ok: true,
          registrationId: registration._id.toString(),
          abstract: { fileName: entry.fileName, url: entry.url },
          abstractCount: registration.abstracts.length,
          whatsappLink: event.whatsappLink,
        },
        { status: 200 }
      );
    }

    const body = leaderSchema.parse(await req.json());
    await connectDB();

    const event = await findUpcomingEvent(id);
    if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });
    if (!isRegistrationOpen(event)) {
      return NextResponse.json({ message: "Registrations for this event are closed." }, { status: 400 });
    }
    const hackathon = /hack[- ]?z/i.test(`${event.name} ${event.slug ?? ""}`);
    if (hackathon) {
      return NextResponse.json(
        { message: "Your Hack-Z registration is saved only after you submit your abstract." },
        { status: 400 }
      );
    }

    try {
      const registration = await Registration.create({ event: event._id, ...body });
      return NextResponse.json({ ok: true, whatsappLink: event.whatsappLink, registrationId: registration._id.toString() }, { status: 201 });
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        return NextResponse.json(
          { message: "This USN or phone number is already registered for the event.", whatsappLink: event.whatsappLink },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ message: "Something went wrong. Try again." }, { status: 500 });
  }
}
