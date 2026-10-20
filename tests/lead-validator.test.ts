import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PRIVACY_NOTICE_VERSION } from "@/lib/constants/lead";
import { HttpError } from "@/server/http";
import {
  isPlausiblePhone,
  validateLeadActivity,
  validateLeadInput,
  validateLeadUpdate,
} from "@/server/validators/lead.validator";

const valid = { name: "Asha Verma", phone: "98100 00001", source: "enquiry", propertyId: 12 };

function errorsOf(fn: () => unknown): Record<string, string> {
  try {
    fn();
  } catch (error) {
    assert.ok(error instanceof HttpError);
    assert.equal(error.status, 422);
    return error.details ?? {};
  }
  assert.fail("expected a validation error");
}

describe("validateLeadInput", () => {
  it("accepts a normal enquiry and normalises the phone", () => {
    const lead = validateLeadInput(valid);
    assert.equal(lead.name, "Asha Verma");
    assert.equal(lead.phone, "+919810000001");
    assert.equal(lead.propertyId, 12);
    assert.equal(lead.source, "enquiry");
    assert.equal(lead.isBot, false);
    assert.equal(lead.marketingOptIn, false);
    assert.equal(lead.privacyNoticeVersion, PRIVACY_NOTICE_VERSION);
  });

  it("rejects missing / invalid name and phone", () => {
    const errors = errorsOf(() => validateLeadInput({ name: "A", phone: "12345" }));
    assert.ok(errors.name);
    assert.ok(errors.phone);
  });

  it("rejects names that are links or markup, and numbers that can't be Indian mobiles", () => {
    assert.ok(errorsOf(() => validateLeadInput({ ...valid, name: "http://spam.example" })).name);
    assert.ok(errorsOf(() => validateLeadInput({ ...valid, name: "<script>" })).name);
    assert.ok(errorsOf(() => validateLeadInput({ ...valid, phone: "5810000001" })).phone);
    assert.ok(errorsOf(() => validateLeadInput({ ...valid, phone: "9999999999" })).phone);
  });

  it("rejects messages with several links (spam)", () => {
    const errors = errorsOf(() => validateLeadInput({ ...valid, message: "see https://a.example and https://b.example" }));
    assert.ok(errors.message);
    // One link is fine (e.g. a map pin).
    assert.equal(validateLeadInput({ ...valid, message: "near https://maps.example/x" }).message, "near https://maps.example/x");
  });

  it("flags the honeypot", () => {
    assert.equal(validateLeadInput({ ...valid, website: "http://bot" }).isBot, true);
  });

  it("drops unknown budgets and sources, and bad property ids", () => {
    const lead = validateLeadInput({ ...valid, budget: "a lot", source: "hack", propertyId: "-3" });
    assert.equal(lead.budget, "");
    assert.equal(lead.source, "enquiry");
    assert.equal(lead.propertyId, null);
  });

  it("cleans attribution and strips query strings from URLs", () => {
    const lead = validateLeadInput({
      ...valid,
      pageUrl: "https://investsproperty.com/projects/x?utm_source=fb&phone=98100",
      utmSource: "facebook<script>",
      utmCampaign: "diwali_2026",
      referrer: "javascript:alert(1)",
      landingPage: "/projects/x\"><",
      marketingOptIn: true,
    });
    assert.equal(lead.pageUrl, "https://investsproperty.com/projects/x");
    assert.equal(lead.utmSource, "facebookscript");
    assert.equal(lead.utmCampaign, "diwali_2026");
    assert.equal(lead.referrer, "");
    assert.equal(lead.landingPage, "/projects/x");
    assert.equal(lead.marketingOptIn, true);
  });
});

describe("isPlausiblePhone", () => {
  it("checks Indian mobiles and allows other countries", () => {
    assert.equal(isPlausiblePhone("+919810000001"), true);
    assert.equal(isPlausiblePhone("+914410000001"), false);
    assert.equal(isPlausiblePhone("+971501234567"), true);
  });
});

describe("validateLeadUpdate", () => {
  it("parses status, IST follow-up time and opt-out", () => {
    const changes = validateLeadUpdate({ status: "qualified", followUpAt: "2026-10-21T10:00", optedOut: true });
    assert.equal(changes.status, "qualified");
    assert.equal(changes.followUpAt?.toISOString(), "2026-10-21T04:30:00.000Z");
    assert.equal(changes.optedOut, true);
  });

  it("clears the follow-up with null", () => {
    assert.equal(validateLeadUpdate({ followUpAt: null }).followUpAt, null);
  });

  it("rejects unknown statuses, bad dates and empty bodies", () => {
    assert.ok(errorsOf(() => validateLeadUpdate({ status: "won" })).status);
    assert.ok(errorsOf(() => validateLeadUpdate({ followUpAt: "tomorrow" })).followUpAt);
    errorsOf(() => validateLeadUpdate({}));
  });
});

describe("validateLeadActivity", () => {
  it("only allows manual activity types and requires note text", () => {
    assert.deepEqual(validateLeadActivity({ type: "call", note: "" }), { type: "call", note: "" });
    errorsOf(() => validateLeadActivity({ type: "notification", note: "x" }));
    errorsOf(() => validateLeadActivity({ type: "note", note: " " }));
  });
});
