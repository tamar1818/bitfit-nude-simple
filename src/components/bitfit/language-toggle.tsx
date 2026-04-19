import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={cn("inline-flex rounded-full bg-nude p-1", className)}>
      <button
        type="button"
        onClick={() => setLang("ka")}
        aria-label="Switch to Georgian"
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
          lang === "ka" ? "bg-ink text-primary-foreground" : "text-ink/70",
        )}
      >
        <span aria-hidden className="text-base leading-none">🇬🇪</span>
        <span>KA</span>
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-label="Switch to English"
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
          lang === "en" ? "bg-ink text-primary-foreground" : "text-ink/70",
        )}
      >
        <span aria-hidden className="text-base leading-none">🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}
