import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tint = "default" | "nude" | "lavender" | "mint" | "peach" | "sky" | "ink";

const tintClasses: Record<Tint, string> = {
  default: "bg-card text-card-foreground",
  nude: "bg-nude text-ink",
  lavender: "bg-lavender text-ink",
  mint: "bg-mint text-ink",
  peach: "bg-peach text-ink",
  sky: "bg-sky text-ink",
  ink: "bg-ink text-primary-foreground",
};

interface StatCardProps {
  tint?: Tint;
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
}

export function StatCard({
  tint = "default",
  icon,
  label,
  value,
  hint,
  className,
  children,
  onClick,
}: StatCardProps) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "flex flex-col gap-2 rounded-3xl p-5 text-left shadow-soft transition-all",
        onClick && "hover:shadow-card active:scale-[0.98]",
        tintClasses[tint],
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/40">
            {icon}
          </div>
        )}
        <span className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</span>
      </div>
      <div className="font-display text-2xl font-bold leading-none">{value}</div>
      {hint && <div className="text-xs opacity-60">{hint}</div>}
      {children}
    </Comp>
  );
}
