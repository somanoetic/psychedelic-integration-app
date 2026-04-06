import React from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../../theme/colors';

/**
 * IntentionPrivacyControls - Privacy toggle and explanation
 *
 * Features:
 * - Save to database toggle
 * - Privacy explanation
 * - Visual feedback
 */
const IntentionPrivacyControls = ({ saveToDatabase, onToggle }) => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="lock" size={20} color={colors.primary} />
        <Text style={styles.headerText}>Privacy Settings</Text>
      </View>

      {/* Toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleLabel}>
          <Text style={styles.toggleTitle}>Save to Database</Text>
          <Text style={styles.toggleSubtitle}>
            Sync your intention across devices
          </Text>
        </View>
        <Switch
          value={saveToDatabase}
          onValueChange={onToggle}
          trackColor={{ false: colors.lightGray, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>

      {/* Explanation */}
      <View style={styles.explanation}>
        <MaterialIcons
          name="info"
          size={16}
          color={colors.textSecondary}
          style={styles.infoIcon}
        />
        <Text style={styles.explanationText}>
          {saveToDatabase
            ? 'Your intention will be encrypted and saved securely to your account. You can view, edit, or delete it anytime from Settings.'
            : 'Your intention will be saved locally on this device only. It will not be uploaded to our servers.'
          }
        </Text>
      </View>

      {/* Learn More Link */}
      <TouchableOpacity
        style={styles.learnMore}
        onPress={() => navigation.navigate('PrivacyPolicy')}
        activeOpacity={0.7}
      >
        <Text style={styles.learnMoreText}>Learn more about privacy</Text>
        <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  toggleLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  explanation: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  infoIcon: {
    marginRight: spacing.xs,
    marginTop: 2,
  },
  explanationText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  learnMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  learnMoreText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default IntentionPrivacyControls;
