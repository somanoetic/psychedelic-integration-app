import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CloudOff, CheckCircle2 } from 'lucide-react-native';
import { colors, gradients, spacing, borderRadius, shadows } from '../../theme/colors';

/**
 * ChecklistHeader - Progress display for checklist
 *
 * Shows completion count, progress bar, and sync status.
 */
const ChecklistHeader = ({ checklist, syncing, offline }) => {
  if (!checklist) return null;

  const { completedItems, totalItems, completionPercentage } = checklist;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.warm}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Progress text */}
          <View style={styles.textRow}>
            <Text style={styles.title}>Preparation Progress</Text>
            {syncing && (
              <View style={styles.syncIndicator}>
                <ActivityIndicator size="small" color={colors.textInverse} />
                <Text style={styles.syncText}>Syncing...</Text>
              </View>
            )}
            {offline && !syncing && (
              <View style={styles.offlineIndicator}>
                <CloudOff size={16} color={colors.textInverse} strokeWidth={2} />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
          </View>

          {/* Count */}
          <Text style={styles.count}>
            {completedItems} of {totalItems} items complete
          </Text>

          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${completionPercentage}%` }
                ]}
              />
            </View>
            <Text style={styles.percentage}>{completionPercentage}%</Text>
          </View>

          {/* Completion badge */}
          {checklist.isComplete && (
            <View style={styles.completeBadge}>
              <CheckCircle2 size={20} color={colors.success} strokeWidth={2} />
              <Text style={styles.completeText}>Checklist Complete!</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  gradient: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  content: {
    padding: spacing.lg,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  syncText: {
    fontSize: 12,
    color: colors.textInverse,
    opacity: 0.9,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  offlineText: {
    fontSize: 12,
    color: colors.textInverse,
    fontWeight: '600',
  },
  count: {
    fontSize: 16,
    color: colors.textInverse,
    opacity: 0.95,
    marginBottom: spacing.md,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
  },
  percentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textInverse,
    minWidth: 45,
    textAlign: 'right',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  completeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.success,
  },
});

export default ChecklistHeader;
