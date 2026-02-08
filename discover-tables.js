#!/usr/bin/env node

/**
 * Discover what tables exist in Supabase database
 * Run: node discover-tables.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function discoverTables() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Discovering tables in Supabase database...\n');

  // Try to query the Supabase metadata
  // This uses the PostgREST API to list tables
  console.log('Attempting to query common tables...\n');

  const commonTables = [
    'users',
    'profiles',
    'sessions',
    'journal_entries',
    'journals',
    'entries',
    'exercises',
    'habit_tracker',
    'habits',
    'trigger_logs',
    'triggers',
    'glimmer_logs',
    'glimmers',
    'exercise_progress',
    'progress',
    'curriculum_progress',
    'user_profiles',
    'integration_sessions',
  ];

  const existingTables = [];
  const nonExistingTables = [];

  for (const table of commonTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .limit(0);

      if (!error || (error && !error.code?.includes('PGRST116'))) {
        console.log(`✅ Table "${table}" exists`);
        existingTables.push(table);
      } else {
        nonExistingTables.push(table);
      }
    } catch (err) {
      // Ignore errors
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n✅ Found ${existingTables.length} existing tables:`);

  if (existingTables.length > 0) {
    existingTables.forEach(table => console.log(`   - ${table}`));
  } else {
    console.log('   (none found)');
  }

  console.log('\n❌ Tables that do NOT exist:');
  console.log('   ', nonExistingTables.slice(0, 5).join(', '), '...');

  console.log('\n' + '='.repeat(60));
  console.log('NEXT STEPS');
  console.log('='.repeat(60));

  if (existingTables.length === 0) {
    console.log('\n⚠️  NO TABLES FOUND!\n');
    console.log('This could mean:');
    console.log('1. Your database is empty (no tables created yet)');
    console.log('2. All tables have RLS enabled with strict policies');
    console.log('3. Connection issue or wrong project\n');
    console.log('What to check:');
    console.log('1. Go to: https://app.supabase.com/project/hxpyeudklnqtwspmdsuz/editor');
    console.log('2. Look at the left sidebar - do you see any tables?');
    console.log('3. If yes, tell me the table names');
    console.log('4. If no, your database might not be set up yet\n');
  } else {
    console.log('\n✅ Found tables! Now we can enable RLS.\n');
    console.log('I will generate a custom SQL script for YOUR tables.');
    console.log('Creating: database/enable-rls-custom.sql\n');

    // Generate custom SQL
    let sql = `-- ============================================================
-- Enable RLS on YOUR actual tables
-- Generated: ${new Date().toISOString()}
-- ============================================================

`;

    existingTables.forEach(table => {
      sql += `-- Enable RLS on ${table}
ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;

`;
    });

    sql += `\n-- Add policies (customize based on your schema)
-- Example for tables with user_id column:

`;

    existingTables.forEach(table => {
      sql += `
-- Policies for ${table}
-- IMPORTANT: Adjust these based on your actual column names!
-- If table has 'user_id' column:
CREATE POLICY "Users manage own ${table}"
  ON ${table} FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If table has 'id' column and is a user profile table:
-- CREATE POLICY "Users manage own ${table}"
--   ON ${table} FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- If table is public/reference data (no user_id):
-- CREATE POLICY "${table} are publicly viewable"
--   ON ${table} FOR SELECT
--   USING (true);

`;
    });

    sql += `
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (${existingTables.map(t => `'${t}'`).join(', ')});
`;

    require('fs').writeFileSync('database/enable-rls-custom.sql', sql);
    console.log('✅ Created: database/enable-rls-custom.sql');
    console.log('\nBUT WAIT! Before running that SQL:');
    console.log('1. I need to know which columns your tables have');
    console.log('2. Specifically: do they have a "user_id" column?');
    console.log('3. Or do they use "id" for the user identifier?\n');
  }

  console.log('='.repeat(60));
  console.log('\n');
}

discoverTables().catch(console.error);
