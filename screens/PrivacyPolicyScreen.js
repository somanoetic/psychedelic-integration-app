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

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: {LAST_UPDATED}</Text>

        <Paragraph>
          Huxley ("the App") is operated by Alleviation Therapeutics ("we", "us", "our"). We are committed to protecting the privacy and security of your personal information. This policy explains what data we collect, how we use it, and your rights.
        </Paragraph>

        <Paragraph>
          Given the deeply personal nature of psychedelic integration work, we hold ourselves to the highest standards of data privacy and treat all therapeutic data as sensitive health information.
        </Paragraph>

        {/* ---- 1. DATA WE COLLECT ---- */}
        <Section title="1. Information We Collect">
          <Text style={styles.subheading}>Account Information</Text>
          <BulletList items={[
            'Email address (used for authentication)',
            'Password (encrypted by our authentication provider; we never see or store your plaintext password)',
          ]} />

          <Text style={styles.subheading}>Therapeutic & Integration Data</Text>
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

        {/* ---- 2. HOW WE USE YOUR DATA ---- */}
        <Section title="2. How We Use Your Data">
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

        {/* ---- 3. AI PROCESSING ---- */}
        <Section title="3. AI Processing & Third-Party Data Sharing">
          <Paragraph>
            When you interact with Huxley (our AI guide) or other AI-powered features, your messages are sent to Anthropic (the company behind Claude) for processing. This is necessary to generate personalized responses.
          </Paragraph>

          <Text style={styles.subheading}>What is sent to Anthropic:</Text>
          <BulletList items={[
            'The text of your messages in AI conversations',
            'Relevant context from your recent interactions (to provide continuity)',
            'Your current nervous system state and session context (to tailor responses appropriately)',
          ]} />

          <Text style={styles.subheading}>What Anthropic does NOT receive:</Text>
          <BulletList items={[
            'Your email address or account credentials',
            'Your full journal or session history',
            'Any data beyond what is needed for the current conversation',
          ]} />

          <Paragraph>
            Anthropic's API usage policy states that data sent through their API is not used to train their models. For details, see Anthropic's privacy policy at anthropic.com/privacy.
          </Paragraph>
        </Section>

        {/* ---- 4. DATA STORAGE ---- */}
        <Section title="4. Where Your Data Is Stored">
          <BulletList items={[
            'Cloud database: Your account and therapeutic data are stored in our Supabase-hosted PostgreSQL database, encrypted at rest and in transit (TLS/SSL)',
            'Local device: Some data (preferences, cached conversations) is stored on your device using AsyncStorage',
            'For certain features (like intentions), you can choose to keep data local-only and not sync it to the cloud',
          ]} />
        </Section>

        {/* ---- 5. DATA SECURITY ---- */}
        <Section title="5. Data Security">
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

        {/* ---- 6. YOUR RIGHTS ---- */}
        <Section title="6. Your Rights">
          <Paragraph>
            You have the right to:
          </Paragraph>
          <BulletList items={[
            'Access your data — all your data is visible to you within the App',
            'Delete your data — you can delete individual entries (journals, intentions, sessions) at any time. Deleting your account removes all associated data',
            'Export your data — contact us to request a full export of your data',
            'Withdraw consent — you can stop using AI features or switch to local-only storage at any time',
            'Correct your data — you can edit any entries you\'ve created',
          ]} />
          <Paragraph>
            If you are in the European Economic Area (EEA), you have additional rights under GDPR including the right to data portability and the right to lodge a complaint with a supervisory authority.
          </Paragraph>
        </Section>

        {/* ---- 7. DATA RETENTION ---- */}
        <Section title="7. Data Retention">
          <BulletList items={[
            'Your therapeutic data is retained as long as your account is active',
            'AI usage metrics are automatically deleted after 90 days',
            'Deleting your account permanently removes all your data from our servers',
            'Some anonymized, aggregated statistics (e.g., total app usage counts) may be retained after account deletion as they cannot be linked back to you',
          ]} />
        </Section>

        {/* ---- 8. CHILDREN ---- */}
        <Section title="8. Age Requirement">
          <Paragraph>
            Huxley is intended for adults aged 18 and older. We do not knowingly collect data from anyone under 18. If you believe a minor has created an account, please contact us and we will delete the account.
          </Paragraph>
        </Section>

        {/* ---- 9. THIRD PARTIES ---- */}
        <Section title="9. Third-Party Services">
          <Paragraph>
            We use the following third-party services:
          </Paragraph>
          <BulletList items={[
            'Supabase — database hosting and authentication (supabase.com/privacy)',
            'Anthropic — AI language model processing (anthropic.com/privacy)',
          ]} />
          <Paragraph>
            We do not sell, rent, or share your personal data with any other third parties. We do not use analytics trackers, advertising networks, or social media SDKs.
          </Paragraph>
        </Section>

        {/* ---- 10. CHANGES ---- */}
        <Section title="10. Changes to This Policy">
          <Paragraph>
            We may update this policy from time to time. If we make material changes, we will notify you through the App before the changes take effect. Your continued use of the App after changes constitutes acceptance of the updated policy.
          </Paragraph>
        </Section>

        {/* ---- 11. CONTACT ---- */}
        <Section title="11. Contact Us">
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
