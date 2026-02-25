# Architecture: FEAT-102 - AI Guidance in Set Your Intention Screen

**Feature ID:** FEAT-102
**Version:** 1.0
**Date:** 2026-02-10
**Status:** Architecture Design Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Data Flow & Sequence Diagrams](#data-flow--sequence-diagrams)
6. [API Specifications](#api-specifications)
7. [Service Layer Design](#service-layer-design)
8. [State Management](#state-management)
9. [Error Handling & Resilience](#error-handling--resilience)
10. [Security Architecture](#security-architecture)
11. [Performance & Optimization](#performance--optimization)
12. [Offline Capability](#offline-capability)
13. [Risk Assessment](#risk-assessment)
14. [Implementation Roadmap](#implementation-roadmap)
15. [Testing Strategy](#testing-strategy)
16. [Appendix](#appendix)

---

## Executive Summary

### Feature Overview

FEAT-102 adds AI-powered intention guidance to the session preparation workflow. Users receive personalized, therapeutic support when formulating intentions for psychedelic sessions, grounded in IFS, somatic, existential, and healing frameworks.

### Key Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| **Reuse `enhancedClaudeService.js`** | Already has context-awareness, streaming, NS-aware responses | Need to extend with intention-specific prompts |
| **New service: `intentionGuidanceAIService.js`** | Separates intention logic from general chat | Additional service to maintain |
| **Streaming AI responses** | Better UX, perceived performance <3s | More complex client-side rendering |
| **Privacy-first (opt-in storage)** | User control, GDPR compliant | More complex UI flow |
| **AsyncStorage for drafts** | Offline capability, no server dependency | Manual sync if user switches devices |
| **Supabase RLS for security** | Row-level isolation, prevents data leaks | Complex policy testing required |

### Success Criteria

- 70%+ of users use intention-setting in session prep
- <3s initial AI response (streaming)
- Zero privacy incidents
- Works offline (cached templates)
- Non-prescriptive, trauma-informed AI guidance

---

## System Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App (Expo)                  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               Frontend Components                      │  │
│  │                                                         │  │
│  │  ┌────────────────────┐    ┌─────────────────────┐   │  │
│  │  │ SetIntentionScreen │───▶│ IntentionReview     │   │  │
│  │  │ (Main UI)          │    │ Screen              │   │  │
│  │  └──────┬─────────────┘    └─────────────────────┘   │  │
│  │         │                                              │  │
│  │         │ uses                                         │  │
│  │         ▼                                              │  │
│  │  ┌────────────────────┐    ┌─────────────────────┐   │  │
│  │  │ AIConversation     │    │ TemplateLibrary     │   │  │
│  │  │ Component          │    │ Component           │   │  │
│  │  └──────┬─────────────┘    └─────────────────────┘   │  │
│  └─────────┼──────────────────────────────────────────┘  │
│            │                                              │
│            │ calls                                        │
│            ▼                                              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Service Layer (lib/)                    │ │
│  │                                                       │ │
│  │  ┌─────────────────────────────────────────────┐    │ │
│  │  │  intentionGuidanceAIService.js               │    │ │
│  │  │  (New service for intention guidance)        │    │ │
│  │  │  - Intention-specific prompts                │    │ │
│  │  │  - Template management                       │    │ │
│  │  │  - Conversation orchestration                │    │ │
│  │  └───────────────┬──────────────────────────────┘    │ │
│  │                  │                                    │ │
│  │                  │ delegates to                       │ │
│  │                  ▼                                    │ │
│  │  ┌──────────────────────────────────────────────┐   │ │
│  │  │  enhancedClaudeService.js (Existing)         │   │ │
│  │  │  - Context-aware conversations               │   │ │
│  │  │  - Nervous system assessment                 │   │ │
│  │  │  - Streaming responses                       │   │ │
│  │  └───────────────┬──────────────────────────────┘   │ │
│  │                  │                                    │ │
│  │                  │ calls                              │ │
│  │                  ▼                                    │ │
│  │  ┌──────────────────────────────────────────────┐   │ │
│  │  │  supabase.js (Database & Auth)               │   │ │
│  │  │  - Templates (read)                          │   │ │
│  │  │  - Intentions (CRUD)                         │   │ │
│  │  │  - User preferences (CRUD)                   │   │ │
│  │  │  - Row Level Security (RLS)                  │   │ │
│  │  └──────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │         Local Storage (AsyncStorage)              │ │
│  │         - Draft intentions (not saved)            │ │
│  │         - Cached templates (offline)              │ │
│  │         - Conversation history (session)          │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
                       │
                       │ API calls
                       ▼
┌──────────────────────────────────────────────────────────┐
│                  External Services                        │
│                                                            │
│  ┌──────────────────────┐      ┌───────────────────────┐ │
│  │  Claude API          │      │  Supabase Backend     │ │
│  │  (Anthropic)         │      │  (PostgreSQL)         │ │
│  │  - AI responses      │      │  - Database           │ │
│  │  - Streaming         │      │  - Auth               │ │
│  │  - Token usage       │      │  - RLS policies       │ │
│  └──────────────────────┘      └───────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React Native | 0.81.5 | Mobile UI |
| | Expo | ~54.0.25 | Development tooling |
| | React Navigation | ^6.x | Screen navigation |
| | AsyncStorage | ^1.x | Local persistence |
| **Backend** | Supabase | Latest | Database, Auth, RLS |
| | PostgreSQL | 15+ | Data storage |
| **AI** | Claude API | Sonnet 4.5 | AI guidance |
| | enhancedClaudeService | Existing | Context-aware AI |
| **Design** | Noesis Theme | Custom | Colors, spacing |
| **State** | React Hooks | ^18.x | Local state |
| | Context API | ^18.x | Global state |

---

## Backend Architecture

### Service Layer Overview

```
┌─────────────────────────────────────────────────────────┐
│              intentionGuidanceAIService.js               │
│              (New Service - Intention-Specific)          │
│                                                           │
│  Responsibilities:                                        │
│  - Manage intention-setting conversation flow            │
│  - Load & filter intention templates                     │
│  - Save/update/delete intentions (opt-in)                │
│  - Manage user preferences                               │
│  - Orchestrate Claude API calls via enhancedClaude      │
│                                                           │
│  Public Methods:                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ startIntentionConversation(context)               │   │
│  │ continueIntentionConversation(message, context)   │   │
│  │ getTemplates(framework, sessionType)              │   │
│  │ saveIntention(intention, userId, sessionId)       │   │
│  │ getUserPreferences(userId)                        │   │
│  │ updateUserPreferences(userId, preferences)        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
└─────────────┬───────────────────────────────────────────┘
              │
              │ delegates AI calls to
              ▼
┌─────────────────────────────────────────────────────────┐
│         enhancedClaudeService.js (Existing)             │
│         (Context-Aware Conversation Engine)             │
│                                                           │
│  Responsibilities:                                        │
│  - Handle Claude API communication                       │
│  - Stream responses to frontend                          │
│  - Assess nervous system state                           │
│  - Inject session context                                │
│  - Error handling & retries                              │
│                                                           │
│  Used Methods:                                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │ continueConversation(message, context)            │   │
│  │ buildEnhancedPrompt(message, context)             │   │
│  │ callClaudeAPI(prompt, userId)                     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
└─────────────┬───────────────────────────────────────────┘
              │
              │ reads/writes
              ▼
┌─────────────────────────────────────────────────────────┐
│                  supabase.js (Existing)                  │
│                  (Database Access Layer)                 │
│                                                           │
│  Tables:                                                  │
│  - intention_templates (read-only for users)             │
│  - session_intentions (CRUD, RLS)                        │
│  - user_intention_preferences (CRUD, RLS)                │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### API Design

#### 1. Intention Conversation API

**Method:** `intentionGuidanceAIService.startIntentionConversation(context)`

**Purpose:** Initialize a new intention-setting conversation

**Request:**
```javascript
{
  userId: 'uuid',
  sessionId: 'uuid' | null, // Optional - can set intention without session
  sessionType: 'healing' | 'exploration' | 'creativity' | 'spiritual' | 'general',
  framework: 'ifs' | 'somatic' | 'existential' | 'healing' | null, // User preference
  nervousSystemState: 'ventral' | 'sympathetic' | 'dorsal',
  stateConfidence: 0.0-1.0
}
```

**Response:**
```javascript
{
  conversationId: 'uuid', // For tracking this conversation
  initialMessage: "Welcome message from AI...",
  suggestedTemplates: [
    {
      id: 'uuid',
      title: 'Meeting the Inner Critic with Compassion',
      intention_text: 'I intend to...',
      framework: 'ifs',
      session_type: 'healing'
    }
    // ... 3-5 templates
  ],
  userPreferences: {
    save_by_default: false,
    favorite_frameworks: ['ifs', 'somatic'],
    guidance_style: 'balanced'
  }
}
```

**Implementation:**
```javascript
async startIntentionConversation(context) {
  const { userId, sessionType, framework, nervousSystemState } = context;

  // 1. Load user preferences
  const preferences = await this.getUserPreferences(userId);

  // 2. Get relevant templates
  const templates = await this.getTemplates(
    framework || preferences.favorite_frameworks[0],
    sessionType
  );

  // 3. Build initial prompt with context
  const initialPrompt = this.buildIntentionPrompt({
    stage: 'welcome',
    sessionType,
    framework,
    nervousSystemState,
    preferences
  });

  // 4. Get AI response via enhancedClaudeService
  const aiResponse = await enhancedClaudeService.continueConversation(
    initialPrompt,
    {
      nervousSystemState,
      sessionPhase: 'intention_setting',
      userId
    }
  );

  // 5. Return conversation initialization
  return {
    conversationId: uuidv4(),
    initialMessage: aiResponse.message,
    suggestedTemplates: templates.slice(0, 5),
    userPreferences: preferences
  };
}
```

---

#### 2. Continue Conversation API

**Method:** `intentionGuidanceAIService.continueIntentionConversation(message, context)`

**Purpose:** Continue the intention-setting conversation

**Request:**
```javascript
{
  conversationId: 'uuid',
  message: 'User message...',
  userId: 'uuid',
  sessionType: 'healing',
  nervousSystemState: 'ventral',
  conversationHistory: [
    { role: 'user', content: '...' },
    { role: 'assistant', content: '...' }
  ],
  currentDraft: 'I intend to...' // If user is drafting
}
```

**Response:**
```javascript
{
  message: "AI response...",
  extractedEntities: [
    { name: 'fear', category: 'emotional', confidence: 0.9 },
    { name: 'inner child', category: 'archetypal', confidence: 0.8 }
  ],
  suggestedActions: [
    {
      type: 'review_intention',
      message: 'Would you like to review your intention?'
    },
    {
      type: 'explore_template',
      templateId: 'uuid',
      message: 'This template might resonate with you'
    }
  ],
  conversationStage: 'formulation' | 'refinement' | 'review' | 'complete',
  nervousSystemUpdate: {
    detectedState: 'ventral',
    confidence: 0.7,
    needsRegulation: false
  }
}
```

**Implementation:**
```javascript
async continueIntentionConversation(message, context) {
  const { conversationId, userId, sessionType, nervousSystemState, conversationHistory, currentDraft } = context;

  // 1. Detect conversation stage
  const stage = this.detectConversationStage(conversationHistory, currentDraft);

  // 2. Build intention-specific prompt
  const prompt = this.buildIntentionPrompt({
    stage,
    message,
    sessionType,
    nervousSystemState,
    conversationHistory,
    currentDraft
  });

  // 3. Call enhancedClaudeService
  const aiResponse = await enhancedClaudeService.continueConversation(
    prompt,
    {
      nervousSystemState,
      sessionPhase: 'intention_setting',
      userId,
      conversationHistory: conversationHistory.slice(-5) // Last 5 messages
    }
  );

  // 4. Analyze response for actions
  const suggestedActions = this.analyzeSuggestedActions(aiResponse.message, stage);

  // 5. Return enriched response
  return {
    message: aiResponse.message,
    extractedEntities: aiResponse.extractedEntities || [],
    suggestedActions,
    conversationStage: stage,
    nervousSystemUpdate: aiResponse.nervousSystemUpdate
  };
}
```

---

#### 3. Template Management API

**Method:** `intentionGuidanceAIService.getTemplates(framework, sessionType)`

**Purpose:** Fetch curated intention templates

**Request:**
```javascript
{
  framework: 'ifs' | 'somatic' | 'existential' | 'healing' | null,
  sessionType: 'healing' | 'exploration' | 'creativity' | 'spiritual' | 'general' | null,
  limit: 20,
  featured: false // If true, only return featured templates
}
```

**Response:**
```javascript
[
  {
    id: 'uuid',
    title: 'Meeting the Inner Critic with Compassion',
    intention_text: 'I intend to meet my inner critic with curiosity...',
    description: 'For working with harsh self-judgment using IFS framework',
    framework: 'ifs',
    session_type: 'healing',
    tags: ['inner_critic', 'self_compassion', 'parts_work'],
    is_featured: true,
    example_use_case: 'When struggling with self-judgment...',
    source: 'Adapted from IFS therapy'
  }
  // ... more templates
]
```

**Implementation:**
```javascript
async getTemplates(framework = null, sessionType = null, options = {}) {
  const { limit = 20, featured = false } = options;

  let query = supabase
    .from('intention_templates')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .limit(limit);

  if (framework) {
    query = query.eq('framework', framework);
  }

  if (sessionType) {
    query = query.eq('session_type', sessionType);
  }

  if (featured) {
    query = query.eq('is_featured', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching templates:', error);
    throw new Error('Failed to load intention templates');
  }

  return data;
}
```

---

#### 4. Save Intention API

**Method:** `intentionGuidanceAIService.saveIntention(intention, userId, sessionId)`

**Purpose:** Save user's intention to database (opt-in only)

**Request:**
```javascript
{
  userId: 'uuid',
  sessionId: 'uuid' | null,
  intentionText: 'I intend to...',
  framework: 'ifs',
  sessionType: 'healing',
  aiConversationContext: {
    prompt_count: 4,
    frameworks_explored: ['ifs', 'somatic'],
    session_duration_seconds: 240
  },
  inspiredByTemplateId: 'uuid' | null,
  userWantsToSave: true // Explicit opt-in
}
```

**Response:**
```javascript
{
  success: true,
  intentionId: 'uuid',
  created_at: '2026-02-10T10:30:00Z',
  message: 'Your intention has been saved'
}
```

**Error Response:**
```javascript
{
  success: false,
  error: 'User has not opted in to saving intentions',
  errorCode: 'PRIVACY_OPT_IN_REQUIRED'
}
```

**Implementation:**
```javascript
async saveIntention(intention, userId, sessionId = null) {
  const { intentionText, framework, sessionType, aiConversationContext, inspiredByTemplateId, userWantsToSave } = intention;

  // 1. Check user preferences
  const preferences = await this.getUserPreferences(userId);

  // 2. Verify opt-in (critical privacy check)
  if (!userWantsToSave && !preferences.save_by_default) {
    throw new Error('User has not opted in to saving intentions');
  }

  // 3. Validate intention text
  if (!intentionText || intentionText.trim().length === 0) {
    throw new Error('Intention text is required');
  }

  if (intentionText.length > 2000) {
    throw new Error('Intention text too long (max 2000 characters)');
  }

  // 4. Save to database
  const { data, error } = await supabase
    .from('session_intentions')
    .insert([{
      user_id: userId,
      session_id: sessionId,
      intention_text: intentionText,
      framework,
      session_type: sessionType,
      ai_conversation_context: aiConversationContext || {},
      inspired_by_template_id: inspiredByTemplateId
    }])
    .select()
    .single();

  if (error) {
    console.error('Error saving intention:', error);
    throw new Error('Failed to save intention');
  }

  // 5. Return success
  return {
    success: true,
    intentionId: data.id,
    created_at: data.created_at,
    message: 'Your intention has been saved'
  };
}
```

---

#### 5. User Preferences API

**Method:** `intentionGuidanceAIService.getUserPreferences(userId)`

**Purpose:** Get or create user's intention preferences

**Request:**
```javascript
{
  userId: 'uuid'
}
```

**Response:**
```javascript
{
  user_id: 'uuid',
  save_by_default: false,
  auto_delete_after_days: 90,
  favorite_frameworks: ['ifs', 'somatic'],
  preferred_session_types: ['healing', 'exploration'],
  guidance_style: 'balanced', // 'brief' | 'balanced' | 'detailed'
  show_examples: true,
  enable_ai_suggestions: true,
  offline_cache_enabled: true,
  cached_template_ids: ['uuid1', 'uuid2'],
  has_completed_onboarding: true,
  onboarding_completed_at: '2026-02-10T09:00:00Z'
}
```

**Implementation:**
```javascript
async getUserPreferences(userId) {
  // 1. Try to get existing preferences
  let { data, error } = await supabase
    .from('user_intention_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  // 2. If not found, create default preferences
  if (error && error.code === 'PGRST116') { // Not found
    const { data: newData, error: insertError } = await supabase
      .from('user_intention_preferences')
      .insert([{ user_id: userId }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating preferences:', insertError);
      throw new Error('Failed to create user preferences');
    }

    return newData;
  }

  if (error) {
    console.error('Error fetching preferences:', error);
    throw new Error('Failed to load user preferences');
  }

  return data;
}
```

---

### Database Access Patterns

All database operations go through `supabase.js` client:

```javascript
// lib/supabase.js (existing)
import { createClient } from '@supabase/supabase-js'
import config from './config';

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);
```

**RLS (Row Level Security) enforcement:**
- All queries automatically filtered by `auth.uid()` (Supabase magic)
- Users can only access their own intentions and preferences
- Templates are read-only for users, admin-only for writes

**Query patterns** documented in database design (Step 2).

---

## Frontend Architecture

### Component Hierarchy

```
SetIntentionScreen (Screen - Main Entry Point)
├── Header
│   ├── BackButton
│   ├── Title: "Set Your Intention"
│   └── HelpButton (opens privacy/guidance info modal)
│
├── OnboardingModal (if first time)
│   ├── Privacy explanation
│   ├── How it works
│   └── Opt-in toggle
│
├── ConversationContainer (if in conversation mode)
│   ├── AIConversationComponent
│   │   ├── MessageList
│   │   │   ├── AIMessage (with streaming)
│   │   │   │   ├── Avatar (Huxley icon)
│   │   │   │   ├── MessageText (markdown support)
│   │   │   │   └── Timestamp
│   │   │   └── UserMessage
│   │   │       ├── MessageText
│   │   │       └── Timestamp
│   │   ├── InputArea
│   │   │   ├── TextInput (multiline)
│   │   │   ├── SendButton
│   │   │   └── CharacterCount (0/500)
│   │   └── LoadingIndicator (when AI is responding)
│   │
│   └── SuggestedActions (bottom sheet)
│       ├── "Review your intention"
│       ├── "Explore templates"
│       └── "Save and continue"
│
├── TemplateLibraryContainer (if browsing templates)
│   ├── FilterBar
│   │   ├── FrameworkFilter (IFS, Somatic, Existential, Healing)
│   │   └── SessionTypeFilter (Healing, Exploration, Creativity, Spiritual)
│   ├── TemplateList (FlatList)
│   │   └── TemplateCard (touchable)
│   │       ├── Title
│   │       ├── IntentionText (preview)
│   │       ├── Framework & SessionType tags
│   │       └── "Use this template" button
│   └── SearchBar (optional)
│
├── IntentionDraftContainer (if drafting)
│   ├── DraftEditor (multiline TextInput)
│   │   ├── Placeholder: "I intend to..."
│   │   ├── Character count (0/2000)
│   │   └── Auto-save indicator
│   ├── AIFeedback (if user requests)
│   │   └── "This intention focuses on [theme]..."
│   └── ActionButtons
│       ├── "Get AI feedback"
│       ├── "Refine with AI"
│       └── "Continue to review"
│
└── IntentionReviewContainer (final review)
    ├── IntentionDisplay (read-only)
    │   ├── IntentionText (styled nicely)
    │   ├── Framework & SessionType (if selected)
    │   └── CreatedAt timestamp
    ├── SaveOptions
    │   ├── OptInToggle: "Save this intention to my session"
    │   │   ├── Privacy notice (collapsible)
    │   │   └── Toggle switch
    │   └── SessionSelector (if multiple sessions exist)
    └── ActionButtons
        ├── "Edit intention" (back to draft)
        ├── "Save & Continue" (primary)
        └── "Skip for now" (secondary)
```

### Screen Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SetIntentionScreen                        │
│                    (Main Entry Point)                        │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        │ First time?           │
        │                       │
    ┌───▼────┐              ┌───▼────┐
    │  YES   │              │   NO   │
    └───┬────┘              └───┬────┘
        │                       │
        ▼                       │
┌────────────────────┐          │
│ OnboardingModal    │          │
│ - Privacy info     │          │
│ - How it works     │          │
│ - Opt-in choice    │          │
└────────┬───────────┘          │
         │                      │
         │ Continue             │
         └──────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Welcome View (Choose Mode)                      │
│                                                               │
│  [Talk with AI]  [Browse Templates]  [Write My Own]         │
│                                                               │
└───────┬───────────────────┬───────────────────┬─────────────┘
        │                   │                   │
        │                   │                   │
    ┌───▼────┐          ┌───▼────┐         ┌───▼────┐
    │ AI     │          │Template│         │ Draft  │
    │ Convo  │          │Library │         │ Editor │
    └───┬────┘          └───┬────┘         └───┬────┘
        │                   │                   │
        │ Conversation      │ Select            │ Write
        │ flow (3-5         │ template          │ intention
        │ exchanges)        │                   │ directly
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Draft Editor                              │
│                    (User refines intention)                  │
│                                                               │
│  [Get AI Feedback]  [Refine with AI]                        │
│                                                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Continue to review
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Intention Review Screen                      │
│                                                               │
│  Your Intention:                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ "I intend to meet my inner critic with               │  │
│  │  curiosity and compassion..."                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  [ ] Save this intention to my session (opt-in)             │
│                                                               │
│  [Edit]  [Save & Continue]  [Skip]                          │
│                                                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼────────┐      ┌──────▼──────┐
        │  Save & Store  │      │  Skip (Don't│
        │  (if opted in) │      │   save)     │
        └───────┬────────┘      └──────┬──────┘
                │                      │
                └──────────┬───────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Confirmation & Next Steps                       │
│                                                               │
│  "Your intention is set. Take a moment to reflect..."       │
│                                                               │
│  [Continue to Session Prep]  [Back to Home]                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### State Management Design

#### Local State (useState)

**Used for:** UI-specific state that doesn't need to persist

```javascript
// SetIntentionScreen.js
const [mode, setMode] = useState('welcome'); // 'welcome' | 'conversation' | 'templates' | 'draft' | 'review'
const [conversationMessages, setConversationMessages] = useState([]);
const [isAIResponding, setIsAIResponding] = useState(false);
const [streamingMessage, setStreamingMessage] = useState('');
const [draftIntention, setDraftIntention] = useState('');
const [selectedTemplate, setSelectedTemplate] = useState(null);
const [showOnboarding, setShowOnboarding] = useState(false);
```

#### Session State (AsyncStorage)

**Used for:** Draft data that should survive app restart but not sync across devices

```javascript
// Draft intentions (auto-save every 5s)
await AsyncStorage.setItem(
  `intention_draft_${userId}`,
  JSON.stringify({
    intentionText: draftIntention,
    framework: selectedFramework,
    sessionType: selectedSessionType,
    conversationHistory: conversationMessages,
    lastModified: new Date().toISOString()
  })
);

// Cached templates (for offline)
await AsyncStorage.setItem(
  `cached_templates_${userId}`,
  JSON.stringify({
    templates: cachedTemplates,
    lastUpdated: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  })
);

// Conversation context (cleared after save or 24h)
await AsyncStorage.setItem(
  `intention_conversation_${conversationId}`,
  JSON.stringify({
    messages: conversationMessages,
    entities: extractedEntities,
    startedAt: conversationStartTime,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  })
);
```

#### Global State (Context API)

**Used for:** User preferences that need to be accessed across screens

```javascript
// IntentionPreferencesContext.js (new context)
import React, { createContext, useContext, useEffect, useState } from 'react';
import intentionGuidanceAIService from '../lib/intentionGuidanceAIService';
import { supabase } from '../lib/supabase';

const IntentionPreferencesContext = createContext();

export const IntentionPreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadUserAndPreferences();
  }, []);

  const loadUserAndPreferences = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Load preferences
      const prefs = await intentionGuidanceAIService.getUserPreferences(user.id);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates) => {
    try {
      const updated = await intentionGuidanceAIService.updateUserPreferences(userId, updates);
      setPreferences(updated);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  return (
    <IntentionPreferencesContext.Provider value={{ preferences, updatePreferences, loading }}>
      {children}
    </IntentionPreferencesContext.Provider>
  );
};

export const useIntentionPreferences = () => {
  const context = useContext(IntentionPreferencesContext);
  if (!context) {
    throw new Error('useIntentionPreferences must be used within IntentionPreferencesProvider');
  }
  return context;
};
```

### Component Specifications

#### 1. SetIntentionScreen (Main Screen)

**File:** `screens/SetIntentionScreen.js`

**Props:**
```javascript
{
  navigation: NavigationProp,
  route: {
    params: {
      sessionId?: string, // Optional session to attach intention to
      sessionType?: 'healing' | 'exploration' | 'creativity' | 'spiritual'
    }
  }
}
```

**State:**
```javascript
{
  mode: 'welcome' | 'conversation' | 'templates' | 'draft' | 'review',
  conversationId: string | null,
  conversationMessages: Array<{ role: 'user' | 'assistant', content: string }>,
  draftIntention: string,
  selectedTemplate: Template | null,
  isAIResponding: boolean,
  streamingMessage: string,
  nervousSystemState: 'ventral' | 'sympathetic' | 'dorsal',
  extractedEntities: Array<Entity>
}
```

**Key Methods:**
```javascript
handleStartConversation() // Initialize AI conversation
handleSendMessage(message) // Send message to AI
handleSelectTemplate(template) // User picks a template
handleSaveIntention() // Save to database (with opt-in check)
handleSkipSave() // Continue without saving
loadDraft() // Restore draft from AsyncStorage on mount
saveDraft() // Auto-save draft every 5s
```

---

#### 2. AIConversationComponent

**File:** `components/intention/AIConversationComponent.js`

**Props:**
```javascript
{
  conversationId: string,
  messages: Array<Message>,
  onSendMessage: (message: string) => void,
  isAIResponding: boolean,
  streamingMessage: string,
  nervousSystemState: 'ventral' | 'sympathetic' | 'dorsal',
  suggestedActions: Array<Action>
}
```

**Features:**
- Streaming AI responses (display character-by-character)
- Auto-scroll to bottom on new messages
- Markdown support in AI messages (bold, italic, lists)
- Nervous system indicator (color-coded)
- Suggested action chips at bottom
- Character limit on user input (500 chars)

**Streaming Implementation:**
```javascript
// In AIConversationComponent.js
useEffect(() => {
  if (streamingMessage) {
    // Display streaming message character by character
    const chars = streamingMessage.split('');
    let currentText = '';
    let index = 0;

    const interval = setInterval(() => {
      if (index < chars.length) {
        currentText += chars[index];
        setDisplayedMessage(currentText);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 20); // 20ms per character = natural reading speed

    return () => clearInterval(interval);
  }
}, [streamingMessage]);
```

---

#### 3. TemplateLibrary Component

**File:** `components/intention/TemplateLibrary.js`

**Props:**
```javascript
{
  templates: Array<Template>,
  onSelectTemplate: (template: Template) => void,
  selectedFramework: string | null,
  selectedSessionType: string | null,
  onFilterChange: (framework: string, sessionType: string) => void
}
```

**Features:**
- Horizontal framework filter pills (IFS, Somatic, Existential, Healing, All)
- Session type dropdown filter
- FlatList with template cards
- Featured templates shown first
- Search bar (filters by title, tags, intention_text)
- "Use this template" button opens draft editor with pre-filled text

---

#### 4. IntentionReviewScreen

**File:** `screens/IntentionReviewScreen.js`

**Props:**
```javascript
{
  navigation: NavigationProp,
  route: {
    params: {
      intentionText: string,
      framework: string,
      sessionType: string,
      conversationContext: object,
      sessionId: string | null
    }
  }
}
```

**Features:**
- Display intention in elegant card
- Privacy opt-in toggle (prominent, with explanation)
- Session selector (if multiple sessions exist)
- Edit button (back to draft editor)
- Save button (primary action, disabled until opt-in confirmed)
- Skip button (secondary action, no save)

---

### Navigation Structure

**New Routes:**

```javascript
// In App.js navigation stack
<Stack.Screen
  name="SetIntention"
  component={SetIntentionScreen}
  options={{
    title: 'Set Your Intention',
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text
  }}
/>

<Stack.Screen
  name="IntentionReview"
  component={IntentionReviewScreen}
  options={{
    title: 'Review Intention',
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text
  }}
/>
```

**Entry Points:**

1. **From Session Prep Menu:**
```javascript
// In PreparationScreen.js
<TouchableOpacity onPress={() => navigation.navigate('SetIntention', { sessionId: session.id, sessionType: 'healing' })}>
  <Text>Set Your Intention</Text>
</TouchableOpacity>
```

2. **From Home Screen (Quick Action):**
```javascript
// In OrganizedHomeScreen.js
<TouchableOpacity onPress={() => navigation.navigate('SetIntention')}>
  <Text>Set an Intention</Text>
</TouchableOpacity>
```

---

## Data Flow & Sequence Diagrams

### Sequence Diagram 1: Starting Intention Conversation

```
User                SetIntentionScreen        intentionGuidanceAIService    enhancedClaudeService    Supabase
  │                        │                           │                           │                    │
  │ Tap "Talk with AI"     │                           │                           │                    │
  ├────────────────────────>│                           │                           │                    │
  │                        │                           │                           │                    │
  │                        │ startIntentionConversation│                           │                    │
  │                        ├──────────────────────────>│                           │                    │
  │                        │                           │                           │                    │
  │                        │                           │ getUserPreferences(userId)│                    │
  │                        │                           ├──────────────────────────────────────────────>│
  │                        │                           │                           │                    │
  │                        │                           │                           │   SELECT * FROM    │
  │                        │                           │                           │   user_intention_  │
  │                        │                           │                           │   preferences      │
  │                        │                           │                           │   WHERE user_id=..│
  │                        │                           │<─────────────────────────────────────────────┤
  │                        │                           │                           │   {preferences}    │
  │                        │                           │                           │                    │
  │                        │                           │ getTemplates(framework, sessionType)          │
  │                        │                           ├──────────────────────────────────────────────>│
  │                        │                           │                           │                    │
  │                        │                           │                           │   SELECT * FROM    │
  │                        │                           │                           │   intention_templates│
  │                        │                           │                           │   WHERE is_active  │
  │                        │                           │<─────────────────────────────────────────────┤
  │                        │                           │                           │   [templates]      │
  │                        │                           │                           │                    │
  │                        │                           │ buildIntentionPrompt()    │                    │
  │                        │                           ├──────────────────────────>│                    │
  │                        │                           │  (prompt with context)    │                    │
  │                        │                           │                           │                    │
  │                        │                           │ continueConversation()    │                    │
  │                        │                           ├──────────────────────────>│                    │
  │                        │                           │                           │                    │
  │                        │                           │                           │ callClaudeAPI()    │
  │                        │                           │                           ├──────────────────> │
  │                        │                           │                           │    (Claude API)    │
  │                        │                           │                           │                    │
  │                        │                           │                           │ <Stream Response>  │
  │                        │                           │                           │<────────────────── │
  │                        │                           │                           │                    │
  │                        │                           │<──────────────────────────┤                    │
  │                        │                           │  {message, entities}      │                    │
  │                        │                           │                           │                    │
  │                        │<──────────────────────────┤                           │                    │
  │                        │ {conversationId, initial  │                           │                    │
  │                        │  Message, templates}      │                           │                    │
  │                        │                           │                           │                    │
  │<───────────────────────┤                           │                           │                    │
  │ Display AI welcome     │                           │                           │                    │
  │ message + templates    │                           │                           │                    │
  │                        │                           │                           │                    │
```

---

### Sequence Diagram 2: Saving Intention (with Opt-In)

```
User            IntentionReviewScreen    intentionGuidanceAIService    Supabase
  │                    │                           │                      │
  │ Review intention   │                           │                      │
  │ Toggle "Save"      │                           │                      │
  ├────────────────────>│                           │                      │
  │                    │                           │                      │
  │                    │ Show opt-in explanation   │                      │
  │<───────────────────┤                           │                      │
  │                    │                           │                      │
  │ Confirm opt-in     │                           │                      │
  │ Tap "Save & Continue"                          │                      │
  ├────────────────────>│                           │                      │
  │                    │                           │                      │
  │                    │ saveIntention(...)        │                      │
  │                    ├──────────────────────────>│                      │
  │                    │                           │                      │
  │                    │                           │ getUserPreferences() │
  │                    │                           ├─────────────────────>│
  │                    │                           │                      │
  │                    │                           │   SELECT save_by_    │
  │                    │                           │   default FROM...    │
  │                    │                           │<────────────────────┤
  │                    │                           │  {save_by_default}   │
  │                    │                           │                      │
  │                    │                           │ Check opt-in         │
  │                    │                           │ (userWantsToSave ||  │
  │                    │                           │  save_by_default)    │
  │                    │                           │                      │
  │                    │                           │ INSERT INTO session_ │
  │                    │                           │ intentions (...)     │
  │                    │                           ├─────────────────────>│
  │                    │                           │                      │
  │                    │                           │   RLS Check:         │
  │                    │                           │   auth.uid() =       │
  │                    │                           │   user_id            │
  │                    │                           │                      │
  │                    │                           │<────────────────────┤
  │                    │                           │  {intentionId, ...}  │
  │                    │                           │                      │
  │                    │<──────────────────────────┤                      │
  │                    │ {success, intentionId}    │                      │
  │                    │                           │                      │
  │<───────────────────┤                           │                      │
  │ Show success       │                           │                      │
  │ "Intention saved!"│                           │                      │
  │                    │                           │                      │
  │                    │ Clear draft from          │                      │
  │                    │ AsyncStorage              │                      │
  │                    │                           │                      │
  │                    │ Navigate to next screen   │                      │
  │<───────────────────┤                           │                      │
  │                    │                           │                      │
```

---

### Sequence Diagram 3: Offline Template Browsing

```
User            SetIntentionScreen    AsyncStorage    Supabase
  │                    │                    │             │
  │ Open "Browse       │                    │             │
  │  Templates"        │                    │             │
  ├────────────────────>│                    │             │
  │                    │                    │             │
  │                    │ Check network      │             │
  │                    │ connectivity       │             │
  │                    │                    │             │
  │                    │ [OFFLINE]          │             │
  │                    │                    │             │
  │                    │ Load cached        │             │
  │                    │ templates          │             │
  │                    ├───────────────────>│             │
  │                    │                    │             │
  │                    │ getItem('cached_   │             │
  │                    │ templates_...')    │             │
  │                    │<──────────────────┤             │
  │                    │ {templates, ...}   │             │
  │                    │                    │             │
  │                    │ Check if expired   │             │
  │                    │ (< 7 days old)     │             │
  │                    │                    │             │
  │<───────────────────┤                    │             │
  │ Display templates  │                    │             │
  │ (with "Offline"    │                    │             │
  │  indicator)        │                    │             │
  │                    │                    │             │
  │ Select template    │                    │             │
  ├────────────────────>│                    │             │
  │                    │                    │             │
  │                    │ Open draft editor  │             │
  │                    │ (pre-filled with   │             │
  │                    │  template text)    │             │
  │<───────────────────┤                    │             │
  │                    │                    │             │
  │                    │ Save draft locally │             │
  │                    ├───────────────────>│             │
  │                    │ setItem('intention_│             │
  │                    │ draft_...')        │             │
  │                    │                    │             │
  │                    │ Show "Will sync    │             │
  │                    │ when online"       │             │
  │<───────────────────┤                    │             │
  │                    │                    │             │
```

---

## API Specifications

See [Backend Architecture > API Design](#api-design) section for full API specs.

**Summary:**

| API Method | Purpose | Auth Required | RLS Enforced |
|-----------|---------|---------------|--------------|
| `startIntentionConversation()` | Initialize conversation | Yes | N/A (reads only) |
| `continueIntentionConversation()` | Continue conversation | Yes | N/A (AI service) |
| `getTemplates()` | Fetch templates | Yes | Yes (RLS) |
| `saveIntention()` | Save intention | Yes | Yes (RLS) |
| `getUserPreferences()` | Get preferences | Yes | Yes (RLS) |
| `updateUserPreferences()` | Update preferences | Yes | Yes (RLS) |

---

## Service Layer Design

### intentionGuidanceAIService.js (New Service)

**File:** `lib/intentionGuidanceAIService.js`

**Responsibilities:**
1. Orchestrate intention-setting conversation flow
2. Load and filter intention templates
3. Save/update/delete intentions (with privacy checks)
4. Manage user preferences
5. Delegate AI calls to `enhancedClaudeService.js`

**Architecture Pattern:** Facade + Delegation

```javascript
// lib/intentionGuidanceAIService.js
import enhancedClaudeService from './enhancedClaudeService';
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

class IntentionGuidanceAIService {
  constructor() {
    this.enhancedClaudeService = enhancedClaudeService;
  }

  // ===== Conversation Methods =====

  /**
   * Start a new intention-setting conversation
   * @param {object} context - User context
   * @returns {Promise<object>} Initial conversation data
   */
  async startIntentionConversation(context) {
    // Implementation in API Design section
  }

  /**
   * Continue the intention conversation
   * @param {string} message - User's message
   * @param {object} context - Conversation context
   * @returns {Promise<object>} AI response with suggestions
   */
  async continueIntentionConversation(message, context) {
    // Implementation in API Design section
  }

  /**
   * Build intention-specific prompt for Claude
   * @param {object} options - Prompt options
   * @returns {string} Enhanced prompt
   * @private
   */
  buildIntentionPrompt(options) {
    const { stage, message, sessionType, nervousSystemState, conversationHistory, currentDraft } = options;

    // Base system prompt for intention guidance
    let prompt = `You are Huxley, a therapeutic guide helping someone set a meaningful intention for a psychedelic session.

CONTEXT:
- Session Type: ${sessionType || 'general'}
- Nervous System State: ${nervousSystemState}
- Conversation Stage: ${stage}

PRINCIPLES:
- Non-prescriptive: Suggest, don't dictate
- Trauma-informed: Gentle, validating language
- Somatic awareness: Connect to body when appropriate
- IFS-informed: Recognize parts (manager, firefighter, exile)
- Culturally sensitive: No religious assumptions

CONVERSATION STAGES:
1. WELCOME: Introduce yourself warmly, ask about session type and what's present
2. EXPLORATION: Ask reflective questions to help clarify intention (3-4 exchanges)
   - "What part of you is calling for attention?"
   - "What would healing/exploration/creativity look like?"
   - "What's most alive in you right now?"
3. FORMULATION: Help user articulate their intention (1-2 sentences)
   - Clear, specific, actionable
   - "I intend to..." format
   - Focused on one area (not multiple intentions)
4. REFINEMENT: Offer gentle feedback on draft intention
   - Is it specific enough?
   - Does it resonate with what they've shared?
   - Suggestions for clarification
5. REVIEW: Affirm their intention, celebrate courage, offer final reflection

CURRENT STAGE: ${stage}

${currentDraft ? `CURRENT DRAFT INTENTION:\n"${currentDraft}"\n` : ''}

${conversationHistory?.length > 0 ? `
CONVERSATION HISTORY:
${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}
` : ''}

USER'S MESSAGE: "${message}"

Respond with warmth, therapeutic attunement, and curiosity. Keep responses 2-4 sentences. If appropriate, suggest moving to the next stage (e.g., "Would you like to try drafting your intention now?").`;

    return prompt;
  }

  /**
   * Detect current conversation stage
   * @param {Array} conversationHistory - Message history
   * @param {string} currentDraft - Current draft intention
   * @returns {string} Stage name
   * @private
   */
  detectConversationStage(conversationHistory, currentDraft) {
    if (!conversationHistory || conversationHistory.length === 0) {
      return 'welcome';
    }

    if (currentDraft && currentDraft.length > 0) {
      return 'refinement';
    }

    const messageCount = conversationHistory.length;
    if (messageCount < 4) {
      return 'exploration';
    } else if (messageCount < 8) {
      return 'formulation';
    } else {
      return 'review';
    }
  }

  /**
   * Analyze AI response for suggested actions
   * @param {string} message - AI's response
   * @param {string} stage - Current stage
   * @returns {Array} Suggested actions
   * @private
   */
  analyzeSuggestedActions(message, stage) {
    const actions = [];
    const lowerMessage = message.toLowerCase();

    // Stage-specific suggestions
    if (stage === 'formulation' || stage === 'refinement') {
      if (lowerMessage.includes('draft') || lowerMessage.includes('try writing')) {
        actions.push({
          type: 'start_draft',
          message: 'Start drafting your intention'
        });
      }
    }

    if (stage === 'refinement' || stage === 'review') {
      actions.push({
        type: 'review_intention',
        message: 'Review your intention'
      });
    }

    // Template suggestions
    if (lowerMessage.includes('template') || lowerMessage.includes('example')) {
      actions.push({
        type: 'browse_templates',
        message: 'Browse example intentions'
      });
    }

    return actions;
  }

  // ===== Template Methods =====

  /**
   * Get intention templates
   * @param {string} framework - Framework filter
   * @param {string} sessionType - Session type filter
   * @param {object} options - Additional options
   * @returns {Promise<Array>} Templates
   */
  async getTemplates(framework = null, sessionType = null, options = {}) {
    // Implementation in API Design section
  }

  /**
   * Search templates by tag
   * @param {string} tag - Tag to search
   * @returns {Promise<Array>} Matching templates
   */
  async searchTemplatesByTag(tag) {
    const { data, error } = await supabase
      .from('intention_templates')
      .select('*')
      .eq('is_active', true)
      .contains('tags', [tag])
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error searching templates:', error);
      throw new Error('Failed to search templates');
    }

    return data;
  }

  // ===== Intention CRUD Methods =====

  /**
   * Save intention to database (with opt-in check)
   * @param {object} intention - Intention data
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID (optional)
   * @returns {Promise<object>} Save result
   */
  async saveIntention(intention, userId, sessionId = null) {
    // Implementation in API Design section
  }

  /**
   * Update intention (e.g., add rating after session)
   * @param {string} intentionId - Intention ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated intention
   */
  async updateIntention(intentionId, updates) {
    const { data, error } = await supabase
      .from('session_intentions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', intentionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating intention:', error);
      throw new Error('Failed to update intention');
    }

    return data;
  }

  /**
   * Soft delete intention
   * @param {string} intentionId - Intention ID
   * @returns {Promise<object>} Deleted intention
   */
  async deleteIntention(intentionId) {
    const { data, error } = await supabase
      .from('session_intentions')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', intentionId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting intention:', error);
      throw new Error('Failed to delete intention');
    }

    return data;
  }

  // ===== User Preferences Methods =====

  /**
   * Get user preferences (creates default if not exists)
   * @param {string} userId - User ID
   * @returns {Promise<object>} User preferences
   */
  async getUserPreferences(userId) {
    // Implementation in API Design section
  }

  /**
   * Update user preferences
   * @param {string} userId - User ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated preferences
   */
  async updateUserPreferences(userId, updates) {
    const { data, error } = await supabase
      .from('user_intention_preferences')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update preferences');
    }

    return data;
  }
}

export default new IntentionGuidanceAIService();
```

---

### Integration with enhancedClaudeService.js

**No modifications needed to `enhancedClaudeService.js`.**

It already provides:
- Context-aware conversations
- Nervous system assessment
- Streaming responses
- Error handling & retries
- Metrics logging

**Integration pattern:**

```javascript
// In intentionGuidanceAIService.js
const aiResponse = await this.enhancedClaudeService.continueConversation(
  intentionPrompt, // Built by buildIntentionPrompt()
  {
    nervousSystemState: context.nervousSystemState,
    sessionPhase: 'intention_setting', // New phase
    userId: context.userId,
    conversationHistory: context.conversationHistory
  }
);
```

**New session phase:** `'intention_setting'`
- Add to `determineSessionPhase()` logic if needed
- Otherwise, no changes to `enhancedClaudeService.js`

---

## Error Handling & Resilience

### Error Categories

| Error Type | Cause | User Impact | Mitigation |
|-----------|-------|-------------|------------|
| **Network Error** | No internet, Supabase down | Cannot load templates, save intention | Offline mode, cached templates, local drafts |
| **API Error** | Claude API rate limit, timeout | AI not responding | Show error, offer template browsing |
| **Database Error** | RLS policy failure, constraint violation | Save failed | Clear error message, retry option |
| **Privacy Error** | User tried to save without opt-in | Save blocked | Show opt-in modal |
| **Validation Error** | Intention too long, empty | Save failed | Inline validation, character count |

### Error Handling Patterns

#### 1. Network Errors (Offline Mode)

```javascript
// In intentionGuidanceAIService.js
async getTemplates(framework, sessionType) {
  try {
    // Try to fetch from Supabase
    const { data, error } = await supabase
      .from('intention_templates')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    // Cache templates for offline use
    await AsyncStorage.setItem(
      'cached_templates',
      JSON.stringify({
        templates: data,
        cachedAt: new Date().toISOString()
      })
    );

    return data;

  } catch (error) {
    console.error('Network error fetching templates:', error);

    // Fallback to cached templates
    const cached = await AsyncStorage.getItem('cached_templates');
    if (cached) {
      const { templates, cachedAt } = JSON.parse(cached);
      const age = Date.now() - new Date(cachedAt).getTime();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (age < maxAge) {
        console.log('Using cached templates (offline mode)');
        return templates;
      }
    }

    // No cache available
    throw new Error('Unable to load templates. Please check your internet connection.');
  }
}
```

**User Experience:**
- Show "Offline" indicator in UI
- Display cached templates
- Disable AI conversation (requires network)
- Allow drafting intentions locally
- Queue save for when online

---

#### 2. Claude API Errors

```javascript
// In intentionGuidanceAIService.js
async continueIntentionConversation(message, context) {
  try {
    const aiResponse = await this.enhancedClaudeService.continueConversation(
      this.buildIntentionPrompt({ message, ...context }),
      context
    );

    return aiResponse;

  } catch (error) {
    console.error('Claude API error:', error);

    // Check error type
    if (error.message.includes('rate limit')) {
      throw new Error('AI service is temporarily busy. Please try again in a moment.');
    }

    if (error.message.includes('timeout')) {
      throw new Error('AI response timed out. Please try again.');
    }

    // Generic fallback
    throw new Error('Unable to connect to AI guidance. You can still browse templates or write your own intention.');
  }
}
```

**User Experience:**
- Show error message in conversation UI
- Offer alternative: "Browse Templates" or "Write My Own"
- Retry button (with exponential backoff)
- No loss of conversation history (stored in state)

---

#### 3. Database Errors (RLS, Constraints)

```javascript
// In intentionGuidanceAIService.js
async saveIntention(intention, userId, sessionId) {
  try {
    // Privacy check
    const preferences = await this.getUserPreferences(userId);
    if (!intention.userWantsToSave && !preferences.save_by_default) {
      throw new Error('PRIVACY_OPT_IN_REQUIRED');
    }

    // Validation
    if (!intention.intentionText || intention.intentionText.trim().length === 0) {
      throw new Error('VALIDATION_ERROR: Intention text is required');
    }

    if (intention.intentionText.length > 2000) {
      throw new Error('VALIDATION_ERROR: Intention text too long (max 2000 characters)');
    }

    // Save to database
    const { data, error } = await supabase
      .from('session_intentions')
      .insert([{
        user_id: userId,
        session_id: sessionId,
        intention_text: intention.intentionText,
        framework: intention.framework,
        session_type: intention.sessionType,
        ai_conversation_context: intention.aiConversationContext || {},
        inspired_by_template_id: intention.inspiredByTemplateId
      }])
      .select()
      .single();

    if (error) {
      // RLS policy failure
      if (error.code === '42501') { // Insufficient privilege
        throw new Error('Permission denied: You can only save your own intentions.');
      }

      // Constraint violation
      if (error.code === '23503') { // Foreign key violation
        throw new Error('Invalid session ID. Please select a valid session.');
      }

      // Generic database error
      throw new Error('DATABASE_ERROR: ' + error.message);
    }

    return {
      success: true,
      intentionId: data.id,
      created_at: data.created_at,
      message: 'Your intention has been saved'
    };

  } catch (error) {
    console.error('Error saving intention:', error);

    // Categorize error for user-facing message
    if (error.message === 'PRIVACY_OPT_IN_REQUIRED') {
      return {
        success: false,
        error: 'Please confirm you want to save this intention',
        errorCode: 'PRIVACY_OPT_IN_REQUIRED'
      };
    }

    if (error.message.startsWith('VALIDATION_ERROR')) {
      return {
        success: false,
        error: error.message.replace('VALIDATION_ERROR: ', ''),
        errorCode: 'VALIDATION_ERROR'
      };
    }

    if (error.message.startsWith('DATABASE_ERROR')) {
      return {
        success: false,
        error: 'Failed to save intention. Please try again.',
        errorCode: 'DATABASE_ERROR'
      };
    }

    // Unknown error
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      errorCode: 'UNKNOWN_ERROR'
    };
  }
}
```

**User Experience:**
- Clear, actionable error messages
- Retry button for transient errors
- Fallback to local save (AsyncStorage) if database fails
- Show "Will sync when online" indicator

---

#### 4. Graceful Degradation Strategy

**Priority Levels:**

1. **P0 (Critical):** Drafting intention locally
   - Must always work (no network required)
   - Store in AsyncStorage
   - No degradation

2. **P1 (Important):** Browsing templates
   - Try network first
   - Fall back to cached templates
   - Show "Offline" indicator

3. **P2 (Nice-to-have):** AI conversation
   - Requires network
   - Clear error message if unavailable
   - Offer alternatives (templates, manual drafting)

4. **P3 (Optional):** Saving to database
   - Requires network
   - Fall back to local save
   - Queue for sync when online

---

## Security Architecture

### Privacy-First Design Principles

1. **Opt-in storage by default**
   - Intentions are NOT saved unless user explicitly opts in
   - Clear, prominent privacy notice
   - User can change preference anytime

2. **Row Level Security (RLS)**
   - Users can only access their own intentions and preferences
   - Enforced at database level (Supabase)
   - No way to bypass in application code

3. **Encryption at rest**
   - `intention_text` and `ai_conversation_context` encrypted by Supabase
   - Transparent encryption (no application code changes)
   - Decryption automatic on query

4. **No analytics on content**
   - Intention text never sent to analytics
   - Only aggregate metrics (count, usage %)
   - No PII in logs

5. **Soft deletes with recovery window**
   - 30-day recovery window
   - Hard delete after 30 days
   - User can manually delete immediately

### Authentication & Authorization

#### Authentication (Supabase Auth)

```javascript
// Already handled by existing app auth
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  // Redirect to AuthScreen
  navigation.navigate('Auth');
  return;
}

// User is authenticated, proceed with intention-setting
```

#### Authorization (RLS Policies)

**See Database Design (Step 2) for full RLS policies.**

**Summary:**

| Table | Policy | Effect |
|-------|--------|--------|
| `intention_templates` | Authenticated users can SELECT active templates | Users can browse templates |
| `session_intentions` | Users can SELECT own intentions (is_deleted=false) | Users see only their intentions |
| `session_intentions` | Users can INSERT own intentions | Users can create intentions |
| `session_intentions` | Users can UPDATE own intentions | Users can edit/rate intentions |
| `session_intentions` | Users can soft-delete own intentions | Users can delete intentions |
| `user_intention_preferences` | Users can SELECT/INSERT/UPDATE own preferences | 1:1 user-preferences |

**RLS testing:**
```sql
-- Test as user A (should succeed)
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-a-uuid';

SELECT * FROM session_intentions; -- Should return only user A's intentions

-- Test as user B trying to access user A's intention (should fail)
SET request.jwt.claim.sub = 'user-b-uuid';
SELECT * FROM session_intentions WHERE id = 'user-a-intention-id'; -- Returns nothing (RLS blocks)
```

### Input Validation

#### Client-Side Validation

```javascript
// In SetIntentionScreen.js
const validateIntention = (text) => {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Intention cannot be empty' };
  }

  if (text.length > 2000) {
    return { valid: false, error: 'Intention too long (max 2000 characters)' };
  }

  // Check for potential XSS (basic sanitization)
  const dangerousPatterns = [/<script/i, /javascript:/i, /onerror=/i];
  if (dangerousPatterns.some(pattern => pattern.test(text))) {
    return { valid: false, error: 'Invalid characters detected' };
  }

  return { valid: true };
};

// Use before saving
const validation = validateIntention(draftIntention);
if (!validation.valid) {
  Alert.alert('Validation Error', validation.error);
  return;
}
```

#### Server-Side Validation (Database Constraints)

```sql
-- In database schema (from Step 2)
ALTER TABLE session_intentions
  ADD CONSTRAINT session_intentions_text_length
  CHECK (char_length(intention_text) <= 2000);

ALTER TABLE session_intentions
  ADD CONSTRAINT session_intentions_text_not_empty
  CHECK (char_length(trim(intention_text)) > 0);
```

### Sensitive Data Handling

**What's considered sensitive:**
- `intention_text` (user's personal intention)
- `ai_conversation_context` (metadata about conversation)
- `user_notes` (reflections after session)

**How it's protected:**
1. **Encrypted at rest** (Supabase encryption)
2. **RLS enforced** (user isolation)
3. **No logging** (never log intention_text)
4. **No analytics** (never send to external services)
5. **Soft deletes** (recovery window, then hard delete)

**Example: Logging without PII**
```javascript
// GOOD: Log without sensitive data
console.log('Intention saved', {
  userId: user.id,
  sessionType: intention.sessionType,
  framework: intention.framework,
  intentionLength: intention.intentionText.length, // Length, not content
  timestamp: new Date().toISOString()
});

// BAD: Logging sensitive data
console.log('Intention saved', {
  intentionText: intention.intentionText // NEVER LOG THIS
});
```

---

## Performance & Optimization

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Initial AI Response** | <3s | Time to first token from Claude API |
| **Template Load** | <500ms | Fetch + render templates |
| **Save Intention** | <1s | Database insert + confirmation |
| **Screen Transition** | <300ms | Navigate between screens |
| **Offline Template Load** | <100ms | AsyncStorage read + render |

### Optimization Strategies

#### 1. AI Response Streaming

**Problem:** Waiting for full AI response (1-2s) feels slow

**Solution:** Stream response character-by-character

```javascript
// In enhancedClaudeService.js (already supports streaming)
async callClaudeAPI(prompt, userId) {
  const response = await fetch(this.baseURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      stream: true, // Enable streaming
      messages: [{ role: 'user', content: prompt }]
    })
  });

  // Read stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    text += chunk;

    // Emit chunk to frontend (via callback or event)
    if (this.onStreamChunk) {
      this.onStreamChunk(chunk);
    }
  }

  return text;
}
```

**Frontend integration:**
```javascript
// In AIConversationComponent.js
enhancedClaudeService.onStreamChunk = (chunk) => {
  setStreamingMessage(prev => prev + chunk);
};
```

---

#### 2. Template Caching

**Strategy:** Cache templates in AsyncStorage for 7 days

```javascript
// In intentionGuidanceAIService.js
async getTemplates(framework, sessionType) {
  const cacheKey = `templates_${framework}_${sessionType}`;

  // Try cache first
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    const { templates, cachedAt } = JSON.parse(cached);
    const age = Date.now() - new Date(cachedAt).getTime();

    if (age < 7 * 24 * 60 * 60 * 1000) { // 7 days
      console.log('Using cached templates');
      return templates;
    }
  }

  // Fetch fresh templates
  const { data, error } = await supabase
    .from('intention_templates')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;

  // Update cache
  await AsyncStorage.setItem(cacheKey, JSON.stringify({
    templates: data,
    cachedAt: new Date().toISOString()
  }));

  return data;
}
```

---

#### 3. Lazy Loading Components

**Problem:** Loading all components upfront slows initial render

**Solution:** Lazy load heavy components

```javascript
// In SetIntentionScreen.js
import React, { lazy, Suspense } from 'react';

const AIConversationComponent = lazy(() => import('../components/intention/AIConversationComponent'));
const TemplateLibrary = lazy(() => import('../components/intention/TemplateLibrary'));

const SetIntentionScreen = () => {
  const [mode, setMode] = useState('welcome');

  return (
    <View>
      {mode === 'welcome' && <WelcomeView />}

      {mode === 'conversation' && (
        <Suspense fallback={<LoadingSpinner />}>
          <AIConversationComponent />
        </Suspense>
      )}

      {mode === 'templates' && (
        <Suspense fallback={<LoadingSpinner />}>
          <TemplateLibrary />
        </Suspense>
      )}
    </View>
  );
};
```

---

#### 4. Database Query Optimization

**Use partial indexes** (from database design):
```sql
-- Only index active templates
CREATE INDEX idx_intention_templates_active_framework_type
  ON public.intention_templates(framework, session_type, sort_order)
  WHERE is_active = TRUE;
```

**Use SELECT with specific columns** (not SELECT *):
```javascript
// GOOD: Specific columns
const { data } = await supabase
  .from('intention_templates')
  .select('id, title, intention_text, framework, session_type')
  .eq('is_active', true);

// BAD: SELECT * (fetches unnecessary columns)
const { data } = await supabase
  .from('intention_templates')
  .select('*');
```

---

#### 5. Debounced Draft Saving

**Problem:** Saving draft on every keystroke is expensive

**Solution:** Debounce saves (5s delay)

```javascript
// In SetIntentionScreen.js
import { useEffect, useRef } from 'react';

const SetIntentionScreen = () => {
  const [draftIntention, setDraftIntention] = useState('');
  const saveDraftTimeoutRef = useRef(null);

  useEffect(() => {
    // Debounce draft saving
    if (saveDraftTimeoutRef.current) {
      clearTimeout(saveDraftTimeoutRef.current);
    }

    saveDraftTimeoutRef.current = setTimeout(() => {
      saveDraftToLocal(draftIntention);
    }, 5000); // 5 seconds

    return () => {
      if (saveDraftTimeoutRef.current) {
        clearTimeout(saveDraftTimeoutRef.current);
      }
    };
  }, [draftIntention]);

  const saveDraftToLocal = async (text) => {
    await AsyncStorage.setItem('intention_draft', JSON.stringify({
      text,
      lastSaved: new Date().toISOString()
    }));
    console.log('Draft auto-saved');
  };

  return (
    <TextInput
      value={draftIntention}
      onChangeText={setDraftIntention}
      placeholder="I intend to..."
    />
  );
};
```

---

## Offline Capability

### Offline Features

| Feature | Online | Offline | Notes |
|---------|--------|---------|-------|
| **Browse Templates** | ✅ Fresh data | ✅ Cached (7 days) | Show "Offline" indicator |
| **Draft Intention** | ✅ Full features | ✅ Full features | Always available |
| **AI Conversation** | ✅ Full features | ❌ Unavailable | Requires network |
| **Save Intention** | ✅ To database | ⚠️ Queue for sync | Store locally, sync later |
| **Load User Prefs** | ✅ From database | ✅ Cached | Loaded on app start |

### Offline Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SetIntentionScreen                    │
└───────────────────────┬─────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
         Online                 Offline
            │                       │
            ▼                       ▼
┌────────────────────────┐  ┌──────────────────────────┐
│  Network Operations    │  │  Local Operations        │
│  - Fetch templates     │  │  - Read cached templates │
│  - AI conversation     │  │  - Draft in AsyncStorage│
│  - Save to Supabase    │  │  - Queue saves           │
└────────────────────────┘  └──────────┬───────────────┘
                                       │
                                       │ When online
                                       ▼
                            ┌────────────────────────┐
                            │  Sync Queue            │
                            │  - Process queued saves│
                            │  - Update cache        │
                            └────────────────────────┘
```

### Sync Queue Implementation

```javascript
// lib/syncQueue.js (new utility)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import NetInfo from '@react-native-community/netinfo';

class SyncQueue {
  constructor() {
    this.queueKey = 'intention_sync_queue';
    this.isProcessing = false;

    // Listen for network changes
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Add intention save to queue
   */
  async queueIntentionSave(intention, userId, sessionId) {
    const queue = await this.getQueue();
    queue.push({
      id: `save_${Date.now()}`,
      type: 'save_intention',
      data: { intention, userId, sessionId },
      queuedAt: new Date().toISOString()
    });
    await this.setQueue(queue);
    console.log('Intention queued for sync');
  }

  /**
   * Process queued operations when online
   */
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const queue = await this.getQueue();
      if (queue.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`Processing ${queue.length} queued operations...`);

      const processed = [];
      const failed = [];

      for (const operation of queue) {
        try {
          if (operation.type === 'save_intention') {
            const { intention, userId, sessionId } = operation.data;
            await intentionGuidanceAIService.saveIntention(intention, userId, sessionId);
            processed.push(operation.id);
            console.log('Synced intention:', operation.id);
          }
        } catch (error) {
          console.error('Failed to sync operation:', operation.id, error);
          failed.push(operation);
        }
      }

      // Remove processed operations
      const remainingQueue = queue.filter(op => !processed.includes(op.id));
      await this.setQueue(remainingQueue);

      console.log(`Sync complete: ${processed.length} synced, ${failed.length} failed`);

    } finally {
      this.isProcessing = false;
    }
  }

  async getQueue() {
    const json = await AsyncStorage.getItem(this.queueKey);
    return json ? JSON.parse(json) : [];
  }

  async setQueue(queue) {
    await AsyncStorage.setItem(this.queueKey, JSON.stringify(queue));
  }

  async clearQueue() {
    await AsyncStorage.removeItem(this.queueKey);
  }
}

export default new SyncQueue();
```

**Usage in SetIntentionScreen:**
```javascript
const handleSaveIntention = async () => {
  const netInfo = await NetInfo.fetch();

  if (netInfo.isConnected) {
    // Online: Save directly
    await intentionGuidanceAIService.saveIntention(intention, userId, sessionId);
    Alert.alert('Saved', 'Your intention has been saved');
  } else {
    // Offline: Queue for sync
    await syncQueue.queueIntentionSave(intention, userId, sessionId);
    Alert.alert('Queued', 'Your intention will be saved when you\'re back online');
  }
};
```

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|-----------|--------|------------|-------|
| **Claude API rate limits** | Medium | High | Implement caching, template fallback, rate limit handling | Backend |
| **Streaming not working on Android** | Low | Medium | Test thoroughly, fallback to non-streaming | Frontend |
| **RLS policy misconfiguration** | Low | Critical | Comprehensive testing, peer review, automated tests | Database |
| **Privacy breach (wrong user sees intention)** | Very Low | Critical | Strict RLS policies, extensive testing | Database |
| **Offline sync conflicts** | Low | Low | Last-write-wins, user notification | Backend |
| **AsyncStorage size limits** | Low | Low | Clear old drafts >7 days, limit cache size | Frontend |

### Product Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Low adoption (users skip feature)** | Medium | Medium | User testing, clear value prop, onboarding |
| **AI guidance too prescriptive** | Medium | High | Careful prompt engineering, user feedback loops |
| **Users feel pressured to save** | Low | Medium | Clear opt-out, default to NOT saving |
| **Intention quality is low** | Medium | Low | Provide examples, AI refinement suggestions |

### Security Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Intention data leaked** | Very Low | Critical | Encryption at rest, RLS, no analytics |
| **XSS via intention text** | Low | Medium | Input sanitization, React escapes by default |
| **SQL injection** | Very Low | High | Supabase parameterized queries (ORM) |
| **Unauthorized access** | Very Low | High | RLS policies, Supabase Auth |

### Mitigation Strategies

**High-impact mitigations:**
1. ✅ **Privacy-first design**: Opt-in storage, clear privacy notice, user control
2. ✅ **Row Level Security**: Enforced at database level, comprehensive policies
3. ✅ **Offline fallback**: Cached templates, local drafts, sync queue
4. ✅ **Error handling**: Graceful degradation, clear error messages, retry logic
5. ✅ **Testing**: Unit tests (services), integration tests (RLS), E2E tests (user flows)

---

## Implementation Roadmap

### Phase 1: Foundation (Days 1-2)

**Goals:**
- Database tables created
- Service layer implemented
- Basic UI screens

**Tasks:**
1. ✅ Database migration (Step 2 complete)
2. ✅ Seed intention templates (20-30 curated examples)
3. ✅ Create `intentionGuidanceAIService.js`
   - Implement `startIntentionConversation()`
   - Implement `continueIntentionConversation()`
   - Implement `getTemplates()`
   - Implement `saveIntention()`
   - Implement `getUserPreferences()`
4. ✅ Create `IntentionPreferencesContext.js`
5. ✅ Create basic `SetIntentionScreen.js` (welcome view only)

**Deliverables:**
- Database schema deployed
- Service layer tested (unit tests)
- Basic screen renders

---

### Phase 2: Core Features (Days 3-4)

**Goals:**
- AI conversation working
- Template browsing working
- Draft editor working

**Tasks:**
1. Implement `AIConversationComponent.js`
   - Message list with streaming
   - Input area
   - Suggested actions
2. Implement `TemplateLibrary.js`
   - Filter bar
   - Template cards
   - Search
3. Implement draft editor in `SetIntentionScreen`
   - Multiline text input
   - Character count
   - Auto-save to AsyncStorage
4. Implement `IntentionReviewScreen.js`
   - Display intention
   - Opt-in toggle
   - Save/skip buttons

**Deliverables:**
- End-to-end flow works (AI → draft → review → save)
- No offline support yet

---

### Phase 3: Polish & Offline (Day 5)

**Goals:**
- Offline capability
- Error handling
- Performance optimization

**Tasks:**
1. Implement template caching
2. Implement `syncQueue.js` (offline save queueing)
3. Add error handling (network, API, database)
4. Add loading states & indicators
5. Optimize streaming performance
6. Add Noesis theme styling

**Deliverables:**
- Works offline (cached templates, local drafts)
- Graceful error handling
- Polished UI

---

### Phase 4: Testing & Refinement (Day 6)

**Goals:**
- Comprehensive testing
- Bug fixes
- User feedback

**Tasks:**
1. Unit tests (service layer methods)
2. Integration tests (RLS policies)
3. E2E tests (user flows)
4. Manual testing on iOS & Android
5. User testing (3-5 users)
6. Bug fixes & refinements

**Deliverables:**
- All tests passing
- Zero critical bugs
- User feedback incorporated

---

### Phase 5: Deployment (Day 7)

**Goals:**
- Deploy to production
- Monitor performance
- Launch communication

**Tasks:**
1. Database migration to production
2. Deploy app update via Expo
3. Monitor metrics (AI usage, save rate, errors)
4. Send launch announcement
5. Gather initial feedback

**Deliverables:**
- Feature live in production
- Monitoring dashboard setup
- Launch complete

---

## Testing Strategy

### Unit Tests

**Service Layer (lib/intentionGuidanceAIService.js):**

```javascript
// __tests__/intentionGuidanceAIService.test.js
import intentionGuidanceAIService from '../lib/intentionGuidanceAIService';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase');
jest.mock('../lib/enhancedClaudeService');

describe('intentionGuidanceAIService', () => {
  describe('getTemplates', () => {
    it('should fetch templates from Supabase', async () => {
      const mockTemplates = [
        { id: '1', title: 'Template 1', framework: 'ifs' }
      ];

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockTemplates, error: null })
          })
        })
      });

      const templates = await intentionGuidanceAIService.getTemplates('ifs');
      expect(templates).toEqual(mockTemplates);
    });

    it('should throw error if Supabase fails', async () => {
      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
          })
        })
      });

      await expect(intentionGuidanceAIService.getTemplates('ifs')).rejects.toThrow();
    });
  });

  describe('saveIntention', () => {
    it('should save intention if user opts in', async () => {
      const intention = {
        intentionText: 'I intend to heal',
        framework: 'ifs',
        sessionType: 'healing',
        userWantsToSave: true
      };

      // Mock getUserPreferences
      supabase.from = jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { save_by_default: false }, error: null })
          })
        })
      });

      // Mock insert
      supabase.from = jest.fn().mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: '123' }, error: null })
          })
        })
      });

      const result = await intentionGuidanceAIService.saveIntention(intention, 'user-id');
      expect(result.success).toBe(true);
    });

    it('should throw error if user does not opt in', async () => {
      const intention = {
        intentionText: 'I intend to heal',
        userWantsToSave: false
      };

      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { save_by_default: false }, error: null })
          })
        })
      });

      await expect(intentionGuidanceAIService.saveIntention(intention, 'user-id')).rejects.toThrow('PRIVACY_OPT_IN_REQUIRED');
    });
  });
});
```

---

### Integration Tests

**RLS Policy Testing:**

```sql
-- tests/rls/intention_rls.test.sql

BEGIN;

-- Create test users
INSERT INTO auth.users (id, email) VALUES
  ('user-a-id', 'usera@test.com'),
  ('user-b-id', 'userb@test.com');

-- Create test intentions
INSERT INTO public.session_intentions (id, user_id, intention_text, session_type, is_deleted)
VALUES
  ('intention-a', 'user-a-id', 'User A intention', 'healing', false),
  ('intention-b', 'user-b-id', 'User B intention', 'healing', false);

-- Test 1: User A can SELECT their own intention
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-a-id';

SELECT * FROM session_intentions WHERE id = 'intention-a';
-- Expected: 1 row (User A's intention)

-- Test 2: User A CANNOT SELECT User B's intention (RLS blocks)
SELECT * FROM session_intentions WHERE id = 'intention-b';
-- Expected: 0 rows (RLS blocks)

-- Test 3: User A can UPDATE their own intention
UPDATE session_intentions
SET user_rating = 5
WHERE id = 'intention-a';
-- Expected: Success

-- Test 4: User A CANNOT UPDATE User B's intention
UPDATE session_intentions
SET user_rating = 5
WHERE id = 'intention-b';
-- Expected: Failure (RLS blocks)

-- Test 5: User A can soft-delete their own intention
UPDATE session_intentions
SET is_deleted = true, deleted_at = NOW()
WHERE id = 'intention-a';
-- Expected: Success

ROLLBACK;
```

---

### E2E Tests (User Flows)

**Using Detox (React Native E2E testing):**

```javascript
// e2e/setIntention.e2e.js
describe('Set Intention Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    await device.reloadReactNative();
  });

  it('should complete intention-setting flow', async () => {
    // 1. Navigate to Set Intention screen
    await element(by.id('session-prep-button')).tap();
    await element(by.text('Set Your Intention')).tap();

    // 2. Skip onboarding (if first time)
    try {
      await element(by.id('skip-onboarding-button')).tap();
    } catch (e) {
      // Already completed onboarding
    }

    // 3. Choose "Talk with AI"
    await element(by.id('talk-with-ai-button')).tap();

    // 4. Wait for AI response
    await waitFor(element(by.id('ai-message')))
      .toBeVisible()
      .withTimeout(5000);

    // 5. Send a message
    await element(by.id('conversation-input')).typeText('I want to explore my grief');
    await element(by.id('send-button')).tap();

    // 6. Wait for AI response
    await waitFor(element(by.id('ai-message')))
      .toBeVisible()
      .withTimeout(5000);

    // 7. Navigate to draft editor
    await element(by.id('start-draft-button')).tap();

    // 8. Write intention
    await element(by.id('draft-editor')).typeText('I intend to approach my grief with compassion and curiosity.');

    // 9. Continue to review
    await element(by.id('continue-to-review-button')).tap();

    // 10. Opt in to save
    await element(by.id('opt-in-toggle')).tap();

    // 11. Save intention
    await element(by.id('save-intention-button')).tap();

    // 12. Verify success message
    await expect(element(by.text('Your intention has been saved'))).toBeVisible();
  });

  it('should work offline with cached templates', async () => {
    // 1. Disable network
    await device.disableNetwork();

    // 2. Navigate to Set Intention
    await element(by.id('set-intention-button')).tap();

    // 3. Choose "Browse Templates"
    await element(by.id('browse-templates-button')).tap();

    // 4. Verify offline indicator
    await expect(element(by.id('offline-indicator'))).toBeVisible();

    // 5. Verify templates are shown (cached)
    await expect(element(by.id('template-card'))).toBeVisible();

    // 6. Select a template
    await element(by.id('template-card')).atIndex(0).tap();

    // 7. Verify draft editor opens with template text
    await expect(element(by.id('draft-editor'))).toHaveText(/I intend to/);

    // 8. Continue to review
    await element(by.id('continue-to-review-button')).tap();

    // 9. Try to save (should queue for sync)
    await element(by.id('opt-in-toggle')).tap();
    await element(by.id('save-intention-button')).tap();

    // 10. Verify queued message
    await expect(element(by.text(/will be saved when you're back online/))).toBeVisible();

    // 11. Re-enable network
    await device.enableNetwork();
  });
});
```

---

## Appendix

### A. Noesis Theme Integration

**Colors to use:**

```javascript
// In SetIntentionScreen.js and child components
import { colors, spacing, borderRadius, shadows } from '../theme/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Soft cream
  },

  card: {
    backgroundColor: colors.surface, // White
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.soft
  },

  primaryButton: {
    backgroundColor: colors.primary, // Terra cotta
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },

  primaryButtonText: {
    color: colors.textInverse, // White
    fontSize: typography.lg,
    fontWeight: '600',
  },

  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },

  text: {
    color: colors.text, // Charcoal
    fontSize: typography.base,
  },

  textSecondary: {
    color: colors.textSecondary, // Medium gray
    fontSize: typography.sm,
  }
});
```

---

### B. Example Intention Templates (Content)

**See Database Design (Step 2) > Appendix A for full seed data.**

**Summary:**
- 12+ templates across 4 frameworks (IFS, Somatic, Existential, Healing)
- Each template includes:
  - Title
  - Intention text (example)
  - Description (when to use)
  - Framework & session type
  - Tags (for search)
  - Example use case
  - Source attribution

---

### C. Privacy Notice Copy

**For opt-in modal:**

> **Your Privacy Matters**
>
> Your intention is deeply personal. By default, we **do not** save your intention to our servers.
>
> **If you choose to save:**
> - Your intention will be encrypted and stored securely
> - Only you can access it (not even our team)
> - You can view, edit, or delete it anytime
> - It will be linked to your session (if you selected one)
>
> **If you don't save:**
> - Your intention stays on this device only
> - It won't be accessible on other devices
> - It will be cleared after 7 days
>
> You're in control. Choose what feels right for you.
>
> [Learn more about our privacy practices →](#)

---

### D. AI Prompt Examples (Full)

**Welcome Stage:**
```
You are Huxley, a therapeutic guide helping someone set a meaningful intention for a psychedelic session.

CONTEXT:
- Session Type: healing
- Nervous System State: ventral (safe, connected)
- Conversation Stage: welcome

USER'S MESSAGE: "I'm preparing for a psilocybin session focused on healing"

Respond warmly and ask what's present for them. Keep it 2-3 sentences.
```

**Exploration Stage:**
```
You are Huxley, helping someone clarify their intention.

CONTEXT:
- Session Type: healing
- Stage: exploration
- Previous exchanges: 2

CONVERSATION HISTORY:
user: "I want to work on my relationship with my mom"
assistant: "That's a meaningful focus. What aspect of that relationship feels most alive for you right now?"

USER'S MESSAGE: "I think it's about forgiving her for not being there when I was a kid"

Respond with a reflective question to deepen their exploration. Consider IFS parts work (which part wants forgiveness?). 2-3 sentences.
```

---

### E. Migration Checklist

**Pre-deployment:**
- [ ] Database migration tested in staging
- [ ] RLS policies verified
- [ ] Seed data loaded (intention templates)
- [ ] Service layer unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Manual testing on iOS
- [ ] Manual testing on Android
- [ ] User testing (3-5 users)
- [ ] Privacy review completed
- [ ] Security audit completed

**Deployment:**
- [ ] Backup production database
- [ ] Run migration on production
- [ ] Verify tables created
- [ ] Verify RLS policies active
- [ ] Verify seed data loaded
- [ ] Deploy app update via Expo
- [ ] Monitor error logs (first 24h)
- [ ] Monitor AI usage metrics
- [ ] Monitor save rate
- [ ] Gather user feedback

---

## Summary & Next Steps

### Architecture Highlights

✅ **Privacy-first design:** Opt-in storage, RLS, encryption, user control
✅ **Reuses existing services:** `enhancedClaudeService.js` for AI, `supabase.js` for database
✅ **New service layer:** `intentionGuidanceAIService.js` orchestrates intention-specific logic
✅ **Offline capability:** Cached templates, local drafts, sync queue
✅ **Streaming AI responses:** <3s perceived latency
✅ **Mobile-first UI:** React Native screens, Noesis theme, smooth navigation
✅ **Error handling:** Graceful degradation, clear error messages, retry logic
✅ **Performance optimized:** Template caching, lazy loading, debounced saves
✅ **Comprehensive testing:** Unit tests, RLS tests, E2E tests

### Next Steps

1. **Review this architecture** with team
2. **Proceed to Step 4:** Backend Implementation
   - Create `intentionGuidanceAIService.js`
   - Create database migration SQL
   - Seed intention templates
   - Test service layer
3. **Proceed to Step 5:** Frontend Implementation
   - Create `SetIntentionScreen.js`
   - Create child components (AIConversation, TemplateLibrary, etc.)
   - Implement navigation
   - Apply Noesis theme
4. **Proceed to Step 6:** Testing
   - Write unit tests
   - Write integration tests
   - Write E2E tests
   - Manual testing
5. **Deploy to production**

---

**Architecture Design Complete**
**Status:** Ready for Implementation (Step 4)
**Estimated Implementation Time:** 6-7 days
**Target Release:** Phase 1 (Week 3-4)

---

**Document Version:** 1.0
**Last Updated:** 2026-02-10
**Author:** Claude Sonnet 4.5 (Full-Stack Architect)
**Reviewed By:** [Pending]
