import { absoluteUrl } from "./format";

export const SHARE_IMAGE = { width: 1200, height: 630 } as const;

/**
 * URL for a link-preview image (WhatsApp, Facebook, LinkedIn, X). ImageKit photos are
 * cropped to 1200×630 and served as JPEG, because some apps skip WebP or very large images.
 * Other URLs are returned as absolute URLs unchanged.
 */
export function shareImageUrl(src: string, siteUrl: string): string {
  const url = absoluteUrl(src, siteUrl);
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT ?? process.env.IMAGE_KIT_URL_ENDPOINT ?? "";
  const isImageKit = url.includes("ik.imagekit.io") || (endpoint !== "" && url.startsWith(endpoint));
  if (!isImageKit) return url;
  const transform = `tr=w-${SHARE_IMAGE.width},h-${SHARE_IMAGE.height},fo-auto,f-jpg,q-80`;
  return `${url}${url.includes("?") ? "&" : "?"}${transform}`;
}
