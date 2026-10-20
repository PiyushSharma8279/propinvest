import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import SubmissionReview from "@/components/admin/SubmissionReview";
import { Badge } from "@/components/ui/Badge";
import {
  contactMethodLabels,
  submissionStatusLabels,
  submitterTypeLabels,
  type ContactMethod,
  type SubmissionStatus,
  type SubmitterType,
} from "@/lib/constants/submission";
import { formatIst } from "@/lib/utils/dates";
import { formatPriceRange } from "@/lib/utils/format";
import { whatsappLink } from "@/lib/lead-messages";
import { HttpError } from "@/server/http";
import { getSubmission } from "@/server/services/submission.service";

export const metadata: Metadata = { title: "Submission" };

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { submission: s, duplicates, duplicateSubmissions } = await getSubmission(Number((await params).id)).catch((error) => {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  });

  const facts = [
    { label: "Category", value: `${s.category} · ${s.propertyType}` },
    { label: "Location", value: [s.address, s.locality, s.city].filter(Boolean).join(", ") },
    { label: "Price", value: s.price ? formatPriceRange(s.price, s.price) : "Not given" },
    { label: "Size", value: s.area ? `${s.area} ${s.areaUnit}` : "Not given" },
    { label: "RERA number", value: s.reraNumber || "Not given" },
    { label: "Authorisation", value: s.authorizationConfirmed ? `Ticked on the form (terms ${s.termsVersion})` : "Not confirmed" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/submissions" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Submissions
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            #{s.id} · {s.title}
          </h1>
          <p className="mt-1 text-sm text-muted">Received {formatIst(s.createdAt)}</p>
        </div>
        <Badge tone={s.status === "approved" ? "teal" : s.status === "pending" ? "gold" : "neutral"}>
          {submissionStatusLabels[s.status as SubmissionStatus] ?? s.status}
        </Badge>
      </div>

      {(duplicates.length > 0 || duplicateSubmissions.length > 0) && (
        <div className="rounded-card border border-danger/30 bg-danger-soft p-4 text-sm text-ink">
          <p className="flex items-center gap-2 font-semibold text-danger">
            <AlertTriangle className="h-4 w-4" /> Possible duplicates — check before approving
          </p>
          <ul className="mt-2 list-disc pl-5">
            {duplicates.map((d) => (
              <li key={`p${d.id}`}>
                Listing <Link href={`/admin/properties/${d.id}/edit`} className="font-medium text-primary hover:underline">{d.title}</Link> ({[d.locality, d.city].filter(Boolean).join(", ")})
              </li>
            ))}
            {duplicateSubmissions.map((d) => (
              <li key={`s${d.id}`}>
                Submission <Link href={`/admin/submissions/${d.id}`} className="font-medium text-primary hover:underline">#{d.id} {d.title}</Link> ({submissionStatusLabels[d.status as SubmissionStatus] ?? d.status})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <dl className="grid gap-3 sm:grid-cols-2">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="text-xs text-muted">{f.label}</dt>
                  <dd className="text-sm font-medium text-ink">{f.value}</dd>
                </div>
              ))}
            </dl>
            <h2 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Description (as submitted)</h2>
            <p className="mt-1 whitespace-pre-line text-sm text-ink">{s.description}</p>
          </section>

          {s.images.length > 0 && (
            <section className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Photos ({s.images.length})</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {s.images.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-muted">
                    <Image src={url} alt="Submitted photo" fill sizes="240px" className="object-cover" />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Submitted by</h2>
            <p className="mt-2 font-semibold text-ink">{s.name}</p>
            <p className="text-sm text-muted">{submitterTypeLabels[s.submitterType as SubmitterType] ?? s.submitterType}</p>
            <p className="mt-2 text-sm">
              <a href={`tel:${s.phone}`} className="text-primary hover:underline">{s.phone}</a>
              {" · "}
              <a href={whatsappLink(s.phone, `Hi ${s.name.split(" ")[0]}, thank you for submitting "${s.title}" on InvestsProperty. `)} target="_blank" rel="noopener noreferrer" className="text-whatsapp hover:underline">
                WhatsApp
              </a>
            </p>
            {s.email && <p className="text-sm text-ink">{s.email}</p>}
            <p className="mt-1 text-xs text-muted">Prefers {contactMethodLabels[s.preferredContact as ContactMethod] ?? s.preferredContact}</p>
            {s.partnerId && (
              <Link href={`/admin/partners/${s.partnerId}`} className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
                Open owner / partner record #{s.partnerId}
              </Link>
            )}
          </section>

          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Review</h2>
            {s.reviewNote && <p className="mt-2 rounded-lg bg-surface-muted p-2 text-sm text-ink">Last note: {s.reviewNote}</p>}
            {s.propertyId && (
              <Link href={`/admin/properties/${s.propertyId}/edit`} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
                Open the draft listing →
              </Link>
            )}
            <div className="mt-3">
              <SubmissionReview id={s.id} status={s.status as SubmissionStatus} hasProperty={Boolean(s.propertyId)} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
