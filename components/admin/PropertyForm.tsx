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
import { inputClass, labelClass } from "@/components/ui/styles";
import { api, ApiError } from "@/lib/api-client";
import {
  amenitySuggestions,
  approvalAuthorityOptions,
  areaUnits,
  categories,
  categoryLabels,
  configurationField,
  DEFAULT_COUNTRY,
  defaultAreaUnit,
  facingOptions,
  furnishingOptions,
  monthNames,
  openSideOptions,
  OTHER_AUTHORITY,
  ownershipOptions,
  possessionStatuses,
  propertyTypes,
  sqmPerUnit,
  type PossessionStatus,
  type PropertyCategory,
} from "@/lib/constants/property";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import {
  formatPriceRange,
  formatAmountInWords,
  formatRupees,
  joinAddress,
  lakhToRupees,
  ratePerUnit,
  rupeesToLakh,
} from "@/lib/utils/format";
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
  /** Plots enter one total price in full rupees (e.g. 300000) instead of Lakh. */
  priceMinRupees: string;
  areaMin: string;
  areaMax: string;
  areaUnit: string;
  status: PossessionStatus;
  /** "01".."12" and "2031"; both empty = not announced. */
  possessionMonth: string;
  possessionYear: string;
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
  /** One of approvalAuthorityOptions, OTHER_AUTHORITY, or "" (not specified). */
  authorityChoice: string;
  /** Free text, used only when authorityChoice is OTHER_AUTHORITY. */
  approvalAuthority: string;
  cornerPlot: boolean;
  openSides: string;
  hasConstruction: "" | "yes" | "no";
  isFeatured: boolean;
  isActive: boolean;
}

function authorityChoiceFor(value: string): string {
  if (!value) return "";
  return (approvalAuthorityOptions as readonly string[]).includes(value) ? value : OTHER_AUTHORITY;
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
    priceMinRupees: numberToField(property?.priceMin),
    areaMin: numberToField(property?.areaMin),
    areaMax: numberToField(property?.areaMax),
    areaUnit: property?.areaUnit ?? defaultAreaUnit[cat],
    status: property?.status ?? "New Launch",
    possessionMonth: property?.possessionDate?.slice(5, 7) ?? "",
    possessionYear: property?.possessionDate?.slice(0, 4) ?? "",
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
    authorityChoice: authorityChoiceFor(property?.approvalAuthority ?? ""),
    approvalAuthority: property?.approvalAuthority ?? "",
    cornerPlot: property?.cornerPlot ?? false,
    openSides: numberToField(property?.openSides),
    hasConstruction: property?.hasConstruction == null ? "" : property.hasConstruction ? "yes" : "no",
    isFeatured: property?.isFeatured ?? false,
    isActive: property?.isActive ?? true,
  };
}

/** Shapes the form state into the JSON body POST/PUT /api/properties expects. */
function toRequestBody(form: FormState) {
  const {
    location,
    priceMinLakh,
    priceMaxLakh,
    priceMinRupees,
    possessionMonth,
    possessionYear,
    authorityChoice,
    approvalAuthority,
    openSides,
    hasConstruction,
    usps,
    ...rest
  } = form;
  const isPlot = form.category === "Plot";
  return {
    ...rest,
    latitude: location?.lat ?? null,
    longitude: location?.lng ?? null,
    priceMin: isPlot ? Math.round(Number(priceMinRupees) || 0) : lakhToRupees(Number(priceMinLakh) || 0),
    priceMax: isPlot ? Math.round(Number(priceMinRupees) || 0) : lakhToRupees(Number(priceMaxLakh) || 0),
    areaMin: Number(form.areaMin) || 0,
    areaMax: isPlot ? Number(form.areaMin) || 0 : Number(form.areaMax) || 0,
    // Month + year only; the day is always the 1st.
    possessionDate: possessionYear && possessionMonth ? `${possessionYear}-${possessionMonth}` : "",
    approvalAuthority: authorityChoice === OTHER_AUTHORITY ? approvalAuthority : authorityChoice,
    openSides: Number(openSides) || 0,
    hasConstruction: hasConstruction === "" ? null : hasConstruction === "yes",
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
  // Plot rate per unit, kept as typed; the total price lives in form.priceMinRupees.
  const [rateInput, setRateInput] = useState(() =>
    rateFrom(property?.priceMin ?? 0, property?.category === "Plot" ? property.areaMin : 0)
  );
  const [lastPriceEdit, setLastPriceEdit] = useState<"rate" | "total">("total");

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
      router.push(`/admin/properties?saved=${encodeURIComponent(form.title)}`);
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

  // Plots have a single area and a single total price.
  const priceMin = isPlot ? Number(form.priceMinRupees) || 0 : lakhToRupees(Number(form.priceMinLakh) || 0);
  const priceMax = isPlot ? priceMin : lakhToRupees(Number(form.priceMaxLakh || form.priceMinLakh) || 0);
  const pricePreview = formatPriceRange(priceMin, priceMax);

  // Plot rate: total price ÷ plot area, in the unit the admin selected.
  const plotRate = ratePerUnit(priceMin, Number(form.areaMin) || 0, form.areaUnit, form.areaUnit, sqmPerUnit);
  const unitLabel = form.areaUnit === "sq.yd." ? "sq.yd. (Gaj)" : form.areaUnit;
  const rateNum = Number(rateInput) || 0;

  /** Rate, total price and area stay in sync: total = rate × area. */
  function changePlotArea(value: string) {
    const area = Number(value) || 0;
    setForm((prev) => {
      if (lastPriceEdit === "rate" && rateNum && area) {
        return { ...prev, areaMin: value, priceMinRupees: String(Math.round(rateNum * area)) };
      }
      return { ...prev, areaMin: value };
    });
    if (lastPriceEdit === "total") setRateInput(rateFrom(Number(form.priceMinRupees) || 0, area));
  }

  function changePlotRate(value: string) {
    setRateInput(value);
    setLastPriceEdit("rate");
    const area = Number(form.areaMin) || 0;
    const rate = Number(value) || 0;
    if (area) set("priceMinRupees", rate ? String(Math.round(rate * area)) : "");
  }

  function changePlotTotal(value: string) {
    set("priceMinRupees", value);
    setLastPriceEdit("total");
    setRateInput(rateFrom(Number(value) || 0, Number(form.areaMin) || 0));
  }

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, i) => String(thisYear - 2 + i));
  if (form.possessionYear && !years.includes(form.possessionYear)) years.unshift(form.possessionYear);
  const slugPreview =
    property && property.title === form.title.trim() ? property.slug : slugify(form.title);
  const addressQuery = joinAddress(form.address, form.locality, form.city, form.state, form.pincode, form.country);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 pb-10">
      {/* Sticky header: back link, title and the Cancel / Save buttons */}
      <div className="sticky top-[57px] z-30 -mx-4 border-b border-border bg-canvas/95 px-4 pb-4 pt-2 backdrop-blur sm:-mx-6 sm:px-6">
        <Link href="/admin/properties" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
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
            <LinkButton href="/admin/properties" variant="outline">
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

      {isPlot ? (
        <Section
          title="Plot size & price"
          description="Enter the plot area, then the rate or the total price — the other is calculated for you."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Plot area" error={errors.areaMin}>
              <input
                {...bind("areaMin")}
                onChange={(e) => changePlotArea(e.target.value)}
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder="e.g. 100"
              />
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={`Rate per ${unitLabel} (₹)`}
              hint={<AmountHint rupees={rateNum} suffix={` per ${unitLabel}`} fallback="Fill this or the total price" />}
            >
              <input
                value={rateInput}
                onChange={(e) => changePlotRate(e.target.value)}
                className={inputClass}
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder="e.g. 5000"
              />
            </Field>
            <Field
              label="Total price (₹)"
              hint={<AmountHint rupees={priceMin} fallback="Full amount, e.g. 2600000" />}
            >
              <input
                {...bind("priceMinRupees")}
                onChange={(e) => changePlotTotal(e.target.value)}
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="e.g. 2600000"
              />
            </Field>
          </div>

          <p className="-mt-1 rounded-control bg-primary-soft/60 px-3 py-2 text-sm text-muted">
            {plotRate ? (
              <>
                <span className="tabular-nums font-semibold text-ink">
                  {formatRupees(Number(form.areaMin))} {unitLabel} × ₹{formatRupees(plotRate)} = ₹{formatRupees(priceMin)}
                </span>
                {" · "}shows on the website as{" "}
                <span className="tabular-nums font-semibold text-primary">{pricePreview}</span>
              </>
            ) : (
              "Enter the plot area, then either the rate or the total price. The other one is calculated."
            )}
          </p>
        </Section>
      ) : (
      <Section title="Price & size">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starting price (₹ Lakh)" hint={<AmountHint rupees={lakhToRupees(Number(form.priceMinLakh) || 0)} fallback="1 Crore = 100 Lakh. Leave empty for 'Price on Request'." />}>
            <input {...bind("priceMinLakh")} type="number" min="0" step="0.01" inputMode="decimal" placeholder="e.g. 85" />
          </Field>
          <Field label="Maximum price (₹ Lakh)" hint={<AmountHint rupees={lakhToRupees(Number(form.priceMaxLakh) || 0)} fallback="Optional" />} error={errors.priceMax}>
            <input {...bind("priceMaxLakh")} type="number" min="0" step="0.01" inputMode="decimal" placeholder="e.g. 250" />
          </Field>
        </div>
        <p className="-mt-1 text-sm text-muted">
          Shows on the website as{" "}
          <span className="tabular-nums font-semibold text-primary">{pricePreview}</span>
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Min area">
            <input {...bind("areaMin")} type="number" min="0" step="any" inputMode="decimal" />
          </Field>
          <Field label="Max area" hint="Optional" error={errors.areaMax}>
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
      )}

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
            <Field label="Approved by">
              <select
                value={form.authorityChoice}
                onChange={(e) => set("authorityChoice", e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {approvalAuthorityOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
                <option value={OTHER_AUTHORITY}>Other (type it)</option>
              </select>
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
        {isPlot && form.authorityChoice === OTHER_AUTHORITY && (
          <Field label="Approving authority" hint="e.g. DTCP, HUDA, LDA">
            <input {...bind("approvalAuthority")} placeholder="Type the authority name" autoFocus />
          </Field>
        )}
        {isPlot && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <ChoiceField label="How many sides are open?" error={errors.openSides}>
                <ChoiceGroup
                  name="Open sides"
                  value={form.openSides}
                  onChange={(v) => set("openSides", v)}
                  options={openSideOptions.map((n) => ({ value: String(n), label: String(n) }))}
                />
              </ChoiceField>
              <ChoiceField label="Any construction on the plot?">
                <ChoiceGroup
                  name="Construction"
                  value={form.hasConstruction}
                  onChange={(v) => set("hasConstruction", v as FormState["hasConstruction"])}
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                  ]}
                />
              </ChoiceField>
            </div>
            <Checkbox
              label="Corner plot available"
              checked={form.cornerPlot}
              onChange={(e) => set("cornerPlot", e.target.checked)}
            />
          </>
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
            label="Possession (month & year)"
            hint="Leave empty for ready-to-move or not yet announced"
            error={errors.possessionDate}
          >
            <div className="grid grid-cols-2 gap-2">
              <select {...bind("possessionMonth")} aria-label="Possession month">
                <option value="">Month</option>
                {monthNames.map((name, i) => (
                  <option key={name} value={String(i + 1).padStart(2, "0")}>
                    {name}
                  </option>
                ))}
              </select>
              <select {...bind("possessionYear")} aria-label="Possession year">
                <option value="">Year</option>
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
          </Field>
        </div>
        <Checkbox
          label="RERA registered"
          checked={form.reraRegistered}
          onChange={(e) => set("reraRegistered", e.target.checked)}
        />
        {form.reraRegistered && (
          <Field label="RERA number" hint="Optional" error={errors.reraNumber}>
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

/** Segmented single-choice buttons; clicking the selected option clears it. */
function ChoiceGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? "" : o.value)}
            className={cn(
              "h-10 min-w-12 flex-1 rounded-control border px-3 text-sm font-semibold transition",
              active
                ? "border-primary bg-primary text-on-primary"
                : "border-border bg-surface text-ink hover:border-primary hover:text-primary"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Like Field, but a div instead of a label so clicks on the caption don't press the first button. */
function ChoiceField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={labelClass}>{label}</span>
      {children}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

/** Total ÷ area as an input string, rounded to 2 decimals; "" when it can't be calculated. */
function rateFrom(total: number, area: number): string {
  return total && area ? String(Number((total / area).toFixed(2))) : "";
}

/** "₹26,00,000 · 26 Lakh" under a price input, so large amounts are easy to read. */
function AmountHint({ rupees, suffix = "", fallback }: { rupees: number; suffix?: string; fallback: string }) {
  if (!rupees) return <>{fallback}</>;
  return (
    <>
      ₹{formatRupees(rupees)}
      {suffix} · <span className="font-semibold text-primary">{formatAmountInWords(rupees)}</span>
    </>
  );
}
