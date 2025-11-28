// lib/supabase.js - Fixed for React Native/Expo
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

// Hardcoded values - EAS builds don't bundle .env files properly
const SUPABASE_URL = 'https://hxpyeudklnqtwspmdsuz.supabase.co'
const SUPABASE_ANON_KEY = '[SUPABASE_ANON_KEY_REDACTED]'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false // Set to false for React Native
  }
})