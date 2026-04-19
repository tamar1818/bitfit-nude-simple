import type { ReactElement } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { GeorgianFlag, UKFlag } from "./flag-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

interface LanguageToggleProps {
  className?: string;
  variant?: "compact" | "block";
}

const LANGS = [
  { code: "ka" as const, label: "ქართული", Flag: GeorgianFlag },
  { code: "en" as const, label: "English", Flag: UKFlag },
];

type FlagComponent = (props: { className?: string }) => ReactElement;

function FlagBadge({ Flag }: { Flag: FlagComponent }) {
  // Flag SVGs are self-clipped to a circle with a square viewBox, so they
  // fit a 20x20 box perfectly without stretching.
  return (
    <span className="block h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
      <Flag className="block h-full w-full" />
    </span>
  );
}

export function LanguageToggle({ className, variant = "compact" }: LanguageToggleProps) {
  const { lang, setLang } = useI18n();
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];
  const CurrentFlag = current.Flag;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-ink outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary",
          variant === "block" && "w-full justify-between px-4 py-2.5",
          className,
        )}
        aria-label="Language"
      >
        <span className="flex items-center gap-2">
          <FlagBadge Flag={CurrentFlag} />
          <span className="normal-case">{current.label}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px] rounded-[12px] p-1">
        {LANGS.map(({ code, label, Flag }) => {
          const active = lang === code;
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => setLang(code)}
              className={cn(
                "cursor-pointer gap-2 rounded-[8px] px-3 py-2 text-sm",
                active && "bg-brand-soft text-primary",
              )}
            >
              <FlagBadge Flag={Flag} />
              <span className="flex-1 normal-case">{label}</span>
              {active && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
