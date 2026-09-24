import type { MetadataRoute } from "next";
import { categories } from "@/lib/constants/property";
import { siteConfig } from "@/lib/site-config";
import { getLocationOptions, getPublicSlugs } from "@/server/services/property.service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, { cities }] = await Promise.all([getPublicSlugs(), getLocationOptions()]);
  const now = new Date();
  const url = (path: string) => `${siteConfig.url}${path}`;

  return [
    { url: url("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: url("/projects"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: url("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    ...categories.map((category) => ({
      url: url(`/projects?category=${category}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...cities.map((city) => ({
      url: url(`/projects?city=${encodeURIComponent(city)}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...slugs.map(({ slug, updatedAt }) => ({
      url: url(`/projects/${slug}`),
      lastModified: updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
