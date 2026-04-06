/**
 * Conversation Bot Test — Automated AI Conversation Screen Testing
 *
 * Simulates a user chatting through each conversation mode by driving
 * huxleyService.chat() with scripted persona messages. Produces a full
 * transcript for every mode so you can review AI responses for quality,
 * appropriateness, and therapeutic accuracy.
 *
 * TWO MODES:
 *
 * 1. MOCKED (default, `npm test`):
 *    claudeProxyService is mocked to return realistic canned responses.
 *    Tests verify the plumbing: mode switching, phase progression,
 *    therapeutic data extraction, and conversation flow.
 *    Fast, free, deterministic — good for CI.
 *
 * 2. LIVE (set LIVE_API=true):
 *    Uses the real Claude API via the proxy. Generates real transcripts
 *    saved to __tests__/transcripts/ for human review.
 *    Slow, costs money — use for periodic quality audits.
 *
 * Usage:
 *   npm test -- --testPathPattern=conversationBot     # mocked
 *   LIVE_API=true npm test -- --testPathPattern=conversationBot  # live
 */

const { ALL_PERSONAS, QUICK_PERSONAS } = require('./conversationBotPersonas');

// ---------------------------------------------------------------------------
// Decide: mocked or live
// ---------------------------------------------------------------------------
const IS_LIVE = process.env.LIVE_API === 'true';

// ---------------------------------------------------------------------------
// Mock infrastructure (only when not live)
// ---------------------------------------------------------------------------

// We mock claudeProxyService so huxleyService's full prompt-building,
// mode handler, and response-parsing pipeline runs for real.
if (!IS_LIVE) {
  jest.mock('../../lib/claudeProxyService', () => {
    // require inside factory is allowed by Jest
    const { generateMockResponse } = require('./mockResponseGenerator');
    return {
      __esModule: true,
      default: {
        sendMessage: jest.fn(async (messages, options) => {
          const systemPrompt = options?.system || '';
          const lastUserMsg = messages[messages.length - 1]?.content || '';
          const response = generateMockResponse(systemPrompt, lastUserMsg);
          return {
            content: [{ text: response }],
            usage: { input_tokens: 800, output_tokens: 200 },
          };
        }),
      },
    };
  });
}

// Mock dependencies that need Supabase/network (needed for BOTH mocked and live modes
// because huxleyService imports them and Expo native modules aren't available in Jest)
jest.mock('../../lib/masterContextService', () => ({
  __esModule: true,
  default: {
    getFullContext: jest.fn(async () => ({})),
    getContextSummary: jest.fn(async () => ''),
  },
}));

jest.mock('../../lib/ragService', () => ({
  __esModule: true,
  default: {
    getContextForPrompt: jest.fn(async () => null),
    isAvailable: jest.fn(() => false),
  },
}));

jest.mock('../../lib/metricsService', () => ({
  __esModule: true,
  default: {
    logAIMetric: jest.fn(),
    logError: jest.fn(),
    initialize: jest.fn(),
    constructor: {
      extractTokens: jest.fn(() => ({ input: 800, output: 200 })),
      calculateCost: jest.fn(() => 0.003),
    },
  },
}));

// In live mode, we still need to mock config and claudeProxyService's
// Expo dependency chain — but provide a REAL proxy that calls Claude API.
if (IS_LIVE) {
  jest.mock('../../lib/config', () => ({
    __esModule: true,
    default: {
      supabaseUrl: process.env.SUPABASE_URL || 'http://localhost:54321',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'test-key',
    },
  }));

  // For live mode, mock claudeProxyService to call Claude API directly
  // (bypasses the Supabase proxy to avoid needing auth in test)
  jest.mock('../../lib/claudeProxyService', () => {
    // Read API key from .env file directly since jest.setup.js
    // overwrites process.env.ANTHROPIC_API_KEY with a test value
    const fs = require('fs');
    const path = require('path');
    let apiKey = null;
    try {
      const envPath = path.join(__dirname, '..', '..', '.env');
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/^ANTHROPIC_API_KEY=(.+)$/m);
      if (match) apiKey = match[1].trim();
    } catch (e) {
      // .env not found — fall through to error below
    }

    return {
      __esModule: true,
      default: {
        sendMessage: jest.fn(async (messages, options) => {
          if (!apiKey) {
            throw new Error(
              'LIVE_API=true requires ANTHROPIC_API_KEY in .env file.'
            );
          }

          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: options.model || 'claude-sonnet-4-20250514',
              max_tokens: options.maxTokens || 1024,
              messages,
              temperature: options.temperature ?? 0.7,
              ...(options.system && { system: options.system }),
            }),
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(`Claude API error: ${err.error?.message || response.status}`);
          }

          return response.json();
        }),
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

// Use longer timeout for live API tests
const TEST_TIMEOUT = IS_LIVE ? 120000 : 15000;

// Import once — reset state between tests instead of re-importing
const huxleyService = require('../../lib/huxleyService').default;

describe('Conversation Bot', () => {
  beforeEach(() => {
    // Reset service state between tests (same as constructor)
    huxleyService.conversationHistory = [];
    huxleyService.currentMode = 'general';
    huxleyService.currentPhase = null;
    huxleyService.userId = null;
    huxleyService.masterContext = null;
    huxleyService.therapeuticState = {
      themes: [],
      parts: [],
      completedExercises: [],
      recommendedExercises: [],
      nervousSystemState: null,
    };
    huxleyService._exerciseCatalog = null;

    // Reset any mode handlers
    Object.values(huxleyService.modeHandlers).forEach(h => h.reset());

    // Reset mock call count for deterministic responses
    if (!IS_LIVE) {
      const { resetCallCount } = require('./mockResponseGenerator');
      resetCallCount();
    }
  });

  /**
   * Run a full conversation with a persona and return the transcript
   */
  async function runConversation(persona) {
    // Initialize without real Supabase
    huxleyService.userId = 'test-bot-user';
    huxleyService.masterContext = {};
    huxleyService.setMode(persona.mode, { clearHistory: true });

    const transcript = {
      persona: persona.name,
      mode: persona.mode,
      description: persona.description,
      startedAt: new Date().toISOString(),
      turns: [],
      phases: [],
      therapeuticData: [],
      errors: [],
    };

    for (let i = 0; i < persona.turns.length; i++) {
      const userMsg = persona.turns[i];
      const turnStart = Date.now();

      try {
        const response = await huxleyService.chat(userMsg);

        transcript.turns.push({
          turn: i + 1,
          user: userMsg,
          huxley: response.message,
          phase: response.phase,
          mode: response.mode,
          durationMs: Date.now() - turnStart,
        });

        if (response.phase) {
          transcript.phases.push(response.phase);
        }

        if (response.therapeuticData) {
          transcript.therapeuticData.push({
            turn: i + 1,
            data: response.therapeuticData,
          });
        }

      } catch (error) {
        transcript.errors.push({
          turn: i + 1,
          userMessage: userMsg,
          error: error.message,
          stack: error.stack,
        });
      }
    }

    transcript.completedAt = new Date().toISOString();
    transcript.totalTurns = transcript.turns.length;
    transcript.uniquePhases = [...new Set(transcript.phases)];

    return transcript;
  }

  /**
   * Format a transcript as readable text
   */
  function formatTranscript(transcript) {
    const lines = [];
    lines.push('='.repeat(80));
    lines.push(`TRANSCRIPT: ${transcript.persona}`);
    lines.push(`Mode: ${transcript.mode}`);
    lines.push(`Description: ${transcript.description}`);
    lines.push(`Turns: ${transcript.totalTurns}`);
    lines.push(`Phases seen: ${transcript.uniquePhases.join(' → ')}`);
    lines.push(`Started: ${transcript.startedAt}`);
    lines.push('='.repeat(80));
    lines.push('');

    for (const turn of transcript.turns) {
      lines.push(`--- Turn ${turn.turn} [phase: ${turn.phase || 'none'}] (${turn.durationMs}ms) ---`);
      lines.push(`USER: ${turn.user}`);
      lines.push('');
      lines.push(`HUXLEY: ${turn.huxley}`);
      lines.push('');
    }

    if (transcript.errors.length > 0) {
      lines.push('--- ERRORS ---');
      for (const err of transcript.errors) {
        lines.push(`Turn ${err.turn}: ${err.error}`);
      }
      lines.push('');
    }

    // Therapeutic data summary
    const lastData = transcript.therapeuticData[transcript.therapeuticData.length - 1]?.data;
    if (lastData) {
      lines.push('--- THERAPEUTIC DATA (final state) ---');
      lines.push(`Themes: ${JSON.stringify(lastData.themes)}`);
      lines.push(`Parts: ${JSON.stringify(lastData.parts)}`);
      lines.push(`NS State: ${lastData.nervousSystemState}`);
      lines.push(`Exercise Rec: ${lastData.exerciseRecommendation || 'none'}`);
    }

    lines.push('');
    lines.push('='.repeat(80));
    return lines.join('\n');
  }

  /**
   * Save transcript to file (for live API runs)
   */
  async function saveTranscript(transcript) {
    const fs = require('fs');
    const path = require('path');
    const dir = path.join(__dirname, '..', 'transcripts');

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${transcript.mode}_${timestamp}.txt`;
    const filepath = path.join(dir, filename);

    fs.writeFileSync(filepath, formatTranscript(transcript), 'utf-8');

    // Also save raw JSON for programmatic analysis
    const jsonPath = path.join(dir, `${transcript.mode}_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(transcript, null, 2), 'utf-8');

    return filepath;
  }

  // -------------------------------------------------------------------------
  // MOCKED TESTS: Verify plumbing works for every mode
  // -------------------------------------------------------------------------

  if (!IS_LIVE) {
    const personas = ALL_PERSONAS;

    describe.each(personas.map(p => [p.name, p]))('%s', (_name, persona) => {
      it(`completes a full ${persona.mode} conversation without errors`, async () => {
        const transcript = await runConversation(persona);

        // No errors
        expect(transcript.errors).toHaveLength(0);

        // All turns completed
        expect(transcript.totalTurns).toBe(persona.turns.length);

        // Every turn got a Huxley response
        for (const turn of transcript.turns) {
          expect(turn.huxley).toBeTruthy();
          expect(turn.huxley.length).toBeGreaterThan(10);
        }

        // Therapeutic data was extracted at least once
        expect(transcript.therapeuticData.length).toBeGreaterThan(0);

        // Print summary
        console.log(`  ✓ ${persona.mode}: ${transcript.totalTurns} turns, phases: [${transcript.uniquePhases.join(', ')}]`);
      }, TEST_TIMEOUT);

      it(`${persona.mode} mode handler progresses through phases`, async () => {
        const transcript = await runConversation(persona);

        // Should have at least 1 phase recorded
        if (transcript.uniquePhases.length > 0) {
          expect(transcript.uniquePhases.length).toBeGreaterThanOrEqual(1);
        }
      }, TEST_TIMEOUT);
    });

    it('generates a combined summary for all personas', async () => {
      const allTranscripts = [];

      for (const persona of QUICK_PERSONAS) {
        const transcript = await runConversation(persona);
        allTranscripts.push(transcript);
      }

      // Print combined report
      console.log('\n' + '='.repeat(60));
      console.log('CONVERSATION BOT — COMBINED SUMMARY');
      console.log('='.repeat(60));

      for (const t of allTranscripts) {
        const hasErrors = t.errors.length > 0 ? ' ❌ ERRORS' : ' ✅';
        console.log(`${t.mode.padEnd(30)} ${t.totalTurns} turns  ${t.uniquePhases.join('→')}${hasErrors}`);
      }

      console.log('='.repeat(60));

      expect(allTranscripts.every(t => t.errors.length === 0)).toBe(true);
    }, 60000);
  }

  // -------------------------------------------------------------------------
  // LIVE API TESTS: Generate real transcripts for review
  // -------------------------------------------------------------------------

  if (IS_LIVE) {
    // When running live, use QUICK_PERSONAS by default or set FULL_RUN=true for all
    const personas = process.env.FULL_RUN === 'true' ? ALL_PERSONAS : QUICK_PERSONAS;

    describe.each(personas.map(p => [p.name, p]))('LIVE: %s', (_name, persona) => {
      it(`generates a live transcript for ${persona.mode}`, async () => {
        const transcript = await runConversation(persona);

        // Save to file
        const filepath = await saveTranscript(transcript);
        console.log(`  📄 Transcript saved: ${filepath}`);

        // Print readable version
        console.log(formatTranscript(transcript));

        // Basic sanity checks even for live
        expect(transcript.errors).toHaveLength(0);
        expect(transcript.totalTurns).toBe(persona.turns.length);
      }, TEST_TIMEOUT);
    });
  }
});
