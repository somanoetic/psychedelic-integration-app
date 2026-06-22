/**
 * Inner Work Landing Screen
 *
 * Hub screen for inner work modalities — IFS parts work, triggers & glimmers,
 * core beliefs, regulating resources, and nervous system mapping.
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
import { ArrowLeft, ChevronRight, Clock, Lightbulb, HeartHandshake } from 'lucide-react-native';
import { colors, gradients, spacing, borderRadius, shadows, typography } from '../theme/colors';
import { icons } from '../lib/uiIcons';

const options = [
  {
    id: 'ifs',
    title: 'IFS Parts Work',
    emoji: '🎭',
    icon: icons.roles,
    description: 'Explore and heal your inner parts through guided conversation',
    estimatedTime: '15-30 min',
    route: 'IFSChat',
  },
  {
    id: 'triggers',
    title: 'Triggers & Glimmers',
    emoji: '⚡',
    icon: icons.triggerGlimmerMap,
    description: 'Map your nervous system patterns — what activates and what soothes you',
    estimatedTime: '10-20 min',
    route: 'TriggersGlimmers',
  },
  {
    id: 'beliefs',
    title: 'Core Beliefs',
    emoji: '💭',
    icon: icons.coreBeliefs,
    description: 'Explore and transform limiting beliefs that shape your experience',
    estimatedTime: '15-25 min',
    route: 'CoreBeliefs',
  },
  {
    id: 'resources',
    title: 'Regulating Resources',
    emoji: '🧘',
    icon: icons.regulatingResources,
    description: 'Build your personal toolkit for nervous system regulation',
    estimatedTime: '10-15 min',
    route: 'RegulatingResources',
  },
  {
    id: 'nervous',
    title: 'Nervous System Map',
    emoji: '💚',
    icon: icons.nsMap,
    description: 'Deep dive into understanding your nervous system states and patterns',
    estimatedTime: '15-20 min',
    route: 'NervousSystemMapping',
  },
  {
    id: 'active-imagination',
    title: 'Active Imagination',
    emoji: '🌊',
    icon: icons.activeImagination,
    description: 'Dialogue with inner figures from your experiences',
    estimatedTime: '20-45 min',
    route: 'ActiveImagination',
  },
  {
    id: 'attachment-reflection',
    title: 'Attachment Reflection',
    emoji: '🪢',
    icon: null,
    lucideIcon: HeartHandshake,
    description: 'A guided reflection on your early relationships and how they shaped you',
    estimatedTime: '25-45 min',
    route: 'AttachmentReflection',
  },
];

const InnerWorkScreen = ({ navigation }) => {
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
            <Image source={icons.innerWork} style={styles.heroIcon} />
            <Text style={styles.heroTitle}>Inner Work</Text>
            <Text style={styles.heroSubtitle}>
              Explore your inner landscape. Understand your patterns, heal your parts, and build resilience.
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionCard}
                onPress={() => navigation.navigate(option.route)}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  {option.icon ? (
                    <Image source={option.icon} style={styles.optionIconImage} />
                  ) : option.lucideIcon ? (
                    <View style={styles.optionLucideWrap}>
                      <option.lucideIcon size={40} color={colors.primary} strokeWidth={1.75} />
                    </View>
                  ) : (
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  )}
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                    <View style={styles.optionTimeRow}>
                      <Clock size={14} color={colors.textLight} strokeWidth={2} />
                      <Text style={styles.optionTime}>{option.estimatedTime}</Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={24} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Tip */}
          <View style={styles.tipBox}>
            <View style={styles.tipTitleRow}>
              <Lightbulb size={18} color={colors.primary} strokeWidth={2} />
              <Text style={styles.tipTitle}>Inner Work Tip</Text>
            </View>
            <Text style={styles.tipText}>
              Go at your own pace. Inner work is not about pushing through — it's about meeting yourself with curiosity and compassion.
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
  // Wrapper so a lucide icon occupies roughly the same footprint as the
  // illustrated image icons on the other cards (keeps row heights even).
  optionLucideWrap: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(157, 132, 183, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
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
  optionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default InnerWorkScreen;
