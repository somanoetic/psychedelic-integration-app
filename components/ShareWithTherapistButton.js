import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Share2 } from 'lucide-react-native';
import { colors, borderRadius } from '../theme/colors';

/**
 * Reusable share button. Triggers a user-initiated outbound share via the OS
 * share sheet (email, Messages, AirDrop, etc.). The user chooses the recipient
 * — Huxley does not deliver the data anywhere. Default label is generic;
 * pass `label` to override per-screen.
 *
 * @param {function} onShare - async function that performs the share action
 * @param {string} [label='Share Summary'] - button label
 * @param {object} [style] - additional container style
 */
const ShareWithTherapistButton = ({ onShare, label = 'Share Summary', style }) => {
  const [sharing, setSharing] = useState(false);

  const handlePress = async () => {
    setSharing(true);
    try {
      await onShare();
    } catch (e) {
      if (!e.message?.includes('cancelled') && !e.message?.includes('dismissed')) {
        Alert.alert('Share failed', e.message);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      disabled={sharing}
      activeOpacity={0.7}
    >
      {sharing ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Share2 size={18} color="#FFFFFF" strokeWidth={2} />
      )}
      <Text style={styles.text}>{sharing ? 'Preparing...' : label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ShareWithTherapistButton;
