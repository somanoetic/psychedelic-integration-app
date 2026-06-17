/**
 * Grid Home Screen
 *
 * Dashboard widgets + tile-based navigation with floating Huxley assistant
 * Features: glassmorphism cards, micro-animations, dynamic greeting
 */

import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'react-native';
import { Settings } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, gradients } from '../theme/colors';

// Tile icons (v2 — illustrated set)
const tileIcons = {
  track: require('../assets/images/icons/track2.png'),
  prepare: require('../assets/images/icons/map_refined.png'),
  process: require('../assets/images/icons/puzzle.png'),
  journal: require('../assets/images/icons/journal_refined.png'),
  innerAtlas: require('../assets/images/icons/atlas.png'),
  history: require('../assets/images/icons/history.png'),
  innerwork: require('../assets/images/icons/inner_work.png'),
  practice: require('../assets/images/icons/integration_cycle.png'),
  philosophy: require('../assets/images/icons/philosophical.png'),
  learn: require('../assets/images/icons/education_progress.png'),
};

// Header / widget / submenu icons (v2 — illustrated set)
const uiIcons = {
  chat: require('../assets/images/icons/chat.png'),
  nsVentral: require('../assets/images/icons/droplet.png'),
  nsSympathetic: require('../assets/images/icons/steam.png'),
  nsDorsal: require('../assets/images/icons/iceberg.png'),
  nsMixed: require('../assets/images/icons/blended.png'),
  habits: require('../assets/images/icons/trail_progress.png'),
  glimmers: require('../assets/images/icons/glimmer_high.png'),
  subNervous: require('../assets/images/icons/body_scan_2.png'),
  subGlimmer: require('../assets/images/icons/glimmer_medium.png'),
  subTrigger: require('../assets/images/icons/trigger2.png'),
  subParts: require('../assets/images/icons/roles.png'),
  subHabits: require('../assets/images/icons/checklist.png'),
};

const NS_ICONS = {
  ventral: uiIcons.nsVentral,
  sympathetic: uiIcons.nsSympathetic,
  dorsal: uiIcons.nsDorsal,
  mixed: uiIcons.nsMixed,
};
import { fetchDashboardData } from '../lib/dashboardService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_GAP = 16;
const TILE_WIDTH = (SCREEN_WIDTH - 48 - TILE_GAP) / 2;

const NS_COLORS = {
  ventral: { dot: colors.success, bg: '#d1fae5', label: 'Safe & Social' },
  sympathetic: { dot: colors.error, bg: '#fee2e2', label: 'Fight / Flight' },
  dorsal: { dot: colors.textSecondary, bg: '#f3f4f6', label: 'Shutdown' },
  mixed: { dot: colors.warning, bg: colors.bubbleArchetypal, label: 'Mixed / Blended' },
};

// --- Reusable helper components (extractable to components/ui/ later) ---

const GlassCard = ({ children, style, overlayStyle }) => {
  const cardStyle = [styles.glassCardBase, style];
  const innerStyle = [styles.glassOverlay, overlayStyle];
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={40} tint="light" style={cardStyle}>
        <View style={innerStyle}>{children}</View>
      </BlurView>
    );
  }
  return (
    <LinearGradient
      colors={['rgba(255,255,255,0.75)', 'rgba(255,255,255,0.45)']}
      style={cardStyle}
    >
      <View style={innerStyle}>{children}</View>
    </LinearGradient>
  );
};

const PressableTile = ({ onPress, style, innerStyle, children }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start()}
        activeOpacity={0.9}
        style={innerStyle || styles.tileInner}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const ProgressRing = ({ progress, size = 48, strokeWidth = 4, color = colors.primary, children }) => {
  const radius = size / 2;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const rotation = clampedProgress * 360;

  return (
    <View style={{ width: size, height: size }}>
      {/* Background ring */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: radius,
        borderWidth: strokeWidth, borderColor: `${color}30`,
      }} />
      {/* Left half */}
      {rotation > 0 && (
        <View style={{ position: 'absolute', left: 0, width: radius, height: size, overflow: 'hidden' }}>
          <View style={{
            width: size, height: size, borderRadius: radius,
            borderWidth: strokeWidth, borderColor: color,
            borderRightColor: 'transparent', borderBottomColor: 'transparent',
            transform: [{ rotate: `${Math.min(rotation, 180)}deg` }],
          }} />
        </View>
      )}
      {/* Right half (>50%) */}
      {rotation > 180 && (
        <View style={{ position: 'absolute', right: 0, width: radius, height: size, overflow: 'hidden' }}>
          <View style={{
            width: size, height: size, borderRadius: radius,
            borderWidth: strokeWidth, borderColor: color,
            borderLeftColor: 'transparent', borderTopColor: 'transparent',
            transform: [{ rotate: `${rotation - 180}deg` }],
            right: 0, position: 'absolute',
          }} />
        </View>
      )}
      {/* Center content */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
        {children}
      </View>
    </View>
  );
};

// --- Greeting logic ---

function getGreetingContent(dashboardData) {
  const hour = new Date().getHours();
  let greeting;
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  if (!dashboardData) {
    return { greeting, context: null, subtext: "Here's where you are today" };
  }

  const ns = dashboardData.nsCheckin;
  const habits = dashboardData.habitProgress;
  const nsConfig = ns ? (NS_COLORS[ns.ns_state] || NS_COLORS.mixed) : null;

  // NS context line
  const context = ns
    ? `You were feeling ${nsConfig.label.toLowerCase()} ${timeAgo(ns.created_at)}`
    : null;

  // Contextual subtext
  let subtext;
  if (!ns && (!habits || habits.total === 0)) {
    subtext = 'Start by checking in with yourself';
  } else if (ns && (!habits || habits.total === 0)) {
    subtext = 'Ready to build some habits?';
  } else if (habits && habits.total > 0 && habits.completed >= habits.total) {
    subtext = 'Great work today!';
  } else if (habits && habits.total > 0) {
    const remaining = habits.total - habits.completed;
    subtext = `You have ${remaining} habit${remaining === 1 ? '' : 's'} left today`;
  } else {
    subtext = "Here's where you are today";
  }

  return { greeting, context, subtext };
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

// --- Main component ---

const GridHomeScreen = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Animations
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const widget1Opacity = useRef(new Animated.Value(0)).current;
  const widget1TransY = useRef(new Animated.Value(20)).current;
  const tilesOpacity = useRef(new Animated.Value(0)).current;
  const tilesTranslateY = useRef(new Animated.Value(30)).current;

  const runEntrance = () => {
    greetingOpacity.setValue(0);
    widget1Opacity.setValue(0); widget1TransY.setValue(20);
    tilesOpacity.setValue(0); tilesTranslateY.setValue(30);

    Animated.sequence([
      Animated.timing(greetingOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(widget1Opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(widget1TransY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(tilesOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(tilesTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  };

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setDashboardLoading(true);
      fetchDashboardData().then((data) => {
        if (!cancelled) {
          setDashboardData(data);
          setDashboardLoading(false);
          runEntrance();
        }
      });
      return () => { cancelled = true; };
    }, [])
  );

  // Layout: paired square rows bracketing a full-width History band.
  //   Prepare | Process
  //   Journal | Inner Atlas
  //        History (wide)
  //   Inner Work | Practice
  //   Philosophical | Learn
  // Journal + Inner Atlas (and earlier History + Learn) moved here when the
  // bottom tab bar was removed; the home grid is now the sole nav surface.
  const navigationTiles = [
    { id: 'prepare', title: 'Prepare for a Journey', icon: tileIcons.prepare, route: 'SessionsHub' },
    { id: 'process', title: 'Process & Integrate', icon: tileIcons.process, route: 'ProcessIntegratePicker' },
    { id: 'journal', title: 'Journal', icon: tileIcons.journal, route: 'Journal' },
    { id: 'innerAtlas', title: 'Inner Atlas', icon: tileIcons.innerAtlas, route: 'Atlas' },
    { id: 'history', title: 'History', icon: tileIcons.history, route: 'History', wide: true },
    { id: 'innerwork', title: 'Inner Work', icon: tileIcons.innerwork, route: 'InnerWork' },
    { id: 'practice', title: 'Practice', icon: tileIcons.practice, route: 'Practice' },
    { id: 'philosophy', title: 'Philosophical Talkthroughs', icon: tileIcons.philosophy, route: 'PhilosophicalTalkthroughs' },
    { id: 'learn', title: 'Learn', icon: tileIcons.learn, route: 'Learn' },
  ];

  const handleTilePress = (tile) => {
    if (tile.isSubmenu && tile.onPress) {
      tile.onPress();
    } else if (tile.route) {
      navigation.navigate(tile.route);
    }
  };

  // --- Track block ---

  // The five Track indicators, in the same order as the Track hub. Each derives
  // a short read-only status from dashboardData (value when present, muted dash
  // when empty) and carries its tracker `route` so it can be tapped straight
  // through. The block header taps through to the full Track hub instead.
  const buildTrackIndicators = () => {
    const ns = dashboardData?.nsCheckin;
    const glimmers = dashboardData?.glimmerCount;
    const trigger = dashboardData?.lastTrigger;
    const parts = dashboardData?.lastParts;
    const habits = dashboardData?.habitProgress;

    const glimmerCount = glimmers?.count ?? 0;

    return [
      {
        id: 'nervous',
        label: 'Nervous',
        icon: ns ? (NS_ICONS[ns.ns_state] || NS_ICONS.mixed) : uiIcons.nsMixed,
        status: ns ? timeAgo(ns.created_at) : '—',
        active: !!ns,
        route: 'NervousSystemCheckin',
      },
      {
        id: 'glimmer',
        label: 'Glimmer',
        icon: uiIcons.subGlimmer,
        // The glimmer art sits small inside lots of transparent padding, so
        // scale it up to match the other icons' visual weight.
        iconScale: 1.5,
        status: glimmerCount > 0 ? `${glimmerCount} this wk` : '—',
        active: glimmerCount > 0,
        route: 'GlimmerTracker',
      },
      {
        id: 'trigger',
        label: 'Trigger',
        icon: uiIcons.subTrigger,
        iconScale: 1.25,
        status: trigger ? timeAgo(trigger.created_at) : '—',
        active: !!trigger,
        route: 'TriggerTracker',
      },
      {
        id: 'parts',
        label: 'Parts',
        icon: uiIcons.subParts,
        status: parts ? timeAgo(parts.created_at) : '—',
        active: !!parts,
        route: 'PartsCheckin',
      },
      {
        id: 'habits',
        label: 'Habits',
        icon: uiIcons.subHabits,
        status: habits && habits.total > 0 ? `${habits.completed}/${habits.total}` : '—',
        active: !!(habits && habits.total > 0),
        route: 'HabitTracker',
      },
    ];
  };

  // The block header opens the full Track hub; each indicator taps straight
  // through to its own tracker. (No longer one big touchable / submenu modal.)
  const renderTrackBlock = () => (
    <GlassCard style={styles.trackCard} overlayStyle={styles.trackOverlay}>
      <TouchableOpacity
        style={styles.trackHeaderRow}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('TrackHub')}
      >
        <Image source={tileIcons.track} style={styles.trackHeaderIcon} />
        <View style={styles.trackHeaderText}>
          <Text style={styles.trackTitle}>Track</Text>
          <Text style={styles.trackSubtitle}>Check in & log a moment</Text>
        </View>
      </TouchableOpacity>

      {dashboardLoading ? (
        <View style={styles.trackLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.trackIndicatorRow}>
          {buildTrackIndicators().map((ind) => (
            <TouchableOpacity
              key={ind.id}
              style={styles.indicator}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(ind.route)}
            >
              <Image
                source={ind.icon}
                style={[
                  styles.indicatorIcon,
                  ind.iconScale ? { transform: [{ scale: ind.iconScale }] } : null,
                  !ind.active && styles.indicatorIconMuted,
                ]}
              />
              <Text style={styles.indicatorLabel} numberOfLines={1}>{ind.label}</Text>
              <Text
                style={[styles.indicatorStatus, !ind.active && styles.indicatorStatusMuted]}
                numberOfLines={1}
              >
                {ind.status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </GlassCard>
  );

  const { greeting, context, subtext } = getGreetingContent(dashboardData);

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('HuxleyChat')}
          >
            <Image source={uiIcons.chat} style={styles.headerIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Settings size={26} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerButton, styles.sosButton]}
            onPress={() => navigation.navigate('TriggeredSupport')}
          >
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting */}
          <Animated.View style={[styles.greetingContainer, { opacity: greetingOpacity }]}>
            <Text style={styles.greetingText}>{greeting}</Text>
            {context && <Text style={styles.greetingContext}>{context}</Text>}
            <Text style={styles.greetingSubtext}>{subtext}</Text>
          </Animated.View>

          {/* Track block (replaces the old NS/Habits/Glimmer widgets +
              the Track grid tile) */}
          <Animated.View style={[
            styles.trackBlockContainer,
            { opacity: widget1Opacity, transform: [{ translateY: widget1TransY }] },
          ]}>
            {renderTrackBlock()}
          </Animated.View>

          {/* Navigation Tiles */}
          <Animated.View style={[
            styles.tilesContainer,
            { opacity: tilesOpacity, transform: [{ translateY: tilesTranslateY }] },
          ]}>
            {navigationTiles.map((tile) => (
              <PressableTile
                key={tile.id}
                onPress={() => handleTilePress(tile)}
                style={tile.wide ? styles.tileWide : styles.tile}
                innerStyle={tile.wide ? styles.tileInnerWide : undefined}
              >
                <Image
                  source={tile.icon}
                  style={
                    tile.wide
                      ? styles.tileIconWide
                      : tile.id === 'process'
                      ? styles.tileIconProcess
                      : tile.id === 'innerAtlas'
                      ? styles.tileIconInnerAtlas
                      : styles.tileIcon
                  }
                />
                <Text style={tile.wide ? styles.tileTitleWide : styles.tileTitle}>{tile.title}</Text>
              </PressableTile>
            ))}
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* The Huxley FAB + chat modal are now mounted globally over the
            navigator (see components/GlobalHuxleyFab.js in App.js). The Track
            block's header + indicators navigate directly (no submenu modal). */}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 12,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButton: {
    backgroundColor: '#E57373',
  },
  sosButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
  },

  // Greeting
  greetingContainer: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  greetingContext: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  greetingSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // Glass card base
  glassCardBase: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  glassOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerIcon: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
  },

  // Track block
  trackBlockContainer: {
    marginBottom: 24,
  },
  trackCard: {
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  trackOverlay: {
    padding: 0,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  trackHeaderRow: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
  },
  trackHeaderIcon: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
    marginBottom: 6,
  },
  trackHeaderText: {
    alignItems: 'center',
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  trackSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  trackLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  trackIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 20,
    paddingTop: 4,
  },
  indicator: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  indicatorIcon: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  indicatorIconMuted: {
    opacity: 0.4,
  },
  indicatorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  indicatorStatus: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 1,
  },
  indicatorStatusMuted: {
    color: colors.textLight,
  },

  // Navigation Tiles
  tilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    width: TILE_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    marginBottom: TILE_GAP,
    minHeight: 140,
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }
      : {
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.06)',
        }),
  },
  tileInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  tileIcon: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  // Process & Integrate — 10% smaller than the base tile icon.
  tileIconProcess: {
    width: 144,
    height: 144,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  // Inner Atlas — 20% smaller than the base tile icon.
  tileIconInnerAtlas: {
    width: 128,
    height: 128,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },

  // Full-width tile (History) — a horizontal band between the paired rows.
  tileWide: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    marginBottom: TILE_GAP,
    minHeight: 96,
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }
      : {
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.06)',
        }),
  },
  tileInnerWide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tileIconWide: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  tileTitleWide: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },

  bottomSpacer: {
    height: 100,
  },
});

export default GridHomeScreen;
