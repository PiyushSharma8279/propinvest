import type { Metadata } from "next";
import { cookies } from "next/headers";
import AdminShell from "@/components/admin/AdminShell";
import { SIDEBAR_COOKIE } from "@/lib/admin-sidebar";
import { requireAdminPage } from "@/server/services/auth.service";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | InvestsProperty Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // proxy.ts already redirects non-admins; this re-checks against the database.
  const [admin, cookieStore] = await Promise.all([requireAdminPage(), cookies()]);
  const collapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed";

  return (
    <AdminShell initialCollapsed={collapsed} userName={admin.name}>
      {children}
    </AdminShell>
  );
}
