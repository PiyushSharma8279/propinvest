import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { asJpeg } from "@/lib/og-jpeg";
import { offerSummary } from "@/components/property/LaunchOffer";
import { siteConfig } from "@/lib/site-config";
import { formatAreaRange, formatPriceRange, joinAddress } from "@/lib/utils/format";
import { shareImageUrl } from "@/lib/utils/share-image";
import { getPublicPropertyBySlug } from "@/server/services/property.service";

/**
 * Link-preview card for a single property (WhatsApp, Facebook, LinkedIn, X): its photo,
 * name, price and location. Cached like the page and rebuilt when the listing changes.
 */
export const alt = "Property photo, price and location";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";
export const revalidate = 3600;

/**
 * Fetches the listing photo as JPEG (Satori can't draw WebP); null if it can't be loaded, so the
 * card still renders without it. "no-store" keeps Next's fetch cache from saving a half-downloaded
 * body after a timeout (that cached fragment then breaks every later render); the finished card
 * itself is still cached by the route's revalidate.
 */
async function photoDataUri(src: string | undefined): Promise<string | null> {
  if (!src) return null;
  try {
    const res = await fetch(shareImageUrl(src, siteConfig.url), {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
    const isPng = bytes.subarray(0, 4).toString("hex") === "89504e47";
    if (!isJpeg && !isPng) return null;
    return `data:image/${isPng ? "png" : "jpeg"};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

// Hex values mirror the tokens in app/globals.css (Satori can't read CSS variables).
export default async function PropertyOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await getPublicPropertyBySlug(slug);
  const [photo, logoBytes] = await Promise.all([
    photoDataUri(property?.images[0]),
    readFile(join(process.cwd(), "app/assets/logo-mark.png")),
  ]);
  const logo = `data:image/png;base64,${logoBytes.toString("base64")}`;

  const title = property?.title ?? siteConfig.name;
  const price = property ? formatPriceRange(property.priceMin, property.priceMax) : "";
  const place = property ? joinAddress(property.locality, property.city) : siteConfig.tagline;
  const area = property?.areaMin ? formatAreaRange(property.areaMin, property.areaMax, property.areaUnit) : "";

  const image = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#ffffff", fontFamily: "sans-serif" }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} width={640} height={630} alt="" style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ width: 640, height: 630, display: "flex", background: "#e8f5ef" }} />
        )}
        <div
          style={{
            width: 560,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 48px 44px",
            color: "#111827",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} width={79} height={48} alt="" />
            <span style={{ fontSize: 28, fontWeight: 700 }}>{siteConfig.name}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {property && (
              <span
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: "#e8f5ef",
                  color: "#10845c",
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {property.status}
                {property.reraRegistered ? " · RERA registered" : ""}
              </span>
            )}
            <span style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.1, marginTop: 18 }}>
              {title.length > 60 ? `${title.slice(0, 57)}…` : title}
            </span>
            <span style={{ fontSize: 26, color: "#2563eb", marginTop: 14 }}>{place}</span>
            {area && <span style={{ fontSize: 24, color: "#6b7280", marginTop: 8 }}>{area}</span>}
          </div>

          {price && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {property && offerSummary(property) && (
                <span style={{ fontSize: 22, fontWeight: 700, color: "#b45309" }}>{offerSummary(property)}</span>
              )}
              <span style={{ fontSize: 46, fontWeight: 700, color: "#10845c" }}>{price}</span>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
  return asJpeg(image);
}
