import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImage(dataUrl: string, folder: string) {
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: `sit-ieee-pandc/${folder}`,
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;

export type UploadedDocument = {
  url: string;
  publicId: string;
  resourceType: "image" | "raw";
};

// Documents (PDF, Word, Excel, …) go up as "raw" so Cloudinary serves the original
// file untouched — free accounts block PDF delivery when uploaded as images.
export function uploadDocument(buffer: Buffer, fileName: string, mimeType: string, folder = "faculty-documents") {
  const resourceType: "image" | "raw" = mimeType.startsWith("image/") ? "image" : "raw";
  return new Promise<UploadedDocument>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `sit-ieee-pandc/${folder}`,
        resource_type: resourceType,
        filename_override: fileName,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id, resourceType });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteDocument(publicId: string, resourceType: "image" | "raw") {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
