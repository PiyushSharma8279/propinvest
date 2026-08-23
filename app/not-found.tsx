import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <SearchX className="h-10 w-10 text-teal-900" />
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">
        This project listing isn&apos;t available
      </h1>
      <p className="mt-2 text-slate-600">
        The page you&apos;re looking for may have been moved or the project is no
        longer listed. Browse current projects instead.
      </p>
      <Link
        href="/projects"
        className="mt-6 rounded-md bg-teal-900 px-5 py-2.5 text-sm font-semibold text-cream"
      >
        Browse All Projects
      </Link>
    </div>
  );
}
