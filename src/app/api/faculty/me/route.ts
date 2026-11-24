import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Faculty from "@/models/Faculty";
import { getCurrentFaculty } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentFaculty();
  if (!session) return NextResponse.json({ faculty: null });

  await connectDB();
  const faculty = await Faculty.findById(session.id);
  if (!faculty) return NextResponse.json({ faculty: null });

  return NextResponse.json({
    faculty: { id: faculty._id, username: faculty.username, email: faculty.email },
  });
}
