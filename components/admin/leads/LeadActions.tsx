"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/Field";
import { inputClass } from "@/components/ui/styles";
import { api } from "@/lib/api-client";
import {
  budgetOptions,
  commissionStatuses,
  commissionStatusLabels,
  leadResponseLabels,
  leadResponses,
  purchaseTimelines,
  type LeadResponse,
  type LeadStatus,
} from "@/lib/constants/lead";
import { templatesForStage, whatsappLink } from "@/lib/lead-messages";
import { cn } from "@/lib/utils/cn";
import { followUpInDays, toIstInputValue } from "@/lib/utils/dates";

/** Shared save helper: calls the API, refreshes the server-rendered page, shows errors. */
function useSave() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save(url: string, method: "PATCH" | "POST", body: unknown): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      await api(url, { method, body });
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      return false;
    } finally {
      setSaving(false);
    }
  }
  return { save, saving, error };
}

export function FollowUpEditor({ id, followUpAt, disabled }: { id: number; followUpAt: string | null; disabled?: boolean }) {
  const [value, setValue] = useState(toIstInputValue(followUpAt ? new Date(followUpAt) : null));
  const { save, saving, error } = useSave();
  const quick = [
    { label: "Tomorrow", days: 1 },
    { label: "In 3 days", days: 3 },
    { label: "Next week", days: 7 },
  ];

  return (
    <div className="flex flex-col gap-2">
      <FormAlert>{error}</FormAlert>
      <div className="flex flex-wrap gap-2">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          aria-label="Follow-up date and time (IST)"
          className={cn(inputClass, "w-auto")}
        />
        <Button size="sm" loading={saving} disabled={disabled || !value} onClick={() => save(`/api/leads/${id}`, "PATCH", { followUpAt: value })}>
          Save
        </Button>
        {followUpAt && (
          <Button
            size="sm"
            variant="ghost"
            disabled={saving || disabled}
            onClick={async () => {
              if (await save(`/api/leads/${id}`, "PATCH", { followUpAt: null })) setValue("");
            }}
          >
            Clear
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {quick.map((q) => (
          <button
            key={q.days}
            type="button"
            disabled={saving || disabled}
            onClick={async () => {
              const at = toIstInputValue(followUpInDays(q.days));
              if (await save(`/api/leads/${id}`, "PATCH", { followUpAt: at })) setValue(at);
            }}
            className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NoteForm({ id }: { id: number }) {
  const [note, setNote] = useState("");
  const { save, saving, error } = useSave();
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await save(`/api/leads/${id}/activities`, "POST", { type: "note", note })) setNote("");
      }}
    >
      <FormAlert>{error}</FormAlert>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={2000}
        placeholder="Add a note — requirement, budget, preferred location…"
        className={inputClass}
      />
      <Button type="submit" size="sm" loading={saving} disabled={!note.trim()} className="self-start">
        Add note
      </Button>
    </form>
  );
}

export function CallLogger({ id, phone }: { id: number; phone: string }) {
  const [outcome, setOutcome] = useState("");
  const { save, saving, error } = useSave();
  const outcomes = ["Spoke — interested", "Spoke — not interested", "No answer", "Busy / call back", "Wrong number"];
  return (
    <div className="flex flex-col gap-2">
      <FormAlert>{error}</FormAlert>
      <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary hover:underline">
        <PhoneCall className="h-4 w-4" /> Call {phone}
      </a>
      <div className="flex flex-wrap gap-2">
        <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className={cn(inputClass, "w-auto")} aria-label="Call outcome">
          <option value="">Call outcome…</option>
          {outcomes.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <Button
          size="sm"
          variant="outline"
          loading={saving}
          disabled={!outcome}
          onClick={async () => {
            if (await save(`/api/leads/${id}/activities`, "POST", { type: "call", note: outcome })) setOutcome("");
          }}
        >
          Log call
        </Button>
      </div>
    </div>
  );
}

/**
 * Picks a template, lets the admin edit it, then opens WhatsApp with the text filled in. The admin
 * reviews and presses Send in WhatsApp themselves; we only record that the chat was opened.
 */
export function WhatsAppComposer({
  id,
  phone,
  name,
  projectTitle,
  senderName,
  stage,
}: {
  id: number;
  phone: string;
  name: string;
  projectTitle: string;
  senderName: string;
  stage: LeadStatus;
}) {
  const context = { name, projectTitle, senderName };
  const templates = templatesForStage(stage);
  const [templateId, setTemplateId] = useState(templates[0].id);
  const [text, setText] = useState(templates[0].build(context));
  const { save, error } = useSave();

  return (
    <div className="flex flex-col gap-2">
      <FormAlert>{error}</FormAlert>
      <div className="flex flex-wrap gap-1.5">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTemplateId(t.id);
              setText(t.build(context));
            }}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium",
              templateId === t.id ? "border-primary bg-primary-soft text-primary" : "border-border text-muted hover:text-ink"
            )}
          >
            {t.label}
            {t.stages.includes(stage) && <span className="ml-1 text-[10px] uppercase text-primary">suggested</span>}
          </button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={1500} className={inputClass} />
      <a
        href={whatsappLink(phone, text)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => void save(`/api/leads/${id}/activities`, "POST", { type: "whatsapp_opened", note: text.slice(0, 500) })}
        className="inline-flex items-center justify-center gap-2 self-start rounded-control bg-whatsapp px-4 py-2 text-sm font-semibold text-on-primary hover:bg-whatsapp-hover"
      >
        <MessageCircle className="h-4 w-4" /> Open in WhatsApp
      </a>
      <p className="text-xs text-muted">
        Opens WhatsApp with this text. Review it and press Send there — the history records that you opened the chat, not
        that the message was delivered.
      </p>
    </div>
  );
}

export function OptOutToggle({ id, optedOut }: { id: number; optedOut: boolean }) {
  const { save, saving, error } = useSave();
  return (
    <div className="flex flex-col gap-2">
      <FormAlert>{error}</FormAlert>
      <Button
        size="sm"
        variant={optedOut ? "outline" : "danger"}
        loading={saving}
        onClick={() => {
          const message = optedOut
            ? "Remove do-not-contact? Only do this if the person asked to be contacted again."
            : "Mark as do-not-contact? Call and WhatsApp actions will be hidden and follow-ups cleared.";
          if (window.confirm(message)) void save(`/api/leads/${id}`, "PATCH", { optedOut: !optedOut });
        }}
        className="self-start"
      >
        {optedOut ? "Remove do-not-contact" : "Mark do-not-contact"}
      </Button>
    </div>
  );
}

/** "What did the buyer say?" — one click records the reply and moves the lead on. */
export function ResponseRecorder({ id }: { id: number }) {
  const [note, setNote] = useState("");
  const [later, setLater] = useState(toIstInputValue(followUpInDays(3)));
  const [pending, setPending] = useState<LeadResponse | null>(null);
  const { save, saving, error } = useSave();
  const hints: Record<LeadResponse, string> = {
    replied: "Logs the reply; a New lead moves to Contacted.",
    declined: "Moves the lead to Lost and clears the follow-up.",
    later: "Schedules the next follow-up at the time below.",
  };
  return (
    <div className="flex flex-col gap-2">
      <FormAlert>{error}</FormAlert>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={2000}
        placeholder="What did they say? (optional)"
        className={inputClass}
      />
      <label className="flex items-center gap-2 text-xs text-muted">
        Follow up later on
        <input type="datetime-local" value={later} onChange={(e) => setLater(e.target.value)} className={cn(inputClass, "w-auto py-1")} />
      </label>
      <div className="flex flex-wrap gap-2">
        {leadResponses.map((outcome) => (
          <Button
            key={outcome}
            size="sm"
            variant={outcome === "declined" ? "danger" : "outline"}
            loading={saving && pending === outcome}
            disabled={saving}
            title={hints[outcome]}
            onClick={async () => {
              if (outcome === "declined" && !window.confirm("Mark this lead as Lost?")) return;
              setPending(outcome);
              const ok = await save(`/api/leads/${id}/response`, "POST", { outcome, note, followUpAt: outcome === "later" ? later : "" });
              if (ok) setNote("");
              setPending(null);
            }}
          >
            {leadResponseLabels[outcome]}
          </Button>
        ))}
      </div>
    </div>
  );
}

/** Buyer requirement + next action, editable after a call. */
export function RequirementEditor({
  id,
  initial,
}: {
  id: number;
  initial: { preferredLocation: string; preferredPropertyType: string; timeline: string; budget: string; nextAction: string };
}) {
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(false);
  const { save, saving, error } = useSave();
  const bind = (key: keyof typeof values) => ({
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setSaved(false);
      setValues((v) => ({ ...v, [key]: e.target.value }));
    },
    className: inputClass,
  });
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await save(`/api/leads/${id}`, "PATCH", values)) setSaved(true);
      }}
    >
      <FormAlert>{error}</FormAlert>
      <input {...bind("preferredLocation")} maxLength={200} placeholder="Preferred location, e.g. Sector 150 / Noida Extension" aria-label="Preferred location" />
      <input {...bind("preferredPropertyType")} maxLength={100} placeholder="Property type, e.g. 3 BHK apartment, plot" aria-label="Property type" />
      <div className="grid grid-cols-2 gap-2">
        <select {...bind("budget")} aria-label="Budget">
          <option value="">Budget</option>
          {budgetOptions.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <select {...bind("timeline")} aria-label="Timeline">
          <option value="">Timeline</option>
          {purchaseTimelines.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <input {...bind("nextAction")} maxLength={300} placeholder="Next action, e.g. Send floor plans after 6 pm" aria-label="Next action" />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" loading={saving}>
          Save
        </Button>
        {saved && <span className="text-xs text-primary">Saved.</span>}
      </div>
    </form>
  );
}

/** Deal value and commission — entered by hand, only "confirmed" / "received" count as revenue. */
export function DealEditor({
  id,
  initial,
}: {
  id: number;
  initial: { dealValue: number; commissionAmount: number; commissionStatus: string };
}) {
  const [dealValue, setDealValue] = useState(initial.dealValue ? String(initial.dealValue) : "");
  const [commissionAmount, setCommissionAmount] = useState(initial.commissionAmount ? String(initial.commissionAmount) : "");
  const [commissionStatus, setCommissionStatus] = useState(initial.commissionStatus);
  const [saved, setSaved] = useState(false);
  const { save, saving, error } = useSave();
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await save(`/api/leads/${id}`, "PATCH", {
          dealValue: Number(dealValue) || 0,
          commissionAmount: Number(commissionAmount) || 0,
          commissionStatus,
        });
        if (ok) setSaved(true);
      }}
    >
      <FormAlert>{error}</FormAlert>
      <label className="text-xs text-muted">
        Deal value (₹)
        <input value={dealValue} onChange={(e) => setDealValue(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={inputClass} />
      </label>
      <label className="text-xs text-muted">
        Commission (₹)
        <input value={commissionAmount} onChange={(e) => setCommissionAmount(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={inputClass} />
      </label>
      <select value={commissionStatus} onChange={(e) => setCommissionStatus(e.target.value)} className={inputClass} aria-label="Commission status">
        {commissionStatuses.map((c) => (
          <option key={c} value={c}>
            {commissionStatusLabels[c]}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" variant="outline" loading={saving}>
          Save deal
        </Button>
        {saved && <span className="text-xs text-primary">Saved.</span>}
      </div>
      <p className="text-xs text-muted">Reports count only Confirmed / Received commissions as actual revenue.</p>
    </form>
  );
}
