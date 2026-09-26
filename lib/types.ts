import type { Property, User } from "@/server/db/schema";
import type {
  PossessionStatus,
  PropertyCategory,
  SortOption,
  UserRole,
} from "@/lib/constants/property";

export type { Property, User, PossessionStatus, PropertyCategory, SortOption, UserRole };

/** What the browser and JWT know about the signed-in user. Never includes the password hash. */
export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

/** Filters for the public /projects listing. Budgets are in rupees. */
export interface PropertyFilters {
  /** Free-text location search: address, locality, city, state, country */
  q?: string;
  city?: string;
  state?: string;
  country?: string;
  category?: PropertyCategory;
  type?: string;
  bhk?: string[];
  minBudget?: number;
  maxBudget?: number;
  minArea?: number;
  maxArea?: number;
  possession?: PossessionStatus[];
  rera?: boolean;
  furnishing?: string;
  facing?: string;
  sort?: SortOption;
  page: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Filter tabs in the admin property list. */
export type AdminPropertyView = "all" | "active" | "inactive" | "featured" | "drafts" | "deleted";

export interface LocationOptions {
  cities: string[];
  states: string[];
  countries: string[];
}
