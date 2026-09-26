export const siteConfig = {
  name: "InvestsProperty",
  byline: "by Maa Rudrani Properties",
  tagline: "Real estate, verified.",
  description:
    "Find RERA-verified residential and commercial projects across India. Compare prices, book site visits, and talk directly to project teams on InvestsProperty.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://investsproperty.com",
  ogImage: "/og-image.png",
  locale: "en_IN",
  keywords: [
    "real estate India",
    "new projects Noida",
    "residential projects",
    "RERA verified projects",
    "property investment India",
    "buy flats apartments",
  ],
  contact: {
    // Default WhatsApp business number for site-wide "talk to an advisor" CTAs.
    // Per-project call/WhatsApp numbers are set on each listing in the admin panel.
    whatsapp: process.env.NEXT_PUBLIC_DEFAULT_WHATSAPP ?? "919716390299",
    phone: process.env.NEXT_PUBLIC_DEFAULT_PHONE ?? "+919716390299",
    email: "monichauhan44299@gmail.com",
  },
  social: {
    instagram: "https://instagram.com/investsproperty",
    facebook: "https://facebook.com/investsproperty",
    linkedin: "https://linkedin.com/company/investsproperty",
  },
} as const;

export type SiteConfig = typeof siteConfig;
