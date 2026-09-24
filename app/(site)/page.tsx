import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPinned, ShieldCheck, Users } from "lucide-react";
import HeroSearch from "@/components/property/HeroSearch";
import PropertyCard from "@/components/property/PropertyCard";
import WhatsAppButton from "@/components/property/WhatsAppButton";
import { categories, categoryLabels } from "@/lib/constants/property";
import { siteConfig } from "@/lib/site-config";
import {
  getFeaturedProperties,
  getLocationOptions,
  getPublicStats,
} from "@/server/services/property.service";

/**
 * Statically generated (SSG). Rebuilt automatically whenever a listing is created, edited
 * or deleted in the admin panel (see server/services/revalidate.service.ts).
 */
export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} ${siteConfig.byline} - ${siteConfig.tagline}` },
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

const trustPoints = [
  {
    icon: ShieldCheck,
    stamp: true,
    title: "Every listing, verified",
    body: "We display the RERA registration number on every project card, so you can cross-check it on the state RERA portal before you commit.",
  },
  {
    icon: MapPinned,
    title: "Local, on-ground detail",
    body: "Exact location on the map, connectivity, possession timelines and pricing — organised the way you'd actually compare two properties.",
  },
  {
    icon: Users,
    title: "Talk to the project team directly",
    body: "No lead resellers in between — calling or messaging on WhatsApp connects you straight to the number the project team has shared.",
  },
];

export default async function HomePage() {
  const [featured, locations, counts] = await Promise.all([
    getFeaturedProperties(3),
    getLocationOptions(),
    getPublicStats(),
  ]);

  const stats = [
    { label: "Verified listings", value: `${counts.properties}+` },
    { label: "Cities covered", value: `${counts.cities}` },
    { label: "Builders on platform", value: `${counts.builders}+` },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-900 to-teal-700 text-cream">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-cream/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gold-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            RERA-verified listings only
          </p>
          <h1 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Real estate, verified.
          </h1>
          <p className="mt-4 max-w-xl text-cream/80">
            Homes, commercial spaces and plots across India — search by address, sector, city,
            state or country and see exactly where each property is on the map.
          </p>

          <div className="mt-8 max-w-3xl">
            <HeroSearch locations={locations} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/projects?category=${category}`}
                className="rounded-full border border-cream/20 px-3 py-1 text-sm text-cream/90 transition hover:border-gold-600 hover:text-gold-600"
              >
                {categoryLabels[category]}
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-3xl font-semibold tabular-nums">{stat.value}</p>
                <p className="text-sm text-cream/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
                Featured Projects
              </h2>
              <p className="mt-1 text-slate-600">
                Hand-picked listings with strong connectivity and verified RERA status.
              </p>
            </div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-sm font-semibold text-teal-900 hover:underline"
            >
              View all properties
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 flex flex-col gap-5">
            {featured.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </section>
      )}

      {/* Why us */}
      <section className="border-y border-border bg-cream-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
            Why buyers trust {siteConfig.name}
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {trustPoints.map(({ icon: Icon, stamp, title, body }) => (
              <div key={title}>
                <span
                  className={
                    stamp
                      ? "rera-stamp"
                      : "grid h-[46px] w-[46px] place-items-center rounded-full bg-teal-900 text-cream"
                  }
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col items-start gap-6 rounded-xl bg-teal-900 px-6 py-10 text-cream sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Not sure which property fits your budget?
            </h2>
            <p className="mt-1 text-cream/80">
              Message our team on WhatsApp — we&apos;ll shortlist 3 options that match what
              you&apos;re looking for.
            </p>
          </div>
          <WhatsAppButton
            whatsapp={siteConfig.contact.whatsapp}
            projectTitle={siteConfig.name}
            label="Chat with an Expert"
          />
        </div>
      </section>
    </>
  );
}
