// Script to check which tables exist in Supabase database
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hxpyeudklnqtwspmdsuz.supabase.co';
const SUPABASE_ANON_KEY = '[SUPABASE_ANON_KEY_REDACTED]';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
  console.log('Checking Supabase database tables...\n');

  // List of expected tables from migrations
  const expectedTables = [
    'baseline_logs',
    'core_beliefs_assessments',
    'daily_glimmers',
    'daily_journals',
    'education_progress',
    'feedback',
    'ifs_parts_inventory',
    'ifs_session_history',
    'nervous_system_context',
    'polyvagal_patterns',
    'post_session_journals',
    'regulating_resources',
    'session_intentions',
    'therapeutic_connections',
    'triggers_glimmers_mapping',
    'user_roles',
    'training_scenarios',
    'training_scenario_messages'
  ];

  const results = {
    existing: [],
    missing: [],
    errors: []
  };

  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          results.missing.push(tableName);
          console.log(`❌ ${tableName} - NOT FOUND`);
        } else {
          results.errors.push({ table: tableName, error: error.message });
          console.log(`⚠️  ${tableName} - ERROR: ${error.message}`);
        }
      } else {
        results.existing.push(tableName);
        console.log(`✅ ${tableName} - EXISTS`);
      }
    } catch (err) {
      results.errors.push({ table: tableName, error: err.message });
      console.log(`⚠️  ${tableName} - ERROR: ${err.message}`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total Expected Tables: ${expectedTables.length}`);
  console.log(`✅ Existing: ${results.existing.length}`);
  console.log(`❌ Missing: ${results.missing.length}`);
  console.log(`⚠️  Errors: ${results.errors.length}`);

  if (results.missing.length > 0) {
    console.log('\n=== MISSING TABLES ===');
    results.missing.forEach(table => console.log(`  - ${table}`));
  }

  if (results.errors.length > 0) {
    console.log('\n=== ERRORS ===');
    results.errors.forEach(({ table, error }) => {
      console.log(`  - ${table}: ${error}`);
    });
  }

  if (results.missing.length === 0 && results.errors.length === 0) {
    console.log('\n🎉 All database tables are set up correctly!');
  } else {
    console.log('\n⚠️  Some tables are missing or have errors. You may need to run migrations.');
  }
}

checkTables()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
