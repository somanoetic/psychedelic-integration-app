import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import DualModeClaudeService from '../enhanced-components/dualModeClaudeService';
import EmbeddedPracticeWidget from '../enhanced-components/EmbeddedPracticeWidget';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import FormattedText from '../components/FormattedText';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const DualModeConversationScreen = ({ navigation, route }) => {
  console.log('DualModeConversationScreen route params:', route.params);
  
  const session = route?.params?.session || null;
  
  if (!session || !session.id) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Session Error</Text>
        <Text style={styles.errorText}>
          No session data available. Please go back and select a session.
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Core conversation state
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [entities, setEntities] = useState([]);
  
  // Dual Mode State
  const [conversationMode, setConversationMode] = useState('experience_mapping'); // experience_mapping | therapeutic_integration
  const [experienceData, setExperienceData] = useState({
    associations: [],
    dynamics: [],
    integrations: [],
    rituals: [],
    currentStep: 1
  });
  
  // Enhanced features state
  const [currentPractice, setCurrentPractice] = useState(null);
  const [nervousSystemState, setNervousSystemState] = useState('unknown');
  const [stateConfidence, setStateConfidence] = useState(0);
  const [sessionPhase, setSessionPhase] = useState('check_in');
  
  // Session tracking
  const [sessionStartTime] = useState(Date.now());
  const [practicesCompleted, setPracticesCompleted] = useState([]);
  const [regulationInterventions, setRegulationInterventions] = useState(0);
  
  // Refs and animations
  const scrollViewRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Dual Mode Claude service
  const integrationGuide = useRef(new DualModeClaudeService()).current;

  // Scroll to bottom when keyboard opens
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    });
    return () => sub.remove();
  }, []);

  // Initialize conversation
  useEffect(() => {
    initializeConversation();
    startHeartbeatAnimation();
  }, []);

  const startHeartbeatAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const initializeConversation = async () => {
    try {
      // Load existing messages and check if we need initial check-in
      const hasExistingMessages = await loadMessages();
      
      // Start with nervous system check-in only if this is truly a new session
      if (!hasExistingMessages) {
        setTimeout(() => {
          initiateInitialGreeting();
        }, 1000);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('session_data')
        .eq('id', session.id)
        .single();

      if (error) throw error;

      const sessionData = data?.session_data || {};
      const loadedMessages = sessionData.messages || [];
      const loadedEntities = sessionData.entities || [];
      const loadedState = sessionData.nervousSystemState || 'unknown';
      const loadedMode = sessionData.conversationMode || 'experience_mapping';
      const loadedExperienceData = sessionData.experienceData || {
        associations: [],
        dynamics: [],
        integrations: [],
        rituals: [],
        currentStep: 1
      };
      
      console.log('Loading session data:', {
        sessionId: session.id,
        messageCount: loadedMessages.length,
        entityCount: loadedEntities.length,
        nervousSystemState: loadedState,
        conversationMode: loadedMode
      });
      
      setMessages(loadedMessages);
      setEntities(loadedEntities);
      setNervousSystemState(loadedState);
      setConversationMode(loadedMode);
      setExperienceData(loadedExperienceData);
      
      // Initialize Claude with context
      integrationGuide.initializeSession({
        sessionId: session.id,
        messages: loadedMessages,
        entities: loadedEntities,
        nervousSystemState: loadedState,
        conversationMode: loadedMode,
        experienceData: loadedExperienceData,
        sessionPhase: sessionData.sessionPhase || 'check_in'
      });
      
      return loadedMessages.length > 0;
      
    } catch (error) {
      console.error('Error loading messages:', error);
      return false;
    }
  };

  const saveMessages = async (newMessages, additionalData = {}) => {
    try {
      const sessionData = {
        messages: newMessages,
        entities: entities,
        nervousSystemState: nervousSystemState,
        conversationMode: conversationMode,
        experienceData: experienceData,
        sessionPhase: sessionPhase,
        practicesCompleted: practicesCompleted,
        regulationInterventions: regulationInterventions,
        lastUpdated: new Date().toISOString(),
        ...additionalData
      };

      const { error } = await supabase
        .from('sessions')
        .update({ 
          session_data: sessionData
        })
        .eq('id', session.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const initiateInitialGreeting = () => {
    const greetingMessage = {
      role: 'assistant',
      content: `Welcome to your integration session! I'm here to support you in two different ways:

**Experience Mapping**: We'll systematically explore your psychedelic experience using Johnson's 4-step framework to gather rich material for analog mind mapping.

**Therapeutic Integration**: We'll connect your insights to your life patterns and apply specific interventions like polyvagal mapping and somatic work.

Which approach feels right to start with today?`,
      timestamp: new Date(),
      messageType: 'mode_selection'
    };

    setMessages([greetingMessage]);
  };

  const switchConversationMode = (newMode) => {
    setConversationMode(newMode);
    
    const modeMessages = {
      experience_mapping: `Perfect! We're now in **Experience Mapping Mode**. 

I'll guide you through Johnson's 4-step framework systematically to extract all the rich details from your experience. This will give you comprehensive material for your analog mind mapping session.

Let's start with Step 1: **Associations**. Tell me about your recent psychedelic experience - what stands out most vividly?`,
      
      therapeutic_integration: `Excellent! We're now in **Therapeutic Integration Mode**.

I'll focus on connecting what came up in your experience to your life patterns, goals, and history. Based on what emerges, I'll suggest specific therapeutic interventions like polyvagal mapping, somatic work, or parts work.

What themes or insights from your experience would you like to explore in relation to your life?`
    };

    const modeMessage = {
      role: 'assistant',
      content: modeMessages[newMode],
      timestamp: new Date(),
      conversationMode: newMode
    };

    setMessages(prev => [...prev, modeMessage]);
    
    // Update Claude service mode
    integrationGuide.setConversationMode(newMode);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: userInput.trim(),
      timestamp: new Date(),
      nervousSystemState: nervousSystemState,
      conversationMode: conversationMode
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      // Get mode-specific Claude response
      const response = await integrationGuide.continueConversation(
        userInput.trim(),
        {
          messages: newMessages,
          entities: entities,
          nervousSystemState: nervousSystemState,
          stateConfidence: stateConfidence,
          conversationMode: conversationMode,
          experienceData: experienceData,
          sessionPhase: sessionPhase,
          practicesCompleted: practicesCompleted
        }
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        entities: response.extractedEntities || [],
        requiresPractice: response.suggestedPractice,
        nervousSystemUpdate: response.nervousSystemUpdate,
        conversationMode: conversationMode,
        johnsonStep: response.johnsonStep,
        experienceUpdate: response.experienceUpdate
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      // Update entities if new ones were extracted
      if (response.extractedEntities && response.extractedEntities.length > 0) {
        const updatedEntities = [...entities, ...response.extractedEntities];
        setEntities(updatedEntities);
      }

      // Update experience data if new information was gathered
      if (response.experienceUpdate) {
        setExperienceData(prev => ({
          ...prev,
          ...response.experienceUpdate
        }));
      }

      // Update nervous system state if changed
      if (response.nervousSystemUpdate) {
        setNervousSystemState(response.nervousSystemUpdate.state);
        setStateConfidence(response.nervousSystemUpdate.confidence);
      }

      // Show practice if recommended (only in therapeutic mode or high urgency)
      if (response.suggestedPractice && 
          (conversationMode === 'therapeutic_integration' || response.suggestedPractice.urgency === 'high')) {
        setTimeout(() => {
          setCurrentPractice({
            ...response.suggestedPractice,
            onComplete: handlePracticeComplete
          });
        }, 2000);
      }

      await saveMessages(updatedMessages);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: "I'm here with you. Take a moment to breathe. Would you like to try sharing that again?",
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePracticeComplete = async (practiceResult) => {
    const { practiceType, outcome, duration, effectiveness } = practiceResult;
    
    const completedPractice = {
      type: practiceType,
      completedAt: new Date().toISOString(),
      duration: duration,
      effectiveness: effectiveness,
      outcome: outcome
    };
    
    setPracticesCompleted(prev => [...prev, completedPractice]);
    setCurrentPractice(null);

    // Generate follow-up response from Claude
    const followUpResponse = await integrationGuide.respondToPracticeCompletion({
      practice: completedPractice,
      currentState: nervousSystemState,
      conversationMode: conversationMode,
      sessionContext: { messages, entities, sessionPhase, experienceData }
    });

    const followUpMessage = {
      role: 'assistant',
      content: followUpResponse.message,
      timestamp: new Date(),
      practiceFollowUp: true,
      requiresPractice: followUpResponse.suggestedPractice
    };

    const updatedMessages = [...messages, followUpMessage];
    setMessages(updatedMessages);
    
    await saveMessages(updatedMessages, { 
      practicesCompleted: [...practicesCompleted, completedPractice] 
    });
  };

  const renderModeToggle = () => {
    return (
      <View style={styles.modeToggleContainer}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            conversationMode === 'experience_mapping' && styles.modeButtonActive
          ]}
          onPress={() => switchConversationMode('experience_mapping')}
        >
          <Text style={[
            styles.modeButtonText,
            conversationMode === 'experience_mapping' && styles.modeButtonTextActive
          ]}>
            📝 Experience Mapping
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.modeButton,
            conversationMode === 'therapeutic_integration' && styles.modeButtonActive
          ]}
          onPress={() => switchConversationMode('therapeutic_integration')}
        >
          <Text style={[
            styles.modeButtonText,
            conversationMode === 'therapeutic_integration' && styles.modeButtonTextActive
          ]}>
            🧘 Therapeutic Integration
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderJohnsonProgress = () => {
    if (conversationMode !== 'experience_mapping') return null;

    const steps = [
      { number: 1, name: 'Associations', complete: experienceData.associations.length > 0 },
      { number: 2, name: 'Dynamics', complete: experienceData.dynamics.length > 0 },
      { number: 3, name: 'Integration', complete: experienceData.integrations.length > 0 },
      { number: 4, name: 'Ritual', complete: experienceData.rituals.length > 0 }
    ];

    return (
      <View style={styles.johnsonProgressContainer}>
        <Text style={styles.johnsonTitle}>Johnson's 4-Step Progress:</Text>
        <View style={styles.stepIndicators}>
          {steps.map((step) => (
            <View key={step.number} style={styles.stepIndicator}>
              <View style={[
                styles.stepCircle,
                step.complete && styles.stepCircleComplete,
                experienceData.currentStep === step.number && styles.stepCircleCurrent
              ]}>
                <Text style={[
                  styles.stepNumber,
                  step.complete && styles.stepNumberComplete
                ]}>
                  {step.number}
                </Text>
              </View>
              <Text style={styles.stepName}>{step.name}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderNervousSystemHeader = () => {
    const getStateEmoji = () => {
      switch (nervousSystemState) {
        case 'ventral': return '💚';
        case 'sympathetic': return '⚡';
        case 'dorsal': return '🛡️';
        default: return '🧠';
      }
    };

    const getStateLabel = () => {
      switch (nervousSystemState) {
        case 'ventral': return 'Safe & Social';
        case 'sympathetic': return 'Activated';
        case 'dorsal': return 'Protected';
        default: return 'Checking in...';
      }
    };

    return (
      <View style={styles.nervousSystemHeader}>
        <View style={styles.nervousSystemIndicator}>
          <Animated.Text 
            style={[
              styles.stateEmoji,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            {getStateEmoji()}
          </Animated.Text>
          <Text style={styles.stateLabel}>
            {getStateLabel()}
          </Text>
        </View>
        
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionPhaseText}>
            {conversationMode === 'experience_mapping' ? 'Mapping Experience' : 'Therapeutic Integration'}
          </Text>
          <Text style={styles.practiceCount}>
            {practicesCompleted.length} practices completed
          </Text>
        </View>
      </View>
    );
  };

  const renderMessages = () => {
    return messages.map((message, index) => (
      <View
        key={index}
        style={[
          styles.messageBubble,
          message.role === 'user' ? styles.userBubble : styles.assistantBubble
        ]}
      >
        <FormattedText style={[
          styles.messageText,
          message.role === 'user' ? styles.userText : styles.assistantText
        ]}>
          {message.content}
        </FormattedText>

        {/* Show Johnson step if in experience mapping mode */}
        {message.johnsonStep && conversationMode === 'experience_mapping' && (
          <View style={styles.johnsonStepIndicator}>
            <Text style={styles.johnsonStepText}>
              Step {message.johnsonStep}: {
                message.johnsonStep === 1 ? 'Associations' :
                message.johnsonStep === 2 ? 'Dynamics' :
                message.johnsonStep === 3 ? 'Integration' :
                'Ritual'
              }
            </Text>
          </View>
        )}
        
        {/* Show entities if available */}
        {message.entities && message.entities.length > 0 && (
          <View style={styles.entitiesContainer}>
            {message.entities.map((entity, entityIndex) => (
              <View key={entityIndex} style={styles.entityChip}>
                <Text style={styles.entityText}>{entity.name}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Show mode selection buttons for initial message */}
        {message.messageType === 'mode_selection' && (
          <View style={styles.modeSelectionButtons}>
            <TouchableOpacity
              style={styles.modeSelectionButton}
              onPress={() => switchConversationMode('experience_mapping')}
            >
              <Text style={styles.modeSelectionButtonText}>📝 Experience Mapping</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modeSelectionButton}
              onPress={() => switchConversationMode('therapeutic_integration')}
            >
              <Text style={styles.modeSelectionButtonText}>🧘 Therapeutic Integration</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Show practice suggestion */}
        {message.requiresPractice && (
          <TouchableOpacity
            style={styles.practiceIndicator}
            onPress={() => {
              if (message.requiresPractice.urgency === 'low') {
                setCurrentPractice({
                  ...message.requiresPractice,
                  onComplete: handlePracticeComplete
                });
              }
            }}
          >
            <Text style={styles.practiceText}>
              {message.requiresPractice.urgency === 'high' 
                ? '🔄 Practice will appear shortly...' 
                : '💆 Tap for practice: ' + (message.requiresPractice.title || 'Practice available')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    ));
  };

  const renderInput = () => {
    if (currentPractice) {
      return (
        <View style={styles.practiceIndicatorBottom}>
          <Text style={styles.practiceIndicatorText}>
            🧘 Practice in progress: {currentPractice.title}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={userInput}
          onChangeText={setUserInput}
          placeholder={
            conversationMode === 'experience_mapping'
              ? "Share details about your experience..."
              : nervousSystemState === 'sympathetic' 
              ? "Take your time... what's present for you?"
              : nervousSystemState === 'dorsal'
              ? "No pressure... share whatever feels safe"
              : "What would you like to explore?"
          }
          multiline
          maxLength={1000}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!userInput.trim() || isLoading) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!userInput.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.sendButtonText}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={gradients.standard} start={{ x: 1.0, y: 0.0 }} end={{ x: 0.0, y: 1.0 }} style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Dual Mode Integration</Text>
      </View>

      {/* Mode Toggle */}
      {renderModeToggle()}

      {/* Nervous System Header */}
      {renderNervousSystemHeader()}

      {/* Johnson Progress (Experience Mapping Mode Only) */}
      {renderJohnsonProgress()}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {renderMessages()}

        {isLoading && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>Claude is thinking...</Text>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </ScrollView>

      {renderInput()}

      {/* Embedded Practice Widget */}
      {currentPractice && (
        <EmbeddedPracticeWidget
          practice={currentPractice}
          nervousSystemState={nervousSystemState}
          onComplete={handlePracticeComplete}
          onSkip={() => setCurrentPractice(null)}
        />
      )}
    </KeyboardAvoidingView>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modeButtonTextActive: {
    color: colors.textInverse,
  },
  nervousSystemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  nervousSystemIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stateEmoji: {
    fontSize: 20,
  },
  stateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sessionInfo: {
    alignItems: 'flex-end',
  },
  sessionPhaseText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  practiceCount: {
    fontSize: 11,
    color: colors.textLight,
  },
  johnsonProgressContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  johnsonTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleComplete: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepCircleCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  stepNumberComplete: {
    color: '#ffffff',
  },
  stepName: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: colors.textInverse,
  },
  assistantText: {
    color: colors.text,
  },
  johnsonStepIndicator: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
  },
  johnsonStepText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
  entitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  entityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
  },
  entityText: {
    fontSize: 12,
    color: '#0891b2',
    fontWeight: '500',
  },
  modeSelectionButtons: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 12,
  },
  modeSelectionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  modeSelectionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  practiceIndicator: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
  },
  practiceText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  typingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
    backgroundColor: colors.surface,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  sendButtonText: {
    fontSize: 20,
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  practiceIndicatorBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderTopWidth: 1,
    borderTopColor: '#dbeafe',
  },
  practiceIndicatorText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
};

export default DualModeConversationScreen;