// lib/types/intentions.js
// Type definitions for FEAT-102: Intention Guidance Feature

/**
 * @typedef {'ifs' | 'somatic' | 'existential' | 'healing' | 'exploration' | 'creativity' | 'spiritual' | 'integration'} Framework
 * Philosophical/therapeutic framework
 */

/**
 * @typedef {'healing' | 'exploration' | 'creativity' | 'spiritual' | 'integration' | 'general'} SessionType
 * Type of psychedelic session
 */

/**
 * @typedef {'brief' | 'balanced' | 'detailed'} GuidanceStyle
 * AI verbosity preference
 */

/**
 * @typedef {Object} IntentionTemplate
 * Curated example intention from template library
 *
 * @property {string} id - UUID
 * @property {string} title - Short title (max 200 chars)
 * @property {string} intention_text - Example intention text (max 1000 chars)
 * @property {string} [description] - Explanation (max 500 chars)
 * @property {Framework} framework - Philosophical framework
 * @property {SessionType} session_type - Session type
 * @property {string[]} tags - Array of tags for filtering
 * @property {number} sort_order - Display order
 * @property {boolean} is_featured - Show in featured carousel
 * @property {string} [example_use_case] - When to use this intention
 * @property {string} [therapeutic_notes] - Admin notes (not shown to users)
 * @property {string} [source] - Attribution/source
 * @property {boolean} is_active - Active/archived flag
 * @property {number} version - Template version
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} AIConversationContext
 * Metadata about the AI guidance conversation
 *
 * @property {number} [prompt_count] - Number of prompts exchanged
 * @property {Framework[]} [frameworks_explored] - Frameworks discussed
 * @property {number} [session_duration_seconds] - Time spent in guidance
 * @property {string} [guidance_type] - Type of guidance provided
 */

/**
 * @typedef {Object} SessionIntention
 * User's saved intention for a session
 *
 * @property {string} id - UUID
 * @property {string} user_id - User UUID (FK to auth.users)
 * @property {string} [session_id] - Session UUID (FK to sessions)
 * @property {string} intention_text - ENCRYPTED. User's intention (max 2000 chars)
 * @property {Framework} [framework] - Framework used
 * @property {SessionType} session_type - Session type
 * @property {AIConversationContext} ai_conversation_context - ENCRYPTED. AI metadata
 * @property {number} [user_rating] - 1-5 stars rating
 * @property {string} [user_notes] - User's notes (max 1000 chars)
 * @property {string} [intention_summary] - AI-generated summary (max 500 chars)
 * @property {string[]} [key_themes] - AI-extracted themes
 * @property {string} [inspired_by_template_id] - Template UUID (FK)
 * @property {boolean} is_deleted - Soft delete flag
 * @property {string} [deleted_at] - ISO timestamp when deleted
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} UserIntentionPreferences
 * User's privacy and feature preferences
 *
 * @property {string} user_id - User UUID (PK, FK to auth.users)
 * @property {boolean} save_by_default - Save intentions by default
 * @property {number} [auto_delete_after_days] - Auto-delete after N days (7-365)
 * @property {Framework[]} favorite_frameworks - User's favorite frameworks
 * @property {SessionType[]} preferred_session_types - User's preferred session types
 * @property {GuidanceStyle} guidance_style - AI verbosity preference
 * @property {boolean} show_examples - Show example intentions
 * @property {boolean} enable_ai_suggestions - Enable AI suggestions
 * @property {boolean} offline_cache_enabled - Cache templates for offline
 * @property {string[]} cached_template_ids - Cached template UUIDs (max 20)
 * @property {boolean} has_completed_onboarding - Onboarding complete flag
 * @property {string} [onboarding_completed_at] - ISO timestamp
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

// Validate framework enum
export const VALID_FRAMEWORKS = [
  'ifs',
  'somatic',
  'existential',
  'healing',
  'exploration',
  'creativity',
  'spiritual',
  'integration'
];

// Validate session type enum
export const VALID_SESSION_TYPES = [
  'healing',
  'exploration',
  'creativity',
  'spiritual',
  'integration',
  'general'
];

// Validate guidance style enum
export const VALID_GUIDANCE_STYLES = [
  'brief',
  'balanced',
  'detailed'
];

/**
 * Validate if a value is a valid framework
 * @param {string} framework - Framework to validate
 * @returns {boolean} True if valid
 */
export function isValidFramework(framework) {
  return VALID_FRAMEWORKS.includes(framework);
}

/**
 * Validate if a value is a valid session type
 * @param {string} sessionType - Session type to validate
 * @returns {boolean} True if valid
 */
export function isValidSessionType(sessionType) {
  return VALID_SESSION_TYPES.includes(sessionType);
}

/**
 * Validate if a value is a valid guidance style
 * @param {string} guidanceStyle - Guidance style to validate
 * @returns {boolean} True if valid
 */
export function isValidGuidanceStyle(guidanceStyle) {
  return VALID_GUIDANCE_STYLES.includes(guidanceStyle);
}
