import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Member from "@/models/Member";
import { getCurrentMember } from "@/lib/auth";
import { uploadImage, deleteImage } from "@/lib/cloudinary";

const updateSchema = z.object({
  tag: z.string().trim().min(1).max(60).optional(),
  linkedin: z.string().trim().url().or(z.literal("")).optional(),
  github: z.string().trim().url().or(z.literal("")).optional(),
  photoDataUrl: z.string().startsWith("data:image/").optional(),
});

// A member updating their own profile photo + tag/links.
export async function PATCH(req: NextRequest) {
  const session = await getCurrentMember();
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  try {
    const body = updateSchema.parse(await req.json());
    await connectDB();

    const member = await Member.findById(session.id);
    if (!member) return NextResponse.json({ message: "Member not found" }, { status: 404 });

    if (body.tag !== undefined) member.tag = body.tag;
    if (body.linkedin !== undefined) member.linkedin = body.linkedin;
    if (body.github !== undefined) member.github = body.github;

    if (body.photoDataUrl) {
      const oldPublicId = member.photoPublicId;
      const { url, publicId } = await uploadImage(body.photoDataUrl, "members");
      member.photo = url;
      member.photoPublicId = publicId;
      if (oldPublicId) {
        deleteImage(oldPublicId).catch(() => {});
      }
    }

    await member.save();

    return NextResponse.json({
      id: member._id,
      name: member.name,
      usn: member.usn,
      tag: member.tag,
      photo: member.photo,
      linkedin: member.linkedin,
      github: member.github,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ message: "Something went wrong. Try again." }, { status: 500 });
  }
}
