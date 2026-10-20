"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/Field";
import { inputClass } from "@/components/ui/styles";
import { api } from "@/lib/api-client";
import { fillTemplate, outreachTemplates } from "@/lib/constants/outreach";
import { whatsappLink } from "@/lib/lead-messages";
import { cn } from "@/lib/utils/cn";

interface Props {
  id: number;
  name: string;
  company: string;
  city: string;
  phone: string;
  email: string;
  senderName: string;
  site: string;
}

/**
 * Fills a template with the contact's details for the admin to edit and send from their own
 * WhatsApp or email. Nothing is sent from the server; opening a template is logged as such.
 */
export default function OutreachComposer({ id, name, company, city, phone, email, senderName, site }: Props) {
  const router = useRouter();
  const values = useMemo(() => ({ name: name.split(/\s+/)[0], company, city, senderName, site }), [name, company, city, senderName, site]);
  const [templateId, setTemplateId] = useState(outreachTemplates[0].id);
  const template = outreachTemplates.find((t) => t.id === templateId)!;
  const [subject, setSubject] = useState(fillTemplate(template.subject ?? "", values));
  const [body, setBody] = useState(fillTemplate(template.body, values));
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasBlanks = /\[\w+\]/.test(body + subject);

  function pick(next: string) {
    const t = outreachTemplates.find((x) => x.id === next)!;
    setTemplateId(next);
    setSubject(fillTemplate(t.subject ?? "", values));
    setBody(fillTemplate(t.body, values));
  }

  async function logOpened(channel: string) {
    try {
      await api(`/api/partners/${id}/activities`, { method: "POST", body: { type: "template_opened", note: `${template.name} via ${channel}` } });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record this in the history.");
    }
  }

  const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="flex flex-col gap-3">
      <FormAlert>{error}</FormAlert>
      <div className="flex flex-wrap gap-1.5">
        {outreachTemplates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => pick(t.id)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium",
              t.id === templateId ? "border-primary bg-primary-soft text-primary" : "border-border text-muted hover:text-ink"
            )}
          >
            {t.name}
          </button>
        ))}
      </div>
      {template.channel === "email" && (
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} aria-label="Subject" />
      )}
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className={inputClass} aria-label="Message" />
      {hasBlanks && <p className="text-xs font-medium text-danger">Fill in the [bracketed] parts before sending.</p>}
      <div className="flex flex-wrap gap-2">
        {template.channel === "whatsapp" && phone && (
          <a
            href={whatsappLink(phone, body)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void logOpened("WhatsApp")}
            className="inline-flex items-center gap-2 rounded-control bg-whatsapp px-3 py-2 text-sm font-semibold text-on-primary hover:bg-whatsapp-hover"
          >
            <MessageCircle className="h-4 w-4" /> Open in WhatsApp
          </a>
        )}
        {template.channel === "email" && email && (
          <a
            href={mailto}
            onClick={() => void logOpened("email")}
            className="inline-flex items-center gap-2 rounded-control bg-primary px-3 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover"
          >
            <Mail className="h-4 w-4" /> Open in email app
          </a>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(template.channel === "email" ? `Subject: ${subject}\n\n${body}` : body);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="text-xs text-muted">
        Personalise it, then send it yourself. After they reply or you meet, update the status above so the weekly report
        stays accurate.
      </p>
    </div>
  );
}
