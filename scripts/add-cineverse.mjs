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
    "Lights. Camera. Exordium.\n\n" +
    "The IEEE Photonics & ComSoc Joint Chapter welcomes the freshers of 2026 to CineVerse, the beginning of an exciting journey on campus.\n\n" +
    "CineVerse is more than a welcome event. It is your opening scene — an opportunity to meet new people, build meaningful connections, " +
    "discover new experiences, and become part of a community that you will learn, create, and grow with throughout your college journey.\n\n" +
    "Your story begins here. Step into the spotlight and be part of the experience.\n\n" +
    "Exclusively for the Freshers of 2026.\n\n" +
    "Register now and take your place before the curtains rise.",
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
