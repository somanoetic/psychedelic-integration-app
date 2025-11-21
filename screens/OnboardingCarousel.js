import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients, spacing, borderRadius } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: '1',
    emoji: '🌟',
    title: 'Welcome to Psycheteleos',
    subtitle: 'Direct Knowing Through Integration',
    description: 'Your companion for psychedelic integration and therapeutic healing. A safe space to process experiences, develop insights, and cultivate lasting growth.',
    gradient: [colors.cream, colors.sand],
  },
  {
    id: '2',
    emoji: '🧠',
    title: 'Understand Your Nervous System',
    subtitle: 'Foundation of Healing',
    description: 'Learn about polyvagal theory, how trauma affects your nervous system, and practical tools to restore regulation and safety.',
    gradient: [colors.sand, colors.sage],
  },
  {
    id: '3',
    emoji: '🗺️',
    title: 'Map Your Journey',
    subtitle: 'Process & Integrate',
    description: 'Use AI-guided conversations to map your psychedelic experiences, identify insights, and weave them into your daily life.',
    gradient: [colors.sage, colors.dustyRose],
  },
  {
    id: '4',
    emoji: '💪',
    title: 'Practice & Grow',
    subtitle: 'Exercise Library',
    description: 'Access breathing exercises, grounding techniques, IFS parts work, and more. Build your personal toolkit for regulation and healing.',
    gradient: [colors.dustyRose, colors.cream],
  },
  {
    id: '5',
    emoji: '📚',
    title: 'Deepen Your Learning',
    subtitle: 'Educational Resources',
    description: 'Explore polyvagal theory, Internal Family Systems, harm reduction, set and setting, and evidence-based integration practices.',
    gradient: [colors.cream, colors.sand],
  },
  {
    id: '6',
    emoji: '🧘',
    title: 'Prepare Mindfully',
    subtitle: 'Set Your Intention',
    description: 'Before each session, prepare your mind and nervous system. Set intentions, assess your state, and create conditions for safe exploration.',
    gradient: [colors.sand, colors.sage],
  },
];

const OnboardingCarousel = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      onComplete(); // Continue anyway
    }
  };

  const renderSlide = ({ item }) => (
    <LinearGradient
      colors={item.gradient}
      style={styles.slide}
    >
      <View style={styles.slideContent}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </LinearGradient>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {ONBOARDING_SLIDES.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentIndex ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Skip button */}
      {currentIndex < ONBOARDING_SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEnabled={true}
      />

      {/* Dots indicator */}
      {renderDots()}

      {/* Navigation buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleNext}
        >
          <Text style={styles.primaryButtonText}>
            {currentIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  skipButton: {
    position: 'absolute',
    top: spacing.md + 40, // Account for status bar
    right: spacing.lg,
    zIndex: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: 16,
    color: colors.slate,
    fontWeight: '600',
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  emoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.deepEarth,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: 16,
    color: colors.slate,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 10,
    backgroundColor: colors.sand,
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.deepEarth,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default OnboardingCarousel;
