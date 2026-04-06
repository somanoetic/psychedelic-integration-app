import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StyleSheet,
  Alert
} from 'react-native';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Polyvagal Mapping Widget
 * Interactive tool to help users identify and map their nervous system states
 */
const PolyvagalMappingWidget = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({
    sympathetic: {},
    dorsal: {},
    ventral: {}
  });
  const [currentInput, setCurrentInput] = useState('');

  const mappingSteps = [
    // Introduction
    {
      id: 'intro',
      type: 'info',
      title: 'Map Your Nervous System States',
      message: `This exercise helps you identify your three nervous system states:

💚 **Ventral Vagal** - Safe & Social (Calm, connected, engaged)
⚡ **Sympathetic** - Fight/Flight (Activated, anxious, energized)
🛡️ **Dorsal Vagal** - Shutdown (Numb, disconnected, withdrawn)

We'll explore what each state looks and feels like for YOU specifically.`,
      buttonText: 'Begin Mapping'
    },

    // Sympathetic State Mapping
    {
      id: 'sympathetic_intro',
      type: 'info',
      title: '⚡ Fight/Flight State',
      message: `Let's start with your **Sympathetic** state - when you feel activated, anxious, or energized.

This is when your body mobilizes for action. It's protective, not bad!

Think of a recent time when you felt:
• Anxious or worried
• Heart racing
• Tense or restless
• Difficulty focusing
• Overwhelmed`,
      buttonText: 'Continue'
    },
    {
      id: 'sympathetic_memory',
      type: 'input',
      state: 'sympathetic',
      key: 'memory',
      title: 'When does this happen?',
      prompt: 'Describe a situation when you feel this activation:',
      placeholder: 'e.g., Before presentations, in crowds, when running late...'
    },
    {
      id: 'sympathetic_body',
      type: 'input',
      state: 'sympathetic',
      key: 'body',
      title: 'Body Sensations',
      prompt: 'What do you notice in your body during these moments?',
      placeholder: 'e.g., Racing heart, tense shoulders, shallow breathing...'
    },
    {
      id: 'sympathetic_thoughts',
      type: 'input',
      state: 'sympathetic',
      key: 'thoughts',
      title: 'Thought Patterns',
      prompt: 'What kinds of thoughts run through your mind?',
      placeholder: 'e.g., "Something bad will happen", "I need to fix this now"...'
    },

    // Dorsal State Mapping
    {
      id: 'dorsal_intro',
      type: 'info',
      title: '🛡️ Shutdown State',
      message: `Now let's explore your **Dorsal Vagal** state - when you feel shutdown or disconnected.

This is when your body conserves energy by immobilizing. Also protective!

Think of times when you felt:
• Numb or disconnected
• Low energy or exhausted
• Hard to care about things
• Wanting to withdraw
• Foggy thinking`,
      buttonText: 'Continue'
    },
    {
      id: 'dorsal_memory',
      type: 'input',
      state: 'dorsal',
      key: 'memory',
      title: 'When does this happen?',
      prompt: 'Describe a situation when you feel this shutdown:',
      placeholder: 'e.g., After conflict, when overwhelmed, during depression...'
    },
    {
      id: 'dorsal_body',
      type: 'input',
      state: 'dorsal',
      key: 'body',
      title: 'Body Sensations',
      prompt: 'What do you notice in your body during these moments?',
      placeholder: 'e.g., Heavy limbs, tired, hard to move, everything feels slow...'
    },
    {
      id: 'dorsal_thoughts',
      type: 'input',
      state: 'dorsal',
      key: 'thoughts',
      title: 'Thought Patterns',
      prompt: 'What kinds of thoughts run through your mind?',
      placeholder: 'e.g., "What\'s the point?", "I can\'t handle this"...'
    },

    // Ventral State Mapping
    {
      id: 'ventral_intro',
      type: 'info',
      title: '💚 Safe & Social State',
      message: `Finally, let's explore your **Ventral Vagal** state - when you feel safe and connected.

This is your optimal state for connection, learning, and integration.

Think of times when you felt:
• Calm and present
• Connected to others
• Able to think clearly
• Curious and engaged
• Safe in your body`,
      buttonText: 'Continue'
    },
    {
      id: 'ventral_memory',
      type: 'input',
      state: 'ventral',
      key: 'memory',
      title: 'When does this happen?',
      prompt: 'Describe a situation when you feel this safety and connection:',
      placeholder: 'e.g., In nature, with close friends, after yoga...'
    },
    {
      id: 'ventral_body',
      type: 'input',
      state: 'ventral',
      key: 'body',
      title: 'Body Sensations',
      prompt: 'What do you notice in your body during these moments?',
      placeholder: 'e.g., Relaxed shoulders, deep breathing, warm chest...'
    },
    {
      id: 'ventral_thoughts',
      type: 'input',
      state: 'ventral',
      key: 'thoughts',
      title: 'Thought Patterns',
      prompt: 'What kinds of thoughts run through your mind?',
      placeholder: 'e.g., "I\'m okay as I am", "Life has beauty"...'
    },

    // Summary
    {
      id: 'summary',
      type: 'summary',
      title: 'Your Nervous System Map',
      message: "Here's what you've discovered about your three states:"
    }
  ];

  const handleNext = () => {
    const step = mappingSteps[currentStep];

    if (step.type === 'input') {
      if (!currentInput.trim()) {
        Alert.alert('Please enter a response', 'Take a moment to reflect and share what comes to mind.');
        return;
      }

      // Save the response
      setResponses(prev => ({
        ...prev,
        [step.state]: {
          ...prev[step.state],
          [step.key]: currentInput
        }
      }));

      setCurrentInput('');
    }

    if (currentStep < mappingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);

      // Restore previous input if going back to an input step
      const prevStep = mappingSteps[currentStep - 1];
      if (prevStep.type === 'input') {
        const savedResponse = responses[prevStep.state]?.[prevStep.key] || '';
        setCurrentInput(savedResponse);
      }
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        timestamp: new Date().toISOString(),
        responses
      });
    }
  };

  const renderStep = () => {
    const step = mappingSteps[currentStep];

    if (step.type === 'info') {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.infoMessage}>{step.message}</Text>
        </View>
      );
    }

    if (step.type === 'input') {
      const stateColor = getStateColor(step.state);

      return (
        <View style={styles.stepContainer}>
          <Text style={[styles.stepTitle, { color: stateColor }]}>
            {step.title}
          </Text>
          <Text style={styles.inputPrompt}>{step.prompt}</Text>
          <TextInput
            style={[styles.textInput, { borderColor: stateColor }]}
            value={currentInput}
            onChangeText={setCurrentInput}
            placeholder={step.placeholder}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      );
    }

    if (step.type === 'summary') {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.summaryMessage}>{step.message}</Text>

          {/* Sympathetic Summary */}
          {responses.sympathetic.memory && (
            <View style={[styles.stateSummary, { borderLeftColor: '#ef4444' }]}>
              <Text style={styles.stateSummaryTitle}>⚡ Fight/Flight State</Text>
              <Text style={styles.stateSummaryText}>
                <Text style={styles.summaryLabel}>When: </Text>
                {responses.sympathetic.memory}
              </Text>
              {responses.sympathetic.body && (
                <Text style={styles.stateSummaryText}>
                  <Text style={styles.summaryLabel}>Body: </Text>
                  {responses.sympathetic.body}
                </Text>
              )}
              {responses.sympathetic.thoughts && (
                <Text style={styles.stateSummaryText}>
                  <Text style={styles.summaryLabel}>Thoughts: </Text>
                  {responses.sympathetic.thoughts}
                </Text>
              )}
            </View>
          )}

          {/* Dorsal Summary */}
          {responses.dorsal.memory && (
            <View style={[styles.stateSummary, { borderLeftColor: colors.slate }]}>
              <Text style={styles.stateSummaryTitle}>🛡️ Shutdown State</Text>
              <Text style={styles.stateSummaryText}>
                <Text style={styles.summaryLabel}>When: </Text>
                {responses.dorsal.memory}
              </Text>
              {responses.dorsal.body && (
                <Text style={styles.stateSummaryText}>
                  <Text style={styles.summaryLabel}>Body: </Text>
                  {responses.dorsal.body}
                </Text>
              )}
              {responses.dorsal.thoughts && (
                <Text style={styles.stateSummaryText}>
                  <Text style={styles.summaryLabel}>Thoughts: </Text>
                  {responses.dorsal.thoughts}
                </Text>
              )}
            </View>
          )}

          {/* Ventral Summary */}
          {responses.ventral.memory && (
            <View style={[styles.stateSummary, { borderLeftColor: '#10b981' }]}>
              <Text style={styles.stateSummaryTitle}>💚 Safe & Social State</Text>
              <Text style={styles.stateSummaryText}>
                <Text style={styles.summaryLabel}>When: </Text>
                {responses.ventral.memory}
              </Text>
              {responses.ventral.body && (
                <Text style={styles.stateSummaryText}>
                  <Text style={styles.summaryLabel}>Body: </Text>
                  {responses.ventral.body}
                </Text>
              )}
              {responses.ventral.thoughts && (
                <Text style={styles.stateSummaryText}>
                  <Text style={styles.summaryLabel}>Thoughts: </Text>
                  {responses.ventral.thoughts}
                </Text>
              )}
            </View>
          )}

          <View style={styles.keyTakeaway}>
            <Text style={styles.keyTakeawayTitle}>🎯 Remember</Text>
            <Text style={styles.keyTakeawayText}>
              All three states are normal and protective. The key is recognizing which state you're in so you can respond with compassion and choose practices that help you shift when needed.
            </Text>
          </View>
        </View>
      );
    }
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'sympathetic': return '#ef4444';
      case 'dorsal': return colors.slate;
      case 'ventral': return '#10b981';
      default: return colors.primary;
    }
  };

  const step = mappingSteps[currentStep];
  const isLastStep = currentStep === mappingSteps.length - 1;
  const progress = ((currentStep + 1) / mappingSteps.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipButton}>← Back to Education</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Polyvagal Mapping</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>
        Step {currentStep + 1} of {mappingSteps.length}
      </Text>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {renderStep()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          onPress={handleBack}
          disabled={currentStep === 0}
          style={[
            styles.navButton,
            styles.backButton,
            currentStep === 0 && styles.navButtonDisabled
          ]}
        >
          <Text style={[
            styles.navButtonText,
            currentStep === 0 && styles.navButtonTextDisabled
          ]}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          style={[styles.navButton, styles.nextButton]}
        >
          <Text style={styles.nextButtonText}>
            {isLastStep ? 'Complete ✓' : step.type === 'info' ? step.buttonText || 'Next' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  skipButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.lightGray,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 32,
  },
  stepContainer: {
    gap: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoMessage: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
  },
  inputPrompt: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
    backgroundColor: colors.background,
  },
  summaryMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  stateSummary: {
    backgroundColor: colors.background,
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  stateSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  stateSummaryText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  summaryLabel: {
    fontWeight: '600',
    color: colors.text,
  },
  keyTakeaway: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  keyTakeawayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
  },
  keyTakeawayText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    backgroundColor: colors.surface,
  },
  navButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: colors.offWhite,
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  navButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  navButtonTextDisabled: {
    color: colors.mediumGray,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
});

export default PolyvagalMappingWidget;
