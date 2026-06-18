import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Info } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, gradients, spacing, borderRadius, typography } from '../theme/colors';

// Bumped if the disclosure copy is materially updated, so previously-acknowledging
// users see it again. Read by App.js before rendering main app routes.
export const DISCLOSURE_VERSION = 'v1';
export const DISCLOSURE_STORAGE_KEY = `huxley:disclosure_acknowledged_${DISCLOSURE_VERSION}`;
export const PRACTITIONER_FLAG_KEY = 'huxley:is_practitioner';

const NonClinicalDisclosureScreen = ({ onAcknowledge }) => {
  const [practitionerAnswer, setPractitionerAnswer] = useState(null); // null | true | false
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = practitionerAnswer !== null && !submitting;

  const handleAcknowledge = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await AsyncStorage.multiSet([
        [DISCLOSURE_STORAGE_KEY, 'true'],
        [PRACTITIONER_FLAG_KEY, practitionerAnswer ? 'true' : 'false'],
      ]);
      onAcknowledge();
    } catch (error) {
      console.error('Error persisting disclosure acknowledgement:', error);
      // Continue anyway — blocking the user behind a storage failure is worse
      // than a missed flag. Sentry will capture it via the global handler.
      onAcknowledge();
    }
  };

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.iconWrap}>
            <Info size={40} color={colors.primary} strokeWidth={2} />
          </View>

          <Text style={styles.title}>Before you begin</Text>

          <Text style={styles.subtitle}>
            A few things to know about what Multitudes is — and what it isn't.
          </Text>

          {/* ---- Wellness, not clinical ---- */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Multitudes is a wellness tool, not a clinical service</Text>
            <Text style={styles.cardBody}>
              Multitudes is a self-directed companion for personal reflection and integration. It is not therapy, not psychiatric care, and not a substitute for professional mental-health support.
            </Text>
            <Text style={styles.cardBody}>
              The AI guide is a reflection companion — not a therapist or clinician. It cannot diagnose you, treat you, or tell you what to do about a medical or mental-health concern. Always work with qualified professionals for clinical care.
            </Text>
          </View>

          {/* ---- Not HIPAA-covered ---- */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Multitudes is not HIPAA-covered</Text>
            <Text style={styles.cardBody}>
              We are not a healthcare provider, covered entity, or business associate under HIPAA. The information you record in Multitudes is your personal wellness data, not a clinical record.
            </Text>
            <Text style={styles.cardBody}>
              We protect your data with strong technical safeguards (encryption in transit and at rest, row-level isolation, no third-party advertising) under standard consumer privacy practices and applicable privacy laws (CCPA and, where applicable, GDPR) — not under HIPAA. See the Privacy Policy for the full picture.
            </Text>
          </View>

          {/* ---- In a crisis ---- */}
          <View style={[styles.card, styles.crisisCard]}>
            <Text style={styles.cardTitle}>If you are in crisis</Text>
            <Text style={styles.cardBody}>
              Multitudes is not an emergency service. If you are in crisis or having thoughts of harming yourself, please contact emergency services (911) or the 988 Suicide & Crisis Lifeline immediately.
            </Text>
          </View>

          {/* ---- Practitioner question ---- */}
          <View style={styles.questionCard}>
            <Text style={styles.cardTitle}>Are you a healthcare practitioner?</Text>
            <Text style={styles.questionHelper}>
              (e.g., therapist, counselor, physician, nurse, social worker)
            </Text>

            <View style={styles.choiceRow}>
              <TouchableOpacity
                style={[
                  styles.choice,
                  practitionerAnswer === false && styles.choiceSelected,
                ]}
                onPress={() => setPractitionerAnswer(false)}
                accessibilityRole="radio"
                accessibilityState={{ checked: practitionerAnswer === false }}
              >
                <Text
                  style={[
                    styles.choiceText,
                    practitionerAnswer === false && styles.choiceTextSelected,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.choice,
                  practitionerAnswer === true && styles.choiceSelected,
                ]}
                onPress={() => setPractitionerAnswer(true)}
                accessibilityRole="radio"
                accessibilityState={{ checked: practitionerAnswer === true }}
              >
                <Text
                  style={[
                    styles.choiceText,
                    practitionerAnswer === true && styles.choiceTextSelected,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
            </View>

            {practitionerAnswer === true && (
              <View style={styles.practitionerNote}>
                <Text style={styles.practitionerNoteTitle}>For practitioners</Text>
                <Text style={styles.cardBody}>
                  You can use Multitudes for your own personal reflection and you can recommend it to clients as self-directed support outside of session, with their consent.
                </Text>
                <Text style={styles.cardBody}>
                  You cannot use Multitudes to receive client data into a HIPAA-covered record, to assign or track client homework, or to deliver care to a specific identified client through the app. There is no in-app provider portal or client roster, and we do not provide a Business Associate Agreement.
                </Text>
                <Text style={styles.cardBody}>
                  If a client shares an Integration Summary with you via the OS share sheet (e.g., email, Messages), Multitudes plays no part in that delivery, and what you do with the summary after receiving it is governed by your own clinical privacy obligations.
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.footerNote}>
            By continuing, you confirm you have read and understood the above. You can review the full Privacy Policy and Terms of Service from Settings at any time.
          </Text>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleAcknowledge}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
          >
            <Text style={styles.buttonText}>I understand</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.xxl,
    fontWeight: '700',
    color: colors.deepEarth,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.slate,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: typography.base * typography.relaxed,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  crisisCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  cardTitle: {
    fontSize: typography.base,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardBody: {
    fontSize: typography.sm,
    color: colors.text,
    lineHeight: typography.sm * typography.relaxed,
    marginBottom: spacing.sm,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  questionHelper: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  choiceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  choice: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.lightGray,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  choiceSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  choiceText: {
    fontSize: typography.base,
    fontWeight: '600',
    color: colors.text,
  },
  choiceTextSelected: {
    color: colors.white,
  },
  practitionerNote: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bubbleArchetypal,
    borderRadius: borderRadius.sm,
  },
  practitionerNoteTitle: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.deepEarth,
    marginBottom: spacing.sm,
  },
  footerNote: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    lineHeight: typography.xs * typography.relaxed,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default NonClinicalDisclosureScreen;
