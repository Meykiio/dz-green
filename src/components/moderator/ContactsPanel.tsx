import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { format } from "@/i18n/format";
import { supabase } from "@/integrations/supabase/client";
import type { AlertContact } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

const contactQuery = {
  queryKey: ["alert_contacts"],
  queryFn: async (): Promise<AlertContact[]> => {
    const { data, error } = await supabase
      .from("alert_contacts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as AlertContact[];
  },
};

/** Alert contact management. Storage only — nothing sends alerts yet. */
export function ContactsPanel() {
  const { t, formatDate } = useI18n();
  const queryClient = useQueryClient();
  const contacts = useQuery(contactQuery);

  const [type, setType] = useState<"email" | "phone">("email");
  const [value, setValue] = useState("");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["alert_contacts"] });
    void queryClient.invalidateQueries({ queryKey: ["moderation", "stats"] });
  };

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("alert_contacts")
        .insert({ type, value, active: true, region_filter: { wilayas: [] } });
      if (error) throw error;
    },
    onSuccess: () => {
      setValue("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("alert_contacts").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alert_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-care/40 bg-care/10 p-4 text-sm text-care">
        {t.staff.contacts.notice}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium">{t.staff.contacts.addTitle}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-border bg-background p-1">
            {(["email", "phone"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  type === option
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground",
                )}
              >
                {option === "email" ? t.staff.contacts.email : t.staff.contacts.phone}
              </button>
            ))}
          </div>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              type === "email"
                ? t.staff.contacts.emailPlaceholder
                : t.staff.contacts.phonePlaceholder
            }
            className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim()) add.mutate();
            }}
          />
          <Button onClick={() => add.mutate()} disabled={add.isPending || !value.trim()}>
            {t.staff.contacts.add}
          </Button>
        </div>
      </div>

      {contacts.isLoading ? (
        <p className="text-muted-foreground">{t.staff.contacts.loading}</p>
      ) : contacts.isError ? (
        <p className="rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
          {t.staff.contacts.error}
        </p>
      ) : (contacts.data ?? []).length === 0 ? (
        <p className="text-muted-foreground">{t.staff.contacts.empty}</p>
      ) : (
        <ul className="space-y-3">
          {(contacts.data ?? []).map((contact) => (
            <li
              key={contact.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4"
            >
              <StatusBadge tone={contact.type === "phone" ? "care" : "plant"}>
                {contact.type === "phone" ? t.staff.contacts.phone : t.staff.contacts.email}
              </StatusBadge>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate font-medium", !contact.active && "opacity-50")}>
                  {contact.value}
                </p>
                <p className="text-xs text-muted-foreground">
                  {contact.region_filter?.wilayas?.length
                    ? format(t.staff.contacts.wilayasCount, {
                        count: contact.region_filter.wilayas.length,
                      })
                    : t.staff.contacts.allWilayas}{" "}
                  · {format(t.staff.contacts.added, { date: formatDate(contact.created_at) })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle.mutate({ id: contact.id, active: !contact.active })}
                disabled={toggle.isPending || remove.isPending}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  contact.active
                    ? "border-border bg-background text-muted-foreground"
                    : "border-plant/50 bg-plant/15 text-plant",
                )}
              >
                {contact.active ? t.staff.contacts.active : t.staff.contacts.paused}
              </button>
              <button
                type="button"
                onClick={() => remove.mutate(contact.id)}
                disabled={remove.isPending}
                aria-label={format(t.staff.contacts.remove, { value: contact.value })}
                className="tap-target grid size-9 place-items-center rounded-full border border-border bg-background text-muted-foreground hover:text-fire"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
