import type { Metadata } from "next";
import { formatIst } from "@/lib/utils/dates";
import { recentAudit } from "@/server/services/audit.service";

export const metadata: Metadata = { title: "Audit log" };

const entityLinks: Record<string, (id: number) => string> = {
  property: (id) => `/admin/properties/${id}/edit`,
  lead: (id) => `/admin/leads/${id}`,
  submission: (id) => `/admin/submissions/${id}`,
  partner: (id) => `/admin/partners/${id}`,
};

/** Last 200 sensitive admin actions: listing changes, exports, imports, approvals, opt-outs, commissions. */
export default async function AuditPage() {
  const entries = await recentAudit(200);
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Audit log</h1>
      <p className="mt-1 text-sm text-muted">Who changed what. Read-only; customer names and numbers are not stored here.</p>
      <div className="mt-6 overflow-x-auto rounded-card border border-border bg-surface shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted/60 text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Who</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Record</th>
              <th className="px-4 py-3">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Nothing recorded yet.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-muted tabular-nums">{formatIst(e.createdAt)}</td>
                  <td className="px-4 py-2 text-ink">{e.userName ?? "—"}</td>
                  <td className="px-4 py-2 font-medium text-ink">{e.action}</td>
                  <td className="px-4 py-2">
                    {e.entityId && entityLinks[e.entity] ? (
                      <a href={entityLinks[e.entity](e.entityId)} className="text-primary hover:underline">
                        {e.entity} #{e.entityId}
                      </a>
                    ) : (
                      e.entity
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted">{e.summary}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
