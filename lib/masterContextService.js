import { supabase } from './supabase';
import ifsContextService from './ifsContextService';
import polyvagalContextService from './polyvagalContextService';

/**
 * Master Context Service
 *
 * Central coordination layer that aggregates ALL therapeutic data across domains
 * Enables cross-domain insights like:
 * - "That owl from your journey matches this protector part"
 * - "Chest pressure in sympathetic state = same as this IFS part"
 * - "This belief surfaced in your integration journal"
 *
 * Architecture: Option A (unified service) + Light Option B (confirmed connections)
 */
class MasterContextService {

  constructor() {
    // Simple in-memory cache (5 minute TTL)
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get comprehensive therapeutic context for a user
   * This is the main function all AI services should call
   *
   * @param {string} userId - User ID
   * @param {object} options - Configuration options
   * @param {string} options.focus - 'ifs' | 'nervous_system' | 'integration' | 'beliefs' | 'all'
   * @param {number} options.recentDays - Only include data from last N days
   * @param {number} options.maxParts - Max IFS parts to include
   * @param {number} options.maxJournals - Max integration journals to include
   * @param {boolean} options.includeConnections - Include discovered cross-domain connections
   * @param {boolean} options.useCache - Use cached context if available
   * @returns {object} Unified therapeutic context
   */
  async getMasterContext(userId, options = {}) {
    const defaults = {
      focus: 'all',
      recentDays: 90,
      maxParts: 10,
      maxJournals: 5,
      maxSessions: 5,
      includeConnections: true,
      useCache: true
    };

    const opts = { ...defaults, ...options };

    // Check cache
    const cacheKey = `context_${userId}_${JSON.stringify(opts)}`;
    if (opts.useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        console.log('[MasterContext] Returning cached context');
        return cached.data;
      }
    }

    console.log('[MasterContext] Building fresh context for user:', userId);

    try {
      // Build context based on focus
      const context = {
        userId,
        generatedAt: new Date().toISOString(),
        focus: opts.focus
      };

      // Always include user profile basics
      context.userProfile = await this.getUserProfile(userId);

      // IFS Context
      if (opts.focus === 'all' || opts.focus === 'ifs') {
        context.ifs = await this.getIFSContext(userId, opts);
      }

      // Nervous System Context
      if (opts.focus === 'all' || opts.focus === 'nervous_system') {
        context.nervousSystem = await this.getNervousSystemContext(userId, opts);
      }

      // Integration Journals Context
      if (opts.focus === 'all' || opts.focus === 'integration') {
        context.integrationJournals = await this.getIntegrationContext(userId, opts);
      }

      // Core Beliefs Context
      if (opts.focus === 'all' || opts.focus === 'beliefs') {
        context.beliefs = await this.getBeliefContext(userId, opts);
      }

      // Session Intentions & Planning
      if (opts.focus === 'all') {
        context.sessionIntentions = await this.getSessionIntentions(userId, opts);
      }

      // Cross-domain connections (if requested)
      if (opts.includeConnections) {
        context.connections = await this.getTherapeuticConnections(userId, opts);
        context.potentialConnections = await this.discoverPotentialConnections(context);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        data: context
      });

      return context;

    } catch (error) {
      console.error('[MasterContext] Error building context:', error);
      return this.getMinimalContext(userId);
    }
  }

  /**
   * Get user profile basics
   */
  async getUserProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      return {
        name: data?.name || 'User',
        avatar: data?.avatar_url,
        created_at: data?.created_at
      };
    } catch (error) {
      console.error('[MasterContext] Error loading user profile:', error);
      return { name: 'User' };
    }
  }

  /**
   * Get IFS context
   */
  async getIFSContext(userId, opts) {
    try {
      const partsData = await ifsContextService.loadUserParts(userId);
      const recentSessions = await ifsContextService.getRecentSessions(userId, opts.maxSessions);

      // Get top N most recently worked parts
      const topParts = partsData.recentParts.slice(0, opts.maxParts);

      return {
        totalParts: partsData.allParts.length,
        protectorsCount: partsData.protectors.length,
        exilesCount: partsData.exiles.length,
        unburdenedCount: partsData.unburdenedExiles.length,
        recentParts: topParts.map(p => ({
          id: p.id,
          name: p.part_name,
          role: p.part_role,
          location: p.location_in_body,
          feelings: p.part_feelings,
          wants: p.part_wants,
          fears: p.part_fears,
          strategy: p.protective_strategy,
          isExile: p.is_exile,
          unburdened: p.unburdened,
          burdens: p.burdens_carried,
          lastWorkedWith: p.last_worked_with
        })),
        recentSessions: recentSessions.map(s => ({
          id: s.id,
          partName: s.ifs_parts_inventory?.part_name,
          sessionType: s.session_type,
          insights: s.key_insights,
          outcome: s.session_outcome,
          date: s.session_date
        }))
      };
    } catch (error) {
      console.error('[MasterContext] Error loading IFS context:', error);
      return { totalParts: 0, recentParts: [], recentSessions: [] };
    }
  }

  /**
   * Get nervous system context
   */
  async getNervousSystemContext(userId, opts) {
    try {
      const patterns = await polyvagalContextService.getPatternsForAI(userId);
      const nsContext = await polyvagalContextService.getNervousSystemContext(userId);

      return {
        capacity: patterns.capacity,
        awareness: patterns.awareness,
        hasMappedStates: patterns.hasMappedStates,
        knownTriggers: patterns.knownTriggers,
        knownGlimmers: patterns.knownGlimmers,
        individualResources: patterns.individualResources,
        interactiveResources: patterns.interactiveResources,
        ventralPatterns: patterns.ventral,
        sympatheticPatterns: patterns.sympathetic,
        dorsalPatterns: patterns.dorsal,
        context: nsContext
      };
    } catch (error) {
      console.error('[MasterContext] Error loading NS context:', error);
      return { capacity: 'building', awareness: 'beginning' };
    }
  }

  /**
   * Get integration journals context
   */
  async getIntegrationContext(userId, opts) {
    try {
      const { data: journals } = await supabase
        .from('post_session_journals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(opts.maxJournals);

      return {
        totalJournals: journals?.length || 0,
        recentJournals: (journals || []).map(j => ({
          id: j.id,
          sessionId: j.session_id,
          title: j.session_title,
          date: j.created_at,
          // Extract key elements from responses
          visuals: j.responses?.visuals?.visuals,
          emotions: j.responses?.emotions?.emotions,
          somatic: j.responses?.somatic?.somatic,
          movements: j.responses?.movements?.movements,
          relationships: j.responses?.relationships?.relationships,
          realizations: j.responses?.realizations?.realizations,
          integration: j.responses?.integration?.integration,
          natureElements: j.responses?.nature_elements?.nature_elements
        }))
      };
    } catch (error) {
      console.error('[MasterContext] Error loading integration journals:', error);
      return { totalJournals: 0, recentJournals: [] };
    }
  }

  /**
   * Get core beliefs context
   */
  async getBeliefContext(userId, opts) {
    try {
      const { data: assessments } = await supabase
        .from('core_beliefs_assessments')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('assessment_date', { ascending: false })
        .limit(5);

      if (!assessments || assessments.length === 0) {
        return { hasAssessments: false };
      }

      const latest = assessments[0];
      const baseline = assessments.find(a => a.assessment_type === 'baseline');

      return {
        hasAssessments: true,
        latestAssessment: {
          date: latest.assessment_date,
          type: latest.assessment_type,
          scores: {
            value: latest.value_worthiness,
            security: latest.security_safety,
            performance: latest.performance_competence,
            control: latest.control_power,
            love: latest.love_nurturance,
            autonomy: latest.autonomy_independence,
            justice: latest.justice_fairness,
            belonging: latest.belonging_connection,
            trust: latest.others_trust,
            compassion: latest.standards_compassion
          }
        },
        baseline: baseline ? {
          date: baseline.assessment_date,
          scores: {
            value: baseline.value_worthiness,
            security: baseline.security_safety,
            performance: baseline.performance_competence,
            control: baseline.control_power,
            love: baseline.love_nurturance,
            autonomy: baseline.autonomy_independence,
            justice: baseline.justice_fairness,
            belonging: baseline.belonging_connection,
            trust: baseline.others_trust,
            compassion: baseline.standards_compassion
          }
        } : null,
        totalAssessments: assessments.length
      };
    } catch (error) {
      console.error('[MasterContext] Error loading belief context:', error);
      return { hasAssessments: false };
    }
  }

  /**
   * Get session intentions
   */
  async getSessionIntentions(userId, opts) {
    try {
      const { data: intentions } = await supabase
        .from('session_intentions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      return {
        recentIntentions: (intentions || []).map(i => ({
          id: i.id,
          sessionId: i.session_id,
          goals: i.goals,
          intentions: i.intentions,
          date: i.created_at
        }))
      };
    } catch (error) {
      console.error('[MasterContext] Error loading intentions:', error);
      return { recentIntentions: [] };
    }
  }

  /**
   * Get confirmed therapeutic connections
   */
  async getTherapeuticConnections(userId, opts) {
    try {
      const { data: connections } = await supabase
        .from('therapeutic_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('confirmed_by_user', true)
        .order('confidence', { ascending: false })
        .limit(20);

      return (connections || []).map(c => ({
        id: c.id,
        sourceType: c.source_type,
        sourceId: c.source_id,
        targetType: c.target_type,
        targetId: c.target_id,
        connectionType: c.connection_type,
        description: c.connection_description,
        confidence: c.confidence,
        userNotes: c.user_notes
      }));
    } catch (error) {
      console.error('[MasterContext] Error loading connections:', error);
      return [];
    }
  }

  /**
   * Discover potential cross-domain connections
   * This is where the magic happens - AI finds patterns across domains
   */
  async discoverPotentialConnections(context) {
    const connections = [];

    try {
      // Connection Type 1: Somatic matches (body location)
      // e.g., "chest pressure in sympathetic state" = "IFS part in chest"
      if (context.ifs && context.nervousSystem) {
        const somaticMatches = this.findSomaticMatches(
          context.ifs.recentParts,
          context.nervousSystem
        );
        connections.push(...somaticMatches);
      }

      // Connection Type 2: Emotional themes
      // e.g., "shame" in IFS burdens = "shame" in journal emotions
      if (context.ifs && context.integrationJournals) {
        const emotionalMatches = this.findEmotionalThemes(
          context.ifs.recentParts,
          context.integrationJournals.recentJournals
        );
        connections.push(...emotionalMatches);
      }

      // Connection Type 3: Visual symbols
      // e.g., "owl" in journal = "owl-like" part appearance
      if (context.ifs && context.integrationJournals) {
        const visualMatches = this.findVisualSymbols(
          context.ifs.recentParts,
          context.integrationJournals.recentJournals
        );
        connections.push(...visualMatches);
      }

      // Connection Type 4: Belief patterns
      // e.g., low "worthiness" score = "worthless" burden in IFS
      if (context.beliefs && context.ifs) {
        const beliefMatches = this.findBeliefPatterns(
          context.beliefs,
          context.ifs.recentParts
        );
        connections.push(...beliefMatches);
      }

      return connections;

    } catch (error) {
      console.error('[MasterContext] Error discovering connections:', error);
      return [];
    }
  }

  /**
   * Find somatic matches between IFS parts and NS patterns
   */
  findSomaticMatches(parts, nsContext) {
    const matches = [];

    parts.forEach(part => {
      if (!part.location) return;

      const location = part.location.toLowerCase();

      // Check sympathetic patterns
      const sympatheticMatch = nsContext.sympatheticPatterns?.body_sensations?.find(
        sensation => sensation.toLowerCase().includes(location) ||
                    location.includes(sensation.toLowerCase())
      );

      if (sympatheticMatch) {
        matches.push({
          type: 'somatic_match',
          confidence: 0.75,
          description: `Part "${part.name}" is located in ${part.location}, which matches sympathetic activation pattern: "${sympatheticMatch}"`,
          sourceType: 'ifs_part',
          sourceId: part.id,
          targetType: 'ns_pattern',
          targetId: null,
          aiSuggestion: `When this part activates, you might notice sympathetic nervous system activation in the same location.`
        });
      }

      // Check dorsal patterns
      const dorsalMatch = nsContext.dorsalPatterns?.body_sensations?.find(
        sensation => sensation.toLowerCase().includes(location) ||
                    location.includes(sensation.toLowerCase())
      );

      if (dorsalMatch) {
        matches.push({
          type: 'somatic_match',
          confidence: 0.75,
          description: `Part "${part.name}" is located in ${part.location}, which matches dorsal activation pattern: "${dorsalMatch}"`,
          sourceType: 'ifs_part',
          sourceId: part.id,
          targetType: 'ns_pattern',
          targetId: null,
          aiSuggestion: `When this part is present, you might experience dorsal shutdown in the same area.`
        });
      }
    });

    return matches;
  }

  /**
   * Find emotional theme matches between IFS and journals
   */
  findEmotionalThemes(parts, journals) {
    const matches = [];

    parts.forEach(part => {
      journals.forEach(journal => {
        // Check if part's burdens appear in journal emotions
        if (part.burdens && journal.emotions) {
          part.burdens.forEach(burden => {
            if (journal.emotions.toLowerCase().includes(burden.toLowerCase())) {
              matches.push({
                type: 'emotional_theme',
                confidence: 0.80,
                description: `Part "${part.name}" carries burden "${burden}" which appeared in integration journal "${journal.title}"`,
                sourceType: 'ifs_part',
                sourceId: part.id,
                targetType: 'integration_journal',
                targetId: journal.id,
                aiSuggestion: `The emotion "${burden}" from your ${journal.title} session might be connected to the ${part.name} part.`
              });
            }
          });
        }

        // Check if part's feelings appear in journal
        if (part.feelings && journal.emotions) {
          const feelingsLower = part.feelings.toLowerCase();
          const emotionsLower = journal.emotions.toLowerCase();

          if (emotionsLower.includes(feelingsLower.substring(0, 20)) ||
              feelingsLower.includes(emotionsLower.substring(0, 20))) {
            matches.push({
              type: 'emotional_theme',
              confidence: 0.70,
              description: `Emotional themes match between part "${part.name}" and journal "${journal.title}"`,
              sourceType: 'ifs_part',
              sourceId: part.id,
              targetType: 'integration_journal',
              targetId: journal.id,
              aiSuggestion: `The feelings in this part seem related to what you experienced in your ${journal.title} session.`
            });
          }
        }
      });
    });

    return matches;
  }

  /**
   * Find visual symbol matches
   */
  findVisualSymbols(parts, journals) {
    const matches = [];

    // Common symbolic animals and objects
    const symbols = [
      'owl', 'bird', 'wolf', 'bear', 'lion', 'eagle', 'snake', 'dragon',
      'tree', 'mountain', 'ocean', 'river', 'fire', 'light', 'shadow',
      'child', 'warrior', 'guide', 'guardian'
    ];

    parts.forEach(part => {
      if (!part.name) return;

      journals.forEach(journal => {
        if (!journal.visuals) return;

        const partName = part.name.toLowerCase();
        const visuals = journal.visuals.toLowerCase();

        // Check for direct symbol matches
        symbols.forEach(symbol => {
          if (partName.includes(symbol) && visuals.includes(symbol)) {
            matches.push({
              type: 'visual_symbol',
              confidence: 0.85,
              description: `Part "${part.name}" shares visual symbolism with integration journal "${journal.title}" (${symbol})`,
              sourceType: 'ifs_part',
              sourceId: part.id,
              targetType: 'integration_journal',
              targetId: journal.id,
              aiSuggestion: `Remember the ${symbol} from your ${journal.title} session? That might be connected to this ${part.name} part.`
            });
          }
        });
      });
    });

    return matches;
  }

  /**
   * Find belief pattern matches
   */
  findBeliefPatterns(beliefs, parts) {
    const matches = [];

    if (!beliefs.hasAssessments || !beliefs.latestAssessment) return matches;

    const scores = beliefs.latestAssessment.scores;
    const lowScores = Object.entries(scores)
      .filter(([_, score]) => score !== null && score <= 4)
      .map(([domain]) => domain);

    // Map belief domains to common burden words
    const beliefToBurden = {
      value: ['worthless', 'defective', 'flawed', 'unworthy', 'shame'],
      security: ['unsafe', 'danger', 'threat', 'fear', 'terror'],
      performance: ['incompetent', 'failure', 'inadequate'],
      control: ['powerless', 'helpless', 'trapped'],
      love: ['unloved', 'abandoned', 'rejected', 'alone'],
      autonomy: ['dependent', 'weak', 'controlled'],
      belonging: ['outsider', 'alien', 'excluded', 'isolated'],
      trust: ['betrayed', 'hurt', 'unsafe']
    };

    lowScores.forEach(domain => {
      const relatedBurdens = beliefToBurden[domain] || [];

      parts.forEach(part => {
        if (!part.burdens) return;

        part.burdens.forEach(burden => {
          const burdenLower = burden.toLowerCase();
          if (relatedBurdens.some(b => burdenLower.includes(b))) {
            matches.push({
              type: 'belief_pattern',
              confidence: 0.80,
              description: `Part "${part.name}" carries burden "${burden}" which relates to low ${domain} belief score (${scores[domain]}/10)`,
              sourceType: 'ifs_part',
              sourceId: part.id,
              targetType: 'belief_domain',
              targetId: domain,
              aiSuggestion: `Your ${domain} belief score is low, and the ${part.name} part seems to carry that burden of "${burden}".`
            });
          }
        });
      });
    });

    return matches;
  }

  /**
   * Get minimal context (fallback)
   */
  getMinimalContext(userId) {
    return {
      userId,
      generatedAt: new Date().toISOString(),
      error: true,
      message: 'Could not load full context',
      userProfile: { name: 'User' }
    };
  }

  /**
   * Clear cache for a user (call after data updates)
   */
  clearCache(userId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[MasterContext] Cleared cache for user ${userId}`);
  }

  /**
   * Save a therapeutic connection (when user confirms AI suggestion)
   */
  async saveConnection(userId, connectionData) {
    try {
      const { data, error } = await supabase
        .from('therapeutic_connections')
        .insert({
          user_id: userId,
          source_type: connectionData.sourceType,
          source_id: connectionData.sourceId,
          source_description: connectionData.sourceDescription,
          target_type: connectionData.targetType,
          target_id: connectionData.targetId,
          target_description: connectionData.targetDescription,
          connection_type: connectionData.type,
          connection_description: connectionData.description,
          confidence: connectionData.confidence,
          discovered_by: connectionData.discoveredBy || 'ai',
          confirmed_by_user: connectionData.confirmed || false,
          user_notes: connectionData.userNotes,
          integration_insight: connectionData.insight
        })
        .select()
        .single();

      if (error) throw error;

      // Clear cache to include new connection
      this.clearCache(userId);

      return data;
    } catch (error) {
      console.error('[MasterContext] Error saving connection:', error);
      return null;
    }
  }
}

export default new MasterContextService();
