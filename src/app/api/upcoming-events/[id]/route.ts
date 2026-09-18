import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import UpcomingEvent from "@/models/UpcomingEvent";
import { isAdminRequest } from "@/lib/auth";
import { uploadImage, deleteImage } from "@/lib/cloudinary";

const updateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  date: z.string().optional(),
  description: z.string().trim().optional(),
  location: z.string().trim().optional(),
  registrationLink: z.string().trim().url().or(z.literal("")).optional(),
  registrationDeadline: z.string().optional(),
  posterDataUrl: z.string().startsWith("data:image/").optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { id } = await params;

  try {
    const body = updateSchema.parse(await req.json());
    await connectDB();

    const event = await UpcomingEvent.findById(id);
    if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });

    if (body.name !== undefined) event.name = body.name;
    if (body.date !== undefined) event.date = new Date(body.date);
    if (body.description !== undefined) event.description = body.description;
    if (body.location !== undefined) event.location = body.location;
    if (body.registrationLink !== undefined) event.registrationLink = body.registrationLink;
    if (body.registrationDeadline !== undefined)
      event.registrationDeadline = body.registrationDeadline ? new Date(body.registrationDeadline) : undefined;

    if (body.posterDataUrl) {
      const oldPublicId = event.posterPublicId;
      const { url, publicId } = await uploadImage(body.posterDataUrl, "upcoming-events");
      event.poster = url;
      event.posterPublicId = publicId;
      if (oldPublicId) deleteImage(oldPublicId).catch(() => {});
    }

    await event.save();
    return NextResponse.json({ event });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { id } = await params;

  await connectDB();
  const event = await UpcomingEvent.findById(id);
  if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });

  if (event.posterPublicId) await deleteImage(event.posterPublicId).catch(() => {});
  await event.deleteOne();

  return NextResponse.json({ ok: true });
}
