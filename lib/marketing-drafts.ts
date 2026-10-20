import { richTextToPlain } from "@/lib/rich-text";
import type { Property } from "@/lib/types";
import { formatAreaRange, formatPossession, formatPriceRange, joinAddress } from "@/lib/utils/format";

/**
 * Marketing drafts built only from fields stored on a listing — nothing is invented, and gaps
 * are listed instead of filled. The admin edits and posts each draft by hand.
 */

export interface MarketingDraft {
  id: string;
  label: string;
  channel: string;
  text: string;
}

export interface MarketingPack {
  /** Verified by the team (verification status "verified"). Drafts are only offered when true. */
  verified: boolean;
  missing: string[];
  drafts: MarketingDraft[];
}

/** Listing link tagged so enquiries from each channel are attributed in the admin panel. */
export function trackedLink(siteUrl: string, slug: string, source: string, medium: string): string {
  return `${siteUrl}/projects/${slug}?utm_source=${source}&utm_medium=${medium}&utm_campaign=listing-${slug.slice(0, 40)}`;
}

export function buildMarketingPack(p: Property, siteUrl: string): MarketingPack {
  const missing: string[] = [];
  if (!p.priceMin) missing.push("Price (drafts say “price on request”)");
  if (!p.areaMin) missing.push("Area / size");
  if (!p.locality) missing.push("Locality / sector");
  if (p.images.length < 3) missing.push(`More photos (has ${p.images.length})`);
  if (p.status !== "Ready to Move" && !p.possessionDate) missing.push("Possession date");
  if (p.reraRegistered && !p.reraNumber) missing.push("RERA number");
  if (!p.reraRegistered && p.category !== "Plot" && p.status !== "Ready to Move") missing.push("RERA status (is the project registered?)");
  if (p.amenities.length === 0) missing.push("Amenities");
  if (!p.availabilityConfirmedAt) missing.push("Availability confirmation date");

  const place = joinAddress(p.locality, p.city);
  const price = p.priceMin ? formatPriceRange(p.priceMin, p.priceMax) : "Price on request";
  const area = p.areaMin ? formatAreaRange(p.areaMin, p.areaMax, p.areaUnit).replace(/\.$/, "") : "";
  const configs = p.configurations.length ? p.configurations.join(" / ") : p.propertyType;
  const possession = formatPossession(p.possessionDate, p.status);
  const rera = p.reraNumber ? `RERA: ${p.reraNumber}` : "";
  const highlights = [...p.usps, ...p.amenities].slice(0, 4);
  const desc = richTextToPlain(p.description).replace(/\s+/g, " ").trim();
  const shortDesc = desc.length > 220 ? `${desc.slice(0, 217).replace(/\s\S*$/, "")}…` : desc;
  const by = p.builder ? ` by ${p.builder}` : "";
  const disclaimer = "Prices and availability as per the latest information from the builder / owner and subject to change. Please verify before booking.";
  const link = (source: string, medium: string) => trackedLink(siteUrl, p.slug, source, medium);

  const drafts: MarketingDraft[] = [
    {
      id: "whatsapp-status",
      label: "WhatsApp Status",
      channel: "WhatsApp",
      text: [`🏠 ${configs} in ${place}`, `💰 ${price}${area ? ` · 📐 ${area}` : ""}`, `🗓 ${possession}`, rera, `Details: ${link("whatsapp", "status")}`]
        .filter(Boolean)
        .join("\n"),
    },
    {
      id: "instagram",
      label: "Instagram caption",
      channel: "Instagram",
      text: [
        `${p.title}${by} — ${configs} in ${place}.`,
        "",
        `• ${price}`,
        area && `• ${area}`,
        `• Possession: ${possession}`,
        ...highlights.map((h) => `• ${h}`),
        rera && `• ${rera}`,
        "",
        "DM us or tap the link in bio for the brochure and a site visit.",
        disclaimer,
        "",
        `#${p.city.replace(/\s+/g, "")}RealEstate #${(p.locality || p.city).replace(/[^A-Za-z0-9]/g, "")} #${p.propertyType.replace(/\s+/g, "")}`,
      ]
        // Keep blank separator lines (""), drop skipped optional lines (false / "" from &&).
        .filter((l, i, all) => typeof l === "string" && (l !== "" || (i > 0 && all[i - 1] !== "")))
        .join("\n"),
    },
    {
      id: "description",
      label: "Property description",
      channel: "Listings / portals",
      text: [
        `${p.title}${by} offers ${configs.toLowerCase()} in ${place}${area ? `, ${area}` : ""}.`,
        `Price: ${price}. Possession: ${possession}.${p.paymentPlan ? ` Payment plan: ${p.paymentPlan}.` : ""}`,
        highlights.length ? `Highlights: ${highlights.join(", ")}.` : "",
        shortDesc,
        rera,
        disclaimer,
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
    {
      id: "community",
      label: "Local community post",
      channel: "RWA / Facebook / Google Business",
      text: [
        `For anyone looking in ${place}: ${configs} at ${p.title}${by}.`,
        `${price}${area ? `, ${area}` : ""}, possession ${possession.toLowerCase()}.`,
        "Happy to answer questions or arrange a visit — no pressure.",
        link("community", "post"),
      ].join("\n"),
    },
    {
      id: "video",
      label: "Short video script (30–45 s)",
      channel: "Reels / Shorts",
      text: [
        `[0–5 s] On screen: "${configs} in ${place}". Voice: "Looking for a ${p.propertyType.toLowerCase()} in ${place}? Here's ${p.title}."`,
        `[5–20 s] Walkthrough / exterior shots. Voice: "${area ? `${area}, ` : ""}${price}, possession ${possession.toLowerCase()}."`,
        highlights.length ? `[20–35 s] Show: ${highlights.join(", ")}.` : "[20–35 s] Show the best rooms / site surroundings.",
        `[35–45 s] Voice: "Message us for the brochure or a site visit." On screen: phone number${rera ? ` and ${rera}` : ""}.`,
        "Film only real footage of this property; don't use renders unless labelled “artist's impression”.",
      ].join("\n"),
    },
    {
      id: "faq",
      label: "Buyer FAQ",
      channel: "Website / WhatsApp",
      text: [
        `Q: What is the price of ${p.title}?\nA: ${price}${p.priceMin ? " as per the current price list" : ""}. ${disclaimer}`,
        `Q: Where is it?\nA: ${joinAddress(p.address, p.locality, p.city, p.state)}.`,
        `Q: When is possession?\nA: ${possession}.`,
        p.reraNumber ? `Q: Is it RERA registered?\nA: Registration number ${p.reraNumber} — you can check it on the state RERA website.` : "",
        p.paymentPlan ? `Q: Is there a payment plan?\nA: ${p.paymentPlan}.` : "",
        "Q: Can I visit the site?\nA: Yes — share a convenient date and we'll arrange it.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
    {
      id: "seo",
      label: "Search title & description",
      channel: "SEO",
      text: [
        `Title (≤ 60): ${`${p.title}, ${place} – ${configs}`.slice(0, 60)}`,
        `Description (≤ 155): ${`${configs} in ${p.title}, ${place}. ${price}. Possession ${possession}.${p.reraNumber ? " RERA registered." : ""} Enquire for brochure & site visit.`.slice(0, 155)}`,
      ].join("\n"),
    },
    {
      id: "buyer-followup",
      label: "Follow-up for an interested buyer",
      channel: "WhatsApp",
      text: `Hi [name], following up on ${p.title} in ${place}. It's ${price}${area ? ` for ${area}` : ""}, possession ${possession.toLowerCase()}. Would you like the brochure or a site visit this week? Details: ${link("whatsapp", "followup")}`,
    },
    {
      id: "referral",
      label: "Referral request",
      channel: "WhatsApp / personal network",
      text: `Hi [name], I'm helping buyers with ${configs.toLowerCase()} at ${p.title}, ${place} (${price}). If anyone you know is looking in this area, I'd be grateful if you shared this: ${link("referral", "whatsapp")}. Thank you!`,
    },
  ];

  return { verified: p.verificationStatus === "verified", missing, drafts };
}
