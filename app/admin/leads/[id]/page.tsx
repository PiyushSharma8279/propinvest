import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban } from "lucide-react";
import LeadStatusSelect from "@/components/admin/LeadStatusSelect";
import {
  CallLogger,
  DealEditor,
  FollowUpEditor,
  NoteForm,
  OptOutToggle,
  RequirementEditor,
  ResponseRecorder,
  WhatsAppComposer,
} from "@/components/admin/leads/LeadActions";
import { Badge } from "@/components/ui/Badge";
import {
  commissionStatusLabels,
  leadResponseLabels,
  leadSourceLabels,
  leadStatusLabels,
  type CommissionStatus,
  type LeadResponse,
  type LeadActivityType,
  type LeadSource,
  type LeadStatus,
} from "@/lib/constants/lead";
import { cn } from "@/lib/utils/cn";
import { followUpState, formatIst } from "@/lib/utils/dates";
import { HttpError } from "@/server/http";
import { requireAdminPage } from "@/server/services/auth.service";
import { getLead } from "@/server/services/lead.service";

export const metadata: Metadata = { title: "Lead" };

const activityLabels: Record<LeadActivityType, string> = {
  created: "Enquiry received",
  repeat_enquiry: "Enquired again",
  status: "Status changed",
  follow_up: "Follow-up",
  note: "Note",
  call: "Call logged",
  whatsapp_opened: "WhatsApp chat opened",
  notification: "Team notification",
  opt_out: "Contact preference",
  response: "Buyer response",
  details: "Requirement updated",
  deal: "Deal updated",
};

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 rounded-card border border-border bg-surface p-5 shadow-card">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage("/admin/leads");
  const data = await getLead(Number((await params).id)).catch((error) => {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  });
  const { lead, activities } = data;
  const due = followUpState(lead.followUpAt);

  const details = [
    { label: "Phone", value: lead.phone },
    { label: "Budget", value: lead.budget },
    { label: "Form", value: leadSourceLabels[lead.source as LeadSource] ?? lead.source },
    { label: "Received", value: formatIst(lead.createdAt) },
    { label: "Last contacted", value: lead.lastContactedAt ? formatIst(lead.lastContactedAt) : "" },
    { label: "Campaign", value: [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" / ") },
    { label: "Referrer", value: lead.referrer },
    { label: "Landing page", value: lead.landingPage },
    { label: "Enquiry page", value: lead.pageUrl },
    { label: "Similar projects on WhatsApp", value: lead.marketingOptIn ? "Opted in" : "Not opted in" },
  ].filter((d) => d.value);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> All leads
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{lead.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {lead.projectTitle ? (
              lead.propertyId ? (
                <Link href={`/admin/properties/${lead.propertyId}/edit`} className="hover:text-primary">
                  {lead.projectTitle}
                </Link>
              ) : (
                lead.projectTitle
              )
            ) : (
              "General enquiry"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lead.optedOut && <Badge tone="danger">Do not contact</Badge>}
          <LeadStatusSelect id={lead.id} status={lead.status as LeadStatus} />
        </div>
      </div>

      {lead.optedOut && (
        <p className="flex items-center gap-2 rounded-card border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <Ban className="h-4 w-4" /> This person asked not to be contacted
          {lead.optedOutAt ? ` (${formatIst(lead.optedOutAt)})` : ""}. Call and WhatsApp actions are hidden.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          {lead.message && (
            <Section title="Message">
              <p className="whitespace-pre-line text-sm text-ink">“{lead.message}”</p>
            </Section>
          )}

          {!lead.optedOut && (
            <Section title="Reply on WhatsApp" id="whatsapp">
              <WhatsAppComposer
                id={lead.id}
                phone={lead.phone}
                name={lead.name}
                projectTitle={lead.projectTitle}
                senderName={admin.name}
                stage={lead.status as LeadStatus}
              />
            </Section>
          )}

          {!lead.optedOut && (
            <Section title="What did the buyer say?">
              <ResponseRecorder id={lead.id} />
            </Section>
          )}

          <Section title="Notes & history">
            <NoteForm id={lead.id} />
            <ol className="mt-5 flex flex-col gap-4 border-l border-border pl-4">
              {activities.map((act) => (
                <li key={act.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                  <p className="text-xs text-muted">
                    {formatIst(act.createdAt)} · {act.userName ?? "Website"}
                  </p>
                  <p className="text-sm font-medium text-ink">
                    {activityLabels[act.type as LeadActivityType] ?? act.type}
                    {act.type === "status" &&
                      `: ${leadStatusLabels[act.meta.from as LeadStatus] ?? act.meta.from} → ${leadStatusLabels[act.meta.to as LeadStatus] ?? act.meta.to}`}
                    {act.type === "follow_up" && typeof act.meta.at === "string" && `: ${formatIst(new Date(act.meta.at))}`}
                    {act.type === "response" && `: ${leadResponseLabels[act.meta.outcome as LeadResponse] ?? act.meta.outcome}`}
                    {act.type === "deal" &&
                      `: ₹${Number(act.meta.commissionAmount ?? 0).toLocaleString("en-IN")} commission, ${commissionStatusLabels[(act.meta.commissionStatus ?? "") as CommissionStatus] ?? act.meta.commissionStatus}`}
                  </p>
                  {act.note && <p className="mt-0.5 whitespace-pre-line text-sm text-muted">{act.note}</p>}
                </li>
              ))}
              {activities.length === 0 && <li className="text-sm text-muted">No history recorded yet.</li>}
            </ol>
          </Section>
        </div>

        <aside className="flex flex-col gap-5">
          <Section title="Follow-up">
            <p
              className={cn(
                "mb-3 text-sm",
                due === "overdue" ? "font-semibold text-danger" : due === "today" ? "font-semibold text-ink" : "text-muted"
              )}
            >
              {lead.followUpAt
                ? `${due === "overdue" ? "Overdue since" : "Scheduled for"} ${formatIst(lead.followUpAt)} IST`
                : "No follow-up scheduled."}
            </p>
            <FollowUpEditor id={lead.id} followUpAt={lead.followUpAt?.toISOString() ?? null} disabled={lead.optedOut} />
          </Section>

          {!lead.optedOut && (
            <Section title="Call">
              <CallLogger id={lead.id} phone={lead.phone} />
            </Section>
          )}

          <Section title="Requirement & next action">
            <RequirementEditor
              id={lead.id}
              initial={{
                preferredLocation: lead.preferredLocation,
                preferredPropertyType: lead.preferredPropertyType,
                timeline: lead.timeline,
                budget: lead.budget,
                nextAction: lead.nextAction,
              }}
            />
          </Section>

          {(lead.status === "negotiation" || lead.status === "closed" || lead.commissionStatus) && (
            <Section title="Deal">
              <DealEditor
                id={lead.id}
                initial={{ dealValue: lead.dealValue, commissionAmount: lead.commissionAmount, commissionStatus: lead.commissionStatus }}
              />
            </Section>
          )}

          <Section title="Details">
            <dl className="flex flex-col gap-2 text-sm">
              {details.map((d) => (
                <div key={d.label} className="grid grid-cols-[120px_1fr] gap-2">
                  <dt className="text-muted">{d.label}</dt>
                  <dd className="break-words text-ink">{d.value}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="Contact preference">
            <OptOutToggle id={lead.id} optedOut={lead.optedOut} />
          </Section>
        </aside>
      </div>
    </div>
  );
}
