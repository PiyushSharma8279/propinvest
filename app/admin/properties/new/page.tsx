import type { Metadata } from "next";
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
      <PropertyForm title="Add property" defaultCategory={defaultCategory} />
    </div>
  );
}
