import { Building2 } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils/cn";

/** Brand mark: icon + "InvestsProperty" + "by Maa Rudrani Properties". */
export default function Logo({ tone = "light", size = "md" }: { tone?: "light" | "dark"; size?: "sm" | "md" }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-gold-600 text-teal-900",
          size === "md" ? "h-9 w-9" : "h-8 w-8"
        )}
      >
        <Building2 className={size === "md" ? "h-5 w-5" : "h-4 w-4"} strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display font-semibold tracking-tight",
            size === "md" ? "text-xl" : "text-lg",
            tone === "light" ? "text-cream" : "text-ink-900"
          )}
        >
          {siteConfig.name}
        </span>
        <span className="mt-1 text-[11px] font-medium tracking-wide text-gold-600">{siteConfig.byline}</span>
      </span>
    </span>
  );
}
