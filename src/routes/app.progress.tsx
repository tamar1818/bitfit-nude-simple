import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format, differenceInCalendarDays, startOfWeek, addDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, Trophy, Flame, Target } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useT, useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/progress")({
  component: ProgressPage,
});

interface Weight {
  id: string;
  weight_kg: number;
  target_weight_kg: number | null;
  recorded_at: string;
}

interface Point {
  id: string;
  points: number;
  reason: string;
  awarded_at: string;
}

function ProgressPage() {
  const t = useT();
  const { lang } = useI18n();
  const { user } = useAuth();
  const [weights, setWeights] = useState<Weight[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");
  const [goalKind, setGoalKind] = useState<"lose" | "gain" | "maintain" | null>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: w }, { data: pts }, { data: p }] = await Promise.all([
      supabase
        .from("weights")
        .select("id, weight_kg, target_weight_kg, recorded_at")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: true })
        .limit(60),
      supabase
        .from("weight_points")
        .select("id, points, reason, awarded_at")
        .eq("user_id", user.id)
        .order("awarded_at", { ascending: false })
        .limit(20),
      supabase.from("profiles").select("goal").eq("id", user.id).maybeSingle(),
    ]);
    setWeights((w as Weight[]) ?? []);
    setPoints((pts as Point[]) ?? []);
    setGoalKind((p?.goal as "lose" | "gain" | "maintain" | null) ?? null);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const target =
    [...weights].reverse().find((w) => w.target_weight_kg)?.target_weight_kg ?? null;
  const latest = weights[weights.length - 1];
  const first = weights[0];

  const totalPoints = points.reduce((s, p) => s + p.points, 0);

  /** Compute current streak: consecutive weeks with at least one weight log. */
  const streak = (() => {
    if (weights.length === 0) return 0;
    const weeks = new Set<string>();
    for (const w of weights) {
      const wk = startOfWeek(new Date(w.recorded_at), { weekStartsOn: 1 });
      weeks.add(format(wk, "yyyy-MM-dd"));
    }
    let s = 0;
    let cursor = startOfWeek(new Date(), { weekStartsOn: 1 });
    while (weeks.has(format(cursor, "yyyy-MM-dd"))) {
      s++;
      cursor = addDays(cursor, -7);
    }
    return s;
  })();

  /** Award points: 10 per kg progress + 5 per logged week */
  const awardPoints = async (newWeight: number, prev: number | null) => {
    if (!user || prev == null || !goalKind) return;
    let earned = 5; // logging point
    let reason = lang === "ka" ? "კვირის ჩაწერა" : "Weekly check-in";
    const delta = newWeight - prev;
    if (
      (goalKind === "lose" && delta < 0) ||
      (goalKind === "gain" && delta > 0) ||
      (goalKind === "maintain" && Math.abs(delta) < 0.5)
    ) {
      const bonus = goalKind === "maintain" ? 10 : Math.min(50, Math.round(Math.abs(delta) * 10));
      earned += bonus;
      reason = lang === "ka" ? "მიზნის მიმართულებით" : "Toward goal!";
    }
    await supabase.from("weight_points").insert({
      user_id: user.id,
      points: earned,
      reason,
    });
    toast.success(t("pointsEarned").replace("{n}", String(earned)));
  };

  const submitWeight = async () => {
    if (!user || !value) return;
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) return;
    const prev = latest?.weight_kg != null ? Number(latest.weight_kg) : null;
    const { error } = await supabase.from("weights").insert({
      user_id: user.id,
      weight_kg: v,
      target_weight_kg: target,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setValue("");
    setAdding(false);
    await awardPoints(v, prev);
    load();
  };

  const chartData = weights.map((w) => ({
    date: format(new Date(w.recorded_at), "MMM d"),
    weight: Number(w.weight_kg),
  }));

  /** % progress to goal: based on first vs latest vs target */
  const progressPct = (() => {
    if (!first || !latest || !target) return 0;
    const startW = Number(first.weight_kg);
    const cur = Number(latest.weight_kg);
    const tgt = Number(target);
    const total = Math.abs(startW - tgt);
    if (total < 0.1) return 100;
    const done = Math.abs(startW - cur);
    return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
  })();

  return (
    <div className="mx-auto max-w-md px-5 pt-8 pb-4">
      <h1 className="font-display text-3xl font-bold text-ink">{t("progress")}</h1>

      {/* Points + streak hero */}
      <div className="bf-bounce-in mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[16px] border border-border bg-gradient-to-br from-brand-soft to-card p-4">
          <div className="flex items-center gap-1.5 text-primary">
            <Trophy className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">{t("yourPoints")}</span>
          </div>
          <div className="mt-1 font-display text-3xl font-bold text-ink">{totalPoints}</div>
          <div className="text-[11px] text-muted-foreground">{t("keepGoing")}</div>
        </div>
        <div className="rounded-[16px] border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-ink">
            <Flame className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("streak")}</span>
          </div>
          <div className="mt-1 font-display text-3xl font-bold text-ink">
            {streak}{" "}
            <span className="text-sm font-medium text-muted-foreground">{t("days")}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">{t("weeklyTracker")}</div>
        </div>
      </div>

      {/* Current weight + chart */}
      <div className="bf-bounce-in mt-4 rounded-[16px] border border-border bg-card p-6" style={{ animationDelay: "60ms" }}>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {lang === "ka" ? "ამჟამინდელი" : "Current"}
            </div>
            <div className="font-display text-4xl font-bold text-ink">
              {latest ? `${Number(latest.weight_kg).toFixed(1)}` : "—"}
              <span className="ml-1 text-base font-normal text-muted-foreground">kg</span>
            </div>
          </div>
          {target && (
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Target className="h-3 w-3" /> {lang === "ka" ? "მიზანი" : "Target"}
              </div>
              <div className="font-display text-2xl font-semibold text-primary">
                {Number(target).toFixed(1)} kg
              </div>
            </div>
          )}
        </div>

        {/* progress bar */}
        {target && first && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{progressPct}% {t("toGoal")}</span>
              <span>
                {first ? Number(first.weight_kg).toFixed(1) : ""} → {Number(target).toFixed(1)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-6 h-44">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" stroke="currentColor" fontSize={11} tickLine={false} axisLine={false} className="text-muted-foreground" />
                <YAxis stroke="currentColor" fontSize={11} tickLine={false} axisLine={false} width={30} domain={["dataMin - 1", "dataMax + 1"]} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--primary)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {lang === "ka"
                ? "დაამატე მეტი ჩანაწერი ტრენდის სანახავად"
                : "Log more entries to see your trend"}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAdding(true)}
        className="btn-cta mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary py-4 text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        <Plus className="h-4 w-4" /> {t("addWeight")}
      </button>

      <h2 className="mt-8 font-display text-lg font-bold text-ink">{t("weightHistory")}</h2>
      <div className="mt-3 space-y-2">
        {weights
          .slice()
          .reverse()
          .map((w, i) => {
            const prev = weights[weights.length - i - 2];
            const delta = prev ? Number(w.weight_kg) - Number(prev.weight_kg) : 0;
            return (
              <div
                key={w.id}
                className="bf-step-in flex items-center justify-between rounded-[12px] border border-border bg-card p-4"
              >
                <span className="text-sm text-muted-foreground">
                  {format(new Date(w.recorded_at), "PP")}
                </span>
                <div className="flex items-center gap-3">
                  {prev && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        delta < 0
                          ? "bg-mint/40 text-ink"
                          : delta > 0
                            ? "bg-brand-soft text-primary"
                            : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {delta > 0 ? "+" : ""}
                      {delta.toFixed(1)}
                    </span>
                  )}
                  <span className="font-display text-lg font-semibold text-ink">
                    {Number(w.weight_kg).toFixed(1)} kg
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Recent points history */}
      {points.length > 0 && (
        <>
          <h2 className="mt-8 font-display text-lg font-bold text-ink">{t("yourPoints")}</h2>
          <div className="mt-3 space-y-2">
            {points.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-[12px] border border-border bg-card p-3"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-sm text-ink">{p.reason}</span>
                </div>
                <span className="font-display text-base font-bold text-primary">+{p.points}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="bf-bounce-in w-full max-w-md rounded-[16px] border border-border bg-card p-6 shadow-float">
            <h3 className="font-display text-xl font-bold text-ink">{t("addWeight")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {lang === "ka"
                ? "ყოველკვირეული ჩანაწერი = +5 ქულა, პროგრესი = დამატებითი ბონუსი"
                : "Weekly check-in = +5 points, progress = bonus"}
            </p>
            <input
              type="number"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="kg"
              className="mt-4 w-full rounded-[10px] border border-border bg-background px-5 py-4 text-2xl outline-none focus:border-primary"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="flex-1 rounded-[10px] border border-border bg-card py-3 text-sm font-medium text-ink"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={submitWeight}
                className="btn-cta flex-1 rounded-[10px] bg-primary py-3 text-sm text-primary-foreground"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
