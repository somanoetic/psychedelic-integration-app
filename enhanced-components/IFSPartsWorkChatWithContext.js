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
import { colors, gradients } from '../theme/colors';
import { ChatConversation } from '../components/chat';

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
  const [currentPhase, setCurrentPhase] = useState('intro');
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // Streaming reply: id of the assistant bubble currently being written live,
  // and its accumulating text. While set, the thinking spinner is suppressed and
  // this bubble grows token-by-token. Cleared once the turn's branch logic runs.
  const [streamingId, setStreamingId] = useState(null);
  const [isAIMode, setIsAIMode] = useState(true);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState(null);
  const [knownParts, setKnownParts] = useState([]);
  const [currentPart, setCurrentPart] = useState(null);
  const [sessionType, setSessionType] = useState(null);
  const [sessionStartTime] = useState(new Date());

  const [sessionProgress, setSessionProgress] = useState(null);

  useEffect(() => {
    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const INTRO_OPTIONS = [
    'Explain it to me & discuss',
    'Explore the learning modules',
    'Start working with a part',
  ];

  // Always show the intro first. The user chooses whether to learn/discuss,
  // open the learning modules, or dive straight into parts work. Loading the
  // user's known parts is deferred until they actually begin a session.
  const initializeSession = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        setUserId(userData.id);
        await huxleyService.initialize(userData.id);
      }
    } catch (error) {
      console.error('Error initializing IFS session:', error);
    } finally {
      setCurrentPhase('intro');
      addMessage('assistant', getIntroMessage(), INTRO_OPTIONS);
      setLoading(false);
    }
  };

  // Enter parts work: set the IFS mode, load known parts, show the check-in.
  const beginSession = async () => {
    setIsTyping(true);
    try {
      huxleyService.setMode('ifs', { clearHistory: true });

      let allParts = [];
      if (userId) {
        const partsData = await ifsContextService.loadUserParts(userId);
        allParts = partsData.allParts || [];
        setKnownParts(allParts);
      }

      setCurrentPhase('check_in');
      addMessage('assistant', getCheckInMessage(allParts), null);
    } catch (error) {
      console.error('Error beginning IFS session:', error);
      setCurrentPhase('check_in');
      addMessage('assistant', getCheckInMessage([]), null);
    } finally {
      setIsTyping(false);
    }
  };

  // Open the full slide-based IFS learning modules. Prefers a dedicated
  // navigation route if the app exposes one; otherwise falls back to the
  // Education hub. If neither is available (e.g. embedded with no navigation),
  // stay in the discuss flow rather than dead-ending.
  const openLearningModules = () => {
    if (navigation) {
      navigation.navigate('Learn', { selectedTopicId: 'ifs_basics' });
      return;
    }
    setCurrentPhase('learning');
    addMessage(
      'assistant',
      `The step-by-step learning modules live in the Learn area of the app. In the meantime, I'm happy to explain anything here - just ask.`,
      ['Start working with a part'],
    );
  };

  // Educational Q&A about IFS. Routed through Huxley's GENERAL mode so it
  // explains concepts conversationally instead of running the parts-work
  // protocol (which is what caused "there's a part of you that wants to
  // know more..." when this used to leak into the IFS chat).
  const handleLearningQuestion = async (question) => {
    setIsTyping(true);
    try {
      const aiResponse = await huxleyService.chat(
        `The user is learning about Internal Family Systems (IFS) and asked: "${question}". `
          + `Answer their question clearly and warmly as an educator. Explain the concept; do NOT `
          + `start a parts-work session or ask them to focus on a part unless they ask to begin.`,
        { mode: 'general' },
      );
      setIsAIMode(aiResponse.isAI);
      addMessage('assistant', aiResponse.message, [
        'Start working with a part',
        'Explore the learning modules',
      ]);
    } catch (error) {
      console.error('Error answering IFS learning question:', error);
      addMessage(
        'assistant',
        "I'm having trouble connecting right now. You can still start working with a part whenever you're ready.",
        ['Start working with a part'],
      );
    } finally {
      setIsTyping(false);
    }
  };

  const getCheckInMessage = (parts) => {
    if (!parts || parts.length === 0) {
      return `Welcome to IFS Parts Work.

**What part is coming up for you right now?**

Take a moment to notice... Is there a part that's active right now? Maybe a feeling, a voice, or a sensation that's asking for attention?

You can describe it in your own words - I'll help you get to know it.`;
    }

    const partsPreview = parts.slice(0, 5).map((p) => `• ${p.part_name || 'Unnamed part'}`).join('\n');
    const moreCount = parts.length > 5 ? `\n... and ${parts.length - 5} more` : '';

    return `Welcome back to IFS Parts Work.

**What part is coming up for you right now?**

I see you've worked with these parts before:
${partsPreview}${moreCount}

Is one of these parts active right now, or is this a new part wanting attention?`;
  };

  const getIntroMessage = () => `Welcome to IFS Parts Work.

This is a space to get to know one of your parts - those inner voices, feelings, or patterns that shape your experience.

How would you like to start?

• **Explain it to me & discuss** - I'll walk you through what IFS is, and you can ask me anything.
• **Explore the learning modules** - a guided walkthrough of parts, Self, and how it all fits together.
• **Start working with a part** - dive straight in and we'll explore together at your pace.

You're in control the whole time.`;

  const getLearnMoreMessage = () => `**What is IFS?**

Internal Family Systems views your mind as made up of different "parts" - like sub-personalities with their own feelings, beliefs, and roles.

**The Self** is your core - characterized by the 8 C's:
Calm, Clarity, Compassion, Confidence, Courage, Creativity, Curiosity, Connectedness

**Parts have three types:**
• **Exiles** - Young, wounded parts carrying pain
• **Managers** - Parts that control daily life to prevent pain
• **Firefighters** - Emergency responders when exiles break through

All parts have positive intentions, even when their methods cause problems. This work is about building relationship with them.

**Ask me anything** - what a part is, how this is different from just "talking to yourself," what Self energy feels like, or anything else you're curious about. When you're ready, tap **Start working with a part**.`;

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

  // Create an empty assistant bubble to stream into, and return its id. The
  // spinner is turned off the moment we start streaming real text.
  const beginStreamingMessage = () => {
    const id = Date.now() + Math.random();
    setMessages((prev) => [
      ...prev,
      {
        id,
        sender: 'assistant',
        text: '',
        options: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAI: isAIMode,
        streaming: true,
      },
    ]);
    setStreamingId(id);
    return id;
  };

  // Append a delta to the live streaming bubble.
  const appendStreamingText = (id, delta) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text: m.text + delta } : m)),
    );
  };

  // Finalize the streaming bubble: set its final text (in case the parsed
  // displayMessage differs slightly from the raw streamed prose — e.g. trimmed)
  // and clear the streaming flag. Removes the bubble entirely if it ended empty.
  const finalizeStreamingMessage = (id, finalText) => {
    setStreamingId(null);
    setMessages((prev) =>
      prev
        .map((m) => (m.id === id ? { ...m, text: finalText, streaming: false } : m))
        .filter((m) => !(m.id === id && !finalText)),
    );
  };

  const handleOptionSelect = async (option) => {
    addMessage('user', option);

    if (currentPhase === 'intro' || currentPhase === 'learning') {
      if (option === 'Start working with a part' || option === 'Start Working With a Part') {
        await beginSession();
      } else if (option === 'Explore the learning modules') {
        openLearningModules();
      } else if (option === 'Back to Home') {
        if (onSkip) {
          onSkip();
        } else if (navigation) {
          navigation.goBack();
        }
      } else if (option === 'Explain it to me & discuss') {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setCurrentPhase('learning');
          addMessage('assistant', getLearnMoreMessage(), [
            'Start working with a part',
            'Explore the learning modules',
          ]);
        }, 600);
      } else {
        // Any other tap in intro/learning is a free-text question → discuss it.
        await handleLearningQuestion(option);
      }
    } else if (currentPhase === 'check_in') {
      await handlePartSelection(option);
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
      const partName = option.replace('Switch to: ', '');
      await handlePartSwitch(partName);
    } else if (option === 'Continue with current part' && currentPhase === 'exile_detected') {
      addMessage('assistant', `Okay, let's continue with **${currentPart.part_name}**.

The connection to the exile has been noted - this helps us understand why this protector works so hard.

What else does this part want you to know?`);
      setCurrentPhase('befriend');
    } else if (option === 'Tell me more' && currentPhase === 'exile_detected') {
      const detectedExileFromContext = knownParts.find(
        (p) => p.is_exile && messages[messages.length - 1].text.includes(p.part_name),
      );
      if (detectedExileFromContext) {
        addMessage(
          'assistant',
          `When a protector's work brings up an exile, it reveals the protective system.

**${currentPart.part_name}** (the protector) is working hard to keep **${detectedExileFromContext.part_name}** (the exile) safe and hidden. When you got close to the protector's feelings and fears, the exile it protects became visible.

This is actually beautiful - it shows how your parts are connected and working together, even when it doesn't always feel that way.

Would you like to continue working with the protector, or gently approach the exile?`,
          [`Switch to: ${detectedExileFromContext.part_name}`, 'Continue with current part'],
        );
      }
    } else if (option.startsWith('Merge with:')) {
      const existingPartName = option.replace('Merge with: ', '');
      await handlePartMerge(existingPartName);
    } else {
      await handleSendMessage(option);
    }
  };

  const handlePartSelection = async (userMessage) => {
    setIsTyping(true);

    const matchedPart = findMatchingPart(userMessage);

    if (matchedPart) {
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
      setSessionType('discovery');
      setCurrentPhase('find');

      const aiResponse = await huxleyService.chat(
        `The user is noticing: "${userMessage}". Help them begin discovering this part.`,
      );

      setIsTyping(false);
      setIsAIMode(aiResponse.isAI);
      addMessage('assistant', aiResponse.message);
    }
  };

  const findMatchingPart = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    const directMatch = knownParts.find(
      (part) => part.part_name && lowerMessage.includes(part.part_name.toLowerCase()),
    );
    if (directMatch) return directMatch;

    const strategyMatch = knownParts.find(
      (part) =>
        (part.protective_strategy && lowerMessage.includes(part.protective_strategy.toLowerCase())) ||
        (part.part_feelings && lowerMessage.includes(part.part_feelings.toLowerCase())),
    );

    return strategyMatch || null;
  };

  const handlePartSwitch = async (partName) => {
    if (currentPart) {
      await ifsContextService.updatePart(currentPart.id, {
        last_worked_with: new Date().toISOString(),
      });
    }

    const newPart = knownParts.find((p) => p.part_name === partName);
    if (newPart) {
      setCurrentPart(newPart);
      addMessage(
        'assistant',
        `Okay, let's shift our attention to **${partName}**.

This ${newPart.part_role} part is showing up now. What do you notice about it in this moment?`,
      );
    }
  };

  const recordProtectorExileConnection = async (protectorId, exileId) => {
    try {
      await ifsContextService.linkProtectorToExile(protectorId, exileId);
      console.log(`Recorded connection: Protector ${protectorId} → Exile ${exileId}`);
    } catch (error) {
      console.error('Error recording protector-exile connection:', error);
    }
  };

  const handlePartMerge = async (existingPartName) => {
    const existingPart = knownParts.find((p) => p.part_name === existingPartName);

    if (existingPart) {
      await ifsContextService.updatePart(existingPart.id, {
        session_notes: [
          ...(existingPart.session_notes || []),
          {
            date: new Date().toISOString(),
            notes: `Merged session at ${new Date().toISOString()}`,
          },
        ],
        last_worked_with: new Date().toISOString(),
      });

      setCurrentPart(existingPart);
      addMessage(
        'assistant',
        `Got it - we'll continue with **${existingPartName}**. All your insights from this session have been added to that part's history.`,
      );
    }
  };

  const detectDuplicatePart = (newPartDescription) => {
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

    if (part.part_name) {
      const nameWords = part.part_name.toLowerCase().split(' ');
      const commonWords = descWords.filter((w) => nameWords.includes(w));
      score += (commonWords.length / Math.max(descWords.length, nameWords.length)) * 0.4;
    }

    if (part.protective_strategy) {
      const stratWords = part.protective_strategy.toLowerCase().split(' ');
      const commonWords = descWords.filter((w) => stratWords.includes(w));
      score += (commonWords.length / Math.max(descWords.length, stratWords.length)) * 0.3;
    }

    if (part.part_feelings) {
      const feelWords = part.part_feelings.toLowerCase().split(' ');
      const commonWords = descWords.filter((w) => feelWords.includes(w));
      score += (commonWords.length / Math.max(descWords.length, feelWords.length)) * 0.3;
    }

    return score;
  };

  const detectExileEmergence = (userMessage, aiResponse) => {
    const combined = (userMessage + ' ' + aiResponse).toLowerCase();

    const exileKeywords = [
      'young', 'child', 'scared', 'hurt', 'wounded', 'sad',
      'alone', 'abandoned', 'small', 'vulnerable',
    ];
    const hasExileLanguage = exileKeywords.some((keyword) => combined.includes(keyword));

    if (hasExileLanguage && currentPhase !== 'exile_detected') {
      const possibleExiles = knownParts.filter((p) => p.is_exile);

      if (possibleExiles.length > 0) {
        const matchingExile = possibleExiles.find((exile) => {
          const exileWords = (exile.part_name + ' ' + exile.original_wound_description).toLowerCase();
          return exileKeywords.some(
            (keyword) => exileWords.includes(keyword) && combined.includes(keyword),
          );
        });

        if (matchingExile) {
          return matchingExile;
        }
      }
    }

    return null;
  };

  const handleSendMessage = async (messageOverride = null) => {
    const message = (messageOverride ?? userInput).trim();
    if (!message) return;

    // In the learning/discuss phase, typed questions are educational — route
    // them to the general-mode Q&A, not the parts-work protocol.
    if (currentPhase === 'learning') {
      addMessage('user', message);
      if (!messageOverride) setUserInput('');
      await handleLearningQuestion(message);
      return;
    }

    // A typed answer to the check-in IS the start of the session (the user is
    // describing what they're noticing, or naming a trailhead, in free text
    // rather than tapping a known part). Mark the session started so the input
    // box stays visible even when the IFS handler reports its own 'intro'
    // working phase back to us. Without this, sessionType stayed null and
    // showInput hid the box after the first check-in answer.
    if (currentPhase === 'check_in' && !sessionType) {
      setSessionType('discovery');
    }

    addMessage('user', message);
    if (!messageOverride) {
      setUserInput('');
    }
    setIsTyping(true);

    // Live-stream the reply into a bubble that grows as tokens arrive. onToken
    // fires only with user-facing prose (huxleyService gates the JSON tail), so
    // we can append it verbatim. The spinner shows only until the first token.
    let streamId = null;
    try {
      const aiResponse = await huxleyService.chat(message, {
        onToken: (delta) => {
          if (streamId === null) {
            setIsTyping(false);
            streamId = beginStreamingMessage();
          }
          appendStreamingText(streamId, delta);
        },
      });

      setIsTyping(false);
      setIsAIMode(aiResponse.isAI);

      // Helper: land the assistant reply. If we streamed it, finalize the live
      // bubble in place (using the parsed displayMessage as source of truth);
      // otherwise fall back to a fresh appended message.
      const landReply = () => {
        if (streamId !== null) {
          finalizeStreamingMessage(streamId, aiResponse.message);
          streamId = null;
        } else {
          addMessage('assistant', aiResponse.message);
        }
      };

      if (aiResponse.sessionProgress) {
        setSessionProgress(aiResponse.sessionProgress);
        setCurrentPhase(aiResponse.sessionProgress.phase);

        if (aiResponse.sessionProgress.isComplete && currentPhase !== 'summary') {
          landReply();
          showSummary();
          return;
        }
      }

      const detectedExile = detectExileEmergence(message, aiResponse.message);
      if (detectedExile) {
        if (currentPart && !currentPart.is_exile) {
          await recordProtectorExileConnection(currentPart.id, detectedExile.id);
        }

        landReply();
        addMessage(
          'assistant',
          `I'm noticing something... You mentioned feelings and language that remind me of **${detectedExile.part_name}**, an exile you've worked with before.

Is that part showing up right now? Sometimes protectors reveal the exiles they protect.

*(I've noted the connection between these parts)*`,
          [`Switch to: ${detectedExile.part_name}`, 'Continue with current part', 'Tell me more'],
        );
        setCurrentPhase('exile_detected');
        return;
      }

      if (
        sessionType === 'discovery' &&
        aiResponse.sessionProgress &&
        (aiResponse.sessionProgress.phase === 'find' || aiResponse.sessionProgress.phase === 'focus')
      ) {
        const activePart = aiResponse.sessionProgress.activePart;
        if (activePart?.name) {
          const duplicate = detectDuplicatePart(activePart.name);
          if (duplicate) {
            landReply();
            addMessage(
              'assistant',
              `This sounds similar to **${duplicate.part_name}**, a ${duplicate.part_role} you've worked with before.

Is this the same part showing up in a new way, or is this definitely a new part?`,
              [`Merge with: ${duplicate.part_name}`, 'This is a new part', 'Not sure yet'],
            );
            return;
          }
        }
      }

      landReply();
    } catch (error) {
      setIsTyping(false);
      // Drop any partial streamed bubble so the error message stands alone.
      if (streamId !== null) {
        finalizeStreamingMessage(streamId, '');
        streamId = null;
      }
      console.error('Error getting response:', error);
      addMessage(
        'assistant',
        "I'm having trouble connecting right now, but I'm still here with you. What would you like to explore?",
      );
    }
  };

  const showSummary = async () => {
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
          summary,
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
            { date: new Date().toISOString(), notes: summary },
          ],
        });

        await ifsContextService.saveSession(userId, {
          partId: currentPart.id,
          type: 'check_in',
          wasKnown: true,
          summary,
          completed: true,
        });
      } catch (error) {
        console.error('Error saving session to database:', error);
      }
    }
  };

  const inferPartRole = (roleDescription) => {
    const lowerRole = roleDescription.toLowerCase();

    if (
      lowerRole.includes('control') || lowerRole.includes('plan') || lowerRole.includes('perfect') ||
      lowerRole.includes('organize') || lowerRole.includes('achieve')
    ) {
      return 'manager';
    }

    if (
      lowerRole.includes('numb') || lowerRole.includes('distract') || lowerRole.includes('escape') ||
      lowerRole.includes('rage') || lowerRole.includes('rebel')
    ) {
      return 'firefighter';
    }

    if (
      lowerRole.includes('hurt') || lowerRole.includes('wound') || lowerRole.includes('young') ||
      lowerRole.includes('scared') || lowerRole.includes('abandoned')
    ) {
      return 'exile';
    }

    return 'manager';
  };

  const handleComplete = async () => {
    const sessionDuration = Math.round((new Date() - sessionStartTime) / 1000 / 60);
    const handlerSummary = huxleyService.getSessionSummary();

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
          nextSteps: 'Continue building relationship with this part',
        });

        await ifsContextService.updatePart(currentPart.id, {
          last_worked_with: new Date().toISOString(),
        });

        masterContextService.clearCache(userId);
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
        duration: sessionDuration,
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
          <Text style={styles.loadingText}>Loading your parts...</Text>
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
      <TouchableOpacity
        onPress={() => {
          if (onSkip) {
            onSkip();
          } else if (navigation) {
            navigation.goBack();
          }
        }}
      >
        <Text style={styles.backText}>← Back</Text>
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
          <Text style={styles.currentPartIndicator}>
            Working with: {currentPart.part_name}
          </Text>
        )}
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );

  // Hide input in intro / summary phases — user interacts via option buttons.
  const showInput = currentPhase !== 'intro' && currentPhase !== 'summary';

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
          inputPlaceholder="Share your experience..."
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
  offlineIndicator: {
    fontSize: 11,
    color: colors.warning,
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

export default IFSPartsWorkChatWithContext;
