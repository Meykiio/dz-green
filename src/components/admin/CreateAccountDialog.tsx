import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, KeyRound } from "lucide-react";
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
import { localizeError, useI18n } from "@/i18n";
import { adminCreateUser } from "@/lib/admin.functions";
import { WilayaChecklist } from "./WilayaChecklist";

function generatePassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("") + "a1";
}

/** Admin creates a signed-in moderator account (role + wilayas in one step). */
export function CreateAccountDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [wilayas, setWilayas] = useState<Set<string>>(() => new Set());
  const create = useServerFn(adminCreateUser);

  const submit = useMutation({
    mutationFn: () =>
      create({
        data: {
          email,
          password,
          display_name: displayName || undefined,
          role: "moderator",
          wilayas: [...wilayas],
        },
      }),
    onSuccess: () => {
      toast.success(t("moderation.adm.create.toastOk"));
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      onClose();
    },
    onError: (e: Error) => toast.error(localizeError(e.message ?? "")),
  });

  const toggle = (code: string, add: boolean) =>
    setWilayas((prev) => {
      const next = new Set(prev);
      if (add) next.add(code);
      else next.delete(code);
      return next;
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[82vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("moderation.adm.create.title")}</DialogTitle>
          <DialogDescription>{t("moderation.adm.create.desc")}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          <label className="block">
            <span className="eyebrow">{t("moderation.adm.create.email")}</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
            />
          </label>
          <label className="block">
            <span className="eyebrow">{t("moderation.adm.create.password")}</span>
            <div className="mt-1 flex gap-2">
              <input
                required
                minLength={8}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="tap-target w-full rounded-md border border-input bg-card px-3 py-2 text-base"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t("moderation.adm.create.hide") : t("moderation.adm.create.show")}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPassword(generatePassword())}
                aria-label={t("moderation.adm.create.generate")}
              >
                <KeyRound className="size-4" />
              </Button>
            </div>
          </label>
          <label className="block">
            <span className="eyebrow">{t("moderation.adm.create.displayName")}</span>
            <input
              value={displayName}
              maxLength={80}
              onChange={(e) => setDisplayName(e.target.value)}
              className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
            />
          </label>
          <div>
            <span className="eyebrow">{t("moderation.adm.create.wilayasTitle")}</span>
            <div className="mt-2">
              <WilayaChecklist selected={wilayas} onToggle={toggle} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("moderation.assign.cancel")}
            </Button>
            <Button type="submit" disabled={submit.isPending}>
              {submit.isPending ? t("moderation.adm.create.creating") : t("moderation.adm.create.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
