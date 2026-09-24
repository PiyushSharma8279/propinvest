import Image from "next/image";
import Link from "next/link";
import { Images, MapPin } from "lucide-react";
import type { Property } from "@/lib/types";
import { formatAreaRange, formatPossession, formatPriceRange, joinAddress } from "@/lib/utils/format";
import RERABadge from "./RERABadge";
import CallButton from "./CallButton";
import WhatsAppButton from "./WhatsAppButton";

const statusStyles: Record<Property["status"], string> = {
  "New Launch": "bg-gold-600 text-ink-900",
  "Under Construction": "bg-teal-600 text-cream",
  "Ready to Move": "bg-teal-900 text-cream",
};

export default function PropertyCard({ property }: { property: Property }) {
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-white shadow-sm transition hover:shadow-md sm:flex">
      <Link
        href={`/projects/${property.slug}`}
        className="relative block h-56 shrink-0 sm:h-auto sm:w-72"
      >
        <Image
          src={property.images[0]}
          alt={`${property.title}, ${joinAddress(property.locality, property.city)}`}
          fill
          sizes="(max-width: 640px) 100vw, 288px"
          className="object-cover"
        />
        <span
          className={`absolute left-3 top-3 rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusStyles[property.status]}`}
        >
          {property.status}
        </span>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded bg-ink-900/70 px-2 py-0.5 text-[11px] font-medium text-cream">
          <Images className="h-3 w-3" aria-hidden="true" />
          {property.images.length} Photos
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Link href={`/projects/${property.slug}`}>
              <h3 className="text-lg font-semibold text-ink-900 hover:underline">
                {property.title}
              </h3>
            </Link>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-600">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {joinAddress(property.locality, property.city, property.state)}
            </p>
          </div>
          {property.reraRegistered && <RERABadge reraNumber={property.reraNumber} />}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span className="font-medium text-ink-900">
            {property.configurations.length > 0 && `${property.configurations.join(", ")} · `}
            {property.propertyType}
          </span>
          <span className="tabular-nums font-semibold text-teal-900">
            {formatPriceRange(property.priceMin, property.priceMax)}
          </span>
        </div>

        <p className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
          <span>
            {property.category === "Plot" ? "Plot area" : "Area"}:{" "}
            <span className="font-medium text-ink-900">
              {formatAreaRange(property.areaMin, property.areaMax, property.areaUnit)}
            </span>
          </span>
          <span>
            Possession:{" "}
            <span className="font-medium text-ink-900">
              {formatPossession(property.possessionDate, property.status)}
            </span>
          </span>
        </p>

        <p className="line-clamp-2 text-sm text-slate-600">{property.description}</p>

        {property.usps.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {property.usps.slice(0, 3).map((usp) => (
              <li key={usp} className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-gold-600" aria-hidden="true" />
                {usp}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <CallButton phone={property.phone} projectTitle={property.title} />
          <WhatsAppButton
            whatsapp={property.whatsapp}
            projectTitle={property.title}
            locality={property.locality}
            city={property.city}
          />
        </div>
      </div>
    </article>
  );
}
