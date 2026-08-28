import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/i18n";
import { adminSetWilayas, type AdminUser } from "@/lib/admin.functions";
import { WILAYAS } from "@/lib/wilayas";

/** Historic wilayas with their post-2019 children grouped under them. */
const ASSIGNABLE = WILAYAS.filter((w) => w.code === w.mapCode).map((parent) => ({
  parent,
  children: WILAYAS.filter((w) => w.mapCode === parent.code && w.code !== w.mapCode),
}));

export function AssignWilayasDialog({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(user.wilayas));

  const save = useMutation({
    mutationFn: () => adminSetWilayas({ data: { userId: user.id, wilayas: [...selected] } }),
    onSuccess: () => {
      toast.success(t("moderation.assign.toast"));
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (code: string, add: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (add) next.add(code);
      else next.delete(code);
      return next;
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("moderation.assign.title", { name: user.email ?? user.display_name ?? user.id })}
          </DialogTitle>
          <DialogDescription>{t("moderation.assign.desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {ASSIGNABLE.map(({ parent, children }) => (
            <div key={parent.code} className="rounded-lg border border-border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={selected.has(parent.code)}
                  onCheckedChange={(v) => toggle(parent.code, v === true)}
                />
                {parent.code} — {locale === "ar" ? parent.nameAr : parent.name}
              </label>
              {children.length > 0 && (
                <div className="ms-7 mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                  {children.map((c) => (
                    <label key={c.code} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Checkbox
                        checked={selected.has(c.code)}
                        onCheckedChange={(v) => toggle(c.code, v === true)}
                      />
                      {c.code} — {locale === "ar" ? c.nameAr : c.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t("moderation.assign.cancel")}
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <ShieldCheck className="size-4" />
            {t("moderation.assign.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
