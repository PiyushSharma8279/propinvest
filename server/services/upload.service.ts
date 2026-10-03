import "server-only";
import ImageKit from "@imagekit/nodejs";
import { env } from "../env";
import { badRequest } from "../http";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Vercel caps request bodies at 4.5 MB
export const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  // No SVG: SVG files can carry scripts.
  "application/pdf",
];

let client: ImageKit | undefined;
function imagekit(): ImageKit {
  client ??= new ImageKit({ privateKey: env.imagekitPrivateKey() });
  return client;
}

export interface UploadedFile {
  url: string;
  fileId: string;
  name: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

export function validateUpload(file: unknown): File {
  if (!(file instanceof File) || file.size === 0) throw badRequest("No file received.");
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
    throw badRequest("Only JPG, PNG, WebP or AVIF images, or PDF files, are allowed.");
  }
  if (file.size > MAX_UPLOAD_BYTES) throw badRequest("File is larger than 4 MB.");
  return file;
}

/** Uploads to ImageKit under /investsproperty/<folder> and returns the public URL. */
export async function uploadFile(file: File, folder = "properties"): Promise<UploadedFile> {
  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "") || "misc";
  const result = await imagekit().files.upload({
    file,
    fileName: file.name || "upload",
    folder: `/investsproperty/${safeFolder}`,
    useUniqueFileName: true,
  });
  if (!result.url || !result.fileId) throw new Error("ImageKit did not return a URL.");
  return {
    url: result.url,
    fileId: result.fileId,
    name: result.name ?? file.name,
    thumbnailUrl: result.thumbnailUrl,
    width: result.width,
    height: result.height,
  };
}
