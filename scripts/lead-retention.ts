/**
 * Removes personal details from old leads, keeping the row (status, dates, project, source) so
 * reports stay correct. Applies to leads that are Converted / Lost / do-not-contact and whose
 * last activity is older than LEAD_RETENTION_DAYS (default 730 = 24 months, as in /privacy).
 *
 *   npm run leads:retention              dry run — prints how many leads would be anonymised
 *   npm run leads:retention -- --apply   actually anonymises them (irreversible; back up first)
 */
import { and, eq, inArray, lt, or, sql } from "drizzle-orm";
import { db, schema } from "./db";

const { leads, leadActivities } = schema;
const days = Number(process.env.LEAD_RETENTION_DAYS) || 730;
const apply = process.argv.includes("--apply");

async function main() {
  const cutoff = new Date(Date.now() - days * 86_400_000);
  const candidates = await db
    .select({ id: leads.id })
    .from(leads)
    .where(
      and(
        or(inArray(leads.status, ["closed", "not_interested"]), eq(leads.optedOut, true)),
        lt(sql`greatest(${leads.updatedAt}, coalesce(${leads.lastContactedAt}, ${leads.createdAt}))`, cutoff),
        sql`${leads.name} <> 'Removed'`
      )
    );
  const ids = candidates.map((c) => c.id);
  console.log(`${ids.length} lead(s) older than ${days} days would be anonymised (cut-off ${cutoff.toISOString().slice(0, 10)}).`);
  if (!apply || ids.length === 0) {
    if (!apply) console.log("Dry run — nothing changed. Re-run with --apply to anonymise.");
    return;
  }
  for (let i = 0; i < ids.length; i += 500) {
    const batch = ids.slice(i, i + 500);
    await db
      .update(leads)
      .set({ name: "Removed", phone: "", message: "", budget: "", pageUrl: "", referrer: "", landingPage: "" })
      .where(inArray(leads.id, batch));
    // Notes and message texts can contain personal details too.
    await db.update(leadActivities).set({ note: "", meta: {} }).where(inArray(leadActivities.leadId, batch));
  }
  console.log(`Anonymised ${ids.length} lead(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
