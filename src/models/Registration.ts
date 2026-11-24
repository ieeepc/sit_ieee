import { Schema, model, models, type InferSchemaType } from "mongoose";

const teamMemberSchema = new Schema(
  {
    name: { type: String, trim: true },
    branch: { type: String, trim: true },
    year: { type: String, trim: true },
    college: { type: String, trim: true },
    usn: { type: String, uppercase: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
  },
  { _id: false }
);

// A sign-up for an upcoming event. Hackathon registrations use the staged
// leader, team-member and abstract fields; older event registrations remain
// valid through the optional fields.
const registrationSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: "UpcomingEvent", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    usn: { type: String, uppercase: true, trim: true },
    teamName: { type: String, trim: true },
    collegeName: { type: String, trim: true },
    domain: { type: String, trim: true },
    teamSize: { type: Number, min: 2, max: 4 },
    teamMembers: { type: [teamMemberSchema], default: [] },
    abstract: {
      fileName: { type: String, default: "" },
      mimeType: { type: String, default: "" },
      size: { type: Number, default: 0 },
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
      resourceType: { type: String, enum: ["image", "raw"], default: "raw" },
    },
    abstractDeadline: { type: Date },
    abstractSubmittedAt: { type: Date },
    stage: { type: Number, enum: [1, 2, 3], default: 1 },
  },
  { timestamps: true }
);

// Preserve one registration per USN for existing events, and additionally
// prevent duplicate Hack-Z sign-ups by the leader's email or phone.
registrationSchema.index({ event: 1, usn: 1 }, { unique: true, sparse: true });
registrationSchema.index({ event: 1, email: 1 }, { unique: true, sparse: true });
registrationSchema.index({ event: 1, phone: 1 }, { unique: true, sparse: true });

export type RegistrationDoc = InferSchemaType<typeof registrationSchema>;

export default models.Registration || model("Registration", registrationSchema);
