import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Modal, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useT, useI18n } from '../lib/i18n';
import { Colors, FontSizes, Radii, Spacing } from '../lib/theme';

interface Food {
  id: string;
  name_ka: string;
  name_en: string;
  brand: string | null;
  calories_per_100g: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  serving_size_g: number | null;
}
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export function ScannerScreen() {
  const t = useT();
  const { lang } = useI18n();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const preselectMeal = route.params?.preselect as MealType | undefined;

  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);
  const [mealType, setMealType] = useState<MealType>(preselectMeal ?? 'snack');
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const search = async () => {
      setLoading(true);
      const q = query.trim();
      const builder = supabase.from('foods_ge').select('*').order('name_ka').limit(40);
      const { data } = q
        ? await builder.or(`name_ka.ilike.%${q}%,name_en.ilike.%${q}%,brand.ilike.%${q}%`)
        : await builder;
      setFoods((data as Food[]) ?? []);
      setLoading(false);
    };
    const id = setTimeout(search, 300);
    return () => clearTimeout(id);
  }, [query]);

  const computed = useMemo(() => {
    if (!selected) return null;
    const factor = grams / 100;
    return {
      calories: Number(selected.calories_per_100g) * factor,
      protein_g: Number(selected.protein_g) * factor,
      carbs_g: Number(selected.carbs_g) * factor,
      fats_g: Number(selected.fats_g) * factor,
    };
  }, [selected, grams]);

  const addMeal = async () => {
    if (!user || !selected || !computed) return;
    const { error } = await supabase.from('meals').insert({
      user_id: user.id,
      food_id: selected.id,
      date: format(new Date(), 'yyyy-MM-dd'),
      food_name: lang === 'ka' ? selected.name_ka : selected.name_en,
      meal_type: mealType,
      servings: grams / 100,
      calories: computed.calories,
      protein_g: computed.protein_g,
      carbs_g: computed.carbs_g,
      fats_g: computed.fats_g,
    });
    if (error) { Toast.show({ type: 'error', text1: error.message }); return; }
    Toast.show({ type: 'success', text1: 'Added!' });
    navigation.goBack();
  };

  const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  const MEAL_ICONS: Record<MealType, string> = { breakfast: '☕', lunch: '🍽', dinner: '🥘', snack: '🍎' };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('addMeal')}</Text>
        <TouchableOpacity onPress={() => setAiModalOpen(true)} style={styles.aiBtn}>
          <Text style={{ fontSize: 18 }}>✨</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchFood')}
          placeholderTextColor={Colors.muted}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 16, color: Colors.muted }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={foods}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.sm, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{loading ? t('loading') : 'No matches'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => { setSelected(item); setGrams(Number(item.serving_size_g) || 100); }}
            style={styles.foodCard}
            activeOpacity={0.8}
          >
            <View style={styles.foodAvatar}><Text style={{ fontSize: 20 }}>🍽</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.foodName}>{lang === 'ka' ? item.name_ka : item.name_en}</Text>
              <Text style={styles.foodSub}>
                {item.brand ? `${item.brand} · ` : ''}{Math.round(Number(item.calories_per_100g))} kcal/100g
              </Text>
            </View>
            <Text style={{ fontSize: 18, color: Colors.muted }}>+</Text>
          </TouchableOpacity>
        )}
      />

      {/* Selected food sheet */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle} numberOfLines={2}>
                  {selected && (lang === 'ka' ? selected.name_ka : selected.name_en)}
                </Text>
                {selected?.brand && <Text style={styles.sheetBrand}>{selected.brand}</Text>}
              </View>
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
                <Text style={{ fontSize: 16, color: Colors.muted }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Grams</Text>
            <TextInput
              style={styles.gramsInput}
              value={String(grams)}
              onChangeText={(v) => setGrams(Math.max(0, Number(v)))}
              keyboardType="number-pad"
            />

            <View style={styles.mealPills}>
              {MEAL_TYPES.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMealType(m)}
                  style={[styles.mealPill, mealType === m && styles.mealPillSelected]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.mealPillIcon}>{MEAL_ICONS[m]}</Text>
                  <Text style={[styles.mealPillText, mealType === m && styles.mealPillTextSelected]}>
                    {t(m)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {computed && (
              <View style={styles.macroRow}>
                {[
                  { label: 'kcal', value: Math.round(computed.calories) },
                  { label: 'P', value: Math.round(computed.protein_g) },
                  { label: 'C', value: Math.round(computed.carbs_g) },
                  { label: 'F', value: Math.round(computed.fats_g) },
                ].map((s) => (
                  <View key={s.label} style={styles.macroStat}>
                    <Text style={styles.macroValue}>{s.value}</Text>
                    <Text style={styles.macroLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity onPress={addMeal} style={styles.addBtn} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>{t('add')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI scanner modal */}
      <Modal visible={aiModalOpen} transparent animationType="slide" onRequestClose={() => setAiModalOpen(false)}>
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheet, { alignItems: 'center' }]}>
            <Text style={{ fontSize: 48 }}>✨</Text>
            <Text style={styles.aiTitle}>{t('aiScannerSoon')}</Text>
            <Text style={styles.aiDesc}>{t('aiScannerDesc')}</Text>
            <TouchableOpacity onPress={() => setAiModalOpen(false)} style={[styles.addBtn, { marginTop: 24 }]} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 18, color: Colors.ink },
  title: { flex: 1, fontSize: FontSizes.xl, fontWeight: '800', color: Colors.ink },
  aiBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.infoSoft, alignItems: 'center', justifyContent: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.xl, backgroundColor: Colors.card, borderRadius: Radii.full, paddingHorizontal: Spacing.xl, paddingVertical: 14, gap: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: FontSizes.base, color: Colors.ink },
  emptyCard: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyText: { fontSize: FontSizes.sm, color: Colors.muted },
  foodCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: Radii.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  foodAvatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  foodName: { fontSize: FontSizes.base, fontWeight: '600', color: Colors.ink },
  foodSub: { fontSize: FontSizes.xs, color: Colors.muted, marginTop: 2 },
  sheetOverlay: { flex: 1, backgroundColor: '#00000060', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xxl, paddingBottom: 44 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: Spacing.lg },
  sheetTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.ink },
  sheetBrand: { fontSize: FontSizes.xs, color: Colors.muted, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  inputLabel: { fontSize: FontSizes.xs, textTransform: 'uppercase', letterSpacing: 1, color: Colors.muted, marginBottom: 6 },
  gramsInput: { backgroundColor: Colors.secondary, borderRadius: Radii.md, paddingHorizontal: Spacing.lg, paddingVertical: 14, fontSize: FontSizes.base, color: Colors.ink, marginBottom: Spacing.lg },
  mealPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.lg },
  mealPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radii.full, backgroundColor: Colors.secondary },
  mealPillSelected: { backgroundColor: Colors.ink },
  mealPillIcon: { fontSize: 12 },
  mealPillText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.ink },
  mealPillTextSelected: { color: '#fff' },
  macroRow: { flexDirection: 'row', backgroundColor: Colors.secondary, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.lg },
  macroStat: { flex: 1, alignItems: 'center' },
  macroValue: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.ink },
  macroLabel: { fontSize: FontSizes.xs, textTransform: 'uppercase', letterSpacing: 1, color: Colors.muted, marginTop: 2 },
  addBtn: { backgroundColor: Colors.primary, borderRadius: Radii.full, paddingVertical: 16, alignItems: 'center', width: '100%' },
  addBtnText: { color: '#fff', fontSize: FontSizes.base, fontWeight: '700' },
  aiTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.ink, marginTop: Spacing.lg, textAlign: 'center' },
  aiDesc: { fontSize: FontSizes.sm, color: Colors.muted, marginTop: 6, textAlign: 'center', lineHeight: 20 },
});
