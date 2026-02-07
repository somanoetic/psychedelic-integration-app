# Architecture Decision Records (ADRs)

**Last Updated:** 2026-02-07

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

### Planned ADRs

**ADR-002: Distribution Strategy (VM vs EAS)**
- Status: Proposed
- To be decided: Week of Feb 7-14
- Options: Fix VM networking vs. Move to Expo EAS

**ADR-003: AI Integration Approach**
- Status: Future
- To be decided: During Next Phase
- Options: Simple prompts vs. Complex conversational

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

**Infrastructure:**
- ADR-001: Modular Context System (Accepted)
- ADR-002: Distribution Strategy (Proposed)

**AI/ML:**
- ADR-003: AI Integration Approach (Future)

**Database:**
- TBD

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
