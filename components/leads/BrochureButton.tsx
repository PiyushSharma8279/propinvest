"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Download, FileText, X } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import LeadForm from "./LeadForm";

interface BrochureButtonProps {
  propertyId: number;
  projectTitle: string;
  /** The listing has a brochure PDF; otherwise the button requests a price list from the team. */
  hasBrochure: boolean;
  className?: string;
}

/**
 * "Download Brochure" / "Get Price List" button. Asks for name + mobile in a popup first; the
 * brochure link only comes back from the server once the lead is saved.
 */
export default function BrochureButton({ propertyId, projectTitle, hasBrochure, className }: BrochureButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [result, setResult] = useState<{ brochureUrl: string } | null>(null);
  const label = hasBrochure ? "Download Brochure" : "Get Price List";

  function handleSuccess(res: { brochureUrl: string }) {
    setResult(res);
    // Popup blockers usually allow this since it follows the submit click.
    if (res.brochureUrl) window.open(res.brochureUrl, "_blank", "noopener");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={cn(buttonClass("outline"), "w-full", className)}
      >
        <FileText className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-card bg-surface p-0 text-ink shadow-card-hover backdrop:bg-ink/50"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">{label}</h2>
              <p className="mt-0.5 text-sm text-muted">{projectTitle}</p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className="rounded-full p-1 text-muted hover:bg-surface-muted hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4">
            {!result ? (
              <LeadForm
                source={hasBrochure ? "brochure" : "price_list"}
                propertyId={propertyId}
                projectTitle={projectTitle}
                submitLabel={hasBrochure ? "Get Brochure" : "Send me the Price List"}
                onSuccess={handleSuccess}
              />
            ) : result.brochureUrl ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden="true" />
                <p className="font-semibold">Your brochure is ready.</p>
                <a href={result.brochureUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "md", "w-full")}>
                  <Download className="h-4 w-4" aria-hidden="true" /> Download Brochure
                </a>
                <p className="text-xs text-muted">Our team may also call you with the latest offers.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden="true" />
                <p className="font-semibold">Thank you!</p>
                <p className="text-sm text-muted">Our team will WhatsApp you the latest price list shortly.</p>
              </div>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
