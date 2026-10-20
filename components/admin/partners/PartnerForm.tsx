"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, FormAlert } from "@/components/ui/Field";
import { inputClass } from "@/components/ui/styles";
import { api, ApiError } from "@/lib/api-client";
import { partnerCategories, partnerStatuses, partnerStatusLabels, partnerTypes, partnerTypeLabels } from "@/lib/constants/outreach";
import type { Partner } from "@/server/db/schema";

type Values = Record<string, string | boolean>;

const toDate = (d: Date | null | undefined) => (d ? new Date(new Date(d).getTime() + 5.5 * 3600_000).toISOString().slice(0, 10) : "");

function initial(p?: Partner): Values {
  return {
    name: p?.name ?? "",
    company: p?.company ?? "",
    partnerType: p?.partnerType ?? "builder",
    phone: p?.phone ?? "",
    email: p?.email ?? "",
    city: p?.city ?? "",
    website: p?.website ?? "",
    contactSource: p?.contactSource ?? "",
    category: p?.category ?? "",
    sourceUrl: p?.sourceUrl ?? "",
    researchedAt: p ? toDate(p.researchedAt) : toDate(new Date()),
    lastVerifiedAt: toDate(p?.lastVerifiedAt),
    nextAction: p?.nextAction ?? "",
    status: p?.status ?? "not_contacted",
    nextFollowUpAt: toDate(p?.nextFollowUpAt),
    notes: p?.notes ?? "",
    doNotContact: p?.doNotContact ?? false,
  };
}

/** Add / edit a builder or channel-partner contact. */
export default function PartnerForm({ partner }: { partner?: Partner }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(() => initial(partner));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const bind = (key: string) => ({
    value: values[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value })),
    className: inputClass,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setErrors({});
    setSaved(false);
    try {
      if (partner) {
        await api(`/api/partners/${partner.id}`, { method: "PUT", body: values });
        setSaved(true);
        router.refresh();
      } else {
        const { partner: created } = await api<{ partner: Partner }>("/api/partners", { method: "POST", body: values });
        router.push(`/admin/partners/${created.id}`);
      }
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors).length) setErrors(err.errors);
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <FormAlert>{error}</FormAlert>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact name" error={errors.name}>
          <input {...bind("name")} required maxLength={120} />
        </Field>
        <Field label="Company" error={errors.company}>
          <input {...bind("company")} maxLength={200} />
        </Field>
        <Field label="Type">
          <select {...bind("partnerType")}>
            {partnerTypes.map((t) => (
              <option key={t} value={t}>
                {partnerTypeLabels[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Business category">
          <select {...bind("category")}>
            <option value="">—</option>
            {partnerCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="City" error={errors.city}>
          <input {...bind("city")} maxLength={100} />
        </Field>
        <Field label="Phone" hint="Business number they shared or publish" error={errors.phone}>
          <input {...bind("phone")} type="tel" maxLength={30} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input {...bind("email")} type="email" maxLength={200} />
        </Field>
        <Field label="Website" error={errors.website}>
          <input {...bind("website")} type="url" placeholder="https://" maxLength={300} />
        </Field>
        <Field
          label="Where this contact came from"
          hint="e.g. Met at site office; contact page on their official website"
          error={errors.contactSource}
        >
          <input {...bind("contactSource")} required maxLength={300} />
        </Field>
        <Field label="Source page (URL)" hint="Where the public business contact details were found" error={errors.sourceUrl}>
          <input {...bind("sourceUrl")} type="url" placeholder="https://" maxLength={500} />
        </Field>
        <Field label="Date researched" error={errors.researchedAt}>
          <input {...bind("researchedAt")} type="date" />
        </Field>
        <Field label="Contact details last verified" error={errors.lastVerifiedAt}>
          <input {...bind("lastVerifiedAt")} type="date" />
        </Field>
        <Field label="Status">
          <select {...bind("status")}>
            {partnerStatuses.map((s) => (
              <option key={s} value={s}>
                {partnerStatusLabels[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Next follow-up" error={errors.nextFollowUpAt}>
          <input {...bind("nextFollowUpAt")} type="date" />
        </Field>
      </div>
      <Field label="Next action" error={errors.nextAction}>
        <input {...bind("nextAction")} maxLength={300} placeholder="e.g. Call sales head on Monday, send demo link" />
      </Field>
      <Field label="Notes" error={errors.notes}>
        <textarea {...bind("notes")} rows={4} maxLength={5000} placeholder="Projects, decision maker, what they care about…" />
      </Field>
      <Checkbox
        label="Do not contact"
        description="They asked not to be contacted. Message templates are disabled."
        checked={values.doNotContact as boolean}
        onChange={(e) => setValues((v) => ({ ...v, doNotContact: e.target.checked }))}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" loading={saving}>
          {partner ? "Save changes" : "Add contact"}
        </Button>
        {saved && <span className="text-sm text-primary">Saved.</span>}
      </div>
    </form>
  );
}
