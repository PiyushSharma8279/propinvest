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

/** Sticky sidebar card on desktop. */
export function ContactCard({ property }: { property: Contact }) {
  return (
    <div className="sticky top-24 rounded-lg border border-border bg-white p-5">
      <p className="text-sm text-slate-600">Interested in this property?</p>
      <p className="mt-1 font-display text-lg font-semibold text-ink-900">Contact the project team</p>
      <div className="mt-4 flex flex-col gap-2">
        <ContactButtons property={property} />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-600">
        By contacting, you agree to be reached by the project team regarding {property.title}.{" "}
        {siteConfig.name} is a listing platform and is not a party to any transaction.
      </p>
    </div>
  );
}

/** Fixed bottom bar on phones. */
export function MobileContactBar({ property }: { property: Contact }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-border bg-white p-3 sm:hidden">
      <ContactButtons property={property} />
    </div>
  );
}
