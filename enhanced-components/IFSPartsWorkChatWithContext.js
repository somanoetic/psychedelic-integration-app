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
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IFSAIService } from '../lib/ifsAIService';
import ifsContextService from '../lib/ifsContextService';
import masterContextService from '../lib/masterContextService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const scrollViewRef = useRef(null);
  const ifsService = useRef(new IFSAIService()).current;

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

        // Initialize AI service with master context (CROSS-DOMAIN INTEGRATION)
        await ifsService.initialize(userData.id);
        console.log('[IFS Chat] Master context loaded - AI can now reference psychedelic journeys, NS patterns, etc.');

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

      const aiResponse = await ifsService.sendMessage(
        `The user is noticing: "${userMessage}". Help them begin discovering this part.`,
        'find'
      );

      setIsTyping(false);
      setIsAIMode(aiResponse.isAI);
      addMessage('assistant', aiResponse.response);
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
        session_notes: ifsService.getSessionData(),
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
      const currentSessionData = ifsService.getSessionData();
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
      // Get AI response based on current phase
      const aiResponse = await ifsService.sendMessage(message, currentPhase);

      setIsTyping(false);
      setIsAIMode(aiResponse.isAI);

      // Check for exile emergence during protector work
      const detectedExile = detectExileEmergence(message, aiResponse.response);
      if (detectedExile) {
        // IMPORTANT: Record the relationship IMMEDIATELY, regardless of user's choice
        // The fact that the exile emerged during protector work IS the connection
        if (currentPart && !currentPart.is_exile) {
          await recordProtectorExileConnection(currentPart.id, detectedExile.id);
        }

        addMessage('assistant', aiResponse.response);
        addMessage('assistant', `I'm noticing something... You mentioned feelings and language that remind me of **${detectedExile.part_name}**, an exile you've worked with before.

Is that part showing up right now? Sometimes protectors reveal the exiles they protect.

*(I've noted the connection between these parts)*`,
          [`Switch to: ${detectedExile.part_name}`, 'Continue with current part', 'Tell me more']
        );
        setCurrentPhase('exile_detected');
        return;
      }

      // Check for potential duplicate if in early discovery
      if (sessionType === 'discovery' && (currentPhase === 'find' || currentPhase === 'focus')) {
        const sessionData = ifsService.getSessionData();
        const description = sessionData.targetPart + ' ' + sessionData.description;
        const duplicate = detectDuplicatePart(description);

        if (duplicate) {
          addMessage('assistant', aiResponse.response);
          addMessage('assistant', `This sounds similar to **${duplicate.part_name}**, a ${duplicate.part_role} you've worked with before.

Is this the same part showing up in a new way, or is this definitely a new part?`,
            [`Merge with: ${duplicate.part_name}`, 'This is a new part', 'Not sure yet']
          );
          return;
        }
      }

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
      // Check for Self energy or blending
      const lowerUser = userMessage.toLowerCase();
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

  const showSummary = async () => {
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

    // Auto-save to database if user is logged in
    if (userId && sessionType === 'discovery') {
      try {
        // Save new part
        const newPart = await ifsContextService.savePart(userId, {
          part_name: sessionData.targetPart,
          part_role: inferPartRole(sessionData.partRole),
          location_in_body: sessionData.location,
          appearance_description: sessionData.description,
          part_feelings: sessionData.partResponse,
          part_fears: sessionData.partFears,
          protective_strategy: sessionData.partRole,
          feelings_toward_part: sessionData.selfEnergy,
          work_phase: 'discovery'
        });

        // Save session history
        await ifsContextService.saveSession(userId, {
          part_id: newPart.id,
          session_type: 'discovery',
          part_was_known: false,
          conversation_summary: summary,
          completed: true
        });
      } catch (error) {
        console.error('Error saving part to database:', error);
      }
    } else if (userId && sessionType === 'check_in' && currentPart) {
      try {
        // Update existing part
        await ifsContextService.updatePart(currentPart.id, {
          last_worked_with: new Date().toISOString(),
          session_notes: [
            ...(currentPart.session_notes || []),
            {
              date: new Date().toISOString(),
              notes: summary
            }
          ]
        });

        // Save session history
        await ifsContextService.saveSession(userId, {
          part_id: currentPart.id,
          session_type: 'check_in',
          part_was_known: true,
          conversation_summary: summary,
          completed: true
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
    const sessionDuration = Math.round((new Date() - sessionStartTime) / 1000 / 60); // minutes

    // Save session to database if we have a current part
    if (userId && currentPart) {
      try {
        const summary = messages
          .filter(m => m.sender === 'assistant' || m.sender === 'user')
          .map(m => `${m.sender}: ${m.text}`)
          .join('\n');

        // Save session history to database
        await ifsContextService.saveSession(userId, {
          partId: currentPart.id,
          type: sessionType || 'check_in',
          phase: currentPhase,
          duration: sessionDuration,
          startingQuestion: messages.length > 0 ? messages[0].text : '',
          wasKnown: sessionType === 'check_in',
          summary: summary.substring(0, 1000), // Truncate if too long
          insights: `Worked with ${currentPart.part_name} for ${sessionDuration} minutes`,
          completed: true,
          outcome: `Session with ${currentPart.part_name} completed`,
          nextSteps: 'Continue building relationship with this part'
        });

        // Update part's last worked with timestamp
        await ifsContextService.updatePart(currentPart.id, {
          last_worked_with: new Date().toISOString()
        });

        // Clear master context cache so next session sees this work
        masterContextService.clearCache(userId);

        console.log(`[IFS Chat] Session saved to database for part: ${currentPart.part_name}`);
      } catch (error) {
        console.error('[IFS Chat] Error saving session:', error);
        // Don't block completion if save fails
      }
    }

    // Call parent callback
    if (onComplete) {
      onComplete({
        timestamp: new Date().toISOString(),
        sessionData: ifsService.getSessionData(),
        messages,
        wasAIPowered: ifsService.isUsingAI(),
        sessionType,
        currentPart,
        duration: sessionDuration
      });
    }
  };

  const resetSession = async () => {
    ifsService.reset();
    setMessages([]);
    setCurrentPart(null);
    setSessionType(null);
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
        <ActivityIndicator size="large" color="#a855f7" />
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
            {!ifsService.isUsingAI() && (
              <Text style={styles.offlineIndicator}>Offline Mode</Text>
            )}
            {currentPart && (
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
    backgroundColor: '#ffffff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  offlineIndicator: {
    fontSize: 11,
    color: '#f59e0b',
    marginTop: 2,
  },
  currentPartIndicator: {
    fontSize: 11,
    color: '#a855f7',
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
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: '#7c3aed',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flex: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#1f2937',
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
    color: '#e9d5ff',
  },
  assistantTimestamp: {
    color: '#9ca3af',
  },
  aiIndicator: {
    fontSize: 10,
    color: '#7c3aed',
    fontWeight: '600',
    backgroundColor: '#f3e8ff',
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
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#a855f7',
    borderRadius: 8,
    padding: 10,
  },
  optionText: {
    fontSize: 14,
    color: '#7c3aed',
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
    backgroundColor: '#9ca3af',
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
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    minWidth: 70,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default IFSPartsWorkChatWithContext;
