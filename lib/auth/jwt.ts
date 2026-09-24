import { jwtVerify, SignJWT } from "jose";
import type { SessionUser } from "@/lib/types";

/**
 * JWT helpers. Only uses `jose` (Web Crypto), so it runs in the proxy as well as on the server.
 * The token lives in an httpOnly cookie; the browser's JavaScript never sees it.
 */

export const AUTH_COOKIE = "pi_token";
export const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set to a random string of at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(secretKey());
}

/** Returns the session user, or null if the token is missing, expired or tampered with. */
export async function verifyToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const { sub, name, email, role } = payload;
    const id = Number(sub);
    if (!Number.isSafeInteger(id) || id <= 0) return null;
    if (typeof name !== "string" || typeof email !== "string") return null;
    if (role !== "admin" && role !== "user") return null;
    return { id, name, email, role };
  } catch {
    return null;
  }
}
