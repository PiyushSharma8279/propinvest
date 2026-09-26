import { BadgeCheck, Building2 } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import type { Property } from "@/lib/types";
import CallButton from "./CallButton";
import WhatsAppButton from "./WhatsAppButton";

type Contact = Pick<Property, "title" | "phone" | "whatsapp" | "locality" | "city">;

function ContactButtons({ property }: { property: Contact }) {
  return (
    <>
      <CallButton phone={property.phone} projectTitle={property.title} fullWidth />
      <WhatsAppButton
        whatsapp={property.whatsapp}
        projectTitle={property.title}
        locality={property.locality}
        city={property.city}
        fullWidth
      />
    </>
  );
}

const cardClass = "rounded-card border border-border bg-surface p-5 shadow-card";

/** Sidebar cards on desktop: "Request details" + builder information. */
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
          <ContactButtons property={property} />
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

/** Fixed bottom bar on phones. */
export function MobileContactBar({ property }: { property: Contact }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-border bg-surface/95 p-3 backdrop-blur lg:hidden">
      <ContactButtons property={property} />
    </div>
  );
}
