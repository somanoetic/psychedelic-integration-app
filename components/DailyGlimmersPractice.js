import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Heart, PlusCircle, PartyPopper, X, ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { icons } from '../lib/uiIcons';
import { colors } from '../theme/colors';

const StepEmoji = ({ step, style, imageStyle }) =>
  step.icon ? (
    <Image source={step.icon} style={imageStyle} />
  ) : (
    <Text style={style}>{step.emoji}</Text>
  );

/**
 * Daily Glimmers Practice
 * Based on Ketamine Integration Guide - helps users notice and track
 * micro-moments of safety, joy, and connection to rewire the nervous system
 */
const DailyGlimmersPractice = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [glimmers, setGlimmers] = useState([]);
  const [currentGlimmer, setCurrentGlimmer] = useState('');
  const [currentContext, setCurrentContext] = useState('');
  const [loading, setLoading] = useState(true);
  const [todayGlimmers, setTodayGlimmers] = useState([]);

  useEffect(() => {
    loadTodayGlimmers();
  }, []);

  const loadTodayGlimmers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_glimmers')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTodayGlimmers(data);
      }
    } catch (error) {
      console.error('Error loading today\'s glimmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGlimmer = async (glimmerText, context) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('daily_glimmers')
        .insert({
          user_id: user.id,
          glimmer_text: glimmerText,
          context: context,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setTodayGlimmers(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error saving glimmer:', error);
      Alert.alert('Error', 'Could not save glimmer. Please try again.');
    }
  };

  const steps = [
    {
      type: 'intro',
      title: 'Daily Glimmers Practice',
      emoji: '✨',
      icon: icons.glimmerCaptured,
      content: 'Glimmers are micro-moments of safety, joy, or connection that help rewire your nervous system toward regulation. Noticing them trains your brain to find safety.',
      info: [
        'Glimmers are the opposite of triggers',
        'They can be tiny: sunlight, a smile, a warm drink',
        'Regular practice creates new neural pathways',
        'Most powerful in the 24-72 hour integration window'
      ]
    },
    {
      type: 'education',
      title: 'Why Glimmers Matter',
      emoji: '🧠',
      icon: icons.dna,
      content: 'Your nervous system learns through repetition. Each time you notice a glimmer, you\'re teaching your brain: "This is safe. This is good."',
      details: [
        {
          icon: '🌱',
          title: 'Neuroplasticity',
          description: 'Glimmers create new neural pathways toward safety and regulation'
        },
        {
          icon: '💚',
          title: 'Ventral Vagal Tone',
          description: 'Each glimmer strengthens your "rest and digest" response'
        },
        {
          icon: '🔄',
          title: 'Integration',
          description: 'Post-session, your brain is extra receptive to positive experiences'
        },
        {
          icon: '✨',
          title: 'Accumulation',
          description: 'Many small glimmers add up to significant nervous system shifts'
        }
      ]
    },
    {
      type: 'examples',
      title: 'What Are Glimmers?',
      emoji: '🌟',
      icon: icons.glimmerHigh,
      categories: [
        {
          name: 'Sensory Glimmers',
          examples: ['Warm sunlight on skin', 'Soft texture of a blanket', 'Favorite scent', 'Bird sounds', 'Cool breeze']
        },
        {
          name: 'Connection Glimmers',
          examples: ['A genuine smile', 'Eye contact with loved one', 'Hug from friend', 'Pet\'s greeting', 'Thoughtful text']
        },
        {
          name: 'Nature Glimmers',
          examples: ['Flowers blooming', 'Trees swaying', 'Cloud shapes', 'Water sounds', 'Animal sightings']
        },
        {
          name: 'Simple Pleasures',
          examples: ['First sip of coffee', 'Cozy corner', 'Favorite song', 'Gentle stretch', 'Laughter']
        }
      ]
    },
    {
      type: 'capture',
      title: 'Capture Today\'s Glimmers',
      emoji: '📝',
      prompt: 'What glimmers have you noticed today? Even tiny moments count.',
      placeholder: 'e.g., Morning sunlight through my window, my dog\'s wagging tail, warm tea...'
    },
    {
      type: 'practice',
      title: 'Your Glimmers Practice',
      emoji: '🌈',
      content: 'Here\'s how to make glimmers part of your daily routine:',
      instructions: [
        {
          icon: '⏰',
          title: 'Set a Gentle Reminder',
          description: 'Pause 3 times daily to notice one glimmer'
        },
        {
          icon: '✍️',
          title: 'Write Them Down',
          description: 'Track glimmers here or in a journal - writing strengthens the effect'
        },
        {
          icon: '🫶',
          title: 'Savor the Moment',
          description: 'When you notice a glimmer, pause for 10-20 seconds to really feel it'
        },
        {
          icon: '💫',
          title: 'Integrate Post-Session',
          description: 'Especially important in the 72 hours after psychedelic experiences'
        }
      ]
    },
    {
      type: 'summary',
      title: 'Your Glimmers Today',
      emoji: '✨'
    }
  ];

  const handleNext = async () => {
    const step = steps[currentStep];

    if (step.type === 'capture') {
      if (!currentGlimmer.trim()) {
        Alert.alert('Notice a Glimmer', 'Take a moment to recall at least one glimmer from today.');
        return;
      }

      await saveGlimmer(currentGlimmer, currentContext);
      setGlimmers([...glimmers, { text: currentGlimmer, context: currentContext }]);
      setCurrentGlimmer('');
      setCurrentContext('');
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (onComplete) onComplete({ glimmers: todayGlimmers });
    }
  };

  const handleAddAnother = async () => {
    if (!currentGlimmer.trim()) return;

    await saveGlimmer(currentGlimmer, currentContext);
    setGlimmers([...glimmers, { text: currentGlimmer, context: currentContext }]);
    setCurrentGlimmer('');
    setCurrentContext('');
  };

  const renderIntro = () => {
    const step = steps[currentStep];
    return (
      <View style={styles.stepContent}>
        <StepEmoji step={step} style={styles.stepEmoji} imageStyle={styles.stepIconImage} />
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepText}>{step.content}</Text>

        <View style={styles.infoList}>
          {step.info.map((item, index) => (
            <View key={index} style={styles.infoItem}>
              <Text style={styles.infoBullet}>✨</Text>
              <Text style={styles.infoItemText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.highlightBox}>
          <Heart size={20} color="#dc2626" strokeWidth={2} />
          <Text style={styles.highlightText}>
            This practice is especially powerful during the integration window after psychedelic sessions.
          </Text>
        </View>
      </View>
    );
  };

  const renderEducation = () => {
    const step = steps[currentStep];
    return (
      <View style={styles.stepContent}>
        <StepEmoji step={step} style={styles.stepEmoji} imageStyle={styles.stepIconImage} />
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepText}>{step.content}</Text>

        <View style={styles.detailsContainer}>
          {step.details.map((detail, index) => (
            <View key={index} style={styles.detailCard}>
              <Text style={styles.detailIcon}>{detail.icon}</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>{detail.title}</Text>
                <Text style={styles.detailDescription}>{detail.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderExamples = () => {
    const step = steps[currentStep];
    return (
      <View style={styles.stepContent}>
        <StepEmoji step={step} style={styles.stepEmoji} imageStyle={styles.stepIconImage} />
        <Text style={styles.stepTitle}>{step.title}</Text>

        {step.categories.map((category, index) => (
          <View key={index} style={styles.categoryCard}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <View style={styles.examplesGrid}>
              {category.examples.map((example, exIndex) => (
                <View key={exIndex} style={styles.exampleChip}>
                  <Text style={styles.exampleText}>{example}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.reminderBox}>
          <Text style={styles.reminderText}>
            💡 Glimmers are personal - what brings you safety might be different from others. Trust your experience.
          </Text>
        </View>
      </View>
    );
  };

  const renderCapture = () => {
    const step = steps[currentStep];
    return (
      <View style={styles.stepContent}>
        <StepEmoji step={step} style={styles.stepEmoji} imageStyle={styles.stepIconImage} />
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.capturePrompt}>{step.prompt}</Text>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>What was the glimmer?</Text>
          <TextInput
            style={styles.textInput}
            value={currentGlimmer}
            onChangeText={setCurrentGlimmer}
            placeholder={step.placeholder}
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            spellCheck={true}
            autoCorrect={true}
            autoCapitalize="sentences"
          />

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Where/when did you notice it? (optional)</Text>
          <TextInput
            style={styles.textInput}
            value={currentContext}
            onChangeText={setCurrentContext}
            placeholder="e.g., During morning walk, at breakfast, in the garden..."
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            spellCheck={true}
            autoCorrect={true}
            autoCapitalize="sentences"
          />
        </View>

        {glimmers.length > 0 && (
          <View style={styles.capturedGlimmers}>
            <Text style={styles.capturedTitle}>Today's Glimmers:</Text>
            {glimmers.map((glimmer, index) => (
              <View key={index} style={styles.capturedGlimmer}>
                <Text style={styles.capturedGlimmerText}>✨ {glimmer.text}</Text>
                {glimmer.context && (
                  <Text style={styles.capturedContext}>   {glimmer.context}</Text>
                )}
              </View>
            ))}
            <TouchableOpacity
              style={styles.addAnotherButton}
              onPress={handleAddAnother}
              disabled={!currentGlimmer.trim()}
            >
              <PlusCircle size={20} color={colors.success} strokeWidth={2} />
              <Text style={styles.addAnotherText}>Add another</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderPractice = () => {
    const step = steps[currentStep];
    return (
      <View style={styles.stepContent}>
        <StepEmoji step={step} style={styles.stepEmoji} imageStyle={styles.stepIconImage} />
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepText}>{step.content}</Text>

        <View style={styles.instructionsContainer}>
          {step.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionCard}>
              <Text style={styles.instructionIcon}>{instruction.icon}</Text>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>{instruction.title}</Text>
                <Text style={styles.instructionDescription}>{instruction.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.commitmentBox}>
          <Text style={styles.commitmentTitle}>🌱 Your Practice Commitment</Text>
          <Text style={styles.commitmentText}>
            Try noticing at least 3 glimmers per day. The more you practice, the easier it becomes to find safety and joy in everyday moments.
          </Text>
        </View>
      </View>
    );
  };

  const renderSummary = () => {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepEmoji}>✨</Text>
        <Text style={styles.stepTitle}>Your Glimmers Today</Text>
        <Text style={styles.summaryCount}>
          You've captured {todayGlimmers.length} glimmer{todayGlimmers.length !== 1 ? 's' : ''} today
        </Text>

        {todayGlimmers.length > 0 ? (
          <View style={styles.summaryList}>
            {todayGlimmers.map((glimmer, index) => (
              <View key={index} style={styles.summaryGlimmer}>
                <Text style={styles.summaryGlimmerText}>✨ {glimmer.glimmer_text}</Text>
                {glimmer.context && (
                  <Text style={styles.summaryContext}>   {glimmer.context}</Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No glimmers captured yet today. Remember, even the smallest moments of safety or joy count!
            </Text>
          </View>
        )}

        <View style={styles.completionMessage}>
          <PartyPopper size={24} color={colors.success} strokeWidth={2} />
          <Text style={styles.completionText}>
            You're training your nervous system to notice safety. Keep practicing daily, especially during your integration window.
          </Text>
        </View>
      </View>
    );
  };

  const renderStep = () => {
    const step = steps[currentStep];

    switch (step.type) {
      case 'intro':
        return renderIntro();
      case 'education':
        return renderEducation();
      case 'examples':
        return renderExamples();
      case 'capture':
        return renderCapture();
      case 'practice':
        return renderPractice();
      case 'summary':
        return renderSummary();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.success} />
        <Text style={styles.loadingText}>Loading your glimmers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
          <X size={24} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentStep + 1} / {steps.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / steps.length) * 100}%` }
              ]}
            />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
          onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <ArrowLeft
            size={20}
            color={currentStep === 0 ? colors.textLight : colors.textSecondary}
            strokeWidth={2}
          />
          <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonDisabledText]}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
          </Text>
          {currentStep === steps.length - 1 ? (
            <Check size={20} color="#ffffff" strokeWidth={2} />
          ) : (
            <ArrowRight size={20} color="#ffffff" strokeWidth={2} />
          )}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  skipButton: {
    padding: 8,
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  progressBar: {
    width: 100,
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 24,
  },
  stepIconImage: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 16,
  },
  stepEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoList: {
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoBullet: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  infoItemText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  highlightBox: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  highlightText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#991b1b',
    lineHeight: 20,
  },
  detailsContainer: {
    gap: 12,
  },
  detailCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  detailIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 4,
  },
  detailDescription: {
    fontSize: 14,
    color: '#065f46',
    lineHeight: 20,
  },
  categoryCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  examplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  exampleText: {
    fontSize: 13,
    color: colors.text,
  },
  reminderBox: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
  },
  reminderText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  capturePrompt: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: colors.success,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#f9fafb',
    minHeight: 80,
  },
  capturedGlimmers: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
  },
  capturedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 12,
  },
  capturedGlimmer: {
    marginBottom: 12,
  },
  capturedGlimmerText: {
    fontSize: 15,
    color: '#065f46',
    fontWeight: '500',
  },
  capturedContext: {
    fontSize: 13,
    color: '#059669',
    marginTop: 2,
    fontStyle: 'italic',
  },
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 8,
  },
  addAnotherText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 8,
  },
  instructionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  instructionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  instructionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  commitmentBox: {
    backgroundColor: '#fef7ff',
    padding: 20,
    borderRadius: 12,
  },
  commitmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c2d12',
    marginBottom: 8,
  },
  commitmentText: {
    fontSize: 14,
    color: '#7c2d12',
    lineHeight: 20,
  },
  summaryCount: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryList: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryGlimmer: {
    marginBottom: 12,
  },
  summaryGlimmerText: {
    fontSize: 15,
    color: '#065f46',
    fontWeight: '500',
  },
  summaryContext: {
    fontSize: 13,
    color: '#059669',
    marginTop: 2,
    fontStyle: 'italic',
  },
  emptyState: {
    backgroundColor: '#f9fafb',
    padding: 24,
    borderRadius: 12,
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  completionMessage: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  completionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#065f46',
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  navButtonDisabledText: {
    color: colors.textLight,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
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

export default DailyGlimmersPractice;
