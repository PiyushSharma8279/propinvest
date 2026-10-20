import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import OutreachComposer from "@/components/admin/partners/OutreachComposer";
import PartnerForm from "@/components/admin/partners/PartnerForm";
import OnboardingChecklist from "@/components/admin/partners/OnboardingChecklist";
import PartnerNoteForm from "@/components/admin/partners/PartnerNoteForm";
import { partnerStatusLabels, type PartnerActivityType, type PartnerStatus } from "@/lib/constants/outreach";
import { siteConfig } from "@/lib/site-config";
import { formatIst } from "@/lib/utils/dates";
import { HttpError } from "@/server/http";
import { requireAdminPage } from "@/server/services/auth.service";
import { getPartner } from "@/server/services/partner.service";

export const metadata: Metadata = { title: "Partner" };

const activityLabels: Record<PartnerActivityType, string> = {
  created: "Added",
  status: "Status changed",
  follow_up: "Follow-up",
  note: "Note",
  template_opened: "Message template opened",
  imported: "Imported",
  onboarding: "Onboarding",
};

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage("/admin/partners");
  const { partner, activities } = await getPartner(Number((await params).id)).catch((error) => {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  });

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/partners" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Partners
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-ink">{partner.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {[partner.company, partner.city, partnerStatusLabels[partner.status as PartnerStatus]].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Details</h2>
            <div className="mt-4">
              <PartnerForm partner={partner} />
            </div>
          </section>

          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Notes & history</h2>
            <div className="mt-3">
              <PartnerNoteForm id={partner.id} />
            </div>
            <ol className="mt-5 flex flex-col gap-4 border-l border-border pl-4">
              {activities.map((act) => (
                <li key={act.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                  <p className="text-xs text-muted">
                    {formatIst(act.createdAt)} · {act.userName ?? "—"}
                  </p>
                  <p className="text-sm font-medium text-ink">
                    {activityLabels[act.type as PartnerActivityType] ?? act.type}
                    {act.type === "status" &&
                      `: ${partnerStatusLabels[act.meta.from as PartnerStatus] ?? act.meta.from} → ${partnerStatusLabels[act.meta.to as PartnerStatus] ?? act.meta.to}`}
                    {act.type === "follow_up" && typeof act.meta.at === "string" && `: ${formatIst(new Date(act.meta.at), false)}`}
                  </p>
                  {act.note && <p className="mt-0.5 whitespace-pre-line text-sm text-muted">{act.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          {(partner.status === "interested" || partner.status === "onboarded" || Object.keys(partner.onboarding).length > 0) && (
            <section className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Onboarding checklist</h2>
              <div className="mt-3">
                <OnboardingChecklist id={partner.id} done={partner.onboarding} />
              </div>
            </section>
          )}
          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Write a message</h2>
            <div className="mt-3">
              {partner.doNotContact ? (
                <p className="text-sm font-medium text-danger">Marked do-not-contact. Templates are disabled.</p>
              ) : (
                <OutreachComposer
                  id={partner.id}
                  name={partner.name}
                  company={partner.company}
                  city={partner.city}
                  phone={partner.phone}
                  email={partner.email}
                  senderName={admin.name}
                  site={siteConfig.url.replace(/^https?:\/\//, "")}
                />
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
