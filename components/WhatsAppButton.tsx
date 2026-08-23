"use client";

import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  whatsapp: string;
  projectTitle: string;
  locality?: string;
  city?: string;
  className?: string;
  fullWidth?: boolean;
  label?: string;
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
}: WhatsAppButtonProps) {
  const message = buildMessage(projectTitle, locality, city);
  const href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-md border-2 border-[#25D366] bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1fb959] ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      {label}
    </a>
  );
}
