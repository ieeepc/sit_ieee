import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UpcomingEvent from "@/models/UpcomingEvent";
import Registration from "@/models/Registration";
import { getCurrentMember, isAdminRequest } from "@/lib/auth";

// Members/admins: every event that takes on-site registrations, with its registered students.
export async function GET() {
  if (!(await getCurrentMember()) && !(await isAdminRequest())) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  await connectDB();
  const events = await UpcomingEvent.find({ openRegistration: true }).sort({ date: -1 }).lean();
  const registrations = await Registration.find({ event: { $in: events.map((e) => e._id) } })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    events: events.map((e) => ({
      _id: String(e._id),
      name: e.name,
      slug: e.slug ?? "",
      date: e.date,
      time: e.time,
      registrations: registrations
        .filter((r) => String(r.event) === String(e._id))
        .map((r) => ({ _id: String(r._id), name: r.name, usn: r.usn, phone: r.phone, createdAt: r.createdAt })),
    })),
  });
}
