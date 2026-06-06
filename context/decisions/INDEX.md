# Architecture Decision Records (ADRs)

**Last Updated:** 2026-05-05

---

## What Are ADRs?

Architecture Decision Records (ADRs) document significant technical and product decisions made during development.

**Why Document Decisions?**
- Capture context at the time decision was made
- Help future developers understand "why"
- Avoid revisiting settled questions
- Track evolution of thinking

---

## When to Create an ADR

Create an ADR when you:
- Choose between significant technical alternatives
- Make architectural changes
- Select frameworks, libraries, or services
- Establish patterns or conventions
- Make product direction choices

**Don't Create ADRs For:**
- Minor implementation details
- Temporary workarounds
- Obvious choices
- Routine tasks

---

## ADR Template

```markdown
# ADR-XXX: [Decision Title]

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Superseded | Deprecated
**Deciders:** [Names or roles]

## Context

What's the issue or situation we're facing? What factors are influencing this decision?

## Decision

What did we decide to do?

## Rationale

Why did we make this choice? What were the key factors?

## Consequences

### Positive
- Benefits of this decision
- Problems it solves

### Negative
- Trade-offs or limitations
- Technical debt incurred

### Neutral
- Changes required
- Side effects

## Alternatives Considered

### Option 1: [Alternative Name]
**Description:** Brief description
**Pros:** Benefits
**Cons:** Drawbacks
**Why not chosen:** Reason

### Option 2: [Alternative Name]
...

## Implementation Notes

Key points about implementing this decision.

## References

- Links to relevant documentation
- Related ADRs
- External resources

---

**Superseded by:** ADR-XXX (if applicable)
**Supersedes:** ADR-XXX (if applicable)
```

---

## Existing ADRs

### Critical Decisions

**ADR-001: Use Modular Context Files** (2026-02-07)
- Status: Accepted
- Decision: Split large docs into 300-line files
- [View ADR →](2026-02-07-modular-context-system.md)

**ADR-002: React Native + Expo for Mobile Development** (2026-02-08)
- Status: Accepted (Retrospective)
- Decision: Use React Native 0.81.5 + Expo ~54.0.25
- [View ADR →](2026-02-08-react-native-expo-stack.md)

**ADR-003: Supabase for Backend Infrastructure** (2026-02-08)
- Status: Accepted (Retrospective)
- Decision: Use Supabase (PostgreSQL, Auth, RLS)
- [View ADR →](2026-02-08-supabase-backend.md)

**ADR-004: Claude API for AI Features** (2026-02-08)
- Status: Accepted (Retrospective)
- Decision: Use Anthropic Claude API (Sonnet model)
- [View ADR →](2026-02-08-claude-api-ai-integration.md)

**ADR-007: Intention as Goalpost — Brevity Over Depth** (2026-02-17)
- Status: Accepted
- Decision: Intention-setting should be 3 exchanges max, directional not prescriptive
- [View ADR →](2026-02-17-intention-as-goalpost.md)

**ADR-008: RAG Knowledge Base with pgvector + OpenAI Embeddings** (2026-02-25)
- Status: Accepted
- Decision: Semantic vector search over 276 PDFs + 27 protocols via Supabase pgvector
- [View ADR →](2026-02-25-rag-knowledge-base.md)

### Planned ADRs

**ADR-005: Distribution Strategy (VM vs EAS)**
- Status: Informally resolved (using Expo free tier; see BUG-003)
- Formal ADR still pending

**ADR-006: Testing Strategy**
- Status: Informally resolved (Jest + babel-jest; see FEAT-204)
- 477 tests passing; E2E strategy (Detox/Maestro) still TBD
- Formal ADR still pending

**ADR-009: HIPAA Posture — Non-HIPAA Wellness Tool** (2026-05-05)
- Status: Accepted
- Decision: Position Huxley as a non-HIPAA consumer wellness/educational tool. User data is sensitive personal data, not PHI. Standard vendor tiers (Supabase, Anthropic, OpenAI, Sentry) — no BAAs required.
- [View ADR →](2026-05-05-hipaa-posture.md)

**ADR-010: Separate Web Admin Dashboard** (2026-06-02)
- Status: Accepted
- Decision: Build admin analytics (starting with cost-per-user) as a separate web app reading the same Supabase project, not as screens in the consumer RN app. Same web property later hosts web subscription checkout.
- [View ADR →](2026-06-02-web-admin-dashboard.md)

---

## ADR Naming Convention

**Format:** `YYYY-MM-DD-brief-description.md`

**Examples:**
- `2026-02-07-modular-context-system.md`
- `2026-02-14-expo-eas-distribution.md`
- `2026-03-01-ai-prompting-strategy.md`

---

## ADR Statuses

**Proposed:**
- Decision being considered
- Still gathering input
- Not yet implemented

**Accepted:**
- Decision made and agreed upon
- Currently in effect
- Being implemented or already implemented

**Superseded:**
- Replaced by newer decision
- No longer in effect
- Keep for historical context

**Deprecated:**
- Decision no longer relevant
- Context has changed significantly
- Retained for history

---

## Review Process

**When Proposing:**
1. Write ADR in "Proposed" status
2. Share with team for feedback
3. Allow 2-3 days for discussion
4. Update based on feedback
5. Mark as "Accepted" when decided

**When Superseding:**
1. Create new ADR
2. Reference old ADR
3. Mark old ADR as "Superseded"
4. Update both ADRs with cross-links

---

## ADR Index

### By Category

**Infrastructure & DevOps:**
- ADR-001: Modular Context System (Accepted)
- ADR-005: Distribution Strategy (Proposed)

**Mobile Development:**
- ADR-002: React Native + Expo Stack (Accepted)

**Backend & Database:**
- ADR-003: Supabase Backend (Accepted)

**AI/ML:**
- ADR-004: Claude API Integration (Accepted)
- ADR-007: Intention as Goalpost (Accepted)
- ADR-008: RAG Knowledge Base (Accepted)

**Testing:**
- ADR-006: Testing Strategy (Informally resolved)

**Compliance & Legal:**
- ADR-009: HIPAA Posture — Non-HIPAA Wellness Tool (Accepted)

**UI/UX:**
- TBD

---

## Related Practices

**Lightweight Decision Log:**
For smaller decisions, use this format in planning docs:
```
**Decision:** Brief description
**Date:** YYYY-MM-DD
**Reason:** One-sentence rationale
```

**Full ADR:**
For significant decisions with multiple alternatives and long-term impact.

---

## Links

- [ADR Template](../README.md#decision-record-template)
- [Current Decisions](.) (this directory)
- [Roadmap](../roadmap/INDEX.md)
- [Project Status](../STATUS.md)

---

**Maintained By:** Development Team
**Review Cadence:** As needed
