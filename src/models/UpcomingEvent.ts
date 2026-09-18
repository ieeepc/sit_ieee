import { Schema, model, models, type InferSchemaType } from "mongoose";

// Future events — powers the Upcoming Events page.
const upcomingEventSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    registrationLink: { type: String, default: "" },
    registrationDeadline: { type: Date },
    poster: { type: String, default: "" },
    posterPublicId: { type: String, default: "" },
  },
  { timestamps: true }
);

export type UpcomingEventDoc = InferSchemaType<typeof upcomingEventSchema>;

export default models.UpcomingEvent || model("UpcomingEvent", upcomingEventSchema);
