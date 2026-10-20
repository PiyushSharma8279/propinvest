"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormAlert } from "@/components/ui/Field";
import { api } from "@/lib/api-client";
import { onboardingChecklist } from "@/lib/constants/outreach";

/** Tick-list of what must be in place before a partner's listings go live. */
export default function OnboardingChecklist({ id, done }: { id: number; done: Record<string, string> }) {
  const router = useRouter();
  const [state, setState] = useState(done);
  const [error, setError] = useState<string | null>(null);
  const count = onboardingChecklist.filter((i) => state[i.id]).length;

  async function toggle(item: string, checked: boolean) {
    const previous = state;
    setState((s) => {
      const next = { ...s };
      if (checked) next[item] = new Date().toISOString();
      else delete next[item];
      return next;
    });
    setError(null);
    try {
      await api(`/api/partners/${id}/onboarding`, { method: "PATCH", body: { item, done: checked } });
      router.refresh();
    } catch (err) {
      setState(previous);
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <FormAlert>{error}</FormAlert>
      <p className="text-xs text-muted">
        {count} of {onboardingChecklist.length} done
      </p>
      {onboardingChecklist.map((item) => (
        <label key={item.id} className="flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={Boolean(state[item.id])}
            onChange={(e) => toggle(item.id, e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>
            {item.label}
            {state[item.id] && (
              <span className="block text-xs text-muted">
                {new Date(state[item.id]).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
              </span>
            )}
          </span>
        </label>
      ))}
    </div>
  );
}
