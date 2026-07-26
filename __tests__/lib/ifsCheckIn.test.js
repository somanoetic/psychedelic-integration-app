const { isExperiencedUser, getCheckInMessage } = require('../../lib/ifsCheckIn');

describe('isExperiencedUser', () => {
  // The core of the "Experience Tier" decision. Bias is toward "new":
  // a saved part OR >= 2 prior sessions flips to experienced; a single
  // stray session does NOT.

  it('brand-new user (no parts, no sessions) is NOT experienced', () => {
    expect(isExperiencedUser(0, 0)).toBe(false);
  });

  it('one stray prior session alone is NOT enough (the key decision)', () => {
    expect(isExperiencedUser(0, 1)).toBe(false);
  });

  it('two or more prior sessions IS experienced', () => {
    expect(isExperiencedUser(0, 2)).toBe(true);
    expect(isExperiencedUser(0, 5)).toBe(true);
  });

  it('any saved part IS experienced, regardless of session count', () => {
    expect(isExperiencedUser(1, 0)).toBe(true);
    expect(isExperiencedUser(3, 1)).toBe(true);
  });

  it('coerces missing/garbage inputs to new (safe default)', () => {
    expect(isExperiencedUser(undefined, undefined)).toBe(false);
    expect(isExperiencedUser(null, null)).toBe(false);
    expect(isExperiencedUser(NaN, NaN)).toBe(false);
  });
});

describe('getCheckInMessage', () => {
  it('new user gets the full teaching intro with both doorways', () => {
    const msg = getCheckInMessage([], false);
    expect(msg).toContain('a word on how this works');
    expect(msg).toContain("Notice what's present");
    expect(msg).toContain('trailhead');
  });

  it('experienced user with no saved parts gets a terse welcome, no list', () => {
    const msg = getCheckInMessage([], true);
    expect(msg).toContain('Welcome back');
    expect(msg).not.toContain('a word on how this works');
    expect(msg).not.toContain("You've worked with these parts before");
  });

  it('experienced user with saved parts gets the welcome + a parts list', () => {
    const msg = getCheckInMessage(
      [{ part_name: 'The Critic' }, { part_name: 'The Protector' }],
      true,
    );
    expect(msg).toContain('Welcome back');
    expect(msg).toContain("You've worked with these parts before");
    expect(msg).toContain('• The Critic');
    expect(msg).toContain('• The Protector');
  });

  it('caps the parts preview at 5 and shows an "... and N more" tail', () => {
    const parts = Array.from({ length: 8 }, (_, i) => ({ part_name: `Part ${i + 1}` }));
    const msg = getCheckInMessage(parts, true);
    expect(msg).toContain('• Part 5');
    expect(msg).not.toContain('• Part 6');
    expect(msg).toContain('... and 3 more');
  });

  it('falls back to "Unnamed part" when a part has no name', () => {
    const msg = getCheckInMessage([{}], true);
    expect(msg).toContain('• Unnamed part');
  });

  it('defaults to the teaching intro when isExperienced is omitted (safe default)', () => {
    // Mirrors the component's error/fallback path: getCheckInMessage([]).
    const msg = getCheckInMessage([]);
    expect(msg).toContain('a word on how this works');
  });
});
