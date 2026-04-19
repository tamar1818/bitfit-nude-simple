import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/coach")({
  component: CoachLayout,
});

function CoachLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const ok = !!data?.some((r) => r.role === "coach" || r.role === "admin");
        setAllowed(ok);
        if (!ok) navigate({ to: "/app/settings" });
      });
  }, [user, loading, navigate]);

  if (allowed !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <Outlet />
    </div>
  );
}
