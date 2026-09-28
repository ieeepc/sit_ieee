import { isValidObjectId } from "mongoose";
import UpcomingEvent from "@/models/UpcomingEvent";

// Upcoming events can be addressed by their slug (pretty URL / QR code) or their Mongo id.
export function findUpcomingEvent(idOrSlug: string) {
  const key = idOrSlug.toLowerCase();
  return UpcomingEvent.findOne(isValidObjectId(key) ? { $or: [{ _id: key }, { slug: key }] } : { slug: key });
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Registration stays open until the end of the deadline day, or until a day after the event if no deadline is set.
export function isRegistrationOpen(event: { openRegistration?: boolean; date?: Date | string | null; registrationDeadline?: Date | string | null }) {
  if (!event.openRegistration) return false;
  const now = Date.now();
  if (event.registrationDeadline) return now < new Date(event.registrationDeadline).getTime() + DAY_MS;
  if (event.date) return now < new Date(event.date).getTime() + DAY_MS;
  return true;
}
