import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PartnerForm from "@/components/admin/partners/PartnerForm";

export const metadata: Metadata = { title: "Add partner" };

export default function NewPartnerPage() {
  return (
    <div className="max-w-3xl">
      <Link href="/admin/partners" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Partners
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-ink">Add a contact</h1>
      <p className="mt-1 text-sm text-muted">
        Only add people you have a genuine business reason to contact, with details they shared or publish for business
        enquiries.
      </p>
      <div className="mt-6 rounded-card border border-border bg-surface p-5 shadow-card">
        <PartnerForm />
      </div>
    </div>
  );
}
