import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Registration from "@/models/Registration";
import { findUpcomingEvent } from "@/lib/events";

const phoneSchema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number"));

const resumeSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  phone: phoneSchema,
});

// Lets a team pick up registration from another browser/tab: the leader's email and
// phone together act as proof of ownership for the returned registration.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = resumeSchema.parse(await req.json());
    const { id } = await params;
    await connectDB();

    const event = await findUpcomingEvent(id);
    if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });

    const registration = await Registration.findOne({
      event: event._id,
      email: body.email,
      $or: [
        { phone: body.phone },
        { phone: `+91${body.phone}` },
        { phone: `91${body.phone}` },
        { phone: `0${body.phone}` },
      ],
    }).lean();

    if (!registration) {
      return NextResponse.json(
        { message: "No registration found for that email and phone number." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      registrationId: String(registration._id),
      stage: registration.stage,
      teamSize: registration.teamSize ?? 3,
      teamName: registration.teamName ?? "",
      abstractSubmittedAt: registration.abstractSubmittedAt ?? null,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ message: "Something went wrong. Try again." }, { status: 500 });
  }
}
