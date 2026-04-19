import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";
import { Users } from "lucide-react";

export const Route = createFileRoute("/groups/join/$slug")({
  component: JoinGroupPage,
});

function JoinGroupPage() {
  const { slug } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "joining" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    void join();
  }, [authLoading, user]);

  const join = async () => {
    setStatus("joining");
    try {
      const { data, error } = await supabase.rpc("join_group_by_slug", { _slug: slug });
      if (error) throw error;
      toast.success("Joined group!");
      setStatus("done");
      setTimeout(() => navigate({ to: "/app/groups" }), 600);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to join";
      setMessage(msg);
      setStatus("error");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-md rounded-[16px] border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-primary">
          <Users className="h-8 w-8" />
        </div>
        {status === "joining" && (
          <div className="mt-4 font-display text-xl font-bold text-ink">Joining…</div>
        )}
        {status === "done" && (
          <div className="mt-4 font-display text-xl font-bold text-ink">Welcome!</div>
        )}
        {status === "error" && (
          <>
            <div className="mt-4 font-display text-xl font-bold text-ink">Couldn't join</div>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <button
              type="button"
              onClick={() => navigate({ to: "/app/groups" })}
              className="btn-cta mt-6 rounded-[10px] bg-primary px-6 py-3 text-primary-foreground"
            >
              Go to groups
            </button>
          </>
        )}
      </div>
    </div>
  );
}
