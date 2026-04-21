import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

/**
 * Pill-style theme switcher with sliding thumb.
 * Two icons (sun + moon) inside a rounded capsule; the active icon
 * sits inside a brand-red circle that smoothly slides between positions.
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-9 w-[68px] items-center rounded-full border border-border bg-card p-1 transition-colors",
        className,
      )}
    >
      {/* Sliding thumb */}
      <span
        className={cn(
          "absolute top-1 left-1 h-7 w-7 rounded-full bg-primary shadow-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isDark && "translate-x-[28px]",
        )}
        aria-hidden
      />
      {/* Icons */}
      <span
        className={cn(
          "relative z-10 flex h-7 w-7 items-center justify-center transition-colors",
          !isDark ? "text-primary-foreground" : "text-muted-foreground",
        )}
      >
        <Sun className="h-3.5 w-3.5" />
      </span>
      <span
        className={cn(
          "relative z-10 flex h-7 w-7 items-center justify-center transition-colors",
          isDark ? "text-primary-foreground" : "text-muted-foreground",
        )}
      >
        <Moon className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}
