import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/i18n";
import { adminSetWilayas, type AdminUser } from "@/lib/admin.functions";
import { WilayaChecklist } from "./WilayaChecklist";

export function AssignWilayasDialog({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
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

        <WilayaChecklist selected={selected} onToggle={toggle} />

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
