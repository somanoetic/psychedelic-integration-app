import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';
import { colors, shadows, borderRadius, spacing } from '../../theme/colors';

const STATE_COLORS = {
  ventral: '#10b981',
  sympathetic: '#ef4444',
  dorsal: '#6b7280',
  mixed: '#f59e0b',
};

const STATES = ['ventral', 'sympathetic', 'dorsal', 'mixed'];
const BAR_WIDTH = 36;
const BAR_GAP = 12;
const CHART_HEIGHT = 160;
const LABEL_HEIGHT = 24;

const TimelineChart = ({ timeline }) => {
  if (!timeline || timeline.length === 0) return null;

  const maxTotal = Math.max(...timeline.map(t => STATES.reduce((sum, s) => sum + t[s], 0)), 1);
  const chartWidth = Math.max(timeline.length * (BAR_WIDTH + BAR_GAP), 200);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <Svg width={chartWidth + 20} height={CHART_HEIGHT + LABEL_HEIGHT + 10}>
            {/* Horizontal grid lines */}
            {[0.25, 0.5, 0.75, 1].map(frac => (
              <Line
                key={frac}
                x1={0}
                y1={CHART_HEIGHT * (1 - frac)}
                x2={chartWidth}
                y2={CHART_HEIGHT * (1 - frac)}
                stroke={colors.lightGray}
                strokeWidth={0.5}
              />
            ))}

            {/* Stacked bars */}
            {timeline.map((bucket, i) => {
              const x = i * (BAR_WIDTH + BAR_GAP) + BAR_GAP / 2;
              let yOffset = 0;

              return (
                <G key={bucket.date}>
                  {STATES.map(state => {
                    const val = bucket[state];
                    if (val === 0) return null;
                    const barH = (val / maxTotal) * CHART_HEIGHT;
                    const y = CHART_HEIGHT - yOffset - barH;
                    yOffset += barH;
                    return (
                      <Rect
                        key={state}
                        x={x}
                        y={y}
                        width={BAR_WIDTH}
                        height={barH}
                        rx={3}
                        fill={STATE_COLORS[state]}
                      />
                    );
                  })}
                  {/* Date label */}
                  <SvgText
                    x={x + BAR_WIDTH / 2}
                    y={CHART_HEIGHT + LABEL_HEIGHT - 4}
                    textAnchor="middle"
                    fontSize={10}
                    fill={colors.textSecondary}
                  >
                    {formatDate(bucket.date)}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.soft,
  },
});

export default TimelineChart;
