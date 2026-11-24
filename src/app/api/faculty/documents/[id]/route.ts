import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import FacultyDocument from "@/models/FacultyDocument";
import { getCurrentFaculty } from "@/lib/auth";
import { deleteDocument } from "@/lib/cloudinary";

// Faculty can delete only the documents they uploaded.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentFaculty();
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ message: "Document not found" }, { status: 404 });

  await connectDB();
  const doc = await FacultyDocument.findById(id);
  if (!doc) return NextResponse.json({ message: "Document not found" }, { status: 404 });
  if (doc.uploadedBy.toString() !== session.id) {
    return NextResponse.json({ message: "You can only delete your own uploads." }, { status: 403 });
  }

  await doc.deleteOne();
  deleteDocument(doc.publicId, doc.resourceType).catch(() => {});

  return NextResponse.json({ ok: true });
}
