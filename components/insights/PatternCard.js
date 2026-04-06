import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows, borderRadius, spacing } from '../../theme/colors';

const PatternCard = ({ title, color, icon, patterns }) => {
  if (!patterns) return null;

  const { body_sensations = [], thoughts = [], situations = [] } = patterns;
  const hasData = body_sensations.length > 0 || thoughts.length > 0 || situations.length > 0;

  if (!hasData) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderLeftColor: color }]}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {body_sensations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Body sensations</Text>
          <View style={styles.chipRow}>
            {body_sensations.slice(0, 6).map((item, i) => (
              <View key={i} style={[styles.chip, { backgroundColor: color + '15' }]}>
                <Text style={[styles.chipText, { color }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {thoughts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Thoughts</Text>
          <View style={styles.chipRow}>
            {thoughts.slice(0, 6).map((item, i) => (
              <View key={i} style={[styles.chip, { backgroundColor: color + '15' }]}>
                <Text style={[styles.chipText, { color }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {situations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Situations</Text>
          <View style={styles.chipRow}>
            {situations.slice(0, 6).map((item, i) => (
              <View key={i} style={[styles.chip, { backgroundColor: color + '15' }]}>
                <Text style={[styles.chipText, { color }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
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
  header: {
    borderLeftWidth: 4,
    paddingLeft: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    marginTop: spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default PatternCard;
