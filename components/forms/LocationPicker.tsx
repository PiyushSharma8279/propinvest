"use client";

import { useState } from "react";
import { Crosshair, MapPin, Search, X } from "lucide-react";
import MapView from "@/components/map/MapView";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/styles";
import { geocodeAddress } from "@/lib/utils/geocode";
import { DEFAULT_MAP_CENTER, type LatLng } from "@/lib/utils/maps";

interface LocationPickerProps {
  value: LatLng | null;
  onChange: (value: LatLng | null) => void;
  /** Address text used by "Find on map". */
  addressQuery: string;
  error?: string;
}

const round = (n: number) => Math.round(n * 1e6) / 1e6;

/** Pick a property's coordinates: search the address, click the map, drag the pin or type them. */
export default function LocationPicker({ value, onChange, addressQuery, error }: LocationPickerProps) {
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [view, setView] = useState<{ center: LatLng; zoom: number }>(
    value ? { center: value, zoom: 15 } : { center: DEFAULT_MAP_CENTER, zoom: 4 }
  );

  function pick(point: LatLng) {
    onChange({ lat: round(point.lat), lng: round(point.lng) });
    setMessage(null);
  }

  async function findAddress() {
    if (!addressQuery.trim()) {
      setMessage("Fill in the address, city and state first.");
      return;
    }
    setSearching(true);
    setMessage(null);
    try {
      const hit = await geocodeAddress(addressQuery);
      if (!hit) {
        setMessage("Couldn't find that address. Click the map to place the pin instead.");
        return;
      }
      pick(hit);
      setView({ center: hit, zoom: 16 });
      setMessage(`Found: ${hit.label}. Drag the pin to the exact spot if needed.`);
    } catch {
      setMessage("Address search is unavailable right now. Click the map to place the pin.");
    } finally {
      setSearching(false);
    }
  }

  function setCoordinate(key: keyof LatLng, raw: string) {
    const n = Number(raw);
    if (raw === "" || !Number.isFinite(n)) return;
    const next = { ...(value ?? view.center), [key]: n };
    onChange(next);
    setView({ center: next, zoom: Math.max(view.zoom, 14) });
  }

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        pick(point);
        setView({ center: point, zoom: 17 });
      },
      () => setMessage("Couldn't get your location.")
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={findAddress} loading={searching}>
          {!searching && <Search className="h-4 w-4" />} Find address on map
        </Button>
        <Button variant="outline" size="sm" onClick={useMyLocation}>
          <Crosshair className="h-4 w-4" /> Use my location
        </Button>
        {value && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            <X className="h-4 w-4" /> Clear pin
          </Button>
        )}
      </div>

      <div className="h-72 overflow-hidden rounded-md border border-border sm:h-80">
        <MapView
          center={view.center}
          zoom={view.zoom}
          marker={value}
          onPick={pick}
          className="h-full w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Latitude</span>
          <input
            type="number"
            step="any"
            value={value?.lat ?? ""}
            onChange={(e) => setCoordinate("lat", e.target.value)}
            placeholder="28.4089"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Longitude</span>
          <input
            type="number"
            step="any"
            value={value?.lng ?? ""}
            onChange={(e) => setCoordinate("lng", e.target.value)}
            placeholder="77.4152"
            className={inputClass}
          />
        </label>
      </div>

      <p className="flex items-start gap-1 text-xs text-muted">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {message ?? "Click the map or drag the pin to the property's exact location."}
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
