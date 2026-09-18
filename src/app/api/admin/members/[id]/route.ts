import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Member from "@/models/Member";
import { isAdminRequest } from "@/lib/auth";
import { uploadImage, deleteImage } from "@/lib/cloudinary";

const updateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  tag: z.string().trim().min(1).optional(),
  year: z.number().optional(),
  linkedin: z.string().trim().url().or(z.literal("")).optional(),
  github: z.string().trim().url().or(z.literal("")).optional(),
  isAdmin: z.boolean().optional(),
  photoDataUrl: z.string().startsWith("data:image/").optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { id } = await params;

  try {
    const body = updateSchema.parse(await req.json());
    await connectDB();

    const member = await Member.findById(id);
    if (!member) return NextResponse.json({ message: "Member not found" }, { status: 404 });

    if (body.name !== undefined) member.name = body.name;
    if (body.tag !== undefined) member.tag = body.tag;
    if (body.year !== undefined) member.year = body.year;
    if (body.linkedin !== undefined) member.linkedin = body.linkedin;
    if (body.github !== undefined) member.github = body.github;
    if (body.isAdmin !== undefined) member.isAdmin = body.isAdmin;

    if (body.photoDataUrl) {
      const oldPublicId = member.photoPublicId;
      const { url, publicId } = await uploadImage(body.photoDataUrl, "members");
      member.photo = url;
      member.photoPublicId = publicId;
      if (oldPublicId) deleteImage(oldPublicId).catch(() => {});
    }

    await member.save();
    return NextResponse.json({ member });
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
  const member = await Member.findById(id);
  if (!member) return NextResponse.json({ message: "Member not found" }, { status: 404 });

  if (member.photoPublicId) await deleteImage(member.photoPublicId).catch(() => {});
  await member.deleteOne();

  return NextResponse.json({ ok: true });
}
