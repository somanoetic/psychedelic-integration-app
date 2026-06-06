import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { RotateCw } from 'lucide-react-native';
import { colors, gradients } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { icons } from '../lib/uiIcons';
import huxleyService from '../lib/huxleyService';
import EmbeddedPracticeWidget from '../enhanced-components/EmbeddedPracticeWidget';
import { ChatConversation } from '../components/chat';

const NS_STATE_ICONS = {
  ventral: icons.droplet,
  sympathetic: icons.steam,
  dorsal: icons.iceberg,
  unknown: icons.uncertainState,
};

const TherapeuticIntegrationScreen = ({ navigation, route }) => {
  const sessionParam = route?.params?.session || null;

  const [session, setSession] = useState(sessionParam);
  const [creatingSession, setCreatingSession] = useState(!sessionParam);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [entities, setEntities] = useState([]);

  const [currentPractice, setCurrentPractice] = useState(null);
  const [nervousSystemState, setNervousSystemState] = useState('unknown');
  const [stateConfidence, setStateConfidence] = useState(0);
  const [interventionsFocused, setInterventionsFocused] = useState([]);

  const [practicesCompleted, setPracticesCompleted] = useState([]);
  const [regulationInterventions, setRegulationInterventions] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!sessionParam) {
      createNewSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (session && session.id && !creatingSession) {
      initializeConversation();
      startHeartbeatAnimation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, creatingSession]);

  const createNewSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to start a session.');
        navigation.goBack();
        return;
      }

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          title: `Therapeutic Integration - ${new Date().toLocaleDateString()}`,
          journey_date: new Date().toISOString().split('T')[0],
          current_step: 1,
          session_data: {
            sessionType: 'therapeutic_integration',
            conversationMode: 'therapeuticIntegration',
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        Alert.alert('Error', 'Could not create session. Please try again.');
        navigation.goBack();
        return;
      }

      setSession(data);
      setCreatingSession(false);
    } catch (err) {
      console.error('Error creating session:', err);
      Alert.alert('Error', 'Could not create session. Please try again.');
      navigation.goBack();
    }
  };

  if (creatingSession) {
    return (
      <LinearGradient
        colors={gradients.standard}
        start={gradients.standardStart}
        end={gradients.standardEnd}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.errorText, { marginTop: 16 }]}>
            Setting up your session...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (!session || !session.id) {
    return (
      <LinearGradient
        colors={gradients.standard}
        start={gradients.standardStart}
        end={gradients.standardEnd}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Session Error</Text>
          <Text style={styles.errorText}>
            No session data available. Please go back and start a new
            integration session.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

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
      ]),
    ).start();
  };

  const initializeConversation = async () => {
    try {
      const hasExistingMessages = await loadMessages();
      if (!hasExistingMessages) {
        setTimeout(() => initiateTherapeuticIntegration(), 1000);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const loadMessages = async () => {
    try {
      if (session.id && session.id.startsWith('temp_')) {
        const sessionData = session.session_data || {};
        setMessages(sessionData.messages || []);
        setEntities(sessionData.entities || []);
        setNervousSystemState(sessionData.nervousSystemState || 'unknown');
        setPracticesCompleted(sessionData.practicesCompleted || []);
        setInterventionsFocused(sessionData.interventionsFocused || []);
        huxleyService.setMode('therapeutic_integration', { clearHistory: true });
        return (sessionData.messages || []).length > 0;
      }

      const { data, error } = await supabase
        .from('sessions')
        .select('session_data')
        .eq('id', session.id)
        .single();

      if (error) throw error;

      const sessionData = data?.session_data || {};
      setMessages(sessionData.messages || []);
      setEntities(sessionData.entities || []);
      setNervousSystemState(sessionData.nervousSystemState || 'unknown');
      setPracticesCompleted(sessionData.practicesCompleted || []);
      setInterventionsFocused(sessionData.interventionsFocused || []);

      huxleyService.setMode('therapeutic_integration', { clearHistory: true });
      return (sessionData.messages || []).length > 0;
    } catch (error) {
      console.error('Error loading messages:', error);
      return false;
    }
  };

  const saveMessages = async (newMessages, additionalData = {}) => {
    try {
      const sessionData = {
        messages: newMessages,
        entities,
        nervousSystemState,
        stateConfidence,
        practicesCompleted,
        regulationInterventions,
        interventionsFocused,
        sessionType: 'integration',
        conversationMode: 'therapeutic_integration',
        lastUpdated: new Date().toISOString(),
        ...additionalData,
      };

      if (session.id && !session.id.startsWith('temp_')) {
        try {
          const { error } = await supabase
            .from('sessions')
            .update({ session_data: sessionData })
            .eq('id', session.id);
          if (error) console.error('Database save failed:', error);
        } catch (dbError) {
          console.error('Database unavailable:', dbError);
        }
      }
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const initiateTherapeuticIntegration = () => {
    const welcomeMessage = {
      role: 'assistant',
      content: `Welcome to **Therapeutic Integration**!

I'm here to help you connect insights from your psychedelic experiences to your life patterns and apply specific therapeutic interventions when needed.

My focus is on:`,
      bullets: [
        { icon: 'thoughtCloud', label: 'Life Pattern Connections', description: 'How your insights relate to current challenges' },
        { icon: 'nsMap', label: 'Polyvagal Mapping', description: 'Understanding your nervous system responses' },
        { icon: 'group', label: 'Parts Work (IFS)', description: 'Exploring different aspects of yourself' },
        { icon: 'sprout', label: 'Somatic Practices', description: "Reconnecting with your body's wisdom" },
        { icon: 'compassion', label: 'Self-Compassion', description: 'Healing shame and inner criticism' },
      ],
      contentAfter: `Before we dive in, let's check in with your nervous system. How is your body feeling right in this moment?`,
      timestamp: new Date(),
      messageType: 'therapeutic_integration_intro',
      requiresPractice: {
        type: 'polyvagal_assessment',
        priority: 'high',
        reason: 'session_initialization',
      },
    };

    setMessages([welcomeMessage]);

    setTimeout(() => {
      setCurrentPractice({
        type: 'polyvagal_assessment',
        title: "Let's check in with your nervous system",
        description: 'This helps me understand how to best support you therapeutically',
        onComplete: handleNervousSystemAssessment,
      });
    }, 2000);
  };

  const handleNervousSystemAssessment = async (assessmentResult) => {
    const { state, intensity, notes } = assessmentResult;

    setNervousSystemState(state);
    setStateConfidence(intensity / 10);
    setCurrentPractice(null);

    if (state === 'sympathetic' && intensity > 6) {
      setRegulationInterventions((prev) => prev + 1);
    }

    const contextualResponse = await huxleyService.chat(
      `Nervous system check-in: state=${state}, intensity=${intensity}${notes ? ', notes: ' + notes : ''}`,
    );

    const suggestedPractice =
      contextualResponse.exerciseRecommendation ||
      contextualResponse.therapeuticData?.suggestedPractice ||
      null;

    const responseMessage = {
      role: 'assistant',
      content: contextualResponse.message,
      timestamp: new Date(),
      nervousSystemContext: { state, intensity, notes },
      requiresPractice: suggestedPractice,
    };

    const updatedMessages = [...messages, responseMessage];
    setMessages(updatedMessages);

    if (suggestedPractice && suggestedPractice.urgency === 'high') {
      setTimeout(() => {
        setCurrentPractice({
          ...suggestedPractice,
          onComplete: handlePracticeComplete,
        });
      }, 3000);
    }

    await saveMessages(updatedMessages, {
      nervousSystemState: state,
      stateConfidence: intensity / 10,
    });
  };

  const handleSendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
      nervousSystemState,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await huxleyService.chat(trimmed);

      const extractedEntities = response.therapeuticData?.extractedEntities || [];
      const suggestedPractice =
        response.exerciseRecommendation ||
        response.therapeuticData?.suggestedPractice ||
        null;
      const nervousSystemUpdate = response.therapeuticData?.nervousSystemUpdate || null;
      const therapeuticThemes = response.therapeuticData?.therapeuticThemes || [];

      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        entities: extractedEntities,
        requiresPractice: suggestedPractice,
        nervousSystemUpdate,
        therapeuticThemes,
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      if (extractedEntities.length > 0) {
        setEntities((prev) => [...prev, ...extractedEntities]);
      }

      if (nervousSystemUpdate) {
        setNervousSystemState(nervousSystemUpdate.state);
        setStateConfidence(nervousSystemUpdate.confidence);
      }

      if (therapeuticThemes.length > 0) {
        setInterventionsFocused((prev) => [...prev, ...therapeuticThemes]);
      }

      if (suggestedPractice && suggestedPractice.urgency !== 'low') {
        setTimeout(() => {
          setCurrentPractice({
            ...suggestedPractice,
            onComplete: handlePracticeComplete,
          });
        }, 2000);
      }

      await saveMessages(updatedMessages);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm here with you. Take a moment to breathe. Would you like to try sharing that again?",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePracticeComplete = async (practiceResult) => {
    const { practiceType, outcome, duration, effectiveness } = practiceResult;

    const completedPractice = {
      type: practiceType,
      completedAt: new Date().toISOString(),
      duration,
      effectiveness,
      outcome,
    };

    setPracticesCompleted((prev) => [...prev, completedPractice]);
    setCurrentPractice(null);

    const followUpResponse = await huxleyService.chat(
      `I just completed a ${completedPractice.type} practice. Duration: ${completedPractice.duration}s. Effectiveness: ${completedPractice.effectiveness}/10. Outcome: ${completedPractice.outcome}`,
    );

    const followUpMessage = {
      role: 'assistant',
      content: followUpResponse.message,
      timestamp: new Date(),
      practiceFollowUp: true,
      requiresPractice:
        followUpResponse.exerciseRecommendation ||
        followUpResponse.therapeuticData?.suggestedPractice ||
        null,
    };

    const updatedMessages = [...messages, followUpMessage];
    setMessages(updatedMessages);

    await saveMessages(updatedMessages, {
      practicesCompleted: [...practicesCompleted, completedPractice],
    });
  };

  const getStateIcon = () => NS_STATE_ICONS[nervousSystemState] || NS_STATE_ICONS.unknown;

  const getStateLabel = () => {
    switch (nervousSystemState) {
      case 'ventral': return 'Safe & Social';
      case 'sympathetic': return 'Activated';
      case 'dorsal': return 'Protected';
      default: return 'Checking in...';
    }
  };

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Therapeutic Integration</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ExperienceMapping', { session })}
        >
          <Text style={styles.switchText}>← Mapping</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.nervousSystemHeader}>
        <View style={styles.nervousSystemIndicator}>
          <Animated.Image
            source={getStateIcon()}
            style={[styles.stateIcon, { transform: [{ scale: pulseAnim }] }]}
            resizeMode="contain"
          />
          <Text style={styles.stateLabel}>{getStateLabel()}</Text>
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionPhaseText}>Therapeutic Integration</Text>
          <Text style={styles.practiceCount}>
            {practicesCompleted.length} practices completed
          </Text>
        </View>
      </View>

      {interventionsFocused.length > 0 && (
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
      )}
    </View>
  );

  // Inline message decorations: therapeutic themes, entities, NS context,
  // and practice suggestions all render inside their bubble.
  const renderMessageExtras = (message) => {
    const themes = message.therapeuticThemes || [];
    const ents = message.entities || [];
    const nsContext = message.nervousSystemContext;
    const practice = message.requiresPractice;

    if (!themes.length && !ents.length && !nsContext && !practice) {
      return null;
    }

    return (
      <View>
        {themes.length > 0 && (
          <View style={styles.therapeuticThemesContainer}>
            {themes.map((theme, i) => (
              <View key={i} style={styles.therapeuticThemeChip}>
                <Text style={styles.therapeuticThemeText}>{theme}</Text>
              </View>
            ))}
          </View>
        )}

        {ents.length > 0 && (
          <View style={styles.entitiesContainer}>
            {ents.map((entity, i) => (
              <View key={i} style={styles.entityChip}>
                <Text style={styles.entityText}>{entity.name}</Text>
              </View>
            ))}
          </View>
        )}

        {nsContext && (
          <View style={styles.contextIndicator}>
            <Text style={styles.contextText}>
              State: {nsContext.state} ({nsContext.intensity}/10)
            </Text>
          </View>
        )}

        {practice && (
          <TouchableOpacity
            style={styles.practiceIndicator}
            onPress={() => {
              setCurrentPractice({
                ...practice,
                onComplete: handlePracticeComplete,
              });
            }}
          >
            {practice.urgency === 'high' ? (
              <RotateCw size={14} color={colors.primary} strokeWidth={2.5} />
            ) : (
              <Image source={icons.meditate} style={styles.practiceIndicatorIcon} resizeMode="contain" />
            )}
            <Text style={styles.practiceText}>
              {practice.urgency === 'high'
                ? 'Practice will appear shortly...'
                : 'Tap for practice: ' + (practice.title || 'Practice available')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Adapt {role, content, ...therapeutic fields} → ChatConversation shape.
  // Pass-through all the decoration fields so renderMessageExtras can use them.
  const toChatMessages = (msgs) =>
    msgs.map((m, i) => ({
      id: m.timestamp ? `${i}-${new Date(m.timestamp).getTime()}` : `${i}`,
      role: m.role,
      content: m.content,
      bullets: m.bullets,
      contentAfter: m.contentAfter,
      therapeuticThemes: m.therapeuticThemes,
      entities: m.entities,
      nervousSystemContext: m.nervousSystemContext,
      requiresPractice: m.requiresPractice,
    }));

  const inputBlocked = isLoading;
  const inputPlaceholder = (() => {
    switch (nervousSystemState) {
      case 'sympathetic': return "Take your time... what's present for you?";
      case 'dorsal': return 'No pressure... share whatever feels safe';
      default: return 'What insights would you like to explore therapeutically?';
    }
  })();

  // While a practice is active, input is replaced by a status banner;
  // EmbeddedPracticeWidget renders as an overlay on top of everything.
  const inputReplacement = currentPractice ? (
    <View style={styles.practiceIndicatorBottom}>
      <Image source={icons.meditate} style={styles.practiceBannerIcon} resizeMode="contain" />
      <Text style={styles.practiceIndicatorText}>
        Practice in progress: {currentPractice.title}
      </Text>
    </View>
  ) : null;

  const overlay = currentPractice ? (
    <EmbeddedPracticeWidget
      practice={currentPractice}
      nervousSystemState={nervousSystemState}
      onComplete={handlePracticeComplete}
      onSkip={() => setCurrentPractice(null)}
    />
  ) : null;

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ChatConversation
          messages={toChatMessages(messages)}
          isTyping={isLoading}
          onSend={handleSendMessage}
          inputText={userInput}
          onInputTextChange={setUserInput}
          inputPlaceholder={inputPlaceholder}
          inputDisabled={inputBlocked}
          inputReplacement={inputReplacement}
          header={renderHeader()}
          renderMessageExtras={renderMessageExtras}
          overlay={overlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  switchText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  nervousSystemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
  },
  nervousSystemIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stateIcon: {
    width: 28,
    height: 28,
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
    color: colors.text,
    fontWeight: '500',
  },
  practiceCount: {
    fontSize: 11,
    color: colors.text,
    opacity: 0.7,
  },
  therapeuticFocusContainer: {
    marginHorizontal: 16,
    paddingVertical: 8,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.bubbleArchetypal,
    borderRadius: 8,
  },
  focusChipText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '500',
  },
  therapeuticThemesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
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
    marginTop: 6,
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
  contextIndicator: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  contextText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  practiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(93, 134, 214, 0.1)',
    borderRadius: 8,
  },
  practiceIndicatorIcon: {
    width: 16,
    height: 16,
  },
  practiceText: {
    flex: 1,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  practiceBannerIcon: {
    width: 22,
    height: 22,
  },
  practiceIndicatorBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  practiceIndicatorText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
};

export default TherapeuticIntegrationScreen;
