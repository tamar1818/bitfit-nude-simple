import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Search, Camera, Sparkles, X, Plus } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useI18n, useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/scanner")({
  component: ScannerPage,
});

interface Food {
  id: string;
  name_ka: string;
  name_en: string;
  brand: string | null;
  category: string | null;
  calories_per_100g: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  serving_size_g: number | null;
}

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

function ScannerPage() {
  const t = useT();
  const { lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);
  const [mealType, setMealType] = useState<MealType>("snack");
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    const search = async () => {
      const q = query.trim();
      const builder = supabase
        .from("foods_ge")
        .select("*")
        .order("name_ka")
        .limit(40);
      const { data } = q
        ? await builder.or(`name_ka.ilike.%${q}%,name_en.ilike.%${q}%,brand.ilike.%${q}%`)
        : await builder;
      setFoods((data as Food[]) ?? []);
    };
    const id = setTimeout(search, 200);
    return () => clearTimeout(id);
  }, [query]);

  const computed = useMemo(() => {
    if (!selected) return null;
    const factor = grams / 100;
    return {
      calories: Number(selected.calories_per_100g) * factor,
      protein_g: Number(selected.protein_g) * factor,
      carbs_g: Number(selected.carbs_g) * factor,
      fats_g: Number(selected.fats_g) * factor,
    };
  }, [selected, grams]);

  const addMeal = async () => {
    if (!user || !selected || !computed) return;
    const { error } = await supabase.from("meals").insert({
      user_id: user.id,
      food_id: selected.id,
      date: format(new Date(), "yyyy-MM-dd"),
      food_name: lang === "ka" ? selected.name_ka : selected.name_en,
      meal_type: mealType,
      servings: grams / 100,
      calories: computed.calories,
      protein_g: computed.protein_g,
      carbs_g: computed.carbs_g,
      fats_g: computed.fats_g,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Added");
    navigate({ to: "/app/dashboard" });
  };

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/app/dashboard" })}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-2xl font-bold text-ink">{t("addMeal")}</h1>
      </header>

      <div className="mt-6 flex items-center gap-2 rounded-full bg-card px-5 py-3 shadow-soft">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("searchFood")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-base outline-none"
        />
        <button
          type="button"
          onClick={() => setAiOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[color:var(--info-soft)] text-[color:var(--info)] transition-transform hover:scale-110 active:scale-95"
          aria-label="AI scan"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {foods.length === 0 && (
          <div className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
            No matches
          </div>
        )}
        {foods.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setSelected(f);
              setGrams(Number(f.serving_size_g) || 100);
            }}
            className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-soft transition-all hover:shadow-card"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-nude text-lg">
              🍽
            </div>
            <div className="flex-1">
              <div className="font-medium text-ink">
                {lang === "ka" ? f.name_ka : f.name_en}
              </div>
              <div className="text-xs text-muted-foreground">
                {f.brand ? `${f.brand} · ` : ""}
                {Math.round(Number(f.calories_per_100g))} kcal / 100g
              </div>
            </div>
            <Plus className="h-4 w-4 text-ink" />
          </button>
        ))}
      </div>

      {/* Selected food sheet */}
      {selected && computed && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-float">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-xl font-bold text-ink">
                  {lang === "ka" ? selected.name_ka : selected.name_en}
                </div>
                {selected.brand && (
                  <div className="text-xs text-muted-foreground">{selected.brand}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-nude"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Grams
              </label>
              <input
                type="number"
                value={grams}
                onChange={(e) => setGrams(Math.max(0, Number(e.target.value)))}
                className="mt-1 w-full rounded-2xl bg-nude px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ink/20"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["breakfast", "lunch", "dinner", "snack"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMealType(m)}
                  className={cn(
                    "rounded-full px-3 py-2 text-xs font-medium",
                    mealType === m ? "bg-ink text-primary-foreground" : "bg-nude text-ink",
                  )}
                >
                  {t(m)}
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl bg-nude p-3 text-center">
              <Stat label="kcal" value={Math.round(computed.calories)} />
              <Stat label="P" value={Math.round(computed.protein_g)} />
              <Stat label="C" value={Math.round(computed.carbs_g)} />
              <Stat label="F" value={Math.round(computed.fats_g)} />
            </div>

            <button
              type="button"
              onClick={addMeal}
              className="btn-cta mt-6 w-full rounded-full bg-ink py-4 text-primary-foreground"
            >
              {t("add")}
            </button>
          </div>
        </div>
      )}

      {/* AI sheet */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 text-center shadow-float">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime">
              <Sparkles className="h-7 w-7 text-ink" />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-ink">
              {t("aiScannerSoon")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("aiScannerDesc")}</p>
            <button
              type="button"
              onClick={() => setAiOpen(false)}
              className="btn-cta mt-6 w-full rounded-full bg-ink py-4 text-primary-foreground"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-lg font-bold text-ink">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-ink/60">{label}</div>
    </div>
  );
}
