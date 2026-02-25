import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import SessionInfoHeader from '../components/SessionInfoHeader';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';

const SessionDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [currentSession, setCurrentSession] = useState(route.params?.session || null);

  useEffect(() => {
    if (route.params?.session) {
      setCurrentSession(route.params.session);
    }
  }, [route.params?.session]);

  const sessionOptions = [
    {
      id: 'preparation',
      title: 'Session Preparation',
      emoji: '🎯',
      description: 'Set intentions, check-in with yourself, and get ready for your journey',
      details: [
        'Record session details (medicine, setting, participants)',
        'Take belief assessments',
        'Explore philosophical concepts',
        'Set your intention',
        'Nervous system & parts check-ins'
      ],
      estimatedTime: '20-30 min',
      color: colors.primary,
      status: currentSession?.session_data?.preparation?.completedSections?.length > 0 ? 'In Progress' : 'Not Started',
      onPress: () => navigation.navigate('SessionPreparation', { sessionId: currentSession.id, sessionData: currentSession })
    },
    {
      id: 'experience_processing',
      title: 'Experience Processing',
      emoji: '📝',
      description: 'Process your psychedelic journey using Johnson\'s 4-step framework',
      details: [
        'Phase 1: Set & Setting',
        'Phase 2: Narrative of Experience',
        'Phase 3: Inner Dynamics & Entities',
        'Phase 4: Outcomes & Integration Planning'
      ],
      estimatedTime: '45-90 min',
      color: '#3b82f6',
      status: currentSession?.session_data?.experienceProcessing?.completed ? 'Completed' : 'Not Started',
      onPress: () => navigation.navigate('ExperienceMapping', { session: currentSession })
    },
    {
      id: 'integration',
      title: 'Therapeutic Integration',
      emoji: '🌱',
      description: 'Connect insights to life patterns with AI-powered therapeutic support',
      details: [
        'CBT reframing of limiting beliefs',
        'IFS parts work and dialogue',
        'Polyvagal nervous system regulation',
        'Create actionable integration plans'
      ],
      estimatedTime: '30-60 min',
      color: '#10b981',
      status: currentSession?.session_data?.integration?.completed ? 'Completed' : 'Not Started',
      onPress: () => navigation.navigate('TherapeuticIntegration', { session: currentSession })
    }
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSessionUpdate = (updatedSession) => {
    setCurrentSession(updatedSession);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]} edges={['top']}>
      <LinearGradient
        colors={gradients.warm}
        start={{ x: 1.0, y: 0.0 }}
        end={{ x: 0.0, y: 1.0 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>

        <Text style={styles.heroTitle}>{currentSession?.title}</Text>
        <Text style={styles.heroSubtitle}>
          📅 {formatDate(currentSession?.journey_date)}
        </Text>
      </LinearGradient>

      <SessionInfoHeader session={currentSession} onUpdate={handleSessionUpdate} />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          <Text style={styles.sectionTitle}>Session Workflow</Text>
          <Text style={styles.bodyText}>
            Choose what you'd like to work on. You can skip any step or come back to it later.
            All your work is automatically saved to this session.
          </Text>

          {sessionOptions.map((option, index) => (
            <View key={option.id} style={styles.optionCard}>
              <View style={styles.optionHeader}>
                <View style={styles.optionLeft}>
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <View style={styles.optionTitleContainer}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <View style={[
                      styles.statusBadge,
                      option.status === 'Completed' && styles.statusCompleted,
                      option.status === 'In Progress' && styles.statusInProgress
                    ]}>
                      <MaterialIcons
                        name={option.status === 'Completed' ? 'check-circle' : option.status === 'In Progress' ? 'schedule' : 'radio-button-unchecked'}
                        size={14}
                        color={colors.textInverse}
                      />
                      <Text style={styles.statusText}>{option.status}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <Text style={styles.optionDescription}>{option.description}</Text>

              <View style={styles.detailsContainer}>
                {option.details.map((detail, i) => (
                  <View key={i} style={styles.detailItem}>
                    <Text style={styles.detailBullet}>•</Text>
                    <Text style={styles.detailText}>{detail}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.optionFooter}>
                <Text style={styles.estimatedTime}>⏱️ {option.estimatedTime}</Text>
                <TouchableOpacity
                  style={[styles.optionButton, { backgroundColor: option.color }]}
                  onPress={option.onPress}
                >
                  <Text style={styles.optionButtonText}>
                    {option.status === 'Completed' ? 'Review' : option.status === 'In Progress' ? 'Continue' : 'Start'}
                  </Text>
                  <MaterialIcons name="arrow-forward" size={20} color={colors.textInverse} />
                </TouchableOpacity>
              </View>

              {index < sessionOptions.length - 1 && (
                <View style={styles.stepConnector}>
                  <Text style={styles.connectorText}>↓</Text>
                </View>
              )}
            </View>
          ))}

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>💡 Flexible Workflow</Text>
            <Text style={styles.tipText}>
              You don't have to complete these in order. If you've already had your
              experience, you can skip preparation and go straight to processing. Or if
              you want to prepare thoroughly first, that's great too!
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: 32,
    paddingTop: 60,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 10,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 8,
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
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  optionEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  optionTitleContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.textSecondary,
  },
  statusCompleted: {
    backgroundColor: '#10b981',
  },
  statusInProgress: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textInverse,
    marginLeft: 4,
  },
  optionDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  detailsContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailBullet: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  optionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimatedTime: {
    fontSize: 13,
    color: '#9ca3af',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  optionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textInverse,
    marginRight: 6,
  },
  stepConnector: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: -16,
  },
  connectorText: {
    fontSize: 24,
    color: '#d1d5db',
  },
  tipBox: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 12,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
});

export default SessionDetailScreen;
