import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MessageSquareText, X, Bug, Lightbulb } from 'lucide-react-native';

const FEEDBACK_ICON_MAP = {
  'bug-report': Bug,
  lightbulb: Lightbulb,
  feedback: MessageSquareText,
};
import { supabase } from '../lib/supabase';

export default function FeedbackButton({ style }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const feedbackTypes = [
    { id: 'bug', label: 'Bug Report', icon: 'bug-report', color: '#dc2626' },
    { id: 'feature', label: 'Feature Request', icon: 'lightbulb', color: '#2563eb' },
    { id: 'feedback', label: 'General Feedback', icon: 'feedback', color: '#16a34a' },
  ];

  const handleSubmit = async () => {
    if (!feedbackType || !title.trim() || !description.trim()) {
      Alert.alert('Required Fields', 'Please fill in all fields before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user?.id || null,
          type: feedbackType,
          title: title.trim(),
          description: description.trim(),
          app_version: '1.0.0',
          platform: Platform.OS,
        });

      if (error) throw error;

      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully. We appreciate your help in improving the app!',
        [{ text: 'OK', onPress: () => handleClose() }]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert(
        'Submission Error',
        'There was an error submitting your feedback. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    setFeedbackType(null);
    setTitle('');
    setDescription('');
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.feedbackButton, style]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <MessageSquareText size={24} color="#ffffff" strokeWidth={2} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Feedback</Text>
              <TouchableOpacity onPress={handleClose}>
                <X size={24} color="#666" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionTitle}>What kind of feedback?</Text>
              <View style={styles.typeContainer}>
                {feedbackTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeButton,
                      feedbackType === type.id && styles.typeButtonSelected,
                      { borderColor: type.color },
                    ]}
                    onPress={() => setFeedbackType(type.id)}
                  >
                    {(() => {
                      const Icon = FEEDBACK_ICON_MAP[type.icon] || MessageSquareText;
                      return (
                        <Icon
                          size={24}
                          color={feedbackType === type.id ? type.color : '#666'}
                          strokeWidth={2}
                        />
                      );
                    })()}
                    <Text
                      style={[
                        styles.typeLabel,
                        feedbackType === type.id && { color: type.color },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Brief summary..."
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                spellCheck={true}
                autoCorrect={true}
                autoCapitalize="sentences"
              />

              <Text style={styles.sectionTitle}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Please provide details..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                spellCheck={true}
                autoCorrect={true}
                autoCapitalize="sentences"
              />

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.submitButton,
                    submitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  <Text style={styles.submitButtonText}>
                    {submitting ? 'Submitting...' : 'Submit'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  feedbackButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  typeContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  typeButtonSelected: {
    backgroundColor: '#f0f9ff',
  },
  typeLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  submitButtonDisabled: {
    backgroundColor: '#b0b0b0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
