import { useServerFn } from "@tanstack/react-start";
import { Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useI18n } from "@/i18n";
import { getFireContact, getSiteContact, type ContactInfo } from "@/lib/moderation.functions";

/**
 * Reveals reporter/planter contact on demand — PII is never fetched by
 * default, only when a moderator explicitly asks (service-role, role-checked
 * on every call).
 */
export function ContactReveal({ kind, id }: { kind: "site" | "fire"; id: string }) {
  const { t } = useI18n();
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const siteFn = useServerFn(getSiteContact);
  const fireFn = useServerFn(getFireContact);

  const reveal = async () => {
    setLoading(true);
    try {
      const fn = kind === "site" ? siteFn : fireFn;
      setContact(await fn({ data: { id } }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("moderation.contact.error"));
    } finally {
      setLoading(false);
    }
  };

  if (!contact) {
    return (
      <button
        type="button"
        onClick={reveal}
        disabled={loading}
        className="tap-target inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground active:scale-[0.97]"
      >
        <Phone className="size-3.5" />
        {loading ? t("moderation.contact.loading") : t("moderation.contact.show")}
      </button>
    );
  }

  if (!contact.name && !contact.phone) {
    return <p className="text-xs text-muted-foreground">{t("moderation.contact.none")}</p>;
  }

  return (
    <p className="text-xs text-muted-foreground">
      {t("moderation.contact.prefix")}
      {contact.name && <span className="font-medium text-foreground">{contact.name}</span>}
      {contact.name && contact.phone && " · "}
      {contact.phone && (
        <a href={`tel:${contact.phone}`} className="font-medium text-foreground underline">
          {contact.phone}
        </a>
      )}
    </p>
  );
}
