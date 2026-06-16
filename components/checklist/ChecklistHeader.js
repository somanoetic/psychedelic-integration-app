import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { CloudOff, CheckCircle2 } from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme/colors';

/**
 * ChecklistHeader - Progress display for checklist
 *
 * Shows completion count, progress bar, and sync status. Rendered as a clean
 * white card to match the Sessions hub aesthetic (no gradient).
 */
const ChecklistHeader = ({ checklist, syncing, offline }) => {
  if (!checklist) return null;

  const { completedItems, totalItems, completionPercentage } = checklist;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.content}>
          {/* Progress text */}
          <View style={styles.textRow}>
            <Text style={styles.title}>Preparation Progress</Text>
            {syncing && (
              <View style={styles.syncIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.syncText}>Syncing...</Text>
              </View>
            )}
            {offline && !syncing && (
              <View style={styles.offlineIndicator}>
                <CloudOff size={16} color={colors.textSecondary} strokeWidth={2} />
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.soft,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  syncText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  offlineText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  count: {
    fontSize: 15,
    color: colors.textSecondary,
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
    backgroundColor: colors.backgroundAlt,
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
    color: colors.text,
    minWidth: 45,
    textAlign: 'right',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.backgroundAlt,
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
