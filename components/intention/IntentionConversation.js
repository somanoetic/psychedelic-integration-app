import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bookmark,
  CheckCircle2,
  Compass,
  CloudOff,
  Hand,
  Heart,
  Library,
  Lightbulb,
  MessageCircle,
  Pencil,
  Search,
  Sparkles,
  Wand2,
} from 'lucide-react-native';
import { borderRadius, colors, spacing } from '../../theme/colors';
import { ChatConversation } from '../chat';

// Map conversationStage strings to Lucide icon components.
const STAGE_ICON_MAP = {
  welcome: Hand,
  direction: Compass,
  deepen: Sparkles,
  confirm: CheckCircle2,
  exploration: Search,
  formulation: Pencil,
  refinement: Wand2,
  review: CheckCircle2,
};

// Map suggested-action types to Lucide icon components.
const ACTION_ICON_MAP = {
  review_intention: CheckCircle2,
  explore_template: Library,
  browse_templates: Bookmark,
  edit_draft: Pencil,
  nervous_system_check: Heart,
};

const STAGE_LABELS = {
  welcome: 'Getting Started',
  direction: 'Finding Direction',
  deepen: 'Going Deeper',
  confirm: 'Your Intention',
  exploration: 'Exploring',
  formulation: 'Formulating',
  refinement: 'Refining',
  review: 'Reviewing',
};

/**
 * IntentionConversation - AI conversation interface for intention guidance
 *
 * Wraps the shared <ChatConversation> with intention-specific chrome:
 * a stage indicator, quick-action buttons, and per-message suggested-action chips.
 *
 * The parent SetIntentionScreen still owns the message state, the gradient
 * background, and all the navigation/save logic — this is a presentation layer.
 */
const IntentionConversation = ({
  conversationHistory,
  onSendMessage,
  loading,
  conversationStage,
  nervousSystemState,
  onViewTemplates,
  onEditDraft,
  onActionPress,
  disabled,
}) => {
  const [messageText, setMessageText] = useState('');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Track user typing so the loading text can switch from "Huxley is thinking"
  // to "Huxley is waiting for you to finish" when the user keeps typing.
  const handleTextChange = (text) => {
    setMessageText(text);
    setIsUserTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false);
    }, 1500);
  };

  const handleSend = () => {
    const trimmed = messageText.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setMessageText('');
    setIsUserTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  // The parent owns conversationHistory in {role, content, timestamp, suggestedActions, isError}
  // shape. Pass through suggestedActions + isError + nervousSystemState so renderMessageExtras
  // can use them.
  const toChatMessages = (history) =>
    history.map((m, i) => ({
      id: m.timestamp ? `${i}-${new Date(m.timestamp).getTime()}` : `${i}`,
      role: m.role,
      content: m.content,
      suggestedActions: m.suggestedActions,
      isError: m.isError,
    }));

  // Suggested-action chips rendered inside the bubble, plus an offline badge
  // on error messages.
  const renderMessageExtras = (message) => {
    const actions = message.suggestedActions || [];
    const hasActions = actions.length > 0;
    if (!hasActions && !message.isError) return null;

    return (
      <View>
        {message.isError && (
          <View style={styles.errorBadge}>
            <CloudOff size={14} color={colors.error} strokeWidth={2} />
            <Text style={styles.errorBadgeText}>Offline</Text>
          </View>
        )}
        {hasActions && (
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => {
              const ActionIcon = ACTION_ICON_MAP[action.type] || Lightbulb;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.actionChip}
                  onPress={() => onActionPress?.(action)}
                  activeOpacity={0.7}
                >
                  <ActionIcon size={16} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.actionText}>{action.message}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // Header: stage indicator + (after welcome) View Templates / Edit Draft quick actions.
  const renderHeader = () => {
    const StageIcon = STAGE_ICON_MAP[conversationStage] || MessageCircle;
    return (
      <View style={styles.headerContainer}>
        <View style={styles.stageIndicator}>
          <StageIcon size={16} color={colors.primary} strokeWidth={2} />
          <Text style={styles.stageText}>
            {STAGE_LABELS[conversationStage] || 'Chatting'}
          </Text>
        </View>

        {conversationStage !== 'welcome' && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={onViewTemplates}
              activeOpacity={0.7}
            >
              <Library size={18} color={colors.primary} strokeWidth={2} />
              <Text style={styles.quickActionText}>View Templates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={onEditDraft}
              activeOpacity={0.7}
            >
              <Pencil size={18} color={colors.primary} strokeWidth={2} />
              <Text style={styles.quickActionText}>Edit Draft</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Character counter shows above the input when getting close to max length.
  // Render it via the toast slot since it sits visually just above the input row.
  const charCounterToast = messageText.length > 400 ? (
    <View style={styles.charCounterContainer}>
      <Text style={styles.charCounter}>{messageText.length}/500</Text>
    </View>
  ) : null;

  // SetIntentionScreen owns the gradient and renders this component full-bleed
  // (NOT wrapped in its KeyboardAvoidingView), so ChatConversation owns keyboard
  // avoidance here — the same device-verified per-platform pattern every other
  // chat uses. The gradient still flows from the screen header through the chat.
  return (
    <ChatConversation
      messages={toChatMessages(conversationHistory)}
      isTyping={loading}
      onSend={disabled ? undefined : handleSend}
      inputText={messageText}
      onInputTextChange={handleTextChange}
      inputPlaceholder={
        isUserTyping && loading
          ? 'Huxley is waiting for you to finish...'
          : "Share what's on your mind..."
      }
      inputDisabled={disabled}
      header={renderHeader()}
      toast={charCounterToast}
      renderMessageExtras={renderMessageExtras}
      extraBottomInset={insets.bottom}
    />
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  stageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  stageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  quickActionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(229, 115, 115, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  errorBadgeText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(93, 134, 214, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  charCounterContainer: {
    paddingHorizontal: spacing.md,
    alignItems: 'flex-end',
  },
  charCounter: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default IntentionConversation;
