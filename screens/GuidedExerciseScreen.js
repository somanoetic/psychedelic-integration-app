import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Info,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Timer,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { colors, shadows, spacing, borderRadius } from '../theme/colors';
import ShareWithTherapistButton from '../components/ShareWithTherapistButton';
import { shareExercise } from '../lib/therapistShareService';
import ContributedContentDisclaimer from '../components/ContributedContentDisclaimer';
import voiceService from '../lib/voiceService';

const GuidedExerciseScreen = ({ navigation, route }) => {
  const { exercise, categoryColor, returnTo } = route.params;
  const [currentStep, setCurrentStep] = useState(-1); // -1 = instructions view
  const [voiceOn, setVoiceOn] = useState(false); // OFF by default — user opts in
  const [isSpeaking, setIsSpeaking] = useState(false);
  const totalSteps = exercise.steps.length;
  const isComplete = currentStep >= totalSteps;

  // Narrate the current step body whenever the step changes (or voice is turned
  // on mid-exercise). speak() internally stops any in-progress playback first,
  // so tapping Next while step N is still speaking cleanly cuts to step N+1.
  // We narrate step bodies only — not the instructions card or step titles.
  useEffect(() => {
    if (!voiceOn) return;
    if (currentStep < 0 || currentStep >= totalSteps) return;

    let cancelled = false;
    setIsSpeaking(true);
    voiceService
      .speak(exercise.steps[currentStep])
      .catch((e) => {
        if (__DEV__) console.warn('[GuidedExercise] narration failed:', e);
      })
      .finally(() => {
        if (!cancelled) setIsSpeaking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentStep, voiceOn, totalSteps, exercise.steps]);

  // Stop any narration when leaving the screen so audio doesn't continue
  // playing on the next screen (the orphaned-playback bug from the chat screen).
  useFocusEffect(
    useCallback(() => {
      return () => {
        voiceService.stopSpeaking().catch(() => {});
      };
    }, [])
  );

  const handleToggleVoice = () => {
    setVoiceOn((prev) => {
      const next = !prev;
      if (!next) {
        // Turning off mid-step: halt playback immediately.
        voiceService.stopSpeaking().catch(() => {});
        setIsSpeaking(false);
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Honor `returnTo` param when the caller wants to return to a specific
  // screen rather than popping the nav stack. Used by TrailScreen so the
  // user lands back on the trail (the underlying nav stack can get muddled
  // when education markers were previously opened in another tab).
  const handleDone = () => {
    if (returnTo) {
      navigation.navigate(returnTo);
    } else {
      navigation.goBack();
    }
  };

  const accentColor = categoryColor || colors.primary;

  const renderProgressBar = () => {
    const progress = currentStep < 0 ? 0 : (currentStep + 1) / totalSteps;
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progress * 100, 100)}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
        {currentStep >= 0 && !isComplete && (
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {totalSteps}
          </Text>
        )}
      </View>
    );
  };

  const renderInstructions = () => (
    <View style={styles.instructionsCard}>
      <View style={[styles.purposeBadge, { backgroundColor: `${accentColor}15` }]}>
        <Info size={20} color={accentColor} strokeWidth={2} />
        <Text style={[styles.purposeLabel, { color: accentColor }]}>Purpose</Text>
      </View>
      <Text style={styles.instructionsText}>{exercise.instructions}</Text>
      {exercise.isContributed && (
        <ContributedContentDisclaimer
          attributionName={exercise.attributionName}
          style={styles.disclaimerBox}
        />
      )}
      <TouchableOpacity
        style={[styles.beginButton, { backgroundColor: accentColor }]}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={styles.beginButtonText}>Begin Exercise</Text>
        <ArrowRight size={20} color="#fff" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );

  const renderStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.stepNumberBadge, { backgroundColor: `${accentColor}15` }]}>
        <Text style={[styles.stepNumber, { color: accentColor }]}>
          Step {currentStep + 1}
        </Text>
      </View>
      <Text style={styles.stepText}>{exercise.steps[currentStep]}</Text>
      {voiceOn && isSpeaking && (
        <View style={styles.speakingIndicator}>
          <Volume2 size={16} color={accentColor} strokeWidth={2} />
          <Text style={[styles.speakingText, { color: accentColor }]}>Speaking…</Text>
        </View>
      )}
      <View style={styles.navigationButtons}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handlePrevious}
            activeOpacity={0.8}
          >
            <ArrowLeft size={18} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.secondaryButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: accentColor },
            currentStep === 0 && { flex: 1 },
          ]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            {currentStep < totalSteps - 1 ? 'Next Step' : 'Complete'}
          </Text>
          <ArrowRight size={18} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCompletion = () => (
    <View style={styles.completionContainer}>
      <View style={[styles.completionIcon, { backgroundColor: `${accentColor}15` }]}>
        <CheckCircle2 size={64} color={accentColor} strokeWidth={1.5} />
      </View>
      <Text style={styles.completionTitle}>Exercise Complete</Text>
      <Text style={styles.completionMessage}>
        Well done. Take a moment to notice how you feel after completing this practice.
      </Text>
      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: accentColor }]}
        onPress={handleDone}
        activeOpacity={0.8}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
      <ShareWithTherapistButton onShare={() => shareExercise(exercise)} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDone} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{exercise.title}</Text>
          <View style={[styles.durationBadge, { backgroundColor: `${accentColor}15` }]}>
            <Timer size={14} color={accentColor} strokeWidth={2} />
            <Text style={[styles.durationText, { color: accentColor }]}>
              {exercise.duration} min
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleToggleVoice}
          style={styles.voiceButton}
          accessibilityRole="button"
          accessibilityLabel={voiceOn ? 'Turn off narration' : 'Turn on narration'}
          accessibilityState={{ selected: voiceOn }}
        >
          {voiceOn ? (
            <Volume2 size={24} color={accentColor} strokeWidth={2} />
          ) : (
            <VolumeX size={24} color={colors.textSecondary} strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      {renderProgressBar()}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {currentStep < 0 && renderInstructions()}
        {currentStep >= 0 && !isComplete && renderStep()}
        {isComplete && renderCompletion()}
      </ScrollView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  progressBackground: {
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  // Instructions (pre-start)
  instructionsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.soft,
  },
  purposeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  purposeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  instructionsText: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  disclaimerBox: {
    marginBottom: spacing.lg,
  },
  beginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  beginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  // Step view
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  stepNumberBadge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 22,
    lineHeight: 34,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl + spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs + 2,
    marginTop: -(spacing.lg + spacing.sm),
    marginBottom: spacing.lg,
  },
  speakingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lightGray,
    gap: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  // Completion
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  completionIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  completionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  completionMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  doneButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl + spacing.lg,
    borderRadius: borderRadius.md,
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});

export default GuidedExerciseScreen;
