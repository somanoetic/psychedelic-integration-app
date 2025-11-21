/**
 * Configuration Service
 *
 * Centralized config for environment variables using expo-constants
 * This works reliably in both Expo Go and production builds
 */

import Constants from 'expo-constants';

// Get config from app.json extra section
const extra = Constants.expoConfig?.extra || {};

// Export configuration
export const config = {
  supabaseUrl: extra.supabaseUrl,
  supabaseAnonKey: extra.supabaseAnonKey,
  anthropicApiKey: extra.anthropicApiKey,
};

// Validate required config
const validateConfig = () => {
  const missing = [];

  if (!config.supabaseUrl) missing.push('supabaseUrl');
  if (!config.supabaseAnonKey) missing.push('supabaseAnonKey');
  if (!config.anthropicApiKey) missing.push('anthropicApiKey');

  if (missing.length > 0) {
    console.error('Missing required configuration:', missing.join(', '));
    console.log('Make sure app.json has these values in the extra section');
  }
};

validateConfig();

export default config;
