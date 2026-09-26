import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BedDouble, CalendarClock, CheckCircle2, Images, MapPin, Ruler, ShieldCheck } from "lucide-react";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatAreaRange, formatPossession, formatPriceRange, joinAddress } from "@/lib/utils/format";
import WhatsAppButton from "./WhatsAppButton";

export const statusStyles: Record<Property["status"], { dot: string; text: string }> = {
  "New Launch": { dot: "bg-highlight", text: "text-ink" },
  "Under Construction": { dot: "bg-info", text: "text-ink" },
  "Ready to Move": { dot: "bg-primary", text: "text-ink" },
};

/** Grid card: photo on top, title + location, key specs, price footer. */
export default function PropertyCard({ property }: { property: Property }) {
  const href = `/projects/${property.slug}`;
  const status = statusStyles[property.status];
  const highlights = property.usps.slice(0, 2);
  const specs = [
    { icon: Ruler, label: formatAreaRange(property.areaMin, property.areaMax, property.areaUnit) },
    // The first two highlights from the admin form; older listings without any fall back to type + possession.
    ...(highlights.length
      ? highlights.map((label) => ({ icon: CheckCircle2, label }))
      : [
          {
            icon: BedDouble,
            label: property.configurations.length ? property.configurations.slice(0, 2).join(", ") : property.propertyType,
          },
          { icon: CalendarClock, label: formatPossession(property.possessionDate, property.status) },
        ]),
  ];

  return (
    <article className="group flex flex-col rounded-card border border-border bg-surface p-3 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden rounded-xl">
        <Image
          src={property.images[0]}
          alt={`${property.title}, ${joinAddress(property.locality, property.city)}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <span
          className={cn(
            "absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-semibold shadow-card",
            status.text
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} aria-hidden="true" />
          {property.status}
        </span>
        {property.reraRegistered && (
          <span
            className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-surface/95 text-primary shadow-card"
            title={property.reraNumber ? `RERA registered: ${property.reraNumber}` : "RERA registered"}
          >
            <ShieldCheck className="h-4 w-4" aria-label="RERA verified" />
          </span>
        )}
        <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-ink/60 px-2 py-0.5 text-[11px] font-medium text-on-primary backdrop-blur-sm">
          <Images className="h-3 w-3" aria-hidden="true" />
          {property.images.length}
        </span>
      </Link>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <Link href={href}>
          <h3 className="line-clamp-1 text-[15px] font-semibold text-ink transition group-hover:text-primary">
            {property.title}
          </h3>
        </Link>

        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-info">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="line-clamp-1">{joinAddress(property.locality, property.city)}</span>
        </p>

        <ul className="mb-4 mt-3 flex flex-col gap-1.5 text-xs text-muted">
          {specs.map(({ icon: Icon, label }) => (
            <li key={label} className="flex min-w-0 items-center gap-1.5" title={label}>
              <Icon
                className={cn("h-3.5 w-3.5 shrink-0", Icon === CheckCircle2 ? "text-primary" : "text-subtle")}
                aria-hidden="true"
              />
              <span className="truncate">{label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
          <p className="tabular-nums text-[15px] font-bold text-ink">
            {formatPriceRange(property.priceMin, property.priceMax)}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <WhatsAppButton
              whatsapp={property.whatsapp}
              projectTitle={property.title}
              locality={property.locality}
              city={property.city}
              iconOnly
            />
            <Link
              href={href}
              aria-label={`View ${property.title}`}
              className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-primary transition hover:bg-primary hover:text-on-primary"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
