import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { asJpeg } from "@/lib/og-jpeg";
import { siteConfig } from "@/lib/site-config";

/**
 * The link-preview image for the whole website (home, about, listings…). Property pages
 * override it with the property's own photo. Generated once at build time.
 */
export const alt = `${siteConfig.name} ${siteConfig.byline} - ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";

async function dataUri(file: string, mime: string) {
  const bytes = await readFile(join(process.cwd(), "app/assets", file));
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

// Satori (next/og) cannot read CSS variables; these hex values mirror --pi-surface, --pi-primary-soft,
// --pi-ink, --pi-muted and --pi-primary in app/globals.css.
export default async function OpengraphImage() {
  const [logo, photo] = await Promise.all([
    dataUri("logo-mark.png", "image/png"),
    dataUri("og-banner.jpg", "image/jpeg"),
  ]);

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #ffffff 0%, #e8f5ef 100%)",
          color: "#111827",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "64px", width: 680 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} width={132} height={80} alt="" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 44, fontWeight: 700 }}>{siteConfig.name}</span>
              <span style={{ fontSize: 22, color: "#6b7280" }}>{siteConfig.byline}</span>
            </div>
          </div>
          <span style={{ fontSize: 58, fontWeight: 700, marginTop: 48, lineHeight: 1.1 }}>
            {siteConfig.tagline}
          </span>
          <span style={{ fontSize: 26, marginTop: 20, color: "#6b7280", lineHeight: 1.35 }}>
            RERA-verified homes, commercial spaces and plots across India. Call or WhatsApp the
            project team directly.
          </span>
          <div
            style={{
              display: "flex",
              marginTop: 36,
              padding: "12px 22px",
              borderRadius: 999,
              background: "#10845c",
              color: "#ffffff",
              fontSize: 24,
              fontWeight: 700,
              alignSelf: "flex-start",
            }}
          >
            {siteConfig.url.replace(/^https?:\/\//, "")}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} width={520} height={630} alt="" style={{ objectFit: "cover" }} />
      </div>
    ),
    { ...size }
  );
  return asJpeg(image);
}
