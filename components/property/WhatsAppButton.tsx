"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface WhatsAppButtonProps {
  whatsapp: string;
  projectTitle: string;
  locality?: string;
  city?: string;
  className?: string;
  fullWidth?: boolean;
  label?: string;
  /** Round icon-only button (used on property cards). */
  iconOnly?: boolean;
}

function buildMessage(projectTitle: string, locality?: string, city?: string) {
  const place = [locality, city].filter(Boolean).join(", ");
  return `Hi, I'm interested in ${projectTitle}${place ? ` in ${place}` : ""}. Could you please share more details and pricing?`;
}

export default function WhatsAppButton({
  whatsapp,
  projectTitle,
  locality,
  city,
  className = "",
  fullWidth = false,
  label = "WhatsApp",
  iconOnly = false,
}: WhatsAppButtonProps) {
  const message = buildMessage(projectTitle, locality, city);
  const href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-project={projectTitle}
      aria-label={iconOnly ? `WhatsApp about ${projectTitle}` : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 bg-whatsapp font-semibold text-on-primary transition hover:bg-whatsapp-hover",
        iconOnly ? "h-8 w-8 rounded-full" : "rounded-control px-4 py-2.5 text-sm",
        fullWidth && "w-full",
        className
      )}
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      {!iconOnly && label}
    </a>
  );
}
