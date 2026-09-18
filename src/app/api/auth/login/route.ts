import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Member from "@/models/Member";
import { MEMBER_COOKIE, signMemberToken } from "@/lib/auth";

const loginSchema = z.object({
  usn: z.string().trim().min(1, "Enter your USN"),
  password: z.string().min(1, "Enter your password"),
});

export async function POST(req: NextRequest) {
  try {
    const body = loginSchema.parse(await req.json());
    const usn = body.usn.toLowerCase();

    await connectDB();

    const member = await Member.findOne({ usn, isClaimed: true }).select("+passwordHash");
    if (!member || !member.passwordHash) {
      return NextResponse.json({ message: "Invalid USN or password." }, { status: 401 });
    }

    const valid = await bcrypt.compare(body.password, member.passwordHash);
    if (!valid) {
      return NextResponse.json({ message: "Invalid USN or password." }, { status: 401 });
    }

    const token = signMemberToken({ id: member._id.toString(), usn: member.usn, isAdmin: member.isAdmin });

    const res = NextResponse.json({
      id: member._id,
      name: member.name,
      usn: member.usn,
      tag: member.tag,
      photo: member.photo,
    });
    res.cookies.set(MEMBER_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ message: "Something went wrong. Try again." }, { status: 500 });
  }
}
