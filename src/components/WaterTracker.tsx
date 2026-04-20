import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useT } from '../lib/i18n';
import { Colors, FontSizes, Radii, Spacing } from '../lib/theme';

interface WaterTrackerProps {
  ml: number;
  goalMl?: number;
  onChange: (next: number) => void;
}

const STEP = 250;

export function WaterTracker({ ml, goalMl = 2500, onChange }: WaterTrackerProps) {
  const t = useT();
  const glasses = Math.floor(ml / STEP);
  const goalGlasses = Math.ceil(goalMl / STEP);
  const pct = Math.min((ml / goalMl) * 100, 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconRow}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>💧</Text>
          </View>
          <Text style={styles.sectionLabel}>{t('water').toUpperCase()}</Text>
        </View>
        <Text style={styles.pct}>{Math.round(pct)}%</Text>
      </View>

      <Text style={styles.amount}>
        {ml}
        <Text style={styles.amountUnit}> / {goalMl}ml</Text>
      </Text>

      <View style={styles.dots}>
        {Array.from({ length: goalGlasses }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i < glasses ? Colors.info : Colors.secondary },
            ]}
          />
        ))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(0, ml - STEP))}
          style={styles.btnMinus}
          activeOpacity={0.7}
        >
          <Text style={styles.btnIcon}>−</Text>
        </TouchableOpacity>
        <Text style={styles.glassLabel}>
          {glasses} {t('glass')}
        </Text>
        <TouchableOpacity
          onPress={() => onChange(ml + STEP)}
          style={styles.btnPlus}
          activeOpacity={0.7}
        >
          <Text style={[styles.btnIcon, { color: '#fff' }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 14 },
  sectionLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.muted,
  },
  pct: { fontSize: FontSizes.xs, color: Colors.muted },
  amount: {
    marginTop: 6,
    fontSize: FontSizes.base,
    fontWeight: '800',
    color: Colors.ink,
  },
  amountUnit: {
    fontSize: FontSizes.xs,
    fontWeight: '400',
    color: Colors.muted,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 6,
  },
  dot: {
    flex: 1,
    height: 6,
    borderRadius: Radii.full,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  btnMinus: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPlus: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.info,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.ink,
    lineHeight: 22,
  },
  glassLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.ink,
  },
});
