import type { Metadata } from "next";
import Link from "next/link";
import { AlarmClock, Download, Handshake, Plus, Search, Upload } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonClass, LinkButton } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/styles";
import {
  partnerStatuses,
  partnerStatusLabels,
  partnerTypeLabels,
  type PartnerStatus,
  type PartnerType,
} from "@/lib/constants/outreach";
import { cn } from "@/lib/utils/cn";
import { followUpState, formatIst } from "@/lib/utils/dates";
import { getPartnerCounts, listPartners } from "@/server/services/partner.service";

export const metadata: Metadata = { title: "Partners" };

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function PartnersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = partnerStatuses.find((s) => s === params.status);
  const due = params.view === "due";
  const q = params.q?.trim() || undefined;
  const [partners, counts] = await Promise.all([listPartners({ status, due, q }), getPartnerCounts()]);

  const tabs: { href: string; label: string; count: number; active: boolean; alert?: boolean }[] = [
    { href: "/admin/partners", label: "All", count: counts.all, active: !status && !due },
    { href: "/admin/partners?view=due", label: "Follow-up due", count: counts.due, active: due, alert: counts.due > 0 },
    ...partnerStatuses.map((s) => ({
      href: `/admin/partners?status=${s}`,
      label: partnerStatusLabels[s],
      count: counts[s],
      active: status === s,
    })),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Partners</h1>
          <p className="mt-1 text-sm text-muted">
            Builders and authorised channel partners you are talking to. Add contacts you met or who publish their business
            details — no scraped lists.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/partners/import" className={buttonClass("outline", "sm")}>
            <Upload className="h-4 w-4" /> Import CSV
          </Link>
          <a href="/api/partners/export" download className={buttonClass("outline", "sm")}>
            <Download className="h-4 w-4" /> CSV
          </a>
          <LinkButton href="/admin/partners/new" size="sm">
            <Plus className="h-4 w-4" /> Add contact
          </LinkButton>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-card border border-border bg-surface shadow-card">
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-3" aria-label="Filter partners">
          {tabs.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              aria-current={t.active ? "page" : undefined}
              className={cn(
                "-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium",
                t.active ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"
              )}
            >
              {t.alert !== undefined && <AlarmClock className="h-3.5 w-3.5" aria-hidden="true" />}
              {t.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  t.alert && !t.active ? "bg-highlight-soft text-ink" : t.active ? "bg-primary-soft text-primary" : "bg-surface-muted text-muted"
                )}
              >
                {t.count}
              </span>
            </Link>
          ))}
        </nav>

        <form className="flex gap-2 border-b border-border p-3" action="/admin/partners">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input name="q" defaultValue={q} placeholder="Search name, company or city" className={cn(inputClass, "pl-9")} />
          </div>
          <button type="submit" className={buttonClass("primary")}>
            Search
          </button>
        </form>

        {partners.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Handshake className="mx-auto h-8 w-8 text-subtle" aria-hidden="true" />
            <p className="mt-2 font-semibold text-ink">{due ? "No follow-ups due" : "No contacts yet"}</p>
            <p className="mt-1 text-sm text-muted">Add the builders and channel partners you plan to approach.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted/60 text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Contact</th>
                  <th className="hidden px-4 py-3 md:table-cell">City</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Next follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {partners.map((p) => {
                  const state = followUpState(p.nextFollowUpAt);
                  return (
                    <tr key={p.id} className="transition hover:bg-canvas">
                      <td className="px-4 py-3">
                        <Link href={`/admin/partners/${p.id}`} className="font-semibold text-ink hover:text-primary">
                          {p.name}
                        </Link>
                        <p className="text-xs text-muted">
                          {[p.company, partnerTypeLabels[p.partnerType as PartnerType]].filter(Boolean).join(" · ")}
                        </p>
                        {p.nextAction && <p className="text-xs text-ink">Next: {p.nextAction}</p>}
                        {p.doNotContact && <p className="text-xs font-semibold text-danger">Do not contact</p>}
                      </td>
                      <td className="hidden px-4 py-3 text-ink md:table-cell">{p.city || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge tone={p.status === "onboarded" ? "teal" : p.status === "not_interested" ? "neutral" : p.status === "follow_up_due" ? "gold" : "info"}>
                          {partnerStatusLabels[p.status as PartnerStatus] ?? p.status}
                        </Badge>
                      </td>
                      <td
                        className={cn(
                          "hidden whitespace-nowrap px-4 py-3 tabular-nums sm:table-cell",
                          state === "overdue" ? "font-semibold text-danger" : state === "today" ? "font-semibold text-ink" : "text-muted"
                        )}
                      >
                        {formatIst(p.nextFollowUpAt, false)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
