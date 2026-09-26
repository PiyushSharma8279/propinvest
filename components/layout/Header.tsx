"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Mail, Menu, Phone, UserRound, X } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import WhatsAppButton from "@/components/property/WhatsAppButton";
import { siteConfig } from "@/lib/site-config";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import Logo from "./Logo";

const navLinks = [
  { href: "/projects", label: "Properties" },
  { href: "/about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

/**
 * Client component so public pages stay statically generated: the signed-in user is
 * fetched from /api/auth/me in the browser instead of reading cookies on the server.
 */
function useSessionUser() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: { user: SessionUser | null }) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return user;
}

/** Highlights the nav link for the current page (path only, so static pages stay static). */
function useIsActive() {
  const pathname = usePathname();
  return (href: string) => !href.includes("?") && !href.includes("#") && href === pathname;
}

function AccountLinks({ user, mobile = false }: { user: SessionUser | null | undefined; mobile?: boolean }) {
  const linkClass = mobile
    ? "flex items-center gap-2 py-1 text-ink"
    : "inline-flex items-center gap-1 text-muted transition hover:text-primary";

  // No public sign-in link: visitors don't have accounts. Admins go to /login directly.
  if (!user) return null;
  return (
    <>
      {user.role === "admin" ? (
        <Link href="/admin" className={linkClass}>
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Admin
        </Link>
      ) : (
        <Link href="/account" className={linkClass}>
          <UserRound className="h-4 w-4" aria-hidden="true" /> {user.name.split(" ")[0]}
        </Link>
      )}
      <SignOutButton className={linkClass} />
    </>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const user = useSessionUser();
  const isActive = useIsActive();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
      {/* Slim contact bar */}
      <div className="hidden border-b border-border sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-xs text-muted sm:px-6">
          <div className="flex items-center gap-5">
            <a href={`tel:${siteConfig.contact.phone}`} className="inline-flex items-center gap-1.5 hover:text-primary">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {siteConfig.contact.phone}
            </a>
            <a href={`mailto:${siteConfig.contact.email}`} className="inline-flex items-center gap-1.5 hover:text-primary">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              {siteConfig.contact.email}
            </a>
          </div>
          <p className="hidden md:block">RERA-verified listings only</p>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-1.5 transition",
                isActive(link.href) ? "bg-primary-soft text-primary" : "text-muted hover:text-ink"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 text-sm font-medium lg:flex">
          <AccountLinks user={user} />
          <WhatsAppButton
            whatsapp={siteConfig.contact.whatsapp}
            projectTitle={siteConfig.name}
            label="Talk to an Expert"
          />
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-control border border-border text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-surface px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1 text-sm font-medium" onClick={() => setOpen(false)}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-control px-3 py-2",
                  isActive(link.href) ? "bg-primary-soft text-primary" : "text-ink hover:bg-surface-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <div className="mt-2 flex flex-col gap-3 border-t border-border px-3 pt-3">
                <AccountLinks user={user} mobile />
              </div>
            )}
          </nav>
          <div className="mt-4">
            <WhatsAppButton
              whatsapp={siteConfig.contact.whatsapp}
              projectTitle={siteConfig.name}
              label="Talk to an Expert"
              fullWidth
            />
          </div>
        </div>
      )}
    </header>
  );
}
