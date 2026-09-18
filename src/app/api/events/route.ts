import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import { isAdminRequest } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

export async function GET() {
  await connectDB();
  const events = await Event.find({}).sort({ date: -1 });
  return NextResponse.json({ events });
}

const createSchema = z.object({
  name: z.string().trim().min(2),
  date: z.string(), // ISO date string
  description: z.string().trim().default(""),
  photoDataUrls: z.array(z.string().startsWith("data:image/")).default([]),
});

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }

  try {
    const body = createSchema.parse(await req.json());
    await connectDB();

    const photos = await Promise.all(
      body.photoDataUrls.map(async (dataUrl) => {
        const { url, publicId } = await uploadImage(dataUrl, "events");
        return { url, publicId };
      })
    );

    const event = await Event.create({
      name: body.name,
      date: new Date(body.date),
      description: body.description,
      photos,
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
