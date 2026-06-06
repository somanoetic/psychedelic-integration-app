import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {
  CheckCircle2,
  Library,
  Bookmark,
  Pencil,
  Heart,
  Lightbulb,
  CloudOff,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme/colors';
import FormattedText from '../FormattedText';

// Map message.suggestedActions[].type to Lucide icon component.
const ACTION_ICON_MAP = {
  review_intention: CheckCircle2,
  explore_template: Library,
  browse_templates: Bookmark,
  edit_draft: Pencil,
  nervous_system_check: Heart,
};

/**
 * IntentionMessageBubble - Individual message bubble in conversation
 *
 * Features:
 * - User vs AI styling
 * - Timestamp
 * - Nervous system indicator for AI messages
 * - Suggested actions display
 * - Error state
 */
const IntentionMessageBubble = ({ message, nervousSystemState, isLatest, onActionPress }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;

  // Strip markdown formatting from AI messages (safety net)
  const cleanText = (text) => {
    if (!text) return '';
    return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s/gm, '');
  };

  /**
   * Format timestamp
   */
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * Get nervous system color
   */
  const getNSColor = () => {
    switch (nervousSystemState) {
      case 'ventral':
        return colors.success;
      case 'sympathetic':
        return colors.warning;
      case 'dorsal':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  /**
   * Render suggested actions
   */
  const renderSuggestedActions = () => {
    if (!message.suggestedActions || message.suggestedActions.length === 0) {
      return null;
    }

    return (
      <View style={styles.actionsContainer}>
        {message.suggestedActions.map((action, index) => {
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
    );
  };

  if (isUser) {
    return (
      <View style={styles.userMessageContainer}>
        <View style={[styles.bubble, styles.userBubble]}>
          <Text style={styles.userText}>{message.content}</Text>
          <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.aiMessageContainer}>
      {/* Huxley Avatar */}
      <Image
        source={require('../../assets/images/huxley-avatar.png')}
        style={styles.huxleyAvatar}
        resizeMode="contain"
      />

      <View style={styles.aiContent}>
        {/* Message Bubble */}
        <View style={[styles.bubble, styles.aiBubble, isError && styles.errorBubble]}>
          {/* Nervous System Indicator */}
          {!isError && nervousSystemState && (
            <View style={styles.nsIndicator}>
              <View
                style={[styles.nsDot, { backgroundColor: getNSColor() }]}
              />
            </View>
          )}

          <FormattedText style={styles.aiText}>{message.content}</FormattedText>

          {isError && (
            <View style={styles.errorBadge}>
              <CloudOff size={14} color={colors.error} strokeWidth={2} />
              <Text style={styles.errorBadgeText}>Offline</Text>
            </View>
          )}

          <Text style={[styles.timestamp, styles.aiTimestamp]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>

        {/* Suggested Actions */}
        {renderSuggestedActions()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  aiMessageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  huxleyAvatar: {
    width: 72,
    height: 72,
    marginRight: spacing.sm,
    marginTop: 4,
  },
  aiContent: {
    flex: 1,
  },
  bubble: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.soft,
  },
  userBubble: {
    backgroundColor: colors.primary,
    maxWidth: '75%',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  errorBubble: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.warning,
  },
  userText: {
    fontSize: 16,
    color: colors.textInverse,
    lineHeight: 22,
  },
  aiText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textInverse,
    opacity: 0.7,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  aiTimestamp: {
    color: colors.textSecondary,
    opacity: 1,
  },
  nsIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  nsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  errorBadgeText: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '600',
  },
  actionsContainer: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  actionText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default IntentionMessageBubble;
