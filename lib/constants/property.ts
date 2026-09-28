/** Shared by the database schema, the public site and the admin panel. Safe in client components. */

export const categories = ["Residential", "Commercial", "Plot"] as const;
export type PropertyCategory = (typeof categories)[number];

export const possessionStatuses = ["New Launch", "Under Construction", "Ready to Move"] as const;
export type PossessionStatus = (typeof possessionStatuses)[number];

export const userRoles = ["admin", "user"] as const;
export type UserRole = (typeof userRoles)[number];

export const categoryLabels: Record<PropertyCategory, string> = {
  Residential: "Residential",
  Commercial: "Commercial",
  Plot: "Plots & Land",
};

export const propertyTypes: Record<PropertyCategory, string[]> = {
  Residential: [
    "Apartment",
    "Villa",
    "Independent House",
    "Builder Floor",
    "Penthouse",
    "Studio Apartment",
  ],
  Commercial: [
    "Office Space",
    "Retail Shop",
    "Showroom",
    "Food Court",
    "Serviced Apartment",
    "Co-working Space",
    "Warehouse",
  ],
  Plot: [
    "Residential Plot",
    "Commercial Plot",
    "Industrial Plot",
    "Farmhouse Plot",
    "Agricultural Land",
  ],
};

export const areaUnits = ["sq.ft.", "sq.yd.", "sq.m.", "acre"] as const;

export const defaultAreaUnit: Record<PropertyCategory, string> = {
  Residential: "sq.ft.",
  Commercial: "sq.ft.",
  Plot: "sq.yd.",
};

/** What "configurations" means for each category, and quick-pick presets for the admin form. */
export const configurationField: Record<
  PropertyCategory,
  { label: string; hint: string; presets: string[] }
> = {
  Residential: {
    label: "Configurations (BHK)",
    hint: "e.g. 2 BHK, 3 BHK",
    presets: ["1 RK", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK", "6 BHK"],
  },
  Commercial: {
    label: "Unit types",
    hint: "e.g. Retail Shop, Office Space, Food Court",
    presets: ["Retail Shop", "Office Space", "Showroom", "Food Court", "Anchor Store", "Studio"],
  },
  Plot: {
    label: "Plot sizes",
    hint: "e.g. 100 sq.yd., 200 sq.yd.",
    presets: ["50 sq.yd.", "100 sq.yd.", "120 sq.yd.", "150 sq.yd.", "200 sq.yd.", "250 sq.yd.", "300 sq.yd.", "500 sq.yd."],
  },
};

export const ownershipOptions = ["Freehold", "Leasehold", "Power of Attorney", "Co-operative Society"];

export const facingOptions = [
  "East",
  "West",
  "North",
  "South",
  "North-East",
  "North-West",
  "South-East",
  "South-West",
];

export const furnishingOptions = ["Unfurnished", "Semi-Furnished", "Fully Furnished", "Bare Shell", "Warm Shell"];

export const amenitySuggestions: Record<PropertyCategory, string[]> = {
  Residential: [
    "Clubhouse",
    "Swimming Pool",
    "Gymnasium",
    "24x7 Security",
    "Power Backup",
    "Landscaped Gardens",
    "Kids Play Area",
    "Jogging Track",
    "Covered Parking",
    "Lift",
  ],
  Commercial: [
    "24x7 Security",
    "Power Backup",
    "High-speed Lifts",
    "Food Court",
    "Visitor Parking",
    "Central Air Conditioning",
    "Fire Safety",
    "CCTV Surveillance",
  ],
  Plot: [
    "Gated Community",
    "Boundary Wall",
    "Wide Internal Roads",
    "Street Lights",
    "Water Supply",
    "Electricity Connection",
    "Sewage System",
    "Park",
    "24x7 Security",
  ],
};

export const bedroomOptions = ["1", "2", "3", "4", "5", "6"];

export const sortOptions = [
  { value: "", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "area-desc", label: "Area: Largest First" },
  { value: "possession", label: "Possession Date" },
] as const;
export type SortOption = Exclude<(typeof sortOptions)[number]["value"], "">;

export const DEFAULT_COUNTRY = "India";
export const PAGE_SIZE = 12;

/* ---------- Plots ---------- */

export const openSideOptions = [1, 2, 3, 4] as const;

/** Development authorities offered in the plot form; "Other" reveals a free-text box. */
export const approvalAuthorityOptions = ["YEIDA", "Greater Noida (GNIDA)", "Noida Authority"] as const;
export const OTHER_AUTHORITY = "Other";

/** Square metres in one unit of each area unit, for per-unit rate conversions. */
export const sqmPerUnit: Record<(typeof areaUnits)[number], number> = {
  "sq.ft.": 0.09290304,
  "sq.yd.": 0.83612736,
  "sq.m.": 1,
  acre: 4046.8564224,
};

export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;


/** Quick picks for the optional payment plan field; admins can also type their own (e.g. "20 into 5"). */
export const paymentPlanPresets = ["20:80", "25:75", "10:90", "30:70", "40:60", "Construction Linked (CLP)", "Down Payment", "Possession Linked"];
