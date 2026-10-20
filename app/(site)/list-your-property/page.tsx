import type { Metadata } from "next";
import { ClipboardCheck, ShieldCheck, Users } from "lucide-react";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import SubmissionForm from "@/components/forms/SubmissionForm";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "List Your Property in Noida",
  description: `Owners, builders and authorised channel partners can submit a property to ${siteConfig.name}. Every listing is reviewed before it is published.`,
  alternates: { canonical: "/list-your-property" },
};

const steps = [
  { icon: ClipboardCheck, title: "1. Submit details", body: "Basic details and photos you have the right to share." },
  { icon: ShieldCheck, title: "2. We review", body: "We check ownership / authorisation and, for projects, the RERA registration." },
  { icon: Users, title: "3. Go live", body: "Once approved, the listing goes live and enquiries are followed up by our team." },
];

export default function ListYourPropertyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "List your property", href: "/list-your-property" },
        ]}
      />
      <h1 className="mt-4 text-3xl font-bold text-ink">List your property</h1>
      <p className="mt-2 max-w-2xl text-muted">
        For property owners, builders and authorised channel partners in Noida and nearby. There&apos;s no charge to submit;
        we&apos;ll discuss any terms with you before publishing.
      </p>

      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, body }) => (
          <li key={title} className="rounded-card border border-border bg-surface p-4">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-ink">{title}</p>
            <p className="mt-1 text-xs text-muted">{body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
        <SubmissionForm />
      </div>
    </div>
  );
}
