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

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: {LAST_UPDATED}</Text>

        <Paragraph>
          Multitudes ("the App") is operated by Alleviation Therapeutics ("we", "us", "our"). We are committed to protecting the privacy and security of your personal information. This policy explains what data we collect, how we use it, and your rights. "Huxley" refers to the AI reflection guide within the App.
        </Paragraph>

        <Paragraph>
          Multitudes is a self-directed wellness and educational tool. The information you record in the App is personal wellness data — not a clinical record. Because of how personal that data is, we treat it with strong technical safeguards and minimal third-party sharing, and we are transparent about exactly what those safeguards are and aren't (see Section 2 below).
        </Paragraph>

        {/* ---- NOT A HIPAA-COVERED SERVICE ---- */}
        <Section title="1. Not a HIPAA-Covered Service">
          <Paragraph>
            Multitudes is a consumer wellness and educational app. It is not a covered entity, business associate, or healthcare provider under the U.S. Health Insurance Portability and Accountability Act ("HIPAA"), and the data you record in the App is not Protected Health Information ("PHI") in the HIPAA sense.
          </Paragraph>
          <BulletList items={[
            'We do not deliver medical, psychiatric, or therapeutic treatment through the App',
            'We do not bill insurance and do not maintain a clinical chart for you',
            'No therapist or clinician sees your in-app content through Multitudes — there is no provider portal, no client roster, and no in-app handoff to a treatment provider',
            'If you choose to share an Integration Summary with a therapist via the OS share sheet, that delivery happens entirely outside Multitudes; whatever the therapist stores after receiving it is governed by their own privacy obligations, not ours',
          ]} />
          <Paragraph>
            Your wellness data is still treated as sensitive personal information and protected by the safeguards described below — but we want you to know, before you decide what to record, that those protections come from our consumer privacy practices and applicable consumer privacy laws (such as CCPA and, where applicable, GDPR), not from HIPAA.
          </Paragraph>
        </Section>

        {/* ---- 2. DATA WE COLLECT ---- */}
        <Section title="2. Information We Collect">
          <Text style={styles.subheading}>Account Information</Text>
          <BulletList items={[
            'Email address (used for authentication)',
            'Password (encrypted by our authentication provider; we never see or store your plaintext password)',
          ]} />

          <Text style={styles.subheading}>Personal Wellness & Reflection Data</Text>
          <Paragraph>
            The core purpose of the App is to help you process and integrate experiences. When you use the App, you may choose to record:
          </Paragraph>
          <BulletList items={[
            'Journal entries and session reflections',
            'Intentions you set before sessions',
            'Nervous system state observations (polyvagal check-ins)',
            'Internal Family Systems (IFS) parts notes',
            'Trigger and glimmer logs',
            'Habit tracking and exercise completions',
            'Core beliefs assessments',
            'Active imagination session notes',
            'Conversations with Huxley, our AI integration guide',
          ]} />

          <Text style={styles.subheading}>Usage & Technical Data</Text>
          <BulletList items={[
            'AI interaction metrics (response times, token counts, error rates) — used to maintain service quality',
            'These metrics are automatically deleted after 90 days',
            'We do not collect device IDs, advertising identifiers, location data, contacts, photos, or any other device sensors',
          ]} />
        </Section>

        {/* ---- 3. HOW WE USE YOUR DATA ---- */}
        <Section title="3. How We Use Your Data">
          <BulletList items={[
            'To provide the App\'s core features: journaling, AI conversations, nervous system tracking, and integration tools',
            'To personalize your AI interactions — the App uses your past context (with your permission) to provide more relevant guidance',
            'To maintain and improve service quality through aggregated, anonymized usage metrics',
            'To authenticate your identity and secure your account',
          ]} />
          <Paragraph>
            We do not use your data for advertising, profiling, or any purpose unrelated to providing you with integration support.
          </Paragraph>
        </Section>

        {/* ---- 4. AI PROCESSING ---- */}
        <Section title="4. AI Processing & Third-Party Data Sharing">
          <Paragraph>
            Some App features rely on third-party artificial-intelligence providers. To deliver these features, certain text you enter is transmitted to those providers for processing. We send only what is needed to perform the requested function, and we never send your account credentials or your full journal/session history.
          </Paragraph>

          <Text style={styles.subheading}>Anthropic (AI conversation):</Text>
          <Paragraph>
            When you interact with Huxley (our AI guide) or other conversational AI features, your messages are sent to Anthropic (the company behind Claude) to generate responses. What is sent:
          </Paragraph>
          <BulletList items={[
            'The text of your messages in AI conversations',
            'Relevant context from your recent interactions (to provide continuity)',
            'Your current nervous system state and session context (to tailor responses appropriately)',
          ]} />
          <Paragraph>
            Anthropic's commercial API terms state that data sent through their API is not used to train their models. For details, see Anthropic's privacy policy at anthropic.com/privacy.
          </Paragraph>

          <Text style={styles.subheading}>OpenAI (knowledge-base search):</Text>
          <Paragraph>
            When an AI feature looks up relevant educational material from our knowledge base, the text of your query (for example, the message or topic you are asking about) is sent to OpenAI to convert it into a numeric search vector. This is used only to find related content; OpenAI does not receive your journal, your conversation history, or your account information. OpenAI's API terms state that data sent through their API is not used to train their models. For details, see openai.com/policies/privacy-policy.
          </Paragraph>

          <Text style={styles.subheading}>What AI providers do NOT receive:</Text>
          <BulletList items={[
            'Your email address or account credentials',
            'Your full journal or session history',
            'Any data beyond what is needed for the specific request',
          ]} />
        </Section>

        {/* ---- 5. DATA STORAGE ---- */}
        <Section title="5. Where Your Data Is Stored">
          <BulletList items={[
            'Cloud database: Your account and wellness data are stored in our Supabase-hosted PostgreSQL database, encrypted at rest and in transit (TLS/SSL)',
            'Local device: Some data (preferences, cached conversations) is stored on your device using AsyncStorage',
            'For certain features (like intentions), you can choose to keep data local-only and not sync it to the cloud',
          ]} />
        </Section>

        {/* ---- 6. DATA SECURITY ---- */}
        <Section title="6. Data Security">
          <Paragraph>
            We implement the following security measures:
          </Paragraph>
          <BulletList items={[
            'Row-level security (RLS) on every database table — your data is isolated from other users at the database level',
            'All data transmitted over HTTPS/TLS encryption',
            'Authentication managed by Supabase Auth with industry-standard password hashing',
            'API keys and secrets stored server-side, not in the app',
            'Regular security audits of our codebase',
          ]} />
          <Paragraph>
            No system is 100% secure. If you believe your account has been compromised, contact us immediately.
          </Paragraph>
        </Section>

        {/* ---- 7. YOUR RIGHTS ---- */}
        <Section title="7. Your Rights">
          <Paragraph>
            You have the right to:
          </Paragraph>
          <BulletList items={[
            'Access your data — all your data is visible to you within the App',
            'Export your data — you can export a full copy of your data yourself at any time from Settings → Export My Data, which produces a JSON file you can save or share',
            'Delete your data — you can delete individual entries (journals, intentions, sessions) at any time. You can also delete your entire account from within the App, which permanently removes all associated data from our servers',
            'Withdraw consent — you can stop using AI features or switch to local-only storage at any time',
            'Correct your data — you can edit any entries you\'ve created',
          ]} />
          <Paragraph>
            If you are in the European Economic Area (EEA), you have additional rights under GDPR including the right to data portability and the right to lodge a complaint with a supervisory authority.
          </Paragraph>
        </Section>

        {/* ---- 8. CONSUMER HEALTH DATA (WA MHMDA / STATE LAWS) ---- */}
        <Section title="8. Consumer Health Data & State Privacy Rights">
          <Paragraph>
            Some of the information you choose to record in the App — such as nervous-system check-ins, reflections on mental and emotional states, and notes related to wellness experiences — may be considered "consumer health data" under certain U.S. state laws, including Washington's My Health My Data Act (MHMDA), Nevada's SB 370, and similar laws. We want to be clear about how we handle it:
          </Paragraph>
          <BulletList items={[
            'We collect this data only because you choose to enter it, in order to provide the App\'s reflection and tracking features to you',
            'We do not sell consumer health data, and we have no plans to. We will not sell it without first obtaining your separate, explicit consent as required by law',
            'We do not use consumer health data for advertising, and we do not share it with data brokers',
            'We share it only with the service providers listed in Section 10, who process it solely to operate the App on our behalf',
            'You may withdraw your consent to our collection of this data by deleting the relevant entries or your account, and you may request access to or deletion of this data as described in Section 7',
          ]} />
          <Paragraph>
            To exercise any consumer-health-data right, or if you have questions specific to these state laws, contact us at privacy@somanoetic.com. If you are a Washington resident and believe we have not honored your rights under MHMDA, you may also contact the Washington State Attorney General.
          </Paragraph>
        </Section>

        {/* ---- 9. DATA RETENTION ---- */}
        <Section title="9. Data Retention">
          <BulletList items={[
            'Your wellness and reflection data is retained as long as your account is active',
            'AI usage metrics are automatically deleted after 90 days',
            'Deleting your account permanently removes all your data from our servers',
            'Some anonymized, aggregated statistics (e.g., total app usage counts) may be retained after account deletion as they cannot be linked back to you',
          ]} />
        </Section>

        {/* ---- 10. CHILDREN ---- */}
        <Section title="10. Age Requirement">
          <Paragraph>
            Multitudes is intended for adults aged 18 and older. We do not knowingly collect data from anyone under 18. If you believe a minor has created an account, please contact us and we will delete the account.
          </Paragraph>
        </Section>

        {/* ---- 11. THIRD PARTIES ---- */}
        <Section title="11. Third-Party Services">
          <Paragraph>
            We use the following third-party services:
          </Paragraph>
          <BulletList items={[
            'Supabase — database hosting and authentication (supabase.com/privacy)',
            'Anthropic — AI language model processing for conversations (anthropic.com/privacy)',
            'OpenAI — converts your search queries into vectors for knowledge-base search (openai.com/policies/privacy-policy)',
            'Sentry — crash and error reporting, so we can detect and fix problems. Configured to scrub personal information from error reports; it does not receive your journal, conversations, or account credentials (sentry.io/privacy)',
          ]} />
          <Paragraph>
            We do not sell or rent your personal data, and we do not share it with any third parties other than the service providers listed above, who process it only to provide the App to you. We do not use advertising networks or social media SDKs.
          </Paragraph>
        </Section>

        {/* ---- 12. CHANGES ---- */}
        <Section title="12. Changes to This Policy">
          <Paragraph>
            We may update this policy from time to time. If we make material changes, we will notify you through the App before the changes take effect. Your continued use of the App after changes constitutes acceptance of the updated policy.
          </Paragraph>
        </Section>

        {/* ---- 13. CONTACT ---- */}
        <Section title="13. Contact Us">
          <Paragraph>
            If you have questions about this privacy policy or your data, contact us at:
          </Paragraph>
          <Paragraph>
            Alleviation Therapeutics{'\n'}
            Email: privacy@somanoetic.com
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

export default PrivacyPolicyScreen;
