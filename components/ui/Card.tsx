import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-border bg-white", className)} {...props} />;
}

/** A titled form section. */
export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-slate-600">{description}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </Card>
  );
}
