/**
 * Philosophical Talkthrough Screen
 *
 * Conversational screen for a single philosophical exploration.
 * Pattern follows ActiveImaginationScreen.js — uses huxleyService in
 * 'philosophical_talkthrough' mode with the same chat UI.
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
import { colors, gradients } from '../theme/colors';
import { getTopicById } from '../content/philosophicalTalkthroughs';
import { ChatConversation } from '../components/chat';

const PHASE_LABELS = {
  opening_inquiry: 'Opening Inquiry',
  deepening: 'Deepening',
  contemplation: 'Contemplation',
  journaling: 'Journaling',
  complete: 'Complete',
};

const PhilosophicalTalkthroughScreen = ({ navigation, route }) => {
  const topicId = route?.params?.topicId;
  const topicData = getTopicById(topicId);

  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAIMode, setIsAIMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentPhase, setCurrentPhase] = useState('opening_inquiry');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeSession = async () => {
    if (!topicData) {
      setLoading(false);
      addMessage('assistant', "Something went wrong — I couldn't find that topic. Please go back and try again.");
      return;
    }

    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        await huxleyService.initialize(userData.id);
      }

      huxleyService.setMode('philosophical_talkthrough', { clearHistory: true });

      const handler = huxleyService.modeHandlers.philosophical_talkthrough;
      if (handler) {
        handler.selectedTopic = topicData;
      }

      setIsTyping(true);
      const response = await huxleyService.chat('', {
        modeContext: { selectedTopic: topicData },
      });

      setIsTyping(false);
      addMessage('assistant', response.message || topicData.openingTheme);
    } catch (error) {
      console.error('[PhilosophicalTalkthrough] Init error:', error);
      addMessage('assistant', topicData.openingTheme + '\n\nWhat comes up for you when you sit with that?');
    } finally {
      setLoading(false);
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

  const handleSendMessage = async (messageOverride = null) => {
    const message = (messageOverride ?? userInput).trim();
    if (!message || isComplete) return;

    if (!messageOverride) {
      addMessage('user', message);
      setUserInput('');
    }
    setIsTyping(true);

    try {
      const response = await huxleyService.chat(message, {
        modeContext: { selectedTopic: topicData },
      });

      setIsTyping(false);
      setIsAIMode(response.isAI);

      if (response.sessionProgress) {
        setCurrentPhase(response.sessionProgress.phase);

        if (response.sessionProgress.isComplete) {
          setIsComplete(true);
        }

        if (response.sessionProgress.phase === 'journaling' && topicData.journalPrompts) {
          const promptIndex = response.sessionProgress.journalResponseCount || 0;
          if (promptIndex < topicData.journalPrompts.length) {
            addMessage('assistant', response.message, [topicData.journalPrompts[promptIndex]]);
            return;
          }
        }
      }

      addMessage('assistant', response.message);

      if (response.sessionProgress?.isComplete) {
        setTimeout(() => {
          addMessage(
            'assistant',
            "Thank you for sitting with these questions. They don't need answers — just your attention.\n\nCarry them lightly.",
            ['Close'],
          );
        }, 1500);
      }
    } catch (error) {
      setIsTyping(false);
      console.error('[PhilosophicalTalkthrough] Chat error:', error);
      addMessage('assistant', "Take your time. What's present for you right now?");
    }
  };

  const handleOptionSelect = (option) => {
    if (option === 'Close') {
      navigation.goBack();
      return;
    }
    addMessage('user', option);
    handleSendMessage(option);
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

  const toChatMessages = (msgs) =>
    msgs.map((m) => ({
      id: m.id,
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
      options: m.options,
    }));

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
        <Text style={styles.headerTitle}>{topicData?.title || 'Talkthrough'}</Text>
        <Text style={styles.phaseIndicator}>
          {PHASE_LABELS[currentPhase] || currentPhase}
        </Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );

  // Hide input row when the talkthrough completes.
  const onSend = isComplete ? undefined : () => handleSendMessage();

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
          onSend={onSend}
          inputText={userInput}
          onInputTextChange={setUserInput}
          inputPlaceholder="Share what comes to mind..."
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
  phaseIndicator: {
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

export default PhilosophicalTalkthroughScreen;
