import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, TextInput, Modal, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { format, startOfWeek, addDays } from 'date-fns';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useT, useI18n } from '../lib/i18n';
import { Colors, FontSizes, Radii, Spacing } from '../lib/theme';

interface Weight { id: string; weight_kg: number; target_weight_kg: number | null; recorded_at: string; }
interface Point { id: string; points: number; reason: string; }

const W = Dimensions.get('window').width - 64;

function WeightChart({ data }: { data: { date: string; weight: number }[] }) {
  if (data.length < 2) return (
    <View style={{ height: 140, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: FontSizes.sm, color: Colors.muted }}>Log more entries to see trend</Text>
    </View>
  );

  const H = 140;
  const pad = { top: 10, bottom: 24, left: 28, right: 10 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const weights = data.map((d) => d.weight);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;

  const toX = (i: number) => pad.left + (i / (data.length - 1)) * chartW;
  const toY = (w: number) => pad.top + chartH - ((w - minW) / (maxW - minW)) * chartH;

  const points = data.map((d, i) => `${toX(i)},${toY(d.weight)}`).join(' ');

  return (
    <Svg width={W} height={H}>
      <Polyline points={points} fill="none" stroke={Colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <Circle key={i} cx={toX(i)} cy={toY(d.weight)} r={4} fill={Colors.primary} />
      ))}
      {data.filter((_, i) => i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)).map((d, _, arr) => (
        <SvgText key={d.date} x={toX(data.indexOf(d))} y={H - 4} fontSize={9} fill={Colors.muted} textAnchor="middle">
          {format(new Date(d.recorded_at ?? d.date), 'MMM d')}
        </SvgText>
      ))}
    </Svg>
  );
}

export function ProgressScreen() {
  const t = useT();
  const { lang } = useI18n();
  const { user } = useAuth();
  const [weights, setWeights] = useState<Weight[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState('');
  const [goalKind, setGoalKind] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: w }, { data: pts }, { data: p }] = await Promise.all([
      supabase.from('weights').select('id, weight_kg, target_weight_kg, recorded_at').eq('user_id', user.id).order('recorded_at', { ascending: true }).limit(60),
      supabase.from('weight_points').select('id, points, reason').eq('user_id', user.id).order('awarded_at', { ascending: false }).limit(20),
      supabase.from('profiles').select('goal').eq('id', user.id).maybeSingle(),
    ]);
    setWeights((w as Weight[]) ?? []);
    setPoints((pts as Point[]) ?? []);
    setGoalKind(p?.goal ?? null);
  };

  useEffect(() => { load(); }, [user]);

  const latest = weights[weights.length - 1];
  const first = weights[0];
  const target = [...weights].reverse().find((w) => w.target_weight_kg)?.target_weight_kg ?? null;
  const totalPoints = points.reduce((s, p) => s + p.points, 0);

  // Streak calculation
  const streak = (() => {
    if (weights.length === 0) return 0;
    const weeks = new Set<string>();
    for (const w of weights) {
      const wk = startOfWeek(new Date(w.recorded_at), { weekStartsOn: 1 });
      weeks.add(format(wk, 'yyyy-MM-dd'));
    }
    let s = 0;
    let cursor = startOfWeek(new Date(), { weekStartsOn: 1 });
    while (weeks.has(format(cursor, 'yyyy-MM-dd'))) {
      s++;
      cursor = addDays(cursor, -7);
    }
    return s;
  })();

  const progressPct = (() => {
    if (!first || !latest || !target) return 0;
    const startW = Number(first.weight_kg);
    const cur = Number(latest.weight_kg);
    const tgt = Number(target);
    const total = Math.abs(startW - tgt);
    if (total < 0.1) return 100;
    return Math.min(100, Math.max(0, Math.round((Math.abs(startW - cur) / total) * 100)));
  })();

  const awardPoints = async (newWeight: number, prev: number | null) => {
    if (!user || prev == null || !goalKind) return;
    let earned = 5;
    let reason = lang === 'ka' ? 'კვირის ჩაწერა' : 'Weekly check-in';
    const delta = newWeight - prev;
    if ((goalKind === 'lose' && delta < 0) || (goalKind === 'gain' && delta > 0) || (goalKind === 'maintain' && Math.abs(delta) < 0.5)) {
      const bonus = goalKind === 'maintain' ? 10 : Math.min(50, Math.round(Math.abs(delta) * 10));
      earned += bonus;
      reason = lang === 'ka' ? 'მიზნის მიმართულებით' : 'Toward goal!';
    }
    await supabase.from('weight_points').insert({ user_id: user.id, points: earned, reason });
    Toast.show({ type: 'success', text1: t('pointsEarned').replace('{n}', String(earned)) });
  };

  const submitWeight = async () => {
    if (!user || !value) return;
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) return;
    const prev = latest?.weight_kg != null ? Number(latest.weight_kg) : null;
    const { error } = await supabase.from('weights').insert({ user_id: user.id, weight_kg: v, target_weight_kg: target });
    if (error) { Toast.show({ type: 'error', text1: error.message }); return; }
    setValue('');
    setAdding(false);
    await awardPoints(v, prev);
    load();
  };

  const chartData = weights.map((w) => ({
    date: w.recorded_at,
    weight: Number(w.weight_kg),
    recorded_at: w.recorded_at,
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{t('progress')}</Text>

        {/* Points + Streak */}
        <View style={styles.heroRow}>
          <View style={[styles.heroCard, { backgroundColor: Colors.brandSoft }]}>
            <Text style={styles.heroIcon}>🏆</Text>
            <Text style={styles.heroLabel}>{t('yourPoints').toUpperCase()}</Text>
            <Text style={styles.heroValue}>{totalPoints}</Text>
            <Text style={styles.heroSub}>{t('keepGoing')}</Text>
          </View>
          <View style={styles.heroCard}>
            <Text style={styles.heroIcon}>🔥</Text>
            <Text style={styles.heroLabel}>{t('streak').toUpperCase()}</Text>
            <Text style={styles.heroValue}>{streak} <Text style={styles.heroUnit}>{t('days')}</Text></Text>
            <Text style={styles.heroSub}>{t('weeklyTracker')}</Text>
          </View>
        </View>

        {/* Weight card */}
        <View style={styles.card}>
          <View style={styles.weightHeader}>
            <View>
              <Text style={styles.weightLabel}>{lang === 'ka' ? 'ამჟამინდელი' : 'Current'}</Text>
              <Text style={styles.weightValue}>
                {latest ? Number(latest.weight_kg).toFixed(1) : '—'}
                <Text style={styles.weightUnit}> kg</Text>
              </Text>
            </View>
            {target && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.weightLabel}>🎯 {lang === 'ka' ? 'მიზანი' : 'Target'}</Text>
                <Text style={[styles.weightValue, { color: Colors.primary, fontSize: 24 }]}>
                  {Number(target).toFixed(1)} <Text style={styles.weightUnit}>kg</Text>
                </Text>
              </View>
            )}
          </View>

          {target && first && (
            <View style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.progressLabel}>{progressPct}% {t('toGoal')}</Text>
                <Text style={styles.progressLabel}>{Number(first.weight_kg).toFixed(1)} → {Number(target).toFixed(1)}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
              </View>
            </View>
          )}

          <View style={{ marginTop: Spacing.lg }}>
            <WeightChart data={chartData} />
          </View>
        </View>

        {/* Add weight button */}
        <TouchableOpacity onPress={() => setAdding(true)} style={styles.addBtn} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ {t('addWeight')}</Text>
        </TouchableOpacity>

        {/* Weight history */}
        <Text style={styles.sectionTitle}>{t('weightHistory')}</Text>
        <View style={{ gap: 8, marginTop: 8 }}>
          {[...weights].reverse().map((w, i, arr) => {
            const prev = arr[i + 1];
            const delta = prev ? Number(w.weight_kg) - Number(prev.weight_kg) : 0;
            return (
              <View key={w.id} style={styles.histRow}>
                <Text style={styles.histDate}>{format(new Date(w.recorded_at), 'PP')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {prev && (
                    <View style={[styles.deltaBadge, { backgroundColor: delta < 0 ? '#DCFCE7' : delta > 0 ? Colors.brandSoft : Colors.secondary }]}>
                      <Text style={[styles.deltaText, { color: delta < 0 ? Colors.success : delta > 0 ? Colors.primary : Colors.muted }]}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.histWeight}>{Number(w.weight_kg).toFixed(1)} kg</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add weight modal */}
      <Modal visible={adding} transparent animationType="slide" onRequestClose={() => setAdding(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('addWeight')}</Text>
            <Text style={styles.modalSub}>{lang === 'ka' ? 'კვირეული ჩანაწერი = +5 ქულა' : 'Weekly check-in = +5 points'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="kg"
              placeholderTextColor={Colors.muted}
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.lg }}>
              <TouchableOpacity onPress={() => setAdding(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitWeight} style={styles.saveBtn}>
                <Text style={styles.saveText}>{t('save')}</Text>
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
  pageTitle: { fontSize: FontSizes.xxl, fontWeight: '800', color: Colors.ink, marginBottom: Spacing.lg },
  heroRow: { flexDirection: 'row', gap: 12, marginBottom: Spacing.lg },
  heroCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg },
  heroIcon: { fontSize: 20, marginBottom: 4 },
  heroLabel: { fontSize: FontSizes.xs, fontWeight: '700', letterSpacing: 1, color: Colors.muted },
  heroValue: { fontSize: 32, fontWeight: '800', color: Colors.ink, marginTop: 4 },
  heroUnit: { fontSize: FontSizes.sm, fontWeight: '400', color: Colors.muted },
  heroSub: { fontSize: FontSizes.xs, color: Colors.muted, marginTop: 4, lineHeight: 16 },
  card: { backgroundColor: Colors.card, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, marginBottom: Spacing.lg },
  weightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  weightLabel: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.muted, letterSpacing: 1, textTransform: 'uppercase' },
  weightValue: { fontSize: 40, fontWeight: '800', color: Colors.ink, marginTop: 2 },
  weightUnit: { fontSize: FontSizes.base, fontWeight: '400', color: Colors.muted },
  progressLabel: { fontSize: FontSizes.xs, color: Colors.muted },
  progressTrack: { height: 8, backgroundColor: Colors.secondary, borderRadius: Radii.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Radii.full },
  addBtn: { backgroundColor: Colors.primary, borderRadius: Radii.md, paddingVertical: 16, alignItems: 'center', marginBottom: Spacing.xl },
  addBtnText: { color: '#fff', fontSize: FontSizes.base, fontWeight: '700' },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.ink },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg },
  histDate: { fontSize: FontSizes.sm, color: Colors.muted },
  histWeight: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.ink },
  deltaBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full },
  deltaText: { fontSize: FontSizes.xs, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: '#00000060', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xxl, paddingBottom: 44 },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.ink },
  modalSub: { fontSize: FontSizes.xs, color: Colors.muted, marginTop: 4, marginBottom: Spacing.lg },
  modalInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md, paddingHorizontal: Spacing.xl, paddingVertical: 16, fontSize: 28, fontWeight: '700', color: Colors.ink, textAlign: 'center' },
  cancelBtn: { flex: 1, backgroundColor: Colors.secondary, borderRadius: Radii.md, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: FontSizes.base, fontWeight: '600', color: Colors.ink },
  saveBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radii.md, paddingVertical: 14, alignItems: 'center' },
  saveText: { fontSize: FontSizes.base, fontWeight: '700', color: '#fff' },
});
