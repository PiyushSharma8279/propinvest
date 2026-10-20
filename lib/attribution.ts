/**
 * First-touch campaign attribution. On the first page of a visit we note the UTM parameters,
 * the external referrer and the landing page, keep them for 30 days in this browser only, and
 * send them along with an enquiry. Nothing is sent anywhere until the visitor submits a form.
 */

export interface Attribution {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  referrer: string;
  landingPage: string;
}

const STORAGE_KEY = "pi_attribution";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const emptyAttribution: Attribution = {
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmTerm: "",
  utmContent: "",
  referrer: "",
  landingPage: "",
};

/** Letters, digits and a few separators; anything else is dropped. Max 100 characters. */
export function cleanTag(value: string | null | undefined): string {
  return (value ?? "").replace(/[^\p{L}\p{N} ._\-+/]/gu, "").trim().slice(0, 100);
}

/** Builds attribution from a page URL and document.referrer. Same-site referrers are ignored. */
export function attributionFromUrl(href: string, referrer: string): Attribution {
  const url = new URL(href);
  const p = url.searchParams;
  let externalReferrer = "";
  if (referrer) {
    try {
      const ref = new URL(referrer);
      if (ref.host !== url.host && /^https?:$/.test(ref.protocol)) externalReferrer = `${ref.protocol}//${ref.host}/`;
    } catch {
      // ignore malformed referrers
    }
  }
  return {
    utmSource: cleanTag(p.get("utm_source")) || (p.get("gclid") ? "google" : p.get("fbclid") ? "facebook" : ""),
    utmMedium: cleanTag(p.get("utm_medium")) || (p.get("gclid") ? "cpc" : ""),
    utmCampaign: cleanTag(p.get("utm_campaign")),
    utmTerm: cleanTag(p.get("utm_term")),
    utmContent: cleanTag(p.get("utm_content")),
    referrer: externalReferrer,
    landingPage: url.pathname.slice(0, 300),
  };
}

/** Call once per page view. Keeps the first touch; a new campaign click (UTM tags) replaces it. */
export function captureAttribution(): void {
  try {
    const current = attributionFromUrl(window.location.href, document.referrer);
    if (!readStored() || current.utmSource || current.utmCampaign) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ at: Date.now(), data: current }));
    }
  } catch {
    // Storage blocked (private mode etc.): enquiries are simply saved without attribution.
  }
}

function readStored(): { at: number; data: Attribution } | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as { at: number; data: Attribution };
  if (!parsed?.at || Date.now() - parsed.at > TTL_MS) return null;
  return parsed;
}

export function getAttribution(): Attribution {
  try {
    return { ...emptyAttribution, ...readStored()?.data };
  } catch {
    return emptyAttribution;
  }
}
