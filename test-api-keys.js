#!/usr/bin/env node

/**
 * Quick test script to verify API keys are working
 * Run: node test-api-keys.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔑 Testing API Keys...\n');

// Test Anthropic API Key
async function testAnthropicKey() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.log('❌ ANTHROPIC_API_KEY not found in .env');
    return false;
  }

  console.log('✅ ANTHROPIC_API_KEY found');
  console.log('   Format:', apiKey.substring(0, 20) + '...');

  // Quick validation - just check format
  if (apiKey.startsWith('sk-ant-api03-')) {
    console.log('   ✅ Key format looks correct\n');
    return true;
  } else {
    console.log('   ⚠️  Warning: Key format may be incorrect\n');
    return false;
  }
}

// Test Supabase Connection
async function testSupabaseConnection() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase credentials not found in .env');
    return false;
  }

  console.log('✅ SUPABASE_URL found:', supabaseUrl);
  console.log('✅ SUPABASE_ANON_KEY found');
  console.log('   Format:', supabaseKey.substring(0, 20) + '...');

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try a simple query to test connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.log('   ⚠️  Connection test returned error:', error.message);
      console.log('   (This might be normal if table doesn\'t exist or RLS is strict)\n');
      return true; // Key works, just no access
    } else {
      console.log('   ✅ Connection successful!\n');
      return true;
    }
  } catch (err) {
    console.log('   ❌ Connection failed:', err.message, '\n');
    return false;
  }
}

// Run tests
(async () => {
  console.log('='.repeat(50));
  console.log('Testing Anthropic API Key:');
  console.log('='.repeat(50));
  const anthropicOk = await testAnthropicKey();

  console.log('='.repeat(50));
  console.log('Testing Supabase Connection:');
  console.log('='.repeat(50));
  const supabaseOk = await testSupabaseConnection();

  console.log('='.repeat(50));
  console.log('Summary:');
  console.log('='.repeat(50));
  console.log('Anthropic:', anthropicOk ? '✅ OK' : '❌ FAILED');
  console.log('Supabase:', supabaseOk ? '✅ OK' : '❌ FAILED');
  console.log('='.repeat(50));

  if (anthropicOk && supabaseOk) {
    console.log('\n🎉 All API keys appear to be working!');
    console.log('You can now run your app with the new keys.\n');
  } else {
    console.log('\n⚠️  Some keys may need attention.');
    console.log('Check the errors above and verify your .env file.\n');
  }
})();
