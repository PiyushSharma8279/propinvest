import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function pageHref(base: URLSearchParams, page: number): string {
  const params = new URLSearchParams(base.toString());
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  const qs = params.toString();
  return qs ? `/projects?${qs}` : "/projects";
}

export default function Pagination({
  page,
  totalPages,
  base,
}: {
  page: number;
  totalPages: number;
  base: URLSearchParams;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  const linkClass = "grid h-9 min-w-9 place-items-center rounded-md border px-2 text-sm font-medium";

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1">
      {page > 1 && (
        <Link href={pageHref(base, page - 1)} className={cn(linkClass, "border-border bg-white")} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-slate-600">…</span>}
          <Link
            href={pageHref(base, p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              linkClass,
              p === page ? "border-teal-900 bg-teal-900 text-cream" : "border-border bg-white text-ink-900"
            )}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages && (
        <Link href={pageHref(base, page + 1)} className={cn(linkClass, "border-border bg-white")} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
