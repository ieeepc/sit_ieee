import { Schema, model, models, type InferSchemaType } from "mongoose";

// A student applying to join the chapter from the Join Us page.
const recruitmentApplicationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    usn: { type: String, required: true, unique: true, uppercase: true, trim: true },
    year: { type: Number, required: true, enum: [1, 2] },
    branch: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export type RecruitmentApplicationDoc = InferSchemaType<typeof recruitmentApplicationSchema>;

export default models.RecruitmentApplication || model("RecruitmentApplication", recruitmentApplicationSchema);
