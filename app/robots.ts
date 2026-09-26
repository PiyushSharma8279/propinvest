import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

/** Served at /robots.txt. Private areas are kept out of search results. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/login", "/account"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
