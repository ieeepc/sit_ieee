import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import UpcomingEvent from "@/models/UpcomingEvent";
import { isAdminRequest } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

export async function GET() {
  await connectDB();
  const events = await UpcomingEvent.find({}).sort({ date: 1 });
  return NextResponse.json({ events });
}

const createSchema = z.object({
  name: z.string().trim().min(2),
  date: z.string(),
  description: z.string().trim().default(""),
  location: z.string().trim().default(""),
  registrationLink: z.string().trim().url().or(z.literal("")).default(""),
  registrationDeadline: z.string().optional(),
  posterDataUrl: z.string().startsWith("data:image/").optional(),
});

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }

  try {
    const body = createSchema.parse(await req.json());
    await connectDB();

    let poster = "";
    let posterPublicId = "";
    if (body.posterDataUrl) {
      const uploaded = await uploadImage(body.posterDataUrl, "upcoming-events");
      poster = uploaded.url;
      posterPublicId = uploaded.publicId;
    }

    const event = await UpcomingEvent.create({
      name: body.name,
      date: new Date(body.date),
      description: body.description,
      location: body.location,
      registrationLink: body.registrationLink,
      registrationDeadline: body.registrationDeadline ? new Date(body.registrationDeadline) : undefined,
      poster,
      posterPublicId,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
