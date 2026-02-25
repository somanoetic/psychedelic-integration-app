// lib/supabase.js - Supabase client using centralized config
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import config from './config';

// SECURITY: Keys are loaded from environment variables via config.js
// No hardcoded secrets. See .env.example for required variables.
const SUPABASE_URL = config.supabaseUrl;
const SUPABASE_ANON_KEY = config.supabaseAnonKey;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false // Set to false for React Native
  }
})
