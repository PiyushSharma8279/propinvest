import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PartnerImport from "@/components/admin/partners/PartnerImport";

export const metadata: Metadata = { title: "Import partners" };

export default function ImportPartnersPage() {
  return (
    <div className="max-w-3xl">
      <Link href="/admin/partners" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Partners
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-ink">Import contacts from CSV</h1>
      <p className="mt-1 text-sm text-muted">
        For lists you built yourself from public business sources (official websites, directories) or were given with
        permission. Every row needs a name; duplicates of existing contacts are skipped. You see a preview before anything
        is saved.
      </p>
      <div className="mt-6 rounded-card border border-border bg-surface p-5 shadow-card">
        <PartnerImport />
      </div>
    </div>
  );
}
