import type { Metadata } from "next";
import Link from "next/link";
import { leadStatusLabels } from "@/lib/constants/lead";
import { partnerStatusLabels } from "@/lib/constants/outreach";
import { cn } from "@/lib/utils/cn";
import { istDayBounds } from "@/lib/utils/dates";
import { getDealTotals, getFollowUpCounts, getLeadFunnel, getLeadStageMoves } from "@/server/services/lead.service";
import {
  countNewPartners,
  countPartnerActivities,
  countPublishedContent,
  getPartnerCounts,
  getPartnerStageMoves,
} from "@/server/services/partner.service";
import { countVerifiedListings } from "@/server/services/property.service";
import { getSubmissionCounts } from "@/server/services/submission.service";

export const metadata: Metadata = { title: "Weekly report" };

const DAY_MS = 86_400_000;
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * The last 7 IST days against the 7 before, counted straight from recorded rows. Nothing is
 * estimated: a stage, deal or commission only counts when someone recorded it in this panel.
 */
export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ weeks?: string }> }) {
  const weeksAgo = Math.min(52, Math.max(0, Number.parseInt((await searchParams).weeks ?? "0", 10) || 0));
  const to = new Date(istDayBounds().end.getTime() - weeksAgo * 7 * DAY_MS);
  const from = new Date(to.getTime() - 7 * DAY_MS);
  const prevFrom = new Date(from.getTime() - 7 * DAY_MS);

  const [
    funnel, prevFunnel, leadMoves, prevLeadMoves, partnerMoves, prevPartnerMoves,
    newPartners, prevNewPartners, outreach, prevOutreach, verified, prevVerified,
    published, prevPublished, deals, prevDeals, followUps, partnerCounts, submissionCounts,
  ] = await Promise.all([
    getLeadFunnel(from, to),
    getLeadFunnel(prevFrom, from),
    getLeadStageMoves(from, to),
    getLeadStageMoves(prevFrom, from),
    getPartnerStageMoves(from, to),
    getPartnerStageMoves(prevFrom, from),
    countNewPartners(from, to),
    countNewPartners(prevFrom, from),
    countPartnerActivities("template_opened", from, to),
    countPartnerActivities("template_opened", prevFrom, from),
    countVerifiedListings(from, to),
    countVerifiedListings(prevFrom, from),
    countPublishedContent(from, to),
    countPublishedContent(prevFrom, from),
    getDealTotals(from, to),
    getDealTotals(prevFrom, from),
    getFollowUpCounts(),
    getPartnerCounts(),
    getSubmissionCounts(),
  ]);

  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const rate = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");
  const m = (moves: Record<string, number>, key: string) => moves[key] ?? 0;
  const pendingSubmissions = (submissionCounts.pending ?? 0) + (submissionCounts.needs_correction ?? 0);

  const partnerRows: Row[] = [
    { label: "New partner contacts added", now: newPartners, prev: prevNewPartners },
    { label: "Outreach messages prepared", now: outreach, prev: prevOutreach },
    { label: `Moved to ${partnerStatusLabels.contacted}`, now: m(partnerMoves, "contacted"), prev: m(prevPartnerMoves, "contacted") },
    { label: `Moved to ${partnerStatusLabels.interested}`, now: m(partnerMoves, "interested"), prev: m(prevPartnerMoves, "interested") },
    { label: `Moved to ${partnerStatusLabels.onboarded}`, now: m(partnerMoves, "onboarded"), prev: m(prevPartnerMoves, "onboarded") },
    { label: "Listings verified", now: verified, prev: prevVerified },
    { label: "Content published", now: published, prev: prevPublished },
  ];
  const leadRows: Row[] = [
    { label: "New inquiries (saved leads)", now: funnel.total, prev: prevFunnel.total },
    { label: `Moved to ${leadStatusLabels.contacted}`, now: m(leadMoves, "contacted"), prev: m(prevLeadMoves, "contacted") },
    { label: `Moved to ${leadStatusLabels.qualified}`, now: m(leadMoves, "qualified"), prev: m(prevLeadMoves, "qualified") },
    { label: `Moved to ${leadStatusLabels.site_visit}`, now: m(leadMoves, "site_visit"), prev: m(prevLeadMoves, "site_visit") },
    { label: `Moved to ${leadStatusLabels.negotiation}`, now: m(leadMoves, "negotiation"), prev: m(prevLeadMoves, "negotiation") },
    { label: `Moved to ${leadStatusLabels.closed}`, now: m(leadMoves, "closed"), prev: m(prevLeadMoves, "closed") },
    { label: `Moved to ${leadStatusLabels.not_interested}`, now: m(leadMoves, "not_interested"), prev: m(prevLeadMoves, "not_interested") },
  ];
  const dealRows: Row[] = [
    { label: "Deals with commission confirmed / received", now: deals.confirmedCount, prev: prevDeals.confirmedCount },
    { label: "Commission confirmed / received", now: deals.confirmedCommission, prev: prevDeals.confirmedCommission, money: true },
  ];

  // Rule-based suggestions from the numbers above (not predictions).
  const next: string[] = [];
  if (followUps.overdue) next.push(`Clear ${followUps.overdue} overdue lead follow-up(s) first.`);
  if (pendingSubmissions) next.push(`Review ${pendingSubmissions} owner / builder submission(s).`);
  if (partnerCounts.due) next.push(`Follow up with ${partnerCounts.due} partner(s) who are due.`);
  if (newPartners < 10) next.push("Add more partner contacts — aim for 10–15 researched contacts a week.");
  if (verified === 0) next.push("Verify at least 2 live listings so they can be promoted.");
  if (funnel.total === 0) next.push("No inquiries this week: share 2–3 verified listings with tracked links (Marketing drafts).");
  if (next.length === 0) next.push("Keep going: same routine, and review which source brought the best leads.");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Weekly report</h1>
          <p className="mt-1 text-sm text-muted">
            {fmt(from)} – {fmt(new Date(to.getTime() - 1))} (IST), compared with the week before. Actual recorded results only —
            no estimates or targets are mixed in.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href={`/admin/reports?weeks=${weeksAgo + 1}`} className="rounded-control border border-border px-3 py-1.5 hover:border-primary">
            ← Earlier
          </Link>
          {weeksAgo > 0 && (
            <Link href={weeksAgo === 1 ? "/admin/reports" : `/admin/reports?weeks=${weeksAgo - 1}`} className="rounded-control border border-border px-3 py-1.5 hover:border-primary">
              Later →
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportTable title="Partners & listings" rows={partnerRows} />
        <ReportTable title="Buyer inquiries" rows={leadRows} />
        <ReportTable title="Deals (entered by you)" rows={dealRows} note="Expected but unconfirmed commissions are not counted." />
        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="text-base font-semibold text-ink">Website visits</h2>
          <p className="mt-2 text-sm text-muted">
            {process.env.NEXT_PUBLIC_GA_ID
              ? "Visits are measured in Google Analytics 4 (Reports → Acquisition). They aren't copied here, so this report doesn't show a number it can't verify."
              : "Not measured yet — Google Analytics isn't configured (docs/SETUP.md §4). Until then, inquiries above are the reliable signal."}
          </p>
          <h2 className="mt-5 text-base font-semibold text-ink">Open right now</h2>
          <ul className="mt-2 text-sm text-ink">
            <li>Overdue lead follow-ups: <strong>{followUps.overdue}</strong></li>
            <li>Partner follow-ups due: <strong>{partnerCounts.due}</strong></li>
            <li>Submissions awaiting review: <strong>{pendingSubmissions}</strong></li>
          </ul>
        </section>
      </div>

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="text-base font-semibold text-ink">Recommended next actions</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-ink">
          {next.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="text-base font-semibold text-ink">Inquiries this week by source</h2>
        <p className="mt-1 text-xs text-muted">
          Source = utm_source tag, else “referral” when another site linked, else direct / unknown. Converted = current status Converted.
        </p>
        {funnel.bySource.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No inquiries in this period.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="py-2">Source</th>
                <th className="py-2 text-right">Inquiries</th>
                <th className="py-2 text-right">Converted</th>
                <th className="py-2 text-right">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {funnel.bySource.map((row) => (
                <tr key={row.source}>
                  <td className="py-2 text-ink">{row.source}</td>
                  <td className="py-2 text-right tabular-nums">{row.total}</td>
                  <td className="py-2 text-right tabular-nums">{row.converted}</td>
                  <td className="py-2 text-right tabular-nums">{rate(row.converted, row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

type Row = { label: string; now: number; prev: number; money?: boolean };

function ReportTable({ title, rows, note }: { title: string; rows: Row[]; note?: string }) {
  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <table className="mt-3 w-full text-sm">
        <thead className="text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="py-2 text-left font-semibold"> </th>
            <th className="py-2 text-right font-semibold">This week</th>
            <th className="py-2 text-right font-semibold">Previous</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="py-2 text-ink">{r.label}</td>
              <td className={cn("py-2 text-right font-semibold tabular-nums", r.now > r.prev ? "text-primary" : "text-ink")}>
                {r.money ? rupees(r.now) : r.now}
              </td>
              <td className="py-2 text-right tabular-nums text-muted">{r.money ? rupees(r.prev) : r.prev}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {note && <p className="mt-2 text-xs text-muted">{note}</p>}
    </section>
  );
}
