import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Triggers & Glimmers Mapping Widget
 * Helps users identify what moves them into dysregulation (triggers)
 * and what brings them back to safety (glimmers)
 */
const TriggersAndGlimmersWidget = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({
    sympatheticTriggers: [],
    dorsalTriggers: [],
    glimmers: []
  });
  const [currentInput, setCurrentInput] = useState('');

  const mappingSteps = [
    // Introduction
    {
      id: 'intro',
      type: 'info',
      title: 'Triggers & Glimmers',
      emoji: '⚡✨',
      message: `This exercise helps you identify:

⚡ **Triggers** - What moves you into dysregulation
✨ **Glimmers** - Micro-moments of safety and connection

Understanding your triggers helps you prepare for them.
Discovering your glimmers helps you cultivate more safety.`,
      buttonText: 'Begin Mapping'
    },

    // Sympathetic Triggers
    {
      id: 'sympathetic_intro',
      type: 'info',
      title: 'Fight/Flight Triggers',
      emoji: '⚡',
      message: `**Triggers** are cues that move your nervous system into activation.

They might be:
• External (sounds, smells, situations, people)
• Internal (thoughts, memories, sensations)
• Obvious or subtle

Let's identify what triggers your **fight/flight** response (anxiety, agitation, overwhelm).`,
      buttonText: 'Continue'
    },
    {
      id: 'sympathetic_trigger_1',
      type: 'input',
      category: 'sympatheticTriggers',
      title: 'Sympathetic Trigger #1',
      prompt: "What's one thing that often triggers your fight/flight response?",
      placeholder: 'e.g., Loud sudden noises, time pressure, conflict...'
    },
    {
      id: 'sympathetic_trigger_2',
      type: 'input',
      category: 'sympatheticTriggers',
      title: 'Sympathetic Trigger #2',
      prompt: "What's another fight/flight trigger for you?",
      placeholder: 'e.g., Feeling judged, crowded spaces...',
      optional: true
    },

    // Dorsal Triggers
    {
      id: 'dorsal_intro',
      type: 'info',
      title: 'Shutdown Triggers',
      emoji: '🛡️',
      message: `Now let's identify triggers for your **shutdown** response.

These move you into:
• Numbness or disconnection
• Withdrawal or isolation
• Low energy or collapse
• Feeling frozen

These often come after prolonged activation or when threat feels overwhelming.`,
      buttonText: 'Continue'
    },
    {
      id: 'dorsal_trigger_1',
      type: 'input',
      category: 'dorsalTriggers',
      title: 'Dorsal Trigger #1',
      prompt: "What's one thing that often triggers your shutdown response?",
      placeholder: 'e.g., Harsh criticism, feeling helpless, too much stimulation...'
    },
    {
      id: 'dorsal_trigger_2',
      type: 'input',
      category: 'dorsalTriggers',
      title: 'Dorsal Trigger #2',
      prompt: "What's another shutdown trigger for you?",
      placeholder: 'e.g., Feeling trapped, prolonged stress...',
      optional: true
    },

    // Glimmers
    {
      id: 'glimmers_intro',
      type: 'info',
      title: 'Glimmers of Safety',
      emoji: '✨',
      message: `**Glimmers** are the opposite of triggers - they're micro-moments that help your nervous system feel safe.

Glimmers might be:
• A warm cup of tea
• Sunlight on your face
• Your pet's greeting
• A friend's smile
• A favorite song

They're small but powerful cues of safety. Let's find yours!`,
      buttonText: 'Find My Glimmers'
    },
    {
      id: 'glimmer_1',
      type: 'input',
      category: 'glimmers',
      title: 'Glimmer #1',
      prompt: "What's one small thing that brings you a sense of safety or peace?",
      placeholder: 'e.g., Morning coffee, bird sounds, cozy blanket...'
    },
    {
      id: 'glimmer_2',
      type: 'input',
      category: 'glimmers',
      title: 'Glimmer #2',
      prompt: "What's another glimmer for you?",
      placeholder: 'e.g., A hug, gentle music, being in nature...'
    },
    {
      id: 'glimmer_3',
      type: 'input',
      category: 'glimmers',
      title: 'Glimmer #3',
      prompt: 'One more glimmer?',
      placeholder: 'e.g., Laughter, a familiar scent, a favorite place...',
      optional: true
    },

    // Summary
    {
      id: 'summary',
      type: 'summary',
      title: 'Your Triggers & Glimmers',
      emoji: '🗺️',
      message: "Here's what you've discovered:"
    }
  ];

  const handleNext = () => {
    const step = mappingSteps[currentStep];

    if (step.type === 'input') {
      if (!currentInput.trim() && !step.optional) {
        Alert.alert('Please enter a response', 'Take a moment to reflect on this question.');
        return;
      }

      // Save the response
      if (currentInput.trim()) {
        setResponses(prev => ({
          ...prev,
          [step.category]: [...prev[step.category], currentInput]
        }));
      }

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
      setCurrentInput('');
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
          {step.emoji && <Text style={styles.stepEmoji}>{step.emoji}</Text>}
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.infoMessage}>{step.message}</Text>
        </View>
      );
    }

    if (step.type === 'input') {
      const categoryColor = getCategoryColor(step.category);

      return (
        <View style={styles.stepContainer}>
          <Text style={[styles.stepTitle, { color: categoryColor }]}>
            {step.title}
          </Text>
          {step.optional && (
            <Text style={styles.optionalLabel}>(Optional - skip if you'd like)</Text>
          )}
          <Text style={styles.inputPrompt}>{step.prompt}</Text>
          <TextInput
            style={[styles.textInput, { borderColor: categoryColor }]}
            value={currentInput}
            onChangeText={setCurrentInput}
            placeholder={step.placeholder}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      );
    }

    if (step.type === 'summary') {
      return (
        <View style={styles.stepContainer}>
          {step.emoji && <Text style={styles.stepEmoji}>{step.emoji}</Text>}
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.summaryMessage}>{step.message}</Text>

          {/* Sympathetic Triggers */}
          {responses.sympatheticTriggers.length > 0 && (
            <View style={[styles.summaryCard, { borderLeftColor: '#ef4444' }]}>
              <Text style={styles.summaryCardTitle}>⚡ Fight/Flight Triggers</Text>
              {responses.sympatheticTriggers.map((trigger, index) => (
                <View key={index} style={styles.summaryItem}>
                  <Text style={styles.summaryBullet}>•</Text>
                  <Text style={styles.summaryText}>{trigger}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Dorsal Triggers */}
          {responses.dorsalTriggers.length > 0 && (
            <View style={[styles.summaryCard, { borderLeftColor: '#6366f1' }]}>
              <Text style={styles.summaryCardTitle}>🛡️ Shutdown Triggers</Text>
              {responses.dorsalTriggers.map((trigger, index) => (
                <View key={index} style={styles.summaryItem}>
                  <Text style={styles.summaryBullet}>•</Text>
                  <Text style={styles.summaryText}>{trigger}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Glimmers */}
          {responses.glimmers.length > 0 && (
            <View style={[styles.summaryCard, { borderLeftColor: '#10b981' }]}>
              <Text style={styles.summaryCardTitle}>✨ Glimmers of Safety</Text>
              {responses.glimmers.map((glimmer, index) => (
                <View key={index} style={styles.summaryItem}>
                  <Text style={styles.summaryBullet}>✨</Text>
                  <Text style={styles.summaryText}>{glimmer}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.keyTakeaway}>
            <Text style={styles.keyTakeawayTitle}>💡 Using This Map</Text>
            <Text style={styles.keyTakeawayText}>
              <Text style={styles.bold}>When you notice triggers:</Text> Name them ("This is a trigger"), remember they're not your fault, and reach for a glimmer or regulation practice.{'\n\n'}
              <Text style={styles.bold}>Cultivate glimmers:</Text> Intentionally seek out these micro-moments of safety throughout your day. The more you notice them, the more your nervous system learns to find safety.
            </Text>
          </View>
        </View>
      );
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'sympatheticTriggers': return '#ef4444';
      case 'dorsalTriggers': return '#6366f1';
      case 'glimmers': return '#10b981';
      default: return '#3b82f6';
    }
  };

  const step = mappingSteps[currentStep];
  const isLastStep = currentStep === mappingSteps.length - 1;
  const progress = ((currentStep + 1) / mappingSteps.length) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipButton}>← Back to Education</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Triggers & Glimmers</Text>
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
            {isLastStep ? 'Complete ✓' : step.type === 'info' ? step.buttonText || 'Next' : step.optional ? 'Skip / Next →' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  skipButton: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
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
  stepEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  optionalLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  infoMessage: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 26,
  },
  inputPrompt: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 100,
    backgroundColor: '#f9fafb',
  },
  summaryMessage: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#f9fafb',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryBullet: {
    fontSize: 16,
    color: '#1f2937',
    marginRight: 8,
    marginTop: 2,
  },
  summaryText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    flex: 1,
  },
  keyTakeaway: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  keyTakeawayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  keyTakeawayText: {
    fontSize: 15,
    color: '#1e40af',
    lineHeight: 22,
  },
  bold: {
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  navButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#f3f4f6',
  },
  nextButton: {
    backgroundColor: '#3b82f6',
  },
  navButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  navButtonTextDisabled: {
    color: '#9ca3af',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default TriggersAndGlimmersWidget;
