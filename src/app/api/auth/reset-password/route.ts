import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Member from "@/models/Member";

const resetSchema = z.object({
  secretKey: z.string().min(1, "Enter the chapter secret key"),
  usn: z.string().trim().min(3, "Enter a valid USN"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Forgot password: the site can't send email, so members prove who they are the same way they
// signed up — the chapter secret key — plus the USN and email on their account.
export async function POST(req: NextRequest) {
  try {
    const body = resetSchema.parse(await req.json());

    if (!process.env.SIGNUP_SECRET_KEY) {
      return NextResponse.json({ message: "SIGNUP_SECRET_KEY is not configured on the server." }, { status: 500 });
    }
    if (body.secretKey !== process.env.SIGNUP_SECRET_KEY) {
      return NextResponse.json({ message: "Incorrect secret key." }, { status: 403 });
    }

    await connectDB();
    const member = await Member.findOne({
      usn: body.usn.toLowerCase(),
      email: body.email.toLowerCase(),
      isClaimed: true,
    });
    if (!member) {
      return NextResponse.json(
        { message: "That USN and email don't match any member account." },
        { status: 404 }
      );
    }

    member.passwordHash = await bcrypt.hash(body.password, 10);
    await member.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ message: "Something went wrong. Try again." }, { status: 500 });
  }
}
