import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { deleteDocument, uploadDocument } from "./cloudinary";
import { deleteDriveFile, isDriveConfigured, uploadAbstractToDrive, type StoredAbstract } from "./drive";

// Storage order for student uploads: Google Drive when a real service-account key
// is configured, then the local public folder (self-hosted / dev), and Cloudinary
// as a last resort.
export async function storeAbstract(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folder: string,
  parentFolderId?: string | null
): Promise<StoredAbstract> {
  if (isDriveConfigured()) {
    try {
      return await uploadAbstractToDrive(buffer, fileName, mimeType, parentFolderId);
    } catch (err) {
      console.error("Google Drive upload failed; falling back to local storage.", err);
    }
  }

  const safeName =
    fileName
      .replace(/[^\w.\- ]+/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(-100) || "abstract.pdf";
  const storedName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;

  try {
    const dir = path.join(process.cwd(), "public", "abstracts", folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, storedName), buffer);
    const url = `/abstracts/${folder}/${encodeURIComponent(storedName)}`;
    return { url, publicId: `local:${url}`, resourceType: "raw" };
  } catch (err) {
    console.error("Local storage is not writable; using Cloudinary.", err);
    const uploaded = await uploadDocument(buffer, fileName, mimeType, folder);
    return { url: uploaded.url, publicId: uploaded.publicId, resourceType: uploaded.resourceType };
  }
}

export async function deleteAbstract(publicId: string, resourceType: "image" | "raw") {
  if (publicId.startsWith("drive:")) {
    await deleteDriveFile(publicId.slice("drive:".length));
    return;
  }
  if (publicId.startsWith("local:")) {
    const rel = decodeURIComponent(publicId.slice("local:".length));
    await unlink(path.join(process.cwd(), "public", rel)).catch(() => {});
    return;
  }
  await deleteDocument(publicId, resourceType);
}
