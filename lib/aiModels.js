/**
 * AI Model Constants — Single Source of Truth
 *
 * All Claude model IDs used at runtime are defined here. When Anthropic
 * releases a new model (or retires an old one), update this file and the
 * change propagates everywhere.
 *
 * Deprecation policy: https://docs.anthropic.com/en/docs/about-claude/model-deprecations
 *
 * When upgrading:
 *   1. Update the constant below.
 *   2. Update CLAUDE_PRICING in metricsService.js if the new model has different rates.
 *   3. Smoke-test the persona matrix (__tests__/e2e/personaMatrix.test.js).
 */

export const MODELS = {
  // Default for all conversational AI services
  PRIMARY: 'claude-sonnet-4-6',

  // Cheap/fast model for routing, classification, short extractions
  FAST: 'claude-haiku-4-5-20251001',

  // High-capability model for deep reasoning (currently unused — reserved)
  DEEP: 'claude-opus-4-7',
};

export const DEFAULT_MODEL = MODELS.PRIMARY;
