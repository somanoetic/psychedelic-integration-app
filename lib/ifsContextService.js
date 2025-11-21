import { supabase } from './supabase';

/**
 * IFS Context Service
 * Manages loading and saving IFS parts inventory and session history
 * Provides context for AI services to maintain continuity across sessions
 */
class IFSContextService {

  /**
   * Load all parts for a user
   */
  async loadUserParts(userId) {
    try {
      const { data, error } = await supabase
        .from('ifs_parts_inventory')
        .select('*')
        .eq('user_id', userId)
        .order('last_worked_with', { ascending: false });

      if (error) throw error;

      return {
        allParts: data || [],
        protectors: data?.filter(p => !p.is_exile) || [],
        exiles: data?.filter(p => p.is_exile) || [],
        unburdenedExiles: data?.filter(p => p.is_exile && p.unburdened) || [],
        recentParts: data?.slice(0, 5) || [] // Most recently worked with
      };
    } catch (error) {
      console.error('Error loading user parts:', error);
      return {
        allParts: [],
        protectors: [],
        exiles: [],
        unburdenedExiles: [],
        recentParts: []
      };
    }
  }

  /**
   * Find a part by name or description (fuzzy match)
   */
  async findPartByDescription(userId, description) {
    try {
      const { data, error } = await supabase
        .from('ifs_parts_inventory')
        .select('*')
        .eq('user_id', userId)
        .or(`part_name.ilike.%${description}%,protective_strategy.ilike.%${description}%,part_feelings.ilike.%${description}%`);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding part:', error);
      return [];
    }
  }

  /**
   * Save a newly discovered part
   */
  async savePart(userId, partData) {
    try {
      const { data, error } = await supabase
        .from('ifs_parts_inventory')
        .insert({
          user_id: userId,
          part_name: partData.name,
          part_role: partData.role,
          location_in_body: partData.location,
          appearance_description: partData.appearance,
          age_of_part: partData.age,
          feelings_toward_part: partData.feelingsToward,
          part_feelings: partData.feelings,
          part_wants: partData.wants,
          part_fears: partData.fears,
          protective_strategy: partData.strategy,
          is_exile: partData.isExile || false,
          work_phase: 'discovery',
          discovery_date: new Date().toISOString(),
          last_worked_with: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Part saved successfully:', data.id);
      return data;
    } catch (error) {
      console.error('Error saving part:', error);
      return null;
    }
  }

  /**
   * Update an existing part
   */
  async updatePart(partId, updates) {
    try {
      const { data, error } = await supabase
        .from('ifs_parts_inventory')
        .update({
          ...updates,
          last_worked_with: new Date().toISOString()
        })
        .eq('id', partId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating part:', error);
      return null;
    }
  }

  /**
   * Mark a part as accessed (exile work begun)
   */
  async markExileAccessed(partId, accessData) {
    return await this.updatePart(partId, {
      exile_accessed: true,
      exile_access_date: new Date().toISOString(),
      original_wound_age: accessData.woundAge,
      original_wound_description: accessData.woundDescription,
      original_wound_context: accessData.woundContext,
      burdens_carried: accessData.burdens,
      work_phase: 'accessing'
    });
  }

  /**
   * Mark a part as unburdened
   */
  async markExileUnburdened(partId, unburdeningData) {
    return await this.updatePart(partId, {
      unburdened: true,
      unburdening_date: new Date().toISOString(),
      unburdening_method: unburdeningData.method,
      burdens_released: unburdeningData.burdensReleased,
      new_qualities: unburdeningData.newQualities,
      new_role: unburdeningData.newRole,
      work_phase: 'unburdening'
    });
  }

  /**
   * Mark a part as integrated
   */
  async markPartIntegrated(partId, integrationNotes) {
    return await this.updatePart(partId, {
      work_phase: 'integrated',
      follow_up_notes: integrationNotes
    });
  }

  /**
   * Link a protector to the exile it protects
   */
  async linkProtectorToExile(protectorId, exileId) {
    return await this.updatePart(protectorId, {
      protects_which_exile: exileId
    });
  }

  /**
   * Save a session history entry
   */
  async saveSession(userId, sessionData) {
    try {
      const { data, error } = await supabase
        .from('ifs_session_history')
        .insert({
          user_id: userId,
          part_id: sessionData.partId,
          session_type: sessionData.type,
          session_phase: sessionData.phase,
          duration_minutes: sessionData.duration,
          starting_question: sessionData.startingQuestion,
          part_was_known: sessionData.wasKnown || false,
          conversation_summary: sessionData.summary,
          key_insights: sessionData.insights,
          protector_permissions: sessionData.permissions || [],
          exile_work_attempted: sessionData.exileWorkAttempted || false,
          exile_work_successful: sessionData.exileWorkSuccessful,
          nervous_system_state_start: sessionData.nsStateStart,
          nervous_system_state_end: sessionData.nsStateEnd,
          completed: sessionData.completed || false,
          session_outcome: sessionData.outcome,
          next_steps: sessionData.nextSteps,
          follow_up_needed: sessionData.followUpNeeded || false,
          session_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving session:', error);
      return null;
    }
  }

  /**
   * Get session history for a part
   */
  async getPartSessions(partId) {
    try {
      const { data, error } = await supabase
        .from('ifs_session_history')
        .select('*')
        .eq('part_id', partId)
        .order('session_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading part sessions:', error);
      return [];
    }
  }

  /**
   * Get recent sessions for a user
   */
  async getRecentSessions(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('ifs_session_history')
        .select('*, ifs_parts_inventory(part_name, part_role)')
        .eq('user_id', userId)
        .order('session_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading recent sessions:', error);
      return [];
    }
  }

  /**
   * Check if user has any exiles that are ready for unburdening
   */
  async getExilesReadyForWork(userId) {
    try {
      const { data, error } = await supabase
        .from('ifs_parts_inventory')
        .select('*')
        .eq('user_id', userId)
        .eq('is_exile', true)
        .eq('exile_accessed', true)
        .eq('unburdened', false);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading exiles ready for work:', error);
      return [];
    }
  }

  /**
   * Get protectors that protect a specific exile
   */
  async getProtectorsForExile(exileId) {
    try {
      const { data, error } = await supabase
        .from('ifs_parts_inventory')
        .select('*')
        .eq('protects_which_exile', exileId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading protectors:', error);
      return [];
    }
  }

  /**
   * Increment session count for a part
   */
  async incrementSessionCount(partId) {
    try {
      const { data: part } = await supabase
        .from('ifs_parts_inventory')
        .select('sessions_count')
        .eq('id', partId)
        .single();

      if (part) {
        await this.updatePart(partId, {
          sessions_count: (part.sessions_count || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error incrementing session count:', error);
    }
  }
}

export default new IFSContextService();
