import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';

const PreparationScreen = ({ navigation, route }) => {
  const { sessionId, sessionData } = route.params || {};
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);

  // Debug log to verify this new version is loading
  console.log('🔥 NEW PreparationScreen loaded with session:', sessionId);

  const preparationOptions = [
    {
      id: 'general_preparation',
      title: 'Foundation Learning',
      emoji: '🧠',
      description: 'Learn the core concepts for all your sessions',
      subtitle: 'Nervous System • Parts Work • Grounding Techniques',
      color: colors.primary,
      estimatedTime: '20-30 minutes (one-time setup)',
      buttonText: 'Start Foundation Learning'
    },
    {
      id: 'session_preparation',
      title: 'Session Preparation',
      emoji: '🎯',
      description: 'Prepare for this specific session',
      subtitle: 'Intention • Assessments • Thought Experiments • Check-ins',
      color: colors.success,
      estimatedTime: '15-20 minutes per session',
      buttonText: 'Prepare for Session',
      requiresSession: true
    },
    {
      id: 'create_session',
      title: 'Create New Session',
      emoji: '✨',
      description: 'Start planning your upcoming journey',
      subtitle: 'Schedule • Set Context • Begin Preparation',
      color: colors.primary,
      estimatedTime: '5 minutes',
      buttonText: 'Create Session'
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollContainer}>
        <LinearGradient
          colors={gradients.warm}
          start={{ x: 1.0, y: 0.0 }}
          end={{ x: 0.0, y: 1.0 }}
          style={styles.headerGradient}
        >
          <Text style={styles.heroTitle}>🆕 NEW Preparation Hub</Text>
          <Text style={styles.heroSubtitle}>
            Choose how you'd like to prepare for your healing journey
          </Text>
        </LinearGradient>

        <View style={styles.contentPadding}>
          <Text style={styles.sectionTitle}>🌟 Two Types of Preparation</Text>
          <Text style={styles.bodyText}>
            Get the most from your sessions with proper preparation. Start with foundation learning, 
            then prepare for each individual session.
          </Text>

          {preparationOptions.map((option) => (
            <View key={option.id} style={styles.optionCard}>
              <View style={styles.optionHeader}>
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <View style={styles.optionTitleContainer}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
              </View>
              
              <Text style={styles.optionDescription}>{option.description}</Text>
              
              <View style={styles.optionMeta}>
                <Text style={styles.optionTime}>⏱️ {option.estimatedTime}</Text>
              </View>

              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: option.color }]}
                onPress={() => {
                  if (option.id === 'general_preparation') {
                    navigation.navigate('GeneralPreparation');
                  } else if (option.id === 'session_preparation') {
                    if (sessionId) {
                      navigation.navigate('SessionPreparation', { sessionId, sessionData });
                    } else {
                      Alert.alert(
                        'No Session Selected',
                        'Please create a session first using the "Create New Session" option below.',
                        [{ text: 'OK', style: 'default' }]
                      );
                    }
                  } else if (option.id === 'create_session') {
                    setShowCreateModal(true);
                  }
                }}
              >
                <Text style={styles.optionButtonText}>{option.buttonText}</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.recommendationBox}>
            <Text style={styles.recommendationTitle}>💡 Recommended Flow</Text>
            <View style={styles.recommendationStep}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>
                <Text style={styles.stepBold}>First time?</Text> Start with Foundation Learning to understand 
                nervous system states, parts work, and grounding techniques.
              </Text>
            </View>
            <View style={styles.recommendationStep}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>
                <Text style={styles.stepBold}>Before each session:</Text> Complete Session Preparation to set 
                your intention, check in with yourself, and gather items.
              </Text>
            </View>
          </View>

          {sessionData && (
            <View style={styles.sessionInfoBox}>
              <Text style={styles.sessionInfoTitle}>Current Session</Text>
              <Text style={styles.sessionInfoText}>📅 {sessionData.journey_date || 'Today'}</Text>
              <Text style={styles.sessionInfoText}>📝 {sessionData.title || 'Healing Session'}</Text>
              <Text style={styles.sessionInfoText}>🎯 {sessionData.sessionType || 'Treatment'}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Session Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Session</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Session Title</Text>
            <TextInput
              style={styles.modalInput}
              value={sessionTitle}
              onChangeText={setSessionTitle}
              placeholder="e.g., Healing Session - December"
              placeholderTextColor={colors.textLight}
            />

            <Text style={styles.modalLabel}>Session Date</Text>
            <TextInput
              style={styles.modalInput}
              value={sessionDate}
              onChangeText={setSessionDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textLight}
            />

            <TouchableOpacity
              style={styles.modalCreateButton}
              onPress={async () => {
                try {
                  const { data: { user }, error: userError } = await supabase.auth.getUser();

                  if (userError || !user) {
                    Alert.alert('Authentication Error', 'Please log in again');
                    return;
                  }

                  const newSession = {
                    user_id: user.id,
                    title: sessionTitle || `Preparation Session ${new Date().toLocaleDateString()}`,
                    journey_date: sessionDate,
                    current_step: 1,
                    session_data: {
                      sessionType: 'preparation',
                      conversationMode: 'preparation'
                    }
                  };

                  const { data, error } = await supabase
                    .from('sessions')
                    .insert([newSession])
                    .select()
                    .single();

                  if (error) {
                    Alert.alert('Error', `Failed to create session: ${error.message}`);
                  } else {
                    setShowCreateModal(false);
                    setSessionTitle('');
                    // Navigate to session preparation with new session
                    navigation.replace('Preparation', { sessionId: data.id, sessionData: data });
                  }
                } catch (error) {
                  Alert.alert('Error', `Failed to create session: ${error.message}`);
                }
              }}
            >
              <Text style={styles.modalCreateButtonText}>Create Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    paddingTop: 60,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    textAlign: 'center',
    lineHeight: 24,
  },
  contentPadding: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 32,
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  optionTitleContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  optionMeta: {
    marginBottom: 20,
  },
  optionTime: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
    marginRight: 8,
  },
  recommendationBox: {
    backgroundColor: colors.bubbleArchetypal,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 16,
  },
  recommendationStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    backgroundColor: '#fed7aa',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
    marginTop: 2,
  },
  stepText: {
    fontSize: 15,
    color: '#92400e',
    lineHeight: 22,
    flex: 1,
  },
  stepBold: {
    fontWeight: '600',
  },
  sessionInfoBox: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  sessionInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 12,
  },
  sessionInfoText: {
    fontSize: 15,
    color: '#065f46',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  modalCreateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalCreateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  modalCancelButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default PreparationScreen;