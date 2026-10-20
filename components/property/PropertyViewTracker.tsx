"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

/** Sends one "view_property" GA4 event per property page view (no-op when GA is off). */
export default function PropertyViewTracker({ projectName, city, category }: { projectName: string; city: string; category: string }) {
  useEffect(() => {
    trackEvent("view_property", { project_name: projectName, city, category });
  }, [projectName, city, category]);
  return null;
}
