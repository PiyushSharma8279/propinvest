import Link from "next/link";
import { SearchX } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
          <SearchX className="h-10 w-10 text-primary" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
            This project listing isn&apos;t available
          </h1>
          <p className="mt-2 text-muted">
            The page you&apos;re looking for may have been moved or the project is no
            longer listed. Browse current projects instead.
          </p>
          <Link
            href="/projects"
            className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary"
          >
            Browse All Projects
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
