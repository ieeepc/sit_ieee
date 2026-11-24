import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FacultyDocument from "@/models/FacultyDocument";
import { getCurrentFaculty } from "@/lib/auth";
import { uploadDocument } from "@/lib/cloudinary";

const MAX_BYTES = 10 * 1024 * 1024; // Cloudinary free-plan limit for raw files

const ALLOWED_EXTENSIONS = [
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "png", "jpg", "jpeg", "webp", "zip",
];

type FacultyDocumentRecord = {
  _id: { toString(): string };
  title: string;
  year: number;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: { toString(): string };
  uploadedByName: string;
  createdAt: Date;
};

function serialize(doc: FacultyDocumentRecord) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    year: doc.year,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    size: doc.size,
    url: doc.url,
    uploadedBy: doc.uploadedBy.toString(),
    uploadedByName: doc.uploadedByName,
    createdAt: doc.createdAt,
  };
}

// Every faculty account sees all faculty documents, newest year first.
export async function GET() {
  const session = await getCurrentFaculty();
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  await connectDB();
  const docs = await FacultyDocument.find().sort({ year: -1, createdAt: -1 });
  return NextResponse.json({ documents: docs.map(serialize) });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentFaculty();
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    const title = String(form.get("title") ?? "").trim();
    const year = Number(form.get("year"));
    const maxYear = new Date().getFullYear() + 1;

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ message: "Choose a file to upload." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ message: "File must be under 10MB." }, { status: 400 });
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { message: `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }
    if (!Number.isInteger(year) || year < 2000 || year > maxYear) {
      return NextResponse.json({ message: `Pick a year between 2000 and ${maxYear}.` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadDocument(buffer, file.name, file.type);

    await connectDB();
    const doc = await FacultyDocument.create({
      title: (title || file.name.replace(/\.[^.]+$/, "")).slice(0, 150),
      year,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      url: uploaded.url,
      publicId: uploaded.publicId,
      resourceType: uploaded.resourceType,
      uploadedBy: session.id,
      uploadedByName: session.username,
    });

    return NextResponse.json({ document: serialize(doc) }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Upload failed. Try again." }, { status: 500 });
  }
}
