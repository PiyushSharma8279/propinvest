"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

const MESSAGE = "Hi, I'm looking for a property. Can you help me with some options?";

/**
 * Round WhatsApp button fixed to the bottom-right corner on phones. Hidden on property pages,
 * which already have a call / WhatsApp bar along the bottom.
 */
export default function FloatingWhatsApp() {
  const pathname = usePathname();
  if (/^\/projects\/[^/]+/.test(pathname)) return null;

  return (
    <a
      href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(MESSAGE)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      data-project="Floating button"
      className="fixed bottom-5 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-on-primary shadow-card-hover transition hover:bg-whatsapp-hover lg:hidden"
    >
      <MessageCircle className="h-7 w-7" aria-hidden="true" />
    </a>
  );
}
