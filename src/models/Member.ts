import { Schema, model, models, type InferSchemaType } from "mongoose";

const memberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    usn: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    photo: { type: String, default: "" },
    photoPublicId: { type: String, default: "" },
    tag: { type: String, default: "Member" }, // e.g. "Chair Person", "Web Lead", "Member"
    year: { type: Number },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    isClaimed: { type: Boolean, default: false }, // false = migrated legacy roster entry, no login yet
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type Member = InferSchemaType<typeof memberSchema>;

export default models.Member || model("Member", memberSchema);
