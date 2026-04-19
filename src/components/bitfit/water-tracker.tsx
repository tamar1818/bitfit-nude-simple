import { useT } from "@/lib/i18n";
import { Plus, Minus, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";

interface WaterTrackerProps {
  ml: number;
  goalMl?: number;
  onChange: (next: number) => void;
}

const STEP = 250;

export function WaterTracker({ ml, goalMl = 2500, onChange }: WaterTrackerProps) {
  const t = useT();
  const glasses = Math.floor(ml / STEP);
  const goalGlasses = Math.ceil(goalMl / STEP);

  return (
    <div className="rounded-3xl bg-sky p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/40">
            <Droplet className="h-4 w-4 text-ink" />
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-ink/70">
            {t("water")}
          </span>
        </div>
        <div className="text-xs text-ink/60">
          {ml} {t("of")} {goalMl} ml
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: goalGlasses }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-6 w-3 rounded-sm border border-ink/20 transition-colors",
              i < glasses ? "bg-ink" : "bg-background/40",
            )}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, ml - STEP))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 text-ink hover:bg-background"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="font-display text-xl font-bold text-ink">
          {glasses} {t("glass")}
        </span>
        <button
          type="button"
          onClick={() => onChange(ml + STEP)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
