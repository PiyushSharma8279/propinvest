import "server-only";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/client";
import type { SessionUser, User, UserRole } from "@/lib/types";

const { users } = schema;
const BCRYPT_ROUNDS = 10;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function toSessionUser(user: User): SessionUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, normalizeEmail(email))).limit(1);
  return user;
}

export async function findUserById(id: number): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}): Promise<User> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const [user] = await db
    .insert(users)
    .values({
      name: input.name.trim(),
      email: normalizeEmail(input.email),
      passwordHash,
      role: input.role ?? "user",
    })
    .returning();
  return user;
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

let cachedDummyHash: Promise<string> | undefined;
/** A throwaway hash to compare against when the email doesn't exist (timing-safe login). */
export function dummyHash(): Promise<string> {
  cachedDummyHash ??= bcrypt.hash("not-a-real-password", BCRYPT_ROUNDS);
  return cachedDummyHash;
}
