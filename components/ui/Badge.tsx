import { cn } from "@/lib/utils/cn";

const tones = {
  neutral: "bg-surface-muted text-muted",
  gold: "bg-highlight-soft text-ink",
  teal: "bg-primary-soft text-primary",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof tones;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
