import type { Metadata } from "next";
import { BadgeCheck, Handshake, MapPinned, ShieldCheck } from "lucide-react";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site-config";

/** Fully static (SSG): no data fetching, rendered once at build time. */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About Us",
  description: `${siteConfig.name} ${siteConfig.byline} lists RERA-verified homes, commercial spaces and plots across India, with direct access to project teams.`,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About ${siteConfig.name}`,
    description: `Who we are and how ${siteConfig.name} verifies every listing.`,
    url: `${siteConfig.url}/about`,
  },
};

const values = [
  {
    icon: ShieldCheck,
    title: "Verified first",
    body: "Every project shows its RERA registration so you can check it on the state portal before paying anything.",
  },
  {
    icon: MapPinned,
    title: "Exact locations",
    body: "Each listing is pinned on the map with its full address, so you know precisely where you're buying.",
  },
  {
    icon: Handshake,
    title: "Direct contact",
    body: "Call or WhatsApp the project team straight from the listing — no middlemen reselling your number.",
  },
  {
    icon: BadgeCheck,
    title: "Homes, offices & plots",
    body: "Residential apartments and villas, commercial shops and offices, and residential, commercial and farm plots.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
        ]}
      />
      <h1 className="mt-4 font-display text-3xl font-semibold text-ink sm:text-4xl">
        About {siteConfig.name}
      </h1>
      <p className="mt-1 font-medium text-highlight">{siteConfig.byline}</p>
      <p className="mt-6 text-lg text-muted">
        {siteConfig.name} is a real estate platform by Maa Rudrani Properties. We help buyers and
        investors find verified residential projects, commercial spaces and plots, compare them
        side by side, and talk directly to the people building them.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {values.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-card border border-border bg-surface shadow-card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-on-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-3 font-display text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <LinkButton href="/projects">Browse properties</LinkButton>
        <LinkButton href="/#contact" variant="outline">
          Contact us
        </LinkButton>
      </div>
    </div>
  );
}
