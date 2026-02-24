/**
 * Unit Tests for masterContextService.js
 *
 * Tests context aggregation, cross-domain connection discovery,
 * caching behavior, and error resilience.
 */

const {
  MOCK_USER_ID,
  MOCK_IFS_PARTS,
  MOCK_POLYVAGAL_STATES,
  MOCK_JOURNALS,
  MOCK_BELIEFS,
  MOCK_USER_PROFILE
} = require('../helpers/aiTestFixtures');

// Helper: create a chainable Supabase query that resolves on await
function createChain(resolvedData, resolvedError = null) {
  const result = { data: resolvedData, error: resolvedError };
  const chain = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    neq: jest.fn(() => chain),
    order: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    single: jest.fn(() => Promise.resolve(result)),
    insert: jest.fn(() => chain),
    update: jest.fn(() => chain),
    // Make the chain itself thenable for `await supabase.from().select()...`
    then: jest.fn((resolve, reject) => {
      if (resolvedError && reject) reject(resolvedError);
      else if (resolve) resolve(result);
    })
  };
  return chain;
}

// Mock dependencies
jest.mock('../../lib/config', () => ({
  __esModule: true,
  default: { anthropicApiKey: 'test-api-key' }
}));

jest.mock('../../lib/supabase', () => ({
  __esModule: true,
  supabase: {
    from: jest.fn()
  }
}));

jest.mock('../../lib/ifsContextService', () => ({
  __esModule: true,
  default: {
    loadUserParts: jest.fn(),
    getRecentSessions: jest.fn()
  }
}));

jest.mock('../../lib/polyvagalContextService', () => ({
  __esModule: true,
  default: {
    getPatternsForAI: jest.fn(),
    getNervousSystemContext: jest.fn()
  }
}));

jest.mock('../../lib/metricsService', () => ({
  __esModule: true,
  default: {
    logAIMetric: jest.fn(),
    logError: jest.fn(),
    logRoutingDecision: jest.fn(),
    constructor: {
      extractTokens: jest.fn(),
      calculateCost: jest.fn()
    }
  }
}));

describe('MasterContextService', () => {
  let masterContextService;
  let supabase;
  let ifsContextService;
  let polyvagalContextService;
  let metricsService;

  beforeAll(() => {
    masterContextService = require('../../lib/masterContextService').default;
    supabase = require('../../lib/supabase').supabase;
    ifsContextService = require('../../lib/ifsContextService').default;
    polyvagalContextService = require('../../lib/polyvagalContextService').default;
    metricsService = require('../../lib/metricsService').default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    masterContextService.cache = new Map(); // Full cache reset

    // Set up default mocks for all domains
    setupDefaultMocks();
  });

  function setupDefaultMocks() {
    // Supabase table mocks
    supabase.from.mockImplementation((table) => {
      switch (table) {
        case 'profiles':
          return createChain(MOCK_USER_PROFILE);
        case 'post_session_journals':
          return createChain(MOCK_JOURNALS);
        case 'core_beliefs_assessments':
          return createChain([{
            assessment_date: '2026-02-20T12:00:00Z',
            assessment_type: 'follow_up',
            completed: true,
            value_worthiness: 3,
            security_safety: 5,
            performance_competence: 4,
            control_power: 6,
            love_nurturance: 7,
            autonomy_independence: 8,
            justice_fairness: 7,
            belonging_connection: 4,
            others_trust: 5,
            standards_compassion: 6
          }]);
        case 'session_intentions':
          return createChain([]);
        case 'therapeutic_connections':
          return createChain([]);
        default:
          return createChain([]);
      }
    });

    // IFS context service
    ifsContextService.loadUserParts.mockResolvedValue({
      allParts: MOCK_IFS_PARTS,
      recentParts: MOCK_IFS_PARTS,
      protectors: MOCK_IFS_PARTS.filter(p => !p.is_exile),
      exiles: MOCK_IFS_PARTS.filter(p => p.is_exile),
      unburdenedExiles: MOCK_IFS_PARTS.filter(p => p.unburdened)
    });

    ifsContextService.getRecentSessions.mockResolvedValue([]);

    // Polyvagal context service
    polyvagalContextService.getPatternsForAI.mockResolvedValue(MOCK_POLYVAGAL_STATES);
    polyvagalContextService.getNervousSystemContext.mockResolvedValue({
      currentState: 'ventral',
      recentCheckins: []
    });
  }

  // =========================================================================
  // GET MASTER CONTEXT
  // =========================================================================

  describe('getMasterContext', () => {
    it('should return context with userId and timestamp', async () => {
      const context = await masterContextService.getMasterContext(MOCK_USER_ID);

      expect(context.userId).toBe(MOCK_USER_ID);
      expect(context.generatedAt).toBeDefined();
    });

    it('should include user profile', async () => {
      const context = await masterContextService.getMasterContext(MOCK_USER_ID);

      expect(context.userProfile).toBeDefined();
      expect(context.userProfile.name).toBe('Test User');
    });

    it('should load IFS context when focus is all', async () => {
      const context = await masterContextService.getMasterContext(MOCK_USER_ID, {
        focus: 'all'
      });

      expect(context.ifs).toBeDefined();
      expect(context.ifs.totalParts).toBe(3);
      expect(ifsContextService.loadUserParts).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('should load IFS context when focus is ifs', async () => {
      const context = await masterContextService.getMasterContext(MOCK_USER_ID, {
        focus: 'ifs'
      });

      expect(context.ifs).toBeDefined();
      expect(context.nervousSystem).toBeUndefined();
    });

    it('should load nervous system context when focus is nervous_system', async () => {
      const context = await masterContextService.getMasterContext(MOCK_USER_ID, {
        focus: 'nervous_system'
      });

      expect(context.nervousSystem).toBeDefined();
      expect(context.nervousSystem.capacity).toBe('developing');
      expect(context.ifs).toBeUndefined();
    });

    it('should load integration journals when focus is integration', async () => {
      const context = await masterContextService.getMasterContext(MOCK_USER_ID, {
        focus: 'integration'
      });

      expect(context.integrationJournals).toBeDefined();
    });

    it('should load beliefs when focus is beliefs', async () => {
      const context = await masterContextService.getMasterContext(MOCK_USER_ID, {
        focus: 'beliefs'
      });

      expect(context.beliefs).toBeDefined();
    });

    it('should respect maxParts option', async () => {
      const context = await masterContextService.getMasterContext(MOCK_USER_ID, {
        focus: 'ifs',
        maxParts: 2
      });

      expect(context.ifs.recentParts.length).toBeLessThanOrEqual(2);
    });

    it('should use cache within TTL', async () => {
      // First call - no cache
      await masterContextService.getMasterContext(MOCK_USER_ID);
      const firstCallCount = ifsContextService.loadUserParts.mock.calls.length;

      // Second call - should use cache
      await masterContextService.getMasterContext(MOCK_USER_ID);
      const secondCallCount = ifsContextService.loadUserParts.mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount); // No additional calls
    });

    it('should bypass cache when useCache=false', async () => {
      // First call - populates cache
      await masterContextService.getMasterContext(MOCK_USER_ID);

      // Second call with useCache=false
      await masterContextService.getMasterContext(MOCK_USER_ID, { useCache: false });

      // Should have called loadUserParts twice
      expect(ifsContextService.loadUserParts.mock.calls.length).toBe(2);
    });

    it('should include connections when includeConnections=true', async () => {
      const context = await masterContextService.getMasterContext(MOCK_USER_ID, {
        includeConnections: true
      });

      expect(context.connections).toBeDefined();
      expect(context.potentialConnections).toBeDefined();
    });

    it('should not include connections when includeConnections=false', async () => {
      const context = await masterContextService.getMasterContext(MOCK_USER_ID, {
        includeConnections: false
      });

      expect(context.connections).toBeUndefined();
      expect(context.potentialConnections).toBeUndefined();
    });

    it('should log success metrics', async () => {
      await masterContextService.getMasterContext(MOCK_USER_ID);

      expect(metricsService.logAIMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceName: 'masterContext',
          operation: 'getMasterContext',
          status: 'success'
        })
      );
    });

    it('should log cache hit metrics', async () => {
      await masterContextService.getMasterContext(MOCK_USER_ID);
      jest.clearAllMocks();
      await masterContextService.getMasterContext(MOCK_USER_ID);

      expect(metricsService.logAIMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ cacheHit: true })
        })
      );
    });
  });

  // =========================================================================
  // GET USER PROFILE
  // =========================================================================

  describe('getUserProfile', () => {
    it('should return user profile from database', async () => {
      const profile = await masterContextService.getUserProfile(MOCK_USER_ID);

      expect(profile.name).toBe('Test User');
    });

    it('should return default name when profile not found', async () => {
      supabase.from.mockImplementation(() => createChain(null));

      const profile = await masterContextService.getUserProfile(MOCK_USER_ID);

      expect(profile.name).toBe('User');
    });

    it('should handle query errors gracefully', async () => {
      supabase.from.mockImplementation(() => {
        throw new Error('Database error');
      });

      const profile = await masterContextService.getUserProfile(MOCK_USER_ID);

      expect(profile.name).toBe('User');
    });
  });

  // =========================================================================
  // DOMAIN-SPECIFIC CONTEXT LOADERS
  // =========================================================================

  describe('getIFSContext', () => {
    it('should return IFS parts data with correct shape', async () => {
      const opts = { maxParts: 10, maxSessions: 5 };
      const context = await masterContextService.getIFSContext(MOCK_USER_ID, opts);

      expect(context.totalParts).toBe(3);
      expect(context.protectorsCount).toBe(2);
      expect(context.exilesCount).toBe(1);
      expect(context.recentParts).toBeInstanceOf(Array);
    });

    it('should handle empty parts gracefully', async () => {
      ifsContextService.loadUserParts.mockResolvedValue({
        allParts: [],
        recentParts: [],
        protectors: [],
        exiles: [],
        unburdenedExiles: []
      });

      const context = await masterContextService.getIFSContext(MOCK_USER_ID, { maxParts: 10, maxSessions: 5 });

      expect(context.totalParts).toBe(0);
      expect(context.recentParts).toEqual([]);
    });

    it('should handle IFS service error gracefully', async () => {
      ifsContextService.loadUserParts.mockRejectedValue(new Error('DB error'));

      const context = await masterContextService.getIFSContext(MOCK_USER_ID, { maxParts: 10, maxSessions: 5 });

      expect(context.totalParts).toBe(0);
      expect(context.recentParts).toEqual([]);
    });
  });

  describe('getNervousSystemContext', () => {
    it('should return NS data with correct shape', async () => {
      const context = await masterContextService.getNervousSystemContext(MOCK_USER_ID, {});

      expect(context.capacity).toBe('developing');
      expect(context.hasMappedStates).toBe(true);
    });

    it('should handle NS service error gracefully', async () => {
      polyvagalContextService.getPatternsForAI.mockRejectedValue(new Error('Error'));

      const context = await masterContextService.getNervousSystemContext(MOCK_USER_ID, {});

      expect(context.capacity).toBe('building');
    });
  });

  describe('getBeliefContext', () => {
    it('should return belief data with correct shape', async () => {
      const context = await masterContextService.getBeliefContext(MOCK_USER_ID, {});

      expect(context.hasAssessments).toBe(true);
      expect(context.latestAssessment).toBeDefined();
      expect(context.latestAssessment.scores).toBeDefined();
    });

    it('should handle no assessments', async () => {
      supabase.from.mockImplementation((table) => {
        if (table === 'core_beliefs_assessments') return createChain([]);
        return createChain([]);
      });

      const context = await masterContextService.getBeliefContext(MOCK_USER_ID, {});

      expect(context.hasAssessments).toBe(false);
    });

    it('should handle query error gracefully', async () => {
      supabase.from.mockImplementation((table) => {
        if (table === 'core_beliefs_assessments') {
          throw new Error('DB error');
        }
        return createChain([]);
      });

      const context = await masterContextService.getBeliefContext(MOCK_USER_ID, {});

      expect(context.hasAssessments).toBe(false);
    });
  });

  // =========================================================================
  // DISCOVER POTENTIAL CONNECTIONS
  // =========================================================================

  describe('discoverPotentialConnections', () => {
    it('should find somatic matches between IFS parts and NS patterns', async () => {
      const context = {
        ifs: {
          recentParts: MOCK_IFS_PARTS.map(p => ({
            id: p.id,
            name: p.part_name,
            location: p.location_in_body,
            feelings: p.part_feelings,
            burdens: p.burdens_carried
          }))
        },
        nervousSystem: MOCK_POLYVAGAL_STATES,
        integrationJournals: { recentJournals: MOCK_JOURNALS },
        beliefs: MOCK_BELIEFS
      };

      const connections = await masterContextService.discoverPotentialConnections(context);

      // Guardian part is in "chest" and sympathetic has "chest tightness"
      const somaticMatch = connections.find(c => c.type === 'somatic_match');
      expect(somaticMatch).toBeDefined();
      expect(somaticMatch.sourceType).toBe('ifs_part');
      expect(somaticMatch.targetType).toBe('ns_pattern');
    });

    it('should find emotional themes between IFS parts and journals', async () => {
      const context = {
        ifs: {
          recentParts: [{
            id: 'part-002',
            name: 'Wounded Child',
            location: 'belly',
            feelings: 'fear',
            burdens: ['fear']
          }]
        },
        integrationJournals: {
          recentJournals: [{
            id: 'journal-001',
            title: 'Psilocybin Journey',
            emotions: 'fear, then deep love and acceptance',
            visuals: 'bright light'
          }]
        }
      };

      const connections = await masterContextService.discoverPotentialConnections(context);

      const emotionalMatch = connections.find(c => c.type === 'emotional_theme');
      expect(emotionalMatch).toBeDefined();
    });

    it('should find visual symbol matches', async () => {
      const context = {
        ifs: {
          recentParts: [{
            id: 'part-003',
            name: 'Wise Owl',
            location: 'head',
            burdens: []
          }]
        },
        integrationJournals: {
          recentJournals: [{
            id: 'journal-001',
            title: 'Psilocybin Journey',
            visuals: 'A great owl appeared in a forest',
            emotions: 'awe'
          }]
        }
      };

      const connections = await masterContextService.discoverPotentialConnections(context);

      const visualMatch = connections.find(c => c.type === 'visual_symbol');
      expect(visualMatch).toBeDefined();
      expect(visualMatch.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should find belief patterns linking low scores to burdens', async () => {
      const context = {
        ifs: {
          recentParts: [{
            id: 'part-002',
            name: 'Wounded Child',
            location: 'belly',
            burdens: ['worthlessness', 'shame']
          }]
        },
        beliefs: {
          hasAssessments: true,
          latestAssessment: {
            scores: {
              value: 3, // Low → should match 'worthless' burden
              security: 8,
              performance: 7,
              control: 7,
              love: 7,
              autonomy: 7,
              belonging: 4,
              trust: 7
            }
          }
        }
      };

      const connections = await masterContextService.discoverPotentialConnections(context);

      const beliefMatch = connections.find(c => c.type === 'belief_pattern');
      expect(beliefMatch).toBeDefined();
      expect(beliefMatch.targetType).toBe('belief_domain');
    });

    it('should return empty array when no context available', async () => {
      const connections = await masterContextService.discoverPotentialConnections({});
      expect(connections).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const context = {
        ifs: { recentParts: null }, // This will cause iteration error
        nervousSystem: MOCK_POLYVAGAL_STATES
      };

      const connections = await masterContextService.discoverPotentialConnections(context);
      expect(connections).toEqual([]);
    });
  });

  // =========================================================================
  // FIND SOMATIC MATCHES
  // =========================================================================

  describe('findSomaticMatches', () => {
    it('should match part location with sympathetic body sensations', () => {
      const parts = [{
        id: 'part-001',
        name: 'Guardian',
        location: 'chest'
      }];

      const nsContext = {
        sympatheticPatterns: { body_sensations: ['chest tightness', 'racing heart'] },
        dorsalPatterns: { body_sensations: ['heaviness in belly'] }
      };

      const matches = masterContextService.findSomaticMatches(parts, nsContext);

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('somatic_match');
      expect(matches[0].confidence).toBe(0.75);
    });

    it('should match part location with dorsal body sensations', () => {
      const parts = [{
        id: 'part-002',
        name: 'Wounded Child',
        location: 'belly'
      }];

      const nsContext = {
        sympatheticPatterns: { body_sensations: ['chest tightness'] },
        dorsalPatterns: { body_sensations: ['heaviness in belly'] }
      };

      const matches = masterContextService.findSomaticMatches(parts, nsContext);

      expect(matches.some(m => m.description.includes('dorsal'))).toBe(true);
    });

    it('should skip parts without location', () => {
      const parts = [{ id: 'p1', name: 'Part', location: null }];
      const nsContext = {
        sympatheticPatterns: { body_sensations: ['chest tightness'] }
      };

      const matches = masterContextService.findSomaticMatches(parts, nsContext);
      expect(matches).toEqual([]);
    });

    it('should return empty when no matches', () => {
      const parts = [{ id: 'p1', name: 'Part', location: 'left knee' }];
      const nsContext = {
        sympatheticPatterns: { body_sensations: ['chest tightness'] },
        dorsalPatterns: { body_sensations: ['heaviness in belly'] }
      };

      const matches = masterContextService.findSomaticMatches(parts, nsContext);
      expect(matches).toEqual([]);
    });
  });

  // =========================================================================
  // FIND EMOTIONAL THEMES
  // =========================================================================

  describe('findEmotionalThemes', () => {
    it('should match burden from part with journal emotions', () => {
      const parts = [{
        id: 'part-001',
        name: 'Guardian',
        burdens: ['fear'],
        feelings: 'anxious'
      }];

      const journals = [{
        id: 'j1',
        title: 'Journey',
        emotions: 'Fear was overwhelming then transformed to love'
      }];

      const matches = masterContextService.findEmotionalThemes(parts, journals);

      expect(matches.some(m => m.type === 'emotional_theme')).toBe(true);
    });

    it('should return empty when no emotional overlap', () => {
      const parts = [{
        id: 'p1',
        name: 'Part',
        burdens: ['rage'],
        feelings: 'angry'
      }];

      const journals = [{
        id: 'j1',
        title: 'Journey',
        emotions: 'peace and love'
      }];

      const matches = masterContextService.findEmotionalThemes(parts, journals);
      // rage doesn't appear in 'peace and love'
      expect(matches.filter(m => m.description.includes('rage')).length).toBe(0);
    });
  });

  // =========================================================================
  // CLEAR CACHE
  // =========================================================================

  describe('clearCache', () => {
    it('should remove cached context for user', async () => {
      // Populate cache
      await masterContextService.getMasterContext(MOCK_USER_ID);
      expect(masterContextService.cache.size).toBeGreaterThan(0);

      masterContextService.clearCache(MOCK_USER_ID);

      // Verify no keys for this user remain
      for (const key of masterContextService.cache.keys()) {
        expect(key).not.toContain(MOCK_USER_ID);
      }
    });

    it('should not affect other users cache', async () => {
      const otherUserId = 'other-user-456';

      await masterContextService.getMasterContext(MOCK_USER_ID);

      // Manually add another user's cache
      masterContextService.cache.set(`context_${otherUserId}_test`, {
        timestamp: Date.now(),
        data: { userId: otherUserId }
      });

      masterContextService.clearCache(MOCK_USER_ID);

      expect(masterContextService.cache.has(`context_${otherUserId}_test`)).toBe(true);
    });
  });

  // =========================================================================
  // GET MINIMAL CONTEXT (fallback)
  // =========================================================================

  describe('getMinimalContext', () => {
    it('should return minimal context with error flag', () => {
      const context = masterContextService.getMinimalContext(MOCK_USER_ID);

      expect(context.userId).toBe(MOCK_USER_ID);
      expect(context.error).toBe(true);
      expect(context.userProfile.name).toBe('User');
      expect(context.generatedAt).toBeDefined();
    });
  });

  // =========================================================================
  // ERROR RESILIENCE
  // =========================================================================

  describe('Error Resilience', () => {
    it('should return minimal context when getMasterContext throws', async () => {
      // Force an error that propagates past the individual domain try/catches
      // by making getUserProfile throw an error that isn't caught
      // We need to mock the entire object prototype to force an uncaught error
      const originalGetUserProfile = masterContextService.getUserProfile;
      masterContextService.getUserProfile = jest.fn().mockImplementation(() => {
        throw new Error('Catastrophic failure');
      });

      const context = await masterContextService.getMasterContext(MOCK_USER_ID, {
        useCache: false
      });

      expect(context.error).toBe(true);
      expect(context.userId).toBe(MOCK_USER_ID);

      // Restore
      masterContextService.getUserProfile = originalGetUserProfile;
    });

    it('should log error when getMasterContext fails', async () => {
      const originalGetUserProfile = masterContextService.getUserProfile;
      masterContextService.getUserProfile = jest.fn().mockImplementation(() => {
        throw new Error('Database down');
      });

      await masterContextService.getMasterContext(MOCK_USER_ID, { useCache: false });

      expect(metricsService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceName: 'masterContext',
          operation: 'getMasterContext'
        })
      );

      masterContextService.getUserProfile = originalGetUserProfile;
    });

    it('should still return IFS context when NS service fails', async () => {
      polyvagalContextService.getPatternsForAI.mockRejectedValue(new Error('NS down'));

      const context = await masterContextService.getMasterContext(MOCK_USER_ID, {
        focus: 'all',
        useCache: false
      });

      // IFS should still work
      expect(context.ifs).toBeDefined();
      expect(context.ifs.totalParts).toBe(3);
      // NS should have fallback
      expect(context.nervousSystem.capacity).toBe('building');
    });
  });
});
