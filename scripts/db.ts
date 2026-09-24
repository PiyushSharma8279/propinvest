/** Standalone database connection for CLI scripts (the app's server/db/client.ts is server-only). */
import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../server/db/schema";

loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local first.");
  process.exit(1);
}

export const db = drizzle(process.env.DATABASE_URL, { schema });
export { schema };
