import type { NextConfig } from "next";

/** Allows next/image to load from ImageKit, including a custom URL endpoint domain. */
function imagekitPatterns() {
  const patterns: { protocol: "https"; hostname: string }[] = [
    { protocol: "https", hostname: "ik.imagekit.io" },
  ];
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT ?? process.env.IMAGE_KIT_URL_ENDPOINT;
  if (endpoint) {
    try {
      const { hostname } = new URL(endpoint);
      if (hostname !== "ik.imagekit.io") patterns.push({ protocol: "https", hostname });
    } catch {
      // Ignore a malformed endpoint; uploads will surface the error.
    }
  }
  return patterns;
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,

  images: {
    // Images uploaded from the admin panel are stored on ImageKit.
    remotePatterns: imagekitPatterns(),
    formats: ["image/webp"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
