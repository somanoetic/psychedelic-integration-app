import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../theme/colors';
import IntentionMessageBubble from './IntentionMessageBubble';

/**
 * IntentionConversation - AI conversation interface for intention guidance
 *
 * Features:
 * - Scrollable message history
 * - Message input with send button
 * - Loading indicator during AI response
 * - Suggested actions from AI
 * - Quick action buttons (view templates, edit draft)
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
  const flatListRef = useRef(null);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    if (conversationHistory.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversationHistory]);

  // Scroll to bottom when keyboard opens
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    });
    return () => sub.remove();
  }, []);

  /**
   * Handle send message
   */
  const handleSend = () => {
    if (!messageText.trim() || disabled || loading) return;

    onSendMessage(messageText.trim());
    setMessageText('');
  };

  /**
   * Render stage indicator
   */
  const renderStageIndicator = () => {
    const stageLabels = {
      welcome: 'Getting Started',
      exploration: 'Exploring',
      formulation: 'Formulating',
      refinement: 'Refining',
      review: 'Reviewing',
    };

    const stageIcons = {
      welcome: 'waving-hand',
      exploration: 'search',
      formulation: 'edit',
      refinement: 'auto-fix-high',
      review: 'check-circle',
    };

    return (
      <View style={styles.stageIndicator}>
        <MaterialIcons
          name={stageIcons[conversationStage] || 'chat'}
          size={16}
          color={colors.primary}
        />
        <Text style={styles.stageText}>
          {stageLabels[conversationStage] || 'Chatting'}
        </Text>
      </View>
    );
  };

  /**
   * Render quick actions
   */
  const renderQuickActions = () => {
    if (conversationStage === 'welcome') return null;

    return (
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={onViewTemplates}
          activeOpacity={0.7}
        >
          <MaterialIcons name="library-books" size={18} color={colors.primary} />
          <Text style={styles.quickActionText}>View Templates</Text>
        </TouchableOpacity>

        {conversationStage !== 'welcome' && (
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={onEditDraft}
            activeOpacity={0.7}
          >
            <MaterialIcons name="edit" size={18} color={colors.primary} />
            <Text style={styles.quickActionText}>Edit Draft</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  /**
   * Render empty state
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="chat-bubble-outline" size={64} color={colors.lightGray} />
      <Text style={styles.emptyText}>
        Your conversation will appear here
      </Text>
    </View>
  );

  /**
   * Render message item
   */
  const renderMessage = ({ item, index }) => (
    <IntentionMessageBubble
      message={item}
      nervousSystemState={nervousSystemState}
      isLatest={index === conversationHistory.length - 1}
      onActionPress={onActionPress}
    />
  );

  return (
    <View style={styles.container}>
      {/* Stage Indicator */}
      {renderStageIndicator()}

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Message List */}
      <FlatList
        ref={flatListRef}
        data={conversationHistory}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `${index}-${item.timestamp}`}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Huxley is thinking...</Text>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Share what's on your mind..."
          placeholderTextColor={colors.textLight}
          multiline
          maxLength={500}
          editable={!disabled && !loading}
          onSubmitEditing={handleSend}
          onFocus={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 300);
          }}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!messageText.trim() || disabled || loading) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!messageText.trim() || disabled || loading}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="send"
            size={24}
            color={messageText.trim() && !disabled && !loading ? colors.textInverse : colors.textLight}
          />
        </TouchableOpacity>
      </View>

      {/* Character Counter */}
      {messageText.length > 400 && (
        <Text style={styles.charCounter}>
          {messageText.length}/500
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
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
    marginBottom: spacing.md,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    gap: spacing.xs,
  },
  quickActionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  messageList: {
    paddingBottom: 60,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    padding: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: spacing.xs,
  },
  sendButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  charCounter: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});

export default IntentionConversation;
