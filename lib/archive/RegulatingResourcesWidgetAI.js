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
import huxleyService from '../lib/huxleyService';
import { colors } from '../theme/colors';

/**
 * AI-Enhanced Regulating Resources Mapping Widget
 * Interactive tool to help users identify regulation resources
 * Uses Claude API with offline fallback
 */
const RegulatingResourcesWidgetAI = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({
    individualResources: [],
    interactiveResources: []
  });
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [isAIMode, setIsAIMode] = useState(true);

  const scrollViewRef = useRef(null);
  const aiService = huxleyService;

  useEffect(() => {
    huxleyService.setMode('regulating_resources', { clearHistory: true });
  }, []);

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

Both types are essential for resilience! I'll guide you through mapping these with conversational AI support.`,
      buttonText: 'Begin Mapping'
    },

    // Individual Resources
    {
      id: 'individual_intro',
      type: 'info',
      title: 'Individual Resources',
      emoji: '🧘',
      message: `Let's start with individual resources - practices and activities you can do on your own.

These might include:
• Breathing or meditation
• Movement or exercise
• Time in nature
• Creative expression
• Specific sensory experiences
• Solo activities that ground you

Think of what works for YOU.`,
      buttonText: 'Continue'
    },
    {
      id: 'individual_1',
      type: 'aiInput',
      category: 'individualResources',
      title: 'Individual Resource #1',
      prompt: "What's one thing you do alone that helps you feel more regulated?",
      placeholder: 'e.g., Going for a walk, journaling, taking a bath...'
    },
    {
      id: 'individual_2',
      type: 'aiInput',
      category: 'individualResources',
      title: 'Individual Resource #2',
      prompt: "What's another individual resource that helps you?",
      placeholder: 'e.g., Breathing exercises, listening to music, cooking...'
    },
    {
      id: 'individual_3',
      type: 'aiInput',
      category: 'individualResources',
      title: 'Individual Resource #3',
      prompt: "One more - what else helps you regulate on your own?",
      placeholder: 'e.g., Yoga, reading, gardening, drawing...'
    },

    // Interactive Resources
    {
      id: 'interactive_intro',
      type: 'info',
      title: 'Interactive Resources',
      emoji: '🤝',
      message: `Now let's explore interactive resources - ways you co-regulate with others.

These might include:
• Talking with safe people
• Physical connection (hugs, touch, proximity)
• Being in community or groups
• Asking for and receiving support
• Shared laughter and play
• Feeling seen and heard

Co-regulation is biologically primary - we're wired for it!`,
      buttonText: 'Continue'
    },
    {
      id: 'interactive_1',
      type: 'aiInput',
      category: 'interactiveResources',
      title: 'Interactive Resource #1',
      prompt: "What's one way you regulate through connection with others?",
      placeholder: 'e.g., Talking with my best friend, family dinners, hugs...'
    },
    {
      id: 'interactive_2',
      type: 'aiInput',
      category: 'interactiveResources',
      title: 'Interactive Resource #2',
      prompt: "What's another way others help you feel regulated?",
      placeholder: 'e.g., Being with my partner, group activities, texting friends...'
    },
    {
      id: 'interactive_3',
      type: 'aiInput',
      category: 'interactiveResources',
      title: 'Interactive Resource #3',
      prompt: "One more - what else helps you co-regulate?",
      placeholder: 'e.g., Community gatherings, therapy, playing with pets...'
    },

    // Summary
    {
      id: 'summary',
      type: 'summary',
      title: 'Your Regulation Toolkit',
      message: "Here are the resources you've identified:"
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
        const aiResponse = await aiService.chat(
          currentInput,
          { phase: step.category }
        );

        setIsTyping(false);
        setIsAIMode(aiResponse.isAI);

        // Add AI message
        setAiMessages(prev => [...prev, {
          text: aiResponse.message,
          isAI: aiResponse.isAI,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

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

          {responses.individualResources.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>🧘 Individual Resources</Text>
              <Text style={styles.summarySectionSubtitle}>What you do alone to regulate:</Text>
              {responses.individualResources.map((resource, index) => (
                <Text key={index} style={styles.summaryItem}>• {resource}</Text>
              ))}
            </View>
          )}

          {responses.interactiveResources.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>🤝 Interactive Resources</Text>
              <Text style={styles.summarySectionSubtitle}>How you co-regulate with others:</Text>
              {responses.interactiveResources.map((resource, index) => (
                <Text key={index} style={styles.summaryItem}>• {resource}</Text>
              ))}
            </View>
          )}

          <View style={styles.insightBox}>
            <Text style={styles.insightTitle}>💡 Integration Insight</Text>
            <Text style={styles.insightText}>
              You have {responses.individualResources.length} individual and {responses.interactiveResources.length} interactive resources.
              Having both types gives you flexibility - you can regulate alone when needed and reach out for co-regulation when available.
              These are real tools for your nervous system!
            </Text>
          </View>

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
        <Text style={styles.headerTitle}>Regulating Resources</Text>
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
    marginBottom: 8,
  },
  summarySectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  summaryItem: {
    fontSize: 15,
    color: colors.darkGray,
    lineHeight: 24,
    marginBottom: 8,
  },
  insightBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: 16,
    width: '100%',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
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

export default RegulatingResourcesWidgetAI;
