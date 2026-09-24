"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils/cn";

export default function SignOutButton({ className, label = "Sign out" }: { className?: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className={cn("inline-flex items-center gap-1 disabled:opacity-60", className)}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
