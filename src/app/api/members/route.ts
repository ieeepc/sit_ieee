import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Member from "@/models/Member";

// Public roster for the Our Team page — never expose passwordHash/email here.
export async function GET() {
  await connectDB();
  const members = await Member.find({})
    .select("name photo tag year linkedin github createdAt")
    .sort({ createdAt: 1 });
  return NextResponse.json({ members });
}
