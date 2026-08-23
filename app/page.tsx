import Link from "next/link";
import { ShieldCheck, MapPinned, Users, ArrowRight } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getAllProperties, getFeaturedProperties, getAllCities } from "@/lib/properties";
import { siteConfig } from "@/lib/site-config";

export default function HomePage() {
  const featured = getFeaturedProperties(3);
  const allProperties = getAllProperties();
  const cities = getAllCities();

  const stats = [
    { label: "RERA-verified projects", value: `${allProperties.length}+` },
    { label: "Cities covered", value: `${cities.length}` },
    { label: "Builders on platform", value: `${new Set(allProperties.map((p) => p.builder)).size}+` },
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
            Browse new launches, under-construction and ready-to-move projects across
            India. Every listing carries its RERA registration up front, so you know
            exactly what you&apos;re looking at before you call.
          </p>

          <div className="mt-8 max-w-2xl">
            <SearchBar />
          </div>

          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-3xl font-semibold tabular-nums">
                  {stat.value}
                </p>
                <p className="text-sm text-cream/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured projects */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
              Featured Projects
            </h2>
            <p className="mt-1 text-slate-600">
              Hand-picked new launches with strong connectivity and verified RERA status.
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-sm font-semibold text-teal-900 hover:underline"
          >
            View all projects
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-5">
          {featured.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      {/* Why PropInvest */}
      <section id="about" className="border-y border-border bg-cream-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
            Why buyers trust {siteConfig.name}
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            <div>
              <span className="rera-stamp">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">
                Every listing, verified
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                We display the RERA registration number on every project card, so
                you can cross-check it on the state RERA portal before you commit.
              </p>
            </div>
            <div>
              <span className="grid h-[46px] w-[46px] place-items-center rounded-full bg-teal-900 text-cream">
                <MapPinned className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">
                Local, on-ground detail
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Connectivity, possession timelines and pricing for each project,
                organised the way you&apos;d actually compare two properties in the same city.
              </p>
            </div>
            <div>
              <span className="grid h-[46px] w-[46px] place-items-center rounded-full bg-teal-900 text-cream">
                <Users className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">
                Talk to the project team directly
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                No lead resellers in between — calling or messaging on WhatsApp
                connects you straight to the number the project team has shared.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col items-start gap-6 rounded-xl bg-teal-900 px-6 py-10 text-cream sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Not sure which project fits your budget?
            </h2>
            <p className="mt-1 text-cream/80">
              Message our team on WhatsApp — we&apos;ll shortlist 3 projects that match
              what you&apos;re looking for.
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
