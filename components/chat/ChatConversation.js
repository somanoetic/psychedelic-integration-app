import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Send } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import MessageBubble, { ThinkingBubble } from './MessageBubble';
import useSmartScroll from './useSmartScroll';

/**
 * Shared chat surface.
 *
 * Owns: message list rendering, smart-scroll (snap only when near bottom,
 * ↓ FAB when scrolled up, snap on keyboard open), thinking indicator,
 * input row, KeyboardAvoidingView.
 *
 * Does NOT own: messages state, AI service calls, headers, phase logic,
 * voice mode internals, AsyncStorage gates. Those stay in each screen.
 *
 * Slots (each optional):
 *   header              — full custom header above messages (progress, tabs, voice toggle, back)
 *   belowMessages       — between scroll area and input (phase buttons, share button, quick replies, cards)
 *   toast               — absolutely positioned above input (paper-reminder, transient banners)
 *   overlay             — absolutely positioned on top of everything (practice widget, saving spinner, voice controller)
 *   inputReplacement    — replaces the input row entirely (save-mapping button, "practice in progress" notice)
 *   renderMessageExtras — (message) => node rendered inside the bubble below its text (theme chips, route buttons)
 *
 * Input row only renders when `onSend` is provided AND `inputReplacement`
 * is null. Pass neither and there's no footer at all (form-style screens
 * with card-only interaction below messages).
 */
const ChatConversation = ({
  // data
  messages,
  isTyping = false,

  // input
  onSend,
  inputText,
  onInputTextChange,
  inputPlaceholder = 'Type a message...',
  inputDisabled = false,
  inputReplacement = null,

  // slots
  header = null,
  belowMessages = null,
  toast = null,
  overlay = null,
  renderMessageExtras = null,

  // options
  typewriter = false,
  showHuxleyAvatar = true,
  onTypewriterComplete = null,

  // escape hatches
  scrollViewProps = {},
  contentContainerStyle = null,
  // NOTE: keyboardVerticalOffset is intentionally NOT consumed anymore — the
  // KAV forces offset 0 (the wrapping screens own the bottom inset). Screens
  // still pass it harmlessly; it's ignored.
  // When the parent already wraps the screen in a KeyboardAvoidingView
  // (e.g. SetIntentionScreen → IntentionConversation), nesting another KAV
  // produces broken layout. Setting this true renders a plain View instead.
  disableKeyboardAvoiding = false,
}) => {
  const {
    scrollViewRef,
    showScrollToBottom,
    handleScroll,
    handleContentSizeChange,
    scrollToBottom,
  } = useSmartScroll();

  const insets = useSafeAreaInsets();

  // Keyboard avoidance, per platform:
  //
  // iOS — KeyboardAvoidingView behavior="padding" works correctly, so we use
  // it. (When disableKeyboardAvoiding, the parent owns the KAV and we render a
  // plain View to avoid nesting two.)
  //
  // Android — we do NOT use KeyboardAvoidingView. With edge-to-edge (default on
  // RN 0.81) + windowSoftInputMode="adjustResize", behavior="height" left a
  // residual gap on dismiss and behavior="padding" left a residual gap equal to
  // the nav-bar inset (the KAV measures the keyboard frame from the screen
  // bottom, but it sits inside the wrapping <SafeAreaView edges={['bottom']}>
  // which already reserves that inset — so the padding never fully collapses).
  //
  // Instead we drive bottom padding ourselves from the real keyboard height.
  // When the keyboard opens the soft nav-bar inset collapses (the keyboard
  // takes that space), so we pad by the FULL keyboard height — subtracting
  // insets.bottom under-pads and lets the keyboard cover the input. On dismiss
  // the height goes to 0 and the padding collapses cleanly — no leftover gap.
  const androidAvoid = !disableKeyboardAvoiding && Platform.OS === 'android';
  const useOwnKav = !disableKeyboardAvoiding && Platform.OS === 'ios';

  const keyboardPad = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!androidAvoid) return;
    const onShow = (e) => {
      const kbHeight = e?.endCoordinates?.height ?? 0;
      // Pad by the FULL keyboard height. When the keyboard opens, Android's
      // soft nav-bar inset collapses (the keyboard takes that space), so the
      // SafeAreaView's reserved insets.bottom is no longer there to count
      // against — subtracting it under-pads and the keyboard covers the input.
      keyboardPad.setValue(kbHeight);
    };
    const onHide = () => keyboardPad.setValue(0);
    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [androidAvoid, keyboardPad]);

  const trimmed = (inputText || '').trim();
  const canSend = trimmed.length > 0 && !inputDisabled && !isTyping;
  const handleSendPress = () => {
    if (!canSend || !onSend) return;
    onSend(trimmed);
  };

  const showInputRow = !inputReplacement && typeof onSend === 'function';

  const Wrapper = useOwnKav ? KeyboardAvoidingView : Animated.View;
  const wrapperProps = useOwnKav
    ? {
        behavior: 'padding',
        style: styles.keyboardView,
        // Forced to 0: the wrapping screens own the bottom inset via
        // SafeAreaView edges. Per-screen keyboardVerticalOffset values were
        // tuned for the old behavior="height" path and now cause floating.
        keyboardVerticalOffset: 0,
      }
    : {
        style: [
          styles.keyboardView,
          androidAvoid && { paddingBottom: keyboardPad },
        ],
      };

  return (
    <Wrapper {...wrapperProps}>
      {header}

      <View style={styles.messagesWrapper}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[styles.messagesContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onContentSizeChange={handleContentSizeChange}
          keyboardShouldPersistTaps="handled"
          {...scrollViewProps}
        >
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id ?? index}
              message={message}
              isLastMessage={index === messages.length - 1}
              typewriter={typewriter}
              showHuxleyAvatar={showHuxleyAvatar}
              onTypewriterComplete={
                onTypewriterComplete
                  ? () => onTypewriterComplete(index)
                  : undefined
              }
              extras={renderMessageExtras ? renderMessageExtras(message, index) : null}
            />
          ))}
          {isTyping && <ThinkingBubble showHuxleyAvatar={showHuxleyAvatar} />}
          <View style={styles.bottomPadding} />
        </ScrollView>

        {showScrollToBottom && (
          <TouchableOpacity
            style={styles.scrollToBottomButton}
            onPress={scrollToBottom}
            activeOpacity={0.85}
            accessibilityLabel="Scroll to latest message"
            accessibilityRole="button"
          >
            <ChevronDown size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      {belowMessages}

      {toast}

      {inputReplacement}

      {showInputRow && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={onInputTextChange}
            placeholder={inputPlaceholder}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
            editable={!inputDisabled}
            onSubmitEditing={handleSendPress}
          />
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={handleSendPress}
            disabled={!canSend}
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            <Send
              size={24}
              color={canSend ? '#fff' : colors.textSecondary}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>
      )}

      {overlay}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  messagesWrapper: {
    flex: 1,
    position: 'relative',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomPadding: {
    height: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    color: colors.text,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});

export default ChatConversation;
