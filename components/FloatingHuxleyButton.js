/**
 * Floating Huxley Button
 *
 * Always-visible floating action button to access Huxley chat
 */

import { useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { colors } from '../theme/colors';

const FloatingHuxleyButton = ({ onPress }) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Image
          source={require('../assets/images/huxley-avatar.png')}
          style={styles.huxleyImage}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50, // Just above tab bar
    right: 20,
    zIndex: 1000,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 3,
    borderColor: colors.primary,
    overflow: 'visible',
  },
  huxleyImage: {
    width: 110,
    height: 110,
    marginBottom: 12,
  },
});

export default FloatingHuxleyButton;
