"use client";

import { useState } from "react";
import { Check, Copy, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/styles";
import { api } from "@/lib/api-client";
import type { MarketingDraft } from "@/lib/marketing-drafts";

/** One editable draft: copy it, or save it to the Content tracker as "Needs review". Never posts anything. */
export function DraftCard({ draft, propertyTitle, city }: { draft: MarketingDraft; propertyTitle: string; city: string }) {
  const [text, setText] = useState(draft.text);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");

  return (
    <section className="rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-ink">{draft.label}</h3>
        <span className="text-xs text-muted">{draft.channel}</span>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={Math.min(14, text.split("\n").length + 2)} className={`${inputClass} mt-2 font-mono text-xs`} />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          loading={saved === "saving"}
          disabled={saved === "saved"}
          onClick={async () => {
            setSaved("saving");
            try {
              await api("/api/content", {
                method: "POST",
                body: {
                  title: `${draft.label}: ${propertyTitle}`,
                  contentType: draft.id === "instagram" || draft.id === "whatsapp-status" || draft.id === "video" ? "social_post" : "project_update",
                  city,
                  status: "review",
                  notes: text,
                },
              });
              setSaved("saved");
            } catch {
              setSaved("error");
            }
          }}
        >
          <FilePlus2 className="h-4 w-4" />
          {saved === "saved" ? "Saved to Content (Needs review)" : saved === "error" ? "Couldn't save — retry" : "Save to Content tracker"}
        </Button>
      </div>
    </section>
  );
}
