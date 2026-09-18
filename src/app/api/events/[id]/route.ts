import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import { isAdminRequest } from "@/lib/auth";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import type { Types } from "mongoose";

type PhotoSubdoc = { _id?: Types.ObjectId; url: string; publicId: string };

const updateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  date: z.string().optional(),
  description: z.string().trim().optional(),
  addPhotoDataUrls: z.array(z.string().startsWith("data:image/")).default([]),
  removePhotoIds: z.array(z.string()).default([]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { id } = await params;

  try {
    const body = updateSchema.parse(await req.json());
    await connectDB();

    const event = await Event.findById(id);
    if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });

    if (body.name !== undefined) event.name = body.name;
    if (body.date !== undefined) event.date = new Date(body.date);
    if (body.description !== undefined) event.description = body.description;

    if (body.removePhotoIds.length) {
      const toRemove = (event.photos as PhotoSubdoc[]).filter((p) =>
        body.removePhotoIds.includes(p._id!.toString())
      );
      await Promise.all(toRemove.map((p) => deleteImage(p.publicId).catch(() => {})));
      event.photos = (event.photos as PhotoSubdoc[]).filter(
        (p) => !body.removePhotoIds.includes(p._id!.toString())
      ) as typeof event.photos;
    }

    if (body.addPhotoDataUrls.length) {
      const newPhotos = await Promise.all(
        body.addPhotoDataUrls.map(async (dataUrl) => {
          const { url, publicId } = await uploadImage(dataUrl, "events");
          return { url, publicId };
        })
      );
      event.photos.push(...newPhotos);
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
  const event = await Event.findById(id);
  if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });

  await Promise.all((event.photos as PhotoSubdoc[]).map((p) => deleteImage(p.publicId).catch(() => {})));
  await event.deleteOne();

  return NextResponse.json({ ok: true });
}
