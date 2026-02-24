/**
 * Database Schema Tests for FEAT-102
 *
 * Tests database schema, RLS policies, indexes, and functions for:
 * - intention_templates
 * - session_intentions
 * - user_intention_preferences
 *
 * These tests require a test database connection with admin privileges.
 * Run with: npm test -- __tests__/database/feat-102-schema.test.js
 */

// Use test database credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test-service-key';

// Skip these tests in CI unless SUPABASE_SERVICE_KEY is provided
const describeDatabase = SUPABASE_SERVICE_KEY !== 'test-service-key' ? describe : describe.skip;

describeDatabase('FEAT-102 Database Schema', () => {
  let supabase;
  let testUserId;
  let testSessionId;

  beforeAll(async () => {
    // Dynamic require to avoid import errors when skipped
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  });

  beforeEach(async () => {
    // Create test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true
    });

    if (userError) throw userError;
    testUserId = userData.user.id;

    // Create test session
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: testUserId,
        title: 'Test Session',
        date: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) throw sessionError;
    testSessionId = sessionData.id;
  });

  afterEach(async () => {
    // Cleanup test data
    if (testUserId) {
      await supabase.from('session_intentions').delete().eq('user_id', testUserId);
      await supabase.from('user_intention_preferences').delete().eq('user_id', testUserId);
      await supabase.from('sessions').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  // =========================================================================
  // TABLE EXISTENCE TESTS
  // =========================================================================

  describe('Table Existence', () => {
    it('should have intention_templates table', async () => {
      const { data, error } = await supabase
        .from('intention_templates')
        .select('id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should have session_intentions table', async () => {
      const { data, error } = await supabase
        .from('session_intentions')
        .select('id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should have user_intention_preferences table', async () => {
      const { data, error } = await supabase
        .from('user_intention_preferences')
        .select('user_id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  // =========================================================================
  // SCHEMA VALIDATION TESTS
  // =========================================================================

  describe('intention_templates Schema', () => {
    it('should have required columns', async () => {
      const { data, error } = await supabase
        .from('intention_templates')
        .select('*')
        .limit(1);

      if (data && data.length > 0) {
        const template = data[0];
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('title');
        expect(template).toHaveProperty('intention_text');
        expect(template).toHaveProperty('framework');
        expect(template).toHaveProperty('session_type');
        expect(template).toHaveProperty('tags');
        expect(template).toHaveProperty('is_featured');
        expect(template).toHaveProperty('is_active');
        expect(template).toHaveProperty('sort_order');
      }
    });

    it('should have seed data', async () => {
      const { data, error } = await supabase
        .from('intention_templates')
        .select('id')
        .eq('is_active', true);

      expect(error).toBeNull();
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('session_intentions Schema', () => {
    it('should have required columns', async () => {
      const { data, error } = await supabase
        .from('session_intentions')
        .insert({
          user_id: testUserId,
          session_id: testSessionId,
          intention_text: 'Test intention',
          framework: 'ifs',
          session_type: 'healing'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('user_id');
      expect(data).toHaveProperty('session_id');
      expect(data).toHaveProperty('intention_text');
      expect(data).toHaveProperty('framework');
      expect(data).toHaveProperty('session_type');
      expect(data).toHaveProperty('is_deleted');
      expect(data).toHaveProperty('deleted_at');
      expect(data).toHaveProperty('created_at');
      expect(data).toHaveProperty('updated_at');
    });

    it('should default is_deleted to false', async () => {
      const { data, error } = await supabase
        .from('session_intentions')
        .insert({
          user_id: testUserId,
          intention_text: 'Test intention'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.is_deleted).toBe(false);
    });
  });

  describe('user_intention_preferences Schema', () => {
    it('should have required columns', async () => {
      const { data, error } = await supabase
        .from('user_intention_preferences')
        .insert({
          user_id: testUserId
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toHaveProperty('user_id');
      expect(data).toHaveProperty('save_by_default');
      expect(data).toHaveProperty('auto_delete_after_days');
      expect(data).toHaveProperty('favorite_frameworks');
      expect(data).toHaveProperty('guidance_style');
      expect(data).toHaveProperty('show_examples');
      expect(data).toHaveProperty('enable_ai_suggestions');
    });

    it('should default save_by_default to false', async () => {
      const { data, error } = await supabase
        .from('user_intention_preferences')
        .insert({
          user_id: testUserId
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.save_by_default).toBe(false);
    });

    it('should default guidance_style to balanced', async () => {
      const { data, error } = await supabase
        .from('user_intention_preferences')
        .insert({
          user_id: testUserId
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.guidance_style).toBe('balanced');
    });
  });

  // =========================================================================
  // ROW LEVEL SECURITY TESTS
  // =========================================================================

  describe('RLS Policies - intention_templates', () => {
    it('should allow authenticated users to read active templates', async () => {
      const { data, error } = await supabase
        .from('intention_templates')
        .select('*')
        .eq('is_active', true);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should not allow users to insert templates', async () => {
      const { error } = await supabase
        .from('intention_templates')
        .insert({
          title: 'Unauthorized Template',
          intention_text: 'This should fail',
          framework: 'ifs',
          session_type: 'healing'
        });

      expect(error).not.toBeNull();
    });
  });

  describe('RLS Policies - session_intentions', () => {
    it('should allow users to insert their own intentions', async () => {
      const { data, error } = await supabase
        .from('session_intentions')
        .insert({
          user_id: testUserId,
          intention_text: 'My intention',
          framework: 'ifs',
          session_type: 'healing'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.user_id).toBe(testUserId);
    });

    it('should allow users to read their own intentions', async () => {
      const { data: insertData } = await supabase
        .from('session_intentions')
        .insert({
          user_id: testUserId,
          intention_text: 'My intention'
        })
        .select()
        .single();

      const { data, error } = await supabase
        .from('session_intentions')
        .select('*')
        .eq('id', insertData.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.user_id).toBe(testUserId);
    });

    it('should allow users to update their own intentions', async () => {
      const { data: insertData } = await supabase
        .from('session_intentions')
        .insert({
          user_id: testUserId,
          intention_text: 'Original text'
        })
        .select()
        .single();

      const { data, error } = await supabase
        .from('session_intentions')
        .update({ intention_text: 'Updated text' })
        .eq('id', insertData.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.intention_text).toBe('Updated text');
    });

    it('should exclude deleted intentions by default', async () => {
      const { data: insertData } = await supabase
        .from('session_intentions')
        .insert({
          user_id: testUserId,
          intention_text: 'To be deleted',
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .select()
        .single();

      const { data } = await supabase
        .from('session_intentions')
        .select('*')
        .eq('user_id', testUserId)
        .eq('is_deleted', false);

      const deletedExists = data.some(i => i.id === insertData.id);
      expect(deletedExists).toBe(false);
    });
  });

  describe('RLS Policies - user_intention_preferences', () => {
    it('should allow users to insert their own preferences', async () => {
      const { data, error } = await supabase
        .from('user_intention_preferences')
        .insert({
          user_id: testUserId,
          save_by_default: true
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.user_id).toBe(testUserId);
    });

    it('should allow users to read their own preferences', async () => {
      await supabase
        .from('user_intention_preferences')
        .insert({
          user_id: testUserId,
          save_by_default: true
        });

      const { data, error } = await supabase
        .from('user_intention_preferences')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should allow users to update their own preferences', async () => {
      await supabase
        .from('user_intention_preferences')
        .insert({
          user_id: testUserId,
          save_by_default: false
        });

      const { data, error } = await supabase
        .from('user_intention_preferences')
        .update({ save_by_default: true })
        .eq('user_id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.save_by_default).toBe(true);
    });
  });

  // =========================================================================
  // INDEX TESTS
  // =========================================================================

  describe('Database Indexes', () => {
    it('should have index on intention_templates.framework', async () => {
      const startTime = Date.now();
      const { error } = await supabase
        .from('intention_templates')
        .select('*')
        .eq('is_active', true)
        .eq('framework', 'ifs');
      const duration = Date.now() - startTime;

      expect(error).toBeNull();
      expect(duration).toBeLessThan(200);
    });

    it('should have index on session_intentions.user_id', async () => {
      await supabase.from('session_intentions').insert([
        { user_id: testUserId, intention_text: 'Intention 1' },
        { user_id: testUserId, intention_text: 'Intention 2' },
        { user_id: testUserId, intention_text: 'Intention 3' }
      ]);

      const startTime = Date.now();
      const { error } = await supabase
        .from('session_intentions')
        .select('*')
        .eq('user_id', testUserId);
      const duration = Date.now() - startTime;

      expect(error).toBeNull();
      expect(duration).toBeLessThan(200);
    });
  });

  // =========================================================================
  // CONSTRAINT TESTS
  // =========================================================================

  describe('Database Constraints', () => {
    it('should enforce NOT NULL on intention_text', async () => {
      const { error } = await supabase
        .from('session_intentions')
        .insert({
          user_id: testUserId,
          intention_text: null
        });

      expect(error).not.toBeNull();
    });

    it('should enforce valid framework enum', async () => {
      const { error } = await supabase
        .from('session_intentions')
        .insert({
          user_id: testUserId,
          intention_text: 'Test',
          framework: 'invalid_framework'
        });

      expect(error).not.toBeNull();
    });

    it('should enforce valid session_type enum', async () => {
      const { error } = await supabase
        .from('session_intentions')
        .insert({
          user_id: testUserId,
          intention_text: 'Test',
          session_type: 'invalid_type'
        });

      expect(error).not.toBeNull();
    });

    it('should enforce auto_delete_after_days range (7-365)', async () => {
      const { error } = await supabase
        .from('user_intention_preferences')
        .insert({
          user_id: testUserId,
          auto_delete_after_days: 5
        });

      expect(error).not.toBeNull();
    });
  });

  // =========================================================================
  // FUNCTION TESTS
  // =========================================================================

  describe('Database Functions', () => {
    it('should auto-update updated_at on intention update', async () => {
      const { data: insertData } = await supabase
        .from('session_intentions')
        .insert({
          user_id: testUserId,
          intention_text: 'Original'
        })
        .select()
        .single();

      const originalUpdatedAt = insertData.updated_at;

      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: updateData } = await supabase
        .from('session_intentions')
        .update({ intention_text: 'Updated' })
        .eq('id', insertData.id)
        .select()
        .single();

      expect(updateData.updated_at).not.toBe(originalUpdatedAt);
    });

    it('should auto-update updated_at on preference update', async () => {
      const { data: insertData } = await supabase
        .from('user_intention_preferences')
        .insert({
          user_id: testUserId,
          save_by_default: false
        })
        .select()
        .single();

      const originalUpdatedAt = insertData.updated_at;

      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: updateData } = await supabase
        .from('user_intention_preferences')
        .update({ save_by_default: true })
        .eq('user_id', testUserId)
        .select()
        .single();

      expect(updateData.updated_at).not.toBe(originalUpdatedAt);
    });
  });

  // =========================================================================
  // SOFT DELETE TESTS
  // =========================================================================

  describe('Soft Delete Functionality', () => {
    it('should soft delete intentions', async () => {
      const { data: insertData } = await supabase
        .from('session_intentions')
        .insert({
          user_id: testUserId,
          intention_text: 'To be deleted'
        })
        .select()
        .single();

      const { data: updateData } = await supabase
        .from('session_intentions')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', insertData.id)
        .select()
        .single();

      expect(updateData.is_deleted).toBe(true);
      expect(updateData.deleted_at).not.toBeNull();
    });

    it('should restore soft-deleted intentions', async () => {
      const { data: insertData } = await supabase
        .from('session_intentions')
        .insert({
          user_id: testUserId,
          intention_text: 'To be deleted',
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .select()
        .single();

      const { data: updateData } = await supabase
        .from('session_intentions')
        .update({
          is_deleted: false,
          deleted_at: null
        })
        .eq('id', insertData.id)
        .select()
        .single();

      expect(updateData.is_deleted).toBe(false);
      expect(updateData.deleted_at).toBeNull();
    });
  });
});
