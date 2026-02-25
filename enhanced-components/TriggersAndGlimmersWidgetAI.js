import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TriggersGlimmersAIService } from '../lib/triggersGlimmersAIService';
import { colors } from '../theme/colors';

/**
 * AI-Enhanced Triggers & Glimmers Mapping Widget
 * Interactive tool to help users identify triggers and glimmers
 * Uses Claude API with offline fallback
 */
const TriggersAndGlimmersWidgetAI = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({
    sympatheticTriggers: [],
    dorsalTriggers: [],
    glimmers: []
  });
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [isAIMode, setIsAIMode] = useState(true);

  const scrollViewRef = useRef(null);
  const aiService = useRef(new TriggersGlimmersAIService()).current;

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

I'll guide you through mapping these with conversational AI support. Understanding your triggers helps you prepare for them. Discovering your glimmers helps you cultivate more safety.`,
      buttonText: 'Begin Mapping'
    },

    // Sympathetic Triggers
    {
      id: 'sympathetic_intro',
      type: 'info',
      title: 'Fight/Flight Triggers',
      emoji: '⚡',
      message: `Let's start with triggers that activate your fight/flight response.

These might be:
• External (sounds, smells, situations, people)
• Internal (thoughts, memories, sensations)
• Obvious or subtle

Take a moment to think of what often triggers anxiety, overwhelm, or agitation for you.`,
      buttonText: 'Continue'
    },
    {
      id: 'sympathetic_trigger_1',
      type: 'aiInput',
      category: 'sympatheticTriggers',
      title: 'Sympathetic Trigger #1',
      prompt: "What's one thing that often triggers your fight/flight response?",
      placeholder: 'e.g., Loud sudden noises, time pressure, conflict...'
    },
    {
      id: 'sympathetic_trigger_2',
      type: 'aiInput',
      category: 'sympatheticTriggers',
      title: 'Sympathetic Trigger #2',
      prompt: "What's another fight/flight trigger for you?",
      placeholder: 'e.g., Feeling judged, crowded spaces...'
    },

    // Dorsal Triggers
    {
      id: 'dorsal_intro',
      type: 'info',
      title: 'Shutdown Triggers',
      emoji: '🛡️',
      message: `Now let's explore triggers that lead to shutdown or disconnection.

These might be:
• Prolonged stress or overwhelm
• Feeling trapped or helpless
• Rejection or isolation
• Shame or feeling unseen

Think of what leads you to feel numb, collapsed, or withdrawn.`,
      buttonText: 'Continue'
    },
    {
      id: 'dorsal_trigger_1',
      type: 'aiInput',
      category: 'dorsalTriggers',
      title: 'Shutdown Trigger #1',
      prompt: "What's one thing that triggers shutdown or disconnection for you?",
      placeholder: 'e.g., Feeling unheard, isolation, exhaustion...'
    },
    {
      id: 'dorsal_trigger_2',
      type: 'aiInput',
      category: 'dorsalTriggers',
      title: 'Shutdown Trigger #2',
      prompt: "What's another shutdown trigger you notice?",
      placeholder: 'e.g., Criticism, feeling trapped, hopelessness...'
    },

    // Glimmers
    {
      id: 'glimmers_intro',
      type: 'info',
      title: 'Glimmers of Safety',
      emoji: '✨',
      message: `Now for the beautiful part - your glimmers!

Glimmers are micro-moments that help your nervous system feel safe:
• Sensory: warm sun, favorite song, soft texture, pleasant smell
• Relational: a kind word, eye contact, feeling seen
• Environmental: nature, comfortable space, beauty

Even tiny glimmers matter. They build regulation capacity.`,
      buttonText: 'Continue'
    },
    {
      id: 'glimmer_1',
      type: 'aiInput',
      category: 'glimmers',
      title: 'Glimmer #1',
      prompt: "What's one small thing that helps you feel safe or connected?",
      placeholder: 'e.g., Morning coffee, bird songs, a hug, sunset...'
    },
    {
      id: 'glimmer_2',
      type: 'aiInput',
      category: 'glimmers',
      title: 'Glimmer #2',
      prompt: "What's another glimmer you experience?",
      placeholder: 'e.g., Favorite music, pets, laughter, nature walk...'
    },
    {
      id: 'glimmer_3',
      type: 'aiInput',
      category: 'glimmers',
      title: 'Glimmer #3',
      prompt: "One more glimmer - what else brings micro-moments of safety?",
      placeholder: 'e.g., Cozy blanket, starry sky, kind text, fresh air...'
    },

    // Summary
    {
      id: 'summary',
      type: 'summary',
      title: 'Your Trigger & Glimmer Map',
      message: "Here's what you've discovered:"
    }
  ];

  useEffect(() => {
    if (scrollViewRef.current && aiMessages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [aiMessages, isTyping]);

  const handleNext = async () => {
    const step = mappingSteps[currentStep];

    if (step.type === 'aiInput') {
      if (!currentInput.trim()) {
        Alert.alert('Please enter a response', 'Take a moment to reflect and share what comes to mind.');
        return;
      }

      // Save the response
      setResponses(prev => ({
        ...prev,
        [step.category]: [...prev[step.category], currentInput]
      }));

      // Get AI response
      setIsTyping(true);
      try {
        const aiResponse = await aiService.sendMessage(
          currentInput,
          step.category
        );

        setIsTyping(false);
        setIsAIMode(aiResponse.isAI);

        // Add AI message
        setAiMessages(prev => [...prev, {
          text: aiResponse.response,
          isAI: aiResponse.isAI,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        // Save to service
        aiService.saveResponse(step.category, currentInput);

      } catch (error) {
        setIsTyping(false);
        console.error('AI response error:', error);
      }

      setCurrentInput('');
    }

    // Move to next step
    if (currentStep < mappingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setAiMessages([]); // Clear messages for next step
    }
  };

  const handleSkipStep = () => {
    if (currentStep < mappingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setAiMessages([]);
      setCurrentInput('');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setAiMessages([]);
      setCurrentInput('');
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(responses);
    }
  };

  const renderStep = () => {
    const step = mappingSteps[currentStep];

    if (step.type === 'info') {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepEmoji}>{step.emoji}</Text>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepMessage}>{step.message}</Text>
          <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
            <Text style={styles.continueButtonText}>{step.buttonText}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step.type === 'aiInput') {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepPrompt}>{step.prompt}</Text>

          {/* AI Messages */}
          {aiMessages.length > 0 && (
            <View style={styles.aiMessagesContainer}>
              {aiMessages.map((msg, index) => (
                <View key={index} style={styles.aiMessageBubble}>
                  <Text style={styles.aiMessageText}>{msg.text}</Text>
                  <Text style={styles.aiMessageTimestamp}>{msg.timestamp}</Text>
                  {!msg.isAI && (
                    <Text style={styles.offlineIndicator}>Offline mode</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <View style={styles.typingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.typingText}>Reflecting on your response...</Text>
            </View>
          )}

          {/* Input */}
          <TextInput
            style={styles.input}
            placeholder={step.placeholder}
            placeholderTextColor="#9ca3af"
            value={currentInput}
            onChangeText={setCurrentInput}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkipStep}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (step.type === 'summary') {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepMessage}>{step.message}</Text>

          {responses.sympatheticTriggers.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>⚡ Fight/Flight Triggers</Text>
              {responses.sympatheticTriggers.map((trigger, index) => (
                <Text key={index} style={styles.summaryItem}>• {trigger}</Text>
              ))}
            </View>
          )}

          {responses.dorsalTriggers.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>🛡️ Shutdown Triggers</Text>
              {responses.dorsalTriggers.map((trigger, index) => (
                <Text key={index} style={styles.summaryItem}>• {trigger}</Text>
              ))}
            </View>
          )}

          {responses.glimmers.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>✨ Glimmers</Text>
              {responses.glimmers.map((glimmer, index) => (
                <Text key={index} style={styles.summaryItem}>• {glimmer}</Text>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Text style={styles.completeButtonText}>Complete Mapping ✓</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const progressPercentage = ((currentStep + 1) / mappingSteps.length) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={currentStep === 0 ? onSkip : handleBack}>
          <Text style={styles.backButton}>{currentStep === 0 ? '← Exit' : '← Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Triggers & Glimmers</Text>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* AI Mode Indicator */}
      {!isAIMode && currentStep > 0 && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>⚠️ Offline mode - using fallback responses</Text>
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  skipText: {
    fontSize: 16,
    color: colors.primary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.lightGray,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  stepMessage: {
    fontSize: 16,
    color: colors.darkGray,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  stepPrompt: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
  },
  continueButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  aiMessagesContainer: {
    width: '100%',
    marginBottom: 16,
  },
  aiMessageBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  aiMessageText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  aiMessageTimestamp: {
    fontSize: 12,
    color: colors.mediumGray,
    marginTop: 8,
  },
  offlineIndicator: {
    fontSize: 11,
    color: '#f59e0b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typingText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    width: '100%',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.sand,
    marginRight: 12,
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  nextButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  nextButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  summarySection: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  summarySectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  summaryItem: {
    fontSize: 15,
    color: colors.darkGray,
    lineHeight: 24,
    marginBottom: 8,
  },
  completeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
    minWidth: 200,
  },
  completeButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  offlineBanner: {
    backgroundColor: '#fef3c7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#fde68a',
  },
  offlineBannerText: {
    fontSize: 13,
    color: '#92400e',
    textAlign: 'center',
  },
});

export default TriggersAndGlimmersWidgetAI;
