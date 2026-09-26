import { Building2 } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils/cn";

/** Brand mark: icon + "InvestsProperty" + "by Maa Rudrani Properties". */
export default function Logo({ tone = "dark", size = "md" }: { tone?: "light" | "dark"; size?: "sm" | "md" }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-control bg-primary text-on-primary",
          size === "md" ? "h-10 w-10" : "h-8 w-8"
        )}
      >
        <Building2 className={size === "md" ? "h-5 w-5" : "h-4 w-4"} strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display font-bold tracking-tight",
            size === "md" ? "text-lg" : "text-base",
            tone === "light" ? "text-on-primary" : "text-ink"
          )}
        >
          {siteConfig.name}
        </span>
        <span className={cn("mt-1 text-[11px] font-medium", tone === "light" ? "text-on-primary/70" : "text-muted")}>
          {siteConfig.byline}
        </span>
      </span>
    </span>
  );
}
