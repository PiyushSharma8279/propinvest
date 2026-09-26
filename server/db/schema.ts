import {
  bigint,
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import {
  categories,
  DEFAULT_COUNTRY,
  possessionStatuses,
  userRoles,
} from "../../lib/constants/property";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const userRoleEnum = pgEnum("user_role", userRoles);
export const propertyCategoryEnum = pgEnum("property_category", categories);
export const possessionStatusEnum = pgEnum("possession_status", possessionStatuses);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  /** Always stored lower-cased. */
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const properties = pgTable(
  "properties",
  {
    id: serial("id").primaryKey(),
    /** Generated from the title; unique. Used in /projects/[slug]. */
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    builder: text("builder").notNull().default(""),
    description: text("description").notNull().default(""),

    category: propertyCategoryEnum("category").notNull(),
    propertyType: text("property_type").notNull(),
    /** BHK options (residential), unit types (commercial) or plot sizes (plots). */
    configurations: jsonb("configurations").$type<string[]>().notNull().default([]),

    // Location
    address: text("address").notNull().default(""),
    locality: text("locality").notNull().default(""),
    city: text("city").notNull(),
    state: text("state").notNull(),
    country: text("country").notNull().default(DEFAULT_COUNTRY),
    pincode: text("pincode").notNull().default(""),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),

    // Price (rupees, 0 = on request) and size
    priceMin: bigint("price_min", { mode: "number" }).notNull().default(0),
    priceMax: bigint("price_max", { mode: "number" }).notNull().default(0),
    areaMin: real("area_min").notNull().default(0),
    areaMax: real("area_max").notNull().default(0),
    areaUnit: text("area_unit").notNull().default("sq.ft."),

    status: possessionStatusEnum("status").notNull(),
    possessionDate: date("possession_date", { mode: "string" }),
    reraRegistered: boolean("rera_registered").notNull().default(false),
    reraNumber: text("rera_number").notNull().default(""),

    usps: jsonb("usps").$type<string[]>().notNull().default([]),
    amenities: jsonb("amenities").$type<string[]>().notNull().default([]),
    images: jsonb("images").$type<string[]>().notNull().default([]),

    /** E.164, e.g. +919810000001 */
    phone: text("phone").notNull(),
    /** Digits only with country code, e.g. 919810000001 */
    whatsapp: text("whatsapp").notNull(),

    ownership: text("ownership").notNull().default(""),
    facing: text("facing").notNull().default(""),
    furnishing: text("furnishing").notNull().default(""),
    approvalAuthority: text("approval_authority").notNull().default(""),
    cornerPlot: boolean("corner_plot").notNull().default(false),
    /** Plots: number of open sides (1-4); 0 = not specified. */
    openSides: integer("open_sides").notNull().default(0),
    /** Plots: whether there is any construction on the plot; null = not specified. */
    hasConstruction: boolean("has_construction"),

    // Visibility
    /** Drafts are autosaved while a listing is being written; never shown on the website. */
    isDraft: boolean("is_draft").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    /** Soft delete: rows are never removed, only flagged. */
    isDeleted: boolean("is_deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),

    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    index("properties_visibility_idx").on(t.isDeleted, t.isActive),
    index("properties_category_idx").on(t.category),
    index("properties_city_idx").on(t.city),
    index("properties_state_idx").on(t.state),
    index("properties_country_idx").on(t.country),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
