/**
 * Imports data/properties.json into an EMPTY properties table.
 *   npm run db:seed
 * Does nothing if the table already has rows, so it's safe to run again.
 */
import { count } from "drizzle-orm";
import seedData from "../data/properties.json";
import { slugify } from "../lib/utils/slug";
import { db, schema } from "./db";

type SeedRow = (typeof seedData)[number] & {
  address?: string;
  country?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
};

async function main() {
  const [{ total }] = await db.select({ total: count() }).from(schema.properties);
  if (total > 0) {
    console.log(`properties already has ${total} rows — nothing imported.`);
    return;
  }

  const rows = (seedData as SeedRow[]).map((row) => ({
    slug: slugify(row.title),
    title: row.title,
    builder: row.builder,
    description: row.description,
    category: row.category as "Residential" | "Commercial" | "Plot",
    propertyType: row.propertyType,
    configurations: row.configurations,
    address: row.address ?? "",
    locality: row.locality,
    city: row.city,
    state: row.state,
    country: row.country ?? "India",
    pincode: row.pincode ?? "",
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    priceMin: row.priceMin,
    priceMax: row.priceMax,
    areaMin: row.areaMin,
    areaMax: row.areaMax,
    areaUnit: row.areaUnit,
    status: row.status as "New Launch" | "Under Construction" | "Ready to Move",
    possessionDate: row.possessionDate || null,
    reraRegistered: row.reraRegistered,
    reraNumber: row.reraNumber,
    usps: row.usps,
    amenities: row.amenities,
    images: row.images,
    phone: row.phone,
    whatsapp: row.whatsapp,
    isFeatured: row.featured,
  }));

  await db.insert(schema.properties).values(rows);
  console.log(`Imported ${rows.length} properties.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
