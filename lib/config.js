/**
 * Configuration Service
 *
 * Loads configuration from Expo Constants (app.config.js -> extra).
 * Secrets are injected at build time from environment variables.
 *
 * SECURITY NOTE:
 * - API key is loaded from .env (gitignored) via process.env at build time
 * - Never hardcode keys in source code
 * - For production, migrate to Supabase Edge Function proxy (claudeProxyService.js)
 *
 * For EAS builds, set secrets in eas.json or via `eas secret:create`.
 * For local development, use a .env file (excluded from git via .gitignore).
 */
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const config = {
  supabaseUrl: extra.supabaseUrl || '',
  supabaseAnonKey: extra.supabaseAnonKey || '',
  anthropicApiKey: extra.anthropicApiKey || '',
};

// Validate that required config values are present (non-fatal warning)
if (__DEV__) {
  const missing = [];
  if (!config.supabaseUrl) missing.push('SUPABASE_URL');
  if (!config.supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
  if (!config.anthropicApiKey) missing.push('ANTHROPIC_API_KEY');

  if (missing.length > 0) {
    console.warn(
      `[Config] Missing environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in your values.'
    );
  }
}

export default config;
