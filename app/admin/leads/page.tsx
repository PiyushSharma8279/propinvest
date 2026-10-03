import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Inbox, MessageCircle, Phone, Search } from "lucide-react";
import LeadStatusSelect from "@/components/admin/LeadStatusSelect";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/styles";
import {
  leadSourceLabels,
  leadSources,
  leadStatuses,
  leadStatusLabels,
  type LeadSource,
  type LeadStatus,
} from "@/lib/constants/lead";
import { cn } from "@/lib/utils/cn";
import { getLeadCounts, listLeads } from "@/server/services/lead.service";

export const metadata: Metadata = { title: "Leads" };

const sourceTone: Record<LeadSource, "teal" | "gold" | "info"> = {
  enquiry: "teal",
  brochure: "info",
  price_list: "gold",
};

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function AdminLeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = leadStatuses.find((s) => s === params.status);
  const source = leadSources.find((s) => s === params.source);
  const q = params.q?.trim() || undefined;
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const [result, counts] = await Promise.all([
    listLeads({ status, source, q, page: requestedPage }),
    getLeadCounts(),
  ]);
  const { items, total, page, totalPages } = result;

  const href = (changes: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries({ status, source, q, page: page > 1 ? page : undefined, ...changes })) {
      if (value !== undefined && value !== "") sp.set(key, String(value));
    }
    const qs = sp.toString();
    return qs ? `/admin/leads?${qs}` : "/admin/leads";
  };

  const tabs: { value?: LeadStatus; label: string; count: number }[] = [
    { label: "All", count: counts.all },
    ...leadStatuses.map((s) => ({ value: s, label: leadStatusLabels[s], count: counts[s] })),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Leads</h1>
          <p className="mt-1 text-sm text-muted">
            People who enquired, downloaded a brochure or asked for a price list on the website.
          </p>
        </div>
        <a href="/api/leads/export" download className={buttonClass("outline", "sm")}>
          <Download className="h-4 w-4" /> Download Excel (CSV)
        </a>
      </div>

      <div className="mt-6 overflow-hidden rounded-card border border-border bg-surface shadow-card">
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-3" aria-label="Filter by status">
          {tabs.map((t) => {
            const active = status === t.value;
            return (
              <Link
                key={t.label}
                href={href({ status: t.value, page: undefined })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium",
                  active ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    active ? "bg-primary-soft text-primary" : "bg-surface-muted text-muted"
                  )}
                >
                  {t.count}
                </span>
              </Link>
            );
          })}
        </nav>

        <form className="flex flex-wrap gap-2 border-b border-border p-3" action="/admin/leads">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input name="q" defaultValue={q} placeholder="Search name, phone or project" className={cn(inputClass, "pl-9")} />
          </div>
          <select name="source" defaultValue={source ?? ""} className={cn(inputClass, "w-auto")} aria-label="Source">
            <option value="">All sources</option>
            {leadSources.map((s) => (
              <option key={s} value={s}>
                {leadSourceLabels[s]}
              </option>
            ))}
          </select>
          <button type="submit" className={buttonClass("primary")}>
            Search
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted/60 text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Name & phone</th>
                <th className="px-4 py-3">Project</th>
                <th className="hidden px-4 py-3 md:table-cell">Budget</th>
                <th className="hidden px-4 py-3 lg:table-cell">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Inbox className="mx-auto h-8 w-8 text-subtle" aria-hidden="true" />
                    <p className="mt-2 font-semibold text-ink">No leads yet</p>
                    <p className="mt-1 text-sm text-muted">
                      {q || status || source
                        ? "Try a different search or clear the filters."
                        : "Enquiries from property pages will appear here."}
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((lead) => (
                  <tr key={lead.id} className="align-top transition hover:bg-canvas">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{lead.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                        <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                          <Phone className="h-3.5 w-3.5" /> {lead.phone}
                        </a>
                        <a
                          href={`https://wa.me/${lead.phone.replace("+", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-whatsapp hover:underline"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </a>
                      </div>
                      {lead.message && <p className="mt-1.5 max-w-xs text-xs text-muted">“{lead.message}”</p>}
                    </td>
                    <td className="px-4 py-3">
                      {lead.projectTitle ? (
                        lead.propertyId ? (
                          <Link href={`/admin/properties/${lead.propertyId}/edit`} className="font-medium text-ink hover:text-primary">
                            {lead.projectTitle}
                          </Link>
                        ) : (
                          <span className="text-ink">{lead.projectTitle}</span>
                        )
                      ) : (
                        <span className="text-muted">General enquiry</span>
                      )}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-ink md:table-cell">{lead.budget || "—"}</td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <Badge tone={sourceTone[lead.source as LeadSource] ?? "neutral"}>
                        {leadSourceLabels[lead.source as LeadSource] ?? lead.source}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <LeadStatusSelect id={lead.id} status={lead.status as LeadStatus} />
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-muted tabular-nums sm:table-cell">
                      {lead.createdAt.toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink tabular-nums">{total}</span> {total === 1 ? "lead" : "leads"}
          </p>
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center gap-2 text-sm">
              {page > 1 && (
                <Link href={href({ page: page - 1 > 1 ? page - 1 : undefined })} className={buttonClass("outline", "sm")} aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              )}
              <span className="tabular-nums text-muted">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link href={href({ page: page + 1 })} className={buttonClass("outline", "sm")} aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
