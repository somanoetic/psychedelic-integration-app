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
import ExperienceMappingService from '../lib/experienceMappingService';
import CrossSessionDataManager from '../enhanced-components/CrossSessionDataManager';
import { colors } from '../theme/colors';

const EnhancedExperienceMappingScreen = ({ navigation, route }) => {
  console.log('EnhancedExperienceMappingScreen route params:', route.params);

  const session = route?.params?.session || null;

  if (!session || !session.id) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Session Error</Text>
        <Text style={styles.errorText}>
          No session data available. Please go back and start a new experience processing session.
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

  // Experience processing state
  const [experienceData, setExperienceData] = useState({
    associations: [],
    dynamics: [],
    integrations: [],
    rituals: [],
    currentPhase: 1
  });

  // Cross-session awareness
  const [hasTherapeuticContext, setHasTherapeuticContext] = useState(false);
  const [therapeuticSummary, setTherapeuticSummary] = useState(null);

  // Refs
  const scrollViewRef = useRef(null);

  // Services
  const experienceMapper = useRef(new ExperienceMappingService()).current;
  const dataManager = useRef(new CrossSessionDataManager()).current;

  // Initialize conversation
  useEffect(() => {
    initializeConversation();
  }, []);

  const initializeConversation = async () => {
    try {
      // Load full session data with cross-references
      await loadSessionData();

      if (messages.length === 0) {
        setTimeout(() => {
          initiateExperienceMapping();
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

      // Get experience mapping specific data
      const experienceContextData = dataManager.getExperienceContextWithTherapeuticData();

      setMessages(experienceContextData.messages);
      setEntities(experienceContextData.entities);
      setExperienceData(experienceContextData.experienceData);

      // Set therapeutic context awareness
      setHasTherapeuticContext(experienceContextData.hasTherapeuticHistory);
      if (experienceContextData.hasTherapeuticHistory) {
        setTherapeuticSummary({
          nervousSystemState: experienceContextData.therapeuticInsights.nervousSystemPatterns,
          practicesCompleted: experienceContextData.therapeuticInsights.completedPractices.length,
          themes: experienceContextData.therapeuticInsights.identifiedThemes
        });
      }

      // Initialize experience mapper with FULL cross-session context
      const fullContext = {
        sessionId: session.id,
        messages: experienceContextData.messages,
        entities: experienceContextData.entities,
        experienceData: experienceContextData.experienceData,
        // Cross-session therapeutic context
        therapeuticMessages: experienceContextData.therapeuticInsights?.messages || [],
        therapeuticEntities: experienceContextData.therapeuticInsights?.therapeuticEntities || [],
        nervousSystemState: experienceContextData.therapeuticInsights?.nervousSystemPatterns || 'unknown',
        practicesCompleted: experienceContextData.therapeuticInsights?.completedPractices || [],
        interventionsFocused: experienceContextData.therapeuticInsights?.identifiedThemes || []
      };

      experienceMapper.initializeSession(fullContext);

      console.log('Enhanced Experience Mapping initialized with cross-session data:', {
        experienceMessages: experienceContextData.messages.length,
        hasTherapeuticContext: experienceContextData.hasTherapeuticHistory,
        currentPhase: experienceContextData.experienceData.currentPhase
      });

    } catch (error) {
      console.error('Error loading session data:', error);
    }
  };

  const saveMessages = async (newMessages, additionalData = {}) => {
    try {
      // Use CrossSessionDataManager to save without overwriting other mode's data
      await dataManager.saveExperienceMappingData(
        newMessages,
        entities,
        experienceData,
        additionalData,
        supabase
      );

      console.log('Experience mapping data saved with cross-session preservation');

    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const initiateExperienceMapping = () => {
    let welcomeContent = `Welcome to **Experience Processing**!

I'm here to help you systematically explore and document your psychedelic experience. This will give you comprehensive material for reflection and integration.

We'll work through:
**Gathering Details** - Collecting all the elements (symbols, sensations, emotions)
**Exploring Connections** - Mapping relationships and patterns
**Finding Meaning** - Discovering insights and connections to your life
**Creating Practices** - Developing ways to integrate your discoveries`;

    // Add therapeutic context awareness if available
    if (hasTherapeuticContext && therapeuticSummary) {
      welcomeContent += `

**Cross-Session Insight**: I can see you've been doing therapeutic integration work (${therapeuticSummary.nervousSystemState} nervous system state, ${therapeuticSummary.practicesCompleted} practices completed). I'll reference that work when relevant to your experience processing.`;
    }

    welcomeContent += `

Let's begin by **gathering all the details** from your experience.

Tell me about your recent psychedelic experience - what stands out most vividly? Take your time and share whatever feels important to capture.`;

    const welcomeMessage = {
      role: 'assistant',
      content: welcomeContent,
      timestamp: new Date(),
      currentPhase: 1,
      messageType: 'experience_mapping_intro',
      crossSessionAware: hasTherapeuticContext
    };

    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: userInput.trim(),
      timestamp: new Date(),
      currentPhase: experienceData.currentPhase
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      // Get experience mapping response with full cross-session context
      const response = await experienceMapper.continueExperienceMapping(
        userInput.trim(),
        {
          messages: newMessages,
          entities: entities,
          experienceData: experienceData
        }
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        entities: response.extractedEntities || [],
        currentPhase: response.currentPhase,
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

      await saveMessages(updatedMessages);

    } catch (error) {
      console.error('Error sending message:', error);

      // Enhanced error handling with network diagnostics
      let errorContent = "I'm here with you. Take a moment to breathe.";
      let showNetworkTest = false;

      if (error.message && error.message.includes('Network request failed')) {
        errorContent = `I'm experiencing connectivity issues right now. This appears to be a network problem rather than anything you've done.

Would you like me to run a network diagnostic to help identify the issue?`;
        showNetworkTest = true;
      } else if (error.message && error.message.includes('API request failed')) {
        errorContent = `I'm having trouble connecting to my AI service right now. This is a temporary technical issue.

You can continue documenting your experience, and I'll be back online soon.`;
        showNetworkTest = true;
      }

      const errorMessage = {
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        isError: true,
        showNetworkTest: showNetworkTest
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderProcessingProgress = () => {
    const phases = [
      { number: 1, name: 'Gathering', complete: experienceData.associations.length > 0 },
      { number: 2, name: 'Connecting', complete: experienceData.dynamics.length > 0 },
      { number: 3, name: 'Meaning', complete: experienceData.integrations.length > 0 },
      { number: 4, name: 'Practices', complete: experienceData.rituals.length > 0 }
    ];

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Experience Processing:</Text>
          {hasTherapeuticContext && (
            <Text style={styles.crossSessionIndicator}>
              Connected to therapeutic work
            </Text>
          )}
        </View>
        <View style={styles.phaseIndicators}>
          {phases.map((phase) => (
            <View key={phase.number} style={styles.phaseIndicator}>
              <View style={[
                styles.phaseCircle,
                phase.complete && styles.phaseCircleComplete,
                experienceData.currentPhase === phase.number && styles.phaseCircleCurrent
              ]}>
                <Text style={[
                  styles.phaseNumber,
                  phase.complete && styles.phaseNumberComplete
                ]}>
                  {phase.number}
                </Text>
              </View>
              <Text style={styles.phaseName}>{phase.name}</Text>
            </View>
          ))}
        </View>

        {/* Phase Summary */}
        <View style={styles.phaseSummary}>
          <Text style={styles.phaseSummaryText}>
            Current: Phase {experienceData.currentPhase} - {
              experienceData.currentPhase === 1 ? 'Gathering symbols, emotions, and sensations' :
              experienceData.currentPhase === 2 ? 'Exploring relationships and patterns' :
              experienceData.currentPhase === 3 ? 'Finding meaning and life connections' :
              'Creating integration practices'
            }
          </Text>
        </View>
      </View>
    );
  };

  const renderTherapeuticAwareness = () => {
    if (!hasTherapeuticContext || !therapeuticSummary) return null;

    return (
      <View style={styles.therapeuticAwarenessContainer}>
        <Text style={styles.therapeuticAwarenessTitle}>Therapeutic Context:</Text>
        <Text style={styles.therapeuticAwarenessText}>
          {therapeuticSummary.nervousSystemState} state • {therapeuticSummary.practicesCompleted} practices •
          {therapeuticSummary.themes.slice(-2).join(', ') || 'Exploring themes'}
        </Text>
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
        <Text style={[
          styles.messageText,
          message.role === 'user' ? styles.userText : styles.assistantText
        ]}>
          {message.content}
        </Text>

        {/* Show cross-session awareness indicator */}
        {message.crossSessionAware && (
          <View style={styles.crossSessionIndicatorMessage}>
            <Text style={styles.crossSessionIndicatorText}>
              Aware of therapeutic integration work
            </Text>
          </View>
        )}

        {/* Show current phase indicator */}
        {message.currentPhase && (
          <View style={styles.phaseStepIndicator}>
            <Text style={styles.phaseStepText}>
              Phase {message.currentPhase}: {
                message.currentPhase === 1 ? 'Gathering Details' :
                message.currentPhase === 2 ? 'Exploring Connections' :
                message.currentPhase === 3 ? 'Finding Meaning' :
                'Creating Practices'
              }
            </Text>
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

        {/* Show network test button for connectivity errors */}
        {message.showNetworkTest && (
          <TouchableOpacity
            style={styles.networkTestButton}
            onPress={() => navigation.navigate('NetworkTest')}
          >
            <Text style={styles.networkTestButtonText}>Run Network Test</Text>
          </TouchableOpacity>
        )}
      </View>
    ));
  };

  const renderInput = () => {
    return (
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={userInput}
          onChangeText={setUserInput}
          placeholder={
            experienceData.currentPhase === 1 ? "Describe what you experienced (colors, sounds, feelings, thoughts...)" :
            experienceData.currentPhase === 2 ? "How did different elements relate to each other?" :
            experienceData.currentPhase === 3 ? "What meaning do these experiences hold for your life?" :
            "What practices would help you integrate these insights?"
          }
          multiline
          maxLength={1500}
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
        <Text style={styles.title}>Experience Processing</Text>
        <TouchableOpacity onPress={() => navigation.navigate('TherapeuticIntegration', { session })}>
          <Text style={styles.switchText}>Switch to Integration →</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      {renderProcessingProgress()}

      {/* Therapeutic Awareness */}
      {renderTherapeuticAwareness()}

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
            <Text style={styles.typingText}>Processing your experience...</Text>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </ScrollView>

      {renderInput()}
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
  progressContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  crossSessionIndicator: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '500',
  },
  phaseIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  phaseIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  phaseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.offWhite,
    borderWidth: 2,
    borderColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  phaseCircleComplete: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  phaseCircleCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  phaseNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  phaseNumberComplete: {
    color: colors.textInverse,
  },
  phaseName: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  phaseSummary: {
    backgroundColor: colors.offWhite,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  phaseSummaryText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  therapeuticAwarenessContainer: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  therapeuticAwarenessTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 2,
  },
  therapeuticAwarenessText: {
    fontSize: 10,
    color: '#15803d',
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 6,
  },
  crossSessionIndicatorText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '500',
  },
  phaseStepIndicator: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
  },
  phaseStepText: {
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
    backgroundColor: colors.offWhite,
    borderRadius: 12,
  },
  entityText: {
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
  networkTestButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  networkTestButtonText: {
    fontSize: 12,
    color: colors.textInverse,
    fontWeight: '500',
  },
};

export default EnhancedExperienceMappingScreen;
