import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

const SessionInfoHeader = ({ session, onUpdate }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [medicine, setMedicine] = useState('');
  const [dosage, setDosage] = useState('');
  const [setting, setSetting] = useState('');
  const [facilitator, setFacilitator] = useState('');
  const [participants, setParticipants] = useState('');
  const [context, setContext] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      const updatedSessionData = {
        ...session.session_data,
        sessionInfo: {
          medicine,
          dosage,
          setting,
          facilitator,
          participants,
          context
        }
      };

      const { error } = await supabase
        .from('sessions')
        .update({ session_data: updatedSessionData })
        .eq('id', session.id);

      if (error) throw error;

      // Update local session object
      if (onUpdate) {
        onUpdate({
          ...session,
          session_data: updatedSessionData
        });
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
            <MaterialIcons name={hasSessionInfo ? "edit" : "add-circle"} size={20} color={colors.primary} />
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Session Details</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <MaterialIcons name="close" size={24} color={colors.textSecondary} />
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
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
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
