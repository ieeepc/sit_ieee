import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Faculty from "@/models/Faculty";
import { FACULTY_COOKIE, signFacultyToken } from "@/lib/auth";

const loginSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(40),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  secretKey: z.string().min(1, "Enter the faculty secret key"),
});

// Faculty login. The secret key is required every time. The first login with a new
// email creates the faculty account; after that, username + password must match it.
export async function POST(req: NextRequest) {
  try {
    const body = loginSchema.parse(await req.json());

    const expectedKey = process.env.FACULTY_SECRET_KEY;
    if (!expectedKey) {
      return NextResponse.json(
        { message: "FACULTY_SECRET_KEY is not configured on the server." },
        { status: 500 }
      );
    }
    if (body.secretKey !== expectedKey) {
      return NextResponse.json({ message: "Incorrect secret key." }, { status: 403 });
    }

    const username = body.username.toLowerCase();
    const email = body.email.toLowerCase();

    await connectDB();

    let faculty = await Faculty.findOne({ email }).select("+passwordHash");

    if (faculty) {
      const valid =
        faculty.username === username && (await bcrypt.compare(body.password, faculty.passwordHash));
      if (!valid) {
        return NextResponse.json({ message: "Invalid username, email or password." }, { status: 401 });
      }
    } else {
      if (await Faculty.exists({ username })) {
        return NextResponse.json(
          { message: "This username is already taken by another email." },
          { status: 409 }
        );
      }
      faculty = await Faculty.create({
        username,
        email,
        passwordHash: await bcrypt.hash(body.password, 10),
      });
    }

    const token = signFacultyToken({ id: faculty._id.toString(), username: faculty.username });

    const res = NextResponse.json({ id: faculty._id, username: faculty.username, email: faculty.email });
    res.cookies.set(FACULTY_COOKIE, token, {
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
