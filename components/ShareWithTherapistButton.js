import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, borderRadius } from '../theme/colors';

/**
 * Reusable "Share with Therapist" button.
 *
 * @param {function} onShare - async function that performs the share action
 * @param {string} [label='Share with Therapist'] - button label
 * @param {object} [style] - additional container style
 */
const ShareWithTherapistButton = ({ onShare, label = 'Share with Therapist', style }) => {
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
        <MaterialIcons name="share" size={18} color="#FFFFFF" />
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
