import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const t = useT();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setOnboarded(null);
      return;
    }
    supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setOnboarded(data?.onboarded ?? false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="font-display text-3xl font-bold text-ink">Bitfit</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/welcome" />;
  if (onboarded === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">{t("loading")}</span>
      </div>
    );
  }
  if (!onboarded) return <Navigate to="/onboarding" />;
  return <Navigate to="/app/dashboard" />;
}
