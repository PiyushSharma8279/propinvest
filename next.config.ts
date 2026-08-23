import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,

  images: {
    // Local placeholder illustrations live under /public/images/properties.
    // Add your real photo host(s) here when you switch to real listing photos,
    // e.g. an AWS S3 bucket or CDN:
    // remotePatterns: [
    //   { protocol: "https", hostname: "your-bucket.s3.ap-south-1.amazonaws.com" },
    // ],
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
