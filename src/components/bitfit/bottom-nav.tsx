import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, TrendingUp, Settings, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export function BottomNav() {
  const location = useLocation();
  const t = useT();

  const items = [
    { to: "/app/dashboard", icon: Home, label: t("today") },
    { to: "/app/scanner", icon: Search, label: t("meals") },
    { to: "/app/progress", icon: TrendingUp, label: t("progress") },
    { to: "/app/settings", icon: Settings, label: t("settings") },
  ] as const;

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-1 rounded-[20px] border border-border bg-card/95 p-1.5 backdrop-blur-md shadow-card">
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex h-12 min-w-12 items-center justify-center gap-1.5 rounded-[14px] px-2.5 transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground scale-105"
                  : "text-muted-foreground hover:text-ink hover:bg-secondary",
              )}
              aria-label={item.label}
            >
              <Icon className={cn("h-5 w-5 transition-transform", active && "bf-pop-tab")} />
              {active && (
                <span className="text-[11px] font-semibold tracking-wide">{item.label}</span>
              )}
            </Link>
          );
        })}

        {/* Center scan button — bigger, raised */}
        <Link
          to="/app/scanner"
          className="mx-1 flex h-14 w-14 items-center justify-center rounded-[16px] bg-primary text-primary-foreground shadow-float transition-transform duration-200 hover:scale-110 active:scale-95"
          aria-label={t("scanFood")}
        >
          <ScanLine className="h-6 w-6" />
        </Link>

        {items.slice(2).map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex h-12 min-w-12 items-center justify-center gap-1.5 rounded-[14px] px-2.5 transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground scale-105"
                  : "text-muted-foreground hover:text-ink hover:bg-secondary",
              )}
              aria-label={item.label}
            >
              <Icon className={cn("h-5 w-5 transition-transform", active && "bf-pop-tab")} />
              {active && (
                <span className="text-[11px] font-semibold tracking-wide">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
