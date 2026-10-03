"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import LeadForm from "./LeadForm";

/** "Enquire Now" card on a property page. */
export default function EnquiryForm({ propertyId, projectTitle }: { propertyId: number; projectTitle: string }) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden="true" />
        <p className="font-semibold text-ink">Thank you! We&apos;ve got your enquiry.</p>
        <p className="text-sm text-muted">Our team will call you shortly about {projectTitle}.</p>
      </div>
    );
  }

  return (
    <LeadForm
      source="enquiry"
      propertyId={propertyId}
      projectTitle={projectTitle}
      submitLabel="Enquire Now"
      withMessage
      onSuccess={() => setSent(true)}
    />
  );
}
