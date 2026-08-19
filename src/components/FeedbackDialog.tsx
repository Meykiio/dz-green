import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquareText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Honeypot } from "@/components/FormShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";
import { submitFeedback } from "@/lib/feedback.functions";

const MAX_LENGTH = 2000;

export function FeedbackDialog() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [hp, setHp] = useState("");
  const [message, setMessage] = useState("");

  const submit = useServerFn(submitFeedback);
  const mutation = useMutation({
    mutationFn: async () =>
      submit({
        data: {
          hp,
          message,
          page: typeof window !== "undefined" ? window.location.pathname : null,
        },
      }),
    onSuccess: () => {
      toast.success(t.feedback.success);
      setMessage("");
      setHp("");
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message || t.feedback.error),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t.feedback.send}
          className="tap-target inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-transform active:scale-[0.97]"
        >
          <MessageSquareText className="size-3.5" />
          <span className="hidden sm:inline">{t.feedback.trigger}</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.feedback.title}</DialogTitle>
          <DialogDescription>{t.feedback.description}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <Honeypot value={hp} onChange={setHp} />
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MAX_LENGTH}
            placeholder={t.feedback.placeholder}
            rows={4}
            autoFocus
            required
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {message.length}/{MAX_LENGTH}
            </span>
            <Button type="submit" size="sm" disabled={mutation.isPending || message.length === 0}>
              {mutation.isPending ? t.feedback.sending : t.feedback.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
