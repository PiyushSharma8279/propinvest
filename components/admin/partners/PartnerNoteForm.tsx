"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/Field";
import { inputClass } from "@/components/ui/styles";
import { api } from "@/lib/api-client";

export default function PartnerNoteForm({ id }: { id: number }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
          await api(`/api/partners/${id}/activities`, { method: "POST", body: { type: "note", note } });
          setNote("");
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not save.");
        } finally {
          setSaving(false);
        }
      }}
    >
      <FormAlert>{error}</FormAlert>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={3000}
        placeholder="What happened? e.g. Called, spoke to sales head, asked for proposal by Friday"
        className={inputClass}
      />
      <Button type="submit" size="sm" loading={saving} disabled={!note.trim()} className="self-start">
        Add note
      </Button>
    </form>
  );
}
