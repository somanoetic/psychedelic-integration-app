import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import userRoleService from '../lib/userRoleService';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';

const ContributorApplicationScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    professional_background: '',
    years_experience: '',
    specializations: '',
    contribution_focus: '',
    additional_info: ''
  });

  const startResubmit = () => {
    const d = verificationStatus?.data || {};
    setFormData({
      full_name: d.full_name || '',
      professional_background: d.professional_background || '',
      years_experience: d.years_experience != null ? String(d.years_experience) : '',
      specializations: Array.isArray(d.specializations) ? d.specializations.join(', ') : (d.specializations || ''),
      contribution_focus: d.contribution_focus || '',
      additional_info: d.additional_info || '',
    });
    setIsEditing(true);
  };

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const result = await userRoleService.getVerificationStatus();
      setVerificationStatus(result);
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const requiredFields = ['full_name', 'professional_background', 'contribution_focus'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());

    if (missingFields.length > 0) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const applicationData = {
        ...formData,
        years_experience: parseInt(formData.years_experience) || 0,
        specializations: formData.specializations.split(',').map((s) => s.trim()).filter((s) => s),
      };

      Object.keys(applicationData).forEach((key) => {
        if (applicationData[key] === '') {
          delete applicationData[key];
        }
      });

      const isResubmit = isEditing && verificationStatus?.data?.id;
      const result = isResubmit
        ? await userRoleService.resubmitVerificationRequest(verificationStatus.data.id, applicationData)
        : await userRoleService.submitContributorApplication(applicationData);

      if (result.success) {
        Alert.alert(
          isResubmit ? 'Application updated' : 'Application submitted',
          isResubmit
            ? "Thanks — your updated application is back in the review queue. We'll email you once a decision is made."
            : "Thanks — your contributor application is in. We'll review it and email you once a decision is made.",
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit application.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={gradients.standard}
        start={{ x: 1.0, y: 0.0 }}
        end={{ x: 0.0, y: 1.0 }}
        style={{ flex: 1 }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Checking verification status...</Text>
        </View>
      </LinearGradient>
    );
  }

  // Show status if already submitted — unless the applicant has tapped
  // "Update Application" to respond to a needs_more_info request, in which
  // case fall through to the form below (now pre-filled).
  if (verificationStatus?.status && verificationStatus.status !== 'none' && !isEditing) {
    return (
      <LinearGradient
        colors={gradients.standard}
        start={{ x: 1.0, y: 0.0 }}
        end={{ x: 0.0, y: 1.0 }}
        style={{ flex: 1 }}
      >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Application Status</Text>
        </View>

        <View style={styles.statusContainer}>
          {verificationStatus.status === 'pending' && (
            <>
              <Text style={styles.statusEmoji}>⏳</Text>
              <Text style={styles.statusTitle}>Application Pending</Text>
              <Text style={styles.statusText}>
                Your contributor application is being reviewed. You will receive an email when a decision is made.
              </Text>
            </>
          )}

          {verificationStatus.status === 'approved' && (
            <>
              <Text style={styles.statusEmoji}>✅</Text>
              <Text style={styles.statusTitle}>Application Approved</Text>
              <Text style={styles.statusText}>
                You're in. As an approved contributor you can upload training scenarios. All contributions are reviewed before they go live.
              </Text>
            </>
          )}

          {verificationStatus.status === 'rejected' && (
            <>
              <Text style={styles.statusEmoji}>❌</Text>
              <Text style={styles.statusTitle}>Application Not Approved</Text>
              <Text style={styles.statusText}>
                Unfortunately, your application was not approved.
              </Text>
              {verificationStatus.data?.review_notes && (
                <Text style={styles.reviewNotes}>
                  Reason: {verificationStatus.data.review_notes}
                </Text>
              )}
            </>
          )}

          {verificationStatus.status === 'needs_more_info' && (
            <>
              <Text style={styles.statusEmoji}>📋</Text>
              <Text style={styles.statusTitle}>More Information Needed</Text>
              <Text style={styles.statusText}>
                Your application needs additional information.
              </Text>
              {verificationStatus.data?.review_notes && (
                <Text style={styles.reviewNotes}>
                  {verificationStatus.data.review_notes}
                </Text>
              )}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={startResubmit}
              >
                <Text style={styles.submitButtonText}>Update Application</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
      </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={gradients.standard}
      start={{ x: 1.0, y: 0.0 }}
      end={{ x: 0.0, y: 1.0 }}
      style={{ flex: 1 }}
    >
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <ScrollView style={styles.scroll}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Update Application' : 'Contributor Application'}</Text>
      </View>

      {isEditing && verificationStatus?.data?.review_notes ? (
        <View style={styles.reviewNotesBanner}>
          <Text style={styles.reviewNotesBannerTitle}>📋 Reviewer asked for more info</Text>
          <Text style={styles.reviewNotesBannerText}>
            {verificationStatus.data.review_notes}
          </Text>
        </View>
      ) : (
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>✍️ Contribute to Huxley</Text>
          <Text style={styles.infoText}>
            Practitioners and integration guides can apply to contribute training scenarios that help Huxley respond more skillfully. All contributions are reviewed before going live and are attributed to the contributor — they do not represent the views of Alleviation Therapeutics.
          </Text>
        </View>
      )}

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>About You</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.full_name}
            onChangeText={(text) => setFormData({ ...formData, full_name: text })}
            placeholder="Your name (will appear on attributed contributions)"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Professional Background *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.professional_background}
            onChangeText={(text) => setFormData({ ...formData, professional_background: text })}
            placeholder="Your relevant training, credentials, and experience (e.g. LMFT, somatic experiencing practitioner, integration coach, lived-experience guide)"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Years of Experience</Text>
          <TextInput
            style={styles.input}
            value={formData.years_experience}
            onChangeText={(text) => setFormData({ ...formData, years_experience: text })}
            placeholder="5"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Areas of Focus</Text>
          <TextInput
            style={styles.input}
            value={formData.specializations}
            onChangeText={(text) => setFormData({ ...formData, specializations: text })}
            placeholder="Trauma, IFS, polyvagal, integration, etc. (comma-separated)"
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>What You'd Like to Contribute *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.contribution_focus}
            onChangeText={(text) => setFormData({ ...formData, contribution_focus: text })}
            placeholder="Briefly describe what you'd like to contribute and why it would help Huxley users"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Anything Else</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.additional_info}
            onChangeText={(text) => setFormData({ ...formData, additional_info: text })}
            placeholder="Optional. Links, references, or anything else you'd like us to know."
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <View style={styles.disclaimerSection}>
        <Text style={styles.disclaimerTitle}>📋 What Happens Next</Text>
        <Text style={styles.disclaimerText}>
          • We'll review your application and email you with a decision{"\n"}
          • If approved, you can submit training scenarios via Contributor Tools{"\n"}
          • Each contribution is reviewed by us before going live{"\n"}
          • Published content is attributed to you and carries a disclaimer that it reflects your perspective, not medical advice or the views of Alleviation Therapeutics
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting
            ? (isEditing ? '⏳ Updating...' : '⏳ Submitting...')
            : (isEditing ? 'Resubmit Application' : 'Submit Application')}
        </Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: 16,
    color: colors.primary,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  infoSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  statusContainer: {
    margin: 16,
    padding: 24,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  reviewNotes: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    fontStyle: 'italic',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
  },
  reviewNotesBanner: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fef9e7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  reviewNotesBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78350f',
    marginBottom: 6,
  },
  reviewNotesBannerText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
  formSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  disclaimerSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  submitButton: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  bottomPadding: {
    height: 32,
  },
};

export default ContributorApplicationScreen;