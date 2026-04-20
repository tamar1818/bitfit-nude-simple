import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useT } from '../lib/i18n';
import { Colors, FontSizes, Radii, Spacing } from '../lib/theme';

type Goal = 'lose' | 'gain' | 'maintain';
type Gender = 'male' | 'female' | 'other';
type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'extra';

const ACTIVITY_MULT: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  extra: 1.9,
};
const GOAL_DELTA: Record<Goal, number> = { lose: -500, maintain: 0, gain: 400 };

function calcCalories(a: { age: number; weightKg: number; heightCm: number; gender: Gender; activity: Activity; goal: Goal }) {
  const base = 10 * a.weightKg + 6.25 * a.heightCm - 5 * a.age;
  const bmr = a.gender === 'male' ? base + 5 : base - 161;
  const tdee = bmr * ACTIVITY_MULT[a.activity];
  return Math.round(tdee + GOAL_DELTA[a.goal]);
}

export function OnboardingScreen() {
  const t = useT();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [target, setTarget] = useState('');
  const [invite, setInvite] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = 5;

  const canNext = () => {
    if (step === 0) return !!goal;
    if (step === 1) return age.length > 0 && !!gender;
    if (step === 2) return height.length > 0 && weight.length > 0 && target.length > 0;
    if (step === 3) return !!activity;
    return true;
  };

  const handleFinish = async () => {
    if (!user || !goal || !gender || !activity) return;
    setSubmitting(true);
    const calories_goal = calcCalories({
      age: parseInt(age),
      weightKg: parseFloat(weight),
      heightCm: parseFloat(height),
      gender,
      activity,
      goal,
    });

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        goal,
        age: parseInt(age),
        gender,
        activity_level: activity,
        height_cm: parseFloat(height),
        onboarded: true,
      });
      if (error) throw error;

      await supabase.from('daily_logs').upsert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        calories_goal,
      });

      await supabase.from('weights').insert({
        user_id: user.id,
        weight_kg: parseFloat(weight),
        target_weight_kg: parseFloat(target),
      });

      if (invite.trim()) {
        await supabase.from('coach_invites').update({ used_by_user_id: user.id, used_at: new Date().toISOString() }).eq('code', invite.trim().toUpperCase());
      }

      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const GOALS: { key: Goal; icon: string; label: string }[] = [
    { key: 'lose', icon: '📉', label: t('loseWeight') },
    { key: 'gain', icon: '📈', label: t('gainWeight') },
    { key: 'maintain', icon: '⚖️', label: t('maintainWeight') },
  ];

  const GENDERS: { key: Gender; label: string }[] = [
    { key: 'male', label: t('male') },
    { key: 'female', label: t('female') },
    { key: 'other', label: t('other') },
  ];

  const ACTIVITIES: { key: Activity; label: string; desc: string }[] = [
    { key: 'sedentary', label: t('sedentary'), desc: t('sedentaryDesc') },
    { key: 'light', label: t('lightlyActive'), desc: t('lightlyActiveDesc') },
    { key: 'moderate', label: t('moderatelyActive'), desc: t('moderatelyActiveDesc') },
    { key: 'active', label: t('veryActive'), desc: t('veryActiveDesc') },
    { key: 'extra', label: t('extraActive'), desc: t('extraActiveDesc') },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / totalSteps) * 100}%` as any }]} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.stepLabel}>{t('stepOf')} {step + 1} / {totalSteps}</Text>

          {/* Step 0: Goal */}
          {step === 0 && (
            <View>
              <Text style={styles.title}>{t('yourGoal')}</Text>
              <View style={styles.optionList}>
                {GOALS.map((g) => (
                  <TouchableOpacity
                    key={g.key}
                    onPress={() => setGoal(g.key)}
                    style={[styles.optionCard, goal === g.key && styles.optionCardSelected]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.optionIcon}>{g.icon}</Text>
                    <Text style={[styles.optionLabel, goal === g.key && styles.optionLabelSelected]}>
                      {g.label}
                    </Text>
                    {goal === g.key && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 1: Age + Gender */}
          {step === 1 && (
            <View>
              <Text style={styles.title}>{t('aboutYou')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('age')}
                placeholderTextColor={Colors.muted}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
              />
              <Text style={styles.subTitle}>{t('gender')}</Text>
              <View style={styles.pillRow}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g.key}
                    onPress={() => setGender(g.key)}
                    style={[styles.pill, gender === g.key && styles.pillSelected]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillText, gender === g.key && styles.pillTextSelected]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 2: Body metrics */}
          {step === 2 && (
            <View>
              <Text style={styles.title}>{t('bodyMetrics')}</Text>
              <TextInput style={styles.input} placeholder={t('height')} placeholderTextColor={Colors.muted} value={height} onChangeText={setHeight} keyboardType="decimal-pad" />
              <TextInput style={styles.input} placeholder={t('currentWeight')} placeholderTextColor={Colors.muted} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
              <TextInput style={styles.input} placeholder={t('targetWeight')} placeholderTextColor={Colors.muted} value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
            </View>
          )}

          {/* Step 3: Activity */}
          {step === 3 && (
            <View>
              <Text style={styles.title}>{t('activityLevel')}</Text>
              <View style={styles.optionList}>
                {ACTIVITIES.map((a) => (
                  <TouchableOpacity
                    key={a.key}
                    onPress={() => setActivity(a.key)}
                    style={[styles.activityCard, activity === a.key && styles.optionCardSelected]}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionLabel, activity === a.key && styles.optionLabelSelected]}>
                        {a.label}
                      </Text>
                      <Text style={styles.activityDesc}>{a.desc}</Text>
                    </View>
                    {activity === a.key && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 4: Coach invite */}
          {step === 4 && (
            <View>
              <Text style={styles.title}>{t('coachInvite')}</Text>
              <Text style={styles.activityDesc}>{t('coachInviteDesc')}</Text>
              <TextInput
                style={[styles.input, { marginTop: Spacing.lg }]}
                placeholder={t('inviteCode')}
                placeholderTextColor={Colors.muted}
                value={invite}
                onChangeText={setInvite}
                autoCapitalize="characters"
              />
            </View>
          )}
        </ScrollView>

        {/* Navigation buttons */}
        <View style={styles.navRow}>
          {step > 0 ? (
            <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← {t('back')}</Text>
            </TouchableOpacity>
          ) : <View style={{ flex: 1 }} />}

          {step < totalSteps - 1 ? (
            <TouchableOpacity
              onPress={() => canNext() && setStep(step + 1)}
              style={[styles.nextBtn, !canNext() && styles.disabledBtn]}
              disabled={!canNext()}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>{t('next')} →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleFinish}
              style={[styles.nextBtn, submitting && styles.disabledBtn]}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>{submitting ? t('loading') : t('finish')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  progressBar: { height: 4, backgroundColor: Colors.border },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  scroll: { padding: Spacing.xl, paddingBottom: 20 },
  stepLabel: { fontSize: FontSizes.xs, color: Colors.muted, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: FontSizes.xxl, fontWeight: '800', color: Colors.ink, marginTop: Spacing.md, marginBottom: Spacing.xl, letterSpacing: -0.5 },
  subTitle: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  input: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md, paddingHorizontal: Spacing.xl, paddingVertical: 16, fontSize: FontSizes.base, color: Colors.ink, marginBottom: Spacing.md },
  optionList: { gap: Spacing.sm },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: Radii.lg, borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.lg },
  activityCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: Radii.lg, borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.lg },
  optionCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.brandSoft },
  optionIcon: { fontSize: 24 },
  optionLabel: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.ink },
  optionLabelSelected: { color: Colors.primary },
  activityDesc: { fontSize: FontSizes.sm, color: Colors.muted, marginTop: 2 },
  checkmark: { fontSize: 16, color: Colors.primary, fontWeight: '700', marginLeft: 'auto' },
  pillRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  pill: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Radii.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card },
  pillSelected: { borderColor: Colors.primary, backgroundColor: Colors.brandSoft },
  pillText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.ink },
  pillTextSelected: { color: Colors.primary },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, gap: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  backBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  backBtnText: { fontSize: FontSizes.base, fontWeight: '600', color: Colors.ink },
  nextBtn: { flex: 2, paddingVertical: 16, alignItems: 'center', borderRadius: Radii.md, backgroundColor: Colors.primary },
  nextBtnText: { fontSize: FontSizes.base, fontWeight: '700', color: '#fff' },
  disabledBtn: { opacity: 0.4 },
});
