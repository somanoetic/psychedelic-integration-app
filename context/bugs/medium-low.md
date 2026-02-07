# Medium & Low Priority Bugs (P2-P3)

**File Size Limit:** 300 lines
**Last Updated:** 2026-02-07

---

## Medium Priority (P2)

### BUG-201: Device Cache Persisting Old UI
**Priority:** P2 - Medium
**Status:** Resolved (Workaround Documented)
**Reported:** 2026-02-07 (migrated)

**Description:**
After updating code, devices sometimes show old UI until cache is fully cleared.

**Workaround:**
1. Close Expo Go completely (swipe away)
2. Reopen Expo Go fresh
3. Delete project from project list
4. Rescan QR code

**Root Cause:**
- Expo Go aggressive caching
- Metro bundler cache not invalidating

**Prevention:**
- Use `--clear` flag when starting Metro after big changes
- Close/reopen Expo Go after major updates

**Status:** Acceptable workaround exists, low urgency to fix

---

### BUG-202: TypeScript Configuration Updates
**Priority:** P2 - Medium
**Status:** Open
**Reported:** 2026-02-07 (migrated)

**Description:**
tsconfig.json#include property updated during recent changes, need to verify all imports working correctly.

**Impact:**
- Potential import resolution issues
- May affect TypeScript features

**Testing Needed:**
- [ ] Verify all imports resolve
- [ ] Check no TS errors in console
- [ ] Test with fresh install

**Estimated Effort:** 1-2 hours

---

### BUG-203: Lack of Automated Testing
**Priority:** P2 - Medium (Technical Debt)
**Status:** Open
**Reported:** 2026-02-07 (migrated)

**Description:**
No automated tests currently in project.

**Impact:**
- Difficult to catch regressions
- Manual testing only
- Slows development velocity over time

**Proposed Solution:**
1. Set up Jest for unit tests
2. Set up Detox/Maestro for E2E tests
3. Add test scripts to package.json
4. Start with critical flows
5. Build coverage incrementally

**Estimated Effort:** 1 week initial setup, ongoing

**Notes:**
- See [FEAT-201](../features/planned.md) for testing strategy feature

---

## Low Priority (P3)

### BUG-301: Missing Performance Monitoring
**Priority:** P3 - Low
**Status:** Open
**Reported:** 2026-02-07 (migrated)

**Description:**
No performance metrics or monitoring currently implemented.

**Missing Metrics:**
- Initial load time
- Screen transition performance
- Database query times
- Memory usage
- Bundle size tracking

**Proposed Solution:**
- Add React Native Performance Monitor
- Use Flipper for debugging
- Implement baseline measurements
- Track over time

**Estimated Effort:** 2-3 days

---

### BUG-302: Bundle Size Not Optimized
**Priority:** P3 - Low
**Status:** Open
**Reported:** 2026-02-07 (migrated)

**Description:**
Haven't analyzed or optimized app bundle size.

**Tasks:**
- [ ] Analyze bundle composition
- [ ] Remove unused dependencies
- [ ] Optimize images
- [ ] Implement code splitting (if needed)

**Estimated Effort:** 2-3 days

---

### BUG-303: Incomplete Documentation
**Priority:** P3 - Low (Ongoing)
**Status:** In Progress
**Reported:** 2026-02-07 (migrated)

**Description:**
Some documentation incomplete or outdated.

**Gaps:**
- Architecture overview (partial)
- Component documentation (minimal)
- API documentation (none)
- State management guide (none)
- Contribution guidelines (none)

**Solution:**
- Use context system for project tracking (in progress)
- Add component docs gradually
- Create architecture diagram
- Document as we code

**Notes:**
- This is ongoing maintenance, not a "bug" per se
- Tracked better in roadmap/features

---

### BUG-304: Missing Privacy Policy & Terms
**Priority:** P3 - Low (Required for Production)
**Status:** Open
**Reported:** 2026-02-07 (migrated)

**Description:**
No privacy policy or terms of service documents created yet.

**Impact:**
- Required for app store submission
- Legal requirement for data collection
- User trust and transparency

**Tasks:**
- [ ] Draft privacy policy
- [ ] Draft terms of service
- [ ] Add to app (link in settings)
- [ ] Legal review (if possible)

**Estimated Effort:** 1-2 days + legal review

**Notes:**
- Not urgent for current dev/testing phase
- Must have before public release

---

### BUG-305: No User Data Export Feature
**Priority:** P3 - Low
**Status:** Open
**Reported:** 2026-02-07 (migrated)

**Description:**
Users cannot export their journal entries or app data.

**Use Cases:**
- Sharing with therapist
- Backup
- Switching apps
- Data portability (GDPR)

**Proposed Solution:**
- Export to PDF
- Export to JSON
- Export to CSV
- Share functionality

**Estimated Effort:** 3-4 days

**Notes:**
- See [FEAT-309](../features/ideas.md) for full feature spec

---

## Archived/Resolved

### BUG-200: Old Color Scheme on Multiple Screens
**Status:** Resolved
**Resolved:** 2026-01-XX

**Description:**
Old color scheme across many screens.

**Solution:**
Systematically updated to Noesis aesthetic. A few screens remain (see BUG-101).

---

## Notes

**Medium Priority (P2):**
- Fix within 2-4 weeks
- Has workaround or lower impact
- Schedule when between high-priority work

**Low Priority (P3):**
- Fix when time permits
- Nice to have
- May defer multiple sprints
- Batch with similar work

**When to Bump Priority:**
- P3→P2: Affects multiple users regularly
- P2→P1: Workaround breaks, impact increases
- Any→P0: Becomes critical (security, crash, blocker)

---

**Current Count:** 3 P2, 5 P3 (8 total)
**File Status:** Under limit (200 lines / 300 max)
