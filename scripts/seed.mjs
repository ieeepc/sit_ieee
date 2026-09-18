// Seeds MongoDB with the event history and team roster extracted from the
// original sitieeepandc.in site. Run with: npm run seed
// Safe to re-run — it upserts by name (events) / usn (members), never touches
// password hashes or already-claimed accounts.

import dotenv from "dotenv";
import mongoose from "mongoose";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set. Copy .env.local.example to .env.local and fill it in.");
  process.exit(1);
}

const photoSchema = new mongoose.Schema({ url: String, publicId: String });
const eventSchema = new mongoose.Schema(
  { name: String, date: Date, description: String, photos: [photoSchema] },
  { timestamps: true }
);
const memberSchema = new mongoose.Schema(
  {
    name: String,
    usn: { type: String, unique: true, lowercase: true },
    email: String,
    passwordHash: String,
    photo: String,
    photoPublicId: String,
    tag: String,
    year: Number,
    linkedin: String,
    github: String,
    isClaimed: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);
const Member = mongoose.model("Member", memberSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const eventsRaw = JSON.parse(
    await readFile(path.join(__dirname, "..", "seed-data", "events.json"), "utf-8")
  );
  const membersRaw = JSON.parse(
    await readFile(path.join(__dirname, "..", "seed-data", "members.json"), "utf-8")
  );

  let eventsCreated = 0;
  for (const e of eventsRaw) {
    const res = await Event.updateOne(
      { name: e.name },
      {
        $setOnInsert: {
          name: e.name,
          date: new Date(e.date),
          description: e.description ?? "",
          photos: (e.photos ?? []).map((p) => ({ url: p.url, publicId: p.public_id })),
        },
      },
      { upsert: true }
    );
    if (res.upsertedCount) eventsCreated++;
  }
  console.log(`Events: ${eventsCreated} created, ${eventsRaw.length - eventsCreated} already existed`);

  let membersCreated = 0;
  for (const m of membersRaw) {
    const usn = (m.usn ?? "").toLowerCase();
    if (!usn) continue;
    const res = await Member.updateOne(
      { usn },
      {
        $setOnInsert: {
          name: m.name,
          usn,
          photo: m.photo ?? "",
          tag: m.post ?? "Member",
          year: m.year,
          linkedin: m.linkedin ?? "",
          github: m.github ?? "",
          isClaimed: false, // members claim their account by signing up with this USN
          isAdmin: false,
        },
      },
      { upsert: true }
    );
    if (res.upsertedCount) membersCreated++;
  }
  console.log(`Members: ${membersCreated} created, ${membersRaw.length - membersCreated} already existed`);

  await mongoose.disconnect();
  console.log("Done. Legacy members can claim their profile by signing up with their original USN.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
