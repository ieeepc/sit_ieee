// Imports the faculty documents shared by mail into the site.
// PDFs are copied into public/faculty-documents/<year>/ and recorded in MongoDB,
// because Cloudinary on the free plan refuses to deliver PDF files (401).
// Run with: node scripts/import-faculty-docs.mjs [sourceDir]

import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in .env.local.");
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const sourceDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, "..", ".tmp-faculty-docs");
if (!existsSync(sourceDir)) {
  console.error(`Source folder not found: ${sourceDir}`);
  process.exit(1);
}

const publicRoot = path.join(__dirname, "..", "public");

// fileName -> { year, title, slug } mapped from each PDF's report header/date.
const DOCS = {
  "2.2.1_1.pdf": { year: 2026, title: "AI Hackathon 2026", slug: "ai-hackathon-2026" },
  "2.2.1_2.pdf": { year: 2026, title: "Building AI with LLMs — Workshop", slug: "building-ai-with-llms-workshop" },
  "2.2.1_I3_6.pdf": { year: 2026, title: "Building AI with LLMs — Workshop Photos", slug: "building-ai-with-llms-workshop-photos" },
  "HACK-Z 2025 REPORT.pdf": { year: 2025, title: "HACK-Z 2025 — Event Report", slug: "hack-z-2025-report" },
  "2.2.1_1_1.pdf": { year: 2025, title: "IGNITE 2025 — Algowar", slug: "ignite-2025-algowar" },
  "2.2.1_2_1.pdf": { year: 2025, title: "IGNITE 2025 — BGMI", slug: "ignite-2025-bgmi" },
  "2.2.1_3.pdf": { year: 2025, title: "IGNITE 2025 — Brainware", slug: "ignite-2025-brainware" },
  "2.2.1_4.pdf": { year: 2025, title: "IGNITE 2025 — Circuit Clash", slug: "ignite-2025-circuit-clash" },
  "2.2.1_5.pdf": { year: 2025, title: "IGNITE 2025 — Clash of Clans", slug: "ignite-2025-clash-of-clans" },
  "2.2.1_6.pdf": { year: 2025, title: "IGNITE 2025 — Echoes of Innovation", slug: "ignite-2025-echoes-of-innovation" },
  "2.2.1_7.pdf": { year: 2025, title: "IGNITE 2025 — MindSpark", slug: "ignite-2025-mindspark" },
  "2.2.1_8.pdf": { year: 2025, title: "IGNITE 2025 — Pixel Perspective", slug: "ignite-2025-pixel-perspective" },
  "2.2.1_1_2.pdf": { year: 2024, title: "Exordium 2024", slug: "exordium-2024" },
  "2.2.1_l3_5.pdf": { year: 2024, title: "4G to 6G — Wireless Technology Talk", slug: "4g-to-6g-wireless-talk" },
  "2.2.1_l3_1.pdf": { year: 2023, title: "Building Blocks", slug: "building-blocks" },
  "2.2.1_l3_2.pdf": { year: 2023, title: "Plantation at Biodiversity Park", slug: "plantation-biodiversity-park" },
  "2.2.1_l3_3.pdf": { year: 2023, title: "WIE Code Curtain Raiser", slug: "wie-code-curtain-raiser" },
  "2.2.1_l3_4.pdf": { year: 2023, title: "Anti Sexual Harassment Program", slug: "anti-sexual-harassment-program" },
};

const facultySchema = new mongoose.Schema({ username: String, email: String });
const Faculty = mongoose.models.Faculty || mongoose.model("Faculty", facultySchema);

const facultyDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    year: { type: Number, required: true, index: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ["image", "raw"], default: "raw" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
    uploadedByName: { type: String, default: "" },
  },
  { timestamps: true }
);
const FacultyDocument = mongoose.models.FacultyDocument || mongoose.model("FacultyDocument", facultyDocumentSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);

  const faculty = await Faculty.findOne().lean();
  const uploadedBy = faculty?._id ?? new mongoose.Types.ObjectId();
  const uploadedByName = faculty?.username ?? "Chapter Archive";

  let imported = 0;
  let failed = 0;

  for (const [fileName, meta] of Object.entries(DOCS)) {
    try {
      const buffer = await fs.readFile(path.join(sourceDir, fileName));
      const relDir = path.join("faculty-documents", String(meta.year));
      const relPath = path.join(relDir, `${meta.slug}.pdf`);
      const absDir = path.join(publicRoot, relDir);
      await fs.mkdir(absDir, { recursive: true });
      await fs.writeFile(path.join(publicRoot, relPath), buffer);

      const url = `/${relPath.split(path.sep).join("/")}`;
      const publicId = `local:${url}`;

      const existing = await FacultyDocument.findOne({ fileName, year: meta.year });
      const previousPublicId = existing?.publicId;
      const fields = {
        title: meta.title,
        year: meta.year,
        fileName,
        mimeType: "application/pdf",
        size: buffer.length,
        url,
        publicId,
        resourceType: "raw",
        uploadedBy: existing?.uploadedBy ?? uploadedBy,
        uploadedByName: existing?.uploadedByName ?? uploadedByName,
      };

      if (existing) {
        await FacultyDocument.updateOne({ _id: existing._id }, { $set: fields });
      } else {
        await FacultyDocument.create(fields);
      }

      if (previousPublicId && !previousPublicId.startsWith("local:")) {
        await cloudinary.uploader
          .destroy(previousPublicId, { resource_type: "raw" })
          .catch(() => {});
      }

      imported += 1;
      console.log(`OK    ${fileName} → ${url}`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL  ${fileName} — ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\nImported: ${imported}, failed: ${failed}`);
  const counts = await FacultyDocument.aggregate([
    { $group: { _id: "$year", count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);
  console.log("Year totals:", counts.map((c) => `${c._id}: ${c.count}`).join(", "));

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
