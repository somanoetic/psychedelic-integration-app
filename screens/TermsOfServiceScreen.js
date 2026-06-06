import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import { TOS_LAST_UPDATED_DISPLAY } from '../lib/legal/tosVersion';

const LAST_UPDATED = TOS_LAST_UPDATED_DISPLAY;

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
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: {LAST_UPDATED}</Text>

        <Paragraph>
          Welcome to Huxley. By creating an account or using the App, you agree to these Terms of Service ("Terms"). Please read them carefully.
        </Paragraph>

        {/* ---- 1. ABOUT THE APP ---- */}
        <Section title="1. About Huxley">
          <Paragraph>
            Huxley is a self-directed wellness and educational tool designed to help individuals process and integrate transformative experiences into daily life. The App provides journaling, AI-guided reflection, nervous system tracking, and educational resources.
          </Paragraph>
          <Paragraph>
            Huxley is a consumer wellness product. It is not a healthcare service, and using it does not create a clinician–patient relationship between you and Alleviation Therapeutics or anyone associated with the App.
          </Paragraph>
        </Section>

        {/* ---- 2. NOT MEDICAL ADVICE ---- */}
        <Section title="2. Not Medical, Psychiatric, or Therapeutic Care">
          <Paragraph>
            This is the most important section of these Terms:
          </Paragraph>
          <BulletList items={[
            'Huxley is NOT a substitute for professional medical, psychiatric, or therapeutic care',
            'The AI guide (Huxley) is a reflection companion, not a therapist or clinician. It cannot diagnose, treat, prescribe, or provide clinical recommendations, and nothing it says should be acted on as medical or mental-health advice',
            'Content in the App (exercises, educational material, AI responses, contributor submissions) is for informational, educational, and personal reflection purposes only',
            'Huxley does not create, store, or transmit a clinical record. Information you record in the App is your own personal wellness data — not a medical chart',
            'If you are in crisis or experiencing a mental health emergency, contact emergency services (911) or the 988 Suicide & Crisis Lifeline immediately',
            'Always consult qualified healthcare professionals for medical or mental health concerns',
          ]} />
          <Paragraph>
            By using the App, you acknowledge that you understand these limitations and that you are not relying on the App as a replacement for professional care.
          </Paragraph>
        </Section>

        {/* ---- 3. NOT A HIPAA-COVERED SERVICE ---- */}
        <Section title="3. Not a HIPAA-Covered Service">
          <Paragraph>
            Huxley is a consumer wellness app, not a healthcare service. We are not a covered entity, business associate, or healthcare provider under the U.S. Health Insurance Portability and Accountability Act ("HIPAA"), and the data you record in the App is not Protected Health Information ("PHI") in the HIPAA sense.
          </Paragraph>
          <BulletList items={[
            'No therapist or clinician sees your in-app content through Huxley — there is no provider portal, no client roster, no in-app handoff to a treatment provider, and no in-app assignment of work from a clinician to a client',
            'If you choose to share an Integration Summary with a therapist via the OS share sheet, that delivery happens outside Huxley; what the therapist does with it after they receive it is governed by their own privacy and recordkeeping obligations, not ours',
            'If a Huxley contributor or contributor-submitted exercise mentions clinical concepts, this is general educational content — not personalized clinical advice and not delivered to you in the course of treatment',
          ]} />
          <Paragraph>
            We treat your wellness data as sensitive personal information and protect it with the technical safeguards described in our Privacy Policy. Those protections come from our consumer privacy practices and applicable consumer privacy laws (such as CCPA and, where applicable, GDPR), not from HIPAA.
          </Paragraph>
        </Section>

        {/* ---- 4. ELIGIBILITY ---- */}
        <Section title="4. Eligibility">
          <BulletList items={[
            'You must be at least 18 years old to use the App. The App is not intended for or directed to individuals under the age of 18, and Alleviation Therapeutics does not knowingly collect personal information from minors. If Alleviation Therapeutics becomes aware that a user is under 18, it will take immediate steps to terminate the account and delete all personal information in accordance with its data retention policy and applicable law.',
            'By creating an account, you represent that you are at least 18',
            'We reserve the right to terminate accounts that we believe belong to minors',
          ]} />
        </Section>

        {/* ---- 5. YOUR ACCOUNT ---- */}
        <Section title="5. Your Account">
          <BulletList items={[
            'You are responsible for maintaining the security of your account credentials',
            'You are responsible for all activity that occurs under your account',
            'Notify us immediately if you suspect unauthorized access to your account',
            'We reserve the right to suspend or terminate accounts that violate these Terms',
          ]} />
        </Section>

        {/* ---- 6. YOUR CONTENT ---- */}
        <Section title="6. Your Content">
          <Paragraph>
            You retain full ownership of all content you create in the App (journal entries, reflections, intentions, etc.). We do not claim any intellectual property rights over your content.
          </Paragraph>
          <BulletList items={[
            'You grant us a limited license to store, process, and display your content to you within the App',
            'You grant us permission to send your messages to our AI provider (Anthropic) for the purpose of generating responses. We ensure through our contractual agreements with such providers that your content is used solely to provide the service to you and is not used to train or improve the provider\'s own artificial intelligence models. We will never share, publish, or sell your content to third parties',
            'You can delete your content at any time',
          ]} />
        </Section>

        {/* ---- 7. ACCEPTABLE USE ---- */}
        <Section title="7. Acceptable Use">
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

        {/* ---- 8. AI FEATURES ---- */}
        <Section title="8. AI Features & Limitations">
          <BulletList items={[
            'AI responses are generated by automated language models without human review; they are provided for informational purposes only and may be inaccurate, unhelpful, or inappropriate. The AI does not possess clinical judgment and is not a substitute for professional medical advice. You are responsible for evaluating and independently verifying the accuracy and suitability of all AI-generated content. AI responses do not represent the views or recommendations of Alleviation Therapeutics',
            'The AI does not have memory between separate sessions unless you have enabled context features. When enabled, your session data is processed and stored using industry-standard security protocols and privacy-preserving techniques to ensure the safety and confidentiality of your information in accordance with our Privacy Policy and applicable federal AI safety frameworks.',
            'We continuously work to improve AI safety, but no AI system is perfect',
            'If you receive a concerning AI response, please report it to us',
          ]} />
        </Section>

        {/* ---- 9. INTELLECTUAL PROPERTY ---- */}
        <Section title="9. Intellectual Property">
          <Paragraph>
            The App, including its design, code, exercises, educational content, and AI prompts, is owned by Alleviation Therapeutics and protected by copyright and other intellectual property laws. You may not copy, modify, distribute, or create derivative works from the App without our written permission.
          </Paragraph>
        </Section>

        {/* ---- 10. AVAILABILITY ---- */}
        <Section title="10. Service Availability">
          <BulletList items={[
            'We strive to keep the App available at all times, but we do not guarantee uninterrupted service',
            'AI features depend on third-party services (Anthropic) and may be temporarily unavailable',
            'We may modify, suspend, or discontinue features with reasonable notice',
            'We are not liable for any loss or inconvenience caused by downtime',
          ]} />
        </Section>

        {/* ---- 11. LIMITATION OF LIABILITY ---- */}
        <Section title="11. Limitation of Liability">
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

        {/* ---- 12. HARM REDUCTION ---- */}
        <Section title="12. Harm Reduction Commitment">
          <Paragraph>
            Huxley is built on principles of harm reduction, informed consent, and personal agency. We believe:
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

        {/* ---- 13. CHANGES ---- */}
        <Section title="13. Changes to These Terms">
          <Paragraph>
            We may update these Terms from time to time. If we make material changes, we will notify you through the App. Your continued use after changes take effect constitutes acceptance of the updated Terms.
          </Paragraph>
        </Section>

        {/* ---- 14. GOVERNING LAW ---- */}
        <Section title="14. Governing Law">
          <Paragraph>
            These Terms are governed by the laws of the state in which Alleviation Therapeutics is incorporated, without regard to conflict of law provisions.
          </Paragraph>
        </Section>

        {/* ---- 15. CONTACT ---- */}
        <Section title="15. Contact Us">
          <Paragraph>
            If you have questions about these Terms, contact us at:
          </Paragraph>
          <Paragraph>
            Alleviation Therapeutics{'\n'}
            Email: legal@somanoetic.com
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
