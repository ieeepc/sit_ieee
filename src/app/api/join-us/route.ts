import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import RecruitmentApplication from "@/models/RecruitmentApplication";
import { getCurrentMember, isAdminRequest } from "@/lib/auth";

const applySchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  usn: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6,15}$/, "Please enter a valid USN"),
  year: z.coerce.number().refine((y) => y === 1 || y === 2, "Please choose 1st or 2nd year"),
  branch: z.string().trim().min(2, "Please enter your branch").max(60),
  email: z.string().trim().toLowerCase().email("Please enter a valid email"),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number")),
});

// Public: a student applying from the Join Us page.
export async function POST(req: NextRequest) {
  try {
    const body = applySchema.parse(await req.json());
    await connectDB();

    try {
      await RecruitmentApplication.create(body);
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        return NextResponse.json({ message: "This USN has already applied." }, { status: 409 });
      }
      throw err;
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ message: "Something went wrong. Try again." }, { status: 500 });
  }
}

// Members/admins: every recruitment application, newest first.
export async function GET() {
  if (!(await getCurrentMember()) && !(await isAdminRequest())) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  await connectDB();
  const applications = await RecruitmentApplication.find({}).sort({ createdAt: -1 }).lean();

  return NextResponse.json({
    applications: applications.map((a) => ({
      _id: String(a._id),
      name: a.name,
      usn: a.usn,
      year: a.year,
      branch: a.branch,
      email: a.email,
      phone: a.phone,
      createdAt: a.createdAt,
    })),
  });
}
