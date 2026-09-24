import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import Logo from "@/components/layout/Logo";
import { requireAdminPage } from "@/server/services/auth.service";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | InvestsProperty Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // proxy.ts already redirects non-admins; this re-checks against the database.
  const admin = await requireAdminPage();

  return (
    <div className="min-h-screen bg-cream-200/60">
      <header className="sticky top-0 z-40 bg-teal-900 text-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="hidden rounded bg-cream/10 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-gold-100 sm:inline">
              Admin
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm sm:gap-3">
            <Link
              href="/admin/properties/new"
              className="inline-flex items-center gap-1 rounded-md bg-gold-600 px-3 py-1.5 font-semibold text-ink-900 hover:bg-gold-600/90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Add Property</span>
              <span className="sm:hidden">Add</span>
            </Link>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-cream/80 hover:text-cream"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">View site</span>
            </Link>
            <span className="hidden text-cream/60 md:inline">{admin.name}</span>
            <SignOutButton className="rounded-md px-2 py-1.5 text-cream/80 hover:text-cream [&>span]:hidden sm:[&>span]:inline" />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
