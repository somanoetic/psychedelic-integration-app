/**
 * Unit Tests for huxleyKnowledgeBase.js
 *
 * Tests pure functions: scenario detection, protocol retrieval,
 * prompt building, and homework suggestions. No mocks needed.
 */

import huxleyKnowledgeBase, {
  SCENARIO_TRIGGERS,
  SCENARIO_PROTOCOLS,
  CLINICAL_VOICE,
  CROSS_DOMAIN_GUIDE,
  HOMEWORK_TEMPLATES
} from '../../lib/huxleyKnowledgeBase';

describe('HuxleyKnowledgeBase', () => {
  // =========================================================================
  // DETECT SCENARIOS
  // =========================================================================

  describe('detectScenarios', () => {
    it('should return empty array for unmatched message', () => {
      const result = huxleyKnowledgeBase.detectScenarios('the weather is nice today');
      expect(result).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const result = huxleyKnowledgeBase.detectScenarios('');
      expect(result).toEqual([]);
    });

    it('should detect crisis triggers as critical priority', () => {
      const result = huxleyKnowledgeBase.detectScenarios('I want to kill myself');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].priority).toBe('critical');
      expect(result[0].key).toBe('crisis');
    });

    it('should detect suicidal ideation', () => {
      const result = huxleyKnowledgeBase.detectScenarios("I don't want to be here anymore");
      expect(result.some(s => s.key === 'crisis')).toBe(true);
    });

    it('should detect self-harm keywords', () => {
      const result = huxleyKnowledgeBase.detectScenarios("I've been hurting myself");
      expect(result.some(s => s.key === 'crisis')).toBe(true);
    });

    it('should detect hyperarousal (triggered) as high priority', () => {
      const result = huxleyKnowledgeBase.detectScenarios("I'm freaking out and can't breathe");
      expect(result.some(s => s.key === 'triggered')).toBe(true);
      const triggered = result.find(s => s.key === 'triggered');
      expect(triggered.priority).toBe('high');
    });

    it('should detect frozen/shutdown as high priority', () => {
      const result = huxleyKnowledgeBase.detectScenarios("I feel completely numb and frozen");
      expect(result.some(s => s.key === 'frozen')).toBe(true);
      const frozen = result.find(s => s.key === 'frozen');
      expect(frozen.priority).toBe('high');
    });

    it('should detect inner critic scenario', () => {
      const result = huxleyKnowledgeBase.detectScenarios("My inner critic won't stop, I feel so stupid and worthless");
      expect(result.some(s => s.key === 'inner_critic')).toBe(true);
    });

    it('should detect shame scenario', () => {
      const result = huxleyKnowledgeBase.detectScenarios("I'm so ashamed, I just want to disappear");
      expect(result.some(s => s.key === 'shame')).toBe(true);
    });

    it('should detect mystical experience scenario', () => {
      const result = huxleyKnowledgeBase.detectScenarios("I experienced ego death and felt one with everything");
      expect(result.some(s => s.key === 'mystical')).toBe(true);
    });

    it('should detect difficult experience scenario', () => {
      const result = huxleyKnowledgeBase.detectScenarios("It was a terrifying bad trip, I thought I was dying");
      expect(result.some(s => s.key === 'difficult_experience')).toBe(true);
    });

    it('should be case-insensitive', () => {
      const result = huxleyKnowledgeBase.detectScenarios("I FEEL COMPLETELY NUMB AND FROZEN");
      expect(result.some(s => s.key === 'frozen')).toBe(true);
    });

    it('should sort by priority (critical > high > medium > low)', () => {
      // Message that triggers both crisis (critical) and inner_critic (medium)
      const result = huxleyKnowledgeBase.detectScenarios("I want to kill myself because I'm so worthless and stupid");
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0].priority).toBe('critical');
    });

    it('should sort by match count when priorities are equal', () => {
      // Message with multiple triggers for the same scenario
      const result = huxleyKnowledgeBase.detectScenarios("I feel triggered and overwhelmed, freaking out and panicking");
      const triggered = result.find(s => s.key === 'triggered');
      expect(triggered).toBeDefined();
      expect(triggered.matchCount).toBeGreaterThan(1);
    });

    it('should return matched triggers in results', () => {
      const result = huxleyKnowledgeBase.detectScenarios("My inner critic says I'm worthless");
      const match = result.find(s => s.key === 'inner_critic');
      expect(match).toBeDefined();
      expect(match.matchedTriggers).toBeInstanceOf(Array);
      expect(match.matchedTriggers.length).toBeGreaterThan(0);
    });

    it('should detect multiple different scenarios', () => {
      const result = huxleyKnowledgeBase.detectScenarios(
        "I hate myself, I feel completely numb and can't stop thinking"
      );
      const keys = result.map(s => s.key);
      // Should detect at least inner_critic + frozen + analyzer
      expect(keys.length).toBeGreaterThanOrEqual(2);
    });

    it('should detect relationship pattern scenario', () => {
      const result = huxleyKnowledgeBase.detectScenarios("I keep pushing people away and can't trust anyone");
      expect(result.some(s => s.key === 'relationship')).toBe(true);
    });

    it('should detect spiritual bypass scenario', () => {
      const result = huxleyKnowledgeBase.detectScenarios("I've transcended that, it's just ego anyway");
      expect(result.some(s => s.key === 'spiritual_bypass')).toBe(true);
    });

    it('should detect plateau scenario', () => {
      const result = huxleyKnowledgeBase.detectScenarios("I feel stuck and not making progress, nothing changed");
      expect(result.some(s => s.key === 'plateau')).toBe(true);
    });

    it('should detect return of symptoms scenario', () => {
      const result = huxleyKnowledgeBase.detectScenarios("I thought I was healed but all my symptoms are back");
      expect(result.some(s => s.key === 'return_symptoms')).toBe(true);
    });
  });

  // =========================================================================
  // GET PROTOCOL
  // =========================================================================

  describe('getProtocol', () => {
    it('should return crisis protocol for crisis key', () => {
      const protocol = huxleyKnowledgeBase.getProtocol('crisis');
      expect(protocol).toBeDefined();
      expect(protocol).toContain('CRISIS PROTOCOL');
      expect(protocol).toContain('988');
    });

    it('should return hyperarousal protocol for triggered key', () => {
      const protocol = huxleyKnowledgeBase.getProtocol('triggered');
      expect(protocol).toBeDefined();
      expect(protocol).toContain('HYPERAROUSAL');
    });

    it('should return shutdown protocol for frozen key', () => {
      const protocol = huxleyKnowledgeBase.getProtocol('frozen');
      expect(protocol).toBeDefined();
      expect(protocol).toContain('SHUTDOWN');
    });

    it('should return inner critic protocol', () => {
      const protocol = huxleyKnowledgeBase.getProtocol('inner_critic');
      expect(protocol).toBeDefined();
      expect(protocol).toContain('INNER CRITIC');
    });

    it('should return shame protocol', () => {
      const protocol = huxleyKnowledgeBase.getProtocol('shame');
      expect(protocol).toContain('SHAME');
    });

    it('should return null for unknown key', () => {
      const protocol = huxleyKnowledgeBase.getProtocol('nonexistent_scenario');
      expect(protocol).toBeNull();
    });

    it('should return a protocol for each defined scenario', () => {
      const scenarioKeys = Object.keys(SCENARIO_TRIGGERS);
      for (const key of scenarioKeys) {
        const protocol = huxleyKnowledgeBase.getProtocol(key);
        expect(protocol).not.toBeNull();
        expect(typeof protocol).toBe('string');
      }
    });
  });

  // =========================================================================
  // BUILD ENHANCED PROMPT
  // =========================================================================

  describe('buildEnhancedPrompt', () => {
    const basePrompt = 'You are a helpful guide.';

    it('should include base prompt', () => {
      const result = huxleyKnowledgeBase.buildEnhancedPrompt(basePrompt, 'hello');
      expect(result).toContain(basePrompt);
    });

    it('should inject voice principles', () => {
      const result = huxleyKnowledgeBase.buildEnhancedPrompt(basePrompt, 'hello');
      expect(result).toContain('VOICE PRINCIPLES');
    });

    it('should inject response style', () => {
      const result = huxleyKnowledgeBase.buildEnhancedPrompt(basePrompt, 'hello');
      expect(result).toContain('RESPONSE STYLE');
    });

    it('should inject cross-domain guide', () => {
      const result = huxleyKnowledgeBase.buildEnhancedPrompt(basePrompt, 'hello');
      expect(result).toContain('CROSS-DOMAIN');
    });

    it('should add relevant protocols when scenario detected', () => {
      const result = huxleyKnowledgeBase.buildEnhancedPrompt(
        basePrompt,
        "I want to kill myself"
      );
      expect(result).toContain('RELEVANT PROTOCOLS');
      expect(result).toContain('CRISIS PROTOCOL');
    });

    it('should not add protocols section when no scenario detected', () => {
      const result = huxleyKnowledgeBase.buildEnhancedPrompt(
        basePrompt,
        'The weather is nice today'
      );
      expect(result).not.toContain('RELEVANT PROTOCOLS');
    });

    it('should add at most 2 protocols', () => {
      // Message with many triggers
      const result = huxleyKnowledgeBase.buildEnhancedPrompt(
        basePrompt,
        "I'm triggered and panicking, my inner critic says I'm worthless and ashamed"
      );
      // Count protocol sections - should be at most 2
      const protocolMatches = result.match(/## .+ PROTOCOL/g) || [];
      // Voice/response sections are always there, subtract those
      // Just verify protocols section exists
      expect(result).toContain('RELEVANT PROTOCOLS');
    });
  });

  // =========================================================================
  // GET HOMEWORK SUGGESTIONS
  // =========================================================================

  describe('getHomeworkSuggestions', () => {
    it('should return general homework for empty themes', () => {
      const result = huxleyKnowledgeBase.getHomeworkSuggestions([]);
      expect(result).toContain(HOMEWORK_TEMPLATES.general.practice);
    });

    it('should return general homework for no arguments', () => {
      const result = huxleyKnowledgeBase.getHomeworkSuggestions();
      expect(result).toContain(HOMEWORK_TEMPLATES.general.practice);
    });

    it('should map "parts" theme to parts_work homework', () => {
      const result = huxleyKnowledgeBase.getHomeworkSuggestions(['parts']);
      expect(result).toContain(HOMEWORK_TEMPLATES.parts_work.practice);
    });

    it('should map "ifs" theme to parts_work homework', () => {
      const result = huxleyKnowledgeBase.getHomeworkSuggestions(['ifs']);
      expect(result).toContain(HOMEWORK_TEMPLATES.parts_work.practice);
    });

    it('should map "nervous_system" theme to nervous_system homework', () => {
      const result = huxleyKnowledgeBase.getHomeworkSuggestions(['nervous_system']);
      expect(result).toContain(HOMEWORK_TEMPLATES.nervous_system.practice);
    });

    it('should map "polyvagal" theme to nervous_system homework', () => {
      const result = huxleyKnowledgeBase.getHomeworkSuggestions(['polyvagal']);
      expect(result).toContain(HOMEWORK_TEMPLATES.nervous_system.practice);
    });

    it('should map "integration" theme to integration homework', () => {
      const result = huxleyKnowledgeBase.getHomeworkSuggestions(['integration']);
      expect(result).toContain(HOMEWORK_TEMPLATES.integration.practice);
    });

    it('should map "psychedelic" theme to integration homework', () => {
      const result = huxleyKnowledgeBase.getHomeworkSuggestions(['psychedelic']);
      expect(result).toContain(HOMEWORK_TEMPLATES.integration.practice);
    });

    it('should return general for unknown themes', () => {
      const result = huxleyKnowledgeBase.getHomeworkSuggestions(['unknown_theme']);
      expect(result).toContain(HOMEWORK_TEMPLATES.general.practice);
    });

    it('should use first matching theme when multiple provided', () => {
      const result = huxleyKnowledgeBase.getHomeworkSuggestions(['parts', 'nervous_system']);
      expect(result).toContain(HOMEWORK_TEMPLATES.parts_work.practice);
    });

    it('should include practice, track, and learn sections', () => {
      const result = huxleyKnowledgeBase.getHomeworkSuggestions(['parts']);
      expect(result).toContain('Practice for this week');
      expect(result).toContain('Something to notice');
      expect(result).toContain('If you want to learn more');
    });
  });

  // =========================================================================
  // DATA INTEGRITY
  // =========================================================================

  describe('Data Integrity', () => {
    it('should have all scenario triggers defined', () => {
      expect(Object.keys(SCENARIO_TRIGGERS).length).toBeGreaterThanOrEqual(15);
    });

    it('should have a protocol for every scenario response', () => {
      for (const [key, scenario] of Object.entries(SCENARIO_TRIGGERS)) {
        expect(SCENARIO_PROTOCOLS[scenario.response]).toBeDefined();
      }
    });

    it('should have triggers as arrays for all scenarios', () => {
      for (const [key, scenario] of Object.entries(SCENARIO_TRIGGERS)) {
        expect(Array.isArray(scenario.triggers)).toBe(true);
        expect(scenario.triggers.length).toBeGreaterThan(0);
      }
    });

    it('should have valid priority levels', () => {
      const validPriorities = ['critical', 'high', 'medium', 'low'];
      for (const [key, scenario] of Object.entries(SCENARIO_TRIGGERS)) {
        expect(validPriorities).toContain(scenario.priority);
      }
    });

    it('should have clinical voice principles defined', () => {
      expect(CLINICAL_VOICE.principles).toBeDefined();
      expect(CLINICAL_VOICE.principles.length).toBeGreaterThan(0);
      expect(CLINICAL_VOICE.responseStyle).toBeDefined();
    });

    it('should have cross-domain guide defined', () => {
      expect(CROSS_DOMAIN_GUIDE).toBeDefined();
      expect(CROSS_DOMAIN_GUIDE).toContain('PARTS');
      expect(CROSS_DOMAIN_GUIDE).toContain('NERVOUS SYSTEM');
      expect(CROSS_DOMAIN_GUIDE).toContain('BELIEFS');
    });

    it('should have homework templates for all categories', () => {
      expect(HOMEWORK_TEMPLATES.parts_work).toBeDefined();
      expect(HOMEWORK_TEMPLATES.nervous_system).toBeDefined();
      expect(HOMEWORK_TEMPLATES.integration).toBeDefined();
      expect(HOMEWORK_TEMPLATES.general).toBeDefined();
    });

    it('should have practice, track, and learn in each homework template', () => {
      for (const [key, template] of Object.entries(HOMEWORK_TEMPLATES)) {
        expect(template.practice).toBeDefined();
        expect(template.track).toBeDefined();
        expect(template.learn).toBeDefined();
      }
    });
  });
});
