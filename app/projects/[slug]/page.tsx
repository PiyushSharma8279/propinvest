import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, Ruler, Building2, CalendarClock, BadgeCheck } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import RERABadge from "@/components/RERABadge";
import CallButton from "@/components/CallButton";
import WhatsAppButton from "@/components/WhatsAppButton";
import PropertyCard from "@/components/PropertyCard";
import JsonLd from "@/components/JsonLd";
import { getAllSlugs, getPropertyBySlug, getRelatedProperties } from "@/lib/properties";
import { siteConfig } from "@/lib/site-config";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = getPropertyBySlug(slug);

  if (!property) {
    return { title: "Project not found" };
  }

  const title = `${property.title}, ${property.locality} ${property.city} - Price, RERA, Possession`;
  const description = `${property.configurations.join(", ")} apartments in ${property.title}, ${property.locality}, ${property.city}. Price ${property.priceDisplay}, possession ${property.possessionDisplay}. ${property.reraRegistered ? `RERA registered: ${property.reraNumber}.` : ""}`;

  return {
    title,
    description,
    alternates: { canonical: `/projects/${property.slug}` },
    openGraph: {
      title,
      description,
      images: [{ url: property.images[0] }],
      type: "website",
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  const related = getRelatedProperties(property, 3);

  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
    url: `${siteConfig.url}/projects/${property.slug}`,
    image: property.images.map((img) => `${siteConfig.url}${img}`),
    address: {
      "@type": "PostalAddress",
      addressLocality: property.locality,
      addressRegion: property.state,
      addressCountry: "IN",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: property.priceMin,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 sm:px-6 sm:pb-8">
      <JsonLd data={listingJsonLd} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: `Projects in ${property.city}`, href: `/projects?city=${encodeURIComponent(property.city)}` },
          { label: property.title, href: `/projects/${property.slug}` },
        ]}
      />

      {/* Gallery */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="relative h-72 overflow-hidden rounded-lg sm:h-96">
          <Image
            src={property.images[0]}
            alt={`${property.title} exterior, ${property.locality}, ${property.city}`}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="relative h-72 overflow-hidden rounded-lg sm:h-96">
          <Image
            src={property.images[1] ?? property.images[0]}
            alt={`${property.title} amenities, ${property.locality}, ${property.city}`}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-8 sm:flex-row">
        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-semibold text-ink-900">
                {property.title}
              </h1>
              <p className="mt-1 flex items-center gap-1 text-slate-600">
                <MapPin className="h-4 w-4" />
                {property.locality}, {property.city}, {property.state}
              </p>
              <p className="mt-1 text-sm text-slate-600">by {property.builder}</p>
            </div>
            {property.reraRegistered && <RERABadge reraNumber={property.reraNumber} size="md" />}
          </div>

          {/* Key facts */}
          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-border bg-white p-4 sm:grid-cols-4">
            <div>
              <dt className="flex items-center gap-1 text-xs text-slate-600">
                <Building2 className="h-3.5 w-3.5" /> Configuration
              </dt>
              <dd className="mt-1 font-semibold text-ink-900">
                {property.configurations.join(", ")}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs text-slate-600">
                <Ruler className="h-3.5 w-3.5" /> Area
              </dt>
              <dd className="mt-1 font-semibold text-ink-900">
                {property.areaMin} - {property.areaMax} {property.areaUnit}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs text-slate-600">
                <CalendarClock className="h-3.5 w-3.5" /> Possession
              </dt>
              <dd className="mt-1 font-semibold text-ink-900">{property.possessionDisplay}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs text-slate-600">
                <BadgeCheck className="h-3.5 w-3.5" /> RERA No.
              </dt>
              <dd className="mt-1 font-semibold text-ink-900">{property.reraNumber}</dd>
            </div>
          </dl>

          <p className="mt-2 tabular-nums font-display text-2xl font-semibold text-teal-900">
            {property.priceDisplay}
          </p>

          {/* Description */}
          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold text-ink-900">
              About {property.title}
            </h2>
            <p className="mt-2 text-slate-600">{property.description}</p>
          </section>

          {/* USPs */}
          {property.usps.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold text-ink-900">
                Highlights
              </h2>
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

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold text-ink-900">
                Amenities
              </h2>
              <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {property.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="rounded-md border border-border bg-white px-3 py-2 text-sm text-ink-900"
                  >
                    {amenity}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sticky contact card */}
        <aside className="w-full shrink-0 sm:w-72">
          <div className="sticky top-24 rounded-lg border border-border bg-white p-5">
            <p className="text-sm text-slate-600">Interested in this project?</p>
            <p className="mt-1 font-display text-lg font-semibold text-ink-900">
              Contact the project team
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <CallButton phone={property.phone} projectTitle={property.title} fullWidth />
              <WhatsAppButton
                whatsapp={property.whatsapp}
                projectTitle={property.title}
                locality={property.locality}
                city={property.city}
                fullWidth
              />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-600">
              By contacting, you agree to be reached by the project team regarding{" "}
              {property.title}. {siteConfig.name} is a listing platform and is not a party
              to any transaction.
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile sticky CTA bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-border bg-white p-3 sm:hidden">
        <CallButton phone={property.phone} projectTitle={property.title} fullWidth />
        <WhatsAppButton
          whatsapp={property.whatsapp}
          projectTitle={property.title}
          locality={property.locality}
          city={property.city}
          fullWidth
        />
      </div>

      {/* Related projects */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold text-ink-900">
            More projects in {property.city}
          </h2>
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
