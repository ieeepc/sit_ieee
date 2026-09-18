import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Member from "@/models/Member";
import { isAdminRequest } from "@/lib/auth";

// Full roster for the admin dashboard (still never returns passwordHash).
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }

  await connectDB();
  const members = await Member.find({}).sort({ createdAt: -1 });
  return NextResponse.json({ members });
}

const createSchema = z.object({
  name: z.string().trim().min(2),
  usn: z.string().trim().min(3),
  tag: z.string().trim().default("Member"),
  year: z.number().optional(),
});

// Add a roster placeholder (e.g. a new member who hasn't signed up yet).
// They "claim" it later by signing up with the matching USN.
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }

  try {
    const body = createSchema.parse(await req.json());
    await connectDB();

    const usn = body.usn.toLowerCase();
    const existing = await Member.findOne({ usn });
    if (existing) {
      return NextResponse.json({ message: "A member with this USN already exists." }, { status: 409 });
    }

    const member = await Member.create({
      name: body.name,
      usn,
      tag: body.tag,
      year: body.year,
      isClaimed: false,
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
