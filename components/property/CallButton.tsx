"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface CallButtonProps {
  phone: string;
  projectTitle: string;
  className?: string;
  fullWidth?: boolean;
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
        data-project={projectTitle}
        className={`inline-flex items-center justify-center gap-2 rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-hover ${
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
        trackEvent("view_number", { project_name: projectTitle });
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-hover ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      <Phone className="h-4 w-4" aria-hidden="true" />
      View Number
    </button>
  );
}
