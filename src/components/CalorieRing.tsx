import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useT } from '../lib/i18n';
import { Colors, FontSizes } from '../lib/theme';

interface CalorieRingProps {
  eaten: number;
  goal: number;
  burned?: number;
  size?: number;
}

export function CalorieRing({ eaten, goal, burned = 0, size = 200 }: CalorieRingProps) {
  const t = useT();
  const remaining = Math.max(goal - eaten + burned, 0);
  const ratio = eaten / Math.max(goal, 1);
  const pct = Math.min(ratio, 1);
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  const status = ratio >= 0.95 ? 'over' : ratio >= 0.7 ? 'near' : 'ok';
  const ringColor =
    status === 'ok'
      ? Colors.success
      : status === 'near'
        ? Colors.warning
        : Colors.primary;
  const numberColor =
    status === 'ok'
      ? Colors.success
      : status === 'near'
        ? Colors.warning
        : Colors.primary;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={Colors.nude}
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeDashoffset={0}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.label}>{t('remaining')}</Text>
        <Text style={[styles.number, { color: numberColor }]}>{Math.round(remaining)}</Text>
        <Text style={styles.unit}>{t('calories')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.muted,
  },
  number: {
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 52,
  },
  unit: {
    fontSize: FontSizes.xs,
    color: Colors.muted,
  },
});
