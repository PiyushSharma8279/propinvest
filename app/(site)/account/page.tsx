import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import { buttonClass, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { requireUserPage } from "@/server/services/auth.service";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requireUserPage("/account");

  const details = [
    { label: "Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "Role", value: user.role === "admin" ? "Admin" : "User" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">My account</h1>
      <Card className="mt-6 p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          {details.map((d) => (
            <div key={d.label}>
              <dt className="text-xs uppercase tracking-wide text-muted">{d.label}</dt>
              <dd className="mt-1 font-medium text-ink">{d.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-6">
          {user.role === "admin" && (
            <LinkButton href="/admin">
              <LayoutDashboard className="h-4 w-4" /> Admin panel
            </LinkButton>
          )}
          <LinkButton href="/projects" variant="outline">
            Browse properties
          </LinkButton>
          <SignOutButton className={buttonClass("ghost")} />
        </div>
      </Card>
    </div>
  );
}
