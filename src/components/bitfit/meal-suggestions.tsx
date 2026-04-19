import { useState } from "react";
import { Sparkles, RefreshCw, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { useI18n, useT } from "@/lib/i18n";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Suggestion {
  name: string;
  emoji: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  why: string;
}

interface Props {
  remainingCalories: number;
  goal: "lose" | "gain" | "maintain" | null;
  onLogged?: () => void;
}

export function MealSuggestions({ remainingCalories, goal, onLogged }: Props) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const t = useT();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("meal-suggestions", {
        body: {
          remainingCalories: Math.max(remainingCalories, 200),
          goal: goal ?? "maintain",
          lang,
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error === "rate_limit") {
        toast.error(lang === "ka" ? "სცადე მოგვიანებით" : "Rate limit, try again soon");
        return;
      }
      if ((data as { error?: string })?.error === "no_credits") {
        toast.error(lang === "ka" ? "AI კრედიტი ამოიწურა" : "AI credits exhausted");
        return;
      }
      setItems((data?.meals as Suggestion[]) ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const logMeal = async (s: Suggestion, mealType: "breakfast" | "lunch" | "dinner" | "snack") => {
    if (!user) return;
    setAdding(s.name);
    const { error } = await supabase.from("meals").insert({
      user_id: user.id,
      food_name: s.name,
      meal_type: mealType,
      calories: s.calories,
      protein_g: s.protein_g,
      carbs_g: s.carbs_g,
      fats_g: s.fats_g,
      servings: 1,
    });
    setAdding(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(s.name);
    onLogged?.();
  };

  // Pastel rotation so cards aren't all red — green/peach/sky/lavender
  const tints = [
    { bg: "bg-[color:var(--success-soft)]", fg: "text-[color:var(--success)]" },
    { bg: "bg-[color:var(--warning-soft)]", fg: "text-[color:var(--warning)]" },
    { bg: "bg-[color:var(--info-soft)]", fg: "text-[color:var(--info)]" },
    { bg: "bg-lavender", fg: "text-ink" },
  ];

  const remainingPositive = Math.max(remainingCalories, 0);
  const deficitText =
    lang === "ka"
      ? `დარჩენილი ${remainingPositive} კალორია`
      : `${remainingPositive} kcal left to hit your goal`;

  return (
    <div className="rounded-[16px] border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[color:var(--info-soft)] text-[color:var(--info)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="font-display text-sm font-bold text-ink">
              {lang === "ka" ? "AI შემოთავაზება" : "AI suggestions"}
            </div>
            <div className="text-[11px] text-muted-foreground">{deficitText}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchSuggestions}
          disabled={loading}
          className="flex h-9 items-center gap-1.5 rounded-[10px] bg-ink px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          <span>{lang === "ka" ? "მითხარი" : "Suggest"}</span>
        </button>
      </div>

      {items.length > 0 && (
        <div className="mt-3 space-y-2">
          {items.map((s, idx) => {
            const tint = tints[idx % tints.length];
            return (
              <div
                key={s.name}
                className="bf-step-in flex items-center gap-3 rounded-[12px] border border-border bg-background p-3 transition-shadow hover:shadow-card"
              >
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] text-2xl",
                    tint.bg,
                    tint.fg,
                  )}
                  aria-hidden
                >
                  {s.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {Math.round(s.calories)} {t("calories")} · P{Math.round(s.protein_g)} C{Math.round(s.carbs_g)} F{Math.round(s.fats_g)}
                  </div>
                  <div className="mt-0.5 truncate text-[10px] italic text-muted-foreground">{s.why}</div>
                </div>
                <button
                  type="button"
                  onClick={() => logMeal(s, "snack")}
                  disabled={adding === s.name}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-transform hover:scale-110 active:scale-95 disabled:opacity-50",
                    tint.bg,
                    tint.fg,
                  )}
                  aria-label="Add"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {items.length === 0 && !loading && (
        <div className="mt-3 rounded-[10px] border border-dashed border-border bg-secondary/40 p-4 text-center text-xs text-muted-foreground">
          {lang === "ka"
            ? "დააჭირე «მითხარი» რომ მიიღო კერძების იდეები"
            : "Tap 'Suggest' to get personalized meal ideas"}
        </div>
      )}
    </div>
  );
}
