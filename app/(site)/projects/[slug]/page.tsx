import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  Compass,
  FileCheck2,
  Home,
  KeyRound,
  LandPlot,
  Maximize2,
  Hammer,
  Bath,
  Calculator,
  CookingPot,
  MapPin,
  Ruler,
  Sofa,
  Sparkles,
  Tag,
  UserRound,
  Wallet,
} from "lucide-react";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/layout/JsonLd";
import { ContactCard, MobileContactBar } from "@/components/property/ContactCard";
import PropertyCard, { statusStyles } from "@/components/property/PropertyCard";
import { LaunchOfferPanel, offerSummary } from "@/components/property/LaunchOffer";
import PropertyGallery from "@/components/property/PropertyGallery";
import PropertyLocation from "@/components/property/PropertyLocation";
import RERABadge from "@/components/property/RERABadge";
import ShareButton from "@/components/property/ShareButton";
import { buttonClass } from "@/components/ui/Button";
import { configurationField, sqmPerUnit } from "@/lib/constants/property";
import { richTextToHtml, richTextToPlain } from "@/lib/rich-text";
import { siteConfig } from "@/lib/site-config";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import {
  absoluteUrl,
  formatAreaRange,
  formatPossession,
  formatPriceRange,
  joinAddress,
  formatRupees,
  ratePerUnit,
} from "@/lib/utils/format";
import { getPublicPropertyBySlug, getPublicSlugs, getRelatedProperties } from "@/server/services/property.service";

/**
 * Pre-rendered HTML, so a click opens the page instantly. Every live listing is built ahead of
 * time; a listing added later is built on its first visit and then served from cache. Admin
 * edits rebuild the page right away (server/services/revalidate.service.ts).
 */
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPublicSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

function fullAddress(p: Property) {
  return joinAddress(p.address, p.locality, p.city, p.state, p.pincode, p.country);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPublicPropertyBySlug(slug);
  if (!property) return { title: "Property not found", robots: { index: false } };

  const place = joinAddress(property.locality, property.city);
  const price = formatPriceRange(property.priceMin, property.priceMax);
  const title = `${property.title}, ${place} - Price, Location & Details`;
  const configs = property.configurations.length ? `${property.configurations.join(", ")} ` : "";
  const description = [
    `${configs}${property.propertyType} in ${property.title}, ${place}.`,
    `Price ${price}.`,
    offerSummary(property) ? `${offerSummary(property)}.` : "",
    property.paymentPlan ? `Payment plan ${property.paymentPlan}.` : "",
    property.areaMin ? `Area ${formatAreaRange(property.areaMin, property.areaMax, property.areaUnit).replace(/\.$/, "")}.` : "",
    `Possession ${formatPossession(property.possessionDate, property.status)}.`,
    property.reraRegistered ? `RERA registered${property.reraNumber ? `: ${property.reraNumber}` : ""}.` : "",
    property.usps[0] ?? "",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 300);
  const url = `${siteConfig.url}/projects/${property.slug}`;
  // Short title for link previews: "Skyline Arte · ₹3.47 Cr - 7.77 Cr · Sector 150, Noida"
  const shareTitle = `${property.title} · ${price} · ${place}`;
  // The preview image (property photo + price card) comes from ./opengraph-image.tsx.

  return {
    title,
    description,
    keywords: [property.title, property.propertyType, property.city, property.locality, `${property.propertyType} in ${property.city}`].filter(Boolean),
    alternates: { canonical: `/projects/${property.slug}` },
    openGraph: {
      title: shareTitle,
      description,
      type: "website",
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
    },
    twitter: { card: "summary_large_image", title: shareTitle, description },
  };
}

/** White rounded section card used for every block in the main column. */
function Panel({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const property = await getPublicPropertyBySlug(slug);
  if (!property) notFound();

  const related = await getRelatedProperties(property, 4);
  const isPlot = property.category === "Plot";
  const isResidential = property.category === "Residential";
  const areaLabel = (value: number) => (value ? `${value.toLocaleString("en-IN")} ${property.areaUnit}` : "");
  // The top option in the admin form means "or more" (5+ toilets, 3+ kitchens).
  const roomLabel = (n: number, max: number) => (n ? (n >= max ? `${max}+` : String(n)) : "");
  const address = fullAddress(property);
  const status = statusStyles[property.status];
  const point =
    property.latitude != null && property.longitude != null
      ? { lat: property.latitude, lng: property.longitude }
      : null;

  const facts = [
    {
      icon: Building2,
      label: property.configurations.length
        ? configurationField[property.category].label.replace(" (BHK)", "")
        : "Property Type",
      value: property.configurations.length ? property.configurations.join(", ") : property.propertyType,
    },
    {
      icon: Ruler,
      label: isPlot ? "Plot Area" : "Area",
      value: formatAreaRange(property.areaMin, property.areaMax, property.areaUnit),
    },
    {
      icon: CalendarClock,
      label: "Possession",
      value: formatPossession(property.possessionDate, property.status),
    },
  ];

  const rate = ratePerUnit(property.priceMin, property.areaMin, property.areaUnit, property.areaUnit, sqmPerUnit);
  const plotRate = rate ? `₹${formatRupees(rate)}` : "";

  const highlights = [
    { icon: Home, label: "Type", value: property.propertyType },
    { icon: Tag, label: "Status", value: property.status },
    { icon: KeyRound, label: "Ownership", value: property.ownership },
    { icon: Compass, label: "Facing", value: isResidential ? "" : property.facing },
    { icon: Ruler, label: "Built-up Area", value: isResidential ? areaLabel(property.builtUpArea) : "" },
    { icon: Ruler, label: "Carpet Area", value: isResidential ? areaLabel(property.carpetArea) : "" },
    { icon: Bath, label: "Toilets", value: isResidential ? roomLabel(property.bathrooms, 5) : "" },
    { icon: CookingPot, label: "Kitchens", value: isResidential ? roomLabel(property.kitchens, 3) : "" },
    { icon: Sofa, label: "Furnishing", value: isPlot ? "" : property.furnishing },
    { icon: FileCheck2, label: "Approved By", value: isPlot ? property.approvalAuthority : "" },
    { icon: LandPlot, label: "Corner Plot", value: isPlot && property.cornerPlot ? "Yes" : "" },
    { icon: Maximize2, label: "Open Sides", value: isPlot && property.openSides ? String(property.openSides) : "" },
    {
      icon: Hammer,
      label: "Construction",
      value: isPlot && property.hasConstruction !== null ? (property.hasConstruction ? "Yes" : "No") : "",
    },
    { icon: Calculator, label: `Rate per ${property.areaUnit}`, value: isPlot || isResidential ? plotRate : "" },
    { icon: UserRound, label: "Builder", value: property.builder },
    { icon: BadgeCheck, label: "RERA No.", value: property.reraNumber },
  ].filter((d) => d.value);

  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: richTextToPlain(property.description),
    url: `${siteConfig.url}/projects/${property.slug}`,
    image: property.images.map((img) => absoluteUrl(img, siteConfig.url)),
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address || undefined,
      addressLocality: property.city,
      addressRegion: property.state,
      postalCode: property.pincode || undefined,
      addressCountry: property.country,
    },
    ...(point && {
      geo: { "@type": "GeoCoordinates", latitude: point.lat, longitude: point.lng },
    }),
    ...(property.priceMin > 0 && {
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: property.priceMin,
        availability: "https://schema.org/InStock",
      },
    }),
  };

  const cityHref = `/projects?city=${encodeURIComponent(property.city)}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:pb-10">
      <JsonLd data={listingJsonLd} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={cityHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Search
        </Link>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: `Properties in ${property.city}`, href: cityHref },
            { label: property.title, href: `/projects/${property.slug}` },
          ]}
        />
      </div>

      {/* Title row */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">{property.title}</h1>
            <span className="rounded-full bg-info-soft px-2.5 py-0.5 text-xs font-semibold text-info">
              {property.category}
            </span>
          </div>
          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-info" />
            {address}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {property.reraRegistered && <RERABadge reraNumber={property.reraNumber} />}
          <ShareButton title={property.title} />
          {point && (
            <a href="#location" className={buttonClass("outline", "sm")}>
              <MapPin className="h-4 w-4" /> Map
            </a>
          )}
        </div>
      </div>

      <div className="mt-5">
        <PropertyGallery images={property.images} alt={`${property.title}, ${property.city}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* Price + key facts */}
          <div className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
              <span className={cn("h-2 w-2 rounded-full", status.dot)} aria-hidden="true" />
              {property.status}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-3xl font-bold tabular-nums text-ink">
                {formatPriceRange(property.priceMin, property.priceMax)}
              </p>
            </div>
            {property.builder && <p className="mt-1 text-sm text-muted">by {property.builder}</p>}
            <LaunchOfferPanel property={property} />
            {property.paymentPlan && (
              <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                  <Wallet className="h-4 w-4 text-info" aria-hidden="true" /> Payment plan
                </span>
                <span className="rounded-full bg-info-soft px-3 py-1 font-semibold text-info">{property.paymentPlan}</span>
              </p>
            )}

            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-4">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-muted text-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="text-sm font-semibold text-ink">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <Panel title="Overview">
            {/* Sanitized server-side (lib/rich-text.ts): only the editor's formatting tags and safe links remain. */}
            <div className="rich-text" dangerouslySetInnerHTML={{ __html: richTextToHtml(property.description) }} />
          </Panel>

          {highlights.length > 0 && (
            <Panel title="Highlights">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {highlights.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-xs text-muted">{label}</dt>
                      <dd className="truncate text-sm font-semibold text-ink" title={value}>
                        {value}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </Panel>
          )}

          {property.usps.length > 0 && (
            <Panel title="Why this project">
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {property.usps.map((usp) => (
                  <li key={usp} className="flex items-start gap-2 text-sm text-ink">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {usp}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {property.amenities.length > 0 && (
            <Panel title="Amenities">
              <ul className="flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-canvas px-3 py-1.5 text-sm text-ink"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-highlight" aria-hidden="true" />
                    {amenity}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {point && (
            <Panel title="Location Information" id="location">
              <PropertyLocation point={point} address={address} />
            </Panel>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <ContactCard property={property} />
          </div>
        </aside>
      </div>

      <MobileContactBar property={property} />

      {related.length > 0 && (
        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-xl font-bold text-ink sm:text-2xl">More in {property.city}</h2>
            <Link href={cityHref} className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
