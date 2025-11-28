/**
 * Glimmer Swiper Game
 *
 * Therapeutic swipe game with subliminal affirmations
 * - Swipe LEFT for smiling faces
 * - Swipe RIGHT for nature scenes
 * - Subliminal affirmations flash every 3-10 seconds (40ms duration)
 *
 * Inspired by ketamine.games/swiper
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import SubliminalFlash from './SubliminalFlash';
import subliminalPrimingService, { AFFIRMATION_THEMES } from '../lib/subliminalPrimingService';
import { generateDeck } from '../data/glimmerSwiperImages';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;

const GAME_MODES = {
  QUICK: { name: 'Quick', duration: 2, images: 20 },
  STANDARD: { name: 'Standard', duration: 5, images: 50 },
  EXTENDED: { name: 'Extended', duration: 10, images: 100 },
};

const GlimmerSwiper = ({ navigation }) => {
  // Game state
  const [gameMode, setGameMode] = useState(null);
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  // Subliminal state
  const [subliminalEnabled, setSubliminalEnabled] = useState(true);
  const [showSubliminal, setShowSubliminal] = useState(false);
  const [currentAffirmation, setCurrentAffirmation] = useState('');
  const [totalAffirmations, setTotalAffirmations] = useState(0);

  // Animation refs
  const pan = useRef(new Animated.ValueXY()).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Timers
  const subliminalTimer = useRef(null);
  const gameTimer = useRef(null);
  const startTime = useRef(null);

  // Check subliminal settings on mount
  useEffect(() => {
    checkSubliminalSettings();
  }, []);

  const checkSubliminalSettings = async () => {
    const enabled = await subliminalPrimingService.isEnabled();
    setSubliminalEnabled(enabled);
    setLoading(false);
  };

  // Start game
  const startGame = (mode) => {
    setGameMode(mode);
    const newDeck = generateDeck(Math.ceil(GAME_MODES[mode].images / 2));
    setDeck(newDeck);
    setCurrentIndex(0);
    setCorrectCount(0);
    setStreak(0);
    setTotalAffirmations(0);
    setGameStarted(true);
    setGameComplete(false);
    startTime.current = Date.now();

    // Start subliminal priming if enabled
    if (subliminalEnabled) {
      subliminalPrimingService.startSession();
      scheduleSubliminal();
    }
  };

  // Schedule next subliminal flash
  const scheduleSubliminal = () => {
    if (!subliminalEnabled) return;

    const interval = subliminalPrimingService.getRandomInterval();

    subliminalTimer.current = setTimeout(() => {
      showSubliminalFlash();
      scheduleSubliminal(); // Schedule next one
    }, interval);
  };

  // Show subliminal flash
  const showSubliminalFlash = () => {
    const themes = [
      AFFIRMATION_THEMES.SAFETY,
      AFFIRMATION_THEMES.PRESENCE,
      AFFIRMATION_THEMES.HEALING,
    ];
    const affirmation = subliminalPrimingService.getAffirmation(themes);

    setCurrentAffirmation(affirmation);
    setShowSubliminal(true);
    setTotalAffirmations(prev => prev + 1);
    subliminalPrimingService.recordExposure();
  };

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (subliminalTimer.current) clearTimeout(subliminalTimer.current);
      if (gameTimer.current) clearTimeout(gameTimer.current);
    };
  }, []);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        pan.setValue({ x: gesture.dx, y: gesture.dy });

        // Rotate based on horizontal movement
        const rotation = gesture.dx / SCREEN_WIDTH;
        rotate.setValue(rotation);
      },
      onPanResponderRelease: (_, gesture) => {
        const swipeDirection = gesture.dx > 0 ? 'right' : 'left';
        const currentCard = deck[currentIndex];

        if (Math.abs(gesture.dx) > SWIPE_THRESHOLD) {
          // Completed swipe
          handleSwipe(swipeDirection, currentCard);
        } else {
          // Didn't swipe far enough - return to center
          resetCard();
        }
      },
    })
  ).current;

  // Handle swipe
  const handleSwipe = (direction, card) => {
    const isCorrect =
      (direction === 'left' && card.category === 'face') ||
      (direction === 'right' && card.category === 'nature');

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    // Animate card off screen
    const toValue = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;

    Animated.parallel([
      Animated.timing(pan.x, {
        toValue,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Move to next card
      if (currentIndex + 1 < deck.length) {
        setCurrentIndex(prev => prev + 1);
        resetCard();
      } else {
        endGame();
      }
    });
  };

  // Reset card position
  const resetCard = () => {
    Animated.parallel([
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }),
      Animated.spring(rotate, {
        toValue: 0,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // End game
  const endGame = () => {
    setGameComplete(true);
    setGameStarted(false);

    // Stop subliminal timer
    if (subliminalTimer.current) {
      clearTimeout(subliminalTimer.current);
    }
  };

  // Calculate stats
  const getStats = () => {
    const totalSwipes = deck.length;
    const accuracy = totalSwipes > 0 ? Math.round((correctCount / currentIndex) * 100) : 0;
    const duration = startTime.current
      ? Math.floor((Date.now() - startTime.current) / 1000)
      : 0;

    return {
      totalSwipes,
      correctCount,
      accuracy,
      streak,
      duration,
      affirmationsReceived: totalAffirmations,
    };
  };

  // Render mode selection screen
  if (!gameStarted && !gameComplete) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Glimmer Swiper</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.modeSelection}>
          <View style={styles.introSection}>
            <Text style={styles.emoji}>✨</Text>
            <Text style={styles.subtitle}>Find the Glimmers</Text>
            <Text style={styles.description}>
              A therapeutic game to train your attention toward positive stimuli
            </Text>
          </View>

          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>How to Play:</Text>
            <View style={styles.instructionRow}>
              <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
              <Text style={styles.instructionText}>Swipe LEFT for smiling faces</Text>
            </View>
            <View style={styles.instructionRow}>
              <MaterialIcons name="arrow-forward" size={24} color={colors.sage} />
              <Text style={styles.instructionText}>Swipe RIGHT for nature scenes</Text>
            </View>
          </View>

          {subliminalEnabled && (
            <View style={styles.subliminalInfo}>
              <MaterialIcons name="psychology" size={20} color={colors.secondary} />
              <Text style={styles.subliminalText}>
                Includes subliminal affirmations for deeper healing
              </Text>
            </View>
          )}

          <View style={styles.modesContainer}>
            <Text style={styles.modesTitle}>Choose Duration:</Text>

            {Object.entries(GAME_MODES).map(([key, mode]) => (
              <TouchableOpacity
                key={key}
                style={styles.modeCard}
                onPress={() => startGame(key)}
              >
                <View>
                  <Text style={styles.modeName}>{mode.name}</Text>
                  <Text style={styles.modeDetails}>
                    {mode.duration} min • {mode.images} images
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render game complete screen
  if (gameComplete) {
    const stats = getStats();

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.completeContainer}>
          <Text style={styles.completeEmoji}>🌟</Text>
          <Text style={styles.completeTitle}>Glimmers Found!</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.correctCount}</Text>
              <Text style={styles.statLabel}>Correct Swipes</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.accuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.streak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>

            {subliminalEnabled && (
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.affirmationsReceived}</Text>
                <Text style={styles.statLabel}>Affirmations</Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => {
                setGameComplete(false);
                setGameStarted(false);
              }}
            >
              <Text style={styles.buttonText}>Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Render game screen
  const currentCard = deck[currentIndex];
  const rotateInterpolate = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Subliminal Flash */}
      <SubliminalFlash
        message={currentAffirmation}
        isVisible={showSubliminal}
        onComplete={() => setShowSubliminal(false)}
      />

      {/* Header */}
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={endGame} style={styles.exitButton}>
          <MaterialIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {deck.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentIndex + 1) / deck.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.streakBadge}>
          <MaterialIcons name="local-fire-department" size={20} color={colors.primary} />
          <Text style={styles.streakText}>{streak}</Text>
        </View>
      </View>

      {/* Card Stack */}
      <View style={styles.cardContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : currentCard ? (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.card,
              {
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { rotate: rotateInterpolate },
                ],
                opacity,
              },
            ]}
          >
            <Image source={{ uri: currentCard.url }} style={styles.cardImage} />

            {/* Swipe indicators */}
            <Animated.View
              style={[
                styles.swipeIndicator,
                styles.swipeLeft,
                { opacity: pan.x.interpolate({ inputRange: [-SCREEN_WIDTH, 0], outputRange: [1, 0] }) },
              ]}
            >
              <MaterialIcons name="arrow-back" size={48} color="#fff" />
              <Text style={styles.swipeText}>FACE</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.swipeIndicator,
                styles.swipeRight,
                { opacity: pan.x.interpolate({ inputRange: [0, SCREEN_WIDTH], outputRange: [0, 1] }) },
              ]}
            >
              <MaterialIcons name="arrow-forward" size={48} color="#fff" />
              <Text style={styles.swipeText}>NATURE</Text>
            </Animated.View>
          </Animated.View>
        ) : (
          <Text>No more cards</Text>
        )}
      </View>

      {/* Swipe hints */}
      <View style={styles.hintsContainer}>
        <View style={styles.hint}>
          <MaterialIcons name="arrow-back" size={32} color={colors.primary} />
          <Text style={styles.hintText}>Faces</Text>
        </View>
        <View style={styles.hint}>
          <MaterialIcons name="arrow-forward" size={32} color={colors.sage} />
          <Text style={styles.hintText}>Nature</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },

  // Mode selection
  modeSelection: {
    padding: 20,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  instructions: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  subliminalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  subliminalText: {
    fontSize: 14,
    color: colors.secondary,
    marginLeft: 8,
    flex: 1,
  },
  modesContainer: {
    marginTop: 10,
  },
  modesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  modeName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  modeDetails: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Game screen
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  exitButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.sand,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  swipeIndicator: {
    position: 'absolute',
    top: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  swipeLeft: {
    left: 40,
  },
  swipeRight: {
    right: 40,
  },
  swipeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  hintsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  hint: {
    alignItems: 'center',
  },
  hintText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // Complete screen
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completeEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 40,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    margin: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actionButtons: {
    width: '100%',
    maxWidth: 400,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: colors.text,
  },
});

export default GlimmerSwiper;
