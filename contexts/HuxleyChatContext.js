/**
 * HuxleyChatContext
 *
 * Provider for state that the Huxley chat screen needs to keep across
 * navigation events (e.g. user routes to Journal, then comes back). Replaces
 * the previous module-level mutable globals (hasShownWelcome, persistedMessages,
 * hasInitializedChat) which weren't testable and could drift out of sync with
 * React state during fast remounts.
 *
 * Stays here:
 *   - messages: the rendered conversation array (with UI metadata like isTyping
 *     and quickReplies). The canonical conversation lives in
 *     conversationalRoutingService.conversationHistory; this array is the
 *     display projection plus per-message UI flags.
 *   - welcomeShown / chatInitialized: greeting-sequence guards.
 *   - voiceMode: toggle for upcoming voice conversation feature. When true,
 *     the chat screen skips the typewriter and routes responses to TTS.
 *
 * Stays in the component:
 *   - inputText, isTyping, scroll refs, quick-reply visibility — these are
 *     transient UI state that doesn't need to outlive the screen.
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const HuxleyChatContext = createContext(null);

export function HuxleyChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [welcomeShown, setWelcomeShownState] = useState(false);
  const [voiceMode, setVoiceModeState] = useState(false);

  // chatInitialized is a one-shot guard, not rendered. A ref avoids extra
  // re-renders when it flips.
  const chatInitialized = useRef(false);

  const setWelcomeShown = useCallback((value) => {
    setWelcomeShownState(value);
  }, []);

  const setVoiceMode = useCallback((value) => {
    setVoiceModeState(value);
  }, []);

  const markChatInitialized = useCallback(() => {
    chatInitialized.current = true;
  }, []);

  const isChatInitialized = useCallback(() => chatInitialized.current, []);

  const resetChat = useCallback(() => {
    setMessages([]);
    chatInitialized.current = false;
  }, []);

  const value = {
    messages,
    setMessages,
    welcomeShown,
    setWelcomeShown,
    voiceMode,
    setVoiceMode,
    markChatInitialized,
    isChatInitialized,
    resetChat,
  };

  return (
    <HuxleyChatContext.Provider value={value}>
      {children}
    </HuxleyChatContext.Provider>
  );
}

export function useHuxleyChat() {
  const ctx = useContext(HuxleyChatContext);
  if (!ctx) {
    throw new Error('useHuxleyChat must be used inside HuxleyChatProvider');
  }
  return ctx;
}
