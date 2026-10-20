import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { verificationStatusLabels, type VerificationStatus } from "@/lib/constants/property";
import { duplicateTitles, getQualityIssues, severityRank, type IssueSeverity, type QualityIssue } from "@/lib/property-quality";
import { cn } from "@/lib/utils/cn";
import { getAllUndeletedProperties } from "@/server/services/property.service";

export const metadata: Metadata = { title: "Listing quality" };

const severityTone: Record<IssueSeverity, "danger" | "gold" | "neutral"> = { high: "danger", medium: "gold", low: "neutral" };

type SearchParams = Promise<Record<string, string | undefined>>;

/**
 * Report of listings that need a person to look at them: missing fields, inconsistent numbers,
 * unsupported claims, missing provenance. Read-only — fixes happen in the listing editor.
 */
export default async function ListingQualityPage({ searchParams }: { searchParams: SearchParams }) {
  const { show } = await searchParams;
  const minSeverity: IssueSeverity = show === "all" ? "low" : show === "medium" ? "medium" : "high";
  const properties = await getAllUndeletedProperties();
  const duplicates = duplicateTitles(properties);
  const now = new Date();

  const rows = properties
    .map((p) => {
      const issues: QualityIssue[] = getQualityIssues(p, now);
      const dup = duplicates.get(p.id);
      if (dup) issues.push({ code: "duplicate_title", severity: "medium", message: dup });
      issues.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
      return { p, issues, visible: issues.filter((i) => severityRank[i.severity] <= severityRank[minSeverity]) };
    })
    .filter((r) => r.visible.length > 0)
    .sort((a, b) => severityRank[a.issues[0].severity] - severityRank[b.issues[0].severity] || b.issues.length - a.issues.length);

  const totals = { high: 0, medium: 0, low: 0 };
  for (const p of properties) {
    for (const i of getQualityIssues(p, now)) totals[i.severity]++;
  }

  const filters: { key?: string; label: string }[] = [
    { label: "High priority" },
    { key: "medium", label: "High + medium" },
    { key: "all", label: "Everything" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Listing quality</h1>
      <p className="mt-1 text-sm text-muted">
        Listings with missing details, inconsistent numbers, unsupported claims or no recorded source. Fix them in the
        editor; nothing here changes a listing.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3 sm:max-w-md">
        {(["high", "medium", "low"] as const).map((s) => (
          <div key={s} className="rounded-card border border-border bg-surface p-3 shadow-card">
            <p className="text-xs capitalize text-muted">{s}</p>
            <p className="text-xl font-bold tabular-nums text-ink">{totals[s]}</p>
          </div>
        ))}
      </div>

      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Severity">
        {filters.map((f) => {
          const active = (show ?? undefined) === f.key;
          return (
            <Link
              key={f.label}
              href={f.key ? `/admin/quality?show=${f.key}` : "/admin/quality"}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium",
                active ? "border-primary bg-primary-soft text-primary" : "border-border text-muted hover:text-ink"
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-card border border-border bg-surface p-10 text-center shadow-card">
          <CheckCircle2 className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
          <p className="mt-2 font-semibold text-ink">Nothing to fix at this level</p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {rows.map(({ p, visible }) => (
            <li key={p.id} className="rounded-card border border-border bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/admin/properties/${p.id}/edit`} className="font-semibold text-ink hover:text-primary">
                    {p.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">
                    {[p.locality, p.city].filter(Boolean).join(", ")} ·{" "}
                    {p.isDraft ? "Draft" : p.isActive ? "Live" : "Hidden"} ·{" "}
                    {verificationStatusLabels[p.verificationStatus as VerificationStatus] ?? p.verificationStatus}
                  </p>
                </div>
                {!p.isDraft && p.isActive && (
                  <a
                    href={`/projects/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-primary"
                  >
                    View live <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              <ul className="mt-3 flex flex-col gap-1.5">
                {visible.map((issue) => (
                  <li key={issue.code} className="flex items-start gap-2 text-sm text-ink">
                    <Badge tone={severityTone[issue.severity]}>{issue.severity}</Badge>
                    <span>{issue.message}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
