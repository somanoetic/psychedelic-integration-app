// lib/intentionGuidanceService.js
// Database access layer for FEAT-102: AI Guidance in Set Your Intention Screen

import { supabase } from './supabase';

/**
 * Service for managing intention templates, user intentions, and preferences
 * Handles all database operations for the intention guidance feature
 */
const intentionGuidanceService = {

  // =========================================================================
  // INTENTION TEMPLATES
  // =========================================================================

  /**
   * Get active templates by framework and session type
   * @param {string} [framework] - Filter by framework (ifs, somatic, etc.)
   * @param {string} [sessionType] - Filter by session type (healing, exploration, etc.)
   * @param {number} [limit] - Max results (default: all)
   * @returns {Promise<Array>} Array of template objects
   */
  async getTemplates(framework = null, sessionType = null, limit = null) {
    try {
      let query = supabase
        .from('intention_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true });

      if (framework) query = query.eq('framework', framework);
      if (sessionType) query = query.eq('session_type', sessionType);
      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;

      // Return database templates if available, otherwise fallback built-in templates
      if (data && data.length > 0) return data;
      return this.getBuiltInTemplates(framework, sessionType, limit);
    } catch (error) {
      console.error('Error fetching templates:', error);
      // On any error, return built-in templates so the feature still works
      return this.getBuiltInTemplates(framework, sessionType, limit);
    }
  },

  /**
   * Built-in fallback templates when database has none
   */
  getBuiltInTemplates(framework = null, sessionType = null, limit = null) {
    const builtIn = [
      {
        id: 'builtin-1',
        title: 'Open to what arises',
        intention_text: 'I intend to remain open and curious about whatever wants to be seen or felt today.',
        description: 'A spacious, receptive intention for when you want to let the experience guide you.',
        framework: 'healing',
        session_type: 'general',
        is_featured: true,
        tags: ['openness', 'curiosity', 'surrender'],
        sort_order: 1,
      },
      {
        id: 'builtin-2',
        title: 'Meeting a part with compassion',
        intention_text: 'I intend to meet the part of me that carries fear with gentleness and curiosity.',
        description: 'An IFS-informed intention for connecting with a protective or wounded part.',
        framework: 'ifs',
        session_type: 'healing',
        is_featured: true,
        tags: ['parts work', 'self-compassion', 'IFS'],
        sort_order: 2,
      },
      {
        id: 'builtin-3',
        title: 'Listening to the body',
        intention_text: 'I intend to listen to what my body has been holding and allow it to move or release.',
        description: 'A somatic intention for reconnecting with bodily wisdom and stored experiences.',
        framework: 'somatic',
        session_type: 'healing',
        is_featured: true,
        tags: ['somatic', 'body', 'release'],
        sort_order: 3,
      },
      {
        id: 'builtin-4',
        title: 'Exploring what wants to be expressed',
        intention_text: 'I intend to follow the creative energy that wants to move through me.',
        description: 'For sessions focused on creative expression and letting something new emerge.',
        framework: 'healing',
        session_type: 'creativity',
        is_featured: false,
        tags: ['creativity', 'expression', 'flow'],
        sort_order: 4,
      },
      {
        id: 'builtin-5',
        title: 'Seeking connection',
        intention_text: 'I intend to open to a sense of connection — with myself, with others, with something greater.',
        description: 'A spiritual intention for deepening your sense of belonging and interconnection.',
        framework: 'spiritual',
        session_type: 'spiritual',
        is_featured: false,
        tags: ['connection', 'spiritual', 'belonging'],
        sort_order: 5,
      },
      {
        id: 'builtin-6',
        title: 'Understanding a pattern',
        intention_text: 'I intend to understand the pattern that keeps showing up in my life and what it is trying to protect.',
        description: 'For exploring recurring themes, behaviors, or relational patterns with curiosity.',
        framework: 'ifs',
        session_type: 'exploration',
        is_featured: false,
        tags: ['patterns', 'understanding', 'insight'],
        sort_order: 6,
      },
      {
        id: 'builtin-7',
        title: 'Finding safety in the body',
        intention_text: 'I intend to find and expand the places in my body where I feel safe and grounded.',
        description: 'A polyvagal-informed intention for building felt safety and regulation capacity.',
        framework: 'somatic',
        session_type: 'healing',
        is_featured: false,
        tags: ['safety', 'grounding', 'polyvagal'],
        sort_order: 7,
      },
      {
        id: 'builtin-8',
        title: 'Letting go of control',
        intention_text: 'I intend to practice surrendering control and trusting the process to unfold as it needs to.',
        description: 'For those who tend to grip tightly — an intention to practice release and trust.',
        framework: 'existential',
        session_type: 'general',
        is_featured: false,
        tags: ['surrender', 'trust', 'letting go'],
        sort_order: 8,
      },
    ];

    let filtered = builtIn;
    if (framework) filtered = filtered.filter(t => t.framework === framework);
    if (sessionType) filtered = filtered.filter(t => t.session_type === sessionType);
    // If filters left us with nothing, show all
    if (filtered.length === 0) filtered = builtIn;
    if (limit) filtered = filtered.slice(0, limit);
    return filtered;
  },

  /**
   * Get a single template by ID
   * @param {string} templateId - Template UUID
   * @returns {Promise<Object|null>} Template object or null
   */
  async getTemplateById(templateId) {
    try {
      const { data, error } = await supabase
        .from('intention_templates')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching template by ID:', error);
      throw error;
    }
  },

  /**
   * Search templates by tag
   * @param {string} tag - Tag to search for
   * @returns {Promise<Array>} Array of template objects
   */
  async searchTemplatesByTag(tag) {
    try {
      const { data, error } = await supabase
        .from('intention_templates')
        .select('*')
        .eq('is_active', true)
        .contains('tags', [tag])
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching templates by tag:', error);
      throw error;
    }
  },

  /**
   * Get featured templates (for homepage carousel)
   * @param {number} [limit=5] - Max results
   * @returns {Promise<Array>} Array of featured template objects
   */
  async getFeaturedTemplates(limit = 5) {
    try {
      const { data, error } = await supabase
        .from('intention_templates')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('sort_order', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured templates:', error);
      throw error;
    }
  },

  // =========================================================================
  // USER INTENTIONS
  // =========================================================================

  /**
   * Get user's intentions (excluding deleted)
   * @param {string} userId - User UUID
   * @param {number} [limit=10] - Max results
   * @returns {Promise<Array>} Array of intention objects with session info
   */
  async getUserIntentions(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('session_intentions')
        .select(`
          *,
          sessions:session_id (
            id,
            title,
            date
          )
        `)
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user intentions:', error);
      throw error;
    }
  },

  /**
   * Get intentions for a specific session
   * @param {string} sessionId - Session UUID
   * @returns {Promise<Array>} Array of intention objects
   */
  async getSessionIntentions(sessionId) {
    try {
      const { data, error } = await supabase
        .from('session_intentions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching session intentions:', error);
      throw error;
    }
  },

  /**
   * Get a single intention by ID
   * @param {string} intentionId - Intention UUID
   * @returns {Promise<Object|null>} Intention object or null
   */
  async getIntentionById(intentionId) {
    try {
      const { data, error } = await supabase
        .from('session_intentions')
        .select('*')
        .eq('id', intentionId)
        .eq('is_deleted', false)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching intention by ID:', error);
      throw error;
    }
  },

  /**
   * Save new intention
   * @param {Object} intention - Intention data
   * @param {string} intention.userId - User UUID
   * @param {string} [intention.sessionId] - Session UUID (optional)
   * @param {string} intention.intentionText - Intention text
   * @param {string} [intention.framework] - Framework (ifs, somatic, etc.)
   * @param {string} intention.sessionType - Session type (healing, exploration, etc.)
   * @param {Object} [intention.aiContext] - AI conversation metadata
   * @param {string} [intention.inspiredByTemplateId] - Template UUID
   * @returns {Promise<Object>} Created intention object
   */
  async saveIntention(intention) {
    try {
      const { data, error } = await supabase
        .from('session_intentions')
        .insert([{
          user_id: intention.userId,
          session_id: intention.sessionId || null,
          intention_text: intention.intentionText,
          framework: intention.framework || null,
          session_type: intention.sessionType,
          ai_conversation_context: intention.aiContext || {},
          inspired_by_template_id: intention.inspiredByTemplateId || null
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving intention:', error);
      throw error;
    }
  },

  /**
   * Update intention (e.g., add rating after session)
   * @param {string} intentionId - Intention UUID
   * @param {Object} updates - Fields to update
   * @param {number} [updates.userRating] - 1-5 stars
   * @param {string} [updates.userNotes] - User notes
   * @param {string} [updates.intentionText] - Updated intention text
   * @param {string} [updates.framework] - Updated framework
   * @returns {Promise<Object>} Updated intention object
   */
  async updateIntention(intentionId, updates) {
    try {
      const updateData = {};

      if (updates.userRating !== undefined) updateData.user_rating = updates.userRating;
      if (updates.userNotes !== undefined) updateData.user_notes = updates.userNotes;
      if (updates.intentionText !== undefined) updateData.intention_text = updates.intentionText;
      if (updates.framework !== undefined) updateData.framework = updates.framework;
      if (updates.sessionType !== undefined) updateData.session_type = updates.sessionType;

      const { data, error } = await supabase
        .from('session_intentions')
        .update(updateData)
        .eq('id', intentionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating intention:', error);
      throw error;
    }
  },

  /**
   * Soft delete intention
   * @param {string} intentionId - Intention UUID
   * @returns {Promise<Object>} Deleted intention object
   */
  async deleteIntention(intentionId) {
    try {
      const { data, error } = await supabase
        .from('session_intentions')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', intentionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting intention:', error);
      throw error;
    }
  },

  /**
   * Restore soft-deleted intention (within 30 days)
   * @param {string} intentionId - Intention UUID
   * @returns {Promise<Object>} Restored intention object
   */
  async restoreIntention(intentionId) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('session_intentions')
        .update({
          is_deleted: false,
          deleted_at: null
        })
        .eq('id', intentionId)
        .eq('is_deleted', true)
        .gte('deleted_at', thirtyDaysAgo)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error restoring intention:', error);
      throw error;
    }
  },

  /**
   * Get user's deleted intentions (for recovery UI)
   * @param {string} userId - User UUID
   * @returns {Promise<Array>} Array of deleted intention objects
   */
  async getDeletedIntentions(userId) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('session_intentions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', true)
        .gte('deleted_at', thirtyDaysAgo)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching deleted intentions:', error);
      throw error;
    }
  },

  // =========================================================================
  // USER PREFERENCES
  // =========================================================================

  /**
   * Get user preferences (creates default if not exists)
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} User preferences object
   */
  async getUserPreferences(userId) {
    try {
      let { data, error } = await supabase
        .from('user_intention_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // If not found, create default
      if (error && error.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('user_intention_preferences')
          .insert([{ user_id: userId }])
          .select()
          .single();

        if (insertError) throw insertError;
        return newData;
      }

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  },

  /**
   * Update user preferences
   * @param {string} userId - User UUID
   * @param {Object} updates - Fields to update
   * @param {boolean} [updates.saveByDefault] - Save intentions by default
   * @param {number} [updates.autoDeleteAfterDays] - Auto-delete after N days (7-365)
   * @param {string[]} [updates.favoriteFrameworks] - Favorite frameworks
   * @param {string[]} [updates.preferredSessionTypes] - Preferred session types
   * @param {string} [updates.guidanceStyle] - AI verbosity (brief, balanced, detailed)
   * @param {boolean} [updates.showExamples] - Show example intentions
   * @param {boolean} [updates.enableAISuggestions] - Enable AI suggestions
   * @param {boolean} [updates.offlineCacheEnabled] - Cache templates for offline
   * @param {string[]} [updates.cachedTemplateIds] - Cached template UUIDs
   * @param {boolean} [updates.hasCompletedOnboarding] - Onboarding complete flag
   * @returns {Promise<Object>} Updated preferences object
   */
  async updateUserPreferences(userId, updates) {
    try {
      const updateData = {};

      if (updates.saveByDefault !== undefined) updateData.save_by_default = updates.saveByDefault;
      if (updates.autoDeleteAfterDays !== undefined) updateData.auto_delete_after_days = updates.autoDeleteAfterDays;
      if (updates.favoriteFrameworks !== undefined) updateData.favorite_frameworks = updates.favoriteFrameworks;
      if (updates.preferredSessionTypes !== undefined) updateData.preferred_session_types = updates.preferredSessionTypes;
      if (updates.guidanceStyle !== undefined) updateData.guidance_style = updates.guidanceStyle;
      if (updates.showExamples !== undefined) updateData.show_examples = updates.showExamples;
      if (updates.enableAISuggestions !== undefined) updateData.enable_ai_suggestions = updates.enableAISuggestions;
      if (updates.offlineCacheEnabled !== undefined) updateData.offline_cache_enabled = updates.offlineCacheEnabled;
      if (updates.cachedTemplateIds !== undefined) updateData.cached_template_ids = updates.cachedTemplateIds;

      if (updates.hasCompletedOnboarding !== undefined) {
        updateData.has_completed_onboarding = updates.hasCompletedOnboarding;
        if (updates.hasCompletedOnboarding && !updates.onboardingCompletedAt) {
          updateData.onboarding_completed_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('user_intention_preferences')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  },

  /**
   * Check if user wants to save by default
   * @param {string} userId - User UUID
   * @returns {Promise<boolean>} True if save by default
   */
  async shouldSaveByDefault(userId) {
    try {
      const prefs = await this.getUserPreferences(userId);
      return prefs.save_by_default;
    } catch (error) {
      console.error('Error checking save by default:', error);
      return false; // Default to not saving on error
    }
  },

  // =========================================================================
  // ADMIN / ANALYTICS (Optional)
  // =========================================================================

  /**
   * Get template usage statistics (admin only)
   * @param {number} [limit=20] - Max results
   * @returns {Promise<Array>} Array of template usage stats
   */
  async getTemplateUsageStats(limit = 20) {
    try {
      const { data, error } = await supabase.rpc('get_template_usage_stats', {
        result_limit: limit
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching template usage stats:', error);
      throw error;
    }
  },

  // =========================================================================
  // UTILITY FUNCTIONS
  // =========================================================================

  /**
   * Get current user ID from Supabase auth
   * @returns {Promise<string|null>} User UUID or null
   */
  async getCurrentUserId() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }
};

export default intentionGuidanceService;
