"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";

/** Native share sheet where available, otherwise copies the page URL. */
export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={share} className={buttonClass("outline", "sm")}>
      {copied ? <Check className="h-4 w-4 text-primary" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
