import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Zap, Sparkles, Flame, ChevronRight, Heart, Brain } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import insightsDataService from '../lib/insightsDataService';
import StateDistributionChart from '../components/insights/StateDistributionChart';
import TimelineChart from '../components/insights/TimelineChart';
import PatternCard from '../components/insights/PatternCard';
import { colors, shadows, borderRadius, spacing } from '../theme/colors';

const STATE_COLORS = {
  ventral: colors.success,
  sympathetic: colors.error,
  dorsal: colors.textSecondary,
  mixed: colors.warning,
};

const PART_COLORS = {
  protector: colors.primary,
  firefighter: colors.error,
  exile: '#8b5cf6',
  self: colors.success,
};

const PART_LABELS = {
  protector: 'Protector',
  firefighter: 'Firefighter',
  exile: 'Exile',
  self: 'Self Energy',
};

const DATE_RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: 365 * 5 },
];

const InsightsScreen = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState(1); // default 30d
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const loadData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const days = DATE_RANGES[selectedRange].days;
      const summary = await insightsDataService.getInsightsSummary(user.id, days);

      setData({
        ...summary,
        stateDistribution: insightsDataService.getStateDistribution(summary.nsCheckins),
        stateTimeline: insightsDataService.getStateTimeline(summary.nsCheckins, days <= 14 ? 'day' : 'week'),
        partsActivity: insightsDataService.getPartsActivity(summary.partsCheckins),
        triggerGlimmerBalance: insightsDataService.getTriggerGlimmerBalance(summary.triggerLogs, summary.glimmerLogs),
        topTriggers: insightsDataService.getTopTriggers(summary.triggerLogs),
        topGlimmers: insightsDataService.getTopGlimmers(summary.glimmerLogs),
        habitStreaks: insightsDataService.getHabitStreaks(summary.habits, summary.habitCompletions),
      });
    } catch (e) {
      console.error('InsightsScreen: load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRange]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData(false);
  };

  const hasAnyData = data && (
    data.nsCheckins.length > 0 ||
    data.partsCheckins.length > 0 ||
    data.triggerLogs.length > 0 ||
    data.glimmerLogs.length > 0 ||
    data.habitStreaks.length > 0
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <Text style={styles.screenTitle}>My Patterns</Text>
        <Text style={styles.screenSubtitle}>See what your check-ins reveal over time</Text>

        {/* Date range selector */}
        <View style={styles.rangeRow}>
          {DATE_RANGES.map((range, i) => (
            <TouchableOpacity
              key={range.label}
              style={[styles.rangeChip, i === selectedRange && styles.rangeChipActive]}
              onPress={() => setSelectedRange(i)}
            >
              <Text style={[styles.rangeChipText, i === selectedRange && styles.rangeChipTextActive]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!hasAnyData ? (
          <EmptyState navigation={navigation} />
        ) : (
          <>
            {/* Section A: Nervous System States */}
            {data.nsCheckins.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nervous System States</Text>

                {data.stateDistribution && (
                  <StateDistributionChart distribution={data.stateDistribution} />
                )}

                {data.stateTimeline.length > 1 && (
                  <View style={styles.sectionGap}>
                    <Text style={styles.subLabel}>Over time</Text>
                    <TimelineChart timeline={data.stateTimeline} />
                  </View>
                )}

                {/* Pattern cards from accumulated polyvagal_patterns */}
                {data.polyvagalPatterns && (
                  <View style={styles.sectionGap}>
                    <Text style={styles.subLabel}>Your patterns</Text>
                    <View style={styles.patternCards}>
                      <PatternCard
                        title="When you feel safe & social"
                        color={STATE_COLORS.ventral}
                        patterns={data.polyvagalPatterns.ventral_patterns}
                      />
                      <PatternCard
                        title="When you're activated"
                        color={STATE_COLORS.sympathetic}
                        patterns={data.polyvagalPatterns.sympathetic_patterns}
                      />
                      <PatternCard
                        title="When you shut down"
                        color={STATE_COLORS.dorsal}
                        patterns={data.polyvagalPatterns.dorsal_patterns}
                      />
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Section B: Parts Activity */}
            {data.partsCheckins.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Parts Activity</Text>

                {/* Horizontal bar chart */}
                <View style={styles.card}>
                  {data.partsActivity.map(part => {
                    const maxCount = data.partsActivity[0]?.count || 1;
                    const widthPct = (part.count / maxCount) * 100;
                    const partColor = PART_COLORS[part.type] || colors.primary;
                    return (
                      <View key={part.type} style={styles.barRow}>
                        <Text style={styles.barLabel}>{PART_LABELS[part.type] || part.type}</Text>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${widthPct}%`, backgroundColor: partColor }]} />
                        </View>
                        <Text style={styles.barCount}>{part.count}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Highlight card */}
                {data.partsActivity.length > 0 && (
                  <View style={[styles.highlightCard, { borderLeftColor: PART_COLORS[data.partsActivity[0].type] || colors.primary }]}>
                    <Text style={styles.highlightLabel}>Most active part</Text>
                    <Text style={styles.highlightValue}>
                      {PART_LABELS[data.partsActivity[0].type] || data.partsActivity[0].type}
                    </Text>
                    <Text style={styles.highlightMeta}>
                      {data.partsActivity[0].count} check-ins, avg intensity {data.partsActivity[0].avgIntensity}/5
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Section C: Triggers & Glimmers */}
            {(data.triggerLogs.length > 0 || data.glimmerLogs.length > 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Triggers & Glimmers</Text>

                {/* Side-by-side count cards */}
                <View style={styles.twoCol}>
                  <View style={[styles.countCard, { borderTopColor: colors.error }]}>
                    <Zap size={24} color={colors.error} strokeWidth={2} />
                    <Text style={styles.countValue}>{data.triggerGlimmerBalance.triggers}</Text>
                    <Text style={styles.countLabel}>Triggers</Text>
                  </View>
                  <View style={[styles.countCard, { borderTopColor: colors.success }]}>
                    <Sparkles size={24} color={colors.success} strokeWidth={2} />
                    <Text style={styles.countValue}>{data.triggerGlimmerBalance.glimmers}</Text>
                    <Text style={styles.countLabel}>Glimmers</Text>
                  </View>
                </View>

                {/* Top triggers/glimmers lists */}
                {data.topTriggers.length > 0 && (
                  <View style={styles.listCard}>
                    <Text style={styles.listTitle}>Top trigger types</Text>
                    {data.topTriggers.map(t => (
                      <View key={t.type} style={styles.listItem}>
                        <View style={[styles.listDot, { backgroundColor: colors.error }]} />
                        <Text style={styles.listItemText}>{t.type}</Text>
                        <Text style={styles.listItemCount}>{t.count}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {data.topGlimmers.length > 0 && (
                  <View style={styles.listCard}>
                    <Text style={styles.listTitle}>Top glimmer types</Text>
                    {data.topGlimmers.map(g => (
                      <View key={g.type} style={styles.listItem}>
                        <View style={[styles.listDot, { backgroundColor: colors.success }]} />
                        <Text style={styles.listItemText}>{g.type}</Text>
                        <Text style={styles.listItemCount}>{g.count}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Section D: Habits */}
            {data.habitStreaks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Habits</Text>

                {data.habitStreaks.map(habit => (
                  <View key={habit.id} style={styles.habitCard}>
                    <View style={styles.habitHeader}>
                      <Text style={styles.habitName}>{habit.name}</Text>
                      {habit.currentStreak > 0 && (
                        <View style={styles.streakBadge}>
                          <Flame size={14} color={colors.warning} strokeWidth={2} />
                          <Text style={styles.streakText}>{habit.currentStreak}d</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.habitMeta}>
                      <Text style={styles.habitMetaText}>
                        {Math.round(habit.completionRate * 100)}% completion
                      </Text>
                      <Text style={styles.habitMetaText}>
                        {habit.totalDays} total days
                      </Text>
                    </View>
                    {/* Completion bar */}
                    <View style={styles.completionTrack}>
                      <View
                        style={[styles.completionFill, { width: `${Math.round(habit.completionRate * 100)}%` }]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const EMPTY_LINK_ICON_MAP = {
  favorite: Heart,
  psychology: Brain,
  'flash-on': Zap,
  'auto-awesome': Sparkles,
};

const EmptyState = ({ navigation }) => (
  <View style={styles.emptyContainer}>
    <Sparkles size={64} color={colors.lightGray} strokeWidth={1.5} />
    <Text style={styles.emptyTitle}>No patterns yet</Text>
    <Text style={styles.emptySubtitle}>
      Start checking in to see your patterns emerge over time.
    </Text>

    <View style={styles.emptyLinks}>
      <EmptyLink
        icon="favorite"
        label="Nervous System Check-in"
        onPress={() => navigation.navigate('NervousSystemCheckin')}
      />
      <EmptyLink
        icon="psychology"
        label="Parts Check-in"
        onPress={() => navigation.navigate('PartsCheckin')}
      />
      <EmptyLink
        icon="flash-on"
        label="Log a Trigger"
        onPress={() => navigation.navigate('TriggerTracker')}
      />
      <EmptyLink
        icon="auto-awesome"
        label="Capture a Glimmer"
        onPress={() => navigation.navigate('GlimmerTracker')}
      />
    </View>
  </View>
);

const EmptyLink = ({ icon, label, onPress }) => {
  const Icon = EMPTY_LINK_ICON_MAP[icon] || Heart;
  return (
    <TouchableOpacity style={styles.emptyLink} onPress={onPress}>
      <Icon size={20} color={colors.primary} strokeWidth={2} />
      <Text style={styles.emptyLinkText}>{label}</Text>
      <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },

  // Header
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  screenSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },

  // Date range
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  rangeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  rangeChipActive: {
    backgroundColor: colors.primary,
  },
  rangeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rangeChipTextActive: {
    color: colors.textInverse,
  },

  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionGap: {
    marginTop: spacing.md,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  patternCards: {
    gap: spacing.sm,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.soft,
  },

  // Parts bars
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: spacing.sm,
  },
  barLabel: {
    width: 90,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  barTrack: {
    flex: 1,
    height: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
  },
  barCount: {
    width: 28,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'right',
  },

  // Highlight card
  highlightCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderLeftWidth: 4,
    ...shadows.soft,
  },
  highlightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  highlightValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  highlightMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Two-column count cards
  twoCol: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  countCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: 3,
    ...shadows.soft,
  },
  countValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  countLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // List cards
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: spacing.sm,
  },
  listDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  listItemCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Habit cards
  habitCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bubbleArchetypal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 2,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  habitMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 4,
  },
  habitMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  completionTrack: {
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  emptyLinks: {
    width: '100%',
    gap: spacing.sm,
  },
  emptyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  emptyLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
});

export default InsightsScreen;
