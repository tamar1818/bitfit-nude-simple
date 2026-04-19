import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { Users, Copy, Check, Plus, Flame, Trophy, LogOut as LeaveIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/groups")({
  component: GroupsPage,
});

interface Group {
  id: string;
  name: string;
  challenge_title: string | null;
  challenge_days: number | null;
  start_date: string;
  invite_slug: string;
  owner_id: string;
}

interface MemberRow {
  user_id: string;
  joined_at: string;
}

interface CheckIn {
  user_id: string;
  date: string;
  success: boolean;
}

interface ProfileLite {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
  challenge_title: z.string().trim().max(80).optional(),
  challenge_days: z.coerce.number().int().min(1).max(365).optional(),
});

function GroupsPage() {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [challengeTitle, setChallengeTitle] = useState("");
  const [days, setDays] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!user) return;
    void loadGroup();
  }, [user]);

  const loadGroup = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: memberRow } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!memberRow) {
        setGroup(null);
        setLoading(false);
        return;
      }

      const { data: g } = await supabase
        .from("groups")
        .select("*")
        .eq("id", memberRow.group_id)
        .maybeSingle();
      if (!g) {
        setGroup(null);
        setLoading(false);
        return;
      }
      setGroup(g as Group);

      const { data: rows } = await supabase
        .from("group_members")
        .select("user_id, joined_at")
        .eq("group_id", g.id);
      const mems = (rows ?? []) as MemberRow[];
      setMembers(mems);

      if (mems.length > 0) {
        const ids = mems.map((m) => m.user_id);
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", ids);
        const map: Record<string, ProfileLite> = {};
        (profs ?? []).forEach((p) => {
          map[p.id] = p as ProfileLite;
        });
        setProfiles(map);
      }

      const { data: ci } = await supabase
        .from("group_check_ins")
        .select("user_id, date, success")
        .eq("group_id", g.id)
        .order("date", { ascending: false })
        .limit(200);
      setCheckIns((ci ?? []) as CheckIn[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load group");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const parsed = createSchema.parse({
        name,
        challenge_title: challengeTitle || undefined,
        challenge_days: days || undefined,
      });
      const { error } = await supabase.from("groups").insert({
        owner_id: user.id,
        name: parsed.name,
        challenge_title: parsed.challenge_title ?? null,
        challenge_days: parsed.challenge_days ?? null,
      });
      if (error) throw error;
      toast.success(t("createGroup"));
      setShowCreate(false);
      setName("");
      setChallengeTitle("");
      setDays("");
      await loadGroup();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = () => {
    if (!group) return;
    const url = `${window.location.origin}/groups/join/${group.invite_slug}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t("linkCopied"));
    setTimeout(() => setCopied(false), 1800);
  };

  const checkInToday = async () => {
    if (!user || !group) return;
    const myToday = checkIns.find((c) => c.user_id === user.id && c.date === today);
    if (myToday) return;
    try {
      const { error } = await supabase
        .from("group_check_ins")
        .insert({ group_id: group.id, user_id: user.id, success: true });
      if (error) throw error;
      toast.success("✓");
      await loadGroup();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const leaveGroup = async () => {
    if (!user || !group) return;
    if (!confirm(t("leaveGroup") + "?")) return;
    try {
      // owner deletes group; member deletes membership
      if (group.owner_id === user.id) {
        const { error } = await supabase.from("groups").delete().eq("id", group.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("group_members")
          .delete()
          .eq("group_id", group.id)
          .eq("user_id", user.id);
        if (error) throw error;
      }
      setGroup(null);
      setMembers([]);
      setCheckIns([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const streakFor = (uid: string) => {
    const userCheckIns = checkIns
      .filter((c) => c.user_id === uid && c.success)
      .map((c) => c.date)
      .sort((a, b) => b.localeCompare(a));
    let streak = 0;
    const cursor = new Date();
    for (;;) {
      const iso = cursor.toISOString().slice(0, 10);
      if (userCheckIns.includes(iso)) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const daysLeft = (() => {
    if (!group?.challenge_days) return null;
    const start = new Date(group.start_date);
    const end = new Date(start);
    end.setDate(end.getDate() + group.challenge_days);
    const diff = Math.ceil((end.getTime() - Date.now()) / 86400000);
    return Math.max(0, diff);
  })();

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-5 pt-8">
        <div className="font-display text-3xl font-bold text-ink">{t("groups")}</div>
        <div className="mt-8 text-center text-sm text-muted-foreground">{t("loading")}</div>
      </div>
    );
  }

  // No group view
  if (!group) {
    return (
      <div className="mx-auto max-w-md px-5 pt-8">
        <h1 className="font-display text-3xl font-bold text-ink">{t("groups")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("groupLimitFree")}</p>

        {!showCreate ? (
          <div className="bf-bounce-in mt-8 rounded-[16px] border border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-primary">
              <Users className="h-8 w-8" />
            </div>
            <div className="mt-4 font-display text-xl font-bold text-ink">{t("noGroupYet")}</div>
            <p className="mt-2 text-sm text-muted-foreground">{t("noGroupDesc")}</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="btn-cta mt-6 inline-flex items-center gap-2 rounded-[10px] bg-primary px-6 py-3 text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> {t("createGroup")}
            </button>
          </div>
        ) : (
          <div className="bf-bounce-in mt-6 space-y-3 rounded-[16px] border border-border bg-card p-5">
            <input
              type="text"
              placeholder={t("groupName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              className="w-full rounded-[10px] border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder={t("challengeTitle")}
              value={challengeTitle}
              onChange={(e) => setChallengeTitle(e.target.value)}
              maxLength={80}
              className="w-full rounded-[10px] border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary"
            />
            <input
              type="number"
              placeholder={t("challengeDays")}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              min={1}
              max={365}
              className="w-full rounded-[10px] border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-[10px] border border-border py-3 text-sm font-medium text-ink"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={submitting || !name.trim()}
                className="btn-cta flex-1 rounded-[10px] bg-primary py-3 text-primary-foreground disabled:opacity-50"
              >
                {submitting ? "…" : t("createGroup")}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const myCheckedIn = checkIns.some((c) => c.user_id === user?.id && c.date === today);

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold text-ink truncate">{group.name}</h1>
          {group.challenge_title && (
            <p className="mt-1 text-sm text-muted-foreground truncate">{group.challenge_title}</p>
          )}
        </div>
        <button
          type="button"
          onClick={leaveGroup}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-primary"
          aria-label={t("leaveGroup")}
        >
          <LeaveIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Challenge progress */}
      {group.challenge_days && daysLeft !== null && (
        <div className="bf-bounce-in mt-5 rounded-[16px] border border-border bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
            <Trophy className="h-4 w-4" />
            <span>{t("challengeTitle")}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-5xl font-bold">{daysLeft}</span>
            <span className="text-sm opacity-90">{t("daysLeft")}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{
                width: `${Math.min(100, ((group.challenge_days - daysLeft) / group.challenge_days) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Today check-in */}
      <button
        type="button"
        onClick={checkInToday}
        disabled={myCheckedIn}
        className={cn(
          "mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] border-2 py-4 text-sm font-semibold transition-all",
          myCheckedIn
            ? "border-primary bg-brand-soft text-primary"
            : "border-dashed border-border bg-card text-ink hover:border-primary hover:bg-brand-soft hover:text-primary",
        )}
      >
        {myCheckedIn ? <Check className="h-5 w-5" /> : <Flame className="h-5 w-5" />}
        {myCheckedIn ? t("checkedIn") : t("checkIn")}
      </button>

      {/* Invite link */}
      <button
        type="button"
        onClick={copyLink}
        className="mt-3 flex w-full items-center justify-between gap-2 rounded-[12px] border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-secondary"
      >
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("inviteFriends")}
          </div>
          <div className="truncate text-xs text-ink">/groups/join/{group.invite_slug}</div>
        </div>
        {copied ? (
          <Check className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Members */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("members")}
          </span>
          <span className="text-xs text-muted-foreground">{members.length}</span>
        </div>
        <div className="space-y-2">
          {members.map((m) => {
            const p = profiles[m.user_id];
            const streak = streakFor(m.user_id);
            const checkedToday = checkIns.some((c) => c.user_id === m.user_id && c.date === today);
            return (
              <div
                key={m.user_id}
                className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-3"
              >
                <div className="h-10 w-10 overflow-hidden rounded-full bg-brand-soft">
                  {p?.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-sm font-bold text-primary">
                      {p?.full_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {p?.full_name || "—"}
                    {m.user_id === group.owner_id && (
                      <span className="ml-1.5 text-[10px] uppercase text-primary">★</span>
                    )}
                  </div>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Flame className="h-3 w-3 text-primary" />
                      {t("streakDays").replace("{n}", String(streak))}
                    </div>
                  )}
                </div>
                {checkedToday && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
