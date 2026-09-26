import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import bannerImage from "@/app/assets/banner image.png";
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
    getFeaturedProperties(8),
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
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-soft/70 to-canvas">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-surface px-3 py-1 text-xs font-semibold text-primary shadow-card">
              <ShieldCheck className="h-3.5 w-3.5" />
              RERA-verified listings only
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-bold leading-[1.1] text-ink sm:text-5xl">
              Find a home you can <span className="text-primary">trust</span>, in the place you love.
            </h1>
            <p className="mt-4 max-w-lg text-muted">
              Homes, commercial spaces and plots across India — search by address, sector, city,
              state or country and see exactly where each property is on the map.
            </p>

            <div className="mt-8">
              <HeroSearch locations={locations} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/projects?category=${category}`}
                  className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-muted transition hover:border-primary hover:text-primary"
                >
                  {categoryLabels[category]}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative aspect-square overflow-hidden rounded-[28px] shadow-pop">
              <Image
                src={bannerImage}
                alt="Family standing in front of their new home at sunset"
                placeholder="blur"
                fill
                priority
                sizes="(max-width: 1024px) 0px, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -left-8 bottom-10 flex gap-6 rounded-card border border-border bg-surface px-6 py-4 shadow-pop">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold tabular-nums text-ink">{stat.value}</p>
                  <p className="text-xs text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-4 lg:hidden">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold tabular-nums text-ink">{stat.value}</p>
                <p className="text-sm text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Featured Properties</h2>
            <p className="mt-2 text-muted">Explore our featured real estate projects</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink shadow-card transition hover:border-primary hover:text-primary"
            >
              View all properties
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Why us */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Why buyers trust {siteConfig.name}</h2>
            <p className="mt-2 text-muted">Verified data, exact locations and a direct line to the builder.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {trustPoints.map(({ icon: Icon, stamp, title, body }) => (
              <div key={title} className="rounded-card border border-border bg-canvas p-6">
                <span
                  className={
                    stamp
                      ? "rera-stamp"
                      : "grid h-[46px] w-[46px] place-items-center rounded-full bg-primary text-on-primary"
                  }
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-start gap-6 rounded-[24px] border border-primary/15 bg-primary-soft px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            <h2 className="text-2xl font-bold text-ink">Not sure which property fits your budget?</h2>
            <p className="mt-1 text-muted">
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
