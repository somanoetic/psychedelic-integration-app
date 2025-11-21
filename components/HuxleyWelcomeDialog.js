import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AvatarSelector from './AvatarSelector';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HuxleyWelcomeDialog = ({ visible, onDismiss, onNavigate }) => {
  const [selectedAvatar, setSelectedAvatar] = useState('brain');

  useEffect(() => {
    loadAvatar();
  }, []);

  const loadAvatar = async () => {
    try {
      const saved = await AsyncStorage.getItem('huxley_avatar');
      if (saved) setSelectedAvatar(saved);
    } catch (error) {
      console.error('Error loading avatar:', error);
    }
  };

  const navigationOptions = [
    {
      id: 'session_tools',
      title: 'Session Tools',
      icon: 'settings',
      color: '#8b5cf6',
      description: 'Create sessions, prepare, process experiences',
      route: 'SessionTools',
    },
    {
      id: 'past_sessions',
      title: 'View All Sessions',
      icon: 'history',
      color: '#3b82f6',
      description: 'Continue working with previous sessions',
      route: 'AllSessions',
    },
    {
      id: 'foundation_learning',
      title: 'Foundation Learning',
      icon: 'school',
      color: '#10b981',
      description: 'Learn nervous system basics and parts work',
      route: 'Education',
    },
    {
      id: 'exercise_library',
      title: 'Exercise Library',
      icon: 'fitness-center',
      color: '#f59e0b',
      description: 'Browse therapeutic practices and exercises',
      route: 'ExerciseLibrary',
    },
  ];

  const handleNavigate = (route) => {
    onNavigate(route);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onDismiss}
          >
            <MaterialIcons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Huxley Character */}
            <View style={styles.characterContainer}>
              {/* Using icon placeholder - works reliably in Expo Go */}
              <View style={styles.characterPlaceholder}>
                <MaterialIcons name="psychology" size={64} color="#8b5cf6" />
              </View>
              <Text style={styles.characterName}>Huxley</Text>
            </View>

          {/* Welcome Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.messageText}>
              What would you like to explore today?
            </Text>
          </View>

          {/* Avatar Selector */}
          <AvatarSelector
            currentAvatar={selectedAvatar}
            onSelect={(avatar) => setSelectedAvatar(avatar.id)}
          />

          {/* Navigation Options */}
          <View style={styles.optionsContainer}>
            {navigationOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionCard, { borderLeftColor: option.color }]}
                onPress={() => handleNavigate(option.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${option.color}20` }]}>
                  <MaterialIcons name={option.icon} size={28} color={option.color} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>

            {/* Just tap outside or X to close - no permanent dismiss option */}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '90%',
    maxWidth: 480,
    height: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dialogContainerSimple: {
    backgroundColor: '#ff0000',
    padding: 50,
    borderRadius: 20,
    width: 300,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 24,
    paddingTop: 48,
  },
  characterContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  characterPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  characterImage: {
    width: 120,
    height: 180,
    marginBottom: 12,
  },
  characterName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  dontShowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  dontShowText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dismissButton: {
    backgroundColor: '#f3f4f6',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});

export default HuxleyWelcomeDialog;
