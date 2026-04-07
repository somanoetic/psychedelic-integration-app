/**
 * Philosophical Talkthroughs Hub Screen
 *
 * Landing screen for 5 philosophical explorations.
 * Pattern follows InnerWorkScreen.js — hub with option cards.
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
import { talkthroughTopics } from '../content/philosophicalTalkthroughs';

const PhilosophicalTalkthroughsHubScreen = ({ navigation }) => {
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
            <Text style={styles.heroEmoji}>{'\u{1F52E}'}</Text>
            <Text style={styles.heroTitle}>Philosophical Talkthroughs</Text>
            <Text style={styles.heroSubtitle}>
              Guided contemplative explorations of the big questions. No right answers — just honest attention.
            </Text>
          </View>

          {/* Topic Cards */}
          <View style={styles.optionsContainer}>
            {talkthroughTopics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={styles.optionCard}
                onPress={() => navigation.navigate('PhilosophicalTalkthrough', { topicId: topic.id })}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <Text style={styles.optionEmoji}>{topic.emoji}</Text>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{topic.title}</Text>
                    <Text style={styles.optionDescription}>{topic.description}</Text>
                    <Text style={styles.optionTime}>{'\u23F1\uFE0F'} {topic.estimatedTime}</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Tip */}
          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>{'\u{1F56F}\uFE0F'} Before You Begin</Text>
            <Text style={styles.tipText}>
              These are not lessons. They are invitations to look at what you already know but may not have words for yet. Go slowly. Let the questions work on you.
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

export default PhilosophicalTalkthroughsHubScreen;
