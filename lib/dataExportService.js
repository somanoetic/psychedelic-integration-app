/**
 * Data Export Service
 *
 * Exports all user data from Supabase as a JSON file.
 * Supports sharing via the system share sheet.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { supabase } from './supabase';

const USER_DATA_TABLES = [
  'daily_journals',
  'sessions',
  'session_intentions',
  'session_checklists',
  'post_session_journals',
  'core_beliefs_assessments',
  'glimmer_logs',
  'trigger_logs',
  'cognitive_distortions',
  'craving_logs',
  'habits',
  'habit_completions',
  'parts_checkins',
  'nervous_system_checkins',
  'ifs_parts_inventory',
  'ifs_session_history',
  'therapeutic_context',
  'regulating_resources',
  'polyvagal_patterns',
  'active_imagination_sessions',
  'education_progress',
];

/**
 * Export all user data as JSON.
 *
 * @returns {Promise<string>} Path to the exported file
 */
export async function exportUserData() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('You must be signed in to export data.');
  }

  const exportData = {
    exportDate: new Date().toISOString(),
    userId: user.id,
    email: user.email,
    tables: {},
  };

  for (const table of USER_DATA_TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        exportData.tables[table] = data;
      }
    } catch {
      // Table may not exist or have different schema — skip silently
    }
  }

  const json = JSON.stringify(exportData, null, 2);
  const filename = `psycheteleos-export-${new Date().toISOString().split('T')[0]}.json`;
  const filePath = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(filePath, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return filePath;
}

/**
 * Export data and open the system share sheet.
 *
 * @returns {Promise<void>}
 */
export async function exportAndShare() {
  const filePath = await exportUserData();

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(filePath, {
    mimeType: 'application/json',
    dialogTitle: 'Export My Data',
  });
}
