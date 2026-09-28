// Adds (or updates) the CineVerse freshers' event on the Upcoming Events page.
// Run with: node scripts/add-cineverse.mjs
// Safe to re-run — it upserts by slug and never touches existing registrations.

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

const cineverse = {
  name: "CineVerse — Freshers' Welcome 2026",
  date: new Date("2026-10-07T17:00:00+05:30"),
  time: "5:00 PM",
  description:
    "Lights. Camera. IEEE! 🎬\n\n" +
    "Team IEEE Photonics & ComSoc Joint Chapter rolls out the red carpet for the freshers of 2026. " +
    "CineVerse is your opening scene on campus — dress up as your favourite movie character, step into the spotlight, " +
    "and meet the people you'll learn, build and celebrate with for the next four years.\n\n" +
    "Exclusively for freshers. Your story starts here — grab your spot before the curtains rise!",
  poster: "/events/cineverse-poster.png",
  posterPublicId: "",
  openRegistration: true,
  whatsappLink: "https://chat.whatsapp.com/LTe7MqKHDaALSv6f1YQZFw",
  registrationLink: "",
};

async function main() {
  await mongoose.connect(MONGODB_URI);
  await UpcomingEvent.updateOne({ slug: "cineverse" }, { $set: { ...cineverse, slug: "cineverse" } }, { upsert: true });
  console.log("CineVerse saved. Register page: /upcoming-events/cineverse/register");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
