"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert } from "@/components/ui/Field";
import { inputClass } from "@/components/ui/styles";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils/cn";

interface ImportResult {
  created: number;
  rows: { row: number; name: string; outcome: "create" | "created" | "duplicate" | "invalid"; reason?: string }[];
}

const outcomeLabel = { create: "Will be added", created: "Added", duplicate: "Skipped — duplicate", invalid: "Skipped — invalid" };

/** Upload → preview (nothing saved) → confirm import. */
export default function PartnerImport() {
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [source, setSource] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [imported, setImported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(preview: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await api<ImportResult>("/api/partners/import", { method: "POST", body: { csv, source, preview } });
      setResult(res);
      setImported(!preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  const toCreate = result?.rows.filter((r) => r.outcome === "create").length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <FormAlert>{error}</FormAlert>
      <Field label="CSV file" hint="Headers: name, company, type, category, phone, email, city, website, source_url, contact_source, notes">
        <input
          type="file"
          accept=".csv,text/csv"
          className={inputClass}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            setResult(null);
            setImported(false);
            if (!file) return;
            if (file.size > 1_000_000) {
              setError("File is larger than 1 MB.");
              return;
            }
            setFileName(file.name);
            setCsv(await file.text());
          }}
        />
      </Field>
      <Field
        label="Where did this list come from?"
        hint="Used as the contact source for rows that don't have their own. Only import contacts you're allowed to use — never bought or scraped lists."
      >
        <input value={source} onChange={(e) => setSource(e.target.value)} maxLength={300} className={inputClass} placeholder="e.g. My research of builders' official websites, Oct 2026" />
      </Field>
      <div className="flex gap-2">
        <Button variant="outline" loading={busy && !imported} disabled={!csv || !source} onClick={() => run(true)}>
          Preview {fileName && `“${fileName}”`}
        </Button>
        {result && !imported && toCreate > 0 && (
          <Button loading={busy} onClick={() => run(false)}>
            Import {toCreate} contact{toCreate === 1 ? "" : "s"}
          </Button>
        )}
      </div>

      {result && (
        <div className="rounded-card border border-border">
          <p className="border-b border-border px-4 py-3 text-sm font-semibold text-ink">
            {imported ? `Imported ${result.created} contact(s).` : `Preview — nothing saved yet. ${toCreate} new, ${result.rows.length - toCreate} skipped.`}
            {imported && (
              <Link href="/admin/partners?status=not_contacted" className="ml-2 text-primary hover:underline">
                View them
              </Link>
            )}
          </p>
          <ul className="max-h-96 divide-y divide-border overflow-y-auto text-sm">
            {result.rows.map((r) => (
              <li key={r.row} className="flex flex-wrap gap-x-3 px-4 py-2">
                <span className="w-12 text-muted">Row {r.row}</span>
                <span className="font-medium text-ink">{r.name || "—"}</span>
                <span className={cn(r.outcome === "invalid" ? "text-danger" : r.outcome === "duplicate" ? "text-muted" : "text-primary")}>
                  {outcomeLabel[r.outcome]}
                </span>
                {r.reason && <span className="w-full pl-15 text-xs text-muted">{r.reason}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
