"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLng } from "@/lib/utils/maps";

/** Brand-coloured pin (avoids Leaflet's default marker images, which bundlers break). */
const pinIcon = L.divIcon({
  className: "pi-map-pin",
  html: `<svg viewBox="0 0 24 32" width="32" height="42" aria-hidden="true"><path d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 32 12 32s12-11.2 12-20.1C24 5.3 18.6 0 12 0z" class="pin-body"/><circle cx="12" cy="12" r="5" class="pin-dot"/></svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

export interface LeafletMapProps {
  center: LatLng;
  zoom?: number;
  marker?: LatLng | null;
  /** When set, clicking the map or dragging the pin reports the new point. */
  onPick?: (point: LatLng) => void;
  className?: string;
}

function ClickToPick({ onPick }: { onPick: (point: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

/** Keeps the view in sync when the center changes from outside (e.g. address search). */
function Recenter({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
  }, [map, center.lat, center.lng, zoom]);
  return null;
}

export default function LeafletMap({ center, zoom = 14, marker, onPick, className }: LeafletMapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom={Boolean(onPick)}
      className={className}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} zoom={zoom} />
      {onPick && <ClickToPick onPick={onPick} />}
      {marker && (
        <Marker
          position={[marker.lat, marker.lng]}
          icon={pinIcon}
          draggable={Boolean(onPick)}
          eventHandlers={
            onPick
              ? {
                  dragend: (e) => {
                    const { lat, lng } = (e.target as L.Marker).getLatLng();
                    onPick({ lat, lng });
                  },
                }
              : undefined
          }
        />
      )}
    </MapContainer>
  );
}
