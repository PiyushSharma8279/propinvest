import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, signToken, TOKEN_TTL_SECONDS, verifyToken } from "@/lib/auth/jwt";
import type { SessionUser } from "@/lib/types";
import { env } from "../env";
import { forbidden, HttpError, unauthorized } from "../http";
import {
  dummyHash,
  findUserByEmail,
  findUserById,
  toSessionUser,
  verifyPassword,
} from "./user.service";

/* ---------- Login throttling ---------- */

const MAX_FAILED_LOGINS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const failedLogins = new Map<string, { count: number; resetAt: number }>();

/**
 * Slows down password guessing: after 10 wrong attempts for the same email from the same IP,
 * further attempts are refused for 15 minutes. In-memory, so it is per server instance — a
 * speed bump, not a guarantee; a strong admin password is still the real protection.
 */
function assertLoginAllowed(key: string): void {
  const entry = failedLogins.get(key);
  if (!entry) return;
  if (Date.now() > entry.resetAt) {
    failedLogins.delete(key);
    return;
  }
  if (entry.count >= MAX_FAILED_LOGINS) {
    const minutes = Math.ceil((entry.resetAt - Date.now()) / 60000);
    throw new HttpError(429, `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
  }
}

function recordFailedLogin(key: string): void {
  const now = Date.now();
  const entry = failedLogins.get(key);
  if (!entry || now > entry.resetAt) failedLogins.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  else entry.count++;
  if (failedLogins.size > 10_000) failedLogins.clear(); // never let the map grow unbounded
}

export async function login(email: string, password: string, ip = "unknown"): Promise<SessionUser> {
  const key = `${ip}|${email.toLowerCase()}`;
  assertLoginAllowed(key);
  const user = await findUserByEmail(email);
  // Always run bcrypt so "no such email" and "wrong password" take the same time.
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()));
  if (!user || !ok || !user.isActive) {
    recordFailedLogin(key);
    throw unauthorized("Wrong email or password.");
  }
  failedLogins.delete(key);
  const session = toSessionUser(user);
  await setAuthCookie(session);
  return session;
}

export async function logout(): Promise<void> {
  (await cookies()).delete(AUTH_COOKIE);
}

async function setAuthCookie(user: SessionUser): Promise<void> {
  const token = await signToken(user);
  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

/** The user from the JWT cookie (no database hit). Fine for rendering; use requireUser for writes. */
export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  return verifyToken(token);
}

/**
 * Verifies the cookie AND re-reads the user from the database, so a deactivated or
 * demoted account loses access immediately even though its JWT hasn't expired yet.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw unauthorized();
  const user = await findUserById(session.id);
  if (!user || !user.isActive) throw unauthorized();
  return toSessionUser(user);
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw forbidden();
  return user;
}

/* ---------- For server-rendered pages: redirect instead of throwing ---------- */

export async function requireUserPage(next = "/account"): Promise<SessionUser> {
  try {
    return await requireUser();
  } catch {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
}

export async function requireAdminPage(next = "/admin"): Promise<SessionUser> {
  const user = await requireUserPage(next);
  if (user.role !== "admin") redirect("/account");
  return user;
}
