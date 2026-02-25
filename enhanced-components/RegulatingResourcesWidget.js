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
import { colors } from '../theme/colors';

/**
 * Regulating Resources Mapping Widget
 * Helps users identify resources that support nervous system regulation
 * Covers individual (self-regulation) and interactive (co-regulation) resources
 */
const RegulatingResourcesWidget = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({
    individualResources: [],
    interactiveResources: []
  });
  const [currentInput, setCurrentInput] = useState('');

  const mappingSteps = [
    // Introduction
    {
      id: 'intro',
      type: 'info',
      title: 'Regulating Resources',
      emoji: '🛠️',
      message: `This exercise helps you identify resources that support nervous system regulation.

We'll explore two types:

🧘 **Individual Resources**
Things you do alone to regulate (breathing, movement, nature, etc.)

🤝 **Interactive Resources**
Ways you co-regulate with others (connection, support, belonging)

Both types are essential for resilience!`,
      buttonText: 'Begin Mapping'
    },

    // Individual Resources
    {
      id: 'individual_intro',
      type: 'info',
      title: 'Individual Resources',
      emoji: '🧘',
      message: `**Individual resources** are practices and activities you can do on your own to support regulation.

They might include:
• Breathing or meditation
• Movement or exercise
• Time in nature
• Creative expression
• Specific sensory experiences
• Solo activities that ground you

Let's identify what works for YOU.`,
      buttonText: 'Continue'
    },
    {
      id: 'individual_1',
      type: 'input',
      category: 'individualResources',
      title: 'Individual Resource #1',
      prompt: "What's one thing you do alone that helps you feel more regulated?",
      placeholder: 'e.g., Going for a walk, journaling, taking a bath...'
    },
    {
      id: 'individual_2',
      type: 'input',
      category: 'individualResources',
      title: 'Individual Resource #2',
      prompt: "What's another individual resource that helps you?",
      placeholder: 'e.g., Breathing exercises, listening to music, cooking...'
    },
    {
      id: 'individual_3',
      type: 'input',
      category: 'individualResources',
      title: 'Individual Resource #3',
      prompt: 'One more individual resource?',
      placeholder: 'e.g., Reading, gardening, yoga...',
      optional: true
    },

    // Interactive Resources
    {
      id: 'interactive_intro',
      type: 'info',
      title: 'Interactive Resources',
      emoji: '🤝',
      message: `**Interactive resources** involve connection with others. We're wired to co-regulate!

These might include:
• Talking with a trusted friend
• Physical affection (hugs, holding hands)
• Being in safe community
• Playing with pets
• Therapy or support groups
• Activities with others

Human connection is powerful medicine for the nervous system.`,
      buttonText: 'Find My Resources'
    },
    {
      id: 'interactive_1',
      type: 'input',
      category: 'interactiveResources',
      title: 'Interactive Resource #1',
      prompt: "What's one way connecting with others helps you regulate?",
      placeholder: 'e.g., Calling a friend, being with my partner, playing with my dog...'
    },
    {
      id: 'interactive_2',
      type: 'input',
      category: 'interactiveResources',
      title: 'Interactive Resource #2',
      prompt: "What's another interactive resource for you?",
      placeholder: 'e.g., Therapy sessions, coffee with a friend, group activities...'
    },
    {
      id: 'interactive_3',
      type: 'input',
      category: 'interactiveResources',
      title: 'Interactive Resource #3',
      prompt: 'One more interactive resource?',
      placeholder: 'e.g., Support group, family time, community events...',
      optional: true
    },

    // Balance Check
    {
      id: 'balance_info',
      type: 'info',
      title: 'Resource Balance',
      emoji: '⚖️',
      message: `It's healthy to have BOTH individual and interactive resources.

🧘 **Too much individual:** Can lead to isolation
🤝 **Too much interactive:** Can lead to burnout or lack of self-sufficiency

The goal is flexible access to both, depending on what you need in the moment.`,
      buttonText: 'See My Map'
    },

    // Summary
    {
      id: 'summary',
      type: 'summary',
      title: 'Your Regulating Resources',
      emoji: '🗺️',
      message: "Here are the resources you've identified:"
    }
  ];

  const handleNext = () => {
    const step = mappingSteps[currentStep];

    if (step.type === 'input') {
      if (!currentInput.trim() && !step.optional) {
        Alert.alert('Please enter a response', 'Take a moment to reflect on what supports your regulation.');
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
        responses,
        balance: {
          individual: responses.individualResources.length,
          interactive: responses.interactiveResources.length
        }
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
      const individualCount = responses.individualResources.length;
      const interactiveCount = responses.interactiveResources.length;
      const totalCount = individualCount + interactiveCount;

      return (
        <View style={styles.stepContainer}>
          {step.emoji && <Text style={styles.stepEmoji}>{step.emoji}</Text>}
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.summaryMessage}>{step.message}</Text>

          {/* Balance Indicator */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceTitle}>Resource Balance</Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceEmoji}>🧘</Text>
                <Text style={styles.balanceCount}>{individualCount}</Text>
                <Text style={styles.balanceLabel}>Individual</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceEmoji}>🤝</Text>
                <Text style={styles.balanceCount}>{interactiveCount}</Text>
                <Text style={styles.balanceLabel}>Interactive</Text>
              </View>
            </View>
            <Text style={styles.balanceNote}>
              You have {totalCount} regulating resources mapped!
              {individualCount > 0 && interactiveCount > 0 && " Great balance between individual and interactive resources."}
            </Text>
          </View>

          {/* Individual Resources */}
          {responses.individualResources.length > 0 && (
            <View style={[styles.summaryCard, { borderLeftColor: colors.primary }]}>
              <Text style={styles.summaryCardTitle}>🧘 Individual Resources</Text>
              {responses.individualResources.map((resource, index) => (
                <View key={index} style={styles.summaryItem}>
                  <Text style={styles.summaryBullet}>•</Text>
                  <Text style={styles.summaryText}>{resource}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Interactive Resources */}
          {responses.interactiveResources.length > 0 && (
            <View style={[styles.summaryCard, { borderLeftColor: '#10b981' }]}>
              <Text style={styles.summaryCardTitle}>🤝 Interactive Resources</Text>
              {responses.interactiveResources.map((resource, index) => (
                <View key={index} style={styles.summaryItem}>
                  <Text style={styles.summaryBullet}>•</Text>
                  <Text style={styles.summaryText}>{resource}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.keyTakeaway}>
            <Text style={styles.keyTakeawayTitle}>💡 Using Your Resources</Text>
            <Text style={styles.keyTakeawayText}>
              <Text style={styles.bold}>When activated (fight/flight):</Text> Try individual resources like breathing, movement, or sensory grounding.{'\n\n'}
              <Text style={styles.bold}>When shutdown:</Text> Start with gentle individual resources, then reach for interactive co-regulation when you're able.{'\n\n'}
              <Text style={styles.bold}>For maintenance:</Text> Use both types regularly to build resilience and expand your window of tolerance.
            </Text>
          </View>
        </View>
      );
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'individualResources': return colors.primary;
      case 'interactiveResources': return '#10b981';
      default: return colors.primary;
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
        <Text style={styles.headerTitle}>Regulating Resources</Text>
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
  stepEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  optionalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
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
    minHeight: 100,
    backgroundColor: colors.background,
  },
  summaryMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  balanceCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  balanceNote: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: colors.background,
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryBullet: {
    fontSize: 16,
    color: colors.text,
    marginRight: 8,
    marginTop: 2,
  },
  summaryText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    flex: 1,
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
  bold: {
    fontWeight: '600',
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

export default RegulatingResourcesWidget;
