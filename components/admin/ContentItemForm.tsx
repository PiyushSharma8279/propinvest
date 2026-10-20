"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert } from "@/components/ui/Field";
import { inputClass } from "@/components/ui/styles";
import { api, ApiError } from "@/lib/api-client";
import { contentStatuses, contentStatusLabels, contentTypes, contentTypeLabels } from "@/lib/constants/outreach";
import type { ContentIdea } from "@/server/db/schema";

/** Add or edit one content idea. Setting "Published" only records it — it never publishes anything. */
export default function ContentItemForm({ item, onDone }: { item?: ContentIdea; onDone?: () => void }) {
  const router = useRouter();
  const [values, setValues] = useState({
    title: item?.title ?? "",
    contentType: item?.contentType ?? "location_guide",
    targetKeyword: item?.targetKeyword ?? "",
    city: item?.city ?? "",
    status: item?.status ?? "idea",
    url: item?.url ?? "",
    notes: item?.notes ?? "",
    dueDate: item?.dueDate ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const bind = (key: keyof typeof values) => ({
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value })),
    className: inputClass,
  });

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setErrors({});
        try {
          await api(item ? `/api/content/${item.id}` : "/api/content", { method: item ? "PUT" : "POST", body: values });
          if (!item) setValues((v) => ({ ...v, title: "", targetKeyword: "", notes: "", url: "", dueDate: "" }));
          router.refresh();
          onDone?.();
        } catch (err) {
          if (err instanceof ApiError) setErrors(err.errors);
          setError(err instanceof Error ? err.message : "Could not save.");
        } finally {
          setSaving(false);
        }
      }}
    >
      <FormAlert>{error}</FormAlert>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Working title" error={errors.title} className="sm:col-span-2">
          <input {...bind("title")} maxLength={200} placeholder="e.g. Living in Sector 150, Noida: a buyer's guide" />
        </Field>
        <Field label="Type">
          <select {...bind("contentType")}>
            {contentTypes.map((t) => (
              <option key={t} value={t}>
                {contentTypeLabels[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select {...bind("status")}>
            {contentStatuses.map((s) => (
              <option key={s} value={s}>
                {contentStatusLabels[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Target search phrase">
          <input {...bind("targetKeyword")} maxLength={200} placeholder="e.g. sector 150 noida flats" />
        </Field>
        <Field label="City">
          <input {...bind("city")} maxLength={100} />
        </Field>
        <Field label="Due" error={errors.dueDate}>
          <input {...bind("dueDate")} type="date" />
        </Field>
        <Field label="Published link" error={errors.url}>
          <input {...bind("url")} type="url" placeholder="https://" maxLength={500} />
        </Field>
      </div>
      <Field label="Notes / sources">
        <textarea {...bind("notes")} rows={2} maxLength={5000} placeholder="Outline, facts to check, sources to cite…" />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={saving}>
          {item ? "Save" : "Add idea"}
        </Button>
        {onDone && (
          <Button size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function ContentRow({ item, children }: { item: ContentIdea; children: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
  return editing ? (
    <div className="p-4">
      <ContentItemForm item={item} onDone={() => setEditing(false)} />
    </div>
  ) : (
    <button type="button" onClick={() => setEditing(true)} className="block w-full p-4 text-left transition hover:bg-canvas">
      {children}
    </button>
  );
}
