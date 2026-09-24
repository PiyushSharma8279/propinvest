import "server-only";
import { handle, json, readJson } from "../http";
import * as authService from "../services/auth.service";
import { validateLogin, validateRegister } from "../validators/auth.validator";

/** POST /api/auth/login  { email, password } */
export const login = handle(async (request: Request) => {
  const { email, password } = validateLogin(await readJson(request));
  const user = await authService.login(email, password);
  return json({ user });
});

/**
 * POST /api/auth/register  { name, email, password }
 * API only (e.g. Postman) — there is no sign-up page. Always creates role "user";
 * make someone an admin by setting users.role = 'admin' in the database.
 */
export const register = handle(async (request: Request) => {
  const input = validateRegister(await readJson(request));
  const user = await authService.register(input);
  return json({ user }, { status: 201 });
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
