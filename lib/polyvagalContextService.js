import { supabase } from './supabase';

/**
 * Polyvagal Context Service
 * Manages loading and saving nervous system patterns over time
 * Helps users recognize their unique expression of regulation and dysregulation
 */
class PolyvagalContextService {

  /**
   * Load user's polyvagal patterns
   */
  async loadUserPatterns(userId) {
    try {
      const { data, error } = await supabase
        .from('polyvagal_patterns')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data || this.getEmptyPatterns();
    } catch (error) {
      console.error('Error loading polyvagal patterns:', error);
      return this.getEmptyPatterns();
    }
  }

  /**
   * Get empty patterns structure
   */
  getEmptyPatterns() {
    return {
      ventral_patterns: {
        situations: [],
        body_sensations: [],
        thoughts: [],
        behaviors: [],
        personal_language: []
      },
      sympathetic_patterns: {
        situations: [],
        body_sensations: [],
        thoughts: [],
        behaviors: [],
        personal_language: []
      },
      dorsal_patterns: {
        situations: [],
        body_sensations: [],
        thoughts: [],
        behaviors: [],
        personal_language: []
      },
      most_common_triggers: [],
      most_reliable_glimmers: [],
      individual_resources: [],
      interactive_resources: [],
      personal_state_language: {},
      early_warning_signs: [],
      successful_interventions: [],
      regulation_capacity: 'building',
      awareness_level: 'beginning',
      mapping_sessions_count: 0,
      triggers_sessions_count: 0,
      resources_sessions_count: 0
    };
  }

  /**
   * Update patterns after a mapping session
   */
  async updatePatternsFromMapping(userId, mappingData) {
    try {
      // Load existing patterns
      let existing = await this.loadUserPatterns(userId);

      // Merge new data with existing patterns
      const updated = {
        ventral_patterns: this.mergeStatePatterns(
          existing.ventral_patterns,
          mappingData.ventral
        ),
        sympathetic_patterns: this.mergeStatePatterns(
          existing.sympathetic_patterns,
          mappingData.sympathetic
        ),
        dorsal_patterns: this.mergeStatePatterns(
          existing.dorsal_patterns,
          mappingData.dorsal
        ),
        mapping_sessions_count: (existing.mapping_sessions_count || 0) + 1,
        last_mapped_at: new Date().toISOString(),
        first_mapped_at: existing.first_mapped_at || new Date().toISOString()
      };

      // Upsert (insert or update)
      const { data, error } = await supabase
        .from('polyvagal_patterns')
        .upsert({
          user_id: userId,
          ...existing,
          ...updated
        })
        .select()
        .single();

      if (error) throw error;

      // Update nervous system context
      await this.updateNervousSystemContext(userId, {
        understands_three_states: true,
        can_identify_current_state: true
      });

      return data;
    } catch (error) {
      console.error('Error updating patterns from mapping:', error);
      return null;
    }
  }

  /**
   * Update patterns from a single-state check-in (vs updatePatternsFromMapping which expects all 3 states)
   */
  async updatePatternsFromCheckin(userId, { state, bodyFeeling, thoughts, context }) {
    try {
      // Mixed state can't be attributed to a single polyvagal state
      if (state === 'mixed') {
        await this.updateNervousSystemContext(userId, {
          can_identify_current_state: true
        });
        return null;
      }

      const existing = await this.loadUserPatterns(userId);

      const stateFieldMap = {
        ventral: 'ventral_patterns',
        sympathetic: 'sympathetic_patterns',
        dorsal: 'dorsal_patterns',
      };

      const field = stateFieldMap[state];
      if (!field) return null;

      const patterns = { ...existing[field] };

      if (bodyFeeling && !patterns.body_sensations.includes(bodyFeeling)) {
        patterns.body_sensations = [...patterns.body_sensations, bodyFeeling];
      }
      if (thoughts && !patterns.thoughts.includes(thoughts)) {
        patterns.thoughts = [...patterns.thoughts, thoughts];
      }
      if (context && !patterns.situations.includes(context)) {
        patterns.situations = [...patterns.situations, context];
      }

      const updated = {
        [field]: patterns,
      };

      const { data, error } = await supabase
        .from('polyvagal_patterns')
        .upsert({
          user_id: userId,
          ...existing,
          ...updated,
        })
        .select()
        .single();

      if (error) throw error;

      await this.updateNervousSystemContext(userId, {
        can_identify_current_state: true,
      });

      return data;
    } catch (error) {
      console.error('Error updating patterns from check-in:', JSON.stringify(error));
      return null;
    }
  }

  /**
   * Merge new state data with existing patterns
   */
  mergeStatePatterns(existing, newData) {
    if (!newData) return existing;

    const merged = { ...existing };

    if (newData.memory && !merged.situations.includes(newData.memory)) {
      merged.situations = [...merged.situations, newData.memory];
    }
    if (newData.body && !merged.body_sensations.includes(newData.body)) {
      merged.body_sensations = [...merged.body_sensations, newData.body];
    }
    if (newData.thoughts && !merged.thoughts.includes(newData.thoughts)) {
      merged.thoughts = [...merged.thoughts, newData.thoughts];
    }

    return merged;
  }

  /**
   * Update triggers from triggers/glimmers session
   */
  async updateTriggersAndGlimmers(userId, triggersData) {
    try {
      let existing = await this.loadUserPatterns(userId);

      const updated = {
        most_common_triggers: [
          ...existing.most_common_triggers,
          ...triggersData.sympathetic_triggers.map(t => ({ type: 'sympathetic', description: t, added: new Date().toISOString() })),
          ...triggersData.dorsal_triggers.map(t => ({ type: 'dorsal', description: t, added: new Date().toISOString() }))
        ],
        most_reliable_glimmers: [
          ...existing.most_reliable_glimmers,
          ...triggersData.glimmers.map(g => ({ description: g, added: new Date().toISOString() }))
        ],
        triggers_sessions_count: (existing.triggers_sessions_count || 0) + 1
      };

      const { data, error } = await supabase
        .from('polyvagal_patterns')
        .upsert({
          user_id: userId,
          ...existing,
          ...updated
        })
        .select()
        .single();

      if (error) throw error;

      // Update context
      await this.updateNervousSystemContext(userId, {
        knows_their_triggers: updated.most_common_triggers.length > 0,
        knows_their_glimmers: updated.most_reliable_glimmers.length > 0
      });

      return data;
    } catch (error) {
      console.error('Error updating triggers and glimmers:', error);
      return null;
    }
  }

  /**
   * Update resources from regulation resources session
   */
  async updateRegulatingResources(userId, resourcesData) {
    try {
      let existing = await this.loadUserPatterns(userId);

      const updated = {
        individual_resources: [
          ...existing.individual_resources,
          ...resourcesData.individual.map(r => ({ description: r, added: new Date().toISOString() }))
        ],
        interactive_resources: [
          ...existing.interactive_resources,
          ...resourcesData.interactive.map(r => ({ description: r, added: new Date().toISOString() }))
        ],
        resources_sessions_count: (existing.resources_sessions_count || 0) + 1
      };

      const { data, error } = await supabase
        .from('polyvagal_patterns')
        .upsert({
          user_id: userId,
          ...existing,
          ...updated
        })
        .select()
        .single();

      if (error) throw error;

      // Update context
      await this.updateNervousSystemContext(userId, {
        has_individual_resources: updated.individual_resources.length > 0,
        has_interactive_resources: updated.interactive_resources.length > 0
      });

      return data;
    } catch (error) {
      console.error('Error updating regulating resources:', error);
      return null;
    }
  }

  /**
   * Update nervous system context (high-level awareness tracking)
   */
  async updateNervousSystemContext(userId, updates) {
    try {
      const { data: existing } = await supabase
        .from('nervous_system_context')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data, error } = await supabase
        .from('nervous_system_context')
        .upsert({
          user_id: userId,
          ...existing,
          ...updates,
          last_updated: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating nervous system context:', error);
      return null;
    }
  }

  /**
   * Get user's nervous system context
   */
  async getNervousSystemContext(userId) {
    try {
      const { data, error } = await supabase
        .from('nervous_system_context')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || {
        regulation_capacity: 'building',
        awareness_level: 'beginning',
        understands_three_states: false,
        can_identify_current_state: false,
        knows_their_triggers: false,
        knows_their_glimmers: false,
        has_individual_resources: false,
        has_interactive_resources: false
      };
    } catch (error) {
      console.error('Error loading nervous system context:', error);
      return null;
    }
  }

  /**
   * Add user observation/insight
   */
  async addUserNote(userId, note) {
    try {
      let existing = await this.loadUserPatterns(userId);

      const { data, error } = await supabase
        .from('polyvagal_patterns')
        .upsert({
          user_id: userId,
          ...existing,
          user_notes: note
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding user note:', error);
      return null;
    }
  }

  /**
   * Get summary of user's patterns for AI context
   */
  async getPatternsForAI(userId) {
    try {
      const patterns = await this.loadUserPatterns(userId);

      return {
        hasMappedStates: patterns.mapping_sessions_count > 0,
        knownTriggers: patterns.most_common_triggers.slice(0, 5),
        knownGlimmers: patterns.most_reliable_glimmers.slice(0, 5),
        individualResources: patterns.individual_resources.slice(0, 5),
        interactiveResources: patterns.interactive_resources.slice(0, 5),
        ventral: patterns.ventral_patterns,
        sympathetic: patterns.sympathetic_patterns,
        dorsal: patterns.dorsal_patterns,
        capacity: patterns.regulation_capacity,
        awareness: patterns.awareness_level
      };
    } catch (error) {
      console.error('Error getting patterns for AI:', error);
      return null;
    }
  }
}

export default new PolyvagalContextService();
