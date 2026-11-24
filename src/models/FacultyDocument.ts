import { Schema, model, models, type InferSchemaType } from "mongoose";

const facultyDocumentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    year: { type: Number, required: true, index: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ["image", "raw"], default: "raw" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "Faculty", required: true },
    uploadedByName: { type: String, default: "" },
  },
  { timestamps: true }
);

export type FacultyDocument = InferSchemaType<typeof facultyDocumentSchema>;

export default models.FacultyDocument || model("FacultyDocument", facultyDocumentSchema);
