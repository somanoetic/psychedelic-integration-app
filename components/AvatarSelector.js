import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AVATAR_OPTIONS = [
  {
    id: 'brain',
    icon: 'psychology',
    name: 'Wisdom',
    color: '#8b5cf6',
    description: 'Thoughtful guide focused on insight'
  },
  {
    id: 'heart',
    icon: 'favorite',
    name: 'Compassion',
    color: '#ec4899',
    description: 'Warm, caring companion'
  },
  {
    id: 'spa',
    icon: 'spa',
    name: 'Serenity',
    color: '#10b981',
    description: 'Calm, grounding presence'
  },
  {
    id: 'stars',
    icon: 'auto-awesome',
    name: 'Wonder',
    color: '#f59e0b',
    description: 'Curious explorer of experience'
  },
  {
    id: 'nature',
    icon: 'park',
    name: 'Growth',
    color: '#14b8a6',
    description: 'Nurturing, patient guide'
  },
  {
    id: 'light',
    icon: 'wb-sunny',
    name: 'Clarity',
    color: '#eab308',
    description: 'Illuminating, insightful'
  }
];

const AvatarSelector = ({ onSelect, currentAvatar }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || 'brain');

  const handleSelect = async (avatar) => {
    setSelectedAvatar(avatar.id);
    try {
      await AsyncStorage.setItem('huxley_avatar', avatar.id);
      if (onSelect) {
        onSelect(avatar);
      }
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Guide</Text>
      <Text style={styles.subtitle}>Select the presence that resonates with you</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.avatarGrid}
      >
        {AVATAR_OPTIONS.map((avatar) => {
          const isSelected = selectedAvatar === avatar.id;
          return (
            <TouchableOpacity
              key={avatar.id}
              style={[
                styles.avatarCard,
                isSelected && styles.avatarCardSelected,
                { borderColor: avatar.color }
              ]}
              onPress={() => handleSelect(avatar)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${avatar.color}20` }]}>
                <MaterialIcons
                  name={avatar.icon}
                  size={40}
                  color={avatar.color}
                />
              </View>
              <Text style={styles.avatarName}>{avatar.name}</Text>
              <Text style={styles.avatarDescription}>{avatar.description}</Text>
              {isSelected && (
                <View style={styles.selectedBadge}>
                  <MaterialIcons name="check-circle" size={20} color={avatar.color} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarGrid: {
    paddingHorizontal: 16,
    gap: 12,
  },
  avatarCard: {
    width: 140,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  avatarCardSelected: {
    borderWidth: 3,
    backgroundColor: '#f9fafb',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  avatarDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

export default AvatarSelector;
export { AVATAR_OPTIONS };
