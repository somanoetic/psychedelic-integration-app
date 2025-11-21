/**
 * SubliminalFlash Component
 *
 * Displays a brief (40ms) flash of text for subliminal priming
 * Based on research showing 20-50ms is optimal for subliminal processing
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const SubliminalFlash = ({
  message,
  duration = 40, // milliseconds - research-backed optimal duration
  isVisible = false,
  onComplete,
  style = {},
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);

      // Auto-hide after duration
      const timer = setTimeout(() => {
        setShow(false);
        if (onComplete) {
          onComplete();
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onComplete]);

  if (!show) return null;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.flashOverlay}>
        <Text style={styles.flashText}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Ensure it's above everything
    pointerEvents: 'none', // Don't block interaction
  },
  flashOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Very subtle background
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 12,
  },
  flashText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default SubliminalFlash;
