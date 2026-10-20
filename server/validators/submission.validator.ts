import { areaUnits, categories, propertyTypes } from "@/lib/constants/property";
import {
  contactMethods,
  MAX_SUBMISSION_IMAGES,
  reviewActions,
  submitterTypes,
  SUBMISSION_TERMS_VERSION,
} from "@/lib/constants/submission";
import { normalizeIndianNumber } from "@/lib/utils/phone";
import { validationError } from "../http";
import { isPlausiblePhone } from "./lead.validator";
import { bool, collectErrors, num, oneOf, str, strArray } from "./helpers";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface SubmissionInput {
  name: string;
  phone: string;
  email: string;
  submitterType: (typeof submitterTypes)[number];
  preferredContact: (typeof contactMethods)[number];
  title: string;
  category: (typeof categories)[number];
  propertyType: string;
  locality: string;
  city: string;
  address: string;
  price: number;
  area: number;
  areaUnit: string;
  description: string;
  images: string[];
  reraNumber: string;
  authorizationConfirmed: true;
  termsVersion: string;
  isBot: boolean;
}

/**
 * POST /api/submissions — public "List your property" form. Plain text only (no HTML), photos
 * must be URLs returned by our own upload endpoint (ImageKit), authorisation box required.
 */
export function validateSubmissionInput(body: Record<string, unknown>, allowedImageHosts: string[]): SubmissionInput {
  const v = collectErrors();

  const name = str(body, "name", 100).replace(/\s+/g, " ");
  if (name.length < 2 || !/\p{L}/u.test(name) || /[<>{}]|https?:\/\//i.test(name)) v.add("name", "Please enter your name.");

  const phone = normalizeIndianNumber(str(body, "phone", 30));
  if (!phone || !isPlausiblePhone(phone.phone)) v.add("phone", "Please enter a valid mobile number.");

  const email = str(body, "email", 200).toLowerCase();
  if (email && !EMAIL.test(email)) v.add("email", "Please enter a valid email, or leave it empty.");

  const preferredContact = oneOf(contactMethods, str(body, "preferredContact")) ?? "whatsapp";
  if (preferredContact === "email" && !email) v.add("email", "Add an email if you'd like us to email you.");

  const category = oneOf(categories, str(body, "category"));
  if (!category) v.add("category", "Choose a category.");
  const rawType = str(body, "propertyType", 100);
  const propertyType = category && propertyTypes[category].includes(rawType) ? rawType : "";
  if (!propertyType) v.add("propertyType", "Choose a property type.");

  const title = str(body, "title", 150).replace(/[<>]/g, "");
  if (title.length < 4) v.add("title", "Give the property a short name, e.g. “3 BHK in Sector 150”.");

  const city = str(body, "city", 100);
  if (!city) v.add("city", "Enter the city.");
  const locality = str(body, "locality", 150);
  if (!locality) v.add("locality", "Enter the sector / locality.");

  const price = Math.round(num(body, "price"));
  if (price && price < 100000) v.add("price", "Enter the full price in rupees, e.g. 8500000.");
  const area = num(body, "area");
  const areaUnit = oneOf(areaUnits, str(body, "areaUnit")) ?? "sq.ft.";

  const description = str(body, "description", 3000).replace(/<[^>]*>/g, "");
  if (description.length < 30) v.add("description", "Describe the property in at least a couple of sentences.");

  const images = strArray(body, "images", MAX_SUBMISSION_IMAGES).filter((url) => {
    try {
      const u = new URL(url);
      return u.protocol === "https:" && allowedImageHosts.includes(u.hostname);
    } catch {
      return false;
    }
  });

  if (!bool(body, "authorizationConfirmed")) {
    v.add("authorizationConfirmed", "Please confirm you are the owner or authorised to list this property.");
  }

  if (v.hasErrors) throw validationError(v.errors);

  return {
    name,
    phone: phone!.phone,
    email,
    submitterType: oneOf(submitterTypes, str(body, "submitterType")) ?? "owner",
    preferredContact,
    title,
    category: category!,
    propertyType,
    locality,
    city,
    address: str(body, "address", 300).replace(/[<>]/g, ""),
    price,
    area,
    areaUnit,
    description,
    images,
    reraNumber: str(body, "reraNumber", 100).replace(/[^A-Za-z0-9/_\-. ]/g, ""),
    authorizationConfirmed: true,
    termsVersion: SUBMISSION_TERMS_VERSION,
    isBot: str(body, "website", 200) !== "",
  };
}

/** POST /api/submissions/:id/review  { action, note } — admin. */
export function validateReview(body: Record<string, unknown>) {
  const action = oneOf(reviewActions, str(body, "action", 30));
  if (!action) throw validationError({ action: "Choose a review action." });
  const note = str(body, "note", 2000);
  if ((action === "needs_correction" || action === "reject" || action === "suspend") && !note) {
    throw validationError({ note: "Add a short reason (it helps when you reply to the submitter)." });
  }
  return { action, note };
}
