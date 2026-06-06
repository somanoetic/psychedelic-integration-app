/**
 * Persona Matrix — End-to-end conversation testing across diverse user profiles
 *
 * Runs 10 clinically diverse AI-driven personas through Huxley across the 6
 * cold-entry / safety-critical conversation modes, 3 runs each = 180
 * conversations. Each conversation is followed by a clinical-quality eval.
 *
 * USAGE:
 *   # Pilot: run 1 conversation (suicidal × general × run 1) to verify pipeline
 *   PERSONA_PILOT=true npm test -- --testPathPattern=personaMatrix
 *
 *   # Full matrix run
 *   PERSONA_LIVE=true npm test -- --testPathPattern=personaMatrix
 *
 *   # Resume an interrupted full run (skips already-completed transcripts)
 *   PERSONA_LIVE=true PERSONA_RESUME=true npm test -- --testPathPattern=personaMatrix
 *
 *   # Filter to specific personas / modes / runs
 *   PERSONA_LIVE=true PERSONAS=suicidal_crisis,skeptical MODES=general,journal RUNS=1 npm test -- --testPathPattern=personaMatrix
 *
 * Transcripts saved to: __tests__/transcripts/personas/<persona-id>/<mode>_run<N>.md
 * Index at: __tests__/transcripts/personas/INDEX.md
 */

const fs = require('fs');
const path = require('path');

const IS_PILOT = process.env.PERSONA_PILOT === 'true';
const IS_LIVE = process.env.PERSONA_LIVE === 'true';
const ENABLED = IS_PILOT || IS_LIVE;

// ---------------------------------------------------------------------------
// Mocks — must be at top level for jest hoisting. They are only EXERCISED
// when huxleyService is required inside the ENABLED branch below.
// ---------------------------------------------------------------------------
jest.mock('../../lib/claudeProxyService', () => {
  const { callAnthropic } = require('./personas/claudeDirect');
  return {
    __esModule: true,
    default: {
      sendMessage: jest.fn(async (messages, options) => {
        return callAnthropic({
          messages,
          system: options?.system,
          model: options?.model || 'claude-sonnet-4-5-20250929',
          maxTokens: options?.maxTokens || 1024,
          temperature: options?.temperature ?? 0.7,
        });
      }),
    },
  };
});

jest.mock('../../lib/config', () => ({
  __esModule: true,
  default: {
    supabaseUrl: process.env.SUPABASE_URL || 'http://localhost:54321',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'test-key',
  },
}));

jest.mock('../../lib/masterContextService', () => ({
  __esModule: true,
  default: {
    getMasterContext: jest.fn(async () => ({})),
    getFullContext: jest.fn(async () => ({})),
    getContextSummary: jest.fn(async () => ''),
    clearCache: jest.fn(),
  },
}));

jest.mock('../../lib/ragService', () => ({
  __esModule: true,
  default: {
    getContextForPrompt: jest.fn(async () => null),
    isAvailable: jest.fn(() => false),
  },
}));

// uiIcons requires PNG files (transitively via content/exercises-comprehensive)
// which jest can't parse — stub it out.
jest.mock('../../lib/uiIcons', () => ({
  __esModule: true,
  icons: new Proxy({}, { get: () => 'icon-stub' }),
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

// ---------------------------------------------------------------------------
// If not enabled, expose an inert test so jest doesn't complain.
// ---------------------------------------------------------------------------
if (!ENABLED) {
  describe('Persona Matrix (disabled)', () => {
    it('is gated behind PERSONA_PILOT or PERSONA_LIVE env vars', () => {
      expect(true).toBe(true);
    });
  });
} else {
  const huxleyService = require('../../lib/huxleyService').default;
  const { ALL_PERSONAS } = require('./personas/personaLibrary');
  const { runConversation } = require('./personas/personaEngine');
  const { evaluateTranscript, MODE_DESCRIPTIONS } = require('./personas/evalPass');
  const {
    writeTranscript,
    writeTopLevelIndex,
    writePersonaIndex,
    BASE_DIR,
  } = require('./personas/transcriptWriter');

  const ALL_MODES_TO_TEST = [
    'general',
    'journal',
    'experience_mapping',
    'ifs',
    'regulating_resources',
    'therapeutic_integration',
  ];
  const ALL_RUNS = [1, 2, 3];

  const personaFilter = process.env.PERSONAS
    ? process.env.PERSONAS.split(',').map((s) => s.trim()).filter(Boolean)
    : null;
  const modeFilter = process.env.MODES
    ? process.env.MODES.split(',').map((s) => s.trim()).filter(Boolean)
    : null;
  const runFilter = process.env.RUNS
    ? process.env.RUNS.split(',').map((s) => parseInt(s, 10)).filter((n) => !isNaN(n))
    : null;
  const RESUME = process.env.PERSONA_RESUME === 'true';

  const personas = IS_PILOT
    ? ALL_PERSONAS.filter((p) => p.id === 'suicidal_crisis')
    : (personaFilter
        ? ALL_PERSONAS.filter((p) => personaFilter.includes(p.id))
        : ALL_PERSONAS);
  const modesToTest = IS_PILOT
    ? ['general']
    : (modeFilter ? ALL_MODES_TO_TEST.filter((m) => modeFilter.includes(m)) : ALL_MODES_TO_TEST);
  const runs = IS_PILOT
    ? [1]
    : (runFilter ? ALL_RUNS.filter((r) => runFilter.includes(r)) : ALL_RUNS);

  const TOTAL = personas.length * modesToTest.length * runs.length;

  function existingTranscriptPath(personaId, mode, runIndex) {
    return path.join(BASE_DIR, personaId, `${mode}_run${runIndex}.json`);
  }

  function loadExistingTranscript(personaId, mode, runIndex) {
    const p = existingTranscriptPath(personaId, mode, runIndex);
    if (!fs.existsSync(p)) return null;
    try {
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
      // Treat 0-turn transcripts as not-yet-done so resume reruns them
      if (!raw?.transcript?.totalTurns || raw.transcript.totalTurns === 0) return null;
      return { transcript: raw.transcript, evalResult: raw.eval };
    } catch (e) {
      return null;
    }
  }

  describe(`Persona Matrix (${IS_PILOT ? 'PILOT' : 'LIVE'})`, () => {
    const MATRIX_TIMEOUT_MS = IS_PILOT ? 10 * 60 * 1000 : 12 * 60 * 60 * 1000;

    it(`runs ${TOTAL} conversation(s)`, async () => {
      const startedAt = new Date();
      console.log('');
      console.log('='.repeat(80));
      console.log(`PERSONA MATRIX — ${IS_PILOT ? 'PILOT' : 'LIVE'} run`);
      console.log(`Personas: ${personas.length}, Modes: ${modesToTest.length}, Runs: ${runs.length}`);
      console.log(`Total conversations to run: ${TOTAL}`);
      console.log(`Resume mode: ${RESUME ? 'YES (skipping completed)' : 'no'}`);
      console.log(`Output dir: ${BASE_DIR}`);
      console.log('='.repeat(80));
      console.log('');

      const allEntries = [];
      const byPersona = {};
      let completed = 0;
      let skipped = 0;
      let failed = 0;
      let conversationIndex = 0;

      for (const persona of personas) {
        for (const mode of modesToTest) {
          for (const runIndex of runs) {
            conversationIndex++;
            const label = `[${conversationIndex}/${TOTAL}] ${persona.id} × ${mode} × run${runIndex}`;

            if (RESUME) {
              const existing = loadExistingTranscript(persona.id, mode, runIndex);
              if (existing) {
                console.log(`${label}  SKIP (already exists)`);
                allEntries.push(existing);
                if (!byPersona[persona.id]) byPersona[persona.id] = { name: persona.name, entries: [] };
                byPersona[persona.id].entries.push(existing);
                skipped++;
                continue;
              }
            }

            console.log(`${label}  starting...`);
            const turnStart = Date.now();

            let transcript = null;
            let evalResult = null;

            try {
              transcript = await runConversation(huxleyService, persona, mode, runIndex);

              try {
                evalResult = await evaluateTranscript(
                  transcript,
                  MODE_DESCRIPTIONS[mode] || `Mode: ${mode}`
                );
              } catch (evalErr) {
                evalResult = { error: evalErr.message, recommendation: 'UNKNOWN' };
                console.log(`  eval failed: ${evalErr.message}`);
              }

              const { mdPath } = writeTranscript(transcript, evalResult);

              const elapsed = ((Date.now() - turnStart) / 1000).toFixed(1);
              if (transcript.totalTurns === 0) {
                const errStr = transcript.errors.map(e => e.error).join('; ') || 'unknown';
                console.log(`  FAILED (0 turns) in ${elapsed}s — ${errStr}`);
                failed++;
              } else {
                console.log(
                  `  done in ${elapsed}s — ${transcript.totalTurns} turns — ${evalResult?.recommendation || '—'} — ${path.basename(mdPath)}`
                );
                completed++;
              }
            } catch (err) {
              console.log(`  FAILED: ${err.message}`);
              failed++;
              if (transcript) {
                evalResult = evalResult || { error: err.message, recommendation: 'UNKNOWN' };
                try {
                  writeTranscript(transcript, evalResult);
                } catch (writeErr) {
                  console.log(`  also failed to write transcript: ${writeErr.message}`);
                }
              }
            }

            const entry = transcript ? { transcript, evalResult } : null;
            if (entry) {
              allEntries.push(entry);
              if (!byPersona[persona.id]) byPersona[persona.id] = { name: persona.name, entries: [] };
              byPersona[persona.id].entries.push(entry);
            }

            if (conversationIndex % 5 === 0 || conversationIndex === TOTAL) {
              try {
                writeTopLevelIndex(allEntries);
                for (const [pid, group] of Object.entries(byPersona)) {
                  writePersonaIndex(pid, group.name, group.entries);
                }
              } catch (e) {
                console.log(`  index update failed: ${e.message}`);
              }
            }
          }
        }
      }

      writeTopLevelIndex(allEntries);
      for (const [pid, group] of Object.entries(byPersona)) {
        writePersonaIndex(pid, group.name, group.entries);
      }

      const elapsedMin = ((Date.now() - startedAt.getTime()) / 60000).toFixed(1);
      console.log('');
      console.log('='.repeat(80));
      console.log(`MATRIX COMPLETE — elapsed ${elapsedMin} min`);
      console.log(`Completed: ${completed}, Skipped (resume): ${skipped}, Failed: ${failed}`);
      console.log(`Index: ${path.join(BASE_DIR, 'INDEX.md')}`);
      console.log('='.repeat(80));

      if (IS_PILOT) {
        expect(completed).toBe(1);
        expect(failed).toBe(0);
      } else {
        expect(completed + skipped).toBeGreaterThan(TOTAL * 0.5);
      }
    }, MATRIX_TIMEOUT_MS);
  });
}
