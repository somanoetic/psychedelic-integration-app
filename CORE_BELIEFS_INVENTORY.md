# Core Beliefs Inventory
**Source:** "Prisoners of Belief" by Matthew McKay, Ph.D. and Patrick Fanning

## 10 Core Belief Domains

### 1. Value (Worthiness)
**Core Statement:** "I am worthy"
- Items: 1, 21, 41, 61, 81 (T) + 11, 31, 51, 71, 91 (F)
- Measures: Self-worth, deserving of love and respect
- Low scores indicate: Feelings of being flawed, defective, unworthy

### 2. Security (Safety)
**Core Statement:** "I am safe"
- Items: 2, 22, 42, 62, 82 (T) + 12, 32, 52, 72, 92 (F)
- Measures: Sense of safety in the world
- Low scores indicate: Fear of disaster, danger, vulnerability

### 3. Performance (Competence)
**Core Statement:** "I am competent"
- Items: 3, 23, 43, 63, 83 (T) + 13, 33, 53, 73, 93 (F)
- Measures: Ability to perform tasks, trust in own judgment
- Low scores indicate: Incompetence, poor performance under stress

### 4. Control (Power)
**Core Statement:** "I am powerful"
- Items: 4, 24, 44, 64, 84 (T) + 14, 34, 54, 74, 94 (F)
- Measures: Sense of control over life and circumstances
- Low scores indicate: Powerlessness, being controlled by events

### 5. Love (Nurturance)
**Core Statement:** "I am loved"
- Items: 5, 25, 45, 65, 85 (T) + 15, 35, 55, 75, 95 (F)
- Measures: Feeling cared for, supported, nurtured
- Low scores indicate: Abandonment fears, feeling unloved

### 6. Autonomy (Independence)
**Core Statement:** "I am autonomous"
- Items: 6, 26, 46, 66, 86 (T) + 16, 36, 56, 76, 96 (F)
- Measures: Independence, self-reliance, thinking for oneself
- Low scores indicate: Dependence on others, need for approval

### 7. Justice (Fairness)
**Core Statement:** "I am treated justly"
- Items: 7, 27, 47, 67, 87 (T) + 17, 37, 57, 77, 97 (F)
- Measures: Accepting life as fair/reasonable
- Low scores indicate: Entitlement, resentment, "I must have..."

### 8. Belonging (Connection)
**Core Statement:** "I belong"
- Items: 8, 28, 48, 68, 88 (T) + 18, 38, 58, 78, 98 (F)
- Measures: Feeling connected to family, community, humanity
- Low scores indicate: Feeling like outsider, alien, excluded

### 9. Others (Trust)
**Core Statement:** "People are good"
- Items: 9, 29, 49, 69, 89 (T) + 19, 39, 59, 79, 99 (F)
- Measures: Trust in others, expecting positive behavior
- Low scores indicate: Distrust, paranoia, expecting harm

### 10. Standards (Self-Compassion)
**Core Statement:** "My standards are reasonable and flexible"
- Items: 10, 30, 50, 70, 90 (T) + 20, 40, 60, 80, 100 (F)
- Measures: Reasonable expectations, self-forgiveness
- Low scores indicate: Perfectionism, harsh self-judgment

## Scoring Guide
- Each domain scored 0-10
- Higher scores = healthier beliefs
- Lower scores = limiting beliefs needing work

## Integration with Psychedelic Work

### Connection to Experience Mapping (Phase 2: Inner Dynamics)
Core beliefs often emerge as "inner dynamics" during psychedelic experiences:
- **Value beliefs** → Feelings of worthlessness or divine worth
- **Security beliefs** → Experiences of safety/danger, protective parts
- **Performance beliefs** → Inner critic, competence themes
- **Control beliefs** → Surrender vs. control themes
- **Love beliefs** → Connection, abandonment, universal love
- **Autonomy beliefs** → Dependence parts, authentic self emergence
- **Justice beliefs** → Fairness of universe, acceptance themes
- **Belonging beliefs** → Oneness, isolation, tribal connection
- **Trust beliefs** → Paranoia, openness, divine trust
- **Standards beliefs** → Self-judgment, self-compassion, perfection

### Integration with Therapeutic Work (Phase 3: CBT)
Use inventory to:
1. **Identify limiting beliefs** revealed in psychedelic experience
2. **Track belief changes** post-experience
3. **Target specific domains** for CBT reframing
4. **Measure integration progress** over time
5. **Connect beliefs to IFS parts** (e.g., inner critic = low standards score)

### Clinical Application
**Baseline Assessment:**
- Administer before psychedelic experience (if possible)
- Identifies pre-existing belief patterns

**Post-Experience Assessment:**
- 1 week, 1 month, 3 months, 6 months post-journey
- Track which beliefs shifted through experience
- Identify beliefs needing therapeutic support

**Targeted Intervention:**
- Low Value → Self-compassion practices, worthiness work
- Low Security → Polyvagal regulation, safety-building
- Low Performance → Competence building, reframing failure
- Low Control → Empowerment practices, agency restoration
- Low Love → Attachment healing, connection practices
- Low Autonomy → Boundary work, self-trust building
- Low Justice → Acceptance practices, letting go of "shoulds"
- Low Belonging → Community building, parts integration
- Low Trust → Relationship repair, healthy vulnerability
- Low Standards → Self-compassion, releasing perfectionism

## Implementation Notes

### Data Structure
```javascript
beliefAssessment: {
  preJourney: {
    value: 0-10,
    security: 0-10,
    performance: 0-10,
    control: 0-10,
    love: 0-10,
    autonomy: 0-10,
    justice: 0-10,
    belonging: 0-10,
    others: 0-10,
    standards: 0-10,
    completedDate: timestamp
  },
  postJourney: {
    // Same structure
    // Multiple assessments over time
    assessments: [
      { week1: {...}, completedDate: timestamp },
      { month1: {...}, completedDate: timestamp },
      { month3: {...}, completedDate: timestamp }
    ]
  }
}
```

### UI Components Needed
1. **Assessment Screen** - 100-item questionnaire
2. **Results Visualization** - Bar chart (like PDF shows)
3. **Belief Explorer** - Deep dive into each domain
4. **Progress Tracker** - Compare assessments over time
5. **Integration Suggestions** - Targeted practices per domain

### Integration Points
- **Experience Mapping Phase 2** - Reference beliefs when connecting to inner dynamics
- **Therapeutic Phase 3** - Use as foundation for CBT reframing work
- **Ongoing Tracking** - Regular reassessment shows integration progress

---

*Last Updated: 2025-10-04*
