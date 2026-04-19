import { Link, useLocation } from "@tanstack/react-router";
import { Home, Utensils, Users, Settings, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export function BottomNav() {
  const location = useLocation();
  const t = useT();

  const items = [
    { to: "/app/dashboard", icon: Home, label: t("today") },
    { to: "/app/scanner", icon: Utensils, label: t("meals") },
    { to: "/app/groups", icon: Users, label: t("groups") },
    { to: "/app/settings", icon: Settings, label: t("settings") },
  ] as const;

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-1 rounded-[20px] border border-border bg-card p-1.5 shadow-card">
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-[12px] px-2.5 transition-all duration-200",
                active
                  ? "bg-brand-soft text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-ink",
              )}
              aria-label={item.label}
            >
              <Icon className={cn("h-5 w-5", active && "bf-pop-tab")} />
              {active && (
                <span className="text-[11px] font-semibold tracking-wide">{item.label}</span>
              )}
            </Link>
          );
        })}

        {/* Center scan button — raised, brand red (the only red tab) */}
        <Link
          to="/app/scanner"
          className="mx-1 flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary text-primary-foreground shadow-float transition-transform duration-200 hover:scale-110 active:scale-95"
          aria-label={t("scanFood")}
        >
          <ScanLine className="h-5 w-5" />
        </Link>

        {items.slice(2).map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-[12px] px-2.5 transition-all duration-200",
                active
                  ? "bg-brand-soft text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-ink",
              )}
              aria-label={item.label}
            >
              <Icon className={cn("h-5 w-5", active && "bf-pop-tab")} />
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
