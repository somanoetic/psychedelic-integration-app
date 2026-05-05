import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { icons } from '../lib/uiIcons';

const SessionToolsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCreating, setIsCreating] = useState(false);

  // Optional session details
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [medicine, setMedicine] = useState('');
  const [dosage, setDosage] = useState('');
  const [setting, setSetting] = useState('');
  const [facilitator, setFacilitator] = useState('');
  const [participants, setParticipants] = useState('');
  const [context, setContext] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Auth error:', userError);
        return;
      }

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading sessions:', error);
      } else {
        setSessions(data || []);
      }
    } catch (error) {
      console.error('Unexpected error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title, message) => {
    console.log(`Alert: ${title} - ${message}`);
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const createSession = async () => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        showAlert('Authentication Error', 'Please log in again');
        return;
      }

      const newSession = {
        user_id: user.id,
        title: sessionTitle || `Session ${new Date().toLocaleDateString()}`,
        journey_date: sessionDate,
        current_step: 1,
        session_data: {
          sessionType: 'full_session',
          conversationMode: 'preparation',
          sessionInfo: {
            medicine,
            dosage,
            setting,
            facilitator,
            participants,
            context
          },
          preparation: {},
          experienceProcessing: {},
          integration: {}
        }
      };

      const { data, error } = await supabase
        .from('sessions')
        .insert([newSession])
        .select()
        .single();

      if (error) {
        showAlert('Error', `Failed to create session: ${error.message}`);
      } else {
        setShowCreateModal(false);
        setSessionTitle('');
        setSessions([data, ...sessions]);

        // Navigate to the new session detail view
        navigation.navigate('SessionDetail', { session: data });
      }
    } catch (error) {
      showAlert('Error', `Failed to create session: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const getSessionStatus = (session) => {
    const prep = session.session_data?.preparation;
    const experience = session.session_data?.experienceProcessing;
    const integration = session.session_data?.integration;

    if (integration?.completed) return { text: 'Integrated', color: colors.success, emoji: '✅', icon: icons.integration };
    if (experience?.completed) return { text: 'Processed', color: colors.primary, emoji: '📝', icon: icons.journal };
    if (prep?.completedSections?.length > 0) return { text: 'In Progress', color: colors.warning, emoji: '⏳', icon: icons.trailProgress };
    return { text: 'New', color: colors.textSecondary, emoji: '✨', icon: icons.newBeginning };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]} edges={['top', 'bottom']}>
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
        <Text style={styles.heroTitle}>🛠️ Session Tools</Text>
        <Text style={styles.heroSubtitle}>
          Create and manage your integration sessions
        </Text>
      </LinearGradient>

      {/* Create New Session Button */}
      <View style={styles.createButtonContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <MaterialIcons name="add-circle" size={24} color="#ffffff" />
          <Text style={styles.createButtonText}>Start New Session</Text>
        </TouchableOpacity>
      </View>

      {/* Sessions Library */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Sessions</Text>
            <Text style={styles.sessionCount}>{sessions.length} total</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading your sessions...</Text>
            </View>
          ) : sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌟</Text>
              <Text style={styles.emptyTitle}>No Sessions Yet</Text>
              <Text style={styles.emptyDescription}>
                Create your first session to begin your integration journey.
                Each session tracks your preparation, experience processing, and integration work.
              </Text>
            </View>
          ) : (
            sessions.map((session) => {
              const status = getSessionStatus(session);
              return (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionCard}
                  onPress={() => navigation.navigate('SessionDetail', { session })}
                >
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionTitleContainer}>
                      <Text style={styles.sessionTitle}>{session.title}</Text>
                      <View style={styles.sessionMeta}>
                        <Text style={styles.sessionDate}>
                          📅 {formatDate(session.journey_date)}
                        </Text>
                        <Text style={styles.sessionDivider}>•</Text>
                        <Text style={styles.sessionCreated}>
                          Created {formatDate(session.created_at)}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                      {status.icon ? (
                        <Image source={status.icon} style={styles.statusIconImage} />
                      ) : (
                        <Text style={styles.statusEmoji}>{status.emoji}</Text>
                      )}
                      <Text style={styles.statusText}>{status.text}</Text>
                    </View>
                  </View>

                  {/* Session Progress Indicators */}
                  <View style={styles.progressIndicators}>
                    <View style={styles.progressItem}>
                      <MaterialIcons
                        name={session.session_data?.preparation?.completedSections?.length > 0 ? 'check-circle' : 'radio-button-unchecked'}
                        size={20}
                        color={session.session_data?.preparation?.completedSections?.length > 0 ? colors.success : '#d1d5db'}
                      />
                      <Text style={styles.progressLabel}>Preparation</Text>
                    </View>
                    <View style={styles.progressItem}>
                      <MaterialIcons
                        name={session.session_data?.experienceProcessing?.completed ? 'check-circle' : 'radio-button-unchecked'}
                        size={20}
                        color={session.session_data?.experienceProcessing?.completed ? colors.success : '#d1d5db'}
                      />
                      <Text style={styles.progressLabel}>Experience</Text>
                    </View>
                    <View style={styles.progressItem}>
                      <MaterialIcons
                        name={session.session_data?.integration?.completed ? 'check-circle' : 'radio-button-unchecked'}
                        size={20}
                        color={session.session_data?.integration?.completed ? colors.success : '#d1d5db'}
                      />
                      <Text style={styles.progressLabel}>Integration</Text>
                    </View>
                  </View>

                  <View style={styles.sessionFooter}>
                    <Text style={styles.tapToOpen}>Tap to open →</Text>
                  </View>
                </TouchableOpacity>
              );
            })
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
              placeholder="e.g., Healing Session - December 2024"
              placeholderTextColor={colors.textLight}
            />

            <Text style={styles.modalLabel}>Journey Date</Text>
            <TextInput
              style={styles.modalInput}
              value={sessionDate}
              onChangeText={setSessionDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textLight}
            />

            {/* Optional Details Section */}
            <TouchableOpacity
              style={styles.optionalDetailsToggle}
              onPress={() => setShowOptionalDetails(!showOptionalDetails)}
            >
              <Text style={styles.optionalDetailsToggleText}>
                {showOptionalDetails ? '▼' : '▶'} Optional Session Details
              </Text>
              <Text style={styles.optionalBadge}>Optional</Text>
            </TouchableOpacity>

            {showOptionalDetails && (
              <View style={styles.optionalDetailsContainer}>
                <Text style={styles.modalLabel}>Medicine/Substance</Text>
                <TextInput
                  style={styles.modalInput}
                  value={medicine}
                  onChangeText={setMedicine}
                  placeholder="e.g., Psilocybin, LSD, MDMA"
                  placeholderTextColor={colors.textLight}
                />

                <Text style={styles.modalLabel}>Dosage</Text>
                <TextInput
                  style={styles.modalInput}
                  value={dosage}
                  onChangeText={setDosage}
                  placeholder="e.g., 3.5g dried mushrooms"
                  placeholderTextColor={colors.textLight}
                />

                <Text style={styles.modalLabel}>Setting/Location</Text>
                <TextInput
                  style={styles.modalInput}
                  value={setting}
                  onChangeText={setSetting}
                  placeholder="e.g., Home, Retreat center"
                  placeholderTextColor={colors.textLight}
                />

                <Text style={styles.modalLabel}>Facilitator/Guide</Text>
                <TextInput
                  style={styles.modalInput}
                  value={facilitator}
                  onChangeText={setFacilitator}
                  placeholder="e.g., Name or 'Solo journey'"
                  placeholderTextColor={colors.textLight}
                />

                <Text style={styles.modalLabel}>Other Participants</Text>
                <TextInput
                  style={styles.modalInput}
                  value={participants}
                  onChangeText={setParticipants}
                  placeholder="e.g., Partner, Solo"
                  placeholderTextColor={colors.textLight}
                />

                <Text style={styles.modalLabel}>Additional Context</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  value={context}
                  onChangeText={setContext}
                  placeholder="What's happening in your life?"
                  placeholderTextColor={colors.textLight}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            <View style={styles.modalInfoBox}>
              <Text style={styles.modalInfoText}>
                💡 After creating your session, you can choose to do preparation,
                skip to experience processing, or start integration work.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalCreateButton}
              onPress={createSession}
              disabled={isCreating}
            >
              <Text style={styles.modalCreateButtonText}>
                {isCreating ? 'Creating...' : 'Create Session'}
              </Text>
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
  headerGradient: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  createButtonContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textInverse,
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  contentPadding: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  sessionCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sessionTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sessionDivider: {
    fontSize: 13,
    color: '#d1d5db',
    marginHorizontal: 8,
  },
  sessionCreated: {
    fontSize: 13,
    color: colors.textLight,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusIconImage: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
    marginRight: 4,
  },
  statusEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textInverse,
  },
  progressIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginBottom: 12,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  sessionFooter: {
    alignItems: 'center',
  },
  tapToOpen: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
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
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  modalInfoBox: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalInfoText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  modalCreateButton: {
    backgroundColor: colors.success,
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
  optionalDetailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  optionalDetailsToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  optionalBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  optionalDetailsContainer: {
    marginBottom: 16,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default SessionToolsScreen;
