import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, shadows, spacing, borderRadius } from '../theme/colors';
import ShareWithTherapistButton from '../components/ShareWithTherapistButton';
import { shareExercise } from '../lib/therapistShareService';
import ContributedContentDisclaimer from '../components/ContributedContentDisclaimer';

const GuidedExerciseScreen = ({ navigation, route }) => {
  const { exercise, categoryColor } = route.params;
  const [currentStep, setCurrentStep] = useState(-1); // -1 = instructions view
  const totalSteps = exercise.steps.length;
  const isComplete = currentStep >= totalSteps;

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleDone = () => {
    navigation.goBack();
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
        <MaterialIcons name="info-outline" size={20} color={accentColor} />
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
        <MaterialIcons name="arrow-forward" size={20} color="#fff" />
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
      <View style={styles.navigationButtons}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handlePrevious}
            activeOpacity={0.8}
          >
            <MaterialIcons name="arrow-back" size={18} color={colors.textSecondary} />
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
          <MaterialIcons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCompletion = () => (
    <View style={styles.completionContainer}>
      <View style={[styles.completionIcon, { backgroundColor: `${accentColor}15` }]}>
        <MaterialIcons name="check-circle" size={64} color={accentColor} />
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{exercise.title}</Text>
          <View style={[styles.durationBadge, { backgroundColor: `${accentColor}15` }]}>
            <MaterialIcons name="timer" size={14} color={accentColor} />
            <Text style={[styles.durationText, { color: accentColor }]}>
              {exercise.duration} min
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
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
