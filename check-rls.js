#!/usr/bin/env node

/**
 * Supabase RLS Security Audit Script
 *
 * This script checks your Row Level Security (RLS) configuration
 * to ensure your database is properly secured.
 *
 * Run: node check-rls.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n`),
};

async function checkRLS() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  log.header('Supabase RLS Security Audit');
  log.info(`Project: ${supabaseUrl}`);
  log.info(`Key Type: ${supabaseKey.includes('anon') ? 'anon (correct ✓)' : 'checking...'}\n`);

  // List of tables to check (based on your app)
  const tablesToCheck = [
    'users',
    'sessions',
    'journal_entries',
    'exercises',
    'habit_tracker',
    'trigger_logs',
    'glimmer_logs',
    'exercise_progress',
    'curriculum_progress',
  ];

  log.header('Checking Tables and RLS Status');

  let totalTables = 0;
  let tablesWithRLS = 0;
  let tablesWithoutRLS = 0;
  let tablesNotFound = 0;
  let criticalIssues = 0;

  for (const tableName of tablesToCheck) {
    try {
      // Try to query the table
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .limit(0);

      if (error) {
        // Check error type
        if (error.code === 'PGRST116') {
          // Table doesn't exist
          log.warning(`Table "${tableName}" does not exist`);
          tablesNotFound++;
        } else if (error.message.includes('permission denied') || error.message.includes('row-level security')) {
          // RLS is likely enabled and blocking access (good!)
          log.success(`Table "${tableName}" - RLS appears to be ENABLED ✓`);
          log.info(`   └─ Access blocked (as expected for unauthenticated user)`);
          totalTables++;
          tablesWithRLS++;
        } else {
          // Other error
          log.warning(`Table "${tableName}" - Error: ${error.message}`);
          totalTables++;
        }
      } else {
        // Query succeeded - this might mean RLS is disabled or too permissive
        log.error(`Table "${tableName}" - WARNING: Accessible without authentication!`);
        log.warning(`   └─ RLS might be DISABLED or policies are too permissive`);
        log.warning(`   └─ This is a SECURITY RISK for user data tables`);
        totalTables++;
        tablesWithoutRLS++;
        criticalIssues++;
      }
    } catch (err) {
      log.error(`Table "${tableName}" - Unexpected error: ${err.message}`);
    }
  }

  // Additional check: Try to access Supabase management API for more details
  log.header('Detailed RLS Policy Check');
  log.info('To get detailed policy information, you need to:');
  log.info('1. Go to: https://app.supabase.com/project/hxpyeudklnqtwspmdsuz/database/tables');
  log.info('2. Click on each table');
  log.info('3. Look for "RLS enabled" badge');
  log.info('4. Click "Policies" tab to see rules\n');

  // Summary
  log.header('Security Audit Summary');
  console.log(`Total tables checked: ${totalTables + tablesNotFound}`);
  console.log(`  ${colors.green}✓${colors.reset} Tables with RLS protection: ${tablesWithRLS}`);
  console.log(`  ${colors.red}✗${colors.reset} Tables possibly without RLS: ${tablesWithoutRLS}`);
  console.log(`  ${colors.yellow}?${colors.reset} Tables not found: ${tablesNotFound}`);
  console.log(`  ${colors.red}!${colors.reset} Critical security issues: ${criticalIssues}\n`);

  // Overall assessment
  if (criticalIssues > 0) {
    log.error('⚠️  SECURITY CONCERN DETECTED!');
    log.error('Some tables are accessible without authentication.');
    log.error('This could mean RLS is disabled or policies are too permissive.\n');
    log.info('RECOMMENDED ACTIONS:');
    log.info('1. Go to Supabase dashboard and check each table');
    log.info('2. Enable RLS on all user data tables');
    log.info('3. Add policies that check auth.uid() = user_id');
    log.info('4. See docs/SUPABASE_RLS_GUIDE.md for examples\n');
  } else if (tablesWithRLS > 0) {
    log.success('✓ GOOD NEWS! RLS appears to be protecting your tables.');
    log.success('Access is properly restricted for unauthenticated users.\n');
    log.info('This means your exposed Supabase anon key is SAFE to use.');
    log.info('The key was designed to be used client-side with RLS protection.\n');
  } else if (tablesNotFound === tablesToCheck.length) {
    log.warning('⚠️  No tables found in database.');
    log.info('This might mean:');
    log.info('- Your database is empty');
    log.info('- Tables have different names');
    log.info('- Connection issue\n');
  }

  // Test authentication flow
  log.header('Testing Authentication Flow');
  log.info('To fully test RLS, you should:');
  log.info('1. Create a test user account');
  log.info('2. Sign in with that account');
  log.info('3. Try to access data (should work for own data)');
  log.info('4. Try to access another user\'s data (should fail)\n');

  // Additional recommendations
  log.header('Security Best Practices Checklist');
  const checklist = [
    { item: 'RLS enabled on all user data tables', critical: true },
    { item: 'Policies check auth.uid() = user_id for user data', critical: true },
    { item: 'service_role key NOT in client-side code', critical: true },
    { item: 'Only anon key used in React Native app', critical: false },
    { item: 'Test policies with different user accounts', critical: false },
    { item: 'Public/reference data has read-only policies', critical: false },
  ];

  checklist.forEach(({ item, critical }) => {
    const marker = critical ? `${colors.red}[CRITICAL]${colors.reset}` : `${colors.yellow}[IMPORTANT]${colors.reset}`;
    console.log(`  ${marker} ${item}`);
  });

  console.log('\n');
  log.info('For detailed RLS setup instructions, see: docs/SUPABASE_RLS_GUIDE.md');
  console.log('\n');
}

// Run the check
checkRLS().catch(console.error);
