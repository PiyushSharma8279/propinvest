import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PropertyForm from "@/components/admin/PropertyForm";
import { categories, type PropertyCategory } from "@/lib/constants/property";

export const metadata: Metadata = { title: "Add property" };

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const defaultCategory = categories.find((c) => c === category) as PropertyCategory | undefined;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> All properties
      </Link>
      <h1 className="mb-6 mt-2 font-display text-2xl font-semibold text-ink-900">Add property</h1>
      <PropertyForm defaultCategory={defaultCategory} />
    </div>
  );
}
