import Link from "next/link";
import { SearchX } from "lucide-react";

/** Body of the 404 page, shared by app/not-found.tsx and app/(site)/not-found.tsx. */
export default function NotFoundContent() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary">
        <SearchX className="h-8 w-8" />
      </span>
      <h1 className="mt-5 text-2xl font-bold text-ink">This project listing isn&apos;t available</h1>
      <p className="mt-2 text-muted">
        The page you&apos;re looking for may have been moved or the project is no longer listed.
        Browse current projects instead.
      </p>
      <Link
        href="/projects"
        className="mt-6 rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-hover"
      >
        Browse All Projects
      </Link>
    </div>
  );
}
