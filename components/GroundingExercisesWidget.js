import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { icons } from '../lib/uiIcons';
import { colors } from '../theme/colors';

const GroundingExercisesWidget = ({ onComplete, onSkip }) => {
  const [currentExercise, setCurrentExercise] = useState(null);
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completedExercises, setCompletedExercises] = useState([]);

  const groundingExercises = [
    {
      id: '5-4-3-2-1',
      title: '5-4-3-2-1 Grounding',
      emoji: '👁️',
      icon: icons.observation,
      duration: '3-5 minutes',
      description: 'Use your senses to anchor yourself in the present moment',
      color: colors.success,
      steps: [
        {
          sense: 'See',
          instruction: 'Name 5 things you can see around you',
          detail: 'Look around and notice: colors, shapes, textures, objects. Say them out loud or in your mind.',
          icon: '👁️'
        },
        {
          sense: 'Touch',
          instruction: 'Name 4 things you can touch or feel',
          detail: 'Notice: your clothes on your skin, your feet in shoes, temperature, chair texture.',
          icon: '✋'
        },
        {
          sense: 'Hear',
          instruction: 'Name 3 things you can hear',
          detail: 'Listen for: distant sounds, your breathing, air conditioning, voices.',
          icon: '👂'
        },
        {
          sense: 'Smell',
          instruction: 'Name 2 things you can smell',
          detail: 'Notice: air freshener, coffee, outdoors, your clothes, cleaning products.',
          icon: '👃'
        },
        {
          sense: 'Taste',
          instruction: 'Name 1 thing you can taste',
          detail: 'Notice: what\'s left in your mouth, gum, breath, or take a sip of water.',
          icon: '👅'
        }
      ]
    },
    {
      id: 'breath-counting',
      title: 'Breath Counting',
      emoji: '💨',
      icon: icons.breath,
      duration: '5 minutes',
      description: 'Calm your nervous system with mindful breathing',
      color: colors.primary,
      instructions: [
        'Sit comfortably and close your eyes if it feels safe',
        'Take a natural breath in and count "1" on the exhale',
        'Continue counting breaths up to 10, then start over',
        'If you lose count, gently return to 1',
        'Focus only on the counting and sensation of breathing'
      ],
      variations: [
        {
          name: 'For Anxiety (Extended Exhale)',
          pattern: 'In for 4, Hold for 4, Out for 8'
        },
        {
          name: 'For Energy (Balanced)',
          pattern: 'In for 4, Hold for 4, Out for 4'
        },
        {
          name: 'For Relaxation (Natural)',
          pattern: 'Breathe naturally, just count the exhales'
        }
      ]
    }
  ];

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setExerciseTimer(timer => timer + 1);
      }, 1000);
    } else if (!isActive && exerciseTimer !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, exerciseTimer]);

  const startExercise = (exerciseId) => {
    setCurrentExercise(exerciseId);
    setExerciseTimer(0);
    setIsActive(true);
  };

  const completeExercise = () => {
    setIsActive(false);
    if (currentExercise && !completedExercises.includes(currentExercise)) {
      setCompletedExercises([...completedExercises, currentExercise]);
    }
    setCurrentExercise(null);
    setExerciseTimer(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderExercisesList = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grounding & Somatic Prep</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.introTitle}>🌱 Practice Regulation Techniques</Text>
        <Text style={styles.introText}>
          These exercises help you practice nervous system regulation before your session. 
          Choose what feels right for you in this moment.
        </Text>

        <View style={styles.exercisesContainer}>
          {groundingExercises.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={[
                styles.exerciseCard,
                completedExercises.includes(exercise.id) && styles.completedCard
              ]}
              onPress={() => startExercise(exercise.id)}
            >
              <View style={styles.exerciseHeader}>
                {exercise.icon ? (
                  <Image source={exercise.icon} style={styles.exerciseIconImage} />
                ) : (
                  <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
                )}
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                  <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
                </View>
                {completedExercises.includes(exercise.id) ? (
                  <MaterialIcons name="check-circle" size={24} color={colors.success} />
                ) : (
                  <MaterialIcons name="arrow-forward-ios" size={16} color={colors.textLight} />
                )}
              </View>
              <Text style={styles.exerciseDescription}>{exercise.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>💡 Preparation Tips</Text>
          <Text style={styles.tipItem}>• Practice 2-3 exercises before your session</Text>
          <Text style={styles.tipItem}>• Notice which techniques work best for you</Text>
          <Text style={styles.tipItem}>• Remember these during your journey if you need grounding</Text>
          <Text style={styles.tipItem}>• There's no "right" way - do what feels supportive</Text>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={onComplete}
        >
          <Text style={styles.continueButtonText}>
            {completedExercises.length > 0 ? 'Continue with Preparation' : 'Skip for Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderCurrentExercise = () => {
    const exercise = groundingExercises.find(ex => ex.id === currentExercise);
    if (!exercise) return renderExercisesList();

    return (
      <View style={styles.container}>
        <View style={styles.exerciseHeader_active}>
          <TouchableOpacity 
            onPress={() => setCurrentExercise(null)}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(exerciseTimer)}</Text>
          </View>
        </View>

        <ScrollView style={styles.exerciseContent}>
          {exercise.icon ? (
            <Image source={exercise.icon} style={styles.currentExerciseIconImage} />
          ) : (
            <Text style={styles.currentExerciseEmoji}>{exercise.emoji}</Text>
          )}
          <Text style={styles.currentExerciseTitle}>{exercise.title}</Text>
          <Text style={styles.currentExerciseDescription}>{exercise.description}</Text>

          {exercise.id === '5-4-3-2-1' && render5432Exercise(exercise)}
          {exercise.id === 'breath-counting' && renderBreathingExercise(exercise)}
        </ScrollView>

        <View style={styles.exerciseFooter}>
          <TouchableOpacity
            style={styles.completeExerciseButton}
            onPress={completeExercise}
          >
            <Text style={styles.completeExerciseButtonText}>Complete Exercise</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const render5432Exercise = (exercise) => (
    <View style={styles.stepsContainer}>
      {exercise.steps.map((step, index) => (
        <View key={index} style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepIcon}>{step.icon}</Text>
            <Text style={styles.stepTitle}>{step.instruction}</Text>
          </View>
          <Text style={styles.stepDetail}>{step.detail}</Text>
        </View>
      ))}
      
      <View style={styles.exerciseGuide}>
        <Text style={styles.guideTitle}>How to practice:</Text>
        <Text style={styles.guideText}>• Go slowly through each step</Text>
        <Text style={styles.guideText}>• Take your time with each sense</Text>
        <Text style={styles.guideText}>• Say items out loud or in your mind</Text>
        <Text style={styles.guideText}>• If you get distracted, gently return to counting</Text>
      </View>
    </View>
  );

  const renderBreathingExercise = (exercise) => (
    <View style={styles.stepsContainer}>
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        {exercise.instructions.map((instruction, index) => (
          <Text key={index} style={styles.instructionItem}>• {instruction}</Text>
        ))}
      </View>

      <View style={styles.variationsContainer}>
        <Text style={styles.variationsTitle}>Choose your breathing pattern:</Text>
        {exercise.variations.map((variation, index) => (
          <View key={index} style={styles.variationCard}>
            <Text style={styles.variationName}>{variation.name}</Text>
            <Text style={styles.variationPattern}>{variation.pattern}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return currentExercise ? renderCurrentExercise() : renderExercisesList();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 60,
  },
  content: {
    padding: 24,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 32,
  },
  exercisesContainer: {
    gap: 16,
    marginBottom: 32,
  },
  exerciseCard: {
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  completedCard: {
    backgroundColor: '#f0fdf4',
    borderColor: colors.success,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  exerciseIconImage: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  exerciseDuration: {
    fontSize: 12,
    color: colors.textLight,
  },
  exerciseDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tipBox: {
    backgroundColor: '#fef7ff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c2d12',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: '#7c2d12',
    marginBottom: 4,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: colors.success,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  exerciseHeader_active: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  timerContainer: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  exerciseContent: {
    flex: 1,
    padding: 24,
  },
  currentExerciseEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  currentExerciseIconImage: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 16,
  },
  currentExerciseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  currentExerciseDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  stepsContainer: {
    gap: 16,
  },
  stepCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  stepDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  exerciseGuide: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  guideText: {
    fontSize: 13,
    color: '#1e40af',
    marginBottom: 4,
  },
  instructionsCard: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 6,
    lineHeight: 20,
  },
  variationsContainer: {
    gap: 12,
  },
  variationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  variationCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  variationName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  variationPattern: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  exerciseFooter: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  completeExerciseButton: {
    backgroundColor: colors.success,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeExerciseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default GroundingExercisesWidget;