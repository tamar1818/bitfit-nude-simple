import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, ChevronRight, GraduationCap, Calculator } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { LanguageToggle } from "@/components/bitfit/language-toggle";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

interface Profile {
  full_name: string | null;
  age: number | null;
  height_cm: number | null;
  goal: string | null;
}

function SettingsPage() {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isCoach, setIsCoach] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("profiles")
        .select("full_name, age, height_cm, goal")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]).then(([{ data: p }, { data: roles }]) => {
      setProfile(p as Profile);
      setIsCoach(!!roles?.some((r) => r.role === "coach"));
    });
  }, [user]);

  const becomeCoach = async () => {
    if (!user) return;
    const { error } = await supabase.from("user_roles").insert({
      user_id: user.id,
      role: "coach",
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from("profiles").update({ is_coach: true }).eq("id", user.id);
    setIsCoach(true);
    toast.success("You are now a coach");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <h1 className="font-display text-3xl font-bold text-ink">{t("settings")}</h1>

      <div className="mt-6 rounded-3xl bg-card p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lavender font-display text-2xl font-bold text-ink">
            {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div className="font-display text-lg font-bold text-ink">
              {profile?.full_name || "—"}
            </div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label={t("age")} value={profile?.age ?? "—"} />
          <Stat label={t("height")} value={profile?.height_cm ? `${profile.height_cm}` : "—"} />
          <Stat label={t("goal")} value={profile?.goal ?? "—"} />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 px-2 text-xs uppercase tracking-wider text-muted-foreground">
          {t("language")}
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-soft">
          <LanguageToggle />
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Link
          to="/app/calculator"
          className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-peach">
            <Calculator className="h-5 w-5 text-ink" />
          </div>
          <span className="flex-1 font-medium text-ink">{t("calculator")}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        {isCoach ? (
          <Link
            to="/coach/clients"
            className="flex items-center gap-3 rounded-2xl bg-lime p-4 shadow-soft"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="flex-1 font-medium text-ink">{t("coach")}</span>
            <ChevronRight className="h-4 w-4 text-ink" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={becomeCoach}
            className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-soft"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
              <GraduationCap className="h-5 w-5 text-ink" />
            </div>
            <span className="flex-1 font-medium text-ink">{t("becomeCoach")}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-soft"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-nude">
            <LogOut className="h-5 w-5 text-ink" />
          </div>
          <span className="flex-1 font-medium text-ink">{t("logout")}</span>
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-nude p-3">
      <div className="text-[10px] uppercase tracking-wider text-ink/60">{label}</div>
      <div className="font-display text-base font-bold text-ink">{value}</div>
    </div>
  );
}
