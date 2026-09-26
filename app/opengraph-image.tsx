import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori (next/og) cannot read CSS variables; these hex values mirror --pi-surface, --pi-primary-soft, --pi-ink and --pi-primary in app/globals.css.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #ffffff 0%, #e8f5ef 100%)",
          color: "#111827",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#10845c",
              display: "flex",
            }}
          />
          <span style={{ fontSize: 40, fontWeight: 700 }}>{siteConfig.name}</span>
        </div>
        <span style={{ fontSize: 56, fontWeight: 700, maxWidth: 900 }}>
          Real estate, verified.
        </span>
        <span style={{ fontSize: 26, marginTop: 20, opacity: 0.85, maxWidth: 800 }}>
          RERA-verified projects across India, with direct call & WhatsApp access
          to project teams.
        </span>
      </div>
    ),
    { ...size }
  );
}
