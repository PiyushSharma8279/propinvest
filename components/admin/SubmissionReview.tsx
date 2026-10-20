"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/Field";
import { inputClass } from "@/components/ui/styles";
import { api } from "@/lib/api-client";
import type { ReviewAction, SubmissionStatus } from "@/lib/constants/submission";

const actionsFor: Record<SubmissionStatus, { action: ReviewAction; label: string; variant: "primary" | "outline" | "danger" }[]> = {
  pending: [
    { action: "approve", label: "Approve → create draft listing", variant: "primary" },
    { action: "needs_correction", label: "Ask for corrections", variant: "outline" },
    { action: "reject", label: "Reject", variant: "danger" },
  ],
  needs_correction: [
    { action: "approve", label: "Approve → create draft listing", variant: "primary" },
    { action: "reject", label: "Reject", variant: "danger" },
  ],
  approved: [{ action: "suspend", label: "Suspend", variant: "danger" }],
  rejected: [{ action: "reopen", label: "Reopen", variant: "outline" }],
  suspended: [{ action: "reopen", label: "Reopen", variant: "outline" }],
};

export default function SubmissionReview({ id, status, hasProperty }: { id: number; status: SubmissionStatus; hasProperty: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<ReviewAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: ReviewAction) {
    if (action === "approve" && !window.confirm("Create a draft listing from this submission? It will NOT be published until you edit and publish it.")) return;
    setBusy(action);
    setError(null);
    try {
      const { propertyId } = await api<{ propertyId: number | null }>(`/api/submissions/${id}/review`, { method: "POST", body: { action, note } });
      if (action === "approve" && propertyId) router.push(`/admin/properties/${propertyId}/edit`);
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <FormAlert>{error}</FormAlert>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Review note — required to ask for corrections, reject or suspend (e.g. Need ownership proof; photos look like another portal's)"
        className={inputClass}
      />
      <div className="flex flex-wrap gap-2">
        {actionsFor[status]
          .filter((a) => !(a.action === "approve" && hasProperty))
          .map((a) => (
            <Button key={a.action} size="sm" variant={a.variant} loading={busy === a.action} disabled={busy !== null} onClick={() => run(a.action)}>
              {a.label}
            </Button>
          ))}
      </div>
      <p className="text-xs text-muted">
        Before approving: confirm ownership or written authorisation, check the RERA number on the UP RERA portal (for projects),
        and make sure the photos are theirs. Reply to the submitter yourself — no automatic message is sent.
      </p>
    </div>
  );
}
