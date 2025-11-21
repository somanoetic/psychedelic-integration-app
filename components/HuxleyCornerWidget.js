import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVATAR_OPTIONS } from './AvatarSelector';

const HuxleyCornerWidget = ({ onPress, showPulse = false }) => {
  const [avatar, setAvatar] = useState('brain');
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadAvatar();
  }, []);

  useEffect(() => {
    if (showPulse) {
      // Gentle pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showPulse]);

  const loadAvatar = async () => {
    try {
      const savedAvatar = await AsyncStorage.getItem('huxley_avatar');
      if (savedAvatar) {
        setAvatar(savedAvatar);
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    }
  };

  const getCurrentAvatar = () => {
    return AVATAR_OPTIONS.find(a => a.id === avatar) || AVATAR_OPTIONS[0];
  };

  const currentAvatar = getCurrentAvatar();

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: pulseAnim }] }
      ]}
    >
      <TouchableOpacity
        style={[styles.button, { backgroundColor: currentAvatar.color }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={currentAvatar.icon}
          size={28}
          color="#ffffff"
        />
        {showPulse && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>!</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HuxleyCornerWidget;
