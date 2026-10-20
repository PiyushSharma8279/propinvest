import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { followUpDigestMessage, newLeadMessage } from "@/server/services/notification-messages";
import { anySent, isNotificationConfigured, sendNotification, type NotifyConfig } from "@/server/services/notify.service";

const none: NotifyConfig = { resendApiKey: "", emailTo: "", emailFrom: "x@y.z", telegramBotToken: "", telegramChatId: "" };
const both: NotifyConfig = {
  resendApiKey: "re_test_key",
  emailTo: "team@example.com",
  emailFrom: "Site <noreply@example.com>",
  telegramBotToken: "123:SECRET",
  telegramChatId: "42",
};
const message = { subject: "New lead", text: "Name: Asha" };
const noSleep = async () => {};

type Call = { url: string; body: string };
function fakeFetch(statuses: (number | Error)[]) {
  const calls: Call[] = [];
  let i = 0;
  const impl = async (url: string, init: RequestInit) => {
    calls.push({ url, body: String(init.body) });
    const next = statuses[Math.min(i++, statuses.length - 1)];
    if (next instanceof Error) throw next;
    return { ok: next >= 200 && next < 300, status: next };
  };
  return { impl, calls };
}

describe("sendNotification", () => {
  it("skips every channel when nothing is configured, without any request", async () => {
    const { impl, calls } = fakeFetch([200]);
    const results = await sendNotification(message, none, impl, noSleep);
    assert.deepEqual(results.map((r) => r.outcome), ["skipped", "skipped"]);
    assert.equal(calls.length, 0);
    assert.equal(isNotificationConfigured(none), false);
    assert.equal(anySent(results), false);
  });

  it("reports sent only when the provider returns 2xx", async () => {
    const { impl, calls } = fakeFetch([200]);
    const results = await sendNotification(message, both, impl, noSleep);
    assert.deepEqual(results.map((r) => [r.channel, r.outcome, r.status]), [
      ["email", "sent", 200],
      ["telegram", "sent", 200],
    ]);
    assert.equal(calls.length, 2);
    assert.match(calls[0].url, /api\.resend\.com/);
    assert.deepEqual(JSON.parse(calls[0].body).to, ["team@example.com"]);
  });

  it("retries 5xx and network errors, then succeeds", async () => {
    const { impl, calls } = fakeFetch([503, new Error("reset"), 200]);
    const [email] = await sendNotification(message, { ...both, telegramBotToken: "" }, impl, noSleep);
    assert.equal(email.outcome, "sent");
    assert.equal(email.attempts, 3);
    assert.equal(calls.length, 3);
  });

  it("does not retry a 4xx and records the failure honestly", async () => {
    const { impl, calls } = fakeFetch([401]);
    const [email, telegram] = await sendNotification(message, { ...both, telegramBotToken: "" }, impl, noSleep);
    assert.equal(email.outcome, "failed");
    assert.equal(email.status, 401);
    assert.equal(email.attempts, 1);
    assert.equal(telegram.outcome, "skipped");
    assert.equal(calls.length, 1);
  });

  it("gives up after 3 failed attempts and never puts secrets in the result", async () => {
    const { impl } = fakeFetch([new Error("timeout")]);
    const results = await sendNotification(message, both, impl, noSleep);
    for (const r of results) {
      assert.equal(r.outcome, "failed");
      assert.equal(r.attempts, 3);
      assert.doesNotMatch(JSON.stringify(r), /SECRET|re_test_key/);
    }
  });
});

describe("notification messages", () => {
  const lead = {
    id: 7,
    name: "Asha Verma",
    phone: "+919810000001",
    budget: "",
    message: "",
    source: "brochure",
    projectTitle: "Skyline Arte",
    utmSource: "google",
    utmCampaign: "",
    createdAt: new Date("2026-10-20T05:00:00Z"),
  };

  it("includes the essentials and the admin link, skipping empty fields", () => {
    const m = newLeadMessage(lead, "https://investsproperty.com");
    assert.match(m.subject, /Asha Verma — Skyline Arte/);
    assert.match(m.text, /Phone: \+919810000001/);
    assert.match(m.text, /Form: Brochure download/);
    assert.match(m.text, /Campaign: google/);
    assert.doesNotMatch(m.text, /Budget:|Message:/);
    assert.match(m.text, /https:\/\/investsproperty\.com\/admin\/leads\/7$/);
  });

  it("digest is null when nothing is due", () => {
    assert.equal(followUpDigestMessage([], [], 0, "https://x"), null);
    const digest = followUpDigestMessage(
      [{ id: 1, name: "A", projectTitle: "P", status: "contacted", followUpAt: new Date() }],
      [],
      2,
      "https://x"
    );
    assert.match(digest!.subject, /1 overdue, 0 due/);
    assert.match(digest!.text, /New leads not yet contacted: 2/);
  });
});
