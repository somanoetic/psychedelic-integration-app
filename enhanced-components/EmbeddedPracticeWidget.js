import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  Animated,
  Dimensions,
  Modal,
  ActivityIndicator,
  ScrollView
} from 'react-native';

import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EmbeddedPracticeWidget = ({ practice, nervousSystemState, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [practiceData, setPracticeData] = useState({});
  const [effectiveness, setEffectiveness] = useState(null);
  
  // Animations
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate widget in
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8
      })
    ]).start();

    // Start pulsing animation for breathing exercises
    if (practice.type === 'breathing_exercise') {
      startPulseAnimation();
    }
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 4000, // Inhale
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 6000, // Exhale
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleStart = () => {
    setIsActive(true);
    setStartTime(Date.now());
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (practice.type === 'polyvagal_assessment') {
      // Special handling for polyvagal assessment
      handlePolyvagalNext();
    } else if (practice.practice && practice.practice.steps) {
      // Regular practice steps
      if (currentStep < practice.practice.steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handlePracticeComplete();
      }
    } else {
      handlePracticeComplete();
    }
  };

  const handlePolyvagalNext = () => {
    if (currentStep === 0 && practiceData.selectedState) {
      if (practiceData.selectedState === 'unsure') {
        // Go to state identification exercise
        setCurrentStep('state_identification');
      } else {
        setCurrentStep(1);
      }
    } else if (currentStep === 1 && practiceData.intensity) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      handlePolyvagalComplete();
    } else if (currentStep === 'state_identification') {
      // After completing the exercise, go back to state selection
      setCurrentStep(0);
    }
  };

  const handlePolyvagalComplete = () => {
    const result = {
      state: practiceData.selectedState,
      intensity: practiceData.intensity,
      notes: practiceData.notes || '',
      practiceType: 'polyvagal_assessment',
      duration: Date.now() - startTime,
      effectiveness: effectiveness || 8
    };
    
    onComplete(result);
  };

  const handlePracticeComplete = () => {
    const duration = startTime ? Date.now() - startTime : 0;
    
    const result = {
      practiceType: practice.type,
      duration: Math.round(duration / 1000), // Convert to seconds
      effectiveness: effectiveness || 7,
      outcome: userInput || 'Practice completed',
      completedSteps: currentStep + 1,
      totalSteps: practice.practice?.steps?.length || 1
    };
    
    onComplete(result);
  };

  const handleSkip = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      onSkip();
    });
  };

  const renderPolyvagalAssessment = () => {
    const stateOptions = [
      {
        id: 'ventral',
        name: 'Safe & Social',
        description: 'Calm, connected, curious',
        color: '#10b981',
        emoji: '💚'
      },
      {
        id: 'sympathetic', 
        name: 'Activated',
        description: 'Energized, anxious, or overwhelmed',
        color: '#ef4444',
        emoji: '⚡'
      },
      {
        id: 'dorsal',
        name: 'Protected',
        description: 'Numb, withdrawn, or heavy',
        color: colors.slate,
        emoji: '🛡️'
      },
      {
        id: 'unsure',
        name: "I'm not sure",
        description: 'Help me figure out my state',
        color: '#6b7280',
        emoji: '🤔'
      }
    ];

    if (currentStep === 0) {
      return (
        <View style={styles.assessmentStep}>
          <Text style={styles.stepTitle}>How is your nervous system right now?</Text>
          <Text style={styles.stepSubtitle}>Choose what feels most true in this moment</Text>
          
          <View style={styles.stateOptions}>
            {stateOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.stateOption,
                  { borderColor: option.color },
                  practiceData.selectedState === option.id && { backgroundColor: option.color + '20' }
                ]}
                onPress={() => setPracticeData({ ...practiceData, selectedState: option.id })}
              >
                <View style={styles.stateOptionHeader}>
                  <Text style={styles.stateEmoji}>{option.emoji}</Text>
                  <Text style={[styles.stateOptionName, { color: option.color }]}>
                    {option.name}
                  </Text>
                </View>
                <Text style={styles.stateOptionDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    if (currentStep === 1) {
      return (
        <View style={styles.assessmentStep}>
          <Text style={styles.stepTitle}>How intense is this feeling?</Text>
          <Text style={styles.stepSubtitle}>1 = very mild, 10 = very strong</Text>
          
          <View style={styles.intensityContainer}>
            <View style={styles.intensityScale}>
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.intensityButton,
                    practiceData.intensity === num && styles.intensityButtonSelected
                  ]}
                  onPress={() => setPracticeData({ ...practiceData, intensity: num })}
                >
                  <Text style={[
                    styles.intensityButtonText,
                    practiceData.intensity === num && styles.intensityButtonTextSelected
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {practiceData.intensity && (
              <Text style={styles.intensityLabel}>
                {practiceData.intensity}/10 - {(() => {
                  const intensity = practiceData.intensity;
                  if (intensity <= 2) return 'Very mild';
                  if (intensity <= 4) return 'Mild';
                  if (intensity <= 6) return 'Moderate';
                  if (intensity <= 8) return 'Strong';
                  return 'Very strong';
                })()}
              </Text>
            )}
          </View>
        </View>
      );
    }

    if (currentStep === 2) {
      return (
        <View style={styles.assessmentStep}>
          <Text style={styles.stepTitle}>Anything else you'd like to share?</Text>
          <Text style={styles.stepSubtitle}>Optional - what's present for you right now?</Text>
          
          <TextInput
            style={styles.notesInput}
            value={practiceData.notes || ''}
            onChangeText={(text) => setPracticeData({ ...practiceData, notes: text })}
            placeholder="What are you noticing in your body, mind, or emotions?"
            multiline
            numberOfLines={4}
          />
        </View>
      );
    }

    if (currentStep === 'state_identification') {
      return (
        <View style={styles.assessmentStep}>
          <Text style={styles.stepTitle}>🌱 Let's explore your current state</Text>
          <Text style={styles.stepSubtitle}>Take a moment to notice each area:</Text>
          
          <View style={styles.identificationExercise}>
            <View style={styles.identificationStep}>
              <Text style={styles.identificationTitle}>Your Breathing 🌬️</Text>
              <Text style={styles.identificationPrompt}>Is it fast, slow, shallow, or deep?</Text>
            </View>
            
            <View style={styles.identificationStep}>
              <Text style={styles.identificationTitle}>Your Body 💪</Text>
              <Text style={styles.identificationPrompt}>Are you tense, relaxed, restless, or heavy?</Text>
            </View>
            
            <View style={styles.identificationStep}>
              <Text style={styles.identificationTitle}>Your Energy ⚡</Text>
              <Text style={styles.identificationPrompt}>Do you feel activated, calm, or withdrawn?</Text>
            </View>
            
            <View style={styles.identificationStep}>
              <Text style={styles.identificationTitle}>Your Heart 💖</Text>
              <Text style={styles.identificationPrompt}>Is it racing, steady, or hard to notice?</Text>
            </View>
            
            <View style={styles.identificationStep}>
              <Text style={styles.identificationTitle}>Your Thoughts 🧠</Text>
              <Text style={styles.identificationPrompt}>Are they racing, clear, or foggy?</Text>
            </View>
          </View>
          
          <View style={styles.identificationHint}>
            <Text style={styles.identificationHintText}>
              🌟 There's no right or wrong answer. Just notice with kindness.
            </Text>
          </View>
        </View>
      );
    }
  };

  const renderBreathingExercise = () => {
    if (!isActive) {
      return (
        <View style={styles.practiceIntro}>
          <Text style={styles.practiceTitle}>{practice.title}</Text>
          <Text style={styles.practiceDescription}>{practice.description}</Text>
          
          {practice.practice && (
            <View style={styles.practiceDetails}>
              <Text style={styles.practiceDetailText}>
                Duration: {practice.practice.duration} minutes
              </Text>
              <Text style={styles.practiceDetailText}>
                {practice.practice.instructions}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.breathingContainer}>
        <Animated.View style={[
          styles.breathingCircle,
          { transform: [{ scale: pulseAnim }] }
        ]}>
          <Text style={styles.breathingPhase}>
          {(() => {
              return Math.round(pulseAnim._value * 10) > 11 ? 'INHALE' : 'EXHALE';
              })()}
            </Text>
        </Animated.View>
        
        {practice.practice && practice.practice.steps && (
          <View style={styles.stepContainer}>
            <Text style={styles.currentStepText}>
              Step {currentStep + 1}: {practice.practice.steps[currentStep]}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderPartsWork = () => {
    const partsPrompts = [
      "What part of you feels most active right now?",
      "What does this part need to feel safer?", 
      "How long has this part been working for you?",
      "What would you like to say to this part?"
    ];

    return (
      <View style={styles.partsContainer}>
        <Text style={styles.partsPrompt}>
          {partsPrompts[currentStep] || practice.practice?.steps?.[currentStep]}
        </Text>
        
        <TextInput
          style={styles.partsInput}
          value={userInput}
          onChangeText={setUserInput}
          placeholder="Take your time to listen inside..."
          multiline
          numberOfLines={4}
        />
      </View>
    );
  };

  const renderGenericPractice = () => {
    if (!practice.practice || !practice.practice.steps) {
      return (
        <View style={styles.genericContainer}>
          <Text style={styles.practiceTitle}>{practice.title}</Text>
          <Text style={styles.practiceDescription}>{practice.description}</Text>
        </View>
      );
    }

    return (
      <View style={styles.genericContainer}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {practice.practice.steps.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep + 1) / practice.practice.steps.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
        
        <Text style={styles.currentStepText}>
          {practice.practice.steps[currentStep]}
        </Text>
      </View>
    );
  };

  const renderContent = () => {
    switch (practice.type) {
      case 'polyvagal_assessment':
        return renderPolyvagalAssessment();
      case 'breathing_exercise':
        return renderBreathingExercise();
      case 'parts_work':
        return renderPartsWork();
      default:
        return renderGenericPractice();
    }
  };

  const renderEffectivenessRating = () => {
    if (!isActive || practice.type === 'polyvagal_assessment') return null;

    return (
      <View style={styles.effectivenessContainer}>
        <Text style={styles.effectivenessTitle}>How helpful was this practice?</Text>
        <View style={styles.starsContainer}>
          {[1,2,3,4,5].map(star => (
            <TouchableOpacity
              key={star}
              onPress={() => setEffectiveness(star * 2)} // Scale to 1-10
              style={styles.starButton}
            >
              <Text style={[
                styles.starEmoji,
                { opacity: effectiveness >= star * 2 ? 1 : 0.3 }
              ]}>
                ⭐
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const canProceed = () => {
    if (practice.type === 'polyvagal_assessment') {
      if (currentStep === 0) return practiceData.selectedState;
      if (currentStep === 1) return practiceData.intensity;
      if (currentStep === 'state_identification') return true; // Always can proceed from exercise
      return true;
    }
    
    if (practice.type === 'parts_work') {
      return userInput.trim().length > 0;
    }
    
    return true;
  };

  const getIntensityLabel = (intensity) => {
    if (intensity <= 2) return 'Very mild';
    if (intensity <= 4) return 'Mild';
    if (intensity <= 6) return 'Moderate';
    if (intensity <= 8) return 'Strong';
    return 'Very strong';
  };

  return (
    <Modal
      visible={true}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerEmoji}>🧘</Text>
              <Text style={styles.headerTitle}>Practice</Text>
            </View>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderContent()}
            {renderEffectivenessRating()}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {!isActive && practice.type !== 'polyvagal_assessment' ? (
              <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                <Text style={styles.buttonEmoji}>▶️</Text>
                <Text style={styles.startButtonText}>Start Practice</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.nextButton,
                  !canProceed() && styles.nextButtonDisabled
                ]}
                onPress={handleNext}
                disabled={!canProceed()}
              >
                <Text style={styles.nextButtonText}>
                  {(() => {
                    if (practice.type === 'polyvagal_assessment' && currentStep === 2) return 'Complete';
                    if (currentStep === (practice.practice?.steps?.length - 1)) return 'Complete';
                    return 'Next';
                  })()}
                </Text>
                <Text style={styles.buttonEmoji}>→</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.8,
    minHeight: SCREEN_HEIGHT * 0.5,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  skipButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  practiceIntro: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  practiceTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  practiceDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  practiceDetails: {
    backgroundColor: colors.offWhite,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  practiceDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  assessmentStep: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  stateOptions: {
    gap: 8,
  },
  stateOption: {
    padding: 12,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: 4,
  },
  stateOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stateOptionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  stateOptionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  intensityContainer: {
    alignItems: 'center',
  },
  intensityScale: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  intensityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  intensityButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  intensityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  intensityButtonTextSelected: {
    color: colors.textInverse,
  },
  intensityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  breathingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  breathingCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: `${colors.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  breathingPhase: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  stepContainer: {
    paddingHorizontal: 20,
  },
  currentStepText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  partsContainer: {
    paddingVertical: 20,
  },
  partsPrompt: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  partsInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  genericContainer: {
    paddingVertical: 20,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  effectivenessContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.offWhite,
    borderRadius: 12,
  },
  effectivenessTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  starEmoji: {
    fontSize: 24,
  },
  stateEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  headerEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  skipText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  buttonEmoji: {
    fontSize: 16,
    color: colors.textInverse,
  },
  identificationExercise: {
    marginTop: 16,
    marginBottom: 24,
  },
  identificationStep: {
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  identificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  identificationPrompt: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  identificationHint: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
  },
  identificationHintText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
  },
  nextButtonDisabled: {
    backgroundColor: colors.mediumGray,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
};

export default EmbeddedPracticeWidget;