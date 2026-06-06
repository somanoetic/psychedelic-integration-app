import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import { icons } from '../lib/uiIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Slide 1 uses the brand logo which has the wordmark baked into the image,
// so the explicit title is suppressed for that slide only.
const ONBOARDING_SLIDES = [
  {
    id: '1',
    icon: icons.multitudesLogo,
    iconStyle: 'brand',
    title: null,
    subtitle: 'Many selves. One you.',
    description: 'Your companion for psychedelic integration and therapeutic healing — a space to process experiences, develop insights, and cultivate lasting growth.',
  },
  {
    id: '2',
    icon: icons.balance,
    title: 'Understand your nervous system',
    subtitle: 'The foundation of healing',
    description: 'Learn polyvagal theory, how stress and trauma shape your physiology, and practical tools to restore regulation and safety.',
  },
  {
    id: '3',
    icon: icons.mapRefined,
    title: 'Map your journey',
    subtitle: 'Process & integrate',
    description: 'Use AI-guided conversations to make sense of non-ordinary experiences, surface insights, and weave them into daily life.',
  },
  {
    id: '4',
    icon: icons.meditate,
    title: 'Practice & grow',
    subtitle: 'A toolkit you can return to',
    description: 'Breathwork, grounding, IFS parts work, and somatic exercises — a personal library for regulation and resilience.',
  },
  {
    id: '5',
    icon: icons.library,
    title: 'Deepen your learning',
    subtitle: 'Grounded in research',
    description: 'Explore polyvagal theory, Internal Family Systems, harm reduction, set and setting, and evidence-based integration practices.',
  },
  {
    id: '6',
    icon: icons.intention,
    title: 'Prepare mindfully',
    subtitle: 'Set your intention',
    description: 'Before each journey, settle your nervous system, clarify intentions, and create the conditions for safe exploration.',
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
      onComplete();
    }
  };

  const renderSlide = ({ item }) => {
    const isBrand = item.iconStyle === 'brand';
    return (
      <View style={styles.slide}>
        <View style={styles.slideContent}>
          <View style={[styles.iconWrap, isBrand && styles.iconWrapBrand]}>
            <Image
              source={item.icon}
              style={isBrand ? styles.brandImage : styles.iconImage}
              resizeMode="contain"
            />
          </View>
          {item.title && <Text style={styles.title}>{item.title}</Text>}
          {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

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
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" />

        {currentIndex < ONBOARDING_SLIDES.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

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

        {renderDots()}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {currentIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const ICON_SIZE = Math.min(width * 0.55, 240);
const BRAND_SIZE = Math.min(width * 0.75, 320);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: spacing.md + 40,
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
    maxWidth: 420,
  },
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconWrapBrand: {
    width: BRAND_SIZE,
    height: BRAND_SIZE,
    marginBottom: spacing.lg,
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  brandImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.deepEarth,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 16,
    color: colors.slate,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: 'rgba(58, 58, 58, 0.18)',
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
    ...shadows.medium,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default OnboardingCarousel;
