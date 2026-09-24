"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { inputClass } from "@/components/ui/styles";

/**
 * A list of short values (BHK options, plot sizes, amenities) with one-click presets.
 * Submitted as a single hidden input, joined with newlines.
 */
export default function TagField({
  name,
  values,
  onChange,
  presets,
  placeholder,
}: {
  name: string;
  values: string[];
  onChange: (values: string[]) => void;
  presets: string[];
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function add(value: string) {
    const parts = value
      .split(/[,\n]/)
      .map((v) => v.trim())
      .filter(Boolean);
    const next = [...values];
    for (const part of parts) {
      if (!next.some((v) => v.toLowerCase() === part.toLowerCase())) next.push(part);
    }
    onChange(next);
  }

  function toggle(value: string) {
    if (values.includes(value)) onChange(values.filter((v) => v !== value));
    else onChange([...values, value]);
  }

  const unusedPresets = presets.filter((p) => !values.includes(p));

  return (
    <div>
      <input type="hidden" name={name} value={values.join("\n")} />

      {values.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <li
              key={value}
              className="inline-flex items-center gap-1 rounded-full bg-teal-900 py-1 pl-3 pr-1 text-sm text-cream"
            >
              {value}
              <button
                type="button"
                onClick={() => toggle(value)}
                aria-label={`Remove ${value}`}
                className="grid h-5 w-5 place-items-center rounded-full hover:bg-cream/20"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
              setDraft("");
            }
          }}
          placeholder={placeholder}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => {
            add(draft);
            setDraft("");
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-white px-3 text-sm font-medium text-ink-900 hover:border-teal-900"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {unusedPresets.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unusedPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => toggle(preset)}
              className="rounded-full border border-dashed border-border bg-white px-2.5 py-1 text-xs text-slate-600 hover:border-teal-600 hover:text-teal-900"
            >
              + {preset}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
