"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert } from "@/components/ui/Field";
import { inputClass } from "@/components/ui/styles";
import { api, ApiError } from "@/lib/api-client";
import type { SessionUser } from "@/lib/types";

/** Only allow redirects back into this site. */
function safeNext(next: string | undefined, fallback: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/** Email + password sign in. There is no public sign-up; accounts are created via the API or DB. */
export default function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    setFormError(null);
    try {
      const { user } = await api<{ user: SessionUser }>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      router.push(safeNext(next, user.role === "admin" ? "/admin" : "/account"));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors);
        setFormError(Object.keys(err.errors).length ? null : err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <FormAlert>{formError}</FormAlert>
      <Field label="Email" error={errors.email}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </Field>
      <Field label="Password" error={errors.password}>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>
      <Button type="submit" loading={loading}>
        Sign in
      </Button>
    </form>
  );
}
