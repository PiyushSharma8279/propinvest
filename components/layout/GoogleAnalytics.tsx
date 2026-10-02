"use client";

import { useEffect } from "react";
import Script from "next/script";
import { GA_ID, trackEvent } from "@/lib/analytics";

/**
 * Loads GA4 and records every call / WhatsApp link click site-wide (header,
 * footer, property cards, contact card). Page views — including client-side
 * navigations — are tracked by GA4's enhanced measurement.
 */
export default function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_ID) return;

    function onClick(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest?.("a");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      const project = link.dataset.project;

      if (href.startsWith("tel:")) {
        trackEvent("call_click", { project_name: project ?? "site contact", phone: href.slice(4) });
      } else if (href.includes("wa.me/")) {
        trackEvent("whatsapp_click", { project_name: project ?? "site contact" });
      }
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  if (!GA_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
