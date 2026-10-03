/** Where a lead came from on the website. */
export const leadSources = ["enquiry", "brochure", "price_list"] as const;
export type LeadSource = (typeof leadSources)[number];

export const leadSourceLabels: Record<LeadSource, string> = {
  enquiry: "Enquiry form",
  brochure: "Brochure download",
  price_list: "Price list request",
};

/** Follow-up stage, set by the admin. */
export const leadStatuses = ["new", "contacted", "site_visit", "closed", "not_interested"] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export const leadStatusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  site_visit: "Site visit",
  closed: "Deal closed",
  not_interested: "Not interested",
};

export const budgetOptions = [
  "Under ₹50 Lakh",
  "₹50 Lakh – 1 Cr",
  "₹1 – 2 Cr",
  "₹2 – 5 Cr",
  "Above ₹5 Cr",
] as const;
