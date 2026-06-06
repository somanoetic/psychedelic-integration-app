import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Keyboard, Alert, Platform } from 'react-native';
import { Pencil, PlusCircle, X } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

const toTitleCase = (str) =>
  str.replace(/\b\w/g, (c) => c.toUpperCase());

const SessionInfoHeader = ({ session, onUpdate }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [medicine, setMedicine] = useState('');
  const [dosage, setDosage] = useState('');
  const [setting, setSetting] = useState('');
  const [facilitator, setFacilitator] = useState('');
  const [participants, setParticipants] = useState('');
  const [context, setContext] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // KeyboardAvoidingView is unreliable inside <Modal> on iOS — track keyboard
  // height manually so we can push the modal up.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (!session) return null;

  const sessionInfo = session.session_data?.sessionInfo || {};
  const hasSessionInfo =
    sessionInfo.medicine ||
    sessionInfo.dosage ||
    sessionInfo.setting ||
    sessionInfo.facilitator ||
    sessionInfo.participants ||
    sessionInfo.context;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const openEditModal = () => {
    // Load current values
    setMedicine(sessionInfo.medicine || '');
    setDosage(sessionInfo.dosage || '');
    setSetting(sessionInfo.setting || '');
    setFacilitator(sessionInfo.facilitator || '');
    setParticipants(sessionInfo.participants || '');
    setContext(sessionInfo.context || '');
    setShowEditModal(true);
  };

  const saveSessionInfo = async () => {
    setIsSaving(true);
    try {
      const trimmedMedicine = medicine.trim();
      const previousMedicine = sessionInfo.medicine?.trim() || '';
      const titleWasDefault = session.session_data?.titleIsDefault === true;
      const firstMedicineFill = !previousMedicine && !!trimmedMedicine;

      let nextTitle = session.title;
      let nextTitleIsDefault = session.session_data?.titleIsDefault;

      // Auto-rename to "[Medicine] Session [N] - [Date]" the first time the
      // user fills in medicine, but only if they didn't set a custom title at
      // creation. RLS scopes the count query to the current user.
      if (firstMedicineFill && titleWasDefault) {
        const { count, error: countError } = await supabase
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .ilike('session_data->sessionInfo->>medicine', trimmedMedicine)
          .neq('id', session.id);

        if (!countError) {
          const sessionNumber = (count || 0) + 1;
          const dateLabel = new Date(session.journey_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          nextTitle = `${toTitleCase(trimmedMedicine)} Session ${sessionNumber} - ${dateLabel}`;
          nextTitleIsDefault = false;
        }
      }

      const updatedSessionData = {
        ...session.session_data,
        titleIsDefault: nextTitleIsDefault,
        sessionInfo: {
          medicine,
          dosage,
          setting,
          facilitator,
          participants,
          context
        }
      };

      const updates = { session_data: updatedSessionData };
      if (nextTitle !== session.title) {
        updates.title = nextTitle;
      }

      // .select().single() returns the canonical row after update so we can
      // verify the write landed and propagate the authoritative state.
      const { data: updatedRow, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', session.id)
        .select()
        .single();

      if (error) throw error;
      if (!updatedRow) {
        throw new Error('Update returned no row — check RLS policies.');
      }

      // Update local session object with the row the DB actually saved.
      if (onUpdate) {
        onUpdate(updatedRow);
      }

      setShowEditModal(false);

      const alertMessage = Platform.OS === 'web' ? window.alert : Alert.alert;
      if (Platform.OS === 'web') {
        alertMessage('Success! Session details saved.');
      } else {
        alertMessage('Success', 'Session details saved.');
      }
    } catch (error) {
      console.error('Error saving session info:', error);
      const alertMessage = Platform.OS === 'web' ? window.alert : Alert.alert;
      if (Platform.OS === 'web') {
        alertMessage(`Error: ${error.message}`);
      } else {
        alertMessage('Error', `Failed to save: ${error.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{session.title}</Text>
            <Text style={styles.date}>📅 {formatDate(session.journey_date)}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
            {hasSessionInfo ? (
              <Pencil size={20} color={colors.primary} strokeWidth={2} />
            ) : (
              <PlusCircle size={20} color={colors.primary} strokeWidth={2} />
            )}
            <Text style={styles.editButtonText}>{hasSessionInfo ? 'Edit' : 'Add Details'}</Text>
          </TouchableOpacity>
        </View>

        {hasSessionInfo && (
          <View style={styles.sessionDetails}>
            {sessionInfo.medicine && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>💊 Medicine:</Text>
                <Text style={styles.detailValue}>{sessionInfo.medicine}</Text>
              </View>
            )}
            {sessionInfo.dosage && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>⚖️ Dosage:</Text>
                <Text style={styles.detailValue}>{sessionInfo.dosage}</Text>
              </View>
            )}
            {sessionInfo.setting && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>🏞️ Setting:</Text>
                <Text style={styles.detailValue}>{sessionInfo.setting}</Text>
              </View>
            )}
            {sessionInfo.facilitator && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>👤 Facilitator:</Text>
                <Text style={styles.detailValue}>{sessionInfo.facilitator}</Text>
              </View>
            )}
            {sessionInfo.participants && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>👥 Participants:</Text>
                <Text style={styles.detailValue}>{sessionInfo.participants}</Text>
              </View>
            )}
            {sessionInfo.context && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📝 Context:</Text>
                <Text style={styles.detailValue}>{sessionInfo.context}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={[styles.modalOverlay, { paddingBottom: keyboardHeight }]}>
          <View style={styles.modalContent}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 12 }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Session Details</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <X size={24} color={colors.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
              </View>

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
                numberOfLines={4}
              />

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveSessionInfo}
                disabled={isSaving}
              >
                <Text style={styles.modalSaveButtonText}>
                  {isSaving ? 'Saving...' : 'Save Details'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  sessionDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 110,
  },
  detailValue: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingTop: 20,
    width: '100%',
    maxWidth: 600,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalSaveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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

export default SessionInfoHeader;
