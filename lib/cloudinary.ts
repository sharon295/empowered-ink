import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

function cloudinaryConfigured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  return Boolean(
    CLOUDINARY_CLOUD_NAME &&
      CLOUDINARY_API_KEY &&
      CLOUDINARY_API_SECRET &&
      !CLOUDINARY_CLOUD_NAME.includes("...")
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(fileBuffer: Buffer): Promise<string> {
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "empowered-ink/covers", resource_type: "image" },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
  return result.secure_url;
}

// Falls back to disk storage when Cloudinary isn't configured, mirroring the
// low-traffic Render-disk option called out in the deployment plan. Covers
// live under public/uploads so they're served statically without a route.
async function uploadToLocalDisk(fileBuffer: Buffer, extension: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const filename = `${randomUUID()}${extension}`;
  await writeFile(path.join(uploadsDir, filename), fileBuffer);
  return `/uploads/${filename}`;
}

export async function uploadCoverImage(fileBuffer: Buffer, mimeType: string): Promise<string> {
  if (cloudinaryConfigured()) return uploadToCloudinary(fileBuffer);
  const extension = mimeType === "image/png" ? ".png" : ".jpg";
  return uploadToLocalDisk(fileBuffer, extension);
}
