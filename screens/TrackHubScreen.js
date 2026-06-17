/**
 * Track Hub Screen
 *
 * The home for tracking, mirroring the Journal page pattern: a set of "log a
 * moment" entry cards on top (each opens its tracker), followed by a unified,
 * reverse-chronological history of recent check-ins/logs across the four log
 * trackers. Replaces the old SubMenuModal launcher.
 *
 * Reached from the home Track block (tap the Track icon/header) and the global
 * Huxley FAB's Track action.
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, gradients } from '../theme/colors';
import { fetchTrackHistory, fetchDashboardData } from '../lib/dashboardService';

// Icons reused from the home Track block / submenu (illustrated v2 set).
const icons = {
  track: require('../assets/images/icons/track2.png'),
  nervous: require('../assets/images/icons/body_scan_2.png'),
  glimmer: require('../assets/images/icons/glimmer_medium.png'),
  trigger: require('../assets/images/icons/trigger2.png'),
  parts: require('../assets/images/icons/roles.png'),
  habits: require('../assets/images/icons/checklist.png'),
};

// The five tracker entry cards. `route` is the per-tracker screen.
const TRACKERS = [
  { id: 'nervous', title: 'Nervous System Check-in', description: 'How is your nervous system right now?', icon: icons.nervous, route: 'NervousSystemCheckin' },
  { id: 'glimmer', title: 'Glimmer Tracker', description: 'Log a positive moment', icon: icons.glimmer, iconScale: 1.4, route: 'GlimmerTracker' },
  { id: 'trigger', title: 'Trigger Tracker', description: 'Log when you were triggered', icon: icons.trigger, iconScale: 1.2, route: 'TriggerTracker' },
  { id: 'parts', title: 'Parts Check-in', description: 'Check in with your inner parts', icon: icons.parts, route: 'PartsCheckin' },
  { id: 'habits', title: 'Habit Tracker', description: 'Track your daily practices', icon: icons.habits, route: 'HabitTracker' },
];

// History rows carry a small icon + colour accent by kind.
const KIND_META = {
  nervous: { icon: icons.nervous, label: 'Nervous system', route: 'NervousSystemCheckin' },
  glimmer: { icon: icons.glimmer, label: 'Glimmer', route: 'GlimmerTracker', iconScale: 1.4 },
  trigger: { icon: icons.trigger, label: 'Trigger', route: 'TriggerTracker', iconScale: 1.2 },
  parts: { icon: icons.parts, label: 'Parts', route: 'PartsCheckin' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

const TrackHubScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [habits, setHabits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [feed, dash] = await Promise.all([
        fetchTrackHistory(),
        fetchDashboardData(),
      ]);
      setHistory(feed);
      setHabits(dash?.habitProgress || null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const habitSummary =
    habits && habits.total > 0
      ? `${habits.completed}/${habits.total} done today`
      : null;

  const renderTrackerCard = (t) => (
    <TouchableOpacity
      key={t.id}
      style={styles.trackerCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate(t.route)}
    >
      <View style={styles.trackerIconWrap}>
        <Image
          source={t.icon}
          style={[styles.trackerIcon, t.iconScale ? { transform: [{ scale: t.iconScale }] } : null]}
        />
      </View>
      <View style={styles.trackerText}>
        <Text style={styles.trackerTitle}>{t.title}</Text>
        <Text style={styles.trackerDesc}>{t.description}</Text>
        {t.id === 'habits' && habitSummary && (
          <Text style={styles.trackerMeta}>{habitSummary}</Text>
        )}
      </View>
      <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
    </TouchableOpacity>
  );

  const renderHistoryRow = (item) => {
    const meta = KIND_META[item.kind] || {};
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.historyRow}
        activeOpacity={0.85}
        onPress={() => meta.route && navigation.navigate(meta.route)}
      >
        <Image
          source={meta.icon}
          style={[styles.historyIcon, meta.iconScale ? { transform: [{ scale: meta.iconScale }] } : null]}
        />
        <View style={styles.historyText}>
          <View style={styles.historyTopLine}>
            <Text style={styles.historyKind}>{meta.label}</Text>
            <Text style={styles.historyTime}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
          {item.subtitle ? (
            <Text style={styles.historySubtitle} numberOfLines={1}>{item.subtitle}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={styles.gradientFill}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
          <Image source={icons.track} style={styles.headerIcon} />
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Track</Text>
            <Text style={styles.headerSubtitle}>Check in & log a moment</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
          }
        >
          {/* Tracker entry cards */}
          <View style={styles.trackerList}>
            {TRACKERS.map(renderTrackerCard)}
          </View>

          {/* History feed */}
          <Text style={styles.sectionLabel}>Recent</Text>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : history.length === 0 ? (
            <Text style={styles.emptyText}>
              No check-ins yet. Log a moment above to start your timeline.
            </Text>
          ) : (
            <View style={styles.historyList}>
              {history.map(renderHistoryRow)}
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientFill: { flex: 1 },
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
    marginRight: 4,
  },
  headerIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  // Tracker entry cards
  trackerList: {
    marginBottom: 24,
  },
  trackerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  trackerIconWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trackerIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  trackerText: {
    flex: 1,
  },
  trackerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  trackerDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trackerMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },

  // History feed
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 2,
  },
  loading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  historyList: {},
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  historyIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 12,
  },
  historyText: {
    flex: 1,
  },
  historyTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyKind: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  historyTime: {
    fontSize: 11,
    color: colors.textLight,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  historySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },

  bottomSpacer: {
    height: 40,
  },
});

export default TrackHubScreen;
