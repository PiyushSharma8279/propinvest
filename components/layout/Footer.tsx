import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getLocationOptions } from "@/server/services/property.service";
import Logo from "./Logo";

const exploreLinks = [
  { href: "/projects", label: "All Projects" },
  { href: "/about", label: "About Us" },
  { href: "/projects?category=Residential", label: "Residential" },
  { href: "/projects?category=Commercial", label: "Commercial" },
  { href: "/projects?category=Plot", label: "Plots & Land" },
  { href: "/projects?possession=ready+to+move", label: "Ready to Move" },
  { href: "/projects?possession=new+launch", label: "New Launches" },
  { href: "/projects?rera=true", label: "RERA Verified Only" },
];

const headingClass = "text-sm font-semibold text-ink";
const linkClass = "text-muted transition hover:text-primary";

export default async function Footer() {
  const { cities } = await getLocationOptions();

  return (
    <footer id="contact" className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <Logo size="sm" />
            <p className="mt-4 text-sm leading-relaxed text-muted">{siteConfig.description}</p>
            <div className="mt-4 flex gap-4 text-sm font-medium">
              <a href={siteConfig.social.instagram} className={linkClass}>Instagram</a>
              <a href={siteConfig.social.facebook} className={linkClass}>Facebook</a>
              <a href={siteConfig.social.linkedin} className={linkClass}>LinkedIn</a>
            </div>
          </div>

          <div>
            <h3 className={headingClass}>Explore</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={headingClass}>Cities</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {cities.slice(0, 8).map((city) => (
                <li key={city}>
                  <Link href={`/projects?city=${encodeURIComponent(city)}`} className={linkClass}>
                    Projects in {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={headingClass}>Contact</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href={`tel:${siteConfig.contact.phone}`} className={`flex min-w-0 items-center gap-2.5 break-all ${linkClass}`}>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                    <Phone className="h-4 w-4" />
                  </span>
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${siteConfig.contact.email}`} className={`flex min-w-0 items-center gap-2.5 break-all ${linkClass}`}>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                    <Mail className="h-4 w-4" />
                  </span>
                  {siteConfig.contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-xs leading-relaxed text-subtle">
          <p>
            RERA disclaimer: {siteConfig.name} is an intermediary real estate listing
            platform. Project images, prices, and possession dates are indicative and
            provided by respective builders; buyers must independently verify RERA
            registration details on the relevant state RERA website before making any
            payment or booking decision.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
