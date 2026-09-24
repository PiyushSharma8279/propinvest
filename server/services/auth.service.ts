import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, signToken, TOKEN_TTL_SECONDS, verifyToken } from "@/lib/auth/jwt";
import type { SessionUser } from "@/lib/types";
import { env } from "../env";
import { forbidden, unauthorized, validationError } from "../http";
import {
  createUser,
  dummyHash,
  findUserByEmail,
  findUserById,
  toSessionUser,
  verifyPassword,
} from "./user.service";

export async function login(email: string, password: string): Promise<SessionUser> {
  const user = await findUserByEmail(email);
  // Always run bcrypt so "no such email" and "wrong password" take the same time.
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()));
  if (!user || !ok || !user.isActive) {
    throw unauthorized("Wrong email or password.");
  }
  const session = toSessionUser(user);
  await setAuthCookie(session);
  return session;
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<SessionUser> {
  if (await findUserByEmail(input.email)) {
    throw validationError({ email: "An account with this email already exists." });
  }
  // Public sign-up always creates a normal user. Admins are created with `npm run create-admin`.
  const user = await createUser({ ...input, role: "user" });
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
