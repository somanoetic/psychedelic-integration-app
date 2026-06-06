// Shared source of truth for the currently published Terms of Service /
// Privacy Policy version. Bump TOS_VERSION whenever the substantive text
// of either document changes — the value is persisted to user_profiles
// at signup so we have an audit trail of which version each user accepted.
//
// Format: ISO date (YYYY-MM-DD) of the publication. Matches the
// "Last updated" line shown on the in-app legal screens.

export const TOS_VERSION = '2026-05-12';

// Display string for "Last updated:" lines in TermsOfServiceScreen /
// PrivacyPolicyScreen. Kept here so the version and display string stay in
// lockstep — change them together when publishing new terms.
export const TOS_LAST_UPDATED_DISPLAY = 'May 12, 2026';
