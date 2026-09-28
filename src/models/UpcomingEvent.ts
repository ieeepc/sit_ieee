import { Schema, model, models, type InferSchemaType } from "mongoose";

// Future events — powers the Upcoming Events page.
const upcomingEventSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date }, // optional — some events are announced before a date is locked in
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    registrationLink: { type: String, default: "" },
    registrationDeadline: { type: Date },
    poster: { type: String, default: "" },
    posterPublicId: { type: String, default: "" },
    slug: { type: String, trim: true, lowercase: true, unique: true, sparse: true }, // pretty URL for /upcoming-events/[slug]/register
    time: { type: String, default: "" }, // display time, e.g. "5:00 PM"
    openRegistration: { type: Boolean, default: false }, // collect registrations on this site instead of an external link
    whatsappLink: { type: String, default: "" }, // shown to students after they register
  },
  { timestamps: true }
);

export type UpcomingEventDoc = InferSchemaType<typeof upcomingEventSchema>;

export default models.UpcomingEvent || model("UpcomingEvent", upcomingEventSchema);
