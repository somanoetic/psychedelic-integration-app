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
  Keyboard,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import huxleyService from '../lib/huxleyService';
import ifsContextService from '../lib/ifsContextService';
import masterContextService from '../lib/masterContextService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';

/**
 * IFS Parts Work Chat with Context System
 * - Always starts with "what part is coming up?"
 * - Checks database for known parts
 * - Handles mid-session part switches
 * - Detects duplicates and offers merging
 * - Links protectors to exiles
 * - Saves session history
 */
const IFSPartsWorkChatWithContext = ({ navigation, onComplete, onSkip }) => {
  const [currentPhase, setCurrentPhase] = useState('check_in');
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAIMode, setIsAIMode] = useState(true);
  const [loading, setLoading] = useState(true);

  // Context state
  const [userId, setUserId] = useState(null);
  const [knownParts, setKnownParts] = useState([]);
  const [currentPart, setCurrentPart] = useState(null);
  const [sessionType, setSessionType] = useState(null); // 'discovery' or 'check_in'
  const [sessionStartTime] = useState(new Date());

  // Session progress from mode handler (replaces manual sessionData + phase tracking)
  const [sessionProgress, setSessionProgress] = useState(null);

  const scrollViewRef = useRef(null);

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

  useEffect(() => {
    initializeSession();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  const initializeSession = async () => {
    try {
      // Get user ID
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        setUserId(userData.id);

        // Initialize Huxley with user context and set IFS mode
        await huxleyService.initialize(userData.id);
        huxleyService.setMode('ifs', { clearHistory: true });
        console.log('[IFS Chat] Huxley initialized in IFS mode - AI can now reference psychedelic journeys, NS patterns, etc.');

        // Load known parts from database
        const partsData = await ifsContextService.loadUserParts(userData.id);
        setKnownParts(partsData.allParts || []);

        // Start with universal check-in question
        addMessage('assistant', getCheckInMessage(partsData.allParts), null);
      } else {
        // No user logged in - skip context
        addMessage('assistant', getIntroMessage(), ['Begin Session', 'Learn More About IFS First']);
      }
    } catch (error) {
      console.error('Error initializing IFS session:', error);
      addMessage('assistant', getIntroMessage(), ['Begin Session', 'Learn More About IFS First']);
    } finally {
      setLoading(false);
    }
  };

  const getCheckInMessage = (parts) => {
    if (!parts || parts.length === 0) {
      return `Welcome to IFS Parts Work.

**What part is coming up for you right now?**

Take a moment to notice... Is there a part that's active right now? Maybe a feeling, a voice, or a sensation that's asking for attention?

You can describe it in your own words - I'll help you get to know it.`;
    }

    const partsPreview = parts.slice(0, 5).map(p => `• ${p.part_name || 'Unnamed part'}`).join('\n');
    const moreCount = parts.length > 5 ? `\n... and ${parts.length - 5} more` : '';

    return `Welcome back to IFS Parts Work.

**What part is coming up for you right now?**

I see you've worked with these parts before:
${partsPreview}${moreCount}

Is one of these parts active right now, or is this a new part wanting attention?`;
  };

  const getIntroMessage = () => {
    return `Welcome to IFS Parts Work.

This AI-guided session will help you get to know one of your parts - those inner voices, feelings, or patterns that shape your experience.

We'll explore together at your pace, starting with noticing what's present, then getting curious about it, understanding its role, and building a relationship with it.

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
        await initializeSession();
      } else {
        // Learn More
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addMessage('assistant', getLearnMoreMessage(), ['Start Working With a Part', 'Back to Home']);
        }, 800);
      }
    } else if (currentPhase === 'check_in') {
      // Handle known part selection
      await handlePartSelection(option);
    } else if (option === 'Start Working With a Part') {
      await initializeSession();
    } else if (option === 'Back to Home') {
      if (onSkip) {
        onSkip();
      } else if (navigation) {
        navigation.goBack();
      }
    } else if (option === 'Save This Session') {
      await handleComplete();
    } else if (option === 'Work With Another Part') {
      resetSession();
    } else if (option === 'Finish') {
      await handleComplete();
    } else if (option.startsWith('Switch to:')) {
      // Handle mid-session part switch
      const partName = option.replace('Switch to: ', '');
      await handlePartSwitch(partName);
    } else if (option === 'Continue with current part' && currentPhase === 'exile_detected') {
      // User chooses to stay with protector (connection already recorded)
      addMessage('assistant', `Okay, let's continue with **${currentPart.part_name}**.

The connection to the exile has been noted - this helps us understand why this protector works so hard.

What else does this part want you to know?`);
      setCurrentPhase('befriend'); // Continue from where we were
    } else if (option === 'Tell me more' && currentPhase === 'exile_detected') {
      // User wants to understand the connection
      const detectedExileFromContext = knownParts.find(p => p.is_exile && messages[messages.length - 1].text.includes(p.part_name));
      if (detectedExileFromContext) {
        addMessage('assistant', `When a protector's work brings up an exile, it reveals the protective system.

**${currentPart.part_name}** (the protector) is working hard to keep **${detectedExileFromContext.part_name}** (the exile) safe and hidden. When you got close to the protector's feelings and fears, the exile it protects became visible.

This is actually beautiful - it shows how your parts are connected and working together, even when it doesn't always feel that way.

Would you like to continue working with the protector, or gently approach the exile?`,
          [`Switch to: ${detectedExileFromContext.part_name}`, 'Continue with current part']
        );
      }
    } else if (option.startsWith('Merge with:')) {
      // Handle duplicate merge
      const existingPartName = option.replace('Merge with: ', '');
      await handlePartMerge(existingPartName);
    } else {
      // Generic option handling
      await handleSendMessage(option);
    }
  };

  const handlePartSelection = async (userMessage) => {
    setIsTyping(true);

    // Check if user selected a known part or describing something new
    const matchedPart = findMatchingPart(userMessage);

    if (matchedPart) {
      // Known part - start check-in session
      setCurrentPart(matchedPart);
      setSessionType('check_in');
      setCurrentPhase('find');

      const checkInPrompt = `Great! Let's check in with **${matchedPart.part_name}**.

You last worked with this part on ${new Date(matchedPart.last_worked_with).toLocaleDateString()}.

**Reminder about this part:**
• Role: ${matchedPart.part_role}
${matchedPart.location_in_body ? `• Location: ${matchedPart.location_in_body}` : ''}
${matchedPart.protective_strategy ? `• Strategy: ${matchedPart.protective_strategy}` : ''}

How is this part showing up for you right now? What does it want you to know?`;

      setIsTyping(false);
      addMessage('assistant', checkInPrompt);
    } else {
      // New part - start discovery
      setSessionType('discovery');
      setCurrentPhase('find');

      // Handler controls the phase — just send the message
      const aiResponse = await huxleyService.chat(
        `The user is noticing: "${userMessage}". Help them begin discovering this part.`
      );

      setIsTyping(false);
      setIsAIMode(aiResponse.isAI);
      addMessage('assistant', aiResponse.message);
    }
  };

  const findMatchingPart = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    // Direct name match
    const directMatch = knownParts.find(part =>
      part.part_name && lowerMessage.includes(part.part_name.toLowerCase())
    );
    if (directMatch) return directMatch;

    // Role/strategy match
    const strategyMatch = knownParts.find(part =>
      (part.protective_strategy && lowerMessage.includes(part.protective_strategy.toLowerCase())) ||
      (part.part_feelings && lowerMessage.includes(part.part_feelings.toLowerCase()))
    );

    return strategyMatch || null;
  };

  const handlePartSwitch = async (partName) => {
    // Save current progress
    if (currentPart) {
      await ifsContextService.updatePart(currentPart.id, {
        last_worked_with: new Date().toISOString()
      });
    }

    // Find the new part
    const newPart = knownParts.find(p => p.part_name === partName);
    if (newPart) {
      setCurrentPart(newPart);
      addMessage('assistant', `Okay, let's shift our attention to **${partName}**.

This ${newPart.part_role} part is showing up now. What do you notice about it in this moment?`);
    }
  };

  const recordProtectorExileConnection = async (protectorId, exileId) => {
    try {
      // Link protector to exile in database
      await ifsContextService.linkProtectorToExile(protectorId, exileId);
      console.log(`Recorded connection: Protector ${protectorId} → Exile ${exileId}`);
    } catch (error) {
      console.error('Error recording protector-exile connection:', error);
    }
  };

  const handlePartLinking = async (exileName) => {
    // This function is now mainly for explicit user confirmation
    // The connection has already been recorded automatically
    const exile = knownParts.find(p => p.part_name === exileName && p.is_exile);

    if (exile && currentPart) {
      addMessage('assistant', `The connection between **${currentPart.part_name}** and **${exileName}** has been noted.

This is valuable information. The protector's job makes so much more sense now - it's working hard to keep ${exileName} safe.

Would you like to continue working with ${currentPart.part_name}, or do you feel drawn to gently approach ${exileName}?`);
    }
  };

  const handlePartMerge = async (existingPartName) => {
    const existingPart = knownParts.find(p => p.part_name === existingPartName);

    if (existingPart) {
      // Merge session data into existing part
      const currentSessionData = sessionData;
      await ifsContextService.updatePart(existingPart.id, {
        session_notes: [
          ...(existingPart.session_notes || []),
          {
            date: new Date().toISOString(),
            notes: `Merged session: ${JSON.stringify(currentSessionData)}`
          }
        ],
        last_worked_with: new Date().toISOString()
      });

      setCurrentPart(existingPart);
      addMessage('assistant', `Got it - we'll continue with **${existingPartName}**. All your insights from this session have been added to that part's history.`);
    }
  };

  const detectDuplicatePart = (newPartDescription) => {
    // Check if this sounds like an existing part
    const lowerDesc = newPartDescription.toLowerCase();

    for (const part of knownParts) {
      const similarityScore = calculateSimilarity(lowerDesc, part);
      if (similarityScore > 0.6) {
        return part;
      }
    }

    return null;
  };

  const calculateSimilarity = (description, part) => {
    let score = 0;
    const descWords = description.toLowerCase().split(' ');

    // Check name similarity
    if (part.part_name) {
      const nameWords = part.part_name.toLowerCase().split(' ');
      const commonWords = descWords.filter(w => nameWords.includes(w));
      score += (commonWords.length / Math.max(descWords.length, nameWords.length)) * 0.4;
    }

    // Check strategy similarity
    if (part.protective_strategy) {
      const stratWords = part.protective_strategy.toLowerCase().split(' ');
      const commonWords = descWords.filter(w => stratWords.includes(w));
      score += (commonWords.length / Math.max(descWords.length, stratWords.length)) * 0.3;
    }

    // Check feelings similarity
    if (part.part_feelings) {
      const feelWords = part.part_feelings.toLowerCase().split(' ');
      const commonWords = descWords.filter(w => feelWords.includes(w));
      score += (commonWords.length / Math.max(descWords.length, feelWords.length)) * 0.3;
    }

    return score;
  };

  const detectExileEmergence = (userMessage, aiResponse) => {
    const combined = (userMessage + ' ' + aiResponse).toLowerCase();

    // Keywords that suggest an exile is present
    const exileKeywords = ['young', 'child', 'scared', 'hurt', 'wounded', 'sad', 'alone', 'abandoned', 'small', 'vulnerable'];
    const hasExileLanguage = exileKeywords.some(keyword => combined.includes(keyword));

    if (hasExileLanguage && currentPhase !== 'exile_detected') {
      // Check if we have any known exiles that match
      const possibleExiles = knownParts.filter(p => p.is_exile);

      if (possibleExiles.length > 0) {
        const matchingExile = possibleExiles.find(exile => {
          const exileWords = (exile.part_name + ' ' + exile.original_wound_description).toLowerCase();
          return exileKeywords.some(keyword => exileWords.includes(keyword) && combined.includes(keyword));
        });

        if (matchingExile) {
          return matchingExile;
        }
      }
    }

    return null;
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
      // Mode handler controls phase and context automatically
      const aiResponse = await huxleyService.chat(message);

      setIsTyping(false);
      setIsAIMode(aiResponse.isAI);

      // Update session progress from mode handler
      if (aiResponse.sessionProgress) {
        setSessionProgress(aiResponse.sessionProgress);
        setCurrentPhase(aiResponse.sessionProgress.phase);

        // Auto-show summary when handler signals completion
        if (aiResponse.sessionProgress.isComplete && currentPhase !== 'summary') {
          addMessage('assistant', aiResponse.message);
          showSummary();
          return;
        }
      }

      // Check for exile emergence during protector work
      const detectedExile = detectExileEmergence(message, aiResponse.message);
      if (detectedExile) {
        if (currentPart && !currentPart.is_exile) {
          await recordProtectorExileConnection(currentPart.id, detectedExile.id);
        }

        addMessage('assistant', aiResponse.message);
        addMessage('assistant', `I'm noticing something... You mentioned feelings and language that remind me of **${detectedExile.part_name}**, an exile you've worked with before.

Is that part showing up right now? Sometimes protectors reveal the exiles they protect.

*(I've noted the connection between these parts)*`,
          [`Switch to: ${detectedExile.part_name}`, 'Continue with current part', 'Tell me more']
        );
        setCurrentPhase('exile_detected');
        return;
      }

      // Check for potential duplicate if in early discovery
      if (sessionType === 'discovery' && aiResponse.sessionProgress &&
          (aiResponse.sessionProgress.phase === 'find' || aiResponse.sessionProgress.phase === 'focus')) {
        const activePart = aiResponse.sessionProgress.activePart;
        if (activePart?.name) {
          const duplicate = detectDuplicatePart(activePart.name);
          if (duplicate) {
            addMessage('assistant', aiResponse.message);
            addMessage('assistant', `This sounds similar to **${duplicate.part_name}**, a ${duplicate.part_role} you've worked with before.

Is this the same part showing up in a new way, or is this definitely a new part?`,
              [`Merge with: ${duplicate.part_name}`, 'This is a new part', 'Not sure yet']
            );
            return;
          }
        }
      }

      addMessage('assistant', aiResponse.message);

    } catch (error) {
      setIsTyping(false);
      console.error('Error getting response:', error);
      addMessage('assistant', "I'm having trouble connecting right now, but I'm still here with you. What would you like to explore?");
    }
  };

  // Phase tracking and session data are now managed by the IFS mode handler
  // inside HuxleyService. The handler returns sessionProgress with each chat() call.

  const showSummary = async () => {
    // Get structured session data from the mode handler
    const handlerSummary = huxleyService.getSessionSummary();
    const activePart = handlerSummary?.partsDiscovered?.[0] || {};

    const summary = `You've done beautiful work getting to know this part.

**Part You Worked With:** ${activePart.name || 'A part of you'}

**Location:** ${activePart.location || 'Noticed in your system'}

**What You Noticed:** ${activePart.appearance || 'Various sensations and experiences'}

**Part's Role:** ${activePart.role || activePart.strategy || 'Protecting you in its own way'}

**Self Energy:** ${handlerSummary?.selfEnergyAchieved ? 'Present with curiosity and compassion' : 'Developing'}

**Part's Fears:** ${activePart.fears || 'Concerns about safety'}

This is a beginning. Parts work is about ongoing relationship. You can return to this part anytime with curiosity and compassion.`;

    setCurrentPhase('summary');
    addMessage('assistant', summary, ['Save This Session', 'Work With Another Part', 'Finish']);

    // Auto-save to database if user is logged in
    if (userId && sessionType === 'discovery' && activePart.name) {
      try {
        const newPart = await ifsContextService.savePart(userId, {
          name: activePart.name,
          role: activePart.role || inferPartRole(activePart.strategy || ''),
          location: activePart.location,
          appearance: activePart.appearance,
          feelings: activePart.feelings,
          fears: activePart.fears,
          strategy: activePart.strategy,
          feelingsToward: handlerSummary?.selfEnergyAchieved ? 'curious, compassionate' : '',
          isExile: activePart.isExile || false,
        });

        await ifsContextService.saveSession(userId, {
          partId: newPart?.id,
          type: 'discovery',
          wasKnown: false,
          summary: summary,
          completed: true,
          insights: `Discovered part "${activePart.name}". Self energy: ${handlerSummary?.selfEnergyAchieved ? 'achieved' : 'developing'}. Blending occurred: ${handlerSummary?.blendingOccurred ? 'yes' : 'no'}.`,
        });
      } catch (error) {
        console.error('Error saving part to database:', error);
      }
    } else if (userId && sessionType === 'check_in' && currentPart) {
      try {
        await ifsContextService.updatePart(currentPart.id, {
          last_worked_with: new Date().toISOString(),
          session_notes: [
            ...(currentPart.session_notes || []),
            { date: new Date().toISOString(), notes: summary }
          ]
        });

        await ifsContextService.saveSession(userId, {
          partId: currentPart.id,
          type: 'check_in',
          wasKnown: true,
          summary: summary,
          completed: true,
        });
      } catch (error) {
        console.error('Error saving session to database:', error);
      }
    }
  };

  const inferPartRole = (roleDescription) => {
    const lowerRole = roleDescription.toLowerCase();

    // Manager indicators
    if (lowerRole.includes('control') || lowerRole.includes('plan') || lowerRole.includes('perfect') ||
        lowerRole.includes('organize') || lowerRole.includes('achieve')) {
      return 'manager';
    }

    // Firefighter indicators
    if (lowerRole.includes('numb') || lowerRole.includes('distract') || lowerRole.includes('escape') ||
        lowerRole.includes('rage') || lowerRole.includes('rebel')) {
      return 'firefighter';
    }

    // Exile indicators
    if (lowerRole.includes('hurt') || lowerRole.includes('wound') || lowerRole.includes('young') ||
        lowerRole.includes('scared') || lowerRole.includes('abandoned')) {
      return 'exile';
    }

    // Default to manager if unclear
    return 'manager';
  };

  const handleComplete = async () => {
    const sessionDuration = Math.round((new Date() - sessionStartTime) / 1000 / 60);
    const handlerSummary = huxleyService.getSessionSummary();

    // Save session to database if we have a current part
    if (userId && currentPart) {
      try {
        await ifsContextService.saveSession(userId, {
          partId: currentPart.id,
          type: sessionType || 'check_in',
          phase: currentPhase,
          duration: sessionDuration,
          startingQuestion: messages.length > 0 ? messages[0].text : '',
          wasKnown: sessionType === 'check_in',
          summary: JSON.stringify(handlerSummary || {}).substring(0, 1000),
          insights: handlerSummary
            ? `Self energy: ${handlerSummary.selfEnergyAchieved ? 'yes' : 'no'}, Phases: ${handlerSummary.completedPhases?.join(' → ')}`
            : `Worked with ${currentPart.part_name}`,
          completed: true,
          outcome: `Session with ${currentPart.part_name} completed`,
          nextSteps: 'Continue building relationship with this part'
        });

        await ifsContextService.updatePart(currentPart.id, {
          last_worked_with: new Date().toISOString()
        });

        masterContextService.clearCache(userId);
        console.log(`[IFS Chat] Session saved for part: ${currentPart.part_name}`);
      } catch (error) {
        console.error('[IFS Chat] Error saving session:', error);
      }
    }

    if (onComplete) {
      onComplete({
        timestamp: new Date().toISOString(),
        sessionProgress: handlerSummary,
        messages,
        wasAIPowered: huxleyService.isUsingAI(),
        sessionType,
        currentPart,
        duration: sessionDuration
      });
    }
  };

  const resetSession = async () => {
    huxleyService.setMode('ifs', { clearHistory: true });
    setMessages([]);
    setCurrentPart(null);
    setSessionType(null);
    setSessionProgress(null);
    await initializeSession();
  };

  const renderMessage = (message) => {
    const isUser = message.sender === 'user';

    // Assistant messages with Huxley avatar
    if (!isUser) {
      return (
        <View key={message.id} style={styles.assistantMessageRow}>
          <Image
            source={require('../assets/images/huxley therapist.png')}
            style={styles.huxleyAvatar}
            resizeMode="contain"
          />
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <Text style={[styles.messageText, styles.assistantText]}>
              {message.text}
            </Text>

            {/* Render options if present */}
            {message.options && (
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
              <Text style={[styles.timestamp, styles.assistantTimestamp]}>
                {message.timestamp}
              </Text>
              {message.isAI && (
                <Text style={styles.aiIndicator}>AI</Text>
              )}
            </View>
          </View>
        </View>
      );
    }

    // User messages
    return (
      <View
        key={message.id}
        style={[styles.messageContainer, styles.userMessageContainer]}
      >
        <View style={[styles.messageBubble, styles.userBubble]}>
          <Text style={[styles.messageText, styles.userText]}>
            {message.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.timestamp, styles.userTimestamp]}>
              {message.timestamp}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your parts...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            if (onSkip) {
              onSkip();
            } else if (navigation) {
              navigation.goBack();
            }
          }}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>IFS Parts Work</Text>
            {!huxleyService.isUsingAI() && (
              <Text style={styles.offlineIndicator}>Offline Mode</Text>
            )}
            {sessionProgress?.activePart && (
              <Text style={styles.currentPartIndicator}>
                {sessionProgress.phaseLabel}: {sessionProgress.activePart.name}
              </Text>
            )}
            {!sessionProgress?.activePart && currentPart && (
              <Text style={styles.currentPartIndicator}>Working with: {currentPart.part_name}</Text>
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
            <View style={styles.assistantMessageRow}>
              <Image
                source={require('../assets/images/huxley therapist.png')}
                style={styles.huxleyAvatar}
                resizeMode="contain"
              />
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
                <Text style={styles.typingText}>Huxley is thinking...</Text>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
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
  currentPartIndicator: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '500',
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
  assistantMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  huxleyAvatar: {
    width: 36,
    height: 36,
    marginRight: 8,
    marginTop: 4,
  },
  typingText: {
    fontSize: 14,
    color: colors.mediumGray,
    fontStyle: 'italic',
    marginTop: 4,
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
    flex: 1,
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

export default IFSPartsWorkChatWithContext;
