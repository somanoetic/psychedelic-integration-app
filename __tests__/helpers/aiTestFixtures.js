/**
 * Shared Test Fixtures for AI Service Tests
 *
 * Provides reusable mock data and helpers for consistent, DRY testing
 * across all AI service test suites.
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const MOCK_USER_ID = 'test-user-abc-123';
const MOCK_SESSION_ID = 'test-session-xyz-456';

// =============================================================================
// CLAUDE API MOCK HELPERS
// =============================================================================

/**
 * Create a mock successful Claude API response
 */
function mockClaudeResponse(text, inputTokens = 500, outputTokens = 100) {
  return {
    ok: true,
    json: async () => ({
      content: [{ text }],
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens
      }
    })
  };
}

/**
 * Create a mock failed Claude API response
 */
function mockClaudeError(status = 500, message = 'Internal Server Error') {
  return {
    ok: false,
    status,
    json: async () => ({
      error: { type: 'api_error', message }
    })
  };
}

// =============================================================================
// SUPABASE MOCK HELPERS
// =============================================================================

/**
 * Create a chainable Supabase query mock
 * Supports: .select().eq().order().limit().single()
 */
function mockSupabaseQuery(data = [], error = null) {
  const chain = {
    select: jest.fn().mockReturnValue(chain),
    eq: jest.fn().mockReturnValue(chain),
    neq: jest.fn().mockReturnValue(chain),
    gt: jest.fn().mockReturnValue(chain),
    lt: jest.fn().mockReturnValue(chain),
    gte: jest.fn().mockReturnValue(chain),
    lte: jest.fn().mockReturnValue(chain),
    order: jest.fn().mockReturnValue(chain),
    limit: jest.fn().mockReturnValue(chain),
    single: jest.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
    insert: jest.fn().mockReturnValue(chain),
    update: jest.fn().mockReturnValue(chain),
    then: jest.fn((resolve) => resolve({ data, error }))
  };

  // Make it thenable (for await)
  chain[Symbol.for('nodejs.util.promisify.custom')] = () => Promise.resolve({ data, error });
  // Direct await resolves to { data, error }
  const promise = Promise.resolve({ data, error });
  Object.assign(promise, chain);

  return chain;
}

// =============================================================================
// THERAPEUTIC MOCK DATA
// =============================================================================

const MOCK_IFS_PARTS = [
  {
    id: 'part-001',
    part_name: 'Guardian',
    name: 'Guardian',
    part_role: 'manager',
    role: 'manager',
    location_in_body: 'chest',
    location: 'chest',
    part_feelings: 'anxious, vigilant',
    feelings: 'anxious, vigilant',
    part_wants: 'to keep everyone safe',
    wants: 'to keep everyone safe',
    part_fears: 'losing control',
    fears: 'losing control',
    protective_strategy: 'hypervigilance',
    strategy: 'hypervigilance',
    is_exile: false,
    isExile: false,
    unburdened: false,
    burdens_carried: ['fear', 'responsibility'],
    burdens: ['fear', 'responsibility'],
    last_worked_with: '2026-02-20T10:00:00Z',
    lastWorkedWith: '2026-02-20T10:00:00Z'
  },
  {
    id: 'part-002',
    part_name: 'Wounded Child',
    name: 'Wounded Child',
    part_role: 'exile',
    role: 'exile',
    location_in_body: 'belly',
    location: 'belly',
    part_feelings: 'scared, alone',
    feelings: 'scared, alone',
    part_wants: 'to be seen and held',
    wants: 'to be seen and held',
    part_fears: 'abandonment',
    fears: 'abandonment',
    protective_strategy: null,
    strategy: null,
    is_exile: true,
    isExile: true,
    unburdened: false,
    burdens_carried: ['shame', 'worthlessness'],
    burdens: ['shame', 'worthlessness'],
    last_worked_with: '2026-02-18T14:00:00Z',
    lastWorkedWith: '2026-02-18T14:00:00Z'
  },
  {
    id: 'part-003',
    part_name: 'Wise Owl',
    name: 'Wise Owl',
    part_role: 'self-like',
    role: 'self-like',
    location_in_body: 'head',
    location: 'head',
    part_feelings: 'calm, curious',
    feelings: 'calm, curious',
    part_wants: 'understanding',
    wants: 'understanding',
    part_fears: null,
    fears: null,
    protective_strategy: null,
    strategy: null,
    is_exile: false,
    isExile: false,
    unburdened: true,
    burdens_carried: [],
    burdens: [],
    last_worked_with: '2026-02-15T09:00:00Z',
    lastWorkedWith: '2026-02-15T09:00:00Z'
  }
];

const MOCK_POLYVAGAL_STATES = {
  capacity: 'developing',
  awareness: 'growing',
  hasMappedStates: true,
  knownTriggers: ['loud noises', 'conflict'],
  knownGlimmers: ['nature', 'music', 'deep breathing'],
  individualResources: ['journaling', 'walking'],
  interactiveResources: ['trusted friend', 'therapy'],
  ventral: { body_sensations: ['warmth in chest', 'relaxed shoulders'] },
  sympathetic: { body_sensations: ['chest tightness', 'racing heart'] },
  dorsal: { body_sensations: ['heaviness in belly', 'numbness'] },
  ventralPatterns: { body_sensations: ['warmth in chest', 'relaxed shoulders'] },
  sympatheticPatterns: { body_sensations: ['chest tightness', 'racing heart'] },
  dorsalPatterns: { body_sensations: ['heaviness in belly', 'numbness'] }
};

const MOCK_JOURNALS = [
  {
    id: 'journal-001',
    session_id: 'session-001',
    session_title: 'Psilocybin Journey',
    title: 'Psilocybin Journey',
    created_at: '2026-02-19T20:00:00Z',
    date: '2026-02-19T20:00:00Z',
    responses: {
      visuals: { visuals: 'A great owl appeared in a forest of light' },
      emotions: { emotions: 'fear, then deep love and acceptance' },
      somatic: { somatic: 'warmth spreading from heart outward' },
      movements: { movements: 'gentle rocking' },
      relationships: { relationships: 'felt connected to mother' },
      realizations: { realizations: 'I am not my shame' },
      integration: { integration: 'Practice self-compassion daily' },
      nature_elements: { nature_elements: 'forest, moonlight, water' }
    },
    visuals: 'A great owl appeared in a forest of light',
    emotions: 'fear, then deep love and acceptance',
    somatic: 'warmth spreading from heart outward',
    realizations: 'I am not my shame'
  },
  {
    id: 'journal-002',
    session_id: 'session-002',
    session_title: 'Breathwork Session',
    title: 'Breathwork Session',
    created_at: '2026-02-15T18:00:00Z',
    date: '2026-02-15T18:00:00Z',
    responses: {
      visuals: { visuals: 'Saw a river flowing through a dark cave' },
      emotions: { emotions: 'sadness, then relief and peace' },
      somatic: { somatic: 'tension released from shoulders' },
      movements: { movements: 'shaking, then stillness' },
      relationships: { relationships: null },
      realizations: { realizations: 'Grief needs space to move' },
      integration: { integration: 'Allow tears when they come' },
      nature_elements: { nature_elements: 'river, cave, stones' }
    },
    visuals: 'Saw a river flowing through a dark cave',
    emotions: 'sadness, then relief and peace',
    somatic: 'tension released from shoulders',
    realizations: 'Grief needs space to move'
  }
];

const MOCK_BELIEFS = {
  hasAssessments: true,
  latestAssessment: {
    date: '2026-02-20T12:00:00Z',
    type: 'follow_up',
    scores: {
      value: 3,
      security: 5,
      performance: 4,
      control: 6,
      love: 7,
      autonomy: 8,
      justice: 7,
      belonging: 4,
      trust: 5,
      compassion: 6
    }
  },
  baseline: {
    date: '2026-01-15T12:00:00Z',
    scores: {
      value: 2,
      security: 3,
      performance: 3,
      control: 4,
      love: 5,
      autonomy: 6,
      justice: 6,
      belonging: 3,
      trust: 4,
      compassion: 4
    }
  },
  totalAssessments: 3
};

const MOCK_USER_PROFILE = {
  name: 'Test User',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z'
};

// =============================================================================
// COMMON MOCK SETUP HELPERS
// =============================================================================

/**
 * Set up standard mocks for config, supabase, and metricsService.
 * Call this pattern in each test file's jest.mock() declarations.
 */
const STANDARD_MOCKS = {
  config: {
    default: { anthropicApiKey: 'test-api-key' }
  },
  metricsService: {
    default: {
      logAIMetric: jest.fn(),
      logError: jest.fn(),
      logRoutingDecision: jest.fn(),
      constructor: {
        extractTokens: jest.fn((response) => response?.usage || null),
        calculateCost: jest.fn(() => 0.001)
      }
    }
  }
};

module.exports = {
  MOCK_USER_ID,
  MOCK_SESSION_ID,
  mockClaudeResponse,
  mockClaudeError,
  mockSupabaseQuery,
  MOCK_IFS_PARTS,
  MOCK_POLYVAGAL_STATES,
  MOCK_JOURNALS,
  MOCK_BELIEFS,
  MOCK_USER_PROFILE,
  STANDARD_MOCKS
};
