import { Camera, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

import { useI18n } from "@/i18n";
import { compressImage } from "@/lib/image";

interface Props {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label: string;
  required?: boolean;
}

/** Camera-capable photo field. Compresses on-device before anything uploads. */
export function PhotoInput({ value, onChange, label, required }: Props) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await compressImage(file));
    } catch {
      setError(t.photo.errorRead);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="eyebrow">
        {label}
        {required ? t.field.requiredMark : t.field.optionalSuffix}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="relative mt-2">
          <img
            src={value}
            alt={t.photo.selectedAlt}
            className="aspect-[4/3] w-full rounded-xl object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={t.photo.remove}
            className="tap-target absolute top-2 end-2 grid place-items-center rounded-full bg-background/80 backdrop-blur"
          >
            <X className="size-5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 px-4 py-8 text-sm text-muted-foreground hover:border-primary/60 hover:text-foreground"
        >
          {busy ? <Loader2 className="size-7 animate-spin" /> : <Camera className="size-7" />}
          <span>{busy ? t.photo.preparing : t.photo.take}</span>
        </button>
      )}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
