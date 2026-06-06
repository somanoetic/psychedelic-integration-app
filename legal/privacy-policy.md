# Privacy Policy

**Last updated: May 12, 2026**

Huxley ("the App") is operated by Alleviation Therapeutics ("we", "us", "our"). We are committed to protecting the privacy and security of your personal information. This policy explains what data we collect, how we use it, and your rights.

Huxley is a self-directed wellness and educational tool. The information you record in the App is personal wellness data — not a clinical record. Because of how personal that data is, we treat it with strong technical safeguards and minimal third-party sharing, and we are transparent about exactly what those safeguards are and aren't (see Section 1 below).

## 1. Not a HIPAA-Covered Service

Huxley is a consumer wellness and educational app. It is not a covered entity, business associate, or healthcare provider under the U.S. Health Insurance Portability and Accountability Act ("HIPAA"), and the data you record in the App is not Protected Health Information ("PHI") in the HIPAA sense.

- We do not deliver medical, psychiatric, or therapeutic treatment through the App
- We do not bill insurance and do not maintain a clinical chart for you
- No therapist or clinician sees your in-app content through Huxley — there is no provider portal, no client roster, and no in-app handoff to a treatment provider
- If you choose to share an Integration Summary with a therapist via the OS share sheet, that delivery happens entirely outside Huxley; whatever the therapist stores after receiving it is governed by their own privacy obligations, not ours

Your wellness data is still treated as sensitive personal information and protected by the safeguards described below — but we want you to know, before you decide what to record, that those protections come from our consumer privacy practices and applicable consumer privacy laws (such as CCPA and, where applicable, GDPR), not from HIPAA.

## 2. Information We Collect

### Account Information

- Email address (used for authentication)
- Password (encrypted by our authentication provider; we never see or store your plaintext password)

### Personal Wellness & Reflection Data

The core purpose of the App is to help you process and integrate experiences. When you use the App, you may choose to record:

- Journal entries and session reflections
- Intentions you set before sessions
- Nervous system state observations (polyvagal check-ins)
- Internal Family Systems (IFS) parts notes
- Trigger and glimmer logs
- Habit tracking and exercise completions
- Core beliefs assessments
- Active imagination session notes
- Conversations with Huxley, our AI integration guide

### Usage & Technical Data

- AI interaction metrics (response times, token counts, error rates) — used to maintain service quality
- These metrics are automatically deleted after 90 days
- We do not collect device IDs, advertising identifiers, location data, contacts, photos, or any other device sensors

## 3. How We Use Your Data

- To provide the App's core features: journaling, AI conversations, nervous system tracking, and integration tools
- To personalize your AI interactions — the App uses your past context (with your permission) to provide more relevant guidance
- To maintain and improve service quality through aggregated, anonymized usage metrics
- To authenticate your identity and secure your account

We do not use your data for advertising, profiling, or any purpose unrelated to providing you with integration support.

## 4. AI Processing & Third-Party Data Sharing

When you interact with Huxley (our AI guide) or other AI-powered features, your messages are sent to Anthropic (the company behind Claude) for processing. This is necessary to generate personalized responses.

### What is sent to Anthropic:

- The text of your messages in AI conversations
- Relevant context from your recent interactions (to provide continuity)
- Your current nervous system state and session context (to tailor responses appropriately)

### What Anthropic does NOT receive:

- Your email address or account credentials
- Your full journal or session history
- Any data beyond what is needed for the current conversation

Anthropic's API usage policy states that data sent through their API is not used to train their models. For details, see Anthropic's privacy policy at anthropic.com/privacy.

## 5. Where Your Data Is Stored

- Cloud database: Your account and wellness data are stored in our Supabase-hosted PostgreSQL database, encrypted at rest and in transit (TLS/SSL)
- Local device: Some data (preferences, cached conversations) is stored on your device using AsyncStorage
- For certain features (like intentions), you can choose to keep data local-only and not sync it to the cloud

## 6. Data Security

We implement the following security measures:

- Row-level security (RLS) on every database table — your data is isolated from other users at the database level
- All data transmitted over HTTPS/TLS encryption
- Authentication managed by Supabase Auth with industry-standard password hashing
- API keys and secrets stored server-side, not in the app
- Regular security audits of our codebase

No system is 100% secure. If you believe your account has been compromised, contact us immediately.

## 7. Your Rights

You have the right to:

- Access your data — all your data is visible to you within the App
- Delete your data — you can delete individual entries (journals, intentions, sessions) at any time. Deleting your account removes all associated data
- Export your data — contact us to request a full export of your data
- Withdraw consent — you can stop using AI features or switch to local-only storage at any time
- Correct your data — you can edit any entries you've created

If you are in the European Economic Area (EEA), you have additional rights under GDPR including the right to data portability and the right to lodge a complaint with a supervisory authority.

## 8. Data Retention

- Your wellness and reflection data is retained as long as your account is active
- AI usage metrics are automatically deleted after 90 days
- Deleting your account permanently removes all your data from our servers
- Some anonymized, aggregated statistics (e.g., total app usage counts) may be retained after account deletion as they cannot be linked back to you

## 9. Age Requirement

Huxley is intended for adults aged 18 and older. We do not knowingly collect data from anyone under 18. If you believe a minor has created an account, please contact us and we will delete the account.

## 10. Third-Party Services

We use the following third-party services:

- Supabase — database hosting and authentication (supabase.com/privacy)
- Anthropic — AI language model processing (anthropic.com/privacy)

We do not sell, rent, or share your personal data with any other third parties. We do not use analytics trackers, advertising networks, or social media SDKs.

## 11. Changes to This Policy

We may update this policy from time to time. If we make material changes, we will notify you through the App before the changes take effect. Your continued use of the App after changes constitutes acceptance of the updated policy.

## 12. Contact Us

If you have questions about this privacy policy or your data, contact us at:

Alleviation Therapeutics
Email: privacy@somanoetic.com
