import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Registration from "@/models/Registration";
import { findUpcomingEvent, isRegistrationOpen } from "@/lib/events";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  usn: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6,15}$/, "Please enter a valid USN"),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number")),
});

// Public: a student registering for an event from the Register Now page / QR code.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = registerSchema.parse(await req.json());
    await connectDB();

    const event = await findUpcomingEvent(id);
    if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });
    if (!isRegistrationOpen(event)) {
      return NextResponse.json({ message: "Registrations for this event are closed." }, { status: 400 });
    }

    try {
      await Registration.create({ event: event._id, ...body });
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        return NextResponse.json(
          { message: "This USN is already registered for the event.", whatsappLink: event.whatsappLink },
          { status: 409 }
        );
      }
      throw err;
    }

    return NextResponse.json({ ok: true, whatsappLink: event.whatsappLink }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ message: "Something went wrong. Try again." }, { status: 500 });
  }
}
