"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert } from "@/components/ui/Field";
import { inputClass } from "@/components/ui/styles";
import { trackEvent } from "@/lib/analytics";
import { api, ApiError } from "@/lib/api-client";
import { budgetOptions, type LeadSource } from "@/lib/constants/lead";

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      const result = await api<{ brochureUrl: string }>("/api/leads", {
        method: "POST",
        body: { ...data, source, propertyId, pageUrl: window.location.href },
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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
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
        <Field label="Message (optional)">
          <textarea name="message" rows={2} maxLength={1000} className={inputClass} placeholder="Best time to call, site visit date…" />
        </Field>
      )}
      {/* Honeypot: hidden from people, filled in by bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <Button type="submit" loading={saving} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
