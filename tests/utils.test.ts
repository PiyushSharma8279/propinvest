import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { attributionFromUrl, cleanTag } from "@/lib/attribution";
import { fillTemplate, outreachTemplates } from "@/lib/constants/outreach";
import { leadMessageTemplates, whatsappLink } from "@/lib/lead-messages";
import { csvCell, toCsv } from "@/lib/utils/csv";
import { followUpInDays, followUpState, istDateKey, istDayBounds, parseIstInput, toIstInputValue } from "@/lib/utils/dates";
import { isAuthorizedCron } from "@/server/cron-auth";
import { validateContentInput, validatePartnerInput } from "@/server/validators/partner.validator";

describe("IST dates", () => {
  it("computes the IST day around a UTC instant", () => {
    // 20 Oct 2026 20:00 UTC is already 21 Oct 01:30 IST.
    const { start, end } = istDayBounds(new Date("2026-10-20T20:00:00Z"));
    assert.equal(start.toISOString(), "2026-10-20T18:30:00.000Z");
    assert.equal(end.toISOString(), "2026-10-21T18:30:00.000Z");
    assert.equal(istDateKey(new Date("2026-10-20T20:00:00Z")), "2026-10-21");
  });

  it("schedules follow-ups at 10:00 IST and classifies them", () => {
    const now = new Date("2026-10-20T06:00:00Z");
    assert.equal(followUpInDays(2, now).toISOString(), "2026-10-22T04:30:00.000Z");
    assert.equal(followUpState(new Date("2026-10-19T10:00:00Z"), now), "overdue");
    assert.equal(followUpState(new Date("2026-10-20T15:00:00Z"), now), "today");
    assert.equal(followUpState(new Date("2026-10-21T15:00:00Z"), now), "upcoming");
    assert.equal(followUpState(null, now), "none");
  });

  it("round-trips datetime-local values in IST", () => {
    const date = parseIstInput("2026-10-21T10:00")!;
    assert.equal(date.toISOString(), "2026-10-21T04:30:00.000Z");
    assert.equal(toIstInputValue(date), "2026-10-21T10:00");
    assert.equal(parseIstInput("not a date"), null);
  });
});

describe("attribution", () => {
  it("reads UTM tags and the external referrer origin only", () => {
    const a = attributionFromUrl(
      "https://investsproperty.com/projects/x?utm_source=facebook&utm_medium=social&utm_campaign=oct",
      "https://l.facebook.com/l.php?u=secret"
    );
    assert.equal(a.utmSource, "facebook");
    assert.equal(a.utmMedium, "social");
    assert.equal(a.utmCampaign, "oct");
    assert.equal(a.referrer, "https://l.facebook.com/");
    assert.equal(a.landingPage, "/projects/x");
  });

  it("ignores same-site referrers and infers Google Ads from gclid", () => {
    const a = attributionFromUrl("https://investsproperty.com/?gclid=abc", "https://investsproperty.com/projects");
    assert.equal(a.referrer, "");
    assert.equal(a.utmSource, "google");
    assert.equal(a.utmMedium, "cpc");
  });

  it("cleans tags", () => {
    assert.equal(cleanTag("<b>diwali</b> 2026!"), "bdiwali/b 2026");
  });
});

describe("CSV", () => {
  it("quotes cells and neutralises spreadsheet formulas", () => {
    assert.equal(csvCell('say "hi"'), '"say ""hi"""');
    assert.equal(csvCell("=HYPERLINK(1)"), `"'=HYPERLINK(1)"`);
    assert.equal(csvCell("+919810000001"), `"'+919810000001"`);
    assert.ok(toCsv(["a"], [["1"]]).startsWith("﻿"));
  });
});

describe("message templates", () => {
  it("fills placeholders and marks missing ones as blanks to edit", () => {
    assert.equal(fillTemplate("Hi {{name}} from {{company}}", { name: "Ravi", company: "" }), "Hi Ravi from [company]");
  });

  it("every outreach template offers an opt-out", () => {
    for (const t of outreachTemplates.filter((x) => x.id !== "after-meeting")) {
      assert.match(t.body, /STOP|unsubscribe/i, t.id);
    }
  });

  it("builds a wa.me link with the message encoded", () => {
    const text = leadMessageTemplates[0].build({ name: "Asha Verma", projectTitle: "Skyline", senderName: "Moni" });
    assert.match(text, /^Hi Asha, this is Moni/);
    assert.equal(whatsappLink("+919810000001", "a b"), "https://wa.me/919810000001?text=a%20b");
  });
});

describe("cron authorisation", () => {
  it("requires the exact bearer secret and refuses when none is configured", () => {
    assert.equal(isAuthorizedCron("Bearer s3cret", "s3cret"), true);
    assert.equal(isAuthorizedCron("Bearer wrong!", "s3cret"), false);
    assert.equal(isAuthorizedCron(null, "s3cret"), false);
    assert.equal(isAuthorizedCron("Bearer ", ""), false);
  });
});

describe("partner & content validation", () => {
  it("requires a name and where the contact came from", () => {
    assert.throws(() => validatePartnerInput({ name: "Ravi" }), /fix the highlighted/);
    const p = validatePartnerInput({ name: "Ravi Kumar", contactSource: "Met at site office", phone: "9810000001", status: "interested" });
    assert.equal(p.phone, "+919810000001");
    assert.equal(p.status, "interested");
    assert.equal(p.doNotContact, false);
  });

  it("needs a link before content can be marked published", () => {
    assert.throws(() => validateContentInput({ title: "Sector 150 guide", status: "published" }));
    assert.equal(validateContentInput({ title: "Sector 150 guide", status: "published", url: "https://x.example/a" }).status, "published");
  });
});
