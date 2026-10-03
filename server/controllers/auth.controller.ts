import "server-only";
import { handle, json, readJson } from "../http";
import * as authService from "../services/auth.service";
import { validateLogin } from "../validators/auth.validator";

/** POST /api/auth/login  { email, password } */
export const login = handle(async (request: Request) => {
  const { email, password } = validateLogin(await readJson(request));
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const user = await authService.login(email, password, ip);
  return json({ user });
});

/** POST /api/auth/logout */
export const logout = handle(async () => {
  await authService.logout();
  return json({ ok: true });
});

/** GET /api/auth/me — the signed-in user, or null. */
export const me = handle(async () => {
  return json({ user: await authService.getSession() });
});
