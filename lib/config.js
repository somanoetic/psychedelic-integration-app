/**
 * Configuration Service
 *
 * Loads configuration from Expo Constants (app.config.js -> extra).
 * Secrets are injected at build time from environment variables.
 *
 * SECURITY NOTE:
 * - Anthropic API key is NO LONGER client-side — all AI calls go through
 *   the Supabase Edge Function proxy (claudeProxyService.js / claudeAPI.js)
 * - Set the API key as a Supabase secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 * - Only Supabase credentials are needed on the client
 *
 * For EAS builds, set secrets in eas.json or via `eas secret:create`.
 * For local development, use a .env file (excluded from git via .gitignore).
 */
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const config = {
  supabaseUrl: extra.supabaseUrl || '',
  supabaseAnonKey: extra.supabaseAnonKey || '',
  sentryDsn: extra.sentryDsn || '',
};

// Validate that required config values are present (non-fatal warning)
if (__DEV__) {
  const missing = [];
  if (!config.supabaseUrl) missing.push('SUPABASE_URL');
  if (!config.supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
  if (!config.sentryDsn) missing.push('SENTRY_DSN');

  if (missing.length > 0) {
    console.warn(
      `[Config] Missing environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in your values.'
    );
  }
}

export default config;
