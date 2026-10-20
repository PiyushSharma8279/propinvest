import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  submissionStatuses,
  submissionStatusLabels,
  submitterTypeLabels,
  type SubmissionStatus,
  type SubmitterType,
} from "@/lib/constants/submission";
import { cn } from "@/lib/utils/cn";
import { formatIst } from "@/lib/utils/dates";
import { formatPriceRange } from "@/lib/utils/format";
import { getSubmissionCounts, listSubmissions } from "@/server/services/submission.service";

export const metadata: Metadata = { title: "Submissions" };

const tone: Record<SubmissionStatus, "gold" | "info" | "teal" | "neutral" | "danger"> = {
  pending: "gold",
  needs_correction: "info",
  approved: "teal",
  rejected: "neutral",
  suspended: "danger",
};

export default async function SubmissionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const requested = (await searchParams).status;
  const status = requested === "all" ? undefined : (submissionStatuses.find((s) => s === requested) ?? "pending");
  const [items, counts] = await Promise.all([listSubmissions(status), getSubmissionCounts()]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Property submissions</h1>
      <p className="mt-1 text-sm text-muted">
        Sent in from <Link href="/list-your-property" className="text-primary hover:underline">/list-your-property</Link>. Nothing
        here is public. Approving creates a draft listing for you to verify and publish.
      </p>

      <div className="mt-6 overflow-hidden rounded-card border border-border bg-surface shadow-card">
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-3" aria-label="Filter by status">
          {[...submissionStatuses, "all" as const].map((s) => {
            const active = (status ?? "all") === s;
            const n = s === "all" ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[s] ?? 0);
            return (
              <Link
                key={s}
                href={`/admin/submissions?status=${s}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium",
                  active ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"
                )}
              >
                {s === "all" ? "All" : submissionStatusLabels[s]}
                <span className="rounded-full bg-surface-muted px-1.5 text-xs tabular-nums">{n}</span>
              </Link>
            );
          })}
        </nav>
        {items.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Inbox className="mx-auto h-8 w-8 text-subtle" aria-hidden="true" />
            <p className="mt-2 font-semibold text-ink">Nothing here</p>
            <p className="mt-1 text-sm text-muted">Share /list-your-property with owners and builders you talk to.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((s) => {
              const dups = s.possibleDuplicates.properties.length + s.possibleDuplicates.submissions.length;
              return (
                <li key={s.id}>
                  <Link href={`/admin/submissions/${s.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 transition hover:bg-canvas">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">
                        #{s.id} · {s.title}
                      </p>
                      <p className="text-xs text-muted">
                        {[s.propertyType, s.locality, s.city, s.price ? formatPriceRange(s.price, s.price) : ""].filter(Boolean).join(" · ")}
                      </p>
                      <p className="text-xs text-muted">
                        {s.name} · {submitterTypeLabels[s.submitterType as SubmitterType] ?? s.submitterType} · {formatIst(s.createdAt)}
                      </p>
                    </div>
                    {dups > 0 && <Badge tone="danger">{dups} possible duplicate{dups === 1 ? "" : "s"}</Badge>}
                    <Badge tone={tone[s.status as SubmissionStatus] ?? "neutral"}>
                      {submissionStatusLabels[s.status as SubmissionStatus] ?? s.status}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
