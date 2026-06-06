/**
 * Session Tools — in-session toolbox
 *
 * Quick, reach-for-it-now regulation tools for use DURING or right after a
 * journey: a calming game and fast grounding. This is intentionally distinct
 * from session *management* (creating/continuing sessions), which lives in
 * SessionsHubScreen. Reached from the session-scoped Process & Integrate screen.
 *
 * Starts minimal (Glimmer Swiper + Quick Grounding); designed to grow with
 * more in-session tools (e.g. anchoring, prompts) later.
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
import { ArrowLeft, Clock, ChevronRight } from 'lucide-react-native';
import { colors, gradients, spacing, borderRadius, shadows, typography } from '../theme/colors';
import { icons } from '../lib/uiIcons';

const tools = [
  {
    id: 'swiper',
    title: 'Glimmer Swiper',
    icon: icons.glimmerCaptured,
    description: 'A gentle swipe game to help your nervous system notice glimmers of safety',
    estimatedTime: '5 min',
    route: 'GlimmerSwiper',
  },
  {
    id: 'grounding',
    title: 'Quick Grounding',
    icon: icons.grounding,
    description: '5-4-3-2-1 sensory grounding and other fast regulation exercises',
    estimatedTime: '3-5 min',
    route: 'ExerciseLibrary',
    params: { category: 'grounding' },
  },
];

const SessionToolsScreen = ({ navigation }) => {
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
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.hero}>
            <Image source={icons.tools} style={styles.heroIcon} />
            <Text style={styles.heroTitle}>Session Tools</Text>
            <Text style={styles.heroSubtitle}>
              Calming tools to reach for during or right after your journey.
            </Text>
          </View>

          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={styles.toolCard}
              onPress={() => navigation.navigate(tool.route, tool.params)}
              activeOpacity={0.7}
            >
              <Image source={tool.icon} style={styles.toolIcon} />
              <View style={styles.toolText}>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolDescription}>{tool.description}</Text>
                <View style={styles.toolTimeRow}>
                  <Clock size={14} color={colors.textLight} strokeWidth={2} />
                  <Text style={styles.toolTime}>{tool.estimatedTime}</Text>
                </View>
              </View>
              <ChevronRight size={22} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          ))}
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
    width: 160,
    height: 160,
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
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  toolIcon: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
    marginRight: spacing.md,
  },
  toolText: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  toolDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  toolTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolTime: {
    fontSize: 13,
    color: colors.textLight,
  },
});

export default SessionToolsScreen;
