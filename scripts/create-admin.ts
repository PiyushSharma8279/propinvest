/**
 * Creates an admin account, or promotes an existing user to admin.
 *   npm run create-admin -- --email you@example.com --name "Your Name" --password "a-long-password"
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : undefined;
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim() || "Admin";
  const password = arg("password");

  if (!email || !password) {
    console.error('Usage: npm run create-admin -- --email you@example.com --name "Your Name" --password "a-long-password"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const { users } = schema;
  const passwordHash = await bcrypt.hash(password, 10);
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing) {
    await db.update(users).set({ role: "admin", passwordHash, name, isActive: true }).where(eq(users.id, existing.id));
    console.log(`Updated ${email}: role is now admin and the password was reset.`);
  } else {
    await db.insert(users).values({ email, name, passwordHash, role: "admin" });
    console.log(`Created admin ${email}. Sign in at /login.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
