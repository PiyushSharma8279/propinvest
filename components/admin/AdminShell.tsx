"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ExternalLink,
  LayoutDashboard,
  LayoutList,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  X,
  type LucideIcon,
} from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils/cn";

import { SIDEBAR_COOKIE } from "@/lib/admin-sidebar";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match only the exact path (for the dashboard at /admin). */
  exact?: boolean;
}

interface NavGroup {
  /** Heading shown above the group when the sidebar is expanded. */
  title?: string;
  items: NavItem[];
}

/** Admin navigation. Add a new tab by adding an item here (and its page under app/admin). */
const adminNav: NavGroup[] = [
  {
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Listings",
    items: [
      { href: "/admin/properties", label: "Properties", icon: LayoutList },
      { href: "/admin/properties/new", label: "Add Property", icon: Plus, exact: true },
    ],
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  // A more specific exact item (e.g. "Add Property") wins over its parent.
  const moreSpecific = adminNav.some((g) =>
    g.items.some((other) => other.exact && other.href !== item.href && other.href.startsWith(item.href) && pathname === other.href)
  );
  return !moreSpecific && (pathname === item.href || pathname.startsWith(`${item.href}/`));
}

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4" aria-label="Admin">
      {adminNav.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-1">
          {group.title &&
            (collapsed ? (
              <span className="mx-auto mb-1 h-px w-6 bg-border" aria-hidden="true" />
            ) : (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-subtle">
                {group.title}
              </p>
            ))}
          {group.items.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-10 items-center gap-3 rounded-control text-sm font-medium transition",
                  collapsed ? "justify-center px-0" : "px-3",
                  active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-muted hover:text-ink"
                )}
              >
                {active && (
                  <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" aria-hidden="true" />
                )}
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/admin" className={cn("flex h-14 shrink-0 items-center gap-2.5 border-b border-border", collapsed ? "justify-center" : "px-5")}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-primary text-on-primary">
        <Building2 className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
      </span>
      {!collapsed && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="truncate font-bold text-ink">{siteConfig.name}</span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Admin panel</span>
        </span>
      )}
    </Link>
  );
}

export default function AdminShell({
  initialCollapsed,
  userName,
  children,
}: {
  initialCollapsed: boolean;
  userName: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/admin; max-age=31536000; samesite=lax`;
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-surface transition-[width] duration-200 lg:flex",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <Brand collapsed={collapsed} />
        <SidebarNav collapsed={collapsed} />
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={toggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-control text-sm font-medium text-muted transition hover:bg-surface-muted hover:text-ink",
              collapsed ? "justify-center" : "px-3"
            )}
          >
            {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
            {collapsed ? <span className="sr-only">Expand sidebar</span> : "Collapse"}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-pop">
            <div className="flex items-center justify-between pr-3">
              <Brand collapsed={false} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-control text-muted hover:bg-surface-muted"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        {/* Top bar (57px incl. border — PropertyForm's sticky header sits right below it) */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-control border border-border text-ink lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={toggle}
              className="hidden h-9 w-9 place-items-center rounded-control text-muted transition hover:bg-surface-muted hover:text-ink lg:grid"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>

          <nav className="flex items-center gap-1 text-sm sm:gap-2">
            <Link
              href="/admin/properties/new"
              className="inline-flex items-center gap-1 rounded-control bg-primary px-3 py-1.5 font-semibold text-on-primary hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Add Property</span>
            </Link>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 rounded-control px-2 py-1.5 text-muted hover:text-ink"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">View site</span>
            </Link>
            <span className="hidden items-center gap-2 border-l border-border pl-3 md:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="text-ink">{userName}</span>
            </span>
            <SignOutButton className="rounded-control px-2 py-1.5 text-muted hover:text-ink [&>span]:hidden sm:[&>span]:inline" />
          </nav>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
