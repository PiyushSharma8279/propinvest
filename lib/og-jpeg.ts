import "server-only";
import type { ImageResponse } from "next/og";
import sharp from "sharp";

/**
 * next/og only renders PNG, which is ~0.5-1 MB for a photo card. WhatsApp and some other apps
 * skip preview images that large, so link previews are re-encoded as JPEG (~60-120 KB).
 * If re-encoding fails for any reason the original PNG is sent instead, so a preview always shows.
 * Routes using this export `contentType = "image/jpeg"`.
 */
export async function asJpeg(image: ImageResponse): Promise<Response> {
  const png = Buffer.from(await image.arrayBuffer());
  try {
    const jpeg = await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg" } });
  } catch (error) {
    console.error("[og] JPEG conversion failed, sending PNG instead:", error);
    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
  }
}
