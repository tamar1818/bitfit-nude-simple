import { useT, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  const t = useT();
  return (
    <div className={cn("inline-flex rounded-full bg-nude p-1", className)}>
      <button
        type="button"
        onClick={() => setLang("ka")}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
          lang === "ka" ? "bg-ink text-primary-foreground" : "text-ink/70",
        )}
      >
        {t("georgian")}
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
          lang === "en" ? "bg-ink text-primary-foreground" : "text-ink/70",
        )}
      >
        {t("english")}
      </button>
    </div>
  );
}
