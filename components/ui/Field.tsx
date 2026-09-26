import { cn } from "@/lib/utils/cn";
import { hintClass, labelClass } from "./styles";

/** Label + control + hint/error, used by every form. */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className={labelClass}>{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : (
        hint && <span className={hintClass}>{hint}</span>
      )}
    </label>
  );
}

export function Checkbox({
  label,
  description,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  return (
    <label className="flex items-start gap-2 text-sm text-ink">
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" {...props} />
      <span>
        <span className="font-medium">{label}</span>
        {description && <span className="block text-muted">{description}</span>}
      </span>
    </label>
  );
}

export function FormAlert({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      {children}
    </p>
  );
}
