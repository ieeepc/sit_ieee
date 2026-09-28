import { Schema, model, models, type InferSchemaType } from "mongoose";

// A student's sign-up for an upcoming event (on-site registration form).
const registrationSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: "UpcomingEvent", required: true, index: true },
    name: { type: String, required: true, trim: true },
    usn: { type: String, required: true, uppercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// One registration per USN per event.
registrationSchema.index({ event: 1, usn: 1 }, { unique: true });

export type RegistrationDoc = InferSchemaType<typeof registrationSchema>;

export default models.Registration || model("Registration", registrationSchema);
