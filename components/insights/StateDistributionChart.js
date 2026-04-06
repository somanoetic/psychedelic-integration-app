import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { colors, shadows, borderRadius, spacing } from '../../theme/colors';

const STATE_COLORS = {
  ventral: '#10b981',
  sympathetic: '#ef4444',
  dorsal: '#6b7280',
  mixed: '#f59e0b',
};

const STATE_LABELS = {
  ventral: 'Safe & Social',
  sympathetic: 'Fight/Flight',
  dorsal: 'Shutdown',
  mixed: 'Mixed',
};

const SIZE = 180;
const STROKE_WIDTH = 28;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;

const StateDistributionChart = ({ distribution }) => {
  if (!distribution) return null;

  const segments = ['ventral', 'sympathetic', 'dorsal', 'mixed']
    .filter(key => distribution[key] > 0)
    .map(key => ({
      key,
      value: distribution[key],
      color: STATE_COLORS[key],
      label: STATE_LABELS[key],
      count: distribution.counts[key],
    }));

  // Build stroke-dasharray offsets for each arc segment
  let cumulativeOffset = 0;
  const arcs = segments.map(seg => {
    const dashLength = seg.value * CIRCUMFERENCE;
    const gap = CIRCUMFERENCE - dashLength;
    const offset = -cumulativeOffset;
    cumulativeOffset += dashLength;
    return { ...seg, dashLength, gap, offset };
  });

  return (
    <View style={styles.container}>
      <View style={styles.chartRow}>
        <Svg width={SIZE} height={SIZE}>
          {/* Background circle */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={colors.lightGray}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Data arcs */}
          {arcs.map(arc => (
            <Circle
              key={arc.key}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke={arc.color}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${arc.dashLength} ${arc.gap}`}
              strokeDashoffset={arc.offset}
              strokeLinecap="butt"
              rotation={-90}
              origin={`${CENTER}, ${CENTER}`}
            />
          ))}
          {/* Center text */}
          <SvgText
            x={CENTER}
            y={CENTER - 8}
            textAnchor="middle"
            fontSize={24}
            fontWeight="bold"
            fill={colors.text}
          >
            {distribution.total}
          </SvgText>
          <SvgText
            x={CENTER}
            y={CENTER + 12}
            textAnchor="middle"
            fontSize={11}
            fill={colors.textSecondary}
          >
            check-ins
          </SvgText>
        </Svg>

        <View style={styles.legend}>
          {segments.map(seg => (
            <View key={seg.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
              <View style={styles.legendTextCol}>
                <Text style={styles.legendLabel}>{seg.label}</Text>
                <Text style={styles.legendValue}>
                  {Math.round(seg.value * 100)}% ({seg.count})
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.soft,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  legend: {
    flex: 1,
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendTextCol: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  legendValue: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default StateDistributionChart;
