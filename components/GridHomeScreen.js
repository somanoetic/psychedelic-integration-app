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
  innerwork: require('../assets/images/icons/inner_work.png'),
  practice: require('../assets/images/icons/integration_cycle.png'),
  philosophy: require('../assets/images/icons/philosophical.png'),
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
import FloatingHuxleyButton from './FloatingHuxleyButton';
import HuxleyChatModal from './HuxleyChatModal';
import SubMenuModal from './SubMenuModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_GAP = 16;
const TILE_WIDTH = (SCREEN_WIDTH - 48 - TILE_GAP) / 2;
const WIDGET_GAP = 8;
const WIDGET_WIDTH = (SCREEN_WIDTH - 48 - WIDGET_GAP * 2) / 3;

const NS_COLORS = {
  ventral: { dot: colors.success, bg: '#d1fae5', label: 'Safe & Social' },
  sympathetic: { dot: colors.error, bg: '#fee2e2', label: 'Fight / Flight' },
  dorsal: { dot: colors.textSecondary, bg: '#f3f4f6', label: 'Shutdown' },
  mixed: { dot: colors.warning, bg: colors.bubbleArchetypal, label: 'Mixed / Blended' },
};

// --- Reusable helper components (extractable to components/ui/ later) ---

const GlassCard = ({ children, style }) => {
  const cardStyle = [styles.glassCardBase, style];
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={40} tint="light" style={cardStyle}>
        <View style={styles.glassOverlay}>{children}</View>
      </BlurView>
    );
  }
  return (
    <LinearGradient
      colors={['rgba(255,255,255,0.75)', 'rgba(255,255,255,0.45)']}
      style={cardStyle}
    >
      <View style={styles.glassOverlay}>{children}</View>
    </LinearGradient>
  );
};

const PressableTile = ({ onPress, style, children }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start()}
        activeOpacity={0.9}
        style={styles.tileInner}
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
  const [huxleyModalVisible, setHuxleyModalVisible] = useState(false);
  const [trackMenuVisible, setTrackMenuVisible] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Animations
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const widget1Opacity = useRef(new Animated.Value(0)).current;
  const widget1TransY = useRef(new Animated.Value(20)).current;
  const widget2Opacity = useRef(new Animated.Value(0)).current;
  const widget2TransY = useRef(new Animated.Value(20)).current;
  const widget3Opacity = useRef(new Animated.Value(0)).current;
  const widget3TransY = useRef(new Animated.Value(20)).current;
  const tilesOpacity = useRef(new Animated.Value(0)).current;
  const tilesTranslateY = useRef(new Animated.Value(30)).current;

  const runEntrance = () => {
    greetingOpacity.setValue(0);
    widget1Opacity.setValue(0); widget1TransY.setValue(20);
    widget2Opacity.setValue(0); widget2TransY.setValue(20);
    widget3Opacity.setValue(0); widget3TransY.setValue(20);
    tilesOpacity.setValue(0); tilesTranslateY.setValue(30);

    Animated.sequence([
      Animated.timing(greetingOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.stagger(100, [
        Animated.parallel([
          Animated.timing(widget1Opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(widget1TransY, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(widget2Opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(widget2TransY, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(widget3Opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(widget3TransY, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]),
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

  // Track Hub options
  const trackOptions = [
    { id: 'nervous', title: 'Nervous System Check-in', description: 'How is your nervous system right now?', icon: uiIcons.subNervous, route: 'NervousSystemCheckin' },
    { id: 'glimmer', title: 'Glimmer Tracker', description: 'Log a positive moment', icon: uiIcons.subGlimmer, route: 'GlimmerTracker' },
    { id: 'trigger', title: 'Trigger Tracker', description: 'Log when you were triggered', icon: uiIcons.subTrigger, route: 'TriggerTracker' },
    { id: 'parts', title: 'Parts Check-in', description: 'Check in with your inner parts', icon: uiIcons.subParts, route: 'PartsCheckin' },
    { id: 'habits', title: 'Habit Tracker', description: 'Track your daily practices', icon: uiIcons.subHabits, route: 'HabitTracker' },
  ];

  const navigationTiles = [
    { id: 'track', title: 'Track', icon: tileIcons.track, isSubmenu: true, onPress: () => setTrackMenuVisible(true) },
    { id: 'prepare', title: 'Prepare for a Journey', icon: tileIcons.prepare, route: 'SessionsHub' },
    { id: 'process', title: 'Process & Integrate', icon: tileIcons.process, route: 'ProcessIntegratePicker' },
    { id: 'innerwork', title: 'Inner Work', icon: tileIcons.innerwork, route: 'InnerWork' },
    { id: 'practice', title: 'Practice', icon: tileIcons.practice, route: 'Practice' },
    { id: 'philosophy', title: 'Philosophical Talkthroughs', icon: tileIcons.philosophy, route: 'PhilosophicalTalkthroughs' },
  ];

  const handleTilePress = (tile) => {
    if (tile.isSubmenu && tile.onPress) {
      tile.onPress();
    } else if (tile.route) {
      navigation.navigate(tile.route);
    }
  };

  // --- Widget renderers ---

  const renderNSWidget = () => {
    if (dashboardLoading) {
      return <ActivityIndicator size="small" color={colors.primary} />;
    }
    const ns = dashboardData?.nsCheckin;
    if (!ns) {
      return (
        <TouchableOpacity onPress={() => navigation.navigate('NervousSystemCheckin')} style={styles.widgetTouchable}>
          <Image source={uiIcons.nsMixed} style={[styles.widgetIcon, styles.widgetIconMuted]} />
          <Text style={styles.widgetEmptyText}>Check in</Text>
        </TouchableOpacity>
      );
    }
    const config = NS_COLORS[ns.ns_state] || NS_COLORS.mixed;
    const icon = NS_ICONS[ns.ns_state] || NS_ICONS.mixed;
    return (
      <TouchableOpacity onPress={() => navigation.navigate('NervousSystemCheckin')} style={styles.widgetTouchable}>
        <Image source={icon} style={styles.widgetIcon} />
        <Text style={styles.widgetValue} numberOfLines={1}>{config.label}</Text>
        <Text style={styles.widgetLabel}>{timeAgo(ns.created_at)}</Text>
      </TouchableOpacity>
    );
  };

  const renderHabitsWidget = () => {
    if (dashboardLoading) {
      return <ActivityIndicator size="small" color={colors.primary} />;
    }
    const habits = dashboardData?.habitProgress;
    if (!habits || habits.total === 0) {
      return (
        <TouchableOpacity onPress={() => navigation.navigate('HabitTracker')} style={styles.widgetTouchable}>
          <Image source={uiIcons.habits} style={[styles.widgetIcon, styles.widgetIconMuted]} />
          <Text style={styles.widgetEmptyText}>Add habits</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity onPress={() => navigation.navigate('HabitTracker')} style={styles.widgetTouchable}>
        <Image source={uiIcons.habits} style={styles.widgetIcon} />
        <Text style={styles.widgetValue}>{habits.completed}/{habits.total}</Text>
        <Text style={styles.widgetLabel}>habits today</Text>
      </TouchableOpacity>
    );
  };

  const renderGlimmersWidget = () => {
    if (dashboardLoading) {
      return <ActivityIndicator size="small" color={colors.primary} />;
    }
    const glimmers = dashboardData?.glimmerCount;
    const count = glimmers?.count ?? 0;
    if (count === 0) {
      return (
        <TouchableOpacity onPress={() => navigation.navigate('GlimmerTracker')} style={styles.widgetTouchable}>
          <Image source={uiIcons.glimmers} style={[styles.widgetIcon, styles.widgetIconMuted]} />
          <Text style={styles.widgetEmptyText}>Log one</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity onPress={() => navigation.navigate('GlimmerTracker')} style={styles.widgetTouchable}>
        <Image source={uiIcons.glimmers} style={styles.widgetIcon} />
        <Text style={styles.widgetValue}>{count}</Text>
        <Text style={styles.widgetLabel}>this week</Text>
      </TouchableOpacity>
    );
  };

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

          {/* Dashboard Widgets */}
          <View style={styles.dashboardRow}>
            <Animated.View style={{ opacity: widget1Opacity, transform: [{ translateY: widget1TransY }] }}>
              <GlassCard style={styles.dashboardCard}>
                {renderNSWidget()}
              </GlassCard>
            </Animated.View>
            <Animated.View style={{ opacity: widget2Opacity, transform: [{ translateY: widget2TransY }] }}>
              <GlassCard style={styles.dashboardCard}>
                {renderHabitsWidget()}
              </GlassCard>
            </Animated.View>
            <Animated.View style={{ opacity: widget3Opacity, transform: [{ translateY: widget3TransY }] }}>
              <GlassCard style={styles.dashboardCard}>
                {renderGlimmersWidget()}
              </GlassCard>
            </Animated.View>
          </View>

          {/* Navigation Tiles */}
          <Animated.View style={[
            styles.tilesContainer,
            { opacity: tilesOpacity, transform: [{ translateY: tilesTranslateY }] },
          ]}>
            {navigationTiles.map((tile) => (
              <PressableTile
                key={tile.id}
                onPress={() => handleTilePress(tile)}
                style={styles.tile}
              >
                <Image source={tile.icon} style={styles.tileIcon} />
                <Text style={styles.tileTitle}>{tile.title}</Text>
              </PressableTile>
            ))}
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Floating Huxley Button */}
        <FloatingHuxleyButton onPress={() => setHuxleyModalVisible(true)} />

        {/* Huxley Chat Modal */}
        <HuxleyChatModal
          visible={huxleyModalVisible}
          onClose={() => setHuxleyModalVisible(false)}
          onNavigate={(route, params) => navigation.navigate(route, params)}
          navigation={navigation}
        />

        {/* Track SubMenu */}
        <SubMenuModal
          visible={trackMenuVisible}
          onClose={() => setTrackMenuVisible(false)}
          title="Track"
          options={trackOptions}
          onSelect={(route, params) => navigation.navigate(route, params)}
        />
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

  // Dashboard
  dashboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dashboardCard: {
    width: WIDGET_WIDTH,
    height: 160,
  },
  widgetTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  nsDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  headerIcon: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
  },
  widgetIcon: {
    width: 88,
    height: 88,
    resizeMode: 'contain',
    marginBottom: 2,
  },
  widgetIconMuted: {
    opacity: 0.45,
  },
  widgetValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  widgetValueLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  ringText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  widgetLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  widgetEmptyText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
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
  tileTitle: {
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
