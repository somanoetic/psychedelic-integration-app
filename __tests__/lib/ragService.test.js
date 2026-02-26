/**
 * Unit Tests for ragService.js
 *
 * Tests cache behavior, formatForPromptInjection token limiting,
 * error handling / graceful degradation, and category filtering.
 */

// Mock dependencies before imports
jest.mock('../../lib/config', () => ({
  __esModule: true,
  default: { supabaseUrl: 'https://test.supabase.co', supabaseAnonKey: 'test-key' }
}));

jest.mock('../../lib/supabase', () => ({
  __esModule: true,
  supabase: {
    auth: {
      getSession: jest.fn()
    }
  }
}));

jest.mock('../../lib/metricsService', () => ({
  __esModule: true,
  default: {
    logAIMetric: jest.fn(),
    logError: jest.fn()
  }
}));

// Mock global fetch
global.fetch = jest.fn();
global.__DEV__ = true;

const { ragService } = require('../../lib/ragService');
const { supabase } = require('../../lib/supabase');

// Mock session helper
const mockSession = (token = 'test-token') => {
  supabase.auth.getSession.mockResolvedValue({
    data: { session: { access_token: token } },
    error: null
  });
};

const mockNoSession = () => {
  supabase.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: { message: 'No session' }
  });
};

// Sample search results
const MOCK_RESULTS = [
  {
    id: 'chunk-1',
    document_id: 'doc-1',
    content: 'Internal Family Systems (IFS) recognizes that the psyche is naturally multiple. Each sub-personality or "part" has its own perspective, qualities, and history.',
    section_title: 'Introduction to IFS',
    chunk_type: 'text',
    page_numbers: [1, 2],
    token_count: 350,
    similarity: 0.89,
    source_document: 'IFS_Therapy_Guide.pdf',
    category: 'ifs'
  },
  {
    id: 'chunk-2',
    document_id: 'doc-2',
    content: 'The polyvagal theory describes how the vagus nerve mediates three distinct neural circuits that regulate behavioral and physiological responses to safety and threat.',
    section_title: 'Polyvagal Overview',
    chunk_type: 'text',
    page_numbers: [5],
    token_count: 280,
    similarity: 0.75,
    source_document: 'Polyvagal_Theory.pdf',
    category: 'polyvagal'
  },
  {
    id: 'chunk-3',
    document_id: 'doc-3',
    content: 'Step 1: Notice the trigger. Step 2: Name the nervous system state. Step 3: Choose a regulation practice. Step 4: Return to window of tolerance.',
    section_title: 'Regulation Protocol',
    chunk_type: 'exercise',
    page_numbers: [12],
    token_count: 120,
    similarity: 0.65,
    source_document: 'Regulation_Workbook.pdf',
    category: 'somatic'
  }
];

describe('RAGService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    ragService.clearCache();
    mockSession();
  });

  // =================================================================
  // search()
  // =================================================================
  describe('search()', () => {

    it('returns results from edge function', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: MOCK_RESULTS, match_count: 3 })
      });

      const results = await ragService.search('inner critic protective part');

      expect(results).toHaveLength(3);
      expect(results[0].similarity).toBe(0.89);
      expect(fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/embeddings',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"action":"search"')
        })
      );
    });

    it('sends category filter when provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [MOCK_RESULTS[0]], match_count: 1 })
      });

      await ragService.search('parts work', { categories: ['ifs'] });

      const body = JSON.parse(fetch.mock.calls[0][1].body);
      expect(body.categories).toEqual(['ifs']);
    });

    it('returns empty array on auth failure', async () => {
      mockNoSession();

      const results = await ragService.search('test query');
      expect(results).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('returns empty array on network error (graceful degradation)', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const results = await ragService.search('test query');
      expect(results).toEqual([]);
    });

    it('returns empty array on non-ok response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal error' })
      });

      const results = await ragService.search('test query');
      expect(results).toEqual([]);
    });
  });

  // =================================================================
  // Cache behavior
  // =================================================================
  describe('cache', () => {

    it('returns cached results on second call with same query', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: MOCK_RESULTS, match_count: 3 })
      });

      const results1 = await ragService.search('inner critic');
      const results2 = await ragService.search('inner critic');

      expect(results1).toEqual(results2);
      expect(fetch).toHaveBeenCalledTimes(1); // Only one fetch call
    });

    it('does not use cache for different queries', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [MOCK_RESULTS[0]], match_count: 1 })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [MOCK_RESULTS[1]], match_count: 1 })
        });

      await ragService.search('ifs parts');
      await ragService.search('polyvagal theory');

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('does not use cache for different categories', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [MOCK_RESULTS[0]], match_count: 1 })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [MOCK_RESULTS[1]], match_count: 1 })
        });

      await ragService.search('test', { categories: ['ifs'] });
      await ragService.search('test', { categories: ['polyvagal'] });

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('clearCache() invalidates all entries', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: MOCK_RESULTS, match_count: 3 })
      });

      await ragService.search('test');
      ragService.clearCache();
      await ragService.search('test');

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('expires cache after TTL', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: MOCK_RESULTS, match_count: 3 })
      });

      await ragService.search('test');

      // Manually expire cache
      for (const [key, entry] of ragService.cache) {
        entry.timestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago
      }

      await ragService.search('test');
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  // =================================================================
  // formatForPromptInjection()
  // =================================================================
  describe('formatForPromptInjection()', () => {

    it('returns empty string for no results', () => {
      expect(ragService.formatForPromptInjection([])).toBe('');
      expect(ragService.formatForPromptInjection(null)).toBe('');
    });

    it('formats results with source attribution', () => {
      const formatted = ragService.formatForPromptInjection(MOCK_RESULTS);

      expect(formatted).toContain('## RELEVANT KNOWLEDGE BASE CONTEXT:');
      expect(formatted).toContain('Introduction to IFS');
      expect(formatted).toContain('IFS_Therapy_Guide.pdf');
      expect(formatted).toContain('ifs');
      expect(formatted).toContain('89%');
    });

    it('respects maxTokens budget', () => {
      // With a very small token budget, should only include partial results
      const formatted = ragService.formatForPromptInjection(MOCK_RESULTS, { maxTokens: 150 });

      // Should have at most one full chunk (the first one is ~350 tokens which exceeds 150)
      // The function should truncate or skip
      expect(formatted.length).toBeLessThan(1500);
    });

    it('excludes sources when includeSources is false', () => {
      const formatted = ragService.formatForPromptInjection(MOCK_RESULTS, { includeSources: false });

      expect(formatted).not.toContain('[Source:');
      expect(formatted).toContain('Introduction to IFS');
    });

    it('includes evidence-grounding instruction', () => {
      const formatted = ragService.formatForPromptInjection(MOCK_RESULTS);
      expect(formatted).toContain('evidence-based practices');
    });
  });

  // =================================================================
  // getContextForPrompt()
  // =================================================================
  describe('getContextForPrompt()', () => {

    it('combines search + format in one call', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: MOCK_RESULTS, match_count: 3 })
      });

      const context = await ragService.getContextForPrompt('inner critic');

      expect(context).toContain('## RELEVANT KNOWLEDGE BASE CONTEXT:');
      expect(context).toContain('Introduction to IFS');
    });

    it('returns empty string when no results found', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [], match_count: 0 })
      });

      const context = await ragService.getContextForPrompt('extremely obscure query');
      expect(context).toBe('');
    });

    it('returns empty string on error (graceful degradation)', async () => {
      fetch.mockRejectedValueOnce(new Error('timeout'));

      const context = await ragService.getContextForPrompt('test');
      expect(context).toBe('');
    });

    it('passes category filter through', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [MOCK_RESULTS[1]], match_count: 1 })
      });

      await ragService.getContextForPrompt('vagal tone', {
        categories: ['polyvagal'],
      });

      const body = JSON.parse(fetch.mock.calls[0][1].body);
      expect(body.categories).toEqual(['polyvagal']);
    });
  });
});
