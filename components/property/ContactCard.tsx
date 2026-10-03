import { BadgeCheck, Building2, ClipboardList } from "lucide-react";
import BrochureButton from "@/components/leads/BrochureButton";
import EnquiryForm from "@/components/leads/EnquiryForm";
import { siteConfig } from "@/lib/site-config";
import type { Property } from "@/lib/types";
import CallButton from "./CallButton";
import WhatsAppButton from "./WhatsAppButton";

type Contact = Pick<Property, "id" | "title" | "phone" | "whatsapp" | "locality" | "city" | "brochureUrl">;

const cardClass = "rounded-card border border-border bg-surface p-5 shadow-card";

/** Sidebar cards on desktop: contact buttons + builder information. */
export function ContactCard({
  property,
}: {
  property: Contact & Pick<Property, "builder" | "reraRegistered" | "reraNumber">;
}) {
  const builder = property.builder || "Project team";

  return (
    <div className="flex flex-col gap-4">
      <div className={cardClass}>
        <h2 className="text-base font-semibold text-ink">Interested in this property?</h2>
        <p className="mt-0.5 text-sm text-muted">Get the price sheet, floor plans and a site visit.</p>
        <div className="mt-4 flex flex-col gap-2">
          <CallButton phone={property.phone} projectTitle={property.title} fullWidth />
          <WhatsAppButton
            whatsapp={property.whatsapp}
            projectTitle={property.title}
            locality={property.locality}
            city={property.city}
            fullWidth
          />
          <BrochureButton propertyId={property.id} projectTitle={property.title} hasBrochure={!!property.brochureUrl} />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-subtle">
          By contacting, you agree to be reached by the project team regarding {property.title}.{" "}
          {siteConfig.name} is a listing platform and is not a party to any transaction.
        </p>
      </div>

      <div className={cardClass}>
        <h2 className="text-base font-semibold text-ink">Builder Information</h2>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{builder}</p>
            {property.reraRegistered ? (
              <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                <BadgeCheck className="h-3 w-3" aria-hidden="true" /> RERA Registered
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted">Listed on {siteConfig.name}</p>
            )}
          </div>
        </div>
        {property.reraNumber && (
          <dl className="mt-4 border-t border-border pt-4 text-sm">
            <dt className="text-xs text-muted">RERA number</dt>
            <dd className="mt-0.5 break-all font-medium text-ink">{property.reraNumber}</dd>
          </dl>
        )}
      </div>
    </div>
  );
}

/** "Enquire Now" form card. Sticky in the desktop sidebar; inline above the map on phones. */
export function EnquiryCard({ property, id }: { property: Contact; id?: string }) {
  return (
    <section id={id} className={`${cardClass} scroll-mt-32`}>
      <h2 className="text-base font-semibold text-ink">Enquire Now</h2>
      <p className="mt-0.5 text-sm text-muted">Leave your number and our team will call you back.</p>
      <div className="mt-4">
        <EnquiryForm propertyId={property.id} projectTitle={property.title} />
      </div>
    </section>
  );
}

/** Fixed bottom bar on phones. */
export function MobileContactBar({ property }: { property: Contact }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-border bg-surface/95 p-3 backdrop-blur lg:hidden">
      <CallButton phone={property.phone} projectTitle={property.title} fullWidth className="px-2" />
      <WhatsAppButton
        whatsapp={property.whatsapp}
        projectTitle={property.title}
        locality={property.locality}
        city={property.city}
        fullWidth
        className="px-2"
      />
      <a
        href="#enquire"
        aria-label="Enquire now"
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-control border border-border bg-surface px-3 text-sm font-semibold text-ink"
      >
        <ClipboardList className="h-4 w-4" aria-hidden="true" />
        Enquire
      </a>
    </div>
  );
}
