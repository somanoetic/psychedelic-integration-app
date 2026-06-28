/**
 * Thought Experiments Hub Screen
 *
 * Landing screen for the scenario-based philosophical thought experiments
 * (Nozick's Experience Machine, Hobbes's Ship of Theseus, etc.). Mirrors
 * PhilosophicalTalkthroughsHubScreen and reuses the same PhilosophicalTalkthrough
 * conversation screen — topics are looked up by id via getTopicById.
 *
 * Source: Peg Tittle, "What If... Collected Thought Experiments in
 * Philosophy" (Routledge, 2016).
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { colors, gradients, spacing, borderRadius, shadows, typography } from '../theme/colors';
import { icons } from '../lib/uiIcons';
import { thoughtExperiments } from '../content/philosophicalTalkthroughs';

const ThoughtExperimentsHubScreen = ({ navigation }) => {
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
              <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <Image source={icons.puzzle} style={styles.heroIcon} />
            <Text style={styles.heroTitle}>Thought Experiments</Text>
            <Text style={styles.heroSubtitle}>
              Classic puzzles from philosophy, turned into guided reflections. They have no right answer — only what they stir up in you.
            </Text>
          </View>

          {/* Topic Cards */}
          <View style={styles.optionsContainer}>
            {thoughtExperiments.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={styles.optionCard}
                onPress={() => navigation.navigate('PhilosophicalTalkthrough', { topicId: topic.id })}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  {topic.icon ? (
                    <Image source={topic.icon} style={styles.optionIconImage} />
                  ) : (
                    <Text style={styles.optionEmoji}>{topic.emoji}</Text>
                  )}
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{topic.title}</Text>
                    {topic.subtitle ? (
                      <Text style={styles.optionSubtitle}>{topic.subtitle}</Text>
                    ) : null}
                    <Text style={styles.optionDescription}>{topic.description}</Text>
                    <Text style={styles.optionTime}>{'⏱️'} {topic.estimatedTime}</Text>
                  </View>
                </View>
                <ChevronRight size={24} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Tip */}
          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>{'\u{1F4A1}'} How to use these</Text>
            <Text style={styles.tipText}>
              Read the scenario, notice your first honest reaction, then let the conversation open it up. These pair especially well with integration — many of them ask the same questions an expanded state can raise about self, reality, and meaning.
            </Text>
          </View>

          {/* Attribution */}
          <Text style={styles.attribution}>
            Adapted from Peg Tittle, “What If… Collected Thought Experiments in Philosophy” (Routledge, 2016).
          </Text>
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
  heroIcon: {
    width: 192,
    height: 192,
    marginBottom: spacing.md,
    resizeMode: 'contain',
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: typography.serif,
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
  optionIconImage: {
    width: 112,
    height: 112,
    resizeMode: 'contain',
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
  optionSubtitle: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 4,
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
    marginBottom: spacing.md,
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
  attribution: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ThoughtExperimentsHubScreen;
