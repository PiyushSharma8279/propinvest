"use client";

import { useState } from "react";
import { Phone } from "lucide-react";

interface CallButtonProps {
  phone: string;
  projectTitle: string;
  className?: string;
  fullWidth?: boolean;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function trackLead(event: string, projectTitle: string) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", event, { project: projectTitle });
  }
}

export default function CallButton({
  phone,
  projectTitle,
  className = "",
  fullWidth = false,
}: CallButtonProps) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return (
      <a
        href={`tel:${phone}`}
        onClick={() => trackLead("call_number_dialed", projectTitle)}
        className={`inline-flex items-center justify-center gap-2 rounded-md bg-teal-900 px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-teal-700 ${
          fullWidth ? "w-full" : ""
        } ${className}`}
      >
        <Phone className="h-4 w-4" aria-hidden="true" />
        {phone}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setRevealed(true);
        trackLead("view_number_clicked", projectTitle);
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-md bg-teal-900 px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-teal-700 ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      <Phone className="h-4 w-4" aria-hidden="true" />
      View Number
    </button>
  );
}
