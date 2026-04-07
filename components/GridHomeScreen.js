/**
 * Grid Home Screen
 *
 * Dashboard widgets + tile-based navigation with floating Huxley assistant
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, gradients } from '../theme/colors';
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
  ventral: { dot: '#10b981', bg: '#d1fae5', label: 'Safe & Social' },
  sympathetic: { dot: '#ef4444', bg: '#fee2e2', label: 'Fight / Flight' },
  dorsal: { dot: '#6b7280', bg: '#f3f4f6', label: 'Shutdown' },
  mixed: { dot: '#f59e0b', bg: '#fef3c7', label: 'Mixed / Blended' },
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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

const GridHomeScreen = ({ navigation }) => {
  const [huxleyModalVisible, setHuxleyModalVisible] = useState(false);
  const [trackMenuVisible, setTrackMenuVisible] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Animations
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const dashboardOpacity = useRef(new Animated.Value(0)).current;
  const dashboardTranslateY = useRef(new Animated.Value(20)).current;
  const tilesOpacity = useRef(new Animated.Value(0)).current;
  const tilesTranslateY = useRef(new Animated.Value(30)).current;

  const runEntrance = () => {
    greetingOpacity.setValue(0);
    dashboardOpacity.setValue(0);
    dashboardTranslateY.setValue(20);
    tilesOpacity.setValue(0);
    tilesTranslateY.setValue(30);

    Animated.sequence([
      Animated.timing(greetingOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(dashboardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dashboardTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
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
    { id: 'nervous', title: 'Nervous System Check-in', description: 'How is your nervous system right now?', emoji: '💚', route: 'NervousSystemCheckin' },
    { id: 'glimmer', title: 'Glimmer Tracker', description: 'Log a positive moment', emoji: '✨', route: 'GlimmerTracker' },
    { id: 'trigger', title: 'Trigger Tracker', description: 'Log when you were triggered', emoji: '⚡', route: 'TriggerTracker' },
    { id: 'parts', title: 'Parts Check-in', description: 'Check in with your inner parts', emoji: '🎭', route: 'PartsCheckin' },
    { id: 'habits', title: 'Habit Tracker', description: 'Track your daily practices', emoji: '📊', route: 'HabitTracker' },
  ];

  const navigationTiles = [
    {
      id: 'track',
      title: 'Track',
      emoji: '💭',
      isSubmenu: true,
      onPress: () => setTrackMenuVisible(true),
    },
    {
      id: 'prepare',
      title: 'Prepare for a Journey',
      emoji: '🧭',
      route: 'SessionPreparation',
    },
    {
      id: 'process',
      title: 'Process & Integrate',
      emoji: '🧩',
      route: 'ProcessIntegrate',
    },
    {
      id: 'innerwork',
      title: 'Inner Work',
      emoji: '🔍',
      route: 'InnerWork',
    },
    {
      id: 'practice',
      title: 'Practice',
      emoji: '🎮',
      route: 'Practice',
    },
    {
      id: 'philosophy',
      title: 'Philosophical Talkthroughs',
      emoji: '\u{1F52E}',
      route: 'PhilosophicalTalkthroughs',
    },
  ];

  const handleTilePress = (tile) => {
    if (tile.isSubmenu && tile.onPress) {
      tile.onPress();
    } else if (tile.route) {
      navigation.navigate(tile.route);
    }
  };

  const renderNSWidget = () => {
    if (dashboardLoading) {
      return <ActivityIndicator size="small" color={colors.primary} />;
    }
    const ns = dashboardData?.nsCheckin;
    if (!ns) {
      return (
        <TouchableOpacity onPress={() => navigation.navigate('NervousSystemCheckin')} style={styles.widgetTouchable}>
          <View style={[styles.nsDot, { backgroundColor: '#9CA3AF' }]} />
          <Text style={styles.widgetEmptyText}>Check in</Text>
        </TouchableOpacity>
      );
    }
    const config = NS_COLORS[ns.ns_state] || NS_COLORS.mixed;
    return (
      <TouchableOpacity onPress={() => navigation.navigate('NervousSystemCheckin')} style={styles.widgetTouchable}>
        <View style={[styles.nsDot, { backgroundColor: config.dot }]} />
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
          <Text style={styles.widgetValueLarge}>--</Text>
          <Text style={styles.widgetEmptyText}>Add habits</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity onPress={() => navigation.navigate('HabitTracker')} style={styles.widgetTouchable}>
        <Text style={styles.widgetValueLarge}>{habits.completed}/{habits.total}</Text>
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
          <Text style={styles.widgetValueLarge}>0</Text>
          <Text style={styles.widgetEmptyText}>Log one</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity onPress={() => navigation.navigate('GlimmerTracker')} style={styles.widgetTouchable}>
        <Text style={styles.widgetValueLarge}>{count} ✨</Text>
        <Text style={styles.widgetLabel}>this week</Text>
      </TouchableOpacity>
    );
  };

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
            <MaterialIcons name="chat-bubble" size={28} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <MaterialIcons name="settings" size={26} color={colors.text} />
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
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.greetingSubtext}>Here's where you are today</Text>
          </Animated.View>

          {/* Dashboard Widgets */}
          <Animated.View style={[
            styles.dashboardRow,
            { opacity: dashboardOpacity, transform: [{ translateY: dashboardTranslateY }] },
          ]}>
            <View style={styles.dashboardCard}>
              {renderNSWidget()}
            </View>
            <View style={styles.dashboardCard}>
              {renderHabitsWidget()}
            </View>
            <View style={styles.dashboardCard}>
              {renderGlimmersWidget()}
            </View>
          </Animated.View>

          {/* Navigation Tiles */}
          <Animated.View style={[
            styles.tilesContainer,
            { opacity: tilesOpacity, transform: [{ translateY: tilesTranslateY }] },
          ]}>
            {navigationTiles.map((tile) => (
              <TouchableOpacity
                key={tile.id}
                style={styles.tile}
                onPress={() => handleTilePress(tile)}
                activeOpacity={0.8}
              >
                <Text style={styles.tileEmoji}>{tile.emoji}</Text>
                <Text style={styles.tileTitle}>{tile.title}</Text>
              </TouchableOpacity>
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
  greetingSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // Dashboard
  dashboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dashboardCard: {
    width: WIDGET_WIDTH,
    minHeight: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
  widgetLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
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
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: TILE_GAP,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tileEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },

  bottomSpacer: {
    height: 100,
  },
});

export default GridHomeScreen;
