import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { GeorgianFlag, UKFlag } from "./flag-icons";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={cn("inline-flex w-full rounded-[10px] border border-border bg-card p-1", className)}>
      <button
        type="button"
        onClick={() => setLang("ka")}
        aria-label="ქართული"
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-[8px] px-3 py-2 text-sm font-medium transition-all duration-200",
          lang === "ka"
            ? "bg-primary text-primary-foreground shadow-soft"
            : "text-ink/60 hover:text-ink",
        )}
      >
        <GeorgianFlag className="rounded-[2px]" />
        <span>ქართული</span>
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-label="English"
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-[8px] px-3 py-2 text-sm font-medium transition-all duration-200",
          lang === "en"
            ? "bg-primary text-primary-foreground shadow-soft"
            : "text-ink/60 hover:text-ink",
        )}
      >
        <UKFlag className="rounded-[2px]" />
        <span>English</span>
      </button>
    </div>
  );
}
