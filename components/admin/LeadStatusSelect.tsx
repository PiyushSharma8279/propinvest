"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { leadStatuses, leadStatusLabels, type LeadStatus } from "@/lib/constants/lead";
import { cn } from "@/lib/utils/cn";

const tone: Record<LeadStatus, string> = {
  new: "border-highlight bg-highlight-soft text-ink",
  contacted: "border-info/40 bg-info-soft text-info",
  site_visit: "border-primary/40 bg-primary-soft text-primary",
  closed: "border-primary bg-primary text-on-primary",
  not_interested: "border-border bg-surface-muted text-muted",
};

/** Follow-up stage dropdown in the admin leads table; saves on change. */
export default function LeadStatusSelect({ id, status }: { id: number; status: LeadStatus }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function change(next: LeadStatus) {
    const previous = value;
    setValue(next);
    setSaving(true);
    try {
      await api(`/api/leads/${id}`, { method: "PATCH", body: { status: next } });
      router.refresh(); // update the tab counts
    } catch {
      setValue(previous);
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(e) => change(e.target.value as LeadStatus)}
      aria-label="Lead status"
      className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold disabled:opacity-60", tone[value])}
    >
      {leadStatuses.map((s) => (
        <option key={s} value={s}>
          {leadStatusLabels[s]}
        </option>
      ))}
    </select>
  );
}
