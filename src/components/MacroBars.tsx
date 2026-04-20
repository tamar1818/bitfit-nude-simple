import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useT } from '../lib/i18n';
import { Colors, FontSizes, Radii } from '../lib/theme';

interface MacroBarsProps {
  protein: number;
  carbs: number;
  fats: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatsGoal?: number;
}

function Bar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = Math.min((value / Math.max(goal, 1)) * 100, 100);
  return (
    <View style={styles.barContainer}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{Math.round(value)}g</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function MacroBars({
  protein,
  carbs,
  fats,
  proteinGoal = 120,
  carbsGoal = 250,
  fatsGoal = 70,
}: MacroBarsProps) {
  const t = useT();
  return (
    <View style={styles.row}>
      <Bar label={t('protein')} value={protein} goal={proteinGoal} color="#8B7CF6" />
      <Bar label={t('carbs')} value={carbs} goal={carbsGoal} color="#F59E0B" />
      <Bar label={t('fats')} value={fats} goal={fatsGoal} color="#22C55E" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  barContainer: {
    flex: 1,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.muted,
  },
  barValue: {
    fontSize: FontSizes.xs,
    color: Colors.muted,
  },
  track: {
    height: 6,
    backgroundColor: Colors.nude,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radii.full,
  },
});
