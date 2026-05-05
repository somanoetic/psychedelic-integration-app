import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator
} from 'react-native';
import { supabase } from '../lib/supabase';
import huxleyService from '../lib/huxleyService';
import { getExerciseById, getExercisesByCategory } from '../content/exercises-comprehensive';
import EmbeddedPracticeWidget from '../enhanced-components/EmbeddedPracticeWidget';
import CrossSessionDataManager from '../enhanced-components/CrossSessionDataManager';
import { colors } from '../theme/colors';
import FormattedText from '../components/FormattedText';

// Helper: suggest a practice based on nervous system state
const getSuggestedPracticeForState = (state, intensity) => {
  const selectFromCategories = (categories, urgency) => {
    for (const category of categories) {
      const exercises = getExercisesByCategory(category);
      if (exercises && exercises.length > 0) {
        const exercise = exercises[0];
        return {
          type: category,
          title: exercise.title,
          description: exercise.instructions,
          urgency,
          practice: exercise
        };
      }
    }
    return null;
  };

  if (state === 'sympathetic' && intensity > 6) {
    return selectFromCategories(['breathing', 'grounding', 'polyvagal'], 'high');
  }
  if (state === 'dorsal' && intensity > 5) {
    return selectFromCategories(['somatic', 'grounding', 'yoga'], 'medium');
  }
  return null;
};

const EnhancedTherapeuticIntegrationScreen = ({ navigation, route }) => {
  console.log('EnhancedTherapeuticIntegrationScreen route params:', route.params);

  const session = route?.params?.session || null;

  if (!session || !session.id) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Session Error</Text>
        <Text style={styles.errorText}>
          No session data available. Please go back and start a new integration session.
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

  // Therapeutic features state
  const [currentPractice, setCurrentPractice] = useState(null);
  const [nervousSystemState, setNervousSystemState] = useState('unknown');
  const [stateConfidence, setStateConfidence] = useState(0);
  const [interventionsFocused, setInterventionsFocused] = useState([]);

  // Session tracking
  const [practicesCompleted, setPracticesCompleted] = useState([]);
  const [regulationInterventions, setRegulationInterventions] = useState(0);
  const [lastNervousSystemCheck, setLastNervousSystemCheck] = useState(null);

  // Cross-session awareness
  const [hasExperienceContext, setHasExperienceContext] = useState(false);
  const [experienceSummary, setExperienceSummary] = useState(null);

  // Refs and animations
  const scrollViewRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Services
  const recommendedExercisesRef = useRef([]);
  const dataManager = useRef(new CrossSessionDataManager()).current;

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
      // Load full session data with cross-references
      await loadSessionData();

      if (messages.length === 0) {
        setTimeout(() => {
          initiateTherapeuticIntegration();
        }, 1000);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const loadSessionData = async () => {
    try {
      // Use CrossSessionDataManager to load all session data
      if (session.session_data) {
        // Temporary session - set data directly
        dataManager.setSessionData(session.session_data);
      } else {
        // Database session - load from supabase
        await dataManager.loadFullSessionData(session.id, supabase);
      }

      // Get therapeutic integration specific data
      const therapeuticContextData = dataManager.getTherapeuticContextWithExperienceData();

      setMessages(therapeuticContextData.messages);
      setEntities(therapeuticContextData.entities);
      setNervousSystemState(therapeuticContextData.nervousSystemState);
      setStateConfidence(therapeuticContextData.stateConfidence);
      setPracticesCompleted(therapeuticContextData.practicesCompleted);
      setInterventionsFocused(therapeuticContextData.interventionsFocused);
      setRegulationInterventions(therapeuticContextData.regulationInterventions);
      setLastNervousSystemCheck(therapeuticContextData.lastNervousSystemCheck);

      // Set experience context awareness
      setHasExperienceContext(therapeuticContextData.hasExperienceHistory);
      if (therapeuticContextData.hasExperienceHistory) {
        setExperienceSummary({
          currentPhase: therapeuticContextData.experienceInsights.processingPhase,
          associations: therapeuticContextData.experienceInsights.documentedAssociations.length,
          insights: therapeuticContextData.experienceInsights.foundMeanings.length,
          entities: therapeuticContextData.experienceInsights.experienceEntities.slice(-3).map(e => e.name)
        });
      }

      // Initialize unified huxley service in therapeutic_integration mode
      huxleyService.setMode('therapeutic_integration', { clearHistory: true });

      console.log('Enhanced Therapeutic Integration initialized with cross-session data:', {
        therapeuticMessages: therapeuticContextData.messages.length,
        hasExperienceContext: therapeuticContextData.hasExperienceHistory,
        nervousSystemState: therapeuticContextData.nervousSystemState,
        lastNervousSystemCheck: therapeuticContextData.lastNervousSystemCheck
      });

    } catch (error) {
      console.error('Error loading session data:', error);
    }
  };

  const saveMessages = async (newMessages, additionalData = {}) => {
    try {
      // Use CrossSessionDataManager to save without overwriting other mode's data
      const therapeuticData = {
        nervousSystemState,
        stateConfidence,
        practicesCompleted,
        interventionsFocused,
        regulationInterventions,
        lastNervousSystemCheck
      };

      await dataManager.saveTherapeuticIntegrationData(
        newMessages,
        entities,
        therapeuticData,
        additionalData,
        supabase
      );

      console.log('Therapeutic integration data saved with cross-session preservation');

    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const initiateTherapeuticIntegration = () => {
    let welcomeContent = `Welcome to **Therapeutic Integration**!

I'm here to help you connect insights from your psychedelic experiences to your life patterns and apply specific therapeutic interventions when needed.

My focus is on:
**Life Pattern Connections** - How your insights relate to current challenges
**Polyvagal Mapping** - Understanding your nervous system responses
**Parts Work (IFS)** - Exploring different aspects of yourself
**Somatic Practices** - Reconnecting with your body's wisdom
**Self-Compassion** - Healing shame and inner criticism`;

    // Add experience context awareness if available
    if (hasExperienceContext && experienceSummary) {
      welcomeContent += `

**Cross-Session Insight**: I can see you've been doing experience processing work (Phase ${experienceSummary.currentPhase}/4, ${experienceSummary.associations} documented elements). I'll connect those insights to your life patterns.`;
    }

    welcomeContent += `

Before we dive in, let's check in with your nervous system. How is your body feeling right in this moment?`;

    const welcomeMessage = {
      role: 'assistant',
      content: welcomeContent,
      timestamp: new Date(),
      messageType: 'therapeutic_integration_intro',
      crossSessionAware: hasExperienceContext,
      requiresPractice: {
        type: 'polyvagal_assessment',
        priority: 'high',
        reason: 'session_initialization'
      }
    };

    setMessages([welcomeMessage]);

    // Only show nervous system check-in if not recently completed
    const shouldShowCheck = dataManager.shouldShowNervousSystemCheck();

    if (shouldShowCheck) {
      setTimeout(() => {
        setCurrentPractice({
          type: 'polyvagal_assessment',
          title: "Let's check in with your nervous system",
          description: "This helps me understand how to best support you therapeutically",
          onComplete: handleNervousSystemAssessment
        });
      }, 2000);
    } else {
      console.log('Skipping nervous system check - completed recently or in intro');
    }
  };

  const handleNervousSystemAssessment = async (assessmentResult) => {
    const { state, intensity, notes } = assessmentResult;

    setNervousSystemState(state);
    setStateConfidence(intensity / 10);
    setCurrentPractice(null);

    // Mark check as completed
    const checkTime = new Date().toISOString();
    setLastNervousSystemCheck(checkTime);
    dataManager.markNervousSystemCheckCompleted();

    // Update regulation interventions if needed
    if (state === 'sympathetic' && intensity > 6) {
      setRegulationInterventions(prev => prev + 1);
    }

    // Generate therapeutic response based on assessment (inline, no API call needed)
    const stateResponses = {
      ventral: `Beautiful! I can sense that you're feeling relatively safe and connected right now. Your nervous system is in a lovely place for exploration and integration work.`,
      sympathetic: intensity > 7
        ? `I can feel the activation and energy in your system. Your fight/flight response is very much online. Before we dive deeper, let's help your nervous system find some calm.`
        : `I notice some activation energy in your system. That's completely normal when processing meaningful experiences.`,
      dorsal: intensity > 6
        ? `I sense your system might be in a protective shutdown right now. That's a wise response. We'll go very gently and follow your pace completely.`
        : `It feels like part of you might be pulled back or protected right now. That's okay - we'll honor that and move slowly.`
    };

    let nsResponseText = stateResponses[state] || "Thank you for sharing how you're feeling. I'm here to support you wherever your nervous system is right now.";
    if (notes) nsResponseText += ` I appreciate you sharing that ${notes}.`;
    nsResponseText += " What insights or themes from your psychedelic experience would feel most important to explore therapeutically?";

    const suggestedPractice = getSuggestedPracticeForState(state, intensity);

    const contextualResponse = {
      message: nsResponseText,
      suggestedPractice
    };

    const responseMessage = {
      role: 'assistant',
      content: contextualResponse.message,
      timestamp: new Date(),
      nervousSystemContext: { state, intensity, notes },
      requiresPractice: contextualResponse.suggestedPractice
    };

    const updatedMessages = [...messages, responseMessage];
    setMessages(updatedMessages);

    // Auto-suggest regulation if needed
    if (contextualResponse.suggestedPractice && contextualResponse.suggestedPractice.urgency === 'high') {
      setTimeout(() => {
        setCurrentPractice({
          ...contextualResponse.suggestedPractice,
          onComplete: handlePracticeComplete
        });
      }, 3000);
    }

    await saveMessages(updatedMessages, {
      nervousSystemState: state,
      stateConfidence: intensity / 10,
      lastNervousSystemCheck: checkTime
    });
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: userInput.trim(),
      timestamp: new Date(),
      nervousSystemState: nervousSystemState
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      // Get therapeutic integration response via unified huxley service
      const response = await huxleyService.chat(userInput.trim(), {
        modeContext: {
          entities,
          nervousSystemState,
          stateConfidence,
          practicesCompleted,
          interventionsFocused
        }
      });

      // Extract therapeutic data from unified response
      const therapeuticData = response.therapeuticData || {};
      const extractedThemes = therapeuticData.themes || [];
      const nsUpdate = therapeuticData.nervousSystemState ? {
        state: therapeuticData.nervousSystemState,
        confidence: therapeuticData.confidence || stateConfidence
      } : null;

      // Resolve exercise recommendation if present
      let suggestedPractice = null;
      if (response.exerciseRecommendation) {
        const exercise = getExerciseById(response.exerciseRecommendation);
        if (exercise) {
          recommendedExercisesRef.current.push(exercise.id);
          suggestedPractice = {
            type: exercise.category,
            title: exercise.title,
            description: exercise.instructions,
            urgency: nervousSystemState === 'sympathetic' ? 'high' : 'medium',
            practice: exercise
          };
        }
      }

      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        entities: therapeuticData.entities || [],
        requiresPractice: suggestedPractice,
        nervousSystemUpdate: nsUpdate,
        therapeuticThemes: extractedThemes
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      // Update entities if new ones were extracted
      if (therapeuticData.entities && therapeuticData.entities.length > 0) {
        const updatedEntities = [...entities, ...therapeuticData.entities];
        setEntities(updatedEntities);
      }

      // Update nervous system state if changed
      if (nsUpdate) {
        setNervousSystemState(nsUpdate.state);
        setStateConfidence(nsUpdate.confidence);
      }

      // Track therapeutic interventions focused on
      if (extractedThemes.length > 0) {
        setInterventionsFocused(prev => [...prev, ...extractedThemes]);
      }

      // Show practice if recommended (but not constantly)
      if (suggestedPractice && suggestedPractice.urgency !== 'low') {
        setTimeout(() => {
          setCurrentPractice({
            ...suggestedPractice,
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

    // Generate follow-up response (inline, no API call needed)
    const practiceResponses = {
      breathing_exercise: `How beautiful that you took that time for your nervous system. How are you feeling now, and what would you like to explore therapeutically?`,
      parts_work: `Thank you for taking time to listen to your parts. What did you notice, and how does this connect to your daily life?`,
      body_scan: `I love that you connected with your body. What sensations or insights came up, and how do they relate to your life patterns?`,
      polyvagal_assessment: `Thank you for that nervous system check-in. Based on what you discovered, what aspects of your experience feel most important to explore?`,
      gentle_activation: `So gentle and wise to move slowly back into feeling. How does it feel to be reconnecting, and what would you like to explore now?`,
      self_compassion: `That self-compassion practice is so powerful for healing. How did that feel, and what did you notice about your inner dialogue?`
    };

    const followUpResponse = {
      message: practiceResponses[completedPractice.type] || "Thank you for engaging with that practice. How was that experience for you?",
      suggestedPractice: null
    };

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
            Therapeutic Integration
            {hasExperienceContext && (
              <Text style={styles.crossSessionIndicator}> 🔄</Text>
            )}
          </Text>
          <Text style={styles.practiceCount}>
            {practicesCompleted.length} practices completed
          </Text>
        </View>
      </View>
    );
  };

  const renderExperienceAwareness = () => {
    if (!hasExperienceContext || !experienceSummary) return null;

    return (
      <View style={styles.experienceAwarenessContainer}>
        <Text style={styles.experienceAwarenessTitle}>Experience Context:</Text>
        <Text style={styles.experienceAwarenessText}>
          Phase {experienceSummary.currentPhase}/4 • {experienceSummary.associations} elements •
          {experienceSummary.entities.join(', ') || 'Processing symbols'}
        </Text>
      </View>
    );
  };

  const renderTherapeuticFocus = () => {
    if (interventionsFocused.length === 0) return null;

    return (
      <View style={styles.therapeuticFocusContainer}>
        <Text style={styles.focusTitle}>Therapeutic Focus Areas:</Text>
        <View style={styles.focusChips}>
          {[...new Set(interventionsFocused)].slice(-4).map((intervention, index) => (
            <View key={index} style={styles.focusChip}>
              <Text style={styles.focusChipText}>{intervention}</Text>
            </View>
          ))}
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

        {/* Show cross-session awareness indicator */}
        {message.crossSessionAware && (
          <View style={styles.crossSessionIndicatorMessage}>
            <Text style={styles.crossSessionIndicatorText}>
              🔄 Aware of experience processing work
            </Text>
          </View>
        )}

        {/* Show therapeutic themes */}
        {message.therapeuticThemes && message.therapeuticThemes.length > 0 && (
          <View style={styles.therapeuticThemesContainer}>
            {message.therapeuticThemes.map((theme, themeIndex) => (
              <View key={themeIndex} style={styles.therapeuticThemeChip}>
                <Text style={styles.therapeuticThemeText}>{theme}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Show extracted entities */}
        {message.entities && message.entities.length > 0 && (
          <View style={styles.entitiesContainer}>
            {message.entities.map((entity, entityIndex) => (
              <View key={entityIndex} style={styles.entityChip}>
                <Text style={styles.entityText}>{entity.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Show nervous system context */}
        {message.nervousSystemContext && (
          <View style={styles.contextIndicator}>
            <Text style={styles.contextText}>
              State: {message.nervousSystemContext.state} ({message.nervousSystemContext.intensity}/10)
            </Text>
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
            Practice in progress: {currentPractice.title}
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
            nervousSystemState === 'sympathetic'
              ? "Take your time... what's present for you?"
              : nervousSystemState === 'dorsal'
              ? "No pressure... share whatever feels safe"
              : "What insights would you like to explore therapeutically?"
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
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={styles.sendButtonText}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Therapeutic Integration</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ExperienceMapping', { session })}>
          <Text style={styles.switchText}>← Switch to Mapping</Text>
        </TouchableOpacity>
      </View>

      {/* Nervous System Header */}
      {renderNervousSystemHeader()}

      {/* Experience Awareness */}
      {renderExperienceAwareness()}

      {/* Therapeutic Focus Areas */}
      {renderTherapeuticFocus()}

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
            <Text style={styles.typingText}>Considering therapeutic connections...</Text>
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
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.offWhite,
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
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  switchText: {
    fontSize: 12,
    color: colors.success,
  },
  nervousSystemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
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
  crossSessionIndicator: {
    fontSize: 10,
    color: colors.success,
  },
  practiceCount: {
    fontSize: 11,
    color: colors.mediumGray,
  },
  experienceAwarenessContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  experienceAwarenessTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  experienceAwarenessText: {
    fontSize: 10,
    color: colors.primary,
  },
  therapeuticFocusContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  focusTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  focusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  focusChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.bubbleArchetypal,
    borderRadius: 8,
  },
  focusChipText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '500',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.lightGray,
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
  crossSessionIndicatorMessage: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: `${colors.primary}1A`,
    borderRadius: 6,
  },
  crossSessionIndicatorText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
  },
  therapeuticThemesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  therapeuticThemeChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: colors.bubbleSomatic,
    borderRadius: 8,
  },
  therapeuticThemeText: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '500',
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
    backgroundColor: colors.offWhite,
    borderRadius: 12,
  },
  entityText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  contextIndicator: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  contextText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  practiceIndicator: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: `${colors.primary}1A`,
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
    backgroundColor: colors.offWhite,
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
    borderTopColor: colors.lightGray,
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.lightGray,
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
    backgroundColor: colors.mediumGray,
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  practiceIndicatorText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
};

export default EnhancedTherapeuticIntegrationScreen;
