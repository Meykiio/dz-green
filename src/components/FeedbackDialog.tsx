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
import { submitFeedback } from "@/lib/feedback.functions";

const MAX_LENGTH = 2000;

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [hp, setHp] = useState("");
  const [kind, setKind] = useState<"bug" | "idea" | "other">("other");
  const [message, setMessage] = useState("");

  const submit = useServerFn(submitFeedback);
  const mutation = useMutation({
    mutationFn: async () =>
      submit({
        data: {
          hp,
          kind,
          message,
          page: typeof window !== "undefined" ? window.location.pathname : null,
          device:
            typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : null,
        },
      }),
    onSuccess: () => {
      toast.success("Received — thanks. Every message is read.");
      setMessage("");
      setHp("");
      setKind("other");
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message || "Could not send. Try again."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Send feedback"
          className="tap-target inline-flex items-center gap-1.5 rounded-full border border-plant/30 bg-plant/10 px-3 py-1.5 text-sm font-semibold text-plant transition-transform active:scale-[0.97]"
        >
          <MessageSquareText className="size-3.5" />
          <span className="hidden sm:inline">Feedback</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Feedback</DialogTitle>
          <DialogDescription>
            Found a bug, want a feature, or just have something to say? Say it plainly — it goes
            straight to the maintainers.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <Honeypot value={hp} onChange={setHp} />
          <div className="flex gap-2" role="radiogroup" aria-label="Feedback type">
            {(
              [
                { value: "bug", label: "Bug" },
                { value: "idea", label: "Feature idea" },
                { value: "other", label: "Other" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={kind === option.value}
                onClick={() => setKind(option.value)}
                className={`tap-target flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  kind === option.value
                    ? "border-plant/50 bg-plant/10 text-plant"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MAX_LENGTH}
            placeholder="Your message…"
            rows={4}
            autoFocus
            required
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {message.length}/{MAX_LENGTH}
            </span>
            <Button type="submit" size="sm" disabled={mutation.isPending || message.length === 0}>
              {mutation.isPending ? "Sending…" : "Send"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}