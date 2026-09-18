import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Member from "@/models/Member";
import { MEMBER_COOKIE, signMemberToken } from "@/lib/auth";

const signupSchema = z.object({
  secretKey: z.string().min(1, "Enter the chapter secret key"),
  name: z.string().trim().min(2, "Name is too short"),
  usn: z.string().trim().min(3, "Enter a valid USN"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = signupSchema.parse(await req.json());

    if (!process.env.SIGNUP_SECRET_KEY) {
      return NextResponse.json(
        { message: "SIGNUP_SECRET_KEY is not configured on the server." },
        { status: 500 }
      );
    }
    if (body.secretKey !== process.env.SIGNUP_SECRET_KEY) {
      return NextResponse.json({ message: "Incorrect secret key." }, { status: 403 });
    }

    const usn = body.usn.toLowerCase();
    const email = body.email.toLowerCase();

    await connectDB();

    const existing = await Member.findOne({ usn });

    let member;

    if (existing) {
      if (existing.isClaimed) {
        return NextResponse.json(
          { message: "This USN is already registered. Please login instead." },
          { status: 409 }
        );
      }
      // Claim a legacy roster entry migrated from the old site — keep their
      // existing name/photo/tag, just attach login credentials to it.
      const passwordHash = await bcrypt.hash(body.password, 10);
      existing.email = email;
      existing.passwordHash = passwordHash;
      existing.isClaimed = true;
      if (body.name) existing.name = body.name;
      member = await existing.save();
    } else {
      const emailTaken = await Member.findOne({ email, isClaimed: true });
      if (emailTaken) {
        return NextResponse.json({ message: "This email is already registered." }, { status: 409 });
      }
      const passwordHash = await bcrypt.hash(body.password, 10);
      member = await Member.create({
        name: body.name,
        usn,
        email,
        passwordHash,
        tag: "Member",
        isClaimed: true,
      });
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
