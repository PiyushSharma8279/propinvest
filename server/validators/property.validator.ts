import {
  areaUnits,
  categories,
  defaultAreaUnit,
  propertyTypes,
  DEFAULT_COUNTRY,
  possessionStatuses,
} from "@/lib/constants/property";
import { richTextToPlain, sanitizeRichText } from "@/lib/rich-text";
import { isValidLatLng } from "@/lib/utils/maps";
import { normalizeIndianNumber } from "@/lib/utils/phone";
import type { NewProperty } from "../db/schema";
import { validationError } from "../http";
import { bool, collectErrors, num, oneOf, optionalNum, str, strArray } from "./helpers";

/** Everything the admin form can set. Slug, ids, soft-delete and timestamps belong to the service. */
export type PropertyInput = Omit<
  NewProperty,
  "id" | "slug" | "isDeleted" | "deletedAt" | "createdBy" | "createdAt" | "updatedAt"
>;

/** "2031-02" (month picker) or "2031-02-01" → "2031-02-01"; "" → null; anything else → undefined. */
function parsePossessionDate(raw: string): string | null | undefined {
  if (!raw) return null;
  if (/^\d{4}-\d{2}$/.test(raw)) return `${raw}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return undefined;
}

/**
 * Validates a create/update request body.
 * - "publish" (default): every required field must be valid; throws a 422 listing every bad field.
 * - "draft": used by autosave while a listing is still being written. Nothing is required and
 *   invalid values are dropped instead of rejected, so a half-filled form can always be saved.
 * Either way the description HTML is sanitized before it reaches the database.
 */
export function validatePropertyInput(
  body: Record<string, unknown>,
  mode: "publish" | "draft" = "publish"
): PropertyInput {
  const v = collectErrors();

  const category = oneOf(categories, str(body, "category"));
  if (!category) v.add("category", "Choose a category.");

  const propertyType = str(body, "propertyType", 100);
  if (!propertyType) v.add("propertyType", "Choose a property type.");

  const title = str(body, "title", 200);
  if (!title) v.add("title", "Enter the project / property name.");

  const description = sanitizeRichText(str(body, "description", 50000));
  if (!richTextToPlain(description)) v.add("description", "Add a short description.");

  const city = str(body, "city", 100);
  if (!city) v.add("city", "Enter the city.");
  const state = str(body, "state", 100);
  if (!state) v.add("state", "Enter the state.");
  const country = str(body, "country", 100) || DEFAULT_COUNTRY;

  let pincode = str(body, "pincode", 12);
  if (pincode && !/^[A-Za-z0-9 -]{3,12}$/.test(pincode)) {
    v.add("pincode", "Enter a valid PIN code.");
    pincode = "";
  }

  const latitude = optionalNum(body, "latitude");
  const longitude = optionalNum(body, "longitude");
  let hasLocation = latitude !== null || longitude !== null;
  if (hasLocation && !isValidLatLng(latitude, longitude)) {
    v.add("location", "Pick a valid point on the map, or clear the location.");
    hasLocation = false;
  }

  const status = oneOf(possessionStatuses, str(body, "status"));
  if (!status) v.add("status", "Choose a status.");

  const priceMin = Math.round(num(body, "priceMin"));
  let priceMax = Math.round(num(body, "priceMax")) || priceMin;
  if (priceMin && priceMax < priceMin) {
    v.add("priceMax", "Max price is lower than min price.");
    priceMax = priceMin;
  }

  const areaMin = num(body, "areaMin");
  let areaMax = num(body, "areaMax") || areaMin;
  if (areaMin && areaMax < areaMin) {
    v.add("areaMax", "Max area is lower than min area.");
    areaMax = areaMin;
  }
  const areaUnit = oneOf(areaUnits, str(body, "areaUnit"));
  if (!areaUnit) v.add("areaUnit", "Choose a unit.");

  const possessionDate = parsePossessionDate(str(body, "possessionDate", 10));
  if (possessionDate === undefined) v.add("possessionDate", "Use the month picker.");

  const reraRegistered = bool(body, "reraRegistered");
  const reraNumber = str(body, "reraNumber", 100);

  const contact = normalizeIndianNumber(str(body, "phone", 30));
  if (!contact) v.add("phone", "Enter a valid mobile number (10 digits, or with country code).");
  const whatsappRaw = str(body, "whatsapp", 30);
  const whatsapp = whatsappRaw ? normalizeIndianNumber(whatsappRaw) : contact;
  if (whatsappRaw && !whatsapp) v.add("whatsapp", "Enter a valid WhatsApp number.");

  const openSides = Math.min(4, Math.round(num(body, "openSides")));
  if (Math.round(num(body, "openSides")) > 4) v.add("openSides", "A plot has at most 4 open sides.");
  const hasConstruction = typeof body.hasConstruction === "boolean" ? body.hasConstruction : null;

  const images = strArray(body, "images", 30).filter((url) => /^(https:\/\/|\/)/.test(url));
  if (images.length === 0) v.add("images", "Upload at least one photo.");

  if (mode === "publish" && v.hasErrors) throw validationError(v.errors);

  const resolvedCategory = category ?? "Residential";
  const isPlot = resolvedCategory === "Plot";
  return {
    title: title || "Untitled draft",
    builder: str(body, "builder", 200),
    description,
    category: resolvedCategory,
    propertyType: propertyType || propertyTypes[resolvedCategory][0],
    // Plots no longer have a "plot sizes" field; the single plot area is used instead.
    configurations: isPlot ? [] : strArray(body, "configurations"),
    address: str(body, "address", 500),
    locality: str(body, "locality", 200),
    city,
    state,
    country,
    pincode,
    latitude: hasLocation ? latitude : null,
    longitude: hasLocation ? longitude : null,
    priceMin,
    priceMax,
    areaMin,
    areaMax,
    areaUnit: areaUnit ?? defaultAreaUnit[resolvedCategory],
    status: status ?? "New Launch",
    possessionDate: possessionDate ?? null,
    reraRegistered,
    reraNumber: reraRegistered ? reraNumber : "",
    usps: strArray(body, "usps"),
    amenities: strArray(body, "amenities"),
    images,
    phone: contact?.phone ?? "",
    whatsapp: whatsapp?.whatsapp ?? "",
    ownership: str(body, "ownership", 100),
    facing: str(body, "facing", 50),
    furnishing: isPlot ? "" : str(body, "furnishing", 50),
    approvalAuthority: isPlot ? str(body, "approvalAuthority", 100) : "",
    cornerPlot: isPlot && bool(body, "cornerPlot"),
    openSides: isPlot ? openSides : 0,
    hasConstruction: isPlot ? hasConstruction : null,
    isFeatured: bool(body, "isFeatured"),
    isActive: body.isActive === undefined ? true : bool(body, "isActive"),
  };
}

/** For PATCH /api/properties/:id/status — only the visibility flags. */
export function validateStatusInput(body: Record<string, unknown>) {
  const changes: { isFeatured?: boolean; isActive?: boolean } = {};
  if (typeof body.isFeatured === "boolean") changes.isFeatured = body.isFeatured;
  if (typeof body.isActive === "boolean") changes.isActive = body.isActive;
  if (Object.keys(changes).length === 0) {
    throw validationError({ status: "Send isFeatured and/or isActive as true or false." });
  }
  return changes;
}
