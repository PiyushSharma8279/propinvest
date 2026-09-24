import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Building2, CalendarClock, CheckCircle2, MapPin, Ruler } from "lucide-react";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/layout/JsonLd";
import { ContactCard, MobileContactBar } from "@/components/property/ContactCard";
import PropertyCard from "@/components/property/PropertyCard";
import PropertyGallery from "@/components/property/PropertyGallery";
import PropertyLocation from "@/components/property/PropertyLocation";
import RERABadge from "@/components/property/RERABadge";
import { configurationField } from "@/lib/constants/property";
import { siteConfig } from "@/lib/site-config";
import type { Property } from "@/lib/types";
import {
  absoluteUrl,
  formatAreaRange,
  formatPossession,
  formatPriceRange,
  joinAddress,
} from "@/lib/utils/format";
import { getPublicPropertyBySlug, getRelatedProperties } from "@/server/services/property.service";

/** Server-side rendered on every request, so edits in the admin panel show immediately. */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function fullAddress(p: Property) {
  return joinAddress(p.address, p.locality, p.city, p.state, p.pincode, p.country);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPublicPropertyBySlug(slug);
  if (!property) return { title: "Property not found", robots: { index: false } };

  const place = joinAddress(property.locality, property.city);
  const title = `${property.title}, ${place} - Price, Location & Details`;
  const configs = property.configurations.length ? `${property.configurations.join(", ")} ` : "";
  const description = [
    `${configs}${property.propertyType} in ${property.title}, ${place}.`,
    `Price ${formatPriceRange(property.priceMin, property.priceMax)}.`,
    `Possession ${formatPossession(property.possessionDate, property.status)}.`,
    property.reraRegistered ? `RERA: ${property.reraNumber}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title,
    description,
    alternates: { canonical: `/projects/${property.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteConfig.url}/projects/${property.slug}`,
      images: property.images.slice(0, 1).map((url) => ({ url: absoluteUrl(url, siteConfig.url) })),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const property = await getPublicPropertyBySlug(slug);
  if (!property) notFound();

  const related = await getRelatedProperties(property, 3);
  const isPlot = property.category === "Plot";
  const address = fullAddress(property);
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
    { icon: BadgeCheck, label: "RERA No.", value: property.reraNumber || "—" },
  ];

  const details = [
    { label: "Property Type", value: property.propertyType },
    { label: "Status", value: property.status },
    { label: "Ownership", value: property.ownership },
    { label: "Facing", value: property.facing },
    { label: "Furnishing", value: isPlot ? "" : property.furnishing },
    { label: "Approved By", value: isPlot ? property.approvalAuthority : "" },
    { label: "Corner Plot", value: isPlot && property.cornerPlot ? "Yes" : "" },
    { label: "Builder", value: property.builder },
  ].filter((d) => d.value);

  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 sm:px-6 sm:pb-8">
      <JsonLd data={listingJsonLd} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          {
            label: `Properties in ${property.city}`,
            href: `/projects?city=${encodeURIComponent(property.city)}`,
          },
          { label: property.title, href: `/projects/${property.slug}` },
        ]}
      />

      <div className="mt-4">
        <PropertyGallery images={property.images} alt={`${property.title}, ${property.city}`} />
      </div>

      <div className="mt-6 flex flex-col gap-8 sm:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-semibold text-ink-900">{property.title}</h1>
              <p className="mt-1 flex items-start gap-1 text-slate-600">
                <MapPin className="mt-1 h-4 w-4 shrink-0" />
                {address}
              </p>
              {property.builder && <p className="mt-1 text-sm text-slate-600">by {property.builder}</p>}
            </div>
            {property.reraRegistered && <RERABadge reraNumber={property.reraNumber} size="md" />}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-border bg-white p-4 sm:grid-cols-4">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <dt className="flex items-center gap-1 text-xs text-slate-600">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </dt>
                <dd className="mt-1 font-semibold text-ink-900">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-3 font-display text-2xl font-semibold tabular-nums text-teal-900">
            {formatPriceRange(property.priceMin, property.priceMax)}
          </p>

          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold text-ink-900">About {property.title}</h2>
            <p className="mt-2 whitespace-pre-line text-slate-600">{property.description}</p>
          </section>

          {details.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold text-ink-900">Property Details</h2>
              <dl className="mt-2 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                {details.map((detail) => (
                  <div key={detail.label} className="flex justify-between gap-4 border-b border-border py-2 text-sm">
                    <dt className="text-slate-600">{detail.label}</dt>
                    <dd className="text-right font-medium text-ink-900">{detail.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {property.usps.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold text-ink-900">Highlights</h2>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {property.usps.map((usp) => (
                  <li key={usp} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    {usp}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {property.amenities.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold text-ink-900">Amenities</h2>
              <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {property.amenities.map((amenity) => (
                  <li key={amenity} className="rounded-md border border-border bg-white px-3 py-2 text-sm text-ink-900">
                    {amenity}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {point && (
            <section className="mt-8" id="location">
              <h2 className="font-display text-xl font-semibold text-ink-900">Location</h2>
              <div className="mt-3">
                <PropertyLocation point={point} address={address} />
              </div>
            </section>
          )}
        </div>

        <aside className="w-full shrink-0 sm:w-72">
          <ContactCard property={property} />
        </aside>
      </div>

      <MobileContactBar property={property} />

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold text-ink-900">More in {property.city}</h2>
          <div className="mt-4 flex flex-col gap-5">
            {related.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
