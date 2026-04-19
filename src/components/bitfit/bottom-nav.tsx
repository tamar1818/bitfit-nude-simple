import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, TrendingUp, Settings, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app/dashboard", icon: Home },
  { to: "/app/scanner", icon: Search },
  { to: "/app/progress", icon: TrendingUp },
  { to: "/app/settings", icon: Settings },
] as const;

export function BottomNav() {
  const location = useLocation();
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-ink px-2 py-2 shadow-float">
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                active ? "bg-lime text-ink" : "text-primary-foreground/70 hover:text-primary-foreground",
              )}
              aria-label={item.to}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
        <Link
          to="/app/scanner"
          className="mx-1 flex h-14 w-14 items-center justify-center rounded-full bg-lime text-ink shadow-md transition-transform hover:scale-105"
          aria-label="Scan"
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
                "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                active ? "bg-lime text-ink" : "text-primary-foreground/70 hover:text-primary-foreground",
              )}
              aria-label={item.to}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
