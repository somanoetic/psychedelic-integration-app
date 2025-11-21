// Script to create test user in Supabase
// Run this once to set up the test account

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for this

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  console.log('Need: EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('Creating test user...');

  // Create user with admin API
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test@psychapp.com',
    password: '12345',
    email_confirm: true // Auto-confirm the email
  });

  if (error) {
    console.error('Error creating test user:', error.message);
    return;
  }

  console.log('✅ Test user created successfully!');
  console.log('Login with:');
  console.log('  Username: test');
  console.log('  Password: 12345');
  console.log('  (or email: test@psychapp.com)');
}

createTestUser();
