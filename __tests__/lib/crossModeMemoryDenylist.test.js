/**
 * Cross-mode memory denylist.
 *
 * `major_events` and `session_summary` (added by the cross-session memory work)
 * are read by EVERY mode and by the front-door chat. That makes them the widest
 * surface in the app for practitioner-only material to escape.
 *
 * The AAI mode's central guardrail is that its tentative attachment pattern is
 * never shown to the user. `attachmentInterviewHandler.test.js` asserts that
 * pattern stays out of AAI's OWN model-facing context — which does not help if
 * it leaks through the shared memory layer into an IFS conversation or the main
 * chat instead.
 *
 * These tests drive a real reflection to completion so the denied values are
 * genuine handler output, then assert they cannot reach:
 *   1. huxleyService.therapeuticState  (in-memory, injected into every mode)
 *   2. the therapeutic_context row      (durable, survives logout)
 *   3. conversationalRoutingService's prompt block (the front door)
 */

import AAIHandler from '../../lib/modeHandlers/AdultAttachmentInterviewModeHandler';

// huxleyService pulls in expo-constants transitively (config -> claudeProxyService,
// ragService). It's a native module with no Jest stub, so mock the leaf.
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '0.0.0-test', extra: {} } },
}));

// Nothing here makes a network call; keep the proxy and RAG inert.
jest.mock('../../lib/claudeProxyService', () => ({
  __esModule: true,
  default: { sendMessage: jest.fn() },
}));

// Fields that must never traverse the shared memory layer, plus the vocabulary
// of the pattern itself — a leak that renamed the key would still be a leak.
const DENIED_KEYS = ['backendPattern', '_patternSignals', 'tentativePattern'];
const DENIED_VOCAB = /dismissing|preoccupied|unresolved|disorganized|earned.?secure/i;

const step = (h, user, ai = 'And what comes next?') => h.processResponse(user, ai, null);

/** Walk a full AAI reflection so backendPattern/_patternSignals are populated. */
const completedReflection = () => {
  const h = new AAIHandler();
  step(h, 'My mother and my father raised me, mostly.');
  step(h, 'We lived in a small town, just the four of us.');
  step(h, 'My relationship with my mother was warm but complicated.');
  step(h, 'loving, distant, anxious, funny, and strict');
  for (let i = 0; i < 5; i++) step(h, "I can't remember anything specific.");
  step(h, 'My father was quieter, harder to reach.');
  step(h, 'absent, kind, tired, gentle, unpredictable');
  for (let i = 0; i < 5; i++) step(h, 'There was a time he took me fishing.');
  for (let i = 0; i < 5; i++) step(h, 'I would usually go to my room and cope alone.');
  step(h, 'Looking back, I think they did their best.');
  step(h, 'My grandfather died when I was eight.');
  step(h, 'It was confusing, no one really explained it.');
  step(h, 'It made me independent but slow to trust.');
  step(h, 'I am taking away that I want to be more open.');
  step(h, 'Thank you.');
  return h;
};

describe('cross-mode memory denylist', () => {
  let huxleyService;
  let routingService;
  let summary;

  beforeAll(() => {
    huxleyService = require('../../lib/huxleyService').default;
    routingService = require('../../lib/conversationalRoutingService').default;
  });

  beforeEach(() => {
    // Singletons — reset the memory fields between tests so leakage from one
    // case can't be mistaken for a pass in the next.
    huxleyService.therapeuticState.majorEvents = [];
    huxleyService.therapeuticState.sessionSummary = null;
    huxleyService.therapeuticState.lastSessionAt = null;
    routingService.clearUserContext();
    summary = completedReflection().getSessionSummary();
  });

  it('the fixture actually produces the practitioner-only material', () => {
    // Guards the guard: if AAI stops emitting these, every assertion below
    // would pass vacuously and the denylist would silently stop testing anything.
    expect(summary.backendPattern).toBeDefined();
    expect(summary.backendPattern.disclaimer).toMatch(/NOT a diagnosis/);
    expect(summary._patternSignals).toBeDefined();
    expect(JSON.stringify(summary)).toMatch(DENIED_VOCAB);
  });

  describe('_updateTherapeuticState', () => {
    it('drops practitioner-only keys smuggled alongside a major event', () => {
      huxleyService._updateTherapeuticState({
        majorEvents: [{
          label: "grief around grandfather's death",
          backendPattern: summary.backendPattern,
          _patternSignals: summary._patternSignals,
          detail: 'He died when they were eight and nobody explained it.',
        }],
      });

      const events = huxleyService.therapeuticState.majorEvents;
      expect(events).toHaveLength(1);
      // Rebuilt field-by-field: only the coarse label survives.
      expect(Object.keys(events[0]).sort()).toEqual(['label', 'mode', 'surfaced_at']);
      expect(JSON.stringify(events)).not.toMatch(DENIED_VOCAB);
      for (const key of DENIED_KEYS) {
        expect(JSON.stringify(events)).not.toContain(key);
      }
    });

    it('keeps a whole serialized AAI summary out of the event list', () => {
      // The blunt failure mode: a handler hands the model its state document
      // and the model echoes it back as an "event".
      huxleyService._updateTherapeuticState({
        majorEvents: [{ label: 'attachment reflection', ...summary }],
      });

      const serialized = JSON.stringify(huxleyService.therapeuticState.majorEvents);
      for (const key of DENIED_KEYS) expect(serialized).not.toContain(key);
      expect(serialized).not.toMatch(DENIED_VOCAB);
    });

    it('caps an over-long event label rather than storing a narrative', () => {
      huxleyService._updateTherapeuticState({
        majorEvents: [{ label: 'x'.repeat(500) }],
      });
      expect(huxleyService.therapeuticState.majorEvents[0].label.length).toBe(120);
    });
  });

  describe('_savePersistedContext payload', () => {
    it('never writes practitioner-only material to therapeutic_context', async () => {
      const { supabase } = require('../../lib/supabase');
      let written = null;
      const capture = (row) => {
        written = row;
        return {
          eq: () => Promise.resolve({ error: null }),
          select: () => ({ single: () => Promise.resolve({ data: { id: 'ctx-1' }, error: null }) }),
        };
      };
      supabase.from.mockReturnValue({ update: capture, insert: capture });

      huxleyService._updateTherapeuticState({
        majorEvents: [{ label: 'recent bereavement', backendPattern: summary.backendPattern }],
        sessionSummary: 'They spoke about their grandfather and about trusting people slowly.',
      });
      huxleyService.persistedContextId = null;
      await huxleyService._savePersistedContext('user-under-test');

      expect(written).not.toBeNull();
      const serialized = JSON.stringify(written);
      for (const key of DENIED_KEYS) expect(serialized).not.toContain(key);
      expect(serialized).not.toMatch(DENIED_VOCAB);
      // ...while the legitimate coarse memory did persist.
      expect(written.major_events[0].label).toBe('recent bereavement');
      expect(written.session_summary).toMatch(/grandfather/);
    });
  });

  describe('front-door write path (_updateAndSaveUserContext)', () => {
    it('never writes practitioner-only material even if it rides in on a main-chat event', async () => {
      const { supabase } = require('../../lib/supabase');
      let written = null;
      supabase.from.mockReturnValue({
        upsert: (row) => {
          written = row;
          return { select: () => ({ single: () => Promise.resolve({ data: { id: 'ctx-1' }, error: null }) }) };
        },
      });

      routingService.userId = 'user-under-test';
      await routingService._updateAndSaveUserContext({
        majorEvents: [{
          label: 'recent bereavement',
          backendPattern: summary.backendPattern,
          _patternSignals: summary._patternSignals,
        }],
        sessionSummary: 'They mentioned grief around a grandfather.',
      });

      expect(written).not.toBeNull();
      const serialized = JSON.stringify(written);
      for (const key of DENIED_KEYS) expect(serialized).not.toContain(key);
      expect(serialized).not.toMatch(DENIED_VOCAB);
      // ...while the legitimate coarse memory did persist, and themes/parts
      // (the specialized modes' own territory) were left untouched.
      expect(written.major_events[0].label).toBe('recent bereavement');
      expect(written).not.toHaveProperty('themes');
      expect(written).not.toHaveProperty('parts');
    });
  });

  describe('front-door prompt block', () => {
    it('renders only coarse labels even if the stored row is contaminated', () => {
      // Defence in depth: assume a bad row already exists (written before this
      // guardrail, or by another writer) and assert the front door still can't
      // surface it to the user.
      routingService.userContext = {
        themes: ['trusting people slowly'],
        parts: [{ name: 'the one who copes alone' }],
        major_events: [{
          label: 'recent bereavement',
          backendPattern: summary.backendPattern,
          _patternSignals: summary._patternSignals,
        }],
        session_summary: 'They spoke about their grandfather.',
        last_session_at: new Date().toISOString(),
      };

      const block = routingService.buildUserContextBlock();
      expect(block).toContain('recent bereavement');
      for (const key of DENIED_KEYS) expect(block).not.toContain(key);
      expect(block).not.toMatch(DENIED_VOCAB);
    });

    it('emits nothing at all once context is cleared on logout', () => {
      routingService.userContext = {
        major_events: [{ label: 'recent bereavement' }],
        session_summary: 'They spoke about their grandfather.',
      };
      expect(routingService.buildUserContextBlock()).not.toBe('');

      routingService.clearUserContext();
      // A second account on the same device must see a clean slate.
      expect(routingService.buildUserContextBlock()).toBe('');
    });
  });
});
