import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import educationProgressService from '../lib/educationProgressService';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PolyvagalEducationWidget = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showExercise, setShowExercise] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load saved progress on mount
  useEffect(() => {
    loadProgress();
  }, []);

  // Auto-save progress whenever step changes
  useEffect(() => {
    if (!loading) {
      saveProgress();
    }
  }, [currentStep]);

  const loadProgress = async () => {
    try {
      const progress = await educationProgressService.getProgress('nervous_system');
      if (progress && !progress.completed) {
        setCurrentStep(progress.current_step || 0);
      }
    } catch (error) {
      console.error('Error loading nervous system education progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async () => {
    try {
      await educationProgressService.autoSave(
        'nervous_system',
        currentStep,
        educationSteps.length,
        {}
      );
    } catch (error) {
      console.error('Error saving nervous system education progress:', error);
    }
  };

  const educationSteps = [
    {
      title: "Understanding Your Nervous System",
      content: "Your nervous system has three main states that affect how you feel and respond to the world. Learning to recognize these states can help you understand your experience better.",
      emoji: "🧠"
    },
    {
      title: "Safe & Social (Ventral Vagal)",
      content: "When you feel calm, connected, and curious. Your body feels relaxed, you can think clearly, and you're open to connection with others. This is your optimal state for learning and growth.",
      emoji: "💚",
      examples: [
        "Feeling calm and peaceful",
        "Able to connect with others easily",
        "Curious and open to new experiences",
        "Body feels relaxed and comfortable",
        "Breathing is slow and deep"
      ]
    },
    {
      title: "Activated (Sympathetic)",
      content: "Your fight-or-flight response is active. You might feel energized, anxious, or overwhelmed. Your body is preparing for action - this isn't bad, it's protective!",
      emoji: "⚡",
      examples: [
        "Heart racing or beating fast",
        "Feeling anxious, worried, or on edge",
        "Lots of energy, restless",
        "Thoughts racing or spinning",
        "Feeling overwhelmed or 'too much'"
      ]
    },
    {
      title: "Protected (Dorsal Vagal)",
      content: "Your system has pulled back for protection. You might feel numb, disconnected, or 'shut down'. This is also protective - your nervous system is conserving energy.",
      emoji: "🛡️",
      examples: [
        "Feeling numb or disconnected",
        "Hard to feel emotions",
        "Very tired or heavy",
        "Wanting to withdraw or hide",
        "Feeling like nothing matters"
      ]
    },
    {
      title: "Why This Matters",
      content: "Understanding your nervous system state helps me support you better. There's no 'wrong' state - each one makes sense given your experience. We can work with whatever state you're in.",
      emoji: "🌟"
    }
  ];

  const handleNext = async () => {
    if (currentStep < educationSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark as completed
      try {
        await educationProgressService.markComplete('nervous_system', {});
      } catch (error) {
        console.error('Error marking nervous system education complete:', error);
      }
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartExercise = () => {
    setShowExercise(true);
  };

  const renderEducationStep = () => {
    const step = educationSteps[currentStep];
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepEmoji}>{step.emoji}</Text>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepContent}>{step.content}</Text>
        
        {step.examples && (
          <View style={styles.examplesContainer}>
            <Text style={styles.examplesTitle}>You might notice:</Text>
            {step.examples.map((example, index) => (
              <View key={index} style={styles.exampleItem}>
                <Text style={styles.exampleBullet}>•</Text>
                <Text style={styles.exampleText}>{example}</Text>
              </View>
            ))}
          </View>
        )}
        
        {currentStep === 1 && ( // Safe & Social step
          <TouchableOpacity 
            style={styles.exerciseButton}
            onPress={handleStartExercise}
          >
            <Text style={styles.exerciseButtonText}>Try a Quick Exercise</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderExercise = () => {
    return (
      <View style={styles.exerciseContainer}>
        <Text style={styles.exerciseTitle}>🌱 Finding Your State</Text>
        <Text style={styles.exerciseSubtitle}>Take a moment to notice:</Text>
        
        <View style={styles.exerciseSteps}>
          <View style={styles.exerciseStep}>
            <Text style={styles.exerciseStepTitle}>1. Your Breathing</Text>
            <Text style={styles.exerciseStepText}>Is it fast, slow, shallow, or deep?</Text>
          </View>
          
          <View style={styles.exerciseStep}>
            <Text style={styles.exerciseStepTitle}>2. Your Body</Text>
            <Text style={styles.exerciseStepText}>Are you tense, relaxed, restless, or heavy?</Text>
          </View>
          
          <View style={styles.exerciseStep}>
            <Text style={styles.exerciseStepTitle}>3. Your Energy</Text>
            <Text style={styles.exerciseStepText}>Do you feel activated, calm, or withdrawn?</Text>
          </View>
          
          <View style={styles.exerciseStep}>
            <Text style={styles.exerciseStepTitle}>4. Your Emotions</Text>
            <Text style={styles.exerciseStepText}>What feelings are present right now?</Text>
          </View>
        </View>
        
        <Text style={styles.exerciseNote}>
          There's no right or wrong answer. Just notice with kindness.
        </Text>
        
        <TouchableOpacity 
          style={styles.exerciseCompleteButton}
          onPress={() => setShowExercise(false)}
        >
          <Text style={styles.exerciseCompleteText}>Continue Learning</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProgressBar = () => {
    const progress = (currentStep + 1) / educationSteps.length;
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} of {educationSteps.length}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nervous System Education</Text>
          <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {renderProgressBar()}
        
        {showExercise ? renderExercise() : renderEducationStep()}
      </ScrollView>

      {/* Footer */}
      {!showExercise && (
        <View style={styles.footer}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
              <Text style={styles.previousButtonText}>← Previous</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentStep === educationSteps.length - 1 ? 'Start Assessment' : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stepContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  stepEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepContent: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  examplesContainer: {
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exampleBullet: {
    fontSize: 16,
    color: colors.textSecondary,
    marginRight: 8,
    marginTop: 2,
  },
  exampleText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  exerciseButton: {
    backgroundColor: `${colors.primary}1A`,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  exerciseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  exerciseContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  exerciseTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  exerciseSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  exerciseSteps: {
    marginBottom: 24,
  },
  exerciseStep: {
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  exerciseStepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  exerciseStepText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  exerciseNote: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  exerciseCompleteButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  exerciseCompleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  previousButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  previousButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
};

export default PolyvagalEducationWidget;