import Link from "next/link";
import { Building2, Mail, Phone } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getAllCities } from "@/lib/properties";

export default function Footer() {
  const cities = getAllCities();

  return (
    <footer id="contact" className="border-t border-border bg-teal-900 text-cream/90">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-600 text-teal-900">
                <Building2 className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <span className="font-display text-lg font-semibold text-cream">
                {siteConfig.name}
              </span>
            </div>
            <p className="mt-3 text-sm text-cream/70">{siteConfig.description}</p>
            <div className="mt-4 flex gap-4 text-sm">
              <a href={siteConfig.social.instagram} className="text-cream/70 hover:text-gold-600">
                Instagram
              </a>
              <a href={siteConfig.social.facebook} className="text-cream/70 hover:text-gold-600">
                Facebook
              </a>
              <a href={siteConfig.social.linkedin} className="text-cream/70 hover:text-gold-600">
                LinkedIn
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gold-600">
              Explore
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/projects" className="text-cream/70 hover:text-cream">All Projects</Link></li>
              <li><Link href="/projects?possession=ready+to+move" className="text-cream/70 hover:text-cream">Ready to Move</Link></li>
              <li><Link href="/projects?possession=new+launch" className="text-cream/70 hover:text-cream">New Launches</Link></li>
              <li><Link href="/projects?rera=true" className="text-cream/70 hover:text-cream">RERA Verified Only</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gold-600">
              Cities
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {cities.map((city) => (
                <li key={city}>
                  <Link
                    href={`/projects?city=${encodeURIComponent(city)}`}
                    className="text-cream/70 hover:text-cream"
                  >
                    Projects in {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gold-600">
              Contact
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2 text-cream/70">
                <Phone className="h-4 w-4 shrink-0" />
                <a href={`tel:${siteConfig.contact.phone}`} className="hover:text-cream">
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-2 text-cream/70">
                <Mail className="h-4 w-4 shrink-0" />
                <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-cream">
                  {siteConfig.contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-cream/10 pt-6 text-xs leading-relaxed text-cream/50">
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
