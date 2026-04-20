import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useT } from '../lib/i18n';
import { CalorieRing } from '../components/CalorieRing';
import { MacroBars } from '../components/MacroBars';
import { WaterTracker } from '../components/WaterTracker';
import { Colors, FontSizes, Radii, Spacing } from '../lib/theme';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
interface Meal { id: string; food_name: string; meal_type: MealType; calories: number; protein_g: number; carbs_g: number; fats_g: number; }
interface DailyLog { id: string; water_ml: number; steps: number; calories_goal: number; }

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICONS: Record<MealType, string> = { breakfast: '☕', lunch: '🍽', dinner: '🥘', snack: '🍎' };

export function DashboardScreen() {
  const t = useT();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [log, setLog] = useState<DailyLog | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [profileName, setProfileName] = useState('');
  const [goalKind, setGoalKind] = useState<string | null>(null);
  const [burned, setBurned] = useState(0);
  const [stepsInput, setStepsInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [stepsModalOpen, setStepsModalOpen] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user) return;
    const [{ data: existing }, { data: m }, { data: p }] = await Promise.all([
      supabase.from('daily_logs').select('id, water_ml, steps, calories_goal').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('meals').select('id, food_name, meal_type, calories, protein_g, carbs_g, fats_g').eq('user_id', user.id).eq('date', today).order('created_at', { ascending: false }),
      supabase.from('profiles').select('full_name, goal').eq('id', user.id).maybeSingle(),
    ]);

    let current = existing;
    if (!current) {
      const { data: created } = await supabase.from('daily_logs').insert({ user_id: user.id, date: today }).select('id, water_ml, steps, calories_goal').single();
      current = created ?? null;
    }

    // Load activities for burned calories
    const { data: acts } = await supabase.from('activities').select('calories_burned').eq('user_id', user.id).eq('date', today);
    const totalBurned = (acts ?? []).reduce((s: number, a: any) => s + Number(a.calories_burned), 0);

    setLog(current);
    setMeals((m as Meal[]) ?? []);
    setProfileName(p?.full_name ?? '');
    setGoalKind(p?.goal ?? null);
    setBurned(totalBurned);
  }, [user, today]);

  useEffect(() => { loadAll().catch((e) => Toast.show({ type: 'error', text1: e.message })); }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const updateWater = async (next: number) => {
    if (!log || !user) return;
    setLog({ ...log, water_ml: next });
    await supabase.from('daily_logs').update({ water_ml: next }).eq('id', log.id);
  };

  const updateSteps = async () => {
    if (!log || !user) return;
    const n = parseInt(stepsInput, 10);
    if (isNaN(n) || n < 0) return;
    setLog({ ...log, steps: n });
    setStepsInput('');
    setStepsModalOpen(false);
    await supabase.from('daily_logs').update({ steps: n }).eq('id', log.id);
  };

  const removeMeal = async (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    await supabase.from('meals').delete().eq('id', id);
  };

  const totals = meals.reduce((acc, m) => ({
    cal: acc.cal + Number(m.calories),
    p: acc.p + Number(m.protein_g),
    c: acc.c + Number(m.carbs_g),
    f: acc.f + Number(m.fats_g),
  }), { cal: 0, p: 0, c: 0, f: 0 });

  const grouped = useMemo(() => {
    const g: Record<MealType, Meal[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
    for (const m of meals) g[m.meal_type].push(m);
    return g;
  }, [meals]);

  const goal = log?.calories_goal ?? 2000;
  const remaining = Math.max(goal - totals.cal + burned, 0);
  const stepsGoal = 10000;
  const stepsPct = Math.min(((log?.steps ?? 0) / stepsGoal) * 100, 100);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>{t('today').toUpperCase()}</Text>
            <Text style={styles.headerTitle}>{t('welcome')}, {profileName.split(' ')[0] || '👋'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.avatar}>
            <Text style={styles.avatarText}>{profileName?.[0]?.toUpperCase() ?? 'B'}</Text>
          </TouchableOpacity>
        </View>

        {/* Calorie ring card */}
        <View style={styles.card}>
          <View style={styles.ringWrapper}>
            <CalorieRing eaten={totals.cal} goal={goal} burned={burned} size={200} />
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: Colors.warningSoft }]}>
              <Text style={[styles.statLabel, { color: Colors.warning }]}>{t('eaten').toUpperCase()}</Text>
              <Text style={styles.statValue}>{Math.round(totals.cal)}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: Colors.successSoft }]}>
              <Text style={[styles.statLabel, { color: Colors.success }]}>{t('burned').toUpperCase()}</Text>
              <Text style={styles.statValue}>{Math.round(burned)}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: Colors.secondary }]}>
              <Text style={[styles.statLabel, { color: Colors.muted }]}>{t('goal').toUpperCase()}</Text>
              <Text style={styles.statValue}>{goal}</Text>
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            <MacroBars protein={totals.p} carbs={totals.c} fats={totals.f} />
          </View>
        </View>

        {/* Meals section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('meals')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Scanner')} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ {t('addMeal')}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick-add row */}
          <View style={styles.quickRow}>
            {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => navigation.navigate('Scanner', { preselect: type })}
                style={styles.quickCard}
                activeOpacity={0.8}
              >
                <Text style={styles.quickIcon}>{MEAL_ICONS[type]}</Text>
                <Text style={styles.quickLabel}>{t(type).toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => navigation.navigate('Scanner', { preselect: 'snack' })}
              style={styles.quickCardPlus}
              activeOpacity={0.8}
            >
              <Text style={styles.quickIcon}>+</Text>
              <Text style={styles.quickLabel}>{t('snack').toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          {meals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t('noMealsToday')}</Text>
            </View>
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {MEAL_ORDER.map((type) => {
                const list = grouped[type];
                if (list.length === 0) return null;
                const sectionCal = list.reduce((s, m) => s + Number(m.calories), 0);
                return (
                  <View key={type} style={styles.mealGroup}>
                    <View style={styles.mealGroupHeader}>
                      <View style={styles.mealGroupLeft}>
                        <Text style={styles.mealGroupIcon}>{MEAL_ICONS[type]}</Text>
                        <Text style={styles.mealGroupTitle}>{t(type)}</Text>
                      </View>
                      <Text style={styles.mealGroupCal}>{Math.round(sectionCal)} {t('calories')}</Text>
                    </View>
                    {list.map((m) => (
                      <View key={m.id} style={styles.mealRow}>
                        <View style={styles.mealAvatar}>
                          <Text style={{ fontSize: 18 }}>🍽</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mealName} numberOfLines={1}>{m.food_name}</Text>
                          <Text style={styles.mealMacros}>
                            {Math.round(Number(m.calories))} {t('calories')} · P{Math.round(Number(m.protein_g))} C{Math.round(Number(m.carbs_g))} F{Math.round(Number(m.fats_g))}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => removeMeal(m.id)} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Text style={{ fontSize: 16, color: Colors.muted }}>🗑</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Water + Steps row */}
        <View style={styles.trackerRow}>
          {log && <WaterTracker ml={log.water_ml} onChange={updateWater} />}
          <TouchableOpacity style={styles.stepsCard} onPress={() => setStepsModalOpen(true)} activeOpacity={0.9}>
            <View style={styles.stepsHeader}>
              <View style={styles.stepsIconBox}>
                <Text style={{ fontSize: 14 }}>👣</Text>
              </View>
              <Text style={styles.sectionLabel}>{t('steps').toUpperCase()}</Text>
              <Text style={styles.pct}>{Math.round(stepsPct)}%</Text>
            </View>
            <Text style={styles.stepsValue}>
              {(log?.steps ?? 0).toLocaleString()}
              <Text style={styles.stepsGoal}> / {stepsGoal.toLocaleString()}</Text>
            </Text>
            <View style={styles.stepsTrack}>
              <View style={[styles.stepsFill, { width: `${stepsPct}%` as any }]} />
            </View>
            <Text style={[styles.tapHint]}>Tap to log</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Steps modal */}
      <Modal visible={stepsModalOpen} transparent animationType="slide" onRequestClose={() => setStepsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('steps')}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0"
              placeholderTextColor={Colors.muted}
              value={stepsInput}
              onChangeText={setStepsInput}
              keyboardType="number-pad"
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity onPress={() => setStepsModalOpen(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={updateSteps} style={styles.modalSaveBtn}>
                <Text style={styles.modalSaveText}>{t('save')}</Text>
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
  scroll: { paddingHorizontal: Spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.lg, marginBottom: Spacing.lg },
  headerSub: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.muted, letterSpacing: 1 },
  headerTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.ink, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.brandSoft, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.primary },
  card: { backgroundColor: Colors.card, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, marginBottom: Spacing.lg },
  ringWrapper: { alignItems: 'center', marginBottom: Spacing.lg },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, borderRadius: Radii.md, padding: 10, alignItems: 'center' },
  statLabel: { fontSize: FontSizes.xs, fontWeight: '700', letterSpacing: 1 },
  statValue: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.ink, marginTop: 2 },
  section: { marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.ink },
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radii.md },
  addBtnText: { color: '#fff', fontSize: FontSizes.xs, fontWeight: '700' },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  quickCard: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: Colors.card, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, paddingVertical: 10 },
  quickCardPlus: { flex: 1, alignItems: 'center', gap: 4, borderRadius: Radii.md, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.primary + '80', backgroundColor: Colors.brandSoft, paddingVertical: 10 },
  quickIcon: { fontSize: 18 },
  quickLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, color: Colors.ink },
  emptyCard: { backgroundColor: Colors.card, borderRadius: Radii.md, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.border, padding: Spacing.xxl, alignItems: 'center' },
  emptyText: { fontSize: FontSizes.sm, color: Colors.muted },
  mealGroup: { backgroundColor: Colors.card, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: 4 },
  mealGroupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  mealGroupLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mealGroupIcon: { fontSize: 14 },
  mealGroupTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.ink },
  mealGroupCal: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.primary },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  mealAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  mealName: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.ink },
  mealMacros: { fontSize: FontSizes.xs, color: Colors.muted, marginTop: 1 },
  deleteBtn: { padding: 4 },
  trackerRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  stepsCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  stepsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  stepsIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { flex: 1, fontSize: FontSizes.xs, fontWeight: '700', letterSpacing: 1, color: Colors.muted },
  pct: { fontSize: FontSizes.xs, color: Colors.muted },
  stepsValue: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.ink, marginTop: 4 },
  stepsGoal: { fontSize: FontSizes.xs, fontWeight: '400', color: Colors.muted },
  stepsTrack: { height: 6, backgroundColor: Colors.secondary, borderRadius: Radii.full, overflow: 'hidden', marginTop: 6 },
  stepsFill: { height: '100%', backgroundColor: Colors.success, borderRadius: Radii.full },
  tapHint: { fontSize: FontSizes.xs, color: Colors.muted, marginTop: 6, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: '#00000060', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xxl, paddingBottom: 40 },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.ink, marginBottom: Spacing.lg },
  modalInput: { backgroundColor: Colors.secondary, borderRadius: Radii.md, paddingHorizontal: Spacing.xl, paddingVertical: 16, fontSize: 24, fontWeight: '700', color: Colors.ink, textAlign: 'center' },
  modalCancelBtn: { flex: 1, backgroundColor: Colors.secondary, borderRadius: Radii.md, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { fontSize: FontSizes.base, fontWeight: '600', color: Colors.ink },
  modalSaveBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radii.md, paddingVertical: 14, alignItems: 'center' },
  modalSaveText: { fontSize: FontSizes.base, fontWeight: '700', color: '#fff' },
});
