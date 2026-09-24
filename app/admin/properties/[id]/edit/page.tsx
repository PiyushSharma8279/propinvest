import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import PropertyForm from "@/components/admin/PropertyForm";
import { HttpError } from "@/server/http";
import { getPropertyById } from "@/server/services/property.service";

export const metadata: Metadata = { title: "Edit property" };

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyById(Number(id)).catch((error) => {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  });

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> All properties
      </Link>
      <div className="mb-6 mt-2 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold text-ink-900">Edit {property.title}</h1>
        {property.isActive && !property.isDeleted && (
          <Link
            href={`/projects/${property.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-sm font-medium text-teal-900 hover:underline"
          >
            View on website <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <PropertyForm property={property} />
    </div>
  );
}
