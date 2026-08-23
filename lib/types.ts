export type PossessionStatus = "New Launch" | "Under Construction" | "Ready to Move";

export type PropertyCategory = "Residential" | "Commercial";

export interface Property {
  id: string;
  slug: string;
  title: string;
  builder: string;
  city: string;
  locality: string;
  state: string;
  /** High-level split used for filtering — "Residential" or "Commercial" */
  category: PropertyCategory;
  propertyType: string;
  configurations: string[];
  priceMin: number;
  priceMax: number;
  priceDisplay: string;
  areaMin: number;
  areaMax: number;
  areaUnit: string;
  status: PossessionStatus;
  possessionDate: string;
  possessionDisplay: string;
  reraRegistered: boolean;
  reraNumber: string;
  featured: boolean;
  description: string;
  usps: string[];
  amenities: string[];
  images: string[];
  /** E.164 format, used for the tel: click-to-call link */
  phone: string;
  /** Digits only with country code, used for the wa.me WhatsApp link */
  whatsapp: string;
}

export interface ProjectFilters {
  city?: string;
  /** "Residential" or "Commercial" */
  category?: PropertyCategory;
  /** One or more BHK values, e.g. ["2", "3"] */
  bhk?: string[];
  minBudget?: number;
  maxBudget?: number;
  /** One or more of "New Launch" | "Under Construction" | "Ready to Move" */
  possession?: string[];
  rera?: boolean;
  sort?: "price-asc" | "price-desc" | "possession";
}
