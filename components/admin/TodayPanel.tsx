import Link from "next/link";
import { AlarmClock, AlertOctagon, ArrowRight, Building2, Flame, Handshake, Inbox, ShieldCheck, Signpost } from "lucide-react";
import { leadSourceLabels, leadStatusLabels, type LeadSource, type LeadStatus } from "@/lib/constants/lead";
import { partnerStatusLabels, type PartnerStatus } from "@/lib/constants/outreach";
import { getQualityIssues } from "@/lib/property-quality";
import { cn } from "@/lib/utils/cn";
import { followUpState, formatIst } from "@/lib/utils/dates";
import { isNotificationConfigured } from "@/server/services/notify.service";
import { getDueLeads, getFollowUpCounts, getInterestByProperty, getRecentLeads } from "@/server/services/lead.service";
import { getNextPartners } from "@/server/services/partner.service";
import { getAllUndeletedProperties } from "@/server/services/property.service";
import { getSubmissionCounts } from "@/server/services/submission.service";

const VERIFY_CODES = new Set(["unverified", "needs_review", "verification_stale", "availability_unconfirmed", "availability_stale", "missing_source"]);

function Card({ title, icon: Icon, href, children }: { title: string; icon: typeof Inbox; href?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon className="h-4 w-4 text-primary" aria-hidden="true" /> {title}
        </h3>
        {href && (
          <Link href={href} className="text-xs font-semibold text-primary hover:underline">
            All <ArrowRight className="inline h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="mt-3 flex-1 text-sm">{children}</div>
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-muted">{children}</p>;

/** "What must I do today?" — every item links to where it gets done. Counts come from stored data only. */
export default async function TodayPanel() {
  const [due, followUps, partners, properties, recent, interest, submissionCounts] = await Promise.all([
    getDueLeads(6),
    getFollowUpCounts(),
    getNextPartners(5),
    getAllUndeletedProperties(),
    getRecentLeads(6),
    getInterestByProperty(30, 5),
    getSubmissionCounts(),
  ]);

  const live = properties.filter((p) => !p.isDraft && p.isActive && p.availability !== "unavailable");
  const toVerify = live
    .map((p) => ({ p, issues: getQualityIssues(p).filter((i) => VERIFY_CODES.has(i.code)) }))
    .filter((r) => r.issues.length > 0);
  const verifiedCount = live.filter((p) => p.verificationStatus === "verified").length;
  const pendingSubmissions = (submissionCounts.pending ?? 0) + (submissionCounts.needs_correction ?? 0);

  const blockers = [
    !isNotificationConfigured() && { text: "New-lead alerts are off — set up Telegram or email (docs/SETUP.md §1).", href: undefined },
    !process.env.NEXT_PUBLIC_GA_ID && { text: "Google Analytics is not configured, so website visits aren't measured (docs/SETUP.md §4).", href: undefined },
    !process.env.CRON_SECRET && { text: "CRON_SECRET not set — the daily digest and notification retries won't run.", href: undefined },
    live.length > 0 && verifiedCount === 0 && { text: `None of the ${live.length} live listings is verified yet — marketing drafts stay locked.`, href: "/admin/quality" },
    partners.length === 0 && { text: "No partner contacts to work on — add builders / owners you can approach.", href: "/admin/partners/new" },
    followUps.overdue > 0 && { text: `${followUps.overdue} overdue lead follow-up${followUps.overdue === 1 ? "" : "s"}.`, href: "/admin/leads?view=overdue" },
  ].filter(Boolean) as { text: string; href?: string }[];

  return (
    <section aria-labelledby="today-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="today-heading" className="text-lg font-bold text-ink">
          Today
        </h2>
        <p className="text-xs text-muted">{formatIst(new Date(), false)} · all figures are recorded data, not estimates</p>
      </div>

      {blockers.length > 0 && (
        <div className="rounded-card border border-highlight bg-highlight-soft p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <AlertOctagon className="h-4 w-4" /> Blocking progress
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-ink">
            {blockers.map((b) => (
              <li key={b.text}>
                • {b.href ? <Link href={b.href} className="underline hover:text-primary">{b.text}</Link> : b.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title={`Leads to follow up (${followUps.due})`} icon={AlarmClock} href="/admin/leads?view=due">
          {due.length === 0 ? (
            <Empty>Nothing due. 🎉</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {due.map((lead) => {
                const state = followUpState(lead.followUpAt);
                return (
                  <li key={lead.id}>
                    <Link href={`/admin/leads/${lead.id}`} className="font-medium text-ink hover:text-primary">
                      {lead.name}
                    </Link>
                    <p className={cn("text-xs", state === "overdue" ? "font-semibold text-danger" : "text-muted")}>
                      {leadStatusLabels[lead.status as LeadStatus] ?? lead.status} ·{" "}
                      {lead.followUpAt ? formatIst(lead.followUpAt) : "new — call now"}
                      {lead.nextAction && ` · ${lead.nextAction}`}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title={`Listings to verify (${toVerify.length})`} icon={ShieldCheck} href="/admin/quality?show=all">
          <p className="mb-2 text-xs text-muted">
            {verifiedCount} of {live.length} live listings verified
          </p>
          {toVerify.length === 0 ? (
            <Empty>All live listings are verified and confirmed.</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {toVerify.slice(0, 5).map(({ p, issues }) => (
                <li key={p.id}>
                  <Link href={`/admin/properties/${p.id}/edit`} className="font-medium text-ink hover:text-primary">
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted">{issues[0].message}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Partners to contact next" icon={Handshake} href="/admin/partners?view=due">
          {partners.length === 0 ? (
            <Empty>
              No contacts yet. <Link href="/admin/partners/new" className="text-primary hover:underline">Add one</Link> or{" "}
              <Link href="/admin/partners/import" className="text-primary hover:underline">import a CSV</Link>.
            </Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {partners.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/partners/${p.id}`} className="font-medium text-ink hover:text-primary">
                    {p.name}
                    {p.company && <span className="font-normal text-muted"> · {p.company}</span>}
                  </Link>
                  <p className="text-xs text-muted">
                    {partnerStatusLabels[p.status as PartnerStatus] ?? p.status}
                    {p.nextFollowUpAt && ` · due ${formatIst(p.nextFollowUpAt, false)}`}
                    {p.nextAction && ` · ${p.nextAction}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Latest inquiries & source" icon={Signpost} href="/admin/leads">
          {recent.length === 0 ? (
            <Empty>No inquiries yet.</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {recent.map((lead) => (
                <li key={lead.id} className="flex justify-between gap-2">
                  <Link href={`/admin/leads/${lead.id}`} className="min-w-0 truncate text-ink hover:text-primary">
                    {lead.projectTitle || "General enquiry"}
                  </Link>
                  <span className="shrink-0 text-xs text-muted">
                    {lead.utmSource || (lead.referrer ? new URL(lead.referrer).hostname.replace(/^www\./, "") : leadSourceLabels[lead.source as LeadSource] ?? lead.source)}{" "}
                    · {formatIst(lead.createdAt, false)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Properties attracting interest (30 days)" icon={Flame}>
          {interest.length === 0 ? (
            <Empty>No inquiries in the last 30 days.</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {interest.map((row) => (
                <li key={row.propertyId ?? "general"} className="flex justify-between gap-2">
                  {row.propertyId ? (
                    <Link href={`/admin/properties/${row.propertyId}/edit`} className="min-w-0 truncate text-ink hover:text-primary">
                      {row.title || `Listing #${row.propertyId}`}
                    </Link>
                  ) : (
                    <span className="text-muted">General enquiries</span>
                  )}
                  <span className="shrink-0 font-semibold tabular-nums text-ink">{row.total}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Owner / builder submissions" icon={Building2} href="/admin/submissions">
          {pendingSubmissions === 0 ? (
            <Empty>
              None waiting. Share <Link href="/list-your-property" className="text-primary hover:underline">/list-your-property</Link> with
              owners you speak to.
            </Empty>
          ) : (
            <Link href="/admin/submissions" className="font-semibold text-primary hover:underline">
              {pendingSubmissions} waiting for review →
            </Link>
          )}
        </Card>
      </div>
    </section>
  );
}
