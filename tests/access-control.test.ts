import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { AUTH_COOKIE, signToken } from "@/lib/auth/jwt";
import { proxy } from "../proxy";

// Read lazily by lib/auth/jwt.ts, so setting it here (after the imports) is enough.
process.env.JWT_SECRET ??= "test-secret-test-secret-test-secret-0123";

async function visit(path: string, role?: "admin" | "user") {
  const request = new NextRequest(`http://localhost${path}`);
  if (role) request.cookies.set(AUTH_COOKIE, await signToken({ id: 1, name: "T", email: "t@example.com", role }));
  const res = await proxy(request);
  return { status: res.status, location: res.headers.get("location") };
}

describe("proxy (page access)", () => {
  it("sends signed-out visitors of every admin page to /login", async () => {
    for (const path of ["/admin", "/admin/leads", "/admin/leads/5", "/admin/partners", "/admin/reports", "/admin/quality"]) {
      const res = await visit(path);
      assert.equal(res.status, 307, path);
      assert.match(res.location ?? "", /\/login\?next=/, path);
    }
  });

  it("keeps non-admin users out of the admin panel", async () => {
    const res = await visit("/admin/leads", "user");
    assert.match(res.location ?? "", /\/account$/);
  });

  it("lets admins through", async () => {
    const res = await visit("/admin/leads", "admin");
    assert.equal(res.location, null);
  });

  it("rejects a tampered token", async () => {
    const request = new NextRequest("http://localhost/admin");
    request.cookies.set(AUTH_COOKIE, "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIn0.forged");
    const res = await proxy(request);
    assert.match(res.headers.get("location") ?? "", /\/login/);
  });
});

/**
 * API routes check access in their controllers. This guards against a new admin endpoint being
 * added without requireAdmin(): every exported handler must call it unless it is on the public list.
 */
describe("API controllers", () => {
  const PUBLIC = new Set([
    "lead.controller.ts:create", // public enquiry form
    "lead.controller.ts:clientIp", // helper
    "lead.controller.ts:csvResponse", // helper
    "auth.controller.ts:login",
    "auth.controller.ts:logout",
    "auth.controller.ts:me",
    "property.controller.ts:list", // public search
    "cron.controller.ts:daily", // protected by CRON_SECRET instead
    "submission.controller.ts:imageHosts", // helper
    "submission.controller.ts:create", // public "List your property" form (saved as pending)
    "submission.controller.ts:upload", // public photo upload for that form (images only, rate-limited)
  ]);

  it("every non-public handler calls requireAdmin()", () => {
    const dir = join(process.cwd(), "server", "controllers");
    const missing: string[] = [];
    for (const file of readdirSync(dir)) {
      const source = readFileSync(join(dir, file), "utf8");
      const parts = source.split(/\nexport (?:const|async function|function) /).slice(1);
      for (const part of parts) {
        const name = part.match(/^(\w+)/)?.[1] ?? "?";
        if (PUBLIC.has(`${file}:${name}`)) continue;
        if (!/requireAdmin\(\)/.test(part)) missing.push(`${file}:${name}`);
      }
    }
    assert.deepEqual(missing, []);
  });

  it("the cron endpoint checks the secret", () => {
    const source = readFileSync(join(process.cwd(), "server", "controllers", "cron.controller.ts"), "utf8");
    assert.match(source, /isAuthorizedCron\(/);
  });
});
