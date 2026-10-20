"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureAttribution } from "@/lib/attribution";

/** Notes campaign tags / referrer on each page view (kept in this browser only until an enquiry). */
export default function AttributionCapture() {
  const pathname = usePathname();
  useEffect(() => captureAttribution(), [pathname]);
  return null;
}
