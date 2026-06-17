import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Siren,
  Sparkles,
  HelpCircle,
  Home,
  Phone,
  FilePen,
  Brain,
  Dumbbell,
  LifeBuoy,
  CheckCircle2,
  RotateCcw,
  AlertOctagon,
  Eye,
  Wind,
  Activity,
} from 'lucide-react-native';
import { colors } from '../theme/colors';

const OPTION_ICON_MAP = {
  emergency: Siren,
  'self-improvement': Sparkles,
  help: HelpCircle,
  home: Home,
  'arrow-back': ArrowLeft,
  'edit-note': FilePen,
  psychology: Brain,
  'fitness-center': Dumbbell,
  'support-agent': LifeBuoy,
  'check-circle': CheckCircle2,
  replay: RotateCcw,
};

const EXERCISE_ICON_MAP = {
  visibility: Eye,
  air: Wind,
  accessibility: Activity,
};

const ConversationalTriggeredSupport = ({ navigation }) => {
  const [conversationStep, setConversationStep] = useState('initial'); // initial, safety_check, grounding, support_options, exercise
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const crisisResources = [
    { name: 'National Suicide Prevention Lifeline', number: '988', description: '24/7 crisis support' },
    { name: 'Crisis Text Line', number: 'Text HOME to 741741', description: 'Text-based support' },
    { name: 'SAMHSA National Helpline', number: '1-800-662-4357', description: 'Mental health & substance abuse' },
  ];

  const groundingExercises = [
    {
      id: '54321',
      name: '5-4-3-2-1 Grounding',
      icon: 'visibility',
      color: colors.success,
      description: 'Use your senses to anchor to the present',
      steps: [
        'Name 5 things you can see around you',
        'Name 4 things you can touch',
        'Name 3 things you can hear',
        'Name 2 things you can smell',
        'Name 1 thing you can taste'
      ]
    },
    {
      id: 'breathing',
      name: 'Box Breathing',
      icon: 'air',
      color: colors.primary,
      description: 'Calm your nervous system with breath',
      steps: [
        'Breathe in slowly for 4 counts',
        'Hold your breath for 4 counts',
        'Breathe out slowly for 4 counts',
        'Hold empty for 4 counts',
        'Repeat 4 times'
      ]
    },
    {
      id: 'body_scan',
      name: 'Quick Body Scan',
      icon: 'accessibility',
      color: colors.warning,
      description: 'Connect with your body',
      steps: [
        'Notice your feet on the ground',
        'Feel where your body touches the chair/surface',
        'Notice any tension in your shoulders',
        'Relax your jaw',
        'Take three deep breaths'
      ]
    }
  ];

  const renderHuxleyMessage = (message) => (
    <View style={styles.huxleyBubble}>
      <View style={styles.huxleyHeader}>
        <Image
          source={require('../assets/images/huxley-avatar.png')}
          style={styles.huxleyAvatar}
          resizeMode="contain"
        />
        <Text style={styles.huxleyName}>Huxley</Text>
      </View>
      <Text style={styles.huxleyText}>{message}</Text>
    </View>
  );

  const renderUserOption = (text, onPress, icon, color = colors.primary) => {
    const Icon = OPTION_ICON_MAP[icon] || HelpCircle;
    return (
      <TouchableOpacity
        style={[styles.responseBubble, { backgroundColor: color }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Icon size={20} color="#ffffff" strokeWidth={2} style={styles.responseIcon} />
        <Text style={styles.responseText}>{text}</Text>
        <ArrowRight size={16} color="rgba(255,255,255,0.8)" strokeWidth={2} />
      </TouchableOpacity>
    );
  };

  const renderInitialStep = () => (
    <>
      {renderHuxleyMessage(
        "I'm here for you. Let's take this one step at a time. First, I need to check: Are you in immediate danger or having thoughts of harming yourself?"
      )}
      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {renderUserOption('Yes, I need crisis help', () => setConversationStep('safety_check'), 'emergency', colors.error)}
        {renderUserOption('No, I just need to calm down', () => setConversationStep('grounding'), 'self-improvement', colors.success)}
        {renderUserOption('I need other support', () => setConversationStep('support_options'), 'help', colors.primary)}
      </View>
    </>
  );

  const renderSafetyCheck = () => (
    <>
      {renderHuxleyMessage(
        "Thank you for being honest with me. Your safety is the most important thing right now. Please reach out to one of these crisis resources immediately. They have trained professionals who can help you right now."
      )}

      <View style={styles.crisisContainer}>
        {crisisResources.map((resource, index) => (
          <View key={index} style={styles.crisisCard}>
            <View style={styles.crisisHeader}>
              <Phone size={24} color={colors.error} strokeWidth={2} />
              <Text style={styles.crisisName}>{resource.name}</Text>
            </View>
            <Text style={styles.crisisNumber}>{resource.number}</Text>
            <Text style={styles.crisisDescription}>{resource.description}</Text>
          </View>
        ))}
      </View>

      {renderHuxleyMessage(
        "After you've reached out for support, I'll still be here to help you with grounding exercises or other support whenever you're ready."
      )}

      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {renderUserOption('I\'m safe now, help me ground', () => setConversationStep('grounding'), 'self-improvement', colors.success)}
        {renderUserOption('Go back home', () => navigation.goBack(), 'home', colors.textSecondary)}
      </View>
    </>
  );

  const renderGrounding = () => (
    <>
      {renderHuxleyMessage(
        "Let's bring you back to the present moment. These exercises can help calm your nervous system and help you feel more grounded. Which one would you like to try?"
      )}

      <View style={styles.exercisesContainer}>
        {groundingExercises.map((exercise) => {
          const ExIcon = EXERCISE_ICON_MAP[exercise.icon] || Sparkles;
          return (
            <TouchableOpacity
              key={exercise.id}
              style={[styles.exerciseCard, { borderLeftColor: exercise.color }]}
              onPress={() => {
                setSelectedExercise(exercise);
                setConversationStep('exercise');
              }}
            >
              <View style={[styles.exerciseIcon, { backgroundColor: `${exercise.color}20` }]}>
                <ExIcon size={32} color={exercise.color} strokeWidth={2} />
              </View>
              <View style={styles.exerciseContent}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDescription}>{exercise.description}</Text>
              </View>
              <ChevronRight size={24} color={colors.textLight} strokeWidth={2} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {renderUserOption('I need other support', () => setConversationStep('support_options'), 'help', colors.primary)}
        {renderUserOption('Go back', () => setConversationStep('initial'), 'arrow-back', colors.textSecondary)}
      </View>
    </>
  );

  const renderSupportOptions = () => (
    <>
      {renderHuxleyMessage(
        "I understand. Here are some other ways I can support you right now:"
      )}

      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {renderUserOption('Try grounding exercises', () => setConversationStep('grounding'), 'self-improvement', colors.success)}
        {renderUserOption('Log what happened', () => {
          navigation.navigate('TriggerTracker');
        }, 'edit-note', colors.error)}
        {renderUserOption('Talk to my parts', () => {
          // TODO: Navigate to IFS parts dialogue
          navigation.navigate('IFSChat');
        }, 'psychology', colors.primary)}
        {renderUserOption('Journal my feelings', () => {
          navigation.navigate('Journal');
        }, 'edit-note', '#06b6d4')}
        {renderUserOption('Browse exercises', () => {
          navigation.navigate('ExerciseLibrary');
        }, 'fitness-center', colors.warning)}
        {renderUserOption('Find a therapist', () => {
          navigation.navigate('FindSupport');
        }, 'support-agent', '#8b5cf6')}
        {renderUserOption('Go back home', () => navigation.goBack(), 'home', colors.textSecondary)}
      </View>
    </>
  );

  const renderExercise = () => {
    if (!selectedExercise) return null;

    return (
      <>
        {renderHuxleyMessage(
          `Great choice. Let's do the ${selectedExercise.name} together. Take your time with each step. Breathe.`
        )}

        <View style={styles.stepsContainer}>
          {selectedExercise.steps.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={[styles.stepNumber, { backgroundColor: selectedExercise.color }]}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {renderHuxleyMessage(
          "How are you feeling now? Remember, it's okay if you don't feel completely better yet. Healing takes time."
        )}

        <View style={styles.optionsContainer}>
          <Text style={styles.optionsLabel}>You:</Text>
          {renderUserOption('I feel better', () => setConversationStep('initial'), 'check-circle', colors.success)}
          {renderUserOption('Log what happened', () => navigation.navigate('TriggerTracker'), 'edit-note', colors.error)}
          {renderUserOption('Try another exercise', () => setConversationStep('grounding'), 'replay', colors.primary)}
          {renderUserOption('I need more support', () => setConversationStep('support_options'), 'help', colors.warning)}
          {renderUserOption('Go back home', () => navigation.goBack(), 'home', colors.textSecondary)}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, styles.urgentHeader]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#ffffff" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.appNameUrgent}>Triggered Support</Text>
        <AlertOctagon size={24} color="#ffffff" strokeWidth={2} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {conversationStep === 'initial' && renderInitialStep()}
          {conversationStep === 'safety_check' && renderSafetyCheck()}
          {conversationStep === 'grounding' && renderGrounding()}
          {conversationStep === 'support_options' && renderSupportOptions()}
          {conversationStep === 'exercise' && renderExercise()}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef2f2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  urgentHeader: {
    backgroundColor: colors.error,
    borderBottomColor: '#dc2626',
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  appNameUrgent: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  huxleyBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  huxleyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  huxleyAvatar: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  huxleyName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  huxleyText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
  },
  responseBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderTopRightRadius: 4,
    marginBottom: 12,
    alignSelf: 'flex-end',
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  responseIcon: {
    marginRight: 12,
  },
  responseText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  crisisContainer: {
    marginBottom: 24,
  },
  crisisCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  crisisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  crisisName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 10,
    flex: 1,
  },
  crisisNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 6,
  },
  crisisDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  exercisesContainer: {
    marginBottom: 24,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  stepsContainer: {
    marginBottom: 24,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
});

export default ConversationalTriggeredSupport;
