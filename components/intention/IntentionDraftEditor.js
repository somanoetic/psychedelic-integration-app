import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../theme/colors';

/**
 * IntentionDraftEditor - Draft intention editor with AI feedback
 *
 * Features:
 * - Multiline text input
 * - Character counter (max 2000)
 * - AI analysis button
 * - Feedback display
 * - Save button
 * - Tips and guidance
 */
const IntentionDraftEditor = ({
  draftIntention,
  onChangeDraft,
  feedback,
  onAnalyze,
  analyzingDraft,
  onSave,
  saveToDatabase,
  loading,
}) => {
  const charCount = draftIntention.length;
  const maxChars = 2000;
  const isNearLimit = charCount > maxChars * 0.9;
  const isOverLimit = charCount > maxChars;

  /**
   * Render character counter
   */
  const renderCharCounter = () => (
    <Text
      style={[
        styles.charCounter,
        isNearLimit && styles.charCounterWarning,
        isOverLimit && styles.charCounterError,
      ]}
    >
      {charCount}/{maxChars}
    </Text>
  );

  /**
   * Render feedback section
   */
  const renderFeedback = () => {
    if (!feedback) return null;

    return (
      <View style={styles.feedbackContainer}>
        <View style={styles.feedbackHeader}>
          <MaterialIcons name="insights" size={20} color={colors.primary} />
          <Text style={styles.feedbackTitle}>AI Feedback</Text>
        </View>

        <Text style={styles.feedbackText}>{feedback.feedback}</Text>

        {feedback.suggestions && feedback.suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {feedback.suggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionItem}>
                <MaterialIcons
                  name="lightbulb"
                  size={16}
                  color={colors.golden}
                />
                <Text style={styles.suggestionText}>{suggestion.message}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  /**
   * Render tips
   */
  const renderTips = () => (
    <View style={styles.tipsContainer}>
      <View style={styles.tipsHeader}>
        <MaterialIcons name="tips-and-updates" size={18} color={colors.sage} />
        <Text style={styles.tipsTitle}>Tips for Writing Your Intention</Text>
      </View>
      <View style={styles.tipsList}>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Be specific about what you want to explore or heal
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Focus on one main area rather than multiple goals
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Use compassionate, non-judgmental language
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Consider starting with "I intend to..."
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Write Your Intention</Text>
          <Text style={styles.headerSubtitle}>
            Take your time. This is your space to articulate what matters to you.
          </Text>
        </View>

        {/* Text Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={draftIntention}
            onChangeText={onChangeDraft}
            placeholder="I intend to..."
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={maxChars}
            textAlignVertical="top"
            editable={!loading}
          />
          {renderCharCounter()}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              (!draftIntention || analyzingDraft || loading) && styles.buttonDisabled
            ]}
            onPress={onAnalyze}
            disabled={!draftIntention || analyzingDraft || loading}
            activeOpacity={0.7}
          >
            {analyzingDraft ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <>
                <MaterialIcons name="psychology" size={20} color={colors.textInverse} />
                <Text style={styles.analyzeButtonText}>Get AI Feedback</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (!draftIntention || loading) && styles.buttonDisabled
            ]}
            onPress={onSave}
            disabled={!draftIntention || loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <MaterialIcons
                  name={saveToDatabase ? 'cloud-upload' : 'save'}
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.saveButtonText}>
                  {saveToDatabase ? 'Save & Sync' : 'Save Locally'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Feedback */}
        {renderFeedback()}

        {/* Tips */}
        {!feedback && renderTips()}

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <MaterialIcons name="lock" size={16} color={colors.textSecondary} />
          <Text style={styles.privacyText}>
            {saveToDatabase
              ? 'Your intention will be saved securely to your account'
              : 'Your intention will be saved locally on your device only'
            }
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 200,
    ...shadows.soft,
  },
  input: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    flex: 1,
  },
  charCounter: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  charCounterWarning: {
    color: colors.warning,
    fontWeight: '600',
  },
  charCounterError: {
    color: colors.error,
    fontWeight: '700',
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  feedbackContainer: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  suggestionsContainer: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tipsContainer: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  tipsList: {
    gap: spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipBullet: {
    fontSize: 16,
    color: colors.sage,
    marginRight: spacing.sm,
    fontWeight: 'bold',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});

export default IntentionDraftEditor;
