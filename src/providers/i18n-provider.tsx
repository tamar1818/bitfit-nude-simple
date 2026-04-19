import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  I18nContext,
  getStoredLang,
  translations,
  type Lang,
  type TranslationKey,
} from "@/lib/i18n";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ka");

  useEffect(() => {
    setLangState(getStoredLang());
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("bitfit.lang", next);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[lang][key] ?? key,
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
