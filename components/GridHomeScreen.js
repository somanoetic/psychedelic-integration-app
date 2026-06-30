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
import { useFocusEffect } from '@react-navigation/native';
import { LifeBuoy, Settings } from 'lucide-react-native';
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
  subDistortion: require('../assets/images/icons/thought_cloud.png'),
  subCraving: require('../assets/images/icons/urge.png'),
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

// Forward-looking reflection prompts shown under the greeting. These replace the
// old NS-state recap + habit-nag subtext (both duplicated the tracker tiles right
// below). The line is an invitation, not a status mirror. Rotated by day-of-month
// so it stays fresh day-to-day but is stable across re-renders within a day
// (deterministic — no Math.random flicker).
const REFLECTION_PROMPTS = [
  'What’s alive for you right now?',
  'How is your body feeling today?',
  'What deserves your attention today?',
  'What would feel like care right now?',
  'Notice what’s present, without fixing it.',
  'What’s one small thing you can tend to?',
  'Where is your energy today?',
  'What are you carrying into today?',
];

// Quotes from the voices woven through the app's content (IFS, polyvagal, IPNB,
// Whitman/"Multitudes") plus adjacent contemplative/literary figures in the same
// tone. EVERY entry here was attribution-verified against a primary source — book,
// poem, Collected Works paragraph, or peer-reviewed paper — and the known-fake or
// aggregator-only quotes (most viral Rumi/Hafiz/"Jung"/Nin lines) were excluded on
// purpose. If adding more, hold the same bar; don't trust Goodreads/QuoteFancy.
const QUOTES = [
  // IFS / parts work — Schwartz, No Bad Parts (2021)
  { text: 'There are no bad parts.', author: 'Richard Schwartz' },
  { text: 'All parts are welcome.', author: 'IFS' },
  { text: 'Even the most destructive parts have protective intentions.', author: 'Richard Schwartz' },
  { text: 'Parts are sacred, spiritual beings, and they deserve to be treated as such.', author: 'Richard Schwartz' },
  { text: 'Love is the answer in the inner world, just as it is in the outer world.', author: 'Richard Schwartz' },
  // Polyvagal / IPNB — Dana, Siegel
  { text: 'Story follows state.', author: 'Deb Dana' },
  { text: 'Where attention goes, neural firing flows, and neural connection grows.', author: 'Dan Siegel' },
  { text: 'Name it to tame it.', author: 'Dan Siegel' },
  { text: 'Integration is the linkage of differentiated parts.', author: 'Dan Siegel' },
  { text: 'Integration is the basis of mental health.', author: 'Dan Siegel' },
  { text: 'The mind is fully embodied and fully relational.', author: 'Dan Siegel' },
  // Trauma / somatic — Levine, van der Kolk, Maté
  { text: 'Trauma is a fact of life. It does not, however, have to be a life sentence.', author: 'Peter Levine' },
  { text: 'Being able to feel safe with other people is probably the single most important aspect of mental health.', author: 'Bessel van der Kolk' },
  { text: 'Trauma is not just an event that took place in the past; it is also the imprint left by that experience on mind, brain, and body.', author: 'Bessel van der Kolk' },
  { text: 'Safety is not the absence of threat; it is the presence of connection.', author: 'Gabor Maté' },
  { text: 'The attempt to escape from pain is what creates more pain.', author: 'Gabor Maté' },
  { text: 'Trauma is not what happens to you. It is what happens inside you.', author: 'Gabor Maté' },
  // Humanistic — Rogers, Frankl
  { text: 'The curious paradox is that when I accept myself as I am, then I change.', author: 'Carl Rogers' },
  { text: 'The good life is a process, not a state of being. It is a direction, not a destination.', author: 'Carl Rogers' },
  { text: 'Everything can be taken from a man but one thing: the last of the human freedoms — to choose one’s attitude in any given set of circumstances, to choose one’s own way.', author: 'Viktor Frankl' },
  { text: 'When we are no longer able to change a situation, we are challenged to change ourselves.', author: 'Viktor Frankl' },
  { text: 'Suffering ceases to be suffering at the moment it finds a meaning.', author: 'Viktor Frankl' },
  // Jung — Collected Works
  { text: 'Knowing your own darkness is the best method for dealing with the darknesses of other people.', author: 'Carl Jung' },
  { text: 'When an inner situation is not made conscious, it happens outside, as fate.', author: 'Carl Jung' },
  { text: 'One does not become enlightened by imagining figures of light, but by making the darkness conscious.', author: 'Carl Jung' },
  { text: 'The greatest problems of life can never be solved, only outgrown.', author: 'Carl Jung' },
  { text: 'The privilege of a lifetime is being who you are.', author: 'Joseph Campbell' },
  // Whitman / poetic — verified translations only
  { text: 'I am large, I contain multitudes.', author: 'Walt Whitman' },
  { text: 'Re-examine all you have been told, and dismiss whatever insults your own soul.', author: 'Walt Whitman' },
  { text: 'The wound is the place where the light enters you.', author: 'Rumi (trans. Coleman Barks)' },
  { text: 'Tell me, what is it you plan to do with your one wild and precious life?', author: 'Mary Oliver' },
  { text: 'You do not have to be good. You only have to let the soft animal of your body love what it loves.', author: 'Mary Oliver' },
  { text: 'Someone I loved once gave me a box full of darkness. It took me years to understand that this too was a gift.', author: 'Mary Oliver' },
  { text: 'Let everything happen to you: beauty and terror. Just keep going. No feeling is final.', author: 'Rilke (trans. Macy & Barrows)' },
  { text: 'Live the questions now. Perhaps you will then gradually, without noticing it, live along some distant day into the answer.', author: 'Rilke (trans. Mitchell)' },
  { text: 'For a time I rest in the grace of the world, and am free.', author: 'Wendell Berry' },
  // Contemplative — Chödrön, Thich Nhat Hanh, Brach, Brown
  { text: 'Nothing ever goes away until it has taught us what we need to know.', author: 'Pema Chödrön' },
  { text: 'When we know how to suffer, we suffer much, much less.', author: 'Thich Nhat Hanh' },
  { text: 'No mud, no lotus.', author: 'Thich Nhat Hanh' },
  { text: 'Seeing clearly and holding our experience with compassion are as interdependent as the two wings of a great bird.', author: 'Tara Brach' },
  { text: 'Vulnerability is the birthplace of love, belonging, joy, courage, empathy, and creativity.', author: 'Brené Brown' },
  { text: 'Owning our story and loving ourselves through that process is the bravest thing we’ll ever do.', author: 'Brené Brown' },
  { text: 'We don’t heal in isolation, but in community.', author: 'S. Kelley Harrell' },
];

// Days since the Unix epoch — a monotonically increasing index so the rotation
// walks through the FULL list (not capped at 31 like day-of-month) and never
// resets at month boundaries. Stable within a calendar day across re-renders.
function epochDay() {
  return Math.floor(Date.now() / 86400000);
}

function getGreetingContent() {
  const hour = new Date().getHours();
  let greeting;
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  const day = epochDay();
  const subtext = REFLECTION_PROMPTS[day % REFLECTION_PROMPTS.length];
  const quote = QUOTES[day % QUOTES.length];

  return { greeting, subtext, quote };
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

  // The seven Track indicators, laid out as two rows: a top row of three
  // state/practice check-ins (Parts, Nervous, Habits) and a bottom row of four
  // "things that arise" logs (Glimmer, Trigger, Urge, Thought). Each derives a
  // short read-only status from dashboardData (value when present, muted dash
  // when empty) and carries its tracker `route` so it can be tapped straight
  // through. The block header taps through to the full Track hub instead.
  // Returns { topRow, bottomRow } — see renderTrackBlock.
  const buildTrackIndicators = () => {
    const ns = dashboardData?.nsCheckin;
    const glimmers = dashboardData?.glimmerCount;
    const trigger = dashboardData?.lastTrigger;
    const parts = dashboardData?.lastParts;
    const habits = dashboardData?.habitProgress;
    const distortion = dashboardData?.lastDistortion;
    const craving = dashboardData?.lastCraving;

    const glimmerCount = glimmers?.count ?? 0;

    const topRow = [
      {
        id: 'parts',
        label: 'Parts',
        icon: uiIcons.subParts,
        status: parts ? timeAgo(parts.created_at) : '—',
        active: !!parts,
        route: 'PartsCheckin',
      },
      {
        id: 'nervous',
        label: 'State',
        icon: ns ? (NS_ICONS[ns.ns_state] || NS_ICONS.mixed) : uiIcons.nsMixed,
        status: ns ? timeAgo(ns.created_at) : '—',
        active: !!ns,
        route: 'NervousSystemCheckin',
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

    const bottomRow = [
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
        id: 'craving',
        label: 'Urge',
        icon: uiIcons.subCraving,
        status: craving ? timeAgo(craving.created_at) : '—',
        active: !!craving,
        route: 'CravingTracker',
      },
      {
        id: 'distortion',
        label: 'Thought',
        icon: uiIcons.subDistortion,
        status: distortion ? timeAgo(distortion.created_at) : '—',
        active: !!distortion,
        route: 'CognitiveDistortionTracker',
      },
    ];

    return { topRow, bottomRow };
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
        (() => {
          const { topRow, bottomRow } = buildTrackIndicators();
          const renderIndicator = (ind) => (
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
          );
          return (
            <>
              <View style={styles.trackIndicatorRow}>{topRow.map(renderIndicator)}</View>
              <View style={[styles.trackIndicatorRow, styles.trackIndicatorRowBottom]}>
                {bottomRow.map(renderIndicator)}
              </View>
            </>
          );
        })()
      )}
    </GlassCard>
  );

  const { greeting, subtext, quote } = getGreetingContent();

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Home header removed (beta feedback: redundant). Chat is reachable
            from the global FAB; the greeting's SOS opens triggered support, and
            a bottom utility row exposes crisis Support + Settings. */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting + SOS (crisis affordance, opposite the title) */}
          <Animated.View style={[styles.greetingContainer, { opacity: greetingOpacity }]}>
            <View style={styles.greetingRow}>
              <View style={styles.greetingTextWrap}>
                <Text style={styles.greetingText}>{greeting}</Text>
                <Text style={styles.greetingSubtext}>{subtext}</Text>
              </View>
              <TouchableOpacity
                style={styles.sosButton}
                onPress={() => navigation.navigate('TriggeredSupport')}
                accessibilityRole="button"
                accessibilityLabel="Triggered support"
                activeOpacity={0.85}
              >
                <LifeBuoy size={20} color="#dc2626" strokeWidth={2.5} />
                <Text style={styles.sosLabel}>SOS</Text>
              </TouchableOpacity>
            </View>
            {quote && (
              <Text style={styles.greetingQuote}>
                “{quote.text}”
                <Text style={styles.greetingQuoteAuthor}>  — {quote.author}</Text>
              </Text>
            )}
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

          {/* Bottom utility row — crisis resources + settings.
              Support (Find Support) is a distinct, always-available entry,
              separate from the greeting's SOS (which opens triggered support).
              Settings is open to everyone; admin-only rows are gated inside it. */}
          <Animated.View style={[styles.bottomBar, { opacity: tilesOpacity }]}>
            <TouchableOpacity
              style={styles.bottomBarButton}
              onPress={() => navigation.navigate('FindSupport')}
              accessibilityRole="button"
              accessibilityLabel="Find support"
              activeOpacity={0.7}
            >
              <LifeBuoy size={28} color={colors.textSecondary} strokeWidth={2} />
              <Text style={styles.bottomBarLabel}>Support</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bottomBarButton}
              onPress={() => navigation.navigate('Settings')}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              activeOpacity={0.7}
            >
              <Settings size={28} color={colors.textSecondary} strokeWidth={2} />
              <Text style={styles.bottomBarLabel}>Settings</Text>
            </TouchableOpacity>
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
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greetingTextWrap: {
    flex: 1,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#dc2626',
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    marginLeft: 12,
    marginTop: 4,
  },
  sosLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
    marginLeft: 5,
    letterSpacing: 0.5,
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
  greetingQuote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textSecondary,
    lineHeight: 19,
    marginTop: 10,
  },
  greetingQuoteAuthor: {
    fontStyle: 'normal',
    fontWeight: '600',
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
    paddingTop: 4,
  },
  trackIndicatorRowBottom: {
    paddingBottom: 20,
    paddingTop: 12,
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
  // Process & Integrate — art 10% smaller, but keep the full 160 box HEIGHT so
  // the title baseline stays aligned with the other tiles (resizeMode:contain
  // centers the smaller art vertically in the same box).
  tileIconProcess: {
    width: 144,
    height: 160,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  // Inner Atlas — art 20% smaller, same full-height box for title alignment.
  tileIconInnerAtlas: {
    width: 128,
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

  // Bottom utility row (crisis support + settings)
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  bottomBarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  bottomBarLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 6,
  },
});

export default GridHomeScreen;
