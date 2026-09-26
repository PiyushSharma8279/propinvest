import { ShieldCheck } from "lucide-react";

interface RERABadgeProps {
  reraNumber?: string;
  size?: "sm" | "md";
}

export default function RERABadge({ reraNumber, size = "sm" }: RERABadgeProps) {
  const dimension = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary"
      title={reraNumber ? `RERA registered: ${reraNumber}` : "RERA registered"}
    >
      <ShieldCheck className={dimension} strokeWidth={2.25} aria-hidden="true" />
      RERA Verified
    </span>
  );
}
