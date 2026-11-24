// Adds or updates the HACK-Z national-level 12-hour hackathon.
// Run with: node scripts/add-hack-z.mjs

import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set. Copy .env.local.example to .env.local and fill it in.");
  process.exit(1);
}

const upcomingEventSchema = new mongoose.Schema(
  {
    name: String,
    date: Date,
    description: String,
    location: String,
    registrationLink: String,
    registrationDeadline: Date,
    poster: String,
    posterPublicId: String,
    slug: { type: String, unique: true, sparse: true },
    time: String,
    openRegistration: Boolean,
    whatsappLink: String,
  },
  { timestamps: true }
);
const UpcomingEvent = mongoose.model("UpcomingEvent", upcomingEventSchema);

const hackz = {
  name: "HACK-Z 12-Hour National-Level Hackathon",
  time: "12-hour national-level hackathon",
  location: "SIT",
  description:
    "Build, collaborate and innovate at HACK-Z, a 12-hour national-level hackathon.\n\n" +
    "Register as a team, complete your team details, and submit your abstract within 2 days of registration.",
  poster: "/events/hack-z-poster-2026.png",
  posterPublicId: "",
  openRegistration: true,
  whatsappLink: "",
  registrationLink: "",
};

async function main() {
  await mongoose.connect(MONGODB_URI);
  await UpcomingEvent.updateOne(
    { slug: "hack-z" },
    { $set: { ...hackz, slug: "hack-z" } },
    { upsert: true }
  );
  console.log("HACK-Z saved. Register page: /upcoming-events/hack-z/register");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
