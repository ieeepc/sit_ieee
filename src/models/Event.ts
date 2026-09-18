import { Schema, model, models, type InferSchemaType } from "mongoose";

const photoSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: true }
);

// Past / completed events — powers the Timeline page.
const eventSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    description: { type: String, default: "" },
    photos: { type: [photoSchema], default: [] },
  },
  { timestamps: true }
);

export type EventDoc = InferSchemaType<typeof eventSchema>;

export default models.Event || model("Event", eventSchema);
