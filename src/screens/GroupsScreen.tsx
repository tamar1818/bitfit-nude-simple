import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, TextInput, Modal, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useT } from '../lib/i18n';
import { Colors, FontSizes, Radii, Spacing } from '../lib/theme';

interface Group {
  id: string;
  name: string;
  challenge_title: string | null;
  challenge_days: number | null;
  start_date: string;
  invite_slug: string;
  owner_id: string;
}
interface MemberRow { user_id: string; joined_at: string; }
interface CheckIn { user_id: string; date: string; success: boolean; }
interface ProfileLite { id: string; full_name: string | null; }

export function GroupsScreen() {
  const t = useT();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [todayDone, setTodayDone] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDays, setChallengeDays] = useState('30');
  const [creating, setCreating] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const load = async () => {
    if (!user) return;
    const { data: membership } = await supabase.from('group_members').select('group_id').eq('user_id', user.id).maybeSingle();
    if (!membership) { setGroup(null); return; }
    const { data: g } = await supabase.from('groups').select('*').eq('id', membership.group_id).maybeSingle();
    setGroup(g as Group ?? null);
    if (!g) return;
    const [{ data: m }, { data: ci }] = await Promise.all([
      supabase.from('group_members').select('user_id, joined_at').eq('group_id', g.id),
      supabase.from('group_checkins').select('user_id, date, success').eq('group_id', g.id),
    ]);
    setMembers((m as MemberRow[]) ?? []);
    setCheckIns((ci as CheckIn[]) ?? []);
    setTodayDone(!!(ci as CheckIn[])?.find((c) => c.user_id === user.id && c.date === today));
    const ids = ((m as MemberRow[]) ?? []).map((x) => x.user_id);
    if (ids.length > 0) {
      const { data: p } = await supabase.from('profiles').select('id, full_name').in('id', ids);
      setProfiles((p as ProfileLite[]) ?? []);
    }
  };

  useEffect(() => { load(); }, [user]);

  const createGroup = async () => {
    if (!user || !groupName.trim()) return;
    setCreating(true);
    try {
      const slug = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: g, error } = await supabase.from('groups').insert({
        name: groupName.trim(),
        challenge_title: challengeTitle.trim() || null,
        challenge_days: parseInt(challengeDays) || 30,
        owner_id: user.id,
        invite_slug: slug,
        start_date: today,
      }).select().single();
      if (error) throw error;
      await supabase.from('group_members').insert({ group_id: g.id, user_id: user.id });
      setCreateOpen(false);
      setGroupName(''); setChallengeTitle(''); setChallengeDays('30');
      load();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message });
    } finally {
      setCreating(false);
    }
  };

  const checkIn = async () => {
    if (!user || !group) return;
    const { error } = await supabase.from('group_checkins').insert({ group_id: group.id, user_id: user.id, date: today, success: true });
    if (error) { Toast.show({ type: 'error', text1: error.message }); return; }
    setTodayDone(true);
    Toast.show({ type: 'success', text1: '✓ Checked in!' });
  };

  const shareInvite = async () => {
    if (!group) return;
    await Share.share({ message: `Join my BitFit group! Use invite code: ${group.invite_slug}` });
  };

  const leaveGroup = () => {
    Alert.alert(t('leaveGroup'), 'Are you sure?', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('leaveGroup'), style: 'destructive', onPress: async () => {
          if (!user || !group) return;
          await supabase.from('group_members').delete().eq('group_id', group.id).eq('user_id', user.id);
          setGroup(null); setMembers([]); setCheckIns([]);
        }
      },
    ]);
  };

  const getMemberStreak = (uid: string) => {
    const userCIs = checkIns.filter((c) => c.user_id === uid && c.success).map((c) => c.date).sort().reverse();
    let streak = 0;
    let cursor = today;
    for (const date of userCIs) {
      if (date === cursor) { streak++; cursor = format(new Date(new Date(cursor).getTime() - 86400000), 'yyyy-MM-dd'); }
      else break;
    }
    return streak;
  };

  const getName = (uid: string) => profiles.find((p) => p.id === uid)?.full_name ?? uid.slice(0, 8);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{t('groups')}</Text>

        {!group ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>{t('noGroupYet')}</Text>
            <Text style={styles.emptyDesc}>{t('noGroupDesc')}</Text>
            <TouchableOpacity onPress={() => setCreateOpen(true)} style={styles.createBtn} activeOpacity={0.8}>
              <Text style={styles.createBtnText}>+ {t('createGroup')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* Group card */}
            <View style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupName}>{group.name}</Text>
                <TouchableOpacity onPress={shareInvite} style={styles.shareBtn} activeOpacity={0.8}>
                  <Text style={styles.shareBtnText}>🔗 {t('copyInviteLink')}</Text>
                </TouchableOpacity>
              </View>
              {group.challenge_title && (
                <View style={styles.challengeTag}>
                  <Text style={styles.challengeText}>🏆 {group.challenge_title}</Text>
                  {group.challenge_days && <Text style={styles.challengeDays}>{group.challenge_days} {t('days')}</Text>}
                </View>
              )}
              <View style={styles.inviteRow}>
                <Text style={styles.inviteLabel}>Invite code</Text>
                <Text style={styles.inviteCode}>{group.invite_slug}</Text>
              </View>
            </View>

            {/* Today's check-in */}
            <View style={styles.checkInCard}>
              <Text style={styles.sectionTitle}>{t('todayCheckIn')}</Text>
              {todayDone ? (
                <View style={styles.checkedInBadge}>
                  <Text style={styles.checkedInText}>✓ {t('checkedIn')}</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={checkIn} style={styles.checkInBtn} activeOpacity={0.8}>
                  <Text style={styles.checkInBtnText}>{t('checkIn')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Members */}
            <Text style={[styles.sectionTitle, { marginTop: Spacing.lg, marginBottom: 8 }]}>
              {t('members')} ({members.length})
            </Text>
            <View style={{ gap: 8 }}>
              {members.map((m) => {
                const streak = getMemberStreak(m.user_id);
                const checked = checkIns.some((c) => c.user_id === m.user_id && c.date === today);
                return (
                  <View key={m.user_id} style={styles.memberRow}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>{getName(m.user_id)[0]?.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.memberName}>{getName(m.user_id)}</Text>
                    {checked && <View style={styles.checkedDot}><Text style={{ fontSize: 10, color: Colors.success }}>✓</Text></View>}
                    {streak > 0 && (
                      <View style={styles.streakBadge}>
                        <Text style={styles.streakText}>🔥 {streak}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            <TouchableOpacity onPress={leaveGroup} style={styles.leaveBtn} activeOpacity={0.8}>
              <Text style={styles.leaveBtnText}>{t('leaveGroup')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create group modal */}
      <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('createGroup')}</Text>
            <TextInput style={styles.input} placeholder={t('groupName')} placeholderTextColor={Colors.muted} value={groupName} onChangeText={setGroupName} />
            <TextInput style={styles.input} placeholder={t('challengeTitle')} placeholderTextColor={Colors.muted} value={challengeTitle} onChangeText={setChallengeTitle} />
            <TextInput style={styles.input} placeholder={t('challengeDays')} placeholderTextColor={Colors.muted} value={challengeDays} onChangeText={setChallengeDays} keyboardType="number-pad" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity onPress={() => setCreateOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={createGroup} style={[styles.saveBtn, creating && { opacity: 0.5 }]} disabled={creating} activeOpacity={0.8}>
                <Text style={styles.saveText}>{creating ? t('loading') : t('createGroup')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl },
  pageTitle: { fontSize: FontSizes.xxl, fontWeight: '800', color: Colors.ink, marginBottom: Spacing.xl },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.ink, marginBottom: 8 },
  emptyDesc: { fontSize: FontSizes.sm, color: Colors.muted, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xxl },
  createBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: Radii.full },
  createBtnText: { color: '#fff', fontSize: FontSizes.base, fontWeight: '700' },
  groupCard: { backgroundColor: Colors.card, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, marginBottom: Spacing.md },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  groupName: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.ink, flex: 1 },
  shareBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radii.md },
  shareBtnText: { fontSize: FontSizes.xs, fontWeight: '600', color: Colors.ink },
  challengeTag: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.brandSoft, borderRadius: Radii.md, padding: 10, marginBottom: Spacing.md },
  challengeText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.primary },
  challengeDays: { fontSize: FontSizes.xs, color: Colors.muted },
  inviteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inviteLabel: { fontSize: FontSizes.xs, color: Colors.muted, fontWeight: '600' },
  inviteCode: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.ink, letterSpacing: 2 },
  checkInCard: { backgroundColor: Colors.card, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.ink },
  checkedInBadge: { backgroundColor: Colors.successSoft, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radii.full },
  checkedInText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.success },
  checkInBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radii.full },
  checkInBtnText: { fontSize: FontSizes.sm, fontWeight: '700', color: '#fff' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.card, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { fontSize: FontSizes.sm, fontWeight: '800', color: Colors.primary },
  memberName: { flex: 1, fontSize: FontSizes.sm, fontWeight: '600', color: Colors.ink },
  checkedDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  streakBadge: { backgroundColor: Colors.warningSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full },
  streakText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.warning },
  leaveBtn: { marginTop: Spacing.xxl, borderWidth: 1, borderColor: Colors.destructive + '40', borderRadius: Radii.md, paddingVertical: 14, alignItems: 'center' },
  leaveBtnText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.destructive },
  modalOverlay: { flex: 1, backgroundColor: '#00000060', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xxl, paddingBottom: 44, gap: 10 },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.ink, marginBottom: 8 },
  input: { backgroundColor: Colors.secondary, borderRadius: Radii.md, paddingHorizontal: Spacing.lg, paddingVertical: 14, fontSize: FontSizes.base, color: Colors.ink },
  cancelBtn: { flex: 1, backgroundColor: Colors.secondary, borderRadius: Radii.md, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: FontSizes.base, fontWeight: '600', color: Colors.ink },
  saveBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radii.md, paddingVertical: 14, alignItems: 'center' },
  saveText: { fontSize: FontSizes.base, fontWeight: '700', color: '#fff' },
});
