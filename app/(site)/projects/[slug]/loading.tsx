import { Bone } from "@/components/property/Skeletons";

/** Same layout as the property page; only visible if a page isn't pre-rendered yet. */
export default function PropertyLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6" role="status" aria-label="Loading property">
      <div className="flex items-center justify-between">
        <Bone className="h-4 w-28" />
        <Bone className="h-4 w-56" />
      </div>
      <Bone className="mt-5 h-8 w-72 max-w-full" />
      <Bone className="mt-2 h-4 w-96 max-w-full" />
      <div className="mt-5 flex flex-col gap-3 lg:flex-row">
        <Bone className="h-72 flex-1 rounded-card sm:h-[26rem] lg:h-[28rem]" />
        <div className="hidden w-56 flex-col gap-3 lg:flex">
          <Bone className="flex-1 rounded-xl" />
          <Bone className="flex-1 rounded-xl" />
          <Bone className="flex-1 rounded-xl" />
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          <Bone className="h-40 rounded-card" />
          <Bone className="h-48 rounded-card" />
          <Bone className="h-56 rounded-card" />
        </div>
        <div className="hidden flex-col gap-4 lg:flex">
          <Bone className="h-60 rounded-card" />
          <Bone className="h-40 rounded-card" />
        </div>
      </div>
    </div>
  );
}
