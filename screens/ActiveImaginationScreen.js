/**
 * Active Imagination Screen
 *
 * Facilitates Jung/Johnson's Active Imagination practice through Huxley.
 * 4 phases: Safety Check -> Invitation -> Dialogue -> Values -> Ritual
 *
 * Pattern follows IFSPartsWorkChatWithContext.js — uses huxleyService in
 * 'active_imagination' mode with the same chat UI and session persistence.
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import huxleyService from '../lib/huxleyService';
import ifsContextService from '../lib/ifsContextService';
import masterContextService from '../lib/masterContextService';
import { supabase } from '../lib/supabase';
import { colors, gradients } from '../theme/colors';
import { ChatConversation } from '../components/chat';

const ENTRY_METHODS = [
  { id: 'open', label: 'Open Invitation', description: 'Empty the mind and see who appears' },
  { id: 'fantasy', label: 'From a Feeling or Mood', description: 'Enter into a recurring thought or emotion' },
  { id: 'inner_place', label: 'Visit an Inner Place', description: 'Go to a landscape or room in your imagination' },
  { id: 'journey_figure', label: 'From a Journey Figure', description: 'Continue dialogue with a known inner figure' },
];

const ActiveImaginationScreen = ({ navigation, route }) => {
  const preloadedFigure = route?.params?.figure || null;

  const [currentPhase, setCurrentPhase] = useState('safety_check');
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAIMode, setIsAIMode] = useState(true);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState(null);
  const [entryMethod, setEntryMethod] = useState(preloadedFigure ? 'journey_figure' : null);
  const [knownParts, setKnownParts] = useState([]);
  const [activeFigure, setActiveFigure] = useState(preloadedFigure);
  const [discoveredFigures, setDiscoveredFigures] = useState([]);
  const [sessionStartTime] = useState(new Date());
  const [exchangeCount, setExchangeCount] = useState(0);
  const [nervousSystemStart, setNervousSystemStart] = useState(null);
  const [dialogueSummary, setDialogueSummary] = useState('');
  const [ethicalInsights, setEthicalInsights] = useState('');
  const [ritualDesigned, setRitualDesigned] = useState('');

  useEffect(() => {
    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeSession = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        setUserId(userData.id);

        await huxleyService.initialize(userData.id);
        huxleyService.setMode('active_imagination', { clearHistory: true });

        const partsData = await ifsContextService.loadUserParts(userData.id);
        setKnownParts(partsData.allParts || []);
      } else {
        huxleyService.setMode('active_imagination', { clearHistory: true });
      }

      if (preloadedFigure) {
        addMessage('assistant', getSafetyCheckMessage(preloadedFigure));
      } else {
        addMessage('assistant', getSafetyCheckMessage());
      }
    } catch (error) {
      console.error('[ActiveImagination] Init error:', error);
      addMessage('assistant', getSafetyCheckMessage());
    } finally {
      setLoading(false);
    }
  };

  const getSafetyCheckMessage = (figure) => {
    const figureContext = figure
      ? `\n\nI see you'd like to continue a dialogue with ${figure.name || figure.part_name || 'a figure'} from your previous work.`
      : '';

    return `Welcome to Active Imagination.${figureContext}

This is a practice developed by Carl Jung — a conscious dialogue between you and the figures that live in your inner world. It's serious inner work, not a visualization exercise.

Before we begin, a few things:
- You'll need 20-45 minutes of uninterrupted time
- Have something to write with nearby — recording the dialogue is important
- If at any point you feel overwhelmed, we'll pause and ground together

Are you in a relatively calm, grounded state right now? Do you have someone you could reach out to if the session becomes intense?`;
  };

  const getEntrySelectionMessage = () => `Good. Let's begin.

How would you like to enter the imagination today?

Choose your entry point:`;

  const getInvitationPrompt = (method, figure) => {
    switch (method) {
      case 'open':
        return 'Close your eyes if that feels comfortable. Let your mind settle completely. Direct your inner eye to a quiet, dim place inside you. Wait with alert attention — not looking for anything, just watching. What appears? Even something small or seemingly insignificant.';
      case 'fantasy':
        return "What feeling or recurring thought has been pulling at you lately? Something that keeps surfacing — an emotion, a mood, an image that won't let go. Describe it, and let's see who or what is behind it.";
      case 'inner_place':
        return "Is there a place in your imagination you feel drawn to right now? A landscape, a room, a cave, a threshold, a body of water? Go there in your mind's eye. Describe what you see, hear, and feel.";
      case 'journey_figure':
        if (figure) {
          return `You encountered ${figure.name || figure.part_name} in your previous work. Let's invite them back.\n\nClose your eyes. Picture ${figure.name || figure.part_name} as you last saw them. Call to them gently. Where do they appear? What do they look like now?`;
        }
        return 'Which figure from a recent journey or dream would you like to invite back? Describe them — their appearance, their quality, what they represent.';
      default:
        return 'Let your mind settle. Wait with alert attention. What comes to you?';
    }
  };

  const addMessage = (sender, text, options = null) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      sender,
      text,
      options,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAI: sender === 'assistant' && isAIMode,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleOptionSelect = async (option) => {
    addMessage('user', option);

    if (currentPhase === 'safety_check') {
      await handleSafetyResponse(option);
      return;
    }

    if (currentPhase === 'entry_selection') {
      const method = ENTRY_METHODS.find((m) => m.label === option);
      if (method) {
        await handleEntryMethodSelection(method.id);
        return;
      }
      if (option.startsWith('Figure: ')) {
        const partName = option.replace('Figure: ', '');
        const part = knownParts.find((p) => p.part_name === partName);
        if (part) {
          setActiveFigure(part);
          await handleEntryMethodSelection('journey_figure', part);
          return;
        }
      }
    }

    if (option === 'Move to Values Check') return transitionToValues();
    if (option === 'Move to Ritual') return transitionToRitual();
    if (option === 'End Session') return handleEndSession();
    if (option === 'Save Figure to Parts Inventory') return handleSaveFigure();
    if (option === 'Ground and close') return handleGroundAndClose();
    if (option === 'Regulate first') return navigation.navigate('NervousSystemCheckin');

    await handleSendMessage(option);
  };

  const handleSafetyResponse = async (response) => {
    const lower = response.toLowerCase();
    const notReady =
      lower.includes('no') || lower.includes("can't") || lower.includes('not really') ||
      lower.includes('activated') || lower.includes('anxious') || lower.includes('overwhelm');

    if (notReady) {
      addMessage(
        'assistant',
        "That's completely okay. Active Imagination works best when you're starting from a grounded place. Your nervous system's readiness matters.\n\nWould you like to do a brief grounding exercise first, or come back another time?",
        ['Regulate first', 'End Session'],
      );
      return;
    }

    setNervousSystemStart('grounded');

    if (preloadedFigure) {
      setCurrentPhase('invitation');
      setEntryMethod('journey_figure');
      setIsTyping(true);
      const prompt = getInvitationPrompt('journey_figure', preloadedFigure);
      setTimeout(() => {
        setIsTyping(false);
        addMessage('assistant', prompt);
      }, 600);
    } else {
      setCurrentPhase('entry_selection');
      const entryMessage = getEntrySelectionMessage();
      const options = ENTRY_METHODS.map((m) => m.label);

      if (knownParts.length > 0) {
        addMessage('assistant', entryMessage, options);
      } else {
        const filteredOptions = options.filter((o) => o !== 'From a Journey Figure');
        addMessage('assistant', entryMessage, filteredOptions);
      }
    }
  };

  const handleEntryMethodSelection = async (method, figure = null) => {
    setEntryMethod(method);
    setCurrentPhase('invitation');

    if (method === 'journey_figure' && !figure && knownParts.length > 0) {
      const partOptions = knownParts.slice(0, 6).map((p) => `Figure: ${p.part_name}`);
      addMessage('assistant', 'Which figure would you like to invite back?', partOptions);
      return;
    }

    setIsTyping(true);
    const prompt = getInvitationPrompt(method, figure || activeFigure);
    setTimeout(() => {
      setIsTyping(false);
      addMessage('assistant', prompt);
    }, 600);
  };

  const handleSendMessage = async (messageOverride = null) => {
    const message = (messageOverride ?? userInput).trim();
    if (!message) return;

    if (!messageOverride) {
      addMessage('user', message);
      setUserInput('');
    }
    setIsTyping(true);

    try {
      const newCount = exchangeCount + 1;
      setExchangeCount(newCount);

      const realPersonRedirect = checkForRealPerson(message);
      if (realPersonRedirect) {
        setIsTyping(false);
        addMessage('assistant', realPersonRedirect);
        return;
      }

      const phaseContext = buildPhaseContext(message, newCount);

      const aiResponse = await huxleyService.chat(message, {
        phase: currentPhase,
        modeContext: phaseContext,
      });

      setIsTyping(false);
      setIsAIMode(aiResponse.isAI);

      if (aiResponse.therapeuticData?.innerFigures) {
        updateDiscoveredFigures(aiResponse.therapeuticData.innerFigures);
      }

      addMessage('assistant', aiResponse.message);

      if (currentPhase === 'values') {
        setEthicalInsights((prev) => (prev ? prev + '\n' + message : message));
      } else if (currentPhase === 'ritual') {
        setRitualDesigned(message);
      }

      advancePhase(message, aiResponse.message, newCount);
    } catch (error) {
      setIsTyping(false);
      console.error('[ActiveImagination] Chat error:', error);
      addMessage(
        'assistant',
        "I'm here with you. Take a moment. When you're ready, continue describing what you see or feel.",
      );
    }
  };

  const checkForRealPerson = (message) => {
    const lower = message.toLowerCase();
    const realPersonIndicators = [
      'my mother', 'my mom', 'my father', 'my dad', 'my husband', 'my wife',
      'my partner', 'my boss', 'my ex', 'my sister', 'my brother',
      'my therapist', 'my friend',
    ];

    const isRealPerson = realPersonIndicators.some((indicator) => lower.includes(indicator));

    if (isRealPerson && currentPhase === 'dialogue') {
      return "I notice you're describing a real person from your life. For Active Imagination to work safely, we need to dialogue with the inner quality this person represents, not the external person themselves.\n\nCan you ask this figure to show its true form — the part of YOU it represents? What quality or energy does this person carry for you?";
    }

    return null;
  };

  const buildPhaseContext = (message, count) => {
    const context = {
      phase: currentPhase,
      entryMethod,
      exchangeCount: count,
      activeFigure: activeFigure ? (activeFigure.name || activeFigure.part_name) : null,
      discoveredFigures: discoveredFigures.map((f) => f.name),
    };

    if (currentPhase === 'dialogue' && count > 0 && count % 6 === 0) {
      context.groundingCheckDue = true;
    }

    return context;
  };

  const advancePhase = (userMessage, aiResponse, count) => {
    const lower = aiResponse.toLowerCase();

    if (currentPhase === 'invitation') {
      const figureAppeared =
        lower.includes('what do they') || lower.includes('what does') ||
        lower.includes('stay with') || lower.includes('what do you feel') ||
        count >= 3;
      if (figureAppeared) {
        setCurrentPhase('dialogue');
      }
    }

    if (currentPhase === 'dialogue' && count >= 12 && count % 6 === 0) {
      setDialogueSummary(
        messages.filter((m) => m.sender === 'user').map((m) => m.text).join('\n'),
      );

      addMessage(
        'assistant',
        "We've been in deep dialogue for a while. How are you feeling? Would you like to continue, or does this feel like a natural pause?",
        ['Continue dialogue', 'Move to Values Check'],
      );
    }

    if (currentPhase === 'values' && count >= 2) {
      setTimeout(() => {
        addMessage(
          'assistant',
          'Thank you for that reflection. Shall we move to the final step — choosing a small physical act to honor this experience?',
          ['Move to Ritual', 'Continue reflecting'],
        );
      }, 1000);
    }

    if (currentPhase === 'ritual' && count >= 1) {
      const saveOptions = discoveredFigures.length > 0
        ? ['Save Figure to Parts Inventory', 'Ground and close']
        : ['Ground and close'];

      setTimeout(() => {
        addMessage(
          'assistant',
          "Beautiful. When you're ready, carry that intention into a quiet moment today.",
          saveOptions,
        );
      }, 1000);
    }
  };

  const transitionToValues = () => {
    setCurrentPhase('values');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage(
        'assistant',
        "Let's step back and apply ethical consciousness to what just happened.\n\nDid any figure demand something extreme — total devotion, abandoning your responsibilities, or acting against your values?\n\nDid one voice try to take over completely, leaving no room for other perspectives?\n\nAre there human values — fairness, kindness, commitment to your relationships — that need to be honored alongside what you experienced?",
      );
    }, 800);
  };

  const transitionToRitual = () => {
    setCurrentPhase('ritual');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage(
        'assistant',
        "Now comes the final step: incarnating the meaning.\n\nWhat you experienced in this dialogue has real significance. To anchor it in your life, choose a small physical act — something solitary, quiet, and simple.\n\nIt should embody the MEANING, not act it out literally.\n\nExamples: lighting a candle, placing a stone on a windowsill, writing a single word on paper, touching water, taking a mindful walk.\n\nWhat physical act would honor what you experienced today?",
      );
    }, 800);
  };

  const updateDiscoveredFigures = (figures) => {
    setDiscoveredFigures((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const newFigures = figures.filter((f) => !existing.has(f.name));
      return [...prev, ...newFigures];
    });
  };

  const handleSaveFigure = async () => {
    if (!userId || discoveredFigures.length === 0) {
      addMessage('assistant', 'No new figures to save right now.', ['Ground and close']);
      return;
    }

    try {
      for (const figure of discoveredFigures) {
        await ifsContextService.savePart(userId, {
          part_name: figure.name,
          part_role: 'active_imagination_figure',
          appearance_description: figure.qualities?.join(', ') || '',
          part_feelings: figure.wants || '',
          part_fears: figure.fears || '',
          protective_strategy: '',
          feelings_toward_part: '',
          work_phase: 'discovery',
          session_notes: [{ date: new Date().toISOString(), notes: `Discovered during Active Imagination (${entryMethod})` }],
        });
      }

      addMessage(
        'assistant',
        `Saved ${discoveredFigures.length} figure(s) to your parts inventory. You can continue working with them in IFS Parts Work or future Active Imagination sessions.`,
        ['Ground and close'],
      );
    } catch (error) {
      console.error('[ActiveImagination] Save figure error:', error);
      addMessage('assistant', 'There was an issue saving. Your session dialogue is still preserved.', ['Ground and close']);
    }
  };

  const handleEndSession = async () => {
    await saveSession();
    addMessage(
      'assistant',
      'Take a few deep breaths. Feel your feet on the ground. Notice the room around you — its sounds, its light, its temperature.\n\nThe figures will wait. You can return to this dialogue whenever you\'re ready.\n\nThank you for doing this deep inner work.',
    );
  };

  const handleGroundAndClose = async () => {
    await saveSession();
    addMessage(
      'assistant',
      "Before you go: Feel your feet on the ground. Take three slow breaths. Look around the room and name three things you can see.\n\nYou've done meaningful inner work today. Carry it lightly.\n\nThe figures will be there when you return.",
    );

    setTimeout(() => {
      if (navigation) navigation.goBack();
    }, 5000);
  };

  const saveSession = async () => {
    if (!userId) return;

    try {
      const duration = Math.round((new Date() - sessionStartTime) / 1000 / 60);
      const conversationText = messages
        .filter((m) => m.sender === 'user' || m.sender === 'assistant')
        .map((m) => `${m.sender}: ${m.text}`)
        .join('\n');

      const { error } = await supabase
        .from('active_imagination_sessions')
        .insert({
          user_id: userId,
          entry_method: entryMethod || 'open',
          source_figure_id: preloadedFigure?.id || activeFigure?.id || null,
          inner_figures: discoveredFigures,
          dialogue_summary: dialogueSummary || conversationText.substring(0, 2000),
          ethical_insights: ethicalInsights,
          ritual_designed: ritualDesigned,
          ritual_completed: false,
          nervous_system_start: nervousSystemStart,
          nervous_system_end: null,
          session_duration_minutes: duration,
          session_notes: { exchangeCount, phases_reached: currentPhase },
        });

      if (error) {
        console.error('[ActiveImagination] Save session error:', error);
      } else {
        console.log('[ActiveImagination] Session saved');
        masterContextService.clearCache(userId);
      }
    } catch (error) {
      console.error('[ActiveImagination] Save session error:', error);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={gradients.standard}
        start={gradients.standardStart}
        end={gradients.standardEnd}
        style={styles.container}
      >
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Preparing the space...</Text>
        </View>
      </LinearGradient>
    );
  }

  // Convert internal {sender, text, options} to ChatConversation shape.
  // Options pass through so renderMessageExtras can render them as buttons.
  const toChatMessages = (msgs) =>
    msgs.map((m) => ({
      id: m.id,
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
      options: m.options,
    }));

  // Tappable option buttons that live inside an assistant bubble.
  const renderMessageExtras = (message) => {
    if (!message.options || message.options.length === 0) return null;
    return (
      <View style={styles.optionsContainer}>
        {message.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionButton}
            onPress={() => handleOptionSelect(option)}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation?.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Active Imagination</Text>
        {activeFigure && (
          <Text style={styles.figureIndicator}>
            With: {activeFigure.name || activeFigure.part_name}
          </Text>
        )}
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );

  // Hide input row during entry-method selection (user is choosing from option
  // buttons instead). Withholding onSend tells ChatConversation to skip it.
  const showInput = currentPhase !== 'entry_selection';

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
          isTyping={isTyping}
          onSend={showInput ? () => handleSendMessage() : undefined}
          inputText={userInput}
          onInputTextChange={setUserInput}
          inputPlaceholder="Describe what you see, feel, or hear..."
          inputDisabled={isTyping}
          header={renderHeader()}
          renderMessageExtras={renderMessageExtras}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  figureIndicator: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  headerSpacer: {
    width: 60,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  optionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ActiveImaginationScreen;
