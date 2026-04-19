import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { BottomNav } from "@/components/bitfit/bottom-nav";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="font-display text-xl text-ink">Bitfit</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <Outlet />
      <BottomNav />
    </div>
  );
}
