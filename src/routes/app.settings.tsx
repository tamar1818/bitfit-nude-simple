import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LogOut, ChevronRight, GraduationCap, Camera, Moon, Sun, Trash2, Shield } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/providers/theme-provider";
import { supabase } from "@/integrations/supabase/client";
import { LanguageToggle } from "@/components/bitfit/language-toggle";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

interface Profile {
  full_name: string | null;
  age: number | null;
  height_cm: number | null;
  goal: string | null;
  avatar_url: string | null;
}

function SettingsPage() {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("profiles")
        .select("full_name, age, height_cm, goal, avatar_url")
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

  const onPickFile = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = urlData.publicUrl;
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
      if (updErr) throw updErr;
      setProfile((p) => (p ? { ...p, avatar_url: url } : p));
      toast.success("Updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
      toast.error(`${t("deleteAccountTypeToConfirm")} DELETE`);
      return;
    }
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await supabase.auth.signOut();
      toast.success(t("accountDeleted"));
      navigate({ to: "/auth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("deleteFailed"));
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <h1 className="font-display text-3xl font-bold text-ink">{t("settings")}</h1>

      {/* Profile card with avatar upload */}
      <div className="bf-bounce-in mt-6 rounded-[16px] border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onPickFile}
            disabled={uploading}
            className="group relative h-20 w-20 overflow-hidden rounded-full bg-brand-soft outline-none ring-2 ring-border transition-all hover:ring-primary"
            aria-label={t("changePhoto")}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name ?? ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-3xl font-bold text-primary">
                {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/40 text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5" />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onFile}
          />
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-bold text-ink truncate">
              {profile?.full_name || "—"}
            </div>
            <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
            <button
              type="button"
              onClick={onPickFile}
              disabled={uploading}
              className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary disabled:opacity-50"
            >
              {uploading ? "…" : profile?.avatar_url ? t("changePhoto") : t("uploadPhoto")}
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label={t("age")} value={profile?.age ?? "—"} />
          <Stat label={t("height")} value={profile?.height_cm ? `${profile.height_cm}` : "—"} />
          <Stat label={t("goal")} value={profile?.goal ?? "—"} />
        </div>
      </div>

      {/* Appearance (light / dark) */}
      <div className="mt-6">
        <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("appearance")}
        </div>
        <div className="rounded-[16px] border border-border bg-card p-1.5">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-[10px] py-2.5 text-sm font-medium transition-all",
                theme === "light"
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-ink/60 hover:text-ink",
              )}
            >
              <Sun className="h-4 w-4" /> {t("lightMode")}
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-[10px] py-2.5 text-sm font-medium transition-all",
                theme === "dark"
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-ink/60 hover:text-ink",
              )}
            >
              <Moon className="h-4 w-4" /> {t("darkMode")}
            </button>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="mt-6">
        <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("language")}
        </div>
        <LanguageToggle />
      </div>

      {/* Coach + Logout */}
      <div className="mt-6 space-y-2">
        {isCoach ? (
          <Link
            to="/coach/clients"
            className="flex items-center gap-3 rounded-[16px] border border-border bg-card p-4 transition-colors hover:bg-secondary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-soft text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="flex-1 font-medium text-ink">{t("coach")}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={becomeCoach}
            className="flex w-full items-center gap-3 rounded-[16px] border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-soft text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="flex-1 font-medium text-ink">{t("becomeCoach")}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-[16px] border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-secondary">
            <LogOut className="h-5 w-5 text-ink" />
          </div>
          <span className="flex-1 font-medium text-ink">{t("logout")}</span>
        </button>
      </div>

      {/* Legal */}
      <div className="mt-6">
        <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("legal")}
        </div>
        <Link
          to="/privacy"
          className="flex items-center gap-3 rounded-[16px] border border-border bg-card p-4 transition-colors hover:bg-secondary"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-soft text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <span className="flex-1 font-medium text-ink">{t("viewPrivacyPolicy")}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Danger zone */}
      <div className="mt-6 mb-12">
        <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-destructive/80">
          {t("dangerZone")}
        </div>
        <button
          type="button"
          onClick={() => {
            setDeleteConfirm("");
            setDeleteOpen(true);
          }}
          className="flex w-full items-center gap-3 rounded-[16px] border border-destructive/20 bg-card p-4 text-left transition-colors hover:bg-destructive/5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-destructive/10 text-destructive">
            <Trash2 className="h-5 w-5" />
          </div>
          <span className="flex-1 font-medium text-destructive">{t("deleteAccount")}</span>
        </button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={(o) => !deleting && setDeleteOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteAccountTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteAccountDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t("deleteAccountTypeToConfirm")} <span className="font-bold text-destructive">DELETE</span>
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              disabled={deleting}
              className="mt-1.5 w-full rounded-[10px] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-destructive"
              placeholder="DELETE"
            />
          </div>
          <AlertDialogFooter className="mt-2 flex-row justify-end gap-2 sm:gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={() => setDeleteOpen(false)}
              className="rounded-[10px] border border-border bg-card px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-secondary disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={deleting || deleteConfirm.trim().toUpperCase() !== "DELETE"}
              onClick={confirmDelete}
              className="rounded-[10px] bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {deleting ? t("loading") : t("deleteAccountConfirm")}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[10px] bg-secondary p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-base font-bold text-ink">{value}</div>
    </div>
  );
}
