"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building, Building2, LandPlot } from "lucide-react";
import ImageUpload from "@/components/forms/ImageUpload";
import LocationPicker from "@/components/forms/LocationPicker";
import TagField from "@/components/forms/TagField";
import { Button, LinkButton } from "@/components/ui/Button";
import { Section } from "@/components/ui/Card";
import { Checkbox, Field, FormAlert } from "@/components/ui/Field";
import { inputClass } from "@/components/ui/styles";
import { api, ApiError } from "@/lib/api-client";
import {
  amenitySuggestions,
  areaUnits,
  categories,
  categoryLabels,
  configurationField,
  DEFAULT_COUNTRY,
  defaultAreaUnit,
  facingOptions,
  furnishingOptions,
  ownershipOptions,
  possessionStatuses,
  propertyTypes,
  type PossessionStatus,
  type PropertyCategory,
} from "@/lib/constants/property";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatPriceRange, joinAddress, lakhToRupees, rupeesToLakh } from "@/lib/utils/format";
import type { LatLng } from "@/lib/utils/maps";
import { slugify } from "@/lib/utils/slug";

const categoryIcons: Record<PropertyCategory, typeof Building> = {
  Residential: Building2,
  Commercial: Building,
  Plot: LandPlot,
};

const categoryBlurbs: Record<PropertyCategory, string> = {
  Residential: "Apartments, villas, builder floors",
  Commercial: "Offices, shops, showrooms",
  Plot: "Residential, commercial & farm plots",
};

/** Form state: numbers are kept as strings while typing. */
interface FormState {
  title: string;
  builder: string;
  description: string;
  category: PropertyCategory;
  propertyType: string;
  configurations: string[];
  address: string;
  locality: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  location: LatLng | null;
  priceMinLakh: string;
  priceMaxLakh: string;
  areaMin: string;
  areaMax: string;
  areaUnit: string;
  status: PossessionStatus;
  possessionMonth: string;
  reraRegistered: boolean;
  reraNumber: string;
  usps: string;
  amenities: string[];
  images: string[];
  phone: string;
  whatsapp: string;
  ownership: string;
  facing: string;
  furnishing: string;
  approvalAuthority: string;
  cornerPlot: boolean;
  isFeatured: boolean;
  isActive: boolean;
}

const numberToField = (n: number | undefined) => (n ? String(n) : "");

function initialState(property: Property | undefined, category: PropertyCategory): FormState {
  const cat = property?.category ?? category;
  return {
    title: property?.title ?? "",
    builder: property?.builder ?? "",
    description: property?.description ?? "",
    category: cat,
    propertyType: property?.propertyType ?? propertyTypes[cat][0],
    configurations: property?.configurations ?? [],
    address: property?.address ?? "",
    locality: property?.locality ?? "",
    city: property?.city ?? "",
    state: property?.state ?? "",
    country: property?.country ?? DEFAULT_COUNTRY,
    pincode: property?.pincode ?? "",
    location:
      property?.latitude != null && property.longitude != null
        ? { lat: property.latitude, lng: property.longitude }
        : null,
    priceMinLakh: numberToField(rupeesToLakh(property?.priceMin ?? 0)),
    priceMaxLakh: numberToField(rupeesToLakh(property?.priceMax ?? 0)),
    areaMin: numberToField(property?.areaMin),
    areaMax: numberToField(property?.areaMax),
    areaUnit: property?.areaUnit ?? defaultAreaUnit[cat],
    status: property?.status ?? "New Launch",
    possessionMonth: property?.possessionDate?.slice(0, 7) ?? "",
    reraRegistered: property?.reraRegistered ?? true,
    reraNumber: property?.reraNumber ?? "",
    usps: property?.usps.join("\n") ?? "",
    amenities: property?.amenities ?? [],
    images: property?.images ?? [],
    phone: property?.phone ?? "",
    whatsapp: property && property.whatsapp !== property.phone.replace("+", "") ? property.whatsapp : "",
    ownership: property?.ownership ?? "",
    facing: property?.facing ?? "",
    furnishing: property?.furnishing ?? "",
    approvalAuthority: property?.approvalAuthority ?? "",
    cornerPlot: property?.cornerPlot ?? false,
    isFeatured: property?.isFeatured ?? false,
    isActive: property?.isActive ?? true,
  };
}

/** Shapes the form state into the JSON body POST/PUT /api/properties expects. */
function toRequestBody(form: FormState) {
  const { location, priceMinLakh, priceMaxLakh, possessionMonth, usps, ...rest } = form;
  return {
    ...rest,
    latitude: location?.lat ?? null,
    longitude: location?.lng ?? null,
    priceMin: lakhToRupees(Number(priceMinLakh) || 0),
    priceMax: lakhToRupees(Number(priceMaxLakh) || 0),
    areaMin: Number(form.areaMin) || 0,
    areaMax: Number(form.areaMax) || 0,
    possessionDate: possessionMonth,
    usps: usps.split("\n"),
  };
}

export default function PropertyForm({
  property,
  defaultCategory = "Residential",
  title,
  headerExtra,
}: {
  property?: Property;
  defaultCategory?: PropertyCategory;
  /** Page heading shown in the sticky header next to Cancel / Save. */
  title: string;
  /** Optional link under the heading (e.g. "View on website"). */
  headerExtra?: React.ReactNode;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialState(property, defaultCategory));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isPlot = form.category === "Plot";
  const configField = configurationField[form.category];

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /** Props for a plain text/number/select input bound to a string field. */
  function bind(key: { [K in keyof FormState]: FormState[K] extends string ? K : never }[keyof FormState]) {
    return {
      value: form[key] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        set(key, e.target.value as FormState[typeof key]),
      className: cn(inputClass, errors[key] && "border-danger"),
    };
  }

  function changeCategory(next: PropertyCategory) {
    if (next === form.category) return;
    setForm((prev) => ({
      ...prev,
      category: next,
      propertyType: propertyTypes[next][0],
      areaUnit: defaultAreaUnit[next],
      configurations: [], // BHK values don't make sense for plots and vice versa
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      const body = toRequestBody(form);
      if (property) {
        await api(`/api/properties/${property.id}`, { method: "PUT", body });
      } else {
        await api("/api/properties", { method: "POST", body });
      }
      router.push(`/admin?saved=${encodeURIComponent(form.title)}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors);
        setFormError(err.message);
      } else {
        setFormError("Could not save. Check your connection and try again.");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      setSaving(false);
    }
  }

  const pricePreview = formatPriceRange(
    lakhToRupees(Number(form.priceMinLakh) || 0),
    lakhToRupees(Number(form.priceMaxLakh || form.priceMinLakh) || 0)
  );
  const slugPreview =
    property && property.title === form.title.trim() ? property.slug : slugify(form.title);
  const addressQuery = joinAddress(form.address, form.locality, form.city, form.state, form.pincode, form.country);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 pb-10">
      {/* Sticky header: back link, title and the Cancel / Save buttons */}
      <div className="sticky top-[57px] z-30 -mx-4 border-b border-border bg-canvas/95 px-4 pb-4 pt-2 backdrop-blur sm:-mx-6 sm:px-6">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> All properties
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-ink">{title}</h1>
            <p className="mt-0.5 truncate text-sm text-muted">
              {uploading ? (
                "Waiting for images to finish uploading…"
              ) : formError ? (
                <span className="text-danger">{formError}</span>
              ) : (
                <>
                  {categoryLabels[form.category]} · {form.propertyType}
                  {headerExtra && <span className="ml-3">{headerExtra}</span>}
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <LinkButton href="/admin" variant="outline">
              Cancel
            </LinkButton>
            <Button type="submit" loading={saving} disabled={uploading}>
              {saving ? "Saving…" : property ? "Save changes" : "Add property"}
            </Button>
          </div>
        </div>
      </div>

      <FormAlert>{formError}</FormAlert>

      <Section title="Property category" description="Pick what you're listing. The form adapts to it.">
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Category">
          {categories.map((c) => {
            const Icon = categoryIcons[c];
            const active = c === form.category;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => changeCategory(c)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border-2 p-3 text-left transition",
                  active ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-primary"
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                    active ? "bg-primary text-on-primary" : "bg-surface-muted text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-semibold text-ink">{categoryLabels[c]}</span>
                  <span className="block text-xs text-muted">{categoryBlurbs[c]}</span>
                </span>
              </button>
            );
          })}
        </div>
        <Field label="Property type" error={errors.propertyType}>
          <select {...bind("propertyType")}>
            {!propertyTypes[form.category].includes(form.propertyType) && (
              <option value={form.propertyType}>{form.propertyType}</option>
            )}
            {propertyTypes[form.category].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Basic details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={isPlot ? "Project / colony name" : "Project name"}
            error={errors.title}
            hint={
              slugPreview ? (
                <>
                  Web address: <span className="font-medium text-ink">/projects/{slugPreview}</span>
                  {!property && " (a number is added if it's taken)"}
                </>
              ) : (
                "The web address is created from this automatically."
              )
            }
          >
            <input {...bind("title")} placeholder={isPlot ? "e.g. Green Valley Enclave" : "e.g. Skyline Arte"} />
          </Field>
          <Field label="Builder / developer" hint="Optional">
            <input {...bind("builder")} placeholder="e.g. Skyline Group" />
          </Field>
        </div>
        <Field label="Description" error={errors.description}>
          <textarea
            {...bind("description")}
            rows={5}
            placeholder="What makes this property worth a visit? Location, connectivity, layout, nearby landmarks…"
          />
        </Field>
        <Field label="Highlights" hint="One per line. The first three show on the listing card.">
          <textarea
            {...bind("usps")}
            rows={4}
            placeholder={"5 mins from Noida Expressway\n75% open green area\nClubhouse with pool"}
          />
        </Field>
      </Section>

      <Section title="Address & location" description="Used for search on the website and the map pin.">
        <Field label="Full address" hint="Street / plot number, project name, landmark" error={errors.address}>
          <input {...bind("address")} placeholder="e.g. Plot GH-01, Sector 150, near Noida Expressway" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Locality / sector" error={errors.locality}>
            <input {...bind("locality")} placeholder="e.g. Sector 150" />
          </Field>
          <Field label="City" error={errors.city}>
            <input {...bind("city")} placeholder="e.g. Noida" />
          </Field>
          <Field label="State" error={errors.state}>
            <input {...bind("state")} placeholder="e.g. Uttar Pradesh" />
          </Field>
          <Field label="Country" error={errors.country}>
            <input {...bind("country")} />
          </Field>
          <Field label="PIN code" hint="Optional" error={errors.pincode}>
            <input {...bind("pincode")} inputMode="numeric" placeholder="201310" />
          </Field>
        </div>
        <LocationPicker
          value={form.location}
          onChange={(location) => set("location", location)}
          addressQuery={addressQuery}
          error={errors.location}
        />
      </Section>

      <Section title={isPlot ? "Price & plot size" : "Price & size"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starting price (₹ Lakh)" hint="1 Crore = 100 Lakh. Leave empty for 'Price on Request'.">
            <input {...bind("priceMinLakh")} type="number" min="0" step="0.01" inputMode="decimal" placeholder="e.g. 85" />
          </Field>
          <Field label="Maximum price (₹ Lakh)" hint="Optional" error={errors.priceMax}>
            <input {...bind("priceMaxLakh")} type="number" min="0" step="0.01" inputMode="decimal" placeholder="e.g. 250" />
          </Field>
        </div>
        <p className="-mt-1 text-sm text-muted">
          Shows on the website as{" "}
          <span className="tabular-nums font-semibold text-primary">{pricePreview}</span>
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={isPlot ? "Min plot area" : "Min area"}>
            <input {...bind("areaMin")} type="number" min="0" step="any" inputMode="decimal" />
          </Field>
          <Field label={isPlot ? "Max plot area" : "Max area"} hint="Optional" error={errors.areaMax}>
            <input {...bind("areaMax")} type="number" min="0" step="any" inputMode="decimal" />
          </Field>
          <Field label="Unit" error={errors.areaUnit}>
            <select {...bind("areaUnit")}>
              {areaUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit === "sq.yd." ? "sq.yd. (Gaj)" : unit}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-ink">{configField.label}</span>
          <TagField
            name="configurations"
            values={form.configurations}
            onChange={(values) => set("configurations", values)}
            presets={configField.presets}
            placeholder={configField.hint}
          />
        </div>
      </Section>

      <Section
        title={isPlot ? "Plot details" : "Property details"}
        description="Optional, shown on the property page when filled in."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Ownership">
            <select {...bind("ownership")}>
              <option value="">—</option>
              {ownershipOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label="Facing">
            <select {...bind("facing")}>
              <option value="">—</option>
              {facingOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
          {isPlot ? (
            <Field label="Approved by" hint="e.g. YEIDA, GNIDA, DTCP, HUDA">
              <input {...bind("approvalAuthority")} />
            </Field>
          ) : (
            <Field label="Furnishing">
              <select {...bind("furnishing")}>
                <option value="">—</option>
                {furnishingOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
          )}
        </div>
        {isPlot && (
          <Checkbox
            label="Corner plot available"
            checked={form.cornerPlot}
            onChange={(e) => set("cornerPlot", e.target.checked)}
          />
        )}
      </Section>

      <Section title="Status & RERA">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status" error={errors.status}>
            <select {...bind("status")}>
              {possessionStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field
            label="Possession month"
            hint="Leave empty for ready-to-move or not yet announced"
            error={errors.possessionDate}
          >
            <input {...bind("possessionMonth")} type="month" />
          </Field>
        </div>
        <Checkbox
          label="RERA registered"
          checked={form.reraRegistered}
          onChange={(e) => set("reraRegistered", e.target.checked)}
        />
        {form.reraRegistered && (
          <Field label="RERA number" error={errors.reraNumber}>
            <input {...bind("reraNumber")} placeholder="e.g. UPRERAPRJ123456" />
          </Field>
        )}
      </Section>

      <Section title="Photos">
        <ImageUpload
          value={form.images}
          onChange={(images) => set("images", images)}
          folder="properties"
          error={errors.images}
          onBusyChange={setUploading}
        />
      </Section>

      <Section title="Amenities">
        <TagField
          name="amenities"
          values={form.amenities}
          onChange={(values) => set("amenities", values)}
          presets={amenitySuggestions[form.category]}
          placeholder="Type an amenity and press Enter"
        />
      </Section>

      <Section title="Contact numbers" description="Buyers call or WhatsApp these numbers from the property page.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Call number" hint="10-digit mobile number" error={errors.phone}>
            <input {...bind("phone")} type="tel" placeholder="98100 00001" />
          </Field>
          <Field label="WhatsApp number" hint="Leave empty to use the call number" error={errors.whatsapp}>
            <input {...bind("whatsapp")} type="tel" placeholder="Same as call number" />
          </Field>
        </div>
      </Section>

      <Section title="Visibility">
        <Checkbox
          label="Active"
          description="Inactive listings are hidden from the website but kept in the admin panel."
          checked={form.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
        />
        <Checkbox
          label="Featured"
          description='Show in "Featured Projects" on the homepage.'
          checked={form.isFeatured}
          onChange={(e) => set("isFeatured", e.target.checked)}
        />
      </Section>

    </form>
  );
}
