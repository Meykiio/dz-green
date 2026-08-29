import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/i18n";
import { WILAYAS } from "@/lib/wilayas";

/** Historic wilayas with their post-2019 children grouped under them. */
const ASSIGNABLE = WILAYAS.filter((w) => w.code === w.mapCode).map((parent) => ({
  parent,
  children: WILAYAS.filter((w) => w.mapCode === parent.code && w.code !== w.mapCode),
}));

/** Shared wilaya checkbox list (AssignWilayasDialog + CreateAccountDialog). */
export function WilayaChecklist({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (code: string, add: boolean) => void;
}) {
  const { locale } = useI18n();
  return (
    <div className="space-y-4">
      {ASSIGNABLE.map(({ parent, children }) => (
        <div key={parent.code} className="rounded-lg border border-border p-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={selected.has(parent.code)}
              onCheckedChange={(v) => onToggle(parent.code, v === true)}
            />
            {parent.code} — {locale === "ar" ? parent.nameAr : parent.name}
          </label>
          {children.length > 0 && (
            <div className="ms-7 mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              {children.map((c) => (
                <label
                  key={c.code}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <Checkbox
                    checked={selected.has(c.code)}
                    onCheckedChange={(v) => onToggle(c.code, v === true)}
                  />
                  {c.code} — {locale === "ar" ? c.nameAr : c.name}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
