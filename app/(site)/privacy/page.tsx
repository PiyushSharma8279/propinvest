import type { Metadata } from "next";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { siteConfig } from "@/lib/site-config";

/*
 * REVIEW BEFORE DEPLOYING: this is a plain-language starting point written to match how the code
 * actually handles data. Have it checked against the Digital Personal Data Protection Act, 2023
 * and your own practices, and keep PRIVACY_NOTICE_VERSION (lib/constants/lead.ts) in step with
 * any change to the short notice under the enquiry forms.
 */

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteConfig.name} collects, uses and protects the details you share in an enquiry.`,
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "20 October 2026";

export default function PrivacyPage() {
  const email = siteConfig.contact.email;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Privacy Policy", href: "/privacy" },
        ]}
      />
      <h1 className="mt-4 text-3xl font-bold text-ink">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {LAST_UPDATED}</p>

      <div className="rich-text mt-8">
        <p>
          {siteConfig.name} ({siteConfig.byline}) lists real estate projects and connects buyers with project
          teams. This page explains what we collect when you use the site and what we do with it.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Enquiry details you type in:</strong> your name, mobile number, and optionally your budget
            and a message, along with the project you asked about.
          </li>
          <li>
            <strong>How you found us:</strong> campaign tags in the link you clicked (for example
            utm_source), the website that referred you, and the first page you visited. These are kept in
            your browser for up to 30 days and sent to us only if you submit an enquiry.
          </li>
          <li>
            <strong>Usage statistics:</strong> if analytics is enabled, Google Analytics records pages
            viewed and button clicks (such as Call or WhatsApp) without your name or number.
          </li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To call or WhatsApp you about the enquiry you made, and to arrange site visits if you ask.</li>
          <li>
            To send you similar projects <strong>only</strong> if you tick the optional box on the form.
          </li>
          <li>To understand which pages and campaigns bring useful enquiries.</li>
        </ul>
        <p>
          We do not sell your details. We may share your enquiry with the builder or authorised channel
          partner of the project you asked about, so they can respond to you.
        </p>

        <h2>Service providers</h2>
        <p>
          We use providers to run the site: website hosting, a database, image hosting, and — where enabled —
          Google Analytics and notification services that alert our team to a new enquiry. They process data
          on our behalf.
        </p>

        <h2>How long we keep it</h2>
        <p>
          Enquiries are kept for up to 24 months after our last contact with you, then the name, number and
          message are removed. You can ask us to remove them sooner.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>Reply “STOP” to any WhatsApp message, or tell us on a call, and we will not contact you again.</li>
          <li>
            Email <a href={`mailto:${email}`}>{email}</a> to see, correct or delete the details we hold about
            you, or to raise a grievance. We aim to respond within 7 working days.
          </li>
        </ul>

        <h2>Listings</h2>
        <p>
          Project details, prices, images and possession dates are provided by builders and partners and can
          change. Always verify RERA registration on the relevant state RERA website and confirm details with
          the builder before making any payment.
        </p>
      </div>
    </div>
  );
}
