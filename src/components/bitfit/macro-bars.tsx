import { useT } from "@/lib/i18n";

interface MacroBarsProps {
  protein: number;
  carbs: number;
  fats: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatsGoal?: number;
}

function Bar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = Math.min((value / Math.max(goal, 1)) * 100, 100);
  return (
    <div className="flex-1">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-ink/70">{label}</span>
        <span className="text-ink/60">
          {Math.round(value)}g
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-nude">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function MacroBars({
  protein,
  carbs,
  fats,
  proteinGoal = 120,
  carbsGoal = 250,
  fatsGoal = 70,
}: MacroBarsProps) {
  const t = useT();
  return (
    <div className="flex gap-4">
      <Bar label={t("protein")} value={protein} goal={proteinGoal} color="oklch(0.7 0.15 290)" />
      <Bar label={t("carbs")} value={carbs} goal={carbsGoal} color="oklch(0.7 0.15 60)" />
      <Bar label={t("fats")} value={fats} goal={fatsGoal} color="oklch(0.88 0.18 130)" />
    </div>
  );
}
