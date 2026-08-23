"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Building2 } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import WhatsAppButton from "./WhatsAppButton";

const navLinks = [
  { href: "/projects?category=Residential", label: "Residential Projects" },
  { href: "/projects?category=Commercial", label: "Commercial Projects" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-teal-900/10 bg-gradient-to-r from-teal-900 to-teal-700 text-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-600 text-teal-900">
            <Building2 className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-cream/90 transition hover:text-gold-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <WhatsAppButton
            whatsapp={siteConfig.contact.whatsapp}
            projectTitle="PropInvest"
            label="Talk to an Expert"
          />
        </div>

        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-md text-cream md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-cream/10 bg-teal-900 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-1 text-cream/90"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4">
            <WhatsAppButton
              whatsapp={siteConfig.contact.whatsapp}
              projectTitle="PropInvest"
              label="Talk to an Expert"
              fullWidth
            />
          </div>
        </div>
      )}
    </header>
  );
}
