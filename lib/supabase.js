// lib/supabase.js - Fixed for React Native/Expo
import { createClient } from '@supabase/supabase-js'
import config from './config'

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false // Set to false for React Native
  }
})