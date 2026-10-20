import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listingStage } from "@/lib/constants/property";
import { SUBMISSION_TERMS_VERSION } from "@/lib/constants/submission";
import { templatesForStage } from "@/lib/lead-messages";
import { buildMarketingPack, trackedLink } from "@/lib/marketing-drafts";
import { csvToObjects, parseCsv } from "@/lib/utils/csv-parse";
import { HttpError } from "@/server/http";
import { validateLeadResponse, validateLeadUpdate } from "@/server/validators/lead.validator";
import { validateImportRequest, validateOnboardingToggle, validatePartnerInput } from "@/server/validators/partner.validator";
import { validateReview, validateSubmissionInput } from "@/server/validators/submission.validator";
import { listing } from "./fixtures";

const hosts = ["ik.imagekit.io"];
const submission = {
  name: "Ravi Kumar",
  phone: "9810000001",
  submitterType: "owner",
  title: "3 BHK in Sector 150",
  category: "Residential",
  propertyType: "Apartment",
  locality: "Sector 150",
  city: "Noida",
  price: "8500000",
  description: "Corner flat on the 7th floor, park facing, ready to move, two covered parkings.",
  images: ["https://ik.imagekit.io/x/a.jpg", "https://evil.example/b.jpg", "javascript:alert(1)"],
  authorizationConfirmed: true,
};

function errorsOf(fn: () => unknown): Record<string, string> {
  try {
    fn();
  } catch (error) {
    assert.ok(error instanceof HttpError);
    return error.details ?? {};
  }
  assert.fail("expected a validation error");
}

describe("owner / builder submissions", () => {
  it("accepts a complete submission and keeps only our own image URLs", () => {
    const s = validateSubmissionInput(submission, hosts);
    assert.equal(s.phone, "+919810000001");
    assert.equal(s.price, 8500000);
    assert.deepEqual(s.images, ["https://ik.imagekit.io/x/a.jpg"]);
    assert.equal(s.termsVersion, SUBMISSION_TERMS_VERSION);
    assert.equal(s.isBot, false);
  });

  it("requires the authorisation box, a real description and a valid type", () => {
    const e = errorsOf(() =>
      validateSubmissionInput({ ...submission, authorizationConfirmed: false, description: "nice", propertyType: "Castle" }, hosts)
    );
    assert.ok(e.authorizationConfirmed);
    assert.ok(e.description);
    assert.ok(e.propertyType);
  });

  it("strips HTML from free text and rejects prices that aren't full rupee amounts", () => {
    const s = validateSubmissionInput({ ...submission, description: "<b>Great</b> flat with a lovely view of the central park" }, hosts);
    assert.equal(s.description, "Great flat with a lovely view of the central park");
    assert.ok(errorsOf(() => validateSubmissionInput({ ...submission, price: "85" }, hosts)).price);
  });

  it("needs an email when email is the preferred contact", () => {
    assert.ok(errorsOf(() => validateSubmissionInput({ ...submission, preferredContact: "email" }, hosts)).email);
  });

  it("review: corrections / rejection / suspension need a reason", () => {
    assert.deepEqual(validateReview({ action: "approve" }), { action: "approve", note: "" });
    assert.ok(errorsOf(() => validateReview({ action: "reject" })).note);
    assert.ok(errorsOf(() => validateReview({ action: "publish" })).action);
  });
});

describe("listing lifecycle", () => {
  const base = { isDeleted: false, isDraft: false, isActive: true, availability: "available", verificationStatus: "verified" };
  it("derives the stage from existing flags", () => {
    assert.equal(listingStage(base), "published");
    assert.equal(listingStage({ ...base, verificationStatus: "unverified" }), "published_unverified");
    assert.equal(listingStage({ ...base, isActive: false }), "approved");
    assert.equal(listingStage({ ...base, isActive: false, verificationStatus: "needs_review" }), "pending_verification");
    assert.equal(listingStage({ ...base, availability: "unavailable" }), "unavailable");
    assert.equal(listingStage({ ...base, isDraft: true }), "draft");
    assert.equal(listingStage({ ...base, isDeleted: true }), "archived");
  });
});

describe("lead CRM additions", () => {
  it("parses requirement, next action and deal fields", () => {
    const c = validateLeadUpdate({
      preferredLocation: "Sector 150",
      timeline: "Within 3 months",
      nextAction: "Send floor plan",
      dealValue: "9000000",
      commissionAmount: "90000",
      commissionStatus: "confirmed",
    });
    assert.equal(c.timeline, "Within 3 months");
    assert.equal(c.dealValue, 9000000);
    assert.equal(c.commissionStatus, "confirmed");
    assert.equal(validateLeadUpdate({ timeline: "someday" }).timeline, "");
  });

  it("a confirmed commission needs an amount", () => {
    assert.ok(errorsOf(() => validateLeadUpdate({ commissionStatus: "confirmed", commissionAmount: 0 })).commissionAmount);
  });

  it("records buyer responses", () => {
    assert.equal(validateLeadResponse({ outcome: "later", followUpAt: "2026-10-25T11:00" }).followUpAt?.toISOString(), "2026-10-25T05:30:00.000Z");
    assert.ok(errorsOf(() => validateLeadResponse({ outcome: "maybe" })).outcome);
  });

  it("suggests messages that fit the stage first", () => {
    assert.equal(templatesForStage("new")[0].id, "first-reply");
    assert.equal(templatesForStage("negotiation")[0].stages.includes("negotiation"), true);
    assert.equal(templatesForStage("closed")[0].id, "referral");
  });
});

describe("partner research & import", () => {
  it("stores source URL, research dates and the new statuses", () => {
    const p = validatePartnerInput({
      name: "Anita Rao",
      contactSource: "Official website contact page",
      sourceUrl: "https://builder.example/contact",
      researchedAt: "2026-10-20",
      category: "Developer / builder",
      status: "interested",
    });
    assert.equal(p.status, "interested");
    assert.equal(p.category, "Developer / builder");
    assert.equal(p.researchedAt?.toISOString(), "2026-10-20T04:30:00.000Z");
    assert.ok(errorsOf(() => validatePartnerInput({ name: "Anita", contactSource: "x", sourceUrl: "ftp://x" })).sourceUrl);
    assert.equal(validatePartnerInput({ name: "Anita", contactSource: "x", status: "won" }).status, "not_contacted");
  });

  it("CSV import must say where the list came from", () => {
    assert.ok(errorsOf(() => validateImportRequest({ csv: "name\nA", source: "" })).source);
    assert.equal(validateImportRequest({ csv: "name\nA", source: "Own research", preview: true }).preview, true);
  });

  it("onboarding toggles only known checklist items", () => {
    assert.equal(validateOnboardingToggle({ item: "rera", done: true }).done, true);
    errorsOf(() => validateOnboardingToggle({ item: "bribe" }));
  });

  it("parses quoted CSV from Excel / Sheets", () => {
    const text = '﻿Name,Company,Notes\r\n"Rao, Anita",Skyline,"said ""call Monday"""\r\n\r\nRavi,,\n';
    assert.deepEqual(parseCsv(text), [
      ["Name", "Company", "Notes"],
      ["Rao, Anita", "Skyline", 'said "call Monday"'],
      ["Ravi", "", ""],
    ]);
    assert.deepEqual(csvToObjects("Source URL,Name\nhttps://a.example,Ravi"), [{ source_url: "https://a.example", name: "Ravi" }]);
  });
});

describe("marketing drafts", () => {
  it("uses only stored facts, tags links, and lists what's missing", () => {
    const pack = buildMarketingPack(listing({ amenities: [], availabilityConfirmedAt: null }), "https://investsproperty.com");
    assert.equal(pack.verified, true);
    assert.ok(pack.missing.includes("Amenities"));
    assert.ok(pack.missing.includes("Availability confirmation date"));
    const all = pack.drafts.map((d) => d.text).join("\n");
    assert.match(all, /UPRERAPRJ123456/);
    assert.match(all, /utm_source=whatsapp&utm_medium=status/);
    assert.doesNotMatch(all, /guarantee|assured return|appreciation/i);
  });

  it("says price on request instead of inventing one, and marks unverified listings", () => {
    const pack = buildMarketingPack(listing({ priceMin: 0, priceMax: 0, verificationStatus: "unverified" }), "https://x");
    assert.equal(pack.verified, false);
    assert.match(pack.drafts[0].text, /Price on request/);
  });

  it("builds tracked links", () => {
    assert.equal(trackedLink("https://x", "skyline", "instagram", "bio"), "https://x/projects/skyline?utm_source=instagram&utm_medium=bio&utm_campaign=listing-skyline");
  });
});
