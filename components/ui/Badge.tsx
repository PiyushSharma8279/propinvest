import { cn } from "@/lib/utils/cn";

const tones = {
  neutral: "bg-cream-200 text-slate-600",
  gold: "bg-gold-100 text-ink-900",
  teal: "bg-teal-100 text-teal-900",
  danger: "bg-rust-600/10 text-rust-600",
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
        "rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
