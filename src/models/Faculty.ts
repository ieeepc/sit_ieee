import { Schema, model, models, type InferSchemaType } from "mongoose";

const facultySchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

export type Faculty = InferSchemaType<typeof facultySchema>;

export default models.Faculty || model("Faculty", facultySchema);
