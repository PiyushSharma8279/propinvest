import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { DraftCard } from "@/components/admin/MarketingDrafts";
import { inputClass } from "@/components/ui/styles";
import { buildMarketingPack } from "@/lib/marketing-drafts";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils/cn";
import { getAllUndeletedProperties } from "@/server/services/property.service";

export const metadata: Metadata = { title: "Marketing drafts" };

/**
 * Drafts for WhatsApp, Instagram, community posts, video scripts, FAQs and SEO, generated from a
 * listing's own data. Only verified, live, available listings get drafts, so nothing unconfirmed is
 * promoted. Copy / edit / post by hand.
 */
export default async function MarketingPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const all = await getAllUndeletedProperties();
  const live = all.filter((p) => !p.isDraft && p.isActive && p.availability !== "unavailable");
  const verified = live.filter((p) => p.verificationStatus === "verified");
  const selected = live.find((p) => String(p.id) === id) ?? verified[0];
  const pack = selected ? buildMarketingPack(selected, siteConfig.url) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Marketing drafts</h1>
        <p className="mt-1 text-sm text-muted">
          Ready-to-edit posts and messages built from a listing&apos;s own details, with tracked links so enquiries show their
          source. Nothing is posted or sent from here.
        </p>
      </div>

      <form action="/admin/marketing" className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Listing
          <select name="id" defaultValue={selected?.id} className={cn(inputClass, "w-auto min-w-72")}>
            {verified.length > 0 && (
              <optgroup label="Verified (drafts available)">
                {verified.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.locality || p.city}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Not verified yet">
              {live
                .filter((p) => p.verificationStatus !== "verified")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.locality || p.city}
                  </option>
                ))}
            </optgroup>
          </select>
        </label>
        <button type="submit" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover">
          Show drafts
        </button>
      </form>

      {!selected || !pack ? (
        <p className="rounded-card border border-border bg-surface p-6 text-sm text-muted">No live listings yet.</p>
      ) : !pack.verified ? (
        <div className="rounded-card border border-highlight bg-highlight-soft p-5 text-sm text-ink">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4" /> “{selected.title}” isn&apos;t verified yet
          </p>
          <p className="mt-1">
            Marketing drafts are only generated for listings whose details you have checked against the builder / owner&apos;s
            documents, so nothing unconfirmed gets promoted. {verified.length} of {live.length} live listings are verified.
          </p>
          <Link href={`/admin/properties/${selected.id}/edit`} className="mt-3 inline-block font-semibold text-primary hover:underline">
            Verify this listing → (Source &amp; verification section)
          </Link>
        </div>
      ) : (
        <>
          {pack.missing.length > 0 && (
            <div className="rounded-card border border-border bg-surface p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-ink">
                <AlertTriangle className="h-4 w-4 text-highlight" /> Missing information — drafts leave these out
              </p>
              <ul className="mt-2 list-disc pl-5 text-muted">
                {pack.missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
              <Link href={`/admin/properties/${selected.id}/edit`} className="mt-2 inline-block text-primary hover:underline">
                Fill them in
              </Link>
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {pack.drafts.map((d) => (
              <DraftCard key={`${selected.id}-${d.id}`} draft={d} propertyTitle={selected.title} city={selected.city} />
            ))}
          </div>
          <p className="text-xs text-muted">
            Rules: no guaranteed returns or appreciation, no invented discounts or “only 2 left”, show the RERA number on
            ads for registered projects, use only photos you have permission to use.
          </p>
        </>
      )}
    </div>
  );
}
