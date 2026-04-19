import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Plus } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/progress")({
  component: ProgressPage,
});

interface Weight {
  id: string;
  weight_kg: number;
  target_weight_kg: number | null;
  recorded_at: string;
}

function ProgressPage() {
  const t = useT();
  const { user } = useAuth();
  const [weights, setWeights] = useState<Weight[]>([]);
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("weights")
      .select("id, weight_kg, target_weight_kg, recorded_at")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: true })
      .limit(60);
    setWeights((data as Weight[]) ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const target =
    [...weights].reverse().find((w) => w.target_weight_kg)?.target_weight_kg ?? null;
  const latest = weights[weights.length - 1];

  const submitWeight = async () => {
    if (!user || !value) return;
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) return;
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
    toast.success("Saved");
    load();
  };

  const chartData = weights.map((w) => ({
    date: format(new Date(w.recorded_at), "MMM d"),
    weight: Number(w.weight_kg),
  }));

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <h1 className="font-display text-3xl font-bold text-ink">{t("progress")}</h1>

      <div className="mt-6 rounded-3xl bg-card p-6 shadow-card">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Current
            </div>
            <div className="font-display text-4xl font-bold text-ink">
              {latest ? `${Number(latest.weight_kg).toFixed(1)}` : "—"}
              <span className="ml-1 text-base font-normal text-muted-foreground">kg</span>
            </div>
          </div>
          {target && (
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Target
              </div>
              <div className="font-display text-2xl font-semibold text-ink/70">
                {Number(target).toFixed(1)} kg
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 h-44">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  stroke="oklch(0.55 0.01 270)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.55 0.01 270)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                  domain={["dataMin - 1", "dataMax + 1"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "none",
                    borderRadius: 12,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="oklch(0.18 0.005 270)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "oklch(0.88 0.18 130)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Log more entries to see your trend
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAdding(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 font-medium text-primary-foreground shadow-card"
      >
        <Plus className="h-4 w-4" /> {t("addWeight")}
      </button>

      <h2 className="mt-8 font-display text-lg font-bold text-ink">{t("weightHistory")}</h2>
      <div className="mt-3 space-y-2">
        {weights
          .slice()
          .reverse()
          .map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-soft"
            >
              <span className="text-sm text-muted-foreground">
                {format(new Date(w.recorded_at), "PP")}
              </span>
              <span className="font-display text-lg font-semibold text-ink">
                {Number(w.weight_kg).toFixed(1)} kg
              </span>
            </div>
          ))}
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-float">
            <h3 className="font-display text-xl font-bold text-ink">{t("addWeight")}</h3>
            <input
              type="number"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="kg"
              className="mt-4 w-full rounded-2xl bg-nude px-5 py-4 text-2xl outline-none focus:ring-2 focus:ring-ink/20"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="flex-1 rounded-full bg-nude py-3 text-sm font-medium text-ink"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={submitWeight}
                className="flex-1 rounded-full bg-ink py-3 text-sm font-medium text-primary-foreground"
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
