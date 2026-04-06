import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme/colors';

const LAST_UPDATED = 'April 1, 2026';

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Paragraph = ({ children }) => (
  <Text style={styles.paragraph}>{children}</Text>
);

const BulletList = ({ items }) => (
  <View style={styles.bulletList}>
    {items.map((item, i) => (
      <View key={i} style={styles.bulletRow}>
        <Text style={styles.bullet}>{'\u2022'}</Text>
        <Text style={styles.bulletText}>{item}</Text>
      </View>
    ))}
  </View>
);

const TermsOfServiceScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: {LAST_UPDATED}</Text>

        <Paragraph>
          Welcome to Psycheteleos. By creating an account or using the App, you agree to these Terms of Service ("Terms"). Please read them carefully.
        </Paragraph>

        {/* ---- 1. ABOUT THE APP ---- */}
        <Section title="1. About Psycheteleos">
          <Paragraph>
            Psycheteleos is a personal integration tool designed to help individuals process and integrate transformative experiences into daily life. The App provides journaling, AI-guided reflection, nervous system tracking, and educational resources.
          </Paragraph>
        </Section>

        {/* ---- 2. NOT MEDICAL ADVICE ---- */}
        <Section title="2. Not Medical or Therapeutic Advice">
          <Paragraph>
            This is the most important section of these Terms:
          </Paragraph>
          <BulletList items={[
            'Psycheteleos is NOT a substitute for professional medical, psychiatric, or therapeutic care',
            'The AI guide (Huxley) is a supportive tool, not a therapist. It cannot diagnose, treat, or provide clinical recommendations',
            'Content in the App (exercises, educational material, AI responses) is for informational and personal reflection purposes only',
            'If you are in crisis or experiencing a mental health emergency, contact emergency services (911) or the 988 Suicide & Crisis Lifeline immediately',
            'Always consult qualified healthcare professionals for medical or mental health concerns',
          ]} />
          <Paragraph>
            By using the App, you acknowledge that you understand these limitations and that you are not relying on the App as a replacement for professional care.
          </Paragraph>
        </Section>

        {/* ---- 3. ELIGIBILITY ---- */}
        <Section title="3. Eligibility">
          <BulletList items={[
            'You must be at least 18 years old to use the App',
            'By creating an account, you represent that you are at least 18',
            'We reserve the right to terminate accounts that we believe belong to minors',
          ]} />
        </Section>

        {/* ---- 4. YOUR ACCOUNT ---- */}
        <Section title="4. Your Account">
          <BulletList items={[
            'You are responsible for maintaining the security of your account credentials',
            'You are responsible for all activity that occurs under your account',
            'Notify us immediately if you suspect unauthorized access to your account',
            'We reserve the right to suspend or terminate accounts that violate these Terms',
          ]} />
        </Section>

        {/* ---- 5. YOUR CONTENT ---- */}
        <Section title="5. Your Content">
          <Paragraph>
            You retain full ownership of all content you create in the App (journal entries, reflections, intentions, etc.). We do not claim any intellectual property rights over your content.
          </Paragraph>
          <BulletList items={[
            'You grant us a limited license to store, process, and display your content to you within the App',
            'You grant us permission to send your messages to our AI provider (Anthropic) for the purpose of generating responses',
            'We will never share, publish, or sell your content to third parties',
            'You can delete your content at any time',
          ]} />
        </Section>

        {/* ---- 6. ACCEPTABLE USE ---- */}
        <Section title="6. Acceptable Use">
          <Paragraph>
            You agree not to:
          </Paragraph>
          <BulletList items={[
            'Use the App to harm yourself or others',
            'Attempt to extract, reverse-engineer, or exploit the AI system',
            'Share your account credentials with others',
            'Use the App for any unlawful purpose',
            'Attempt to access other users\' data',
            'Interfere with the App\'s operation or security',
          ]} />
        </Section>

        {/* ---- 7. AI FEATURES ---- */}
        <Section title="7. AI Features & Limitations">
          <BulletList items={[
            'AI responses are generated by language models and may occasionally be inaccurate, unhelpful, or inappropriate',
            'AI responses do not represent the views or recommendations of Alleviation Therapeutics',
            'The AI does not have memory between separate sessions unless you have enabled context features',
            'We continuously work to improve AI safety, but no AI system is perfect',
            'If you receive a concerning AI response, please report it to us',
          ]} />
        </Section>

        {/* ---- 8. INTELLECTUAL PROPERTY ---- */}
        <Section title="8. Intellectual Property">
          <Paragraph>
            The App, including its design, code, exercises, educational content, and AI prompts, is owned by Alleviation Therapeutics and protected by copyright and other intellectual property laws. You may not copy, modify, distribute, or create derivative works from the App without our written permission.
          </Paragraph>
        </Section>

        {/* ---- 9. AVAILABILITY ---- */}
        <Section title="9. Service Availability">
          <BulletList items={[
            'We strive to keep the App available at all times, but we do not guarantee uninterrupted service',
            'AI features depend on third-party services (Anthropic) and may be temporarily unavailable',
            'We may modify, suspend, or discontinue features with reasonable notice',
            'We are not liable for any loss or inconvenience caused by downtime',
          ]} />
        </Section>

        {/* ---- 10. LIMITATION OF LIABILITY ---- */}
        <Section title="10. Limitation of Liability">
          <Paragraph>
            To the maximum extent permitted by law:
          </Paragraph>
          <BulletList items={[
            'The App is provided "as is" without warranties of any kind, express or implied',
            'We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the App',
            'We are not responsible for decisions you make based on information provided by the App or its AI features',
            'Our total liability to you shall not exceed the amount you have paid for the App in the 12 months preceding the claim',
          ]} />
        </Section>

        {/* ---- 11. HARM REDUCTION ---- */}
        <Section title="11. Harm Reduction Commitment">
          <Paragraph>
            Psycheteleos is built on principles of harm reduction, informed consent, and personal agency. We believe:
          </Paragraph>
          <BulletList items={[
            'Individuals have the right to make informed choices about their own experiences',
            'Integration support should be accessible, non-judgmental, and evidence-informed',
            'Professional help should always be available and encouraged',
            'Privacy is foundational to the therapeutic process',
          ]} />
          <Paragraph>
            The App does not encourage, facilitate, or provide guidance for obtaining or using any controlled substances. It exists solely to support the integration of experiences that have already occurred.
          </Paragraph>
        </Section>

        {/* ---- 12. CHANGES ---- */}
        <Section title="12. Changes to These Terms">
          <Paragraph>
            We may update these Terms from time to time. If we make material changes, we will notify you through the App. Your continued use after changes take effect constitutes acceptance of the updated Terms.
          </Paragraph>
        </Section>

        {/* ---- 13. GOVERNING LAW ---- */}
        <Section title="13. Governing Law">
          <Paragraph>
            These Terms are governed by the laws of the state in which Alleviation Therapeutics is incorporated, without regard to conflict of law provisions.
          </Paragraph>
        </Section>

        {/* ---- 14. CONTACT ---- */}
        <Section title="14. Contact Us">
          <Paragraph>
            If you have questions about these Terms, contact us at:
          </Paragraph>
          <Paragraph>
            Alleviation Therapeutics{'\n'}
            Email: legal@alleviationtherapeutics.com
          </Paragraph>
        </Section>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.text,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  lastUpdated: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subheading: {
    fontSize: typography.base,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontSize: typography.sm,
    color: colors.text,
    lineHeight: typography.sm * typography.relaxed,
    marginBottom: spacing.sm,
  },
  bulletList: {
    marginBottom: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    paddingLeft: spacing.sm,
    marginBottom: spacing.xs,
  },
  bullet: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginRight: spacing.sm,
    lineHeight: typography.sm * typography.relaxed,
  },
  bulletText: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.text,
    lineHeight: typography.sm * typography.relaxed,
  },
  footer: {
    height: spacing.xxl,
  },
});

export default TermsOfServiceScreen;
