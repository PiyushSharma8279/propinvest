"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert } from "@/components/ui/Field";
import { inputClass } from "@/components/ui/styles";
import { api, ApiError, MAX_UPLOAD_MB } from "@/lib/api-client";
import { trackEvent } from "@/lib/analytics";
import { areaUnits, categories, categoryLabels, propertyTypes, type PropertyCategory } from "@/lib/constants/property";
import {
  contactMethodLabels,
  contactMethods,
  MAX_SUBMISSION_IMAGES,
  SUBMISSION_AUTHORIZATION_TEXT,
  submitterTypeLabels,
  submitterTypes,
} from "@/lib/constants/submission";
import { cn } from "@/lib/utils/cn";

/** Public form for owners / builders / authorised partners. Everything is reviewed before it goes live. */
export default function SubmissionForm() {
  const [category, setCategory] = useState<PropertyCategory>("Residential");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    const room = MAX_SUBMISSION_IMAGES - images.length;
    for (const file of Array.from(files).slice(0, room)) {
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        setError(`${file.name} is larger than ${MAX_UPLOAD_MB} MB.`);
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/submissions/upload", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Upload failed.");
        setImages((list) => [...list, data.url]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      await api("/api/submissions", {
        method: "POST",
        body: { ...data, images, authorizationConfirmed: data.authorizationConfirmed === "on" },
      });
      trackEvent("submit_property", { category });
      setSent(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors).length) {
        setErrors(err.errors);
        setError("Please fix the highlighted fields.");
      } else setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-primary" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-ink">Thank you — we&apos;ve received your property.</h2>
        <p className="max-w-md text-sm text-muted">
          Our team will review the details and contact you on your preferred channel, usually within 2 working days. We may
          ask for documents (ownership proof, RERA details, price list) before anything is published.
        </p>
        <Link href="/projects" className="text-sm font-semibold text-primary hover:underline">
          Browse current listings
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <FormAlert>{error}</FormAlert>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-base font-semibold text-ink">About you</legend>
        <Field label="Your name" error={errors.name}>
          <input name="name" required autoComplete="name" maxLength={100} className={inputClass} />
        </Field>
        <Field label="Mobile number" error={errors.phone}>
          <input name="phone" type="tel" required inputMode="tel" autoComplete="tel" maxLength={20} className={inputClass} />
        </Field>
        <Field label="Email (optional)" error={errors.email}>
          <input name="email" type="email" autoComplete="email" maxLength={200} className={inputClass} />
        </Field>
        <Field label="You are a">
          <select name="submitterType" defaultValue="owner" className={inputClass}>
            {submitterTypes.map((t) => (
              <option key={t} value={t}>
                {submitterTypeLabels[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Best way to reach you">
          <select name="preferredContact" defaultValue="whatsapp" className={inputClass}>
            {contactMethods.map((m) => (
              <option key={m} value={m}>
                {contactMethodLabels[m]}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-base font-semibold text-ink">The property</legend>
        <Field label="Short title" error={errors.title} className="sm:col-span-2">
          <input name="title" required maxLength={150} placeholder="e.g. 3 BHK apartment in Sector 150" className={inputClass} />
        </Field>
        <Field label="Category" error={errors.category}>
          <select name="category" value={category} onChange={(e) => setCategory(e.target.value as PropertyCategory)} className={inputClass}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Property type" error={errors.propertyType}>
          <select name="propertyType" key={category} defaultValue={propertyTypes[category][0]} className={inputClass}>
            {propertyTypes[category].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Sector / locality" error={errors.locality}>
          <input name="locality" required maxLength={150} placeholder="e.g. Sector 150" className={inputClass} />
        </Field>
        <Field label="City" error={errors.city}>
          <input name="city" required maxLength={100} defaultValue="Noida" className={inputClass} />
        </Field>
        <Field label="Address (optional — kept private until approved)" className="sm:col-span-2">
          <input name="address" maxLength={300} className={inputClass} />
        </Field>
        <Field label="Expected price (₹, optional)" hint="Full amount, e.g. 8500000" error={errors.price}>
          <input name="price" inputMode="numeric" maxLength={12} className={inputClass} />
        </Field>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Field label="Size (optional)" error={errors.area}>
            <input name="area" inputMode="decimal" maxLength={10} className={inputClass} />
          </Field>
          <Field label="Unit">
            <select name="areaUnit" defaultValue="sq.ft." className={inputClass}>
              {areaUnits.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="RERA number (if a registered project)" error={errors.reraNumber}>
          <input name="reraNumber" maxLength={100} placeholder="e.g. UPRERAPRJ123456" className={inputClass} />
        </Field>
        <Field label="Description" error={errors.description} className="sm:col-span-2">
          <textarea
            name="description"
            required
            rows={4}
            maxLength={3000}
            placeholder="Floor, facing, condition, amenities, possession / availability, anything a buyer should know"
            className={inputClass}
          />
        </Field>
      </fieldset>

      <div>
        <p className="text-base font-semibold text-ink">Photos (optional, up to {MAX_SUBMISSION_IMAGES})</p>
        <p className="text-xs text-muted">Only photos you took or have permission to share. JPG, PNG or WebP, max {MAX_UPLOAD_MB} MB each.</p>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((url) => (
            <div key={url} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-muted">
              <Image src={url} alt="Uploaded property photo" fill sizes="160px" className="object-cover" />
              <button
                type="button"
                onClick={() => setImages((list) => list.filter((u) => u !== url))}
                className="absolute right-1 top-1 rounded-full bg-ink/70 p-1 text-on-primary"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {images.length + uploading < MAX_SUBMISSION_IMAGES && (
            <label
              className={cn(
                "flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted hover:border-primary hover:text-primary",
                uploading > 0 && "pointer-events-none opacity-60"
              )}
            >
              {uploading > 0 ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              {uploading > 0 ? "Uploading…" : "Add photos"}
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => addPhotos(e.target.files)} />
            </label>
          )}
        </div>
      </div>

      <label className={cn("flex items-start gap-2 rounded-card border p-3 text-sm", errors.authorizationConfirmed ? "border-danger" : "border-border")}>
        <input type="checkbox" name="authorizationConfirmed" required className="mt-0.5 h-4 w-4 accent-primary" />
        <span className="text-ink">
          {SUBMISSION_AUTHORIZATION_TEXT}
          {errors.authorizationConfirmed && <span className="mt-1 block text-xs text-danger">{errors.authorizationConfirmed}</span>}
        </span>
      </label>

      {/* Honeypot: hidden from people, filled in by bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      <div className="flex flex-col gap-2">
        <Button type="submit" loading={saving} disabled={uploading > 0} className="w-full sm:w-auto sm:self-start">
          Submit for review
        </Button>
        <p className="text-xs text-muted">
          Nothing is published until our team has reviewed it. See our{" "}
          <Link href="/privacy" className="underline hover:text-primary">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
