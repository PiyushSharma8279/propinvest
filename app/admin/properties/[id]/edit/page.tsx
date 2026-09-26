import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
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
      <PropertyForm
        property={property}
        title={`Edit ${property.title}`}
        headerExtra={
          property.isActive && !property.isDeleted ? (
            <Link
              href={`/projects/${property.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              View on website <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : undefined
        }
      />
    </div>
  );
}
