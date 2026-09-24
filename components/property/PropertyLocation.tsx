"use client";

import { ExternalLink, MapPin, Navigation } from "lucide-react";
import MapView from "@/components/map/MapView";
import { buttonClass } from "@/components/ui/Button";
import { googleDirectionsUrl, googleMapsUrl, type LatLng } from "@/lib/utils/maps";

/** Map with the property's pin plus "View on map" and "Directions" buttons. */
export default function PropertyLocation({ point, address }: { point: LatLng; address: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <div className="h-72 sm:h-80">
        <MapView center={point} zoom={15} marker={point} className="h-full w-full" />
      </div>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-1.5 text-sm text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-900" />
          {address}
        </p>
        <div className="flex shrink-0 gap-2">
          <a
            href={googleMapsUrl(point)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("outline", "sm")}
          >
            <ExternalLink className="h-4 w-4" /> View on map
          </a>
          <a
            href={googleDirectionsUrl(point)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("primary", "sm")}
          >
            <Navigation className="h-4 w-4" /> Directions
          </a>
        </div>
      </div>
    </div>
  );
}
