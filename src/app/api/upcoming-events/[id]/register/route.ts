import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import Registration from "@/models/Registration";
import { findUpcomingEvent, isRegistrationOpen } from "@/lib/events";
import { uploadDocument, deleteDocument } from "@/lib/cloudinary";
import { getCurrentMember, isAdminRequest } from "@/lib/auth";

const ABSTRACT_MAX_BYTES = 4 * 1024 * 1024;
const ABSTRACT_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx"];

const phoneSchema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number"));

const leaderSchema = z.object({
  stage: z.literal(1),
  name: z.string().trim().min(2).max(80),
  phone: phoneSchema.optional(),
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  teamName: z.string().trim().min(2).max(80),
  collegeName: z.string().trim().min(2).max(120),
  domain: z.string().trim().min(2).max(80),
  teamSize: z.number().int().min(3).max(4),
});

const memberSchema = z.object({
  name: z.string().trim().min(2).max(80),
  year: z.string().trim().min(1).max(30),
  usn: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6,15}$/, "Please enter a valid USN"),
  phone: phoneSchema,
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
});

const teamSchema = z.object({
  stage: z.literal(2),
  registrationId: z.string().min(1),
  teamMembers: z.array(memberSchema).min(2).max(4),
});

const registerSchema = z.union([
  leaderSchema,
  teamSchema,
  z.object({
    stage: z.literal(1),
    name: z.string().trim().min(2).max(80),
    usn: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6,15}$/),
    phone: phoneSchema,
  }),
]);

type DuplicateDoc = {
  _id: unknown;
  email?: string | null;
  phone?: string | null;
  stage: number;
  teamSize?: number | null;
};

function phoneChecks(phone?: string) {
  if (!phone) return [];
  return [{ phone }, { phone: `+91${phone}` }, { phone: `91${phone}` }, { phone: `0${phone}` }];
}

// Registration is a capability: only return it when email AND phone match the stored
// leader, so a duplicate sign-up can continue on the same team.
function duplicatePayload(existing: DuplicateDoc, email: string, phone: string | undefined, whatsappLink: string) {
  const verified = !!phone && existing.email === email && existing.phone === phone;
  return {
    message: "This email or phone number is already registered for Hack-Z.",
    alreadyRegistered: true,
    whatsappLink,
    ...(verified
      ? { registrationId: String(existing._id), stage: existing.stage, teamSize: existing.teamSize ?? 3 }
      : {}),
  };
}

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
      abstractDeadline: registration.abstractDeadline ?? null,
      abstractSubmittedAt: registration.abstractSubmittedAt ?? null,
      abstract: registration.abstract ?? null,
      stage: registration.stage,
      createdAt: registration.createdAt,
    })),
  });
}

// Public: a student registering for an event from the Register Now page / QR code.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const registrationId = String(form.get("registrationId") ?? "");
      const file = form.get("abstract");
      if (!registrationId) return NextResponse.json({ message: "Registration is missing." }, { status: 400 });
      if (!isValidObjectId(registrationId)) {
        return NextResponse.json({ message: "Registration not found." }, { status: 404 });
      }
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
      const registration = await Registration.findOne({ _id: registrationId, event: event._id });
      if (!registration) return NextResponse.json({ message: "Registration not found." }, { status: 404 });

      const teamSize = registration.teamSize ?? 2;
      if (registration.stage < 2 || (registration.teamMembers?.length ?? 0) < teamSize) {
        return NextResponse.json(
          { message: "Complete your team member details before submitting the abstract." },
          { status: 400 }
        );
      }
      if (registration.abstractDeadline && Date.now() > registration.abstractDeadline.getTime()) {
        return NextResponse.json(
          { message: "The abstract submission window has closed. Contact the organisers if you need help." },
          { status: 400 }
        );
      }

      if (registration.abstract?.publicId) {
        await deleteDocument(registration.abstract.publicId, registration.abstract.resourceType).catch(() => {});
      }
      const uploaded = await uploadDocument(
        Buffer.from(await file.arrayBuffer()),
        file.name,
        file.type,
        "hack-z-abstracts"
      );
      registration.abstract = {
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        url: uploaded.url,
        publicId: uploaded.publicId,
        resourceType: uploaded.resourceType,
      };
      registration.abstractSubmittedAt = new Date();
      registration.stage = 3;
      await registration.save();

      return NextResponse.json(
        { ok: true, abstractUrl: uploaded.url, whatsappLink: event.whatsappLink },
        { status: 200 }
      );
    }

    const body = registerSchema.parse(await req.json());
    await connectDB();

    const event = await findUpcomingEvent(id);
    if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });
    if (!isRegistrationOpen(event)) {
      return NextResponse.json({ message: "Registrations for this event are closed." }, { status: 400 });
    }

    if (body.stage === 2) {
      if (!isValidObjectId(body.registrationId)) {
        return NextResponse.json({ message: "Registration not found." }, { status: 404 });
      }
      const registration = await Registration.findOne({ _id: body.registrationId, event: event._id });
      if (!registration) return NextResponse.json({ message: "Registration not found." }, { status: 404 });
      if (registration.stage === 3) {
        return NextResponse.json(
          { message: "Team member details are locked once your abstract is submitted." },
          { status: 409 }
        );
      }
      const teamSize = registration.teamSize ?? 3;
      if (body.teamMembers.length < teamSize) {
        return NextResponse.json(
          { message: `Add all ${teamSize} team members before continuing.` },
          { status: 400 }
        );
      }
      registration.teamMembers = body.teamMembers;
      registration.teamSize = Math.max(teamSize, body.teamMembers.length);
      if (!registration.abstractDeadline) {
        registration.abstractDeadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      }
      registration.stage = 2;
      await registration.save();
      return NextResponse.json({
        ok: true,
        registrationId: registration._id.toString(),
        abstractDeadline: registration.abstractDeadline,
        whatsappLink: event.whatsappLink,
      });
    }

    const hackathon = /hack[- ]?z/i.test(`${event.name} ${event.slug ?? ""}`);
    if (hackathon) {
      if (!("email" in body)) return NextResponse.json({ message: "Email is required." }, { status: 400 });
      const normalizedEmail = body.email.toLowerCase();
      const duplicateFilter = { event: event._id, $or: [{ email: normalizedEmail }, ...phoneChecks(body.phone)] };

      const existing = await Registration.findOne(duplicateFilter).lean();
      if (existing) {
        return NextResponse.json(duplicatePayload(existing, normalizedEmail, body.phone, event.whatsappLink), {
          status: 409,
        });
      }

      try {
        const registration = await Registration.create({
          event: event._id,
          name: body.name,
          phone: body.phone,
          email: body.email,
          teamName: body.teamName,
          collegeName: body.collegeName,
          domain: body.domain,
          teamSize: body.teamSize,
          stage: 1,
        });
        return NextResponse.json({ ok: true, registrationId: registration._id.toString() }, { status: 201 });
      } catch (err) {
        if ((err as { code?: number }).code === 11000) {
          const raced = await Registration.findOne(duplicateFilter).lean();
          return NextResponse.json(
            raced
              ? duplicatePayload(raced, normalizedEmail, body.phone, event.whatsappLink)
              : { message: "This email or phone number is already registered for Hack-Z.", whatsappLink: event.whatsappLink },
            { status: 409 }
          );
        }
        throw err;
      }
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
