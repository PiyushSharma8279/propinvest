export const siteConfig = {
  name: "PropInvest",
  tagline: "Real estate, verified.",
  description:
    "Find RERA-verified residential and commercial projects across India. Compare prices, book site visits, and talk directly to project teams on PropInvest.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://propinvest.co.in",
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
    // Per-project call/WhatsApp numbers live in data/properties.json.
    whatsapp: process.env.NEXT_PUBLIC_DEFAULT_WHATSAPP ?? "919999999999",
    phone: process.env.NEXT_PUBLIC_DEFAULT_PHONE ?? "+919999999999",
    email: "hello@propinvest.co.in",
  },
  social: {
    instagram: "https://instagram.com/propinvest",
    facebook: "https://facebook.com/propinvest",
    linkedin: "https://linkedin.com/company/propinvest",
  },
} as const;

export type SiteConfig = typeof siteConfig;
