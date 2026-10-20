import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import ContentItemForm, { ContentRow } from "@/components/admin/ContentItemForm";
import {
  contentStatuses,
  contentStatusLabels,
  contentTypeLabels,
  type ContentStatus,
  type ContentType,
} from "@/lib/constants/outreach";
import { cn } from "@/lib/utils/cn";
import { listContent } from "@/server/services/partner.service";

export const metadata: Metadata = { title: "Content" };

const statusTone: Record<ContentStatus, "neutral" | "gold" | "info" | "teal" | "danger"> = {
  idea: "neutral",
  drafting: "info",
  review: "gold",
  approved: "teal",
  published: "teal",
  dropped: "neutral",
};

export default async function ContentPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const status = contentStatuses.find((s) => s === params.status);
  const items = await listContent(status);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Content</h1>
        <p className="mt-1 text-sm text-muted">
          Plan location guides and buyer articles. Templates live in <code>docs/content/</code>. Write each piece by hand,
          get it reviewed, publish it yourself, then paste the link here.
        </p>
      </div>

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">New idea</h2>
        <div className="mt-3">
          <ContentItemForm />
        </div>
      </section>

      <section className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-3" aria-label="Filter by status">
          {[undefined, ...contentStatuses].map((s) => (
            <Link
              key={s ?? "all"}
              href={s ? `/admin/content?status=${s}` : "/admin/content"}
              aria-current={status === s ? "page" : undefined}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-3 py-3 text-sm font-medium",
                status === s ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"
              )}
            >
              {s ? contentStatusLabels[s] : "All"}
            </Link>
          ))}
        </nav>
        {items.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted">No content ideas here yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id}>
                <ContentRow item={item}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{item.title}</p>
                    <Badge tone={statusTone[item.status as ContentStatus] ?? "neutral"}>
                      {contentStatusLabels[item.status as ContentStatus] ?? item.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {[
                      contentTypeLabels[item.contentType as ContentType],
                      item.city,
                      item.targetKeyword && `“${item.targetKeyword}”`,
                      item.dueDate && `due ${item.dueDate}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </ContentRow>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
