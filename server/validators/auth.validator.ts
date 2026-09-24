import { validationError } from "../http";
import { collectErrors, str } from "./helpers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function password(body: Record<string, unknown>): string {
  return typeof body.password === "string" ? body.password : "";
}

export function validateLogin(body: Record<string, unknown>) {
  const email = str(body, "email", 254);
  const pass = password(body);
  const v = collectErrors();
  if (!EMAIL_RE.test(email)) v.add("email", "Enter a valid email.");
  if (!pass) v.add("password", "Enter your password.");
  if (v.hasErrors) throw validationError(v.errors);
  return { email, password: pass };
}

export function validateRegister(body: Record<string, unknown>) {
  const name = str(body, "name", 100);
  const email = str(body, "email", 254);
  const pass = password(body);
  const v = collectErrors();
  if (!name) v.add("name", "Enter your name.");
  if (!EMAIL_RE.test(email)) v.add("email", "Enter a valid email.");
  if (pass.length < 8) v.add("password", "Use at least 8 characters.");
  if (pass.length > 72) v.add("password", "Use at most 72 characters.");
  if (v.hasErrors) throw validationError(v.errors);
  return { name, email, password: pass };
}
