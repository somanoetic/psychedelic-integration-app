import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import educationProgressService from '../lib/educationProgressService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NervousSystemEducationWidget = ({ onComplete, onSkip }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userResponses, setUserResponses] = useState({});
  const [loading, setLoading] = useState(true);

  // Load saved progress on mount
  useEffect(() => {
    loadProgress();
  }, []);

  // Auto-save progress whenever state changes
  useEffect(() => {
    if (!loading) {
      saveProgress();
    }
  }, [currentSlide, userResponses]);

  const loadProgress = async () => {
    try {
      const progress = await educationProgressService.getProgress('nervous_system');
      if (progress && !progress.completed) {
        setCurrentSlide(progress.current_step || 0);
        if (progress.progress_data) {
          setUserResponses(progress.progress_data.userResponses || {});
        }
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
        currentSlide,
        educationSlides.length,
        { userResponses }
      );
    } catch (error) {
      console.error('Error saving nervous system education progress:', error);
    }
  };

  const educationSlides = [
    {
      id: 'intro',
      title: 'Your Nervous System',
      emoji: '🧠',
      content: `Your nervous system is constantly scanning for safety and threat. Understanding these states helps you navigate your psychedelic experience with greater awareness and self-compassion.`,
      type: 'info'
    },
    {
      id: 'ventral_vagal',
      title: 'Safe & Social State',
      emoji: '🌱',
      color: '#10b981',
      content: `In this state, you feel calm, connected, and curious. Your heart rate is steady, breathing is easy, and you're able to learn and connect with others.`,
      characteristics: [
        'Feeling curious and open',
        'Able to think clearly',
        'Connected to others',
        'Breathing feels easy and natural',
        'Heart rate is calm and steady'
      ],
      examples: [
        'Having a meaningful conversation with a friend',
        'Feeling excited to learn something new',
        'Cuddling with a pet or loved one',
        'Laughing genuinely at something funny'
      ],
      type: 'state_info'
    },
    {
      id: 'sympathetic',
      title: 'Fight or Flight State',
      emoji: '⚡',
      color: '#f59e0b',
      content: `This is your mobilized protection state. Energy is high, but so is anxiety. Your system is ready for action to protect you from perceived threats.`,
      characteristics: [
        'Heart racing or pounding',
        'Feeling anxious or worried',
        'Mind racing with thoughts',
        'Muscles feeling tense',
        'Hard to sit still or relax'
      ],
      examples: [
        'Before a big presentation or exam',
        'When running late for something important',
        'Hearing unexpected loud noises',
        'Feeling overwhelmed by too many tasks'
      ],
      type: 'state_info'
    },
    {
      id: 'dorsal_vagal',
      title: 'Shutdown State',
      emoji: '🛡️',
      color: '#6b7280',
      content: `When fight or flight doesn't work, your system shuts down for protection. You might feel numb, disconnected, or like you're watching life from the outside.`,
      characteristics: [
        'Feeling numb or empty',
        'Difficulty connecting with others',
        'Low energy or motivation',
        'Feeling disconnected from your body',
        'Hard to care about things that usually matter'
      ],
      examples: [
        'After receiving overwhelming bad news',
        'During periods of deep grief or loss',
        'When feeling completely overwhelmed',
        'After experiencing trauma or betrayal'
      ],
      type: 'state_info'
    },
    {
      id: 'state_check',
      title: 'Check Your Current State',
      emoji: '🌡️',
      content: `Let's practice identifying your current nervous system state. There's no right or wrong answer - just notice what's true for you right now.`,
      type: 'assessment',
      question: 'Which state feels most true for you right now?',
      options: [
        {
          id: 'ventral',
          label: '🌱 Safe & Social',
          description: 'Calm, connected, curious'
        },
        {
          id: 'sympathetic',
          label: '⚡ Fight/Flight',
          description: 'Energized, anxious, activated'
        },
        {
          id: 'dorsal',
          label: '🛡️ Shutdown',
          description: 'Numb, disconnected, low energy'
        }
      ]
    },
    {
      id: 'regulation_intro',
      title: 'Regulation During Sessions',
      emoji: '🌊',
      content: `During your psychedelic session, you might move between these states. Knowing simple regulation techniques can help you navigate these transitions with greater ease.`,
      type: 'info'
    },
    {
      id: 'ventral_practices',
      title: 'Staying in Safety',
      emoji: '🌱',
      color: '#10b981',
      content: `When you're feeling safe and connected, these practices help you stay grounded:`,
      practices: [
        {
          name: 'Gentle Breathing',
          description: 'Breathe naturally and notice the rhythm',
          instruction: 'In for 4, hold for 2, out for 6'
        },
        {
          name: 'Body Appreciation',
          description: 'Thank your body for keeping you safe',
          instruction: 'Place hands on heart and breathe gratitude'
        },
        {
          name: 'Connection Awareness',
          description: 'Notice your support system',
          instruction: 'Remember who loves and cares for you'
        }
      ],
      type: 'practices'
    },
    {
      id: 'sympathetic_practices',
      title: 'Calming Activation',
      emoji: '⚡',
      color: '#f59e0b',
      content: `When feeling anxious or activated, these practices help calm your system:`,
      practices: [
        {
          name: 'Extended Exhale',
          description: 'Longer exhales activate your calm response',
          instruction: 'In for 4, hold for 4, out for 8'
        },
        {
          name: 'Progressive Relaxation',
          description: 'Release muscle tension',
          instruction: 'Tense for 5 seconds, then release completely'
        },
        {
          name: 'Grounding Objects',
          description: 'Connect with something solid and safe',
          instruction: 'Hold your comfort item and feel its texture'
        }
      ],
      type: 'practices'
    },
    {
      id: 'dorsal_practices',
      title: 'Gentle Reconnection',
      emoji: '🛡️',
      color: '#6b7280',
      content: `When feeling shut down or numb, these practices help gentle reconnection:`,
      practices: [
        {
          name: 'Gentle Movement',
          description: 'Small movements to wake up your system',
          instruction: 'Wiggle fingers and toes, gentle neck rolls'
        },
        {
          name: 'Warm Self-Touch',
          description: 'Comfort through gentle contact',
          instruction: 'Hands on heart, gentle self-hug'
        },
        {
          name: 'Soft Sounds',
          description: 'Gentle stimulation through humming',
          instruction: 'Hum softly or make gentle "ahh" sounds'
        }
      ],
      type: 'practices'
    },
    {
      id: 'session_guidance',
      title: 'During Your Session',
      emoji: '🧭',
      content: `Remember these key points during your psychedelic experience:`,
      guidance: [
        {
          icon: '🌟',
          text: 'All states are normal and temporary'
        },
        {
          icon: '🧘',
          text: 'Use your anchor: "Trust. Let go. Be open."'
        },
        {
          icon: '🤲',
          text: 'Your support team is there if you need help'
        },
        {
          icon: '💚',
          text: 'Be compassionate with whatever arises'
        }
      ],
      type: 'guidance'
    },
    {
      id: 'completion',
      title: 'Well Done!',
      emoji: '✨',
      content: `You now have a foundation for understanding your nervous system. This awareness will serve you well during your healing journey.`,
      type: 'completion'
    }
  ];

  const nextSlide = async () => {
    if (currentSlide < educationSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Mark as completed before finishing
      try {
        await educationProgressService.saveProgress(
          'nervous_system',
          educationSlides.length,
          educationSlides.length,
          { userResponses },
          true // completed
        );
        console.log('[Nervous System Education] Marked as completed');
      } catch (error) {
        console.error('Error marking nervous system education complete:', error);
      }
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleAssessmentResponse = (responseId) => {
    setUserResponses({
      ...userResponses,
      [educationSlides[currentSlide].id]: responseId
    });
  };

  const renderSlide = () => {
    const slide = educationSlides[currentSlide];

    switch (slide.type) {
      case 'info':
        return (
          <View style={styles.slideContent}>
            <Text style={styles.slideEmoji}>{slide.emoji}</Text>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideText}>{slide.content}</Text>
          </View>
        );

      case 'state_info':
        return (
          <View style={styles.slideContent}>
            <Text style={styles.slideEmoji}>{slide.emoji}</Text>
            <Text style={[styles.slideTitle, { color: slide.color }]}>{slide.title}</Text>
            <Text style={styles.slideText}>{slide.content}</Text>
            
            <View style={styles.characteristicsSection}>
              <Text style={styles.subsectionTitle}>What this feels like:</Text>
              {slide.characteristics.map((char, index) => (
                <View key={index} style={styles.characteristicItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.characteristicText}>{char}</Text>
                </View>
              ))}
            </View>

            <View style={styles.examplesSection}>
              <Text style={styles.subsectionTitle}>Common examples:</Text>
              {slide.examples.map((example, index) => (
                <View key={index} style={styles.exampleItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.exampleText}>{example}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 'assessment':
        return (
          <View style={styles.slideContent}>
            <Text style={styles.slideEmoji}>{slide.emoji}</Text>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideText}>{slide.content}</Text>
            
            <Text style={styles.questionText}>{slide.question}</Text>
            
            <View style={styles.optionsContainer}>
              {slide.options.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    userResponses[slide.id] === option.id && styles.selectedOption
                  ]}
                  onPress={() => handleAssessmentResponse(option.id)}
                >
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'practices':
        return (
          <View style={styles.slideContent}>
            <Text style={styles.slideEmoji}>{slide.emoji}</Text>
            <Text style={[styles.slideTitle, { color: slide.color }]}>{slide.title}</Text>
            <Text style={styles.slideText}>{slide.content}</Text>
            
            <View style={styles.practicesContainer}>
              {slide.practices.map((practice, index) => (
                <View key={index} style={styles.practiceCard}>
                  <Text style={styles.practiceName}>{practice.name}</Text>
                  <Text style={styles.practiceDescription}>{practice.description}</Text>
                  <View style={styles.instructionBox}>
                    <Text style={styles.instructionText}>{practice.instruction}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );

      case 'guidance':
        return (
          <View style={styles.slideContent}>
            <Text style={styles.slideEmoji}>{slide.emoji}</Text>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideText}>{slide.content}</Text>
            
            <View style={styles.guidanceContainer}>
              {slide.guidance.map((item, index) => (
                <View key={index} style={styles.guidanceItem}>
                  <Text style={styles.guidanceIcon}>{item.icon}</Text>
                  <Text style={styles.guidanceText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 'completion':
        return (
          <View style={styles.slideContent}>
            <Text style={styles.slideEmoji}>{slide.emoji}</Text>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideText}>{slide.content}</Text>
            
            <View style={styles.completionBox}>
              <Text style={styles.completionTitle}>🎯 Key Takeaways:</Text>
              <Text style={styles.completionItem}>• You have three main nervous system states</Text>
              <Text style={styles.completionItem}>• All states are normal and protective</Text>
              <Text style={styles.completionItem}>• Simple practices can help with regulation</Text>
              <Text style={styles.completionItem}>• Awareness brings self-compassion</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentSlide + 1} of {educationSlides.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentSlide + 1) / educationSlides.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSlide()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, currentSlide === 0 && styles.disabledButton]}
          onPress={prevSlide}
          disabled={currentSlide === 0}
        >
          <MaterialIcons name="arrow-back" size={20} color={currentSlide === 0 ? '#9ca3af' : '#6b7280'} />
          <Text style={[styles.navButtonText, currentSlide === 0 && styles.disabledText]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={nextSlide}
        >
          <Text style={styles.nextButtonText}>
            {currentSlide === educationSlides.length - 1 ? 'Complete' : 'Next'}
          </Text>
          <MaterialIcons 
            name={currentSlide === educationSlides.length - 1 ? 'check' : 'arrow-forward'} 
            size={20} 
            color="#ffffff" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
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
    borderBottomColor: '#e5e7eb',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#6b7280',
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  progressBar: {
    width: 100,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  slideContent: {
    padding: 24,
    alignItems: 'center',
  },
  slideEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  characteristicsSection: {
    width: '100%',
    marginBottom: 24,
  },
  examplesSection: {
    width: '100%',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  characteristicItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#9ca3af',
    marginRight: 8,
    marginTop: 2,
  },
  characteristicText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  exampleText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    flex: 1,
    fontStyle: 'italic',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedOption: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  practicesContainer: {
    width: '100%',
    gap: 16,
  },
  practiceCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  practiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  practiceDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  instructionBox: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  instructionText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  guidanceContainer: {
    width: '100%',
    gap: 16,
  },
  guidanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
  },
  guidanceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  guidanceText: {
    fontSize: 16,
    color: '#1e40af',
    flex: 1,
    lineHeight: 22,
  },
  completionBox: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginTop: 16,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 12,
  },
  completionItem: {
    fontSize: 14,
    color: '#065f46',
    marginBottom: 6,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 4,
  },
  disabledText: {
    color: '#9ca3af',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 4,
  },
});

export default NervousSystemEducationWidget;