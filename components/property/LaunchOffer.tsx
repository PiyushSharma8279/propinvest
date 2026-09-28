import { BadgePercent, Sparkles, TrendingUp } from "lucide-react";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatAmountInWords, formatRupees } from "@/lib/utils/format";
import { launchOffer } from "@/lib/utils/launch-offer";

type OfferFields = Pick<Property, "prelaunchRate" | "launchRate" | "areaMin" | "areaUnit">;

/** Short one-line summary for cards and previews, e.g. "Pre-launch · Save 12%". Null without rates. */
export function offerSummary(property: OfferFields): string | null {
  const offer = launchOffer(property);
  if (!offer) return null;
  if (offer.saving) return `Pre-launch · Save ${offer.saving.percent}%`;
  const only = offer.prelaunch ?? offer.launch!;
  return `${offer.prelaunch ? "Pre-launch" : "Launch"} ₹${formatRupees(only.rate)}/${property.areaUnit}`;
}

/** Small badge above the price on property cards. */
export function OfferBadge({ property, className }: { property: OfferFields; className?: string }) {
  const summary = offerSummary(property);
  if (!summary) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-highlight-soft px-2 py-0.5 text-[11px] font-semibold text-ink",
        className
      )}
    >
      <Sparkles className="h-3 w-3 text-highlight" aria-hidden="true" />
      {summary}
    </span>
  );
}

/** Pre-launch vs launch comparison with the buyer's saving, on the property page. */
export function LaunchOfferPanel({ property }: { property: OfferFields }) {
  const offer = launchOffer(property);
  if (!offer) return null;
  const unit = property.areaUnit;
  const tiles = [
    { key: "prelaunch", label: "Pre-launch rate", price: offer.prelaunch, icon: Sparkles, highlight: true },
    { key: "launch", label: "Launch rate", price: offer.launch, icon: TrendingUp, highlight: false },
  ].filter((t) => t.price);

  return (
    <div className="mt-5 rounded-xl border border-highlight/30 bg-highlight-soft/50 p-4">
      <div className={cn("grid gap-3", tiles.length > 1 && "sm:grid-cols-2")}>
        {tiles.map(({ key, label, price, icon: Icon, highlight }) => (
          <div
            key={key}
            className={cn(
              "rounded-lg border bg-surface p-3",
              highlight && offer.saving ? "border-primary/40" : "border-border"
            )}
          >
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <Icon className={cn("h-3.5 w-3.5", highlight ? "text-highlight" : "text-subtle")} aria-hidden="true" />
              {label}
            </p>
            <p
              className={cn(
                "mt-1 text-lg font-bold tabular-nums",
                highlight && offer.saving ? "text-primary" : "text-ink",
                !highlight && offer.saving && "text-muted line-through decoration-1"
              )}
            >
              ₹{formatRupees(price!.rate)} <span className="text-sm font-medium">/ {unit}</span>
            </p>
            {price!.total > 0 && (
              <p className="text-sm tabular-nums text-muted">
                ₹{formatRupees(price!.total)} total · {formatAmountInWords(price!.total)}
              </p>
            )}
          </div>
        ))}
      </div>
      {offer.saving && (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink">
          <BadgePercent className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>
            Book at pre-launch and save{" "}
            <strong className="tabular-nums text-primary">
              ₹{formatRupees(offer.saving.perUnit)} per {unit}
            </strong>
            {offer.saving.total > 0 && (
              <>
                {" "}— <strong className="tabular-nums text-primary">₹{formatRupees(offer.saving.total)}</strong> (
                {formatAmountInWords(offer.saving.total)}) in total
              </>
            )}
          </span>
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-on-primary">
            {offer.saving.percent}% off
          </span>
        </p>
      )}
    </div>
  );
}
