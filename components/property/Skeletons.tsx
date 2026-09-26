import { cn } from "@/lib/utils/cn";

/** Grey placeholder block with a soft pulse. */
export function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface-muted", className)} aria-hidden="true" />;
}

/** Same shape as PropertyCard, shown while listings load. */
export function PropertyCardSkeleton() {
  return (
    <div className="flex flex-col rounded-card border border-border bg-surface p-3 shadow-card">
      <Bone className="aspect-[4/3] w-full rounded-xl" />
      <div className="flex flex-col gap-2 px-1 pb-1 pt-3">
        <Bone className="h-4 w-3/4" />
        <Bone className="h-3 w-1/2" />
        <Bone className="mt-2 h-3 w-2/3" />
        <Bone className="h-3 w-5/6" />
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <Bone className="h-4 w-24" />
          <Bone className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}
