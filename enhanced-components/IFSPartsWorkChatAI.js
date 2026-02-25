import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IFSAIService } from '../lib/ifsAIService';
import { colors } from '../theme/colors';

/**
 * AI-Powered IFS Parts Work Chat
 * Uses Claude API with offline fallback
 */
const IFSPartsWorkChatAI = ({ onComplete, onSkip }) => {
  const [currentPhase, setCurrentPhase] = useState('intro');
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAIMode, setIsAIMode] = useState(true);

  const scrollViewRef = useRef(null);
  const ifsService = useRef(new IFSAIService()).current;

  useEffect(() => {
    // Initialize with welcome message
    addMessage('assistant', getIntroMessage(), ['Begin Session', 'Learn More About IFS First']);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  const getIntroMessage = () => {
    return `Welcome to IFS Parts Work.

This AI-guided session will help you get to know one of your parts using the Six F's framework:

**Find** - Locate the part
**Focus** - Attend to it
**Flesh Out** - Learn its story
**Feel Toward** - Check your Self energy
**BeFriend** - Build connection
**Fears** - Understand concerns

I'll guide you gently through each step. You're in control the whole time.`;
  };

  const getLearnMoreMessage = () => {
    return `**What is IFS?**

Internal Family Systems views your mind as made up of different "parts" - like sub-personalities with their own feelings, beliefs, and roles.

**The Self** is your core - characterized by the 8 C's:
Calm, Clarity, Compassion, Confidence, Courage, Creativity, Curiosity, Connectedness

**Parts have three types:**
• **Exiles** - Young, wounded parts carrying pain
• **Managers** - Parts that control daily life to prevent pain
• **Firefighters** - Emergency responders when exiles break through

All parts have positive intentions, even when their methods cause problems. This work is about building relationship with them.`;
  };

  const addMessage = (sender, text, options = null) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      sender,
      text,
      options,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAI: sender === 'assistant' && isAIMode
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleOptionSelect = async (option) => {
    addMessage('user', option);

    if (currentPhase === 'intro') {
      if (option === 'Begin Session') {
        setCurrentPhase('find');
        setIsTyping(true);

        setTimeout(async () => {
          const aiResponse = await ifsService.sendMessage(
            "I'd like to begin working with a part.",
            'find'
          );
          setIsTyping(false);
          setIsAIMode(aiResponse.isAI);
          addMessage('assistant', aiResponse.response);
        }, 1000);
      } else {
        // Learn More
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addMessage('assistant', getLearnMoreMessage(), ['Start Working With a Part', 'Back to Home']);
        }, 800);
      }
    } else if (option === 'Start Working With a Part') {
      setCurrentPhase('find');
      setIsTyping(true);

      setTimeout(async () => {
        const aiResponse = await ifsService.sendMessage(
          "I'd like to begin working with a part.",
          'find'
        );
        setIsTyping(false);
        setIsAIMode(aiResponse.isAI);
        addMessage('assistant', aiResponse.response);
      }, 1000);
    } else if (option === 'Back to Home') {
      if (onSkip) onSkip();
    } else if (option === 'Save This Session') {
      handleComplete();
    } else if (option === 'Work With Another Part') {
      resetSession();
    } else if (option === 'Finish') {
      handleComplete();
    } else {
      // Generic option handling
      await handleSendMessage(option);
    }
  };

  const handleSendMessage = async (messageOverride = null) => {
    const message = messageOverride || userInput.trim();
    if (!message) return;

    addMessage('user', message);
    if (!messageOverride) {
      setUserInput('');
    }
    setIsTyping(true);

    try {
      // Get AI response based on current phase
      const aiResponse = await ifsService.sendMessage(message, currentPhase);

      setIsTyping(false);
      setIsAIMode(aiResponse.isAI);
      addMessage('assistant', aiResponse.response);

      // Update session data based on phase
      updateSessionDataFromPhase(message);

      // Advance phase after certain steps
      advancePhaseIfNeeded(message, aiResponse.response);

    } catch (error) {
      setIsTyping(false);
      console.error('Error getting response:', error);
      addMessage('assistant', "I'm having trouble connecting right now, but I'm still here with you. What would you like to explore?");
    }
  };

  const updateSessionDataFromPhase = (message) => {
    const lowerMessage = message.toLowerCase();

    switch (currentPhase) {
      case 'find':
        ifsService.updateSessionData('targetPart', message);
        break;
      case 'findLocation':
        ifsService.updateSessionData('location', message);
        break;
      case 'focus':
        ifsService.updateSessionData('description', message);
        break;
      case 'fleshOut':
        ifsService.updateSessionData('partRole', message);
        break;
      case 'feelToward':
        ifsService.updateSessionData('selfEnergy', message);
        break;
      case 'befriend':
        ifsService.updateSessionData('partResponse', message);
        break;
      case 'fears':
        ifsService.updateSessionData('partFears', message);
        break;
    }
  };

  const advancePhaseIfNeeded = (userMessage, aiResponse) => {
    const lowerAI = aiResponse.toLowerCase();
    const lowerUser = userMessage.toLowerCase();

    // Phase progression logic
    if (currentPhase === 'find' && (lowerAI.includes('where do you') || lowerAI.includes('body'))) {
      setCurrentPhase('findLocation');
    } else if (currentPhase === 'findLocation' && (lowerAI.includes('what do you notice') || lowerAI.includes('images') || lowerAI.includes('sensations'))) {
      setCurrentPhase('focus');
    } else if (currentPhase === 'focus' && (lowerAI.includes('job') || lowerAI.includes('role') || lowerAI.includes('trying to do'))) {
      setCurrentPhase('fleshOut');
    } else if (currentPhase === 'fleshOut' && lowerAI.includes('how do you feel toward')) {
      setCurrentPhase('feelToward');
    } else if (currentPhase === 'feelToward') {
      // Check if blending detected
      const selfQualities = ['curious', 'compassion', 'calm', 'open', 'interested'];
      const blendedQualities = ['annoyed', 'frustrated', 'critical', 'angry', 'scared'];

      const hasSelfEnergy = selfQualities.some(q => lowerUser.includes(q));
      const isBlended = blendedQualities.some(q => lowerUser.includes(q));

      if (isBlended && (lowerAI.includes('step back') || lowerAI.includes('protective'))) {
        setCurrentPhase('unblend');
      } else if (hasSelfEnergy || lowerAI.includes('appreciate') || lowerAI.includes('extend')) {
        setCurrentPhase('befriend');
      }
    } else if (currentPhase === 'unblend' && lowerAI.includes('respond')) {
      setCurrentPhase('befriend');
    } else if (currentPhase === 'befriend' && (lowerAI.includes('afraid') || lowerAI.includes('fear') || lowerAI.includes('worry'))) {
      setCurrentPhase('fears');
    } else if (currentPhase === 'fears' && (lowerAI.includes('understand') || lowerAI.includes('valid') || lowerAI.includes('appreciate'))) {
      // Session nearing completion
      setTimeout(() => {
        showSummary();
      }, 2000);
    }
  };

  const showSummary = () => {
    const sessionData = ifsService.getSessionData();
    const summary = `You've done beautiful work getting to know this part.

**Part You Worked With:** ${sessionData.targetPart || 'A part of you'}

**Location:** ${sessionData.location || 'Noticed in your system'}

**What You Noticed:** ${sessionData.description || 'Various sensations and experiences'}

**Part's Role:** ${sessionData.partRole || 'Protecting you in its own way'}

**Your Self Energy:** ${sessionData.selfEnergy || 'Present with curiosity'}

**Part's Fears:** ${sessionData.partFears || 'Concerns about safety'}

**Part's Response:** ${sessionData.partResponse || 'Beginning to trust'}

This is a beginning. Parts work is about ongoing relationship. You can return to this part anytime with curiosity and compassion.`;

    setCurrentPhase('summary');
    addMessage('assistant', summary, ['Save This Session', 'Work With Another Part', 'Finish']);
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        timestamp: new Date().toISOString(),
        sessionData: ifsService.getSessionData(),
        messages,
        wasAIPowered: ifsService.isUsingAI()
      });
    }
  };

  const resetSession = () => {
    ifsService.reset();
    setMessages([]);
    setCurrentPhase('intro');
    addMessage('assistant', getIntroMessage(), ['Begin Session']);
  };

  const renderMessage = (message) => {
    const isUser = message.sender === 'user';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble
          ]}
        >
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.assistantText
          ]}>
            {message.text}
          </Text>

          {/* Render options if present */}
          {message.options && !isUser && (
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
          )}

          <View style={styles.messageFooter}>
            <Text style={[
              styles.timestamp,
              isUser ? styles.userTimestamp : styles.assistantTimestamp
            ]}>
              {message.timestamp}
            </Text>
            {message.isAI && !isUser && (
              <Text style={styles.aiIndicator}>AI</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>IFS Parts Work</Text>
          {!ifsService.isUsingAI() && (
            <Text style={styles.offlineIndicator}>Offline Mode</Text>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}

        {/* Typing indicator */}
        {isTyping && (
          <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area - Show for most phases except intro and summary */}
      {currentPhase !== 'intro' && currentPhase !== 'summary' && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={userInput}
            onChangeText={setUserInput}
            placeholder="Share your experience..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
            onSubmitEditing={() => {
              if (userInput.trim()) {
                handleSendMessage();
              }
            }}
          />
          <TouchableOpacity
            style={[styles.sendButton, !userInput.trim() && styles.sendButtonDisabled]}
            onPress={() => handleSendMessage()}
            disabled={!userInput.trim() || isTyping}
          >
            {isTyping ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboardAvoid: {
    flex: 1,
    backgroundColor: colors.background,
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
  backButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  offlineIndicator: {
    fontSize: 11,
    color: '#f59e0b',
    marginTop: 2,
  },
  headerSpacer: {
    width: 60,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: colors.textInverse,
  },
  assistantText: {
    color: colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  assistantTimestamp: {
    color: colors.mediumGray,
  },
  aiIndicator: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: `${colors.primary}1A`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  optionsContainer: {
    marginTop: 12,
    gap: 8,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 10,
  },
  optionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mediumGray,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 0.4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.offWhite,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    minWidth: 70,
  },
  sendButtonDisabled: {
    backgroundColor: colors.mediumGray,
  },
  sendButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default IFSPartsWorkChatAI;
