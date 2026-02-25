import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { colors } from '../theme/colors';

/**
 * IFS Parts Work Chat
 * Interactive guided session using the Six F's framework
 * Based on Internal Family Systems therapy protocol
 */
const IFSPartsWorkChat = ({ onComplete, onSkip }) => {
  const [currentPhase, setCurrentPhase] = useState('intro');
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [sessionData, setSessionData] = useState({
    targetPart: '',
    location: '',
    description: '',
    feelings: '',
    partRole: '',
    selfEnergy: '',
    partFears: '',
    partResponse: ''
  });
  const [isTyping, setIsTyping] = useState(false);

  const phases = {
    intro: {
      type: 'info',
      message: `Welcome to IFS Parts Work.

This guided session will help you get to know a part of yourself using the Six F's framework:

**Find** - Locate the part
**Focus** - Attend to it
**Flesh Out** - Learn its story
**Feel Toward** - Check your Self energy
**BeFriend** - Build connection
**Fears** - Understand concerns

We'll work at your pace. You're in control the whole time.`,
      options: ['Begin Session', 'Learn More About IFS First']
    },

    learnMore: {
      type: 'info',
      message: `**What is IFS?**

Internal Family Systems views your mind as made up of different "parts" - like sub-personalities with their own feelings, beliefs, and roles.

**The Self** is your core - characterized by the 8 C's:
Calmness, Clarity, Compassion, Confidence, Courage, Creativity, Curiosity, Connectedness

**Parts have three types:**
• **Exiles** - Young, wounded parts carrying pain
• **Managers** - Parts that control daily life
• **Firefighters** - Emergency responders to overwhelming feelings

All parts have positive intentions, even when their methods cause problems.`,
      options: ['Start Working With a Part', 'Back to Home']
    },

    // Phase 1: FIND
    find: {
      type: 'question',
      message: `Let's begin by finding a part to work with.

Is there a part of you that's been active lately? Maybe one that:
• Has strong feelings or reactions
• Wants your attention
• Shows up in certain situations
• You'd like to understand better

What part would you like to get to know?`,
      placeholder: 'Describe the part (e.g., the anxious part, the critic, the one who withdraws...)'
    },

    findLocation: {
      type: 'question',
      message: `Thank you for identifying that part.

Now, where do you notice this part in or around your body?

It might be a sensation, a tightness, an image, or just a sense of where it lives.`,
      placeholder: 'e.g., In my chest, my throat, behind me, in my stomach...'
    },

    // Phase 2: FOCUS
    focus: {
      type: 'question',
      message: `Good. Now let's focus on this part.

As you bring your attention to it, what do you notice?

Are there any:
• Images or colors
• Sensations or feelings
• Words or sounds
• Ages or memories

Take your time and describe what you're experiencing.`,
      placeholder: 'Describe what you notice...'
    },

    // Phase 3: FLESH OUT
    fleshOut: {
      type: 'question',
      message: `Thank you for staying with this part.

Now let's learn more about it. Ask the part:

• What does it want you to know?
• What is its job or role?
• What is it trying to do for you?
• How long has it been doing this?

What does this part want you to understand?`,
      placeholder: 'What the part shares with you...'
    },

    // Phase 4: FEEL TOWARD (checking for Self energy)
    feelToward: {
      type: 'question',
      message: `This is an important question:

As you focus on this part, **how do you feel toward it?**

Are you curious? Compassionate? Annoyed? Frustrated? Critical? Worried?

Be honest - there's no wrong answer.`,
      placeholder: 'How you feel toward this part...'
    },

    unblend: {
      type: 'info',
      message: `I notice you might be blended with another part right now.

When we feel critical, annoyed, or scared of a part, that's usually another protector stepping in.

Would you be willing to ask that protective part if it could step back a little, so you can get to know this other part from curiosity?

Take a moment and see if you can find some:
• Curiosity about why this part does what it does
• Compassion for how hard it's been working
• Calmness in your presence with it

Let me know when you sense any of those qualities.`,
      options: ['I feel more curious now', 'Still feeling critical/annoyed', 'Need help']
    },

    // Phase 5: BEFRIEND
    befriend: {
      type: 'question',
      message: `Beautiful. Now that you're in Self energy, let's befriend this part.

Send it a signal of your curiosity and care. Let it know:
• You'd like to get to know it
• You appreciate how hard it's been working
• You're grateful for what it does for you

Take a moment to extend this appreciation.

How does the part respond to your interest and care?`,
      placeholder: 'How the part responds...'
    },

    // Phase 6: FEARS
    fears: {
      type: 'question',
      message: `Now let's understand this part's concerns.

Ask the part: **What are you afraid would happen if...**
• You stopped doing this job?
• I didn't listen to you?
• You let down your guard?

What is this part's biggest fear or worry?`,
      placeholder: 'What the part is afraid of...'
    },

    addressFears: {
      type: 'info',
      message: `Thank you for sharing what this part fears.

These fears make sense - this part has been protecting you from something it believes is dangerous.

Would you like to:
• Let the part know you understand its concerns
• Offer it hope that there might be other ways to help
• Ask if it would be willing to trust you a little more

This is about building relationship, not forcing change.`,
      options: ['Offer the part reassurance', 'Ask what it needs from me', 'Continue']
    },

    // Summary & Integration
    summary: {
      type: 'summary',
      message: `You've done beautiful work getting to know this part.

Here's what you discovered:`,
      options: ['Save This Session', 'Work With Another Part', 'Finish']
    }
  };

  useState(() => {
    // Initialize with intro message
    addMessage('assistant', phases.intro.message, phases.intro.options);
  }, []);

  const addMessage = (sender, text, options = null) => {
    const newMessage = {
      id: Date.now(),
      sender,
      text,
      options,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleOptionSelect = (option) => {
    addMessage('user', option);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      if (currentPhase === 'intro') {
        if (option === 'Begin Session') {
          setCurrentPhase('find');
          addMessage('assistant', phases.find.message);
        } else {
          setCurrentPhase('learnMore');
          addMessage('assistant', phases.learnMore.message, phases.learnMore.options);
        }
      } else if (currentPhase === 'learnMore') {
        if (option === 'Start Working With a Part') {
          setCurrentPhase('find');
          addMessage('assistant', phases.find.message);
        } else if (option === 'Back to Home') {
          if (onSkip) onSkip();
        }
      } else if (currentPhase === 'unblend') {
        if (option === 'I feel more curious now') {
          setCurrentPhase('befriend');
          addMessage('assistant', phases.befriend.message);
        } else if (option === 'Still feeling critical/annoyed') {
          addMessage('assistant', "That's okay. Sometimes protective parts need more time. Would you like to work with the critical part instead, or take a break?", ['Work with the critical part', 'Take a break']);
        } else {
          addMessage('assistant', "No problem. Try this: Take a few deep breaths. Then imagine that critical/annoyed part taking one step back, like it's giving you some space. See if that helps you feel more curious about the original part.", ['Try again']);
        }
      } else if (currentPhase === 'addressFears') {
        setCurrentPhase('summary');
        showSummary();
      } else if (currentPhase === 'summary') {
        if (option === 'Save This Session') {
          handleComplete();
        } else if (option === 'Work With Another Part') {
          resetSession();
        } else {
          handleComplete();
        }
      }
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    const message = userInput.trim();
    addMessage('user', message);
    setUserInput('');
    setIsTyping(true);

    // Process based on current phase
    setTimeout(() => {
      setIsTyping(false);
      processUserResponse(message);
    }, 1500);
  };

  const processUserResponse = (message) => {
    const lowerMessage = message.toLowerCase();

    switch (currentPhase) {
      case 'find':
        setSessionData(prev => ({ ...prev, targetPart: message }));
        addMessage('assistant', `Thank you for identifying "${message}". Let's get to know this part together.`);
        setTimeout(() => {
          setCurrentPhase('findLocation');
          addMessage('assistant', phases.findLocation.message);
        }, 1000);
        break;

      case 'findLocation':
        setSessionData(prev => ({ ...prev, location: message }));
        addMessage('assistant', `Good. You notice it ${message}. Let's focus on it there.`);
        setTimeout(() => {
          setCurrentPhase('focus');
          addMessage('assistant', phases.focus.message);
        }, 1000);
        break;

      case 'focus':
        setSessionData(prev => ({ ...prev, description: message }));
        addMessage('assistant', "Thank you for staying present with what you're experiencing.");
        setTimeout(() => {
          setCurrentPhase('fleshOut');
          addMessage('assistant', phases.fleshOut.message);
        }, 1000);
        break;

      case 'fleshOut':
        setSessionData(prev => ({ ...prev, partRole: message }));
        addMessage('assistant', "That's really valuable information about this part's role.");
        setTimeout(() => {
          setCurrentPhase('feelToward');
          addMessage('assistant', phases.feelToward.message);
        }, 1000);
        break;

      case 'feelToward':
        setSessionData(prev => ({ ...prev, selfEnergy: message }));

        // Check if they're in Self energy (curious, compassionate, calm) or blended
        const selfQualities = ['curious', 'compassion', 'calm', 'open', 'interested', 'caring', 'warm', 'accepting'];
        const blendedQualities = ['annoyed', 'frustrated', 'critical', 'angry', 'scared', 'worried', 'overwhelmed', 'judgmental'];

        const hasSelfEnergy = selfQualities.some(quality => lowerMessage.includes(quality));
        const isBlended = blendedQualities.some(quality => lowerMessage.includes(quality));

        if (hasSelfEnergy) {
          addMessage('assistant', "Beautiful - I hear curiosity and openness. That's your Self energy.");
          setTimeout(() => {
            setCurrentPhase('befriend');
            addMessage('assistant', phases.befriend.message);
          }, 1000);
        } else if (isBlended) {
          addMessage('assistant', "I notice some protective energy there. That's another part stepping in.");
          setTimeout(() => {
            setCurrentPhase('unblend');
            addMessage('assistant', phases.unblend.message, phases.unblend.options);
          }, 1000);
        } else {
          addMessage('assistant', "Thank you for sharing that. Let's continue building this relationship.");
          setTimeout(() => {
            setCurrentPhase('befriend');
            addMessage('assistant', phases.befriend.message);
          }, 1000);
        }
        break;

      case 'befriend':
        setSessionData(prev => ({ ...prev, partResponse: message }));
        addMessage('assistant', "Wonderful. You're building trust with this part.");
        setTimeout(() => {
          setCurrentPhase('fears');
          addMessage('assistant', phases.fears.message);
        }, 1000);
        break;

      case 'fears':
        setSessionData(prev => ({ ...prev, partFears: message }));
        addMessage('assistant', "Thank you for listening to this part's fears. They're valid and make sense.");
        setTimeout(() => {
          setCurrentPhase('addressFears');
          addMessage('assistant', phases.addressFears.message, phases.addressFears.options);
        }, 1000);
        break;

      default:
        addMessage('assistant', "I'm here with you. What would you like to explore?");
    }
  };

  const showSummary = () => {
    const summary = `
**Part You Worked With:** ${sessionData.targetPart}

**Location:** ${sessionData.location}

**What You Noticed:** ${sessionData.description}

**Part's Role:** ${sessionData.partRole}

**Your Self Energy:** ${sessionData.selfEnergy}

**Part's Fears:** ${sessionData.partFears}

**Part's Response:** ${sessionData.partResponse}

This is a beginning. Parts work is about ongoing relationship. You can return to this part anytime with curiosity and compassion.
`;
    addMessage('assistant', summary, phases.summary.options);
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        timestamp: new Date().toISOString(),
        sessionData,
        messages
      });
    }
  };

  const resetSession = () => {
    setCurrentPhase('find');
    setSessionData({
      targetPart: '',
      location: '',
      description: '',
      feelings: '',
      partRole: '',
      selfEnergy: '',
      partFears: '',
      partResponse: ''
    });
    addMessage('assistant', phases.find.message);
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

          <Text style={[
            styles.timestamp,
            isUser ? styles.userTimestamp : styles.assistantTimestamp
          ]}>
            {message.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>IFS Parts Work</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Messages */}
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        ref={ref => {
          if (ref) {
            ref.scrollToEnd({ animated: true });
          }
        }}
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

      {/* Input Area */}
      {phases[currentPhase]?.type === 'question' && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={userInput}
            onChangeText={setUserInput}
            placeholder={phases[currentPhase].placeholder || 'Type your response...'}
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !userInput.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!userInput.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
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
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  assistantTimestamp: {
    color: colors.mediumGray,
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
  },
  sendButtonDisabled: {
    backgroundColor: colors.mediumGray,
  },
  sendButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default IFSPartsWorkChat;
