import { Bone, PropertyCardSkeleton } from "@/components/property/Skeletons";

/** Shown the instant a listing link is clicked, while the filtered results stream in. */
export default function ProjectsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" role="status" aria-label="Loading properties">
      <Bone className="h-4 w-48" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <Bone className="h-8 w-80 max-w-full" />
        <Bone className="h-9 w-40" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: 7 }, (_, i) => (
          <Bone key={i} className="h-8 w-28 rounded-full" />
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <Bone className="h-[560px] w-full shrink-0 rounded-card md:w-64" />
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
