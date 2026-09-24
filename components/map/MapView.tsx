"use client";

import dynamic from "next/dynamic";
import type { LeafletMapProps } from "./LeafletMap";

/** Leaflet needs `window`, so the map is only rendered in the browser. */
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-cream-200" />,
});

export default function MapView(props: LeafletMapProps) {
  return <LeafletMap {...props} />;
}
