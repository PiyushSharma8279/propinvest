import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { duplicateTitles, getQualityIssues } from "@/lib/property-quality";
import type { Property } from "@/lib/types";
import { listing, now } from "./fixtures";

const codes = (p: Property) => getQualityIssues(p, now).map((i) => i.code);

describe("getQualityIssues", () => {
  it("finds nothing wrong with a complete, recently verified listing", () => {
    assert.deepEqual(codes(listing()), []);
  });

  it("flags missing price, location, photos and source", () => {
    const c = codes(listing({ priceMin: 0, priceMax: 0, locality: "", address: "", images: [], listingSource: "" }));
    for (const code of ["missing_price", "missing_location", "missing_images", "missing_source"]) assert.ok(c.includes(code), code);
  });

  it("flags inconsistent numbers and possession", () => {
    const c = codes(listing({ carpetArea: 2500, status: "Ready to Move", possessionDate: "2027-06-01", prelaunchRate: 9000, launchRate: 8000 }));
    assert.ok(c.includes("carpet_gt_builtup"));
    assert.ok(c.includes("possession_conflict"));
    assert.ok(c.includes("offer_rates"));
  });

  it("flags RERA without a number, unsupported return claims and demo titles", () => {
    assert.ok(codes(listing({ reraNumber: "" })).includes("rera_without_number"));
    assert.ok(codes(listing({ usps: ["Assured returns of 12%"] })).includes("unsupported_claim"));
    assert.ok(codes(listing({ usps: ["20% appreciation in 2 years"] })).includes("unsupported_claim"));
    assert.ok(codes(listing({ title: "Test Project" })).includes("demo_listing"));
  });

  it("flags availability that was never or long ago confirmed", () => {
    assert.ok(codes(listing({ availabilityConfirmedAt: null })).includes("availability_unconfirmed"));
    assert.ok(codes(listing({ availabilityConfirmedAt: new Date("2026-08-01T00:00:00Z") })).includes("availability_stale"));
    assert.ok(!codes(listing({ availability: "unavailable", availabilityConfirmedAt: null })).includes("availability_unconfirmed"));
  });

  it("flags unverified and stale verifications", () => {
    assert.ok(codes(listing({ verificationStatus: "unverified", lastVerifiedAt: null })).includes("unverified"));
    assert.ok(codes(listing({ lastVerifiedAt: new Date("2026-05-01T00:00:00Z") })).includes("verification_stale"));
    assert.ok(codes(listing({ verificationStatus: "needs_review" })).includes("needs_review"));
  });
});

describe("duplicateTitles", () => {
  it("marks listings that share a title, case-insensitively", () => {
    const result = duplicateTitles([
      { id: 1, title: "Skyline Arte" },
      { id: 2, title: "skyline arte " },
      { id: 3, title: "Other" },
    ]);
    assert.deepEqual([...result.keys()].sort(), [1, 2]);
  });
});
