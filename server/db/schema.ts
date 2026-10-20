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
  uniqueIndex,
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
    /** Legacy (replaced by prelaunchRate / launchRate); kept so existing values are not lost. */
    priceTag: text("price_tag").notNull().default(""),
    /** Optional offer rates in ₹ per areaUnit (plots & residential); 0 = not given. */
    prelaunchRate: doublePrecision("prelaunch_rate").notNull().default(0),
    launchRate: doublePrecision("launch_rate").notNull().default(0),
    /** Optional payment plan, e.g. "20:80", "CLP", "20 into 5"; "" = not given. */
    paymentPlan: text("payment_plan").notNull().default(""),
    /** Residential: optional built-up and carpet area, in areaUnit; 0 = not given. */
    builtUpArea: real("built_up_area").notNull().default(0),
    carpetArea: real("carpet_area").notNull().default(0),
    /** Residential: number of toilets / bathrooms and kitchens; 0 = not given. */
    bathrooms: integer("bathrooms").notNull().default(0),
    kitchens: integer("kitchens").notNull().default(0),

    status: possessionStatusEnum("status").notNull(),
    possessionDate: date("possession_date", { mode: "string" }),
    reraRegistered: boolean("rera_registered").notNull().default(false),
    reraNumber: text("rera_number").notNull().default(""),

    usps: jsonb("usps").$type<string[]>().notNull().default([]),
    amenities: jsonb("amenities").$type<string[]>().notNull().default([]),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    /** Optional brochure / price-list PDF. Never sent to the browser until a visitor leaves their number. */
    brochureUrl: text("brochure_url").notNull().default(""),

    /** E.164, e.g. +919810000001 */
    phone: text("phone").notNull(),
    /** Digits only with country code, e.g. 919810000001 */
    whatsapp: text("whatsapp").notNull(),

    ownership: text("ownership").notNull().default(""),
    facing: text("facing").notNull().default(""),
    furnishing: text("furnishing").notNull().default(""),
    approvalAuthority: text("approval_authority").notNull().default(""),

    // Provenance — admin only, never shown as a claim unless verificationStatus is "verified".
    /** Where the details came from, e.g. "Builder's brochure received 12 Oct 2026". */
    listingSource: text("listing_source").notNull().default(""),
    /** One of verificationStatuses. */
    verificationStatus: text("verification_status").notNull().default("unverified"),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    /** One of availabilityStatuses. "unavailable" hides the listing from the public site. */
    availability: text("availability").notNull().default("available"),
    /** When the owner / builder last confirmed it is still available. */
    availabilityConfirmedAt: timestamp("availability_confirmed_at", { withTimezone: true }),
    /** Owner / builder / channel partner this listing belongs to (partners.id). */
    partnerId: integer("partner_id"),
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

/** Enquiries left on the website (enquiry form, brochure download, price list request). */
export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    /** E.164, e.g. +919810000001 */
    phone: text("phone").notNull(),
    budget: text("budget").notNull().default(""),
    message: text("message").notNull().default(""),
    /** One of leadSources. */
    source: text("source").notNull().default("enquiry"),
    /** One of leadStatuses. */
    status: text("status").notNull().default("new"),
    propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
    /** Title at the time of the enquiry, so the lead still reads well if the listing is renamed or removed. */
    projectTitle: text("project_title").notNull().default(""),
    pageUrl: text("page_url").notNull().default(""),

    // Buyer requirement (from the form, or filled in by the admin after a call)
    preferredLocation: text("preferred_location").notNull().default(""),
    preferredPropertyType: text("preferred_property_type").notNull().default(""),
    /** One of purchaseTimelines, or "". */
    timeline: text("timeline").notNull().default(""),

    // Follow-up
    followUpAt: timestamp("follow_up_at", { withTimezone: true }),
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    /** Free-text next step, e.g. "Send floor plans after 6 pm". */
    nextAction: text("next_action").notNull().default(""),

    // Outcome — entered by the admin only; nothing here is estimated.
    /** Agreed deal value in rupees; 0 = not recorded. */
    dealValue: bigint("deal_value", { mode: "number" }).notNull().default(0),
    /** Commission in rupees; 0 = not recorded. */
    commissionAmount: bigint("commission_amount", { mode: "number" }).notNull().default(0),
    /** One of commissionStatuses. */
    commissionStatus: text("commission_status").notNull().default(""),
    commissionConfirmedAt: timestamp("commission_confirmed_at", { withTimezone: true }),

    // Attribution (first visit in the last 30 days; "" when unknown)
    utmSource: text("utm_source").notNull().default(""),
    utmMedium: text("utm_medium").notNull().default(""),
    utmCampaign: text("utm_campaign").notNull().default(""),
    utmTerm: text("utm_term").notNull().default(""),
    utmContent: text("utm_content").notNull().default(""),
    /** External site the visitor first came from, e.g. https://www.google.com/ */
    referrer: text("referrer").notNull().default(""),
    /** First page of that visit, path only. */
    landingPage: text("landing_page").notNull().default(""),

    // Consent
    /** PRIVACY_NOTICE_VERSION shown with the form when the enquiry was sent. */
    privacyNoticeVersion: text("privacy_notice_version").notNull().default(""),
    /** Ticked the optional "send me similar projects" box. Never pre-ticked. */
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
    /** Asked not to be contacted again: WhatsApp / call actions are hidden in the admin panel. */
    optedOut: boolean("opted_out").notNull().default(false),
    optedOutAt: timestamp("opted_out_at", { withTimezone: true }),

    // New-lead notification (email / Telegram), retried by the daily job until it succeeds
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    notifyAttempts: integer("notify_attempts").notNull().default(0),
    lastNotifyAttemptAt: timestamp("last_notify_attempt_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("leads_created_idx").on(t.createdAt),
    index("leads_status_idx").on(t.status),
    index("leads_follow_up_idx").on(t.followUpAt),
    index("leads_phone_idx").on(t.phone),
  ]
);

/** History of a lead: status changes, notes, calls, notifications. Append-only. */
export const leadActivities = pgTable(
  "lead_activities",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    /** Admin who did it; null for the website / background jobs. */
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    /** One of leadActivityTypes. */
    type: text("type").notNull(),
    note: text("note").notNull().default(""),
    /** e.g. { from, to } for status changes, provider results for notifications. Never secrets. */
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("lead_activities_lead_idx").on(t.leadId, t.createdAt),
    index("lead_activities_type_idx").on(t.type, t.createdAt),
  ]
);

/** Builders and authorised channel partners the team is talking to. Entered by an admin. */
export const partners = pgTable(
  "partners",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    company: text("company").notNull().default(""),
    /** One of partnerTypes. */
    partnerType: text("partner_type").notNull().default("builder"),
    phone: text("phone").notNull().default(""),
    email: text("email").notNull().default(""),
    city: text("city").notNull().default(""),
    website: text("website").notNull().default(""),
    /** One of partnerCategories. */
    category: text("category").notNull().default(""),
    /** How the contact was obtained, e.g. "Met at site office", "Public website contact page". */
    contactSource: text("contact_source").notNull().default(""),
    /** Page the public business contact details were taken from. */
    sourceUrl: text("source_url").notNull().default(""),
    researchedAt: timestamp("researched_at", { withTimezone: true }),
    /** When the contact details were last checked against the source. */
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    /** One of partnerStatuses. */
    status: text("status").notNull().default("not_contacted"),
    nextAction: text("next_action").notNull().default(""),
    /** Onboarding checklist: { [itemId]: ISO date ticked }. */
    onboarding: jsonb("onboarding").$type<Record<string, string>>().notNull().default({}),
    nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
    notes: text("notes").notNull().default(""),
    /** Asked not to be contacted: message templates are disabled for them. */
    doNotContact: boolean("do_not_contact").notNull().default(false),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("partners_status_idx").on(t.status), index("partners_follow_up_idx").on(t.nextFollowUpAt)]
);

export const partnerActivities = pgTable(
  "partner_activities",
  {
    id: serial("id").primaryKey(),
    partnerId: integer("partner_id")
      .notNull()
      .references(() => partners.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    /** One of partnerActivityTypes. */
    type: text("type").notNull(),
    note: text("note").notNull().default(""),
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("partner_activities_partner_idx").on(t.partnerId, t.createdAt),
    index("partner_activities_type_idx").on(t.type, t.createdAt),
  ]
);

/** Content pipeline: guides and posts to write. Publishing is always done by hand. */
export const contentIdeas = pgTable(
  "content_ideas",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    /** One of contentTypes. */
    contentType: text("content_type").notNull().default("location_guide"),
    targetKeyword: text("target_keyword").notNull().default(""),
    city: text("city").notNull().default(""),
    /** One of contentStatuses. */
    status: text("status").notNull().default("idea"),
    /** Where it was published, once it is. */
    url: text("url").notNull().default(""),
    notes: text("notes").notNull().default(""),
    dueDate: date("due_date", { mode: "string" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("content_ideas_status_idx").on(t.status)]
);

/** One row per scheduled-job run, so a retried or repeated cron call never sends twice. */
export const jobRuns = pgTable(
  "job_runs",
  {
    id: serial("id").primaryKey(),
    job: text("job").notNull(),
    /** e.g. the IST date for a daily digest. */
    runKey: text("run_key").notNull(),
    result: jsonb("result").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("job_runs_job_key_idx").on(t.job, t.runKey)]
);

/** Listings sent in by owners / builders through /list-your-property. Reviewed by an admin. */
export const propertySubmissions = pgTable(
  "property_submissions",
  {
    id: serial("id").primaryKey(),
    /** The owner / partner record this submission was matched to or created as. */
    partnerId: integer("partner_id").references(() => partners.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull().default(""),
    /** One of submitterTypes. */
    submitterType: text("submitter_type").notNull().default("owner"),
    /** "call" | "whatsapp" | "email" */
    preferredContact: text("preferred_contact").notNull().default("whatsapp"),

    title: text("title").notNull(),
    category: text("category").notNull(),
    propertyType: text("property_type").notNull().default(""),
    locality: text("locality").notNull().default(""),
    city: text("city").notNull(),
    address: text("address").notNull().default(""),
    /** Rupees; 0 = not given. */
    price: bigint("price", { mode: "number" }).notNull().default(0),
    area: real("area").notNull().default(0),
    areaUnit: text("area_unit").notNull().default("sq.ft."),
    description: text("description").notNull().default(""),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    reraNumber: text("rera_number").notNull().default(""),

    /** Ticked "I own / am authorised to market this property and allow it to be published". */
    authorizationConfirmed: boolean("authorization_confirmed").notNull().default(false),
    /** SUBMISSION_TERMS_VERSION shown with the form. */
    termsVersion: text("terms_version").notNull().default(""),

    /** One of submissionStatuses. */
    status: text("status").notNull().default("pending"),
    /** Note to self / reason given to the submitter. */
    reviewNote: text("review_note").notNull().default(""),
    reviewedBy: integer("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    /** Draft listing created from this submission on approval. */
    propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
    /** Ids of possibly matching listings / submissions found when it arrived. */
    possibleDuplicates: jsonb("possible_duplicates").$type<{ properties: number[]; submissions: number[] }>().notNull().default({ properties: [], submissions: [] }),
    ...timestamps,
  },
  (t) => [index("property_submissions_status_idx").on(t.status), index("property_submissions_phone_idx").on(t.phone)]
);

/** Who changed what, for sensitive admin actions (exports, approvals, deletions, opt-outs). */
export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: integer("entity_id"),
    summary: text("summary").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_created_idx").on(t.createdAt)]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadActivity = typeof leadActivities.$inferSelect;
export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;
export type PartnerActivity = typeof partnerActivities.$inferSelect;
export type ContentIdea = typeof contentIdeas.$inferSelect;
export type PropertySubmission = typeof propertySubmissions.$inferSelect;
export type AuditEntry = typeof auditLog.$inferSelect;
