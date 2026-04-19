import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Copy, ChevronRight } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/coach/clients")({
  component: ClientsPage,
});

interface Client {
  id: string;
  full_name: string | null;
  goal: string | null;
  age: number | null;
}

interface Invite {
  id: string;
  code: string;
  used_by_user_id: string | null;
  expires_at: string;
}

function ClientsPage() {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);

  const load = async () => {
    if (!user) return;
    const [{ data: c }, { data: i }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, goal, age")
        .eq("coach_id", user.id),
      supabase
        .from("coach_invites")
        .select("id, code, used_by_user_id, expires_at")
        .eq("coach_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setClients((c as Client[]) ?? []);
    setInvites((i as Invite[]) ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const createInvite = async () => {
    if (!user) return;
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabase.from("coach_invites").insert({
      code,
      coach_id: user.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Code: ${code}`);
    load();
  };

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/app/settings" })}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-2xl font-bold text-ink">{t("clients")}</h1>
      </header>

      <button
        type="button"
        onClick={createInvite}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 font-medium text-primary-foreground shadow-card"
      >
        <Plus className="h-4 w-4" />
        {t("createInvite")}
      </button>

      {invites.filter((i) => !i.used_by_user_id).length > 0 && (
        <div className="mt-6">
          <div className="mb-2 px-2 text-xs uppercase tracking-wider text-muted-foreground">
            Active codes
          </div>
          <div className="space-y-2">
            {invites
              .filter((i) => !i.used_by_user_id)
              .map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between rounded-2xl bg-lime p-4 shadow-soft"
                >
                  <span className="font-display text-xl font-bold tracking-widest text-ink">
                    {i.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(i.code);
                      toast.success("Copied");
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-primary-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="mb-2 px-2 text-xs uppercase tracking-wider text-muted-foreground">
          {t("clients")}
        </div>
        {clients.length === 0 ? (
          <div className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
            {t("noClients")}
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map((c) => (
              <Link
                key={c.id}
                to="/coach/clients/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft transition-all hover:shadow-card"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lavender font-display text-lg font-bold text-ink">
                  {c.full_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-ink">{c.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.goal ? t(`${c.goal}Weight` as "loseWeight" | "gainWeight" | "maintainWeight") : ""}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
