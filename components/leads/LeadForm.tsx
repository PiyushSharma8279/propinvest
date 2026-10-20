"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert } from "@/components/ui/Field";
import { inputClass } from "@/components/ui/styles";
import { trackEvent } from "@/lib/analytics";
import { getAttribution } from "@/lib/attribution";
import { api, ApiError } from "@/lib/api-client";
import { budgetOptions, purchaseTimelines, type LeadSource } from "@/lib/constants/lead";

interface LeadFormProps {
  source: LeadSource;
  propertyId?: number;
  projectTitle?: string;
  submitLabel: string;
  /** Show the optional message box (enquiry form only). */
  withMessage?: boolean;
  onSuccess: (result: { brochureUrl: string }) => void;
}

/** Name + mobile + budget form that saves a lead through POST /api/leads. */
export default function LeadForm({
  source,
  propertyId,
  projectTitle,
  submitLabel,
  withMessage = false,
  onSuccess,
}: LeadFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const started = useRef(false);

  /** One "form_start" event per form, on the first field the visitor touches. */
  function handleFocus() {
    if (started.current) return;
    started.current = true;
    trackEvent("form_start", { project_name: projectTitle ?? "site enquiry", lead_source: source });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      const result = await api<{ brochureUrl: string }>("/api/leads", {
        method: "POST",
        body: {
          ...data,
          marketingOptIn: data.marketingOptIn === "on",
          source,
          propertyId,
          pageUrl: window.location.href,
          ...getAttribution(),
        },
      });
      trackEvent("generate_lead", { project_name: projectTitle ?? "site enquiry", lead_source: source });
      onSuccess(result);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors).length) setErrors(err.errors);
      else setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} onFocus={handleFocus} noValidate className="flex flex-col gap-3">
      <FormAlert>{error}</FormAlert>
      <Field label="Your name" error={errors.name}>
        <input name="name" required autoComplete="name" maxLength={80} className={inputClass} />
      </Field>
      <Field label="Mobile number" error={errors.phone}>
        <input
          name="phone"
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="10-digit mobile number"
          maxLength={20}
          className={inputClass}
        />
      </Field>
      <Field label="Budget (optional)">
        <select name="budget" defaultValue="" className={inputClass}>
          <option value="">Select budget</option>
          {budgetOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </Field>
      {withMessage && (
        <Field label="When are you planning to buy? (optional)">
          <select name="timeline" defaultValue="" className={inputClass}>
            <option value="">Select</option>
            {purchaseTimelines.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      )}
      {withMessage && (
        <Field label="Message (optional)" error={errors.message}>
          <textarea name="message" rows={2} maxLength={1000} className={inputClass} placeholder="Best time to call, site visit date…" />
        </Field>
      )}
      {/* Honeypot: hidden from people, filled in by bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="flex items-start gap-2 text-xs text-muted">
        <input type="checkbox" name="marketingOptIn" className="mt-0.5 h-3.5 w-3.5 accent-primary" />
        <span>Also send me similar projects on WhatsApp (optional, unsubscribe anytime).</span>
      </label>
      <Button type="submit" loading={saving} className="w-full">
        {submitLabel}
      </Button>
      <p className="text-[11px] leading-snug text-subtle">
        We use your details only to contact you about this enquiry, by call or WhatsApp. See our{" "}
        <Link href="/privacy" className="underline hover:text-primary">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
