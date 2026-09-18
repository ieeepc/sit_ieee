import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Member from "@/models/Member";
import { getCurrentMember } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentMember();
  if (!session) return NextResponse.json({ member: null });

  await connectDB();
  const member = await Member.findById(session.id);
  if (!member) return NextResponse.json({ member: null });

  return NextResponse.json({
    member: {
      id: member._id,
      name: member.name,
      usn: member.usn,
      email: member.email,
      tag: member.tag,
      photo: member.photo,
      linkedin: member.linkedin,
      github: member.github,
      year: member.year,
      isAdmin: member.isAdmin,
    },
  });
}
