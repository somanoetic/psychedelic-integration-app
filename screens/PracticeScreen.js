/**
 * Practice Landing Screen
 *
 * Hub screen for exercises, games, and practice tools.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';

const options = [
  {
    id: 'progress',
    title: 'Your Progress',
    emoji: '📈',
    description: 'Track your exercise curriculum and see how far you\'ve come',
    estimatedTime: '2 min',
    route: 'CurriculumTracker',
  },
  {
    id: 'exercises',
    title: 'Exercise Library',
    emoji: '🏃',
    description: 'Breathing, grounding, somatic — 160+ guided exercises',
    estimatedTime: '5-15 min',
    route: 'ExerciseLibrary',
  },
  {
    id: 'swiper',
    title: 'Glimmer Swiper',
    emoji: '🎮',
    description: 'Therapeutic swipe game to train your nervous system to notice glimmers',
    estimatedTime: '5 min',
    route: 'GlimmerSwiper',
  },
  {
    id: 'grounding',
    title: 'Quick Grounding',
    emoji: '🌍',
    description: '5-4-3-2-1 sensory grounding and other quick regulation exercises',
    estimatedTime: '3-5 min',
    route: 'ExerciseLibrary',
    params: { category: 'grounding' },
  },
];

const PracticeScreen = ({ navigation }) => {
  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>🎮</Text>
            <Text style={styles.heroTitle}>Practice</Text>
            <Text style={styles.heroSubtitle}>
              Build your skills through guided exercises and engaging practice tools.
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionCard}
                onPress={() => navigation.navigate(option.route, option.params)}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                    <Text style={styles.optionTime}>⏱️ {option.estimatedTime}</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Tip */}
          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>💡 Practice Tip</Text>
            <Text style={styles.tipText}>
              Consistency matters more than intensity. Even 5 minutes of daily practice builds lasting resilience.
            </Text>
          </View>
        </ScrollView>
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
    padding: spacing.lg,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  optionsContainer: {
    marginBottom: spacing.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionEmoji: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  optionTime: {
    fontSize: 13,
    color: colors.textLight,
  },
  tipBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default PracticeScreen;
