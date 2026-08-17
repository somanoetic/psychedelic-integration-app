import Handler from '../../lib/modeHandlers/AdultAttachmentInterviewModeHandler';

const step = (h, user, ai = 'And what comes next?') => h.processResponse(user, ai, null);

describe('AdultAttachmentInterviewModeHandler', () => {
  it('advances through the full reflection arc', () => {
    const h = new Handler();
    expect(h.getPhase()).toBe('orientation');

    step(h, 'My mother and my father raised me, mostly.');
    expect(h.getPhase()).toBe('family_structure');
    expect(h.caregivers.map((c) => c.label)).toEqual(['mother', 'father']);

    step(h, 'We lived in a small town, just the four of us.');
    expect(h.getPhase()).toBe('caregiver_general');

    step(h, 'My relationship with my mother was warm but complicated.');
    expect(h.getPhase()).toBe('adjectives');

    step(h, 'loving, distant, anxious, funny, and strict');
    expect(h.getPhase()).toBe('adjective_evidence');
    expect(h.caregivers[0].adjectives.length).toBe(5);

    for (let i = 0; i < 5; i++) {
      step(h, 'I remember a specific time she stayed up all night caring for me.');
    }
    // After the 5 adjective memories for caregiver 0 -> next caregiver
    expect(h.getPhase()).toBe('caregiver_general');
    expect(h.currentCaregiverIndex).toBe(1);

    step(h, 'My father was quieter, harder to reach.');
    expect(h.getPhase()).toBe('adjectives');
    step(h, 'absent, kind, tired, gentle, unpredictable');
    expect(h.getPhase()).toBe('adjective_evidence');
    for (let i = 0; i < 5; i++) step(h, 'There was a time he took me fishing and we talked.');
    expect(h.getPhase()).toBe('specific_experiences');

    for (let i = 0; i < 5; i++) step(h, 'I would usually go to my room and cope alone.');
    expect(h.getPhase()).toBe('caregiver_motivations');

    step(h, 'Looking back, I think they did their best with what they had.');
    expect(h.getPhase()).toBe('loss_disruption');

    step(h, 'No, there were no major losses when I was young.');
    expect(h.getPhase()).toBe('adult_effects');

    step(h, 'I think it made me independent but slow to trust.');
    expect(h.getPhase()).toBe('integration');

    step(h, 'I am taking away that I want to be more open.');
    step(h, 'Thank you.');
    expect(h.getPhase()).toBe('complete');

    const summary = h.getSessionSummary();
    expect(summary.completed).toBe(true);
    expect(summary.caregivers.length).toBe(2);
    expect(summary.backendPattern).toBeDefined();
    expect(summary.backendPattern.disclaimer).toMatch(/NOT a diagnosis/);
  });

  describe('resume (getSessionSummary -> initializeWithContext round-trip)', () => {
    // Walk a session to mid-adjective-evidence on the second caregiver, which
    // exercises every cursor: caregiver index, adjective index, phase counters.
    const buildInterrupted = () => {
      const h = new Handler();
      step(h, 'My mother and my father raised me, mostly.');
      step(h, 'We lived in a small town, just the four of us.');
      step(h, 'My relationship with my mother was warm but complicated.');
      step(h, 'loving, distant, anxious, funny, and strict');
      for (let i = 0; i < 5; i++) step(h, 'I remember a specific time she cared for me.');
      step(h, 'My father was quieter, harder to reach.');
      step(h, 'absent, kind, tired, gentle, unpredictable');
      step(h, 'There was a time he took me fishing and we talked.');
      return h;
    };

    it('restores phase and cursors so the reflection does not replay', () => {
      const before = buildInterrupted();
      const summary = before.getSessionSummary();

      const after = new Handler();
      after.initializeWithContext(summary);

      expect(after.getPhase()).toBe(before.getPhase());
      expect(after.currentCaregiverIndex).toBe(before.currentCaregiverIndex);
      expect(after.currentAdjectiveIndex).toBe(before.currentAdjectiveIndex);
      expect(after.currentExperienceIndex).toBe(before.currentExperienceIndex);
      expect(after.exchangeCount).toBe(before.exchangeCount);
      expect(after.caregivers.map((c) => c.label)).toEqual(['mother', 'father']);
      // The first caregiver's five memories survive the interruption.
      expect(Object.keys(after.caregivers[0].evidence).length).toBe(5);
    });

    it('continues the arc from where it left off rather than from the top', () => {
      const before = buildInterrupted();
      const after = new Handler();
      after.initializeWithContext(before.getSessionSummary());

      // Four more memories finishes the second caregiver -> experiences.
      for (let i = 0; i < 4; i++) step(after, 'Another memory of him comes to mind.');
      expect(after.getPhase()).toBe('specific_experiences');
    });

    it('does not skip ahead when resuming into the later free-form phases', () => {
      const before = new Handler();
      before.phase = 'loss_disruption';
      step(before, 'My grandfather died when I was eight.');

      const after = new Handler();
      after.initializeWithContext(before.getSessionSummary());
      // lossDisclosed must survive, or the gates read it as unasked.
      expect(after.lossDisclosed).toBe(true);
      expect(after.getPhase()).toBe(before.getPhase());
    });

    it('keeps accumulating pattern signals across a resume', () => {
      const before = buildInterrupted();
      const summary = before.getSessionSummary();
      expect(summary._patternSignals).toBeDefined();

      const after = new Handler();
      after.initializeWithContext(summary);
      expect(after._patternSignals.supportedAdjectives)
        .toBe(before._patternSignals.supportedAdjectives);
    });

    it('still keeps the back-end pattern out of the model-facing context after resume', () => {
      const before = buildInterrupted();
      const after = new Handler();
      after.initializeWithContext(before.getSessionSummary());

      const serialized = JSON.stringify(after.getModeContext());
      expect(serialized).not.toMatch(/backendPattern/i);
      expect(serialized).not.toMatch(/_patternSignals/i);
    });
  });

  it('handles a single caregiver (skips straight to experiences after one loop)', () => {
    const h = new Handler();
    step(h, 'Just my mom raised me.');
    expect(h.caregivers.map((c) => c.label)).toEqual(['mother']);
    step(h, 'It was just the two of us in an apartment.');
    step(h, 'It was close but intense.');
    step(h, 'devoted, anxious, warm, controlling, fun');
    for (let i = 0; i < 5; i++) step(h, 'I remember a specific afternoon we spent together.');
    expect(h.getPhase()).toBe('specific_experiences');
    expect(h.currentCaregiverIndex).toBe(0);
  });

  it('advances out of loss when declined with an elaborated "no" (regression)', () => {
    const h = new Handler();
    h.phase = 'loss_disruption';
    step(h, 'No, there were no major losses when I was young.');
    expect(h.lossDisclosed).toBe(false);
    expect(h.getPhase()).toBe('adult_effects');
  });

  it('stays with a disclosed loss for a couple of exchanges before advancing', () => {
    const h = new Handler();
    h.phase = 'loss_disruption';
    step(h, 'My grandfather died when I was eight.');
    expect(h.lossDisclosed).toBe(true);
    expect(h.getPhase()).toBe('loss_disruption');
    step(h, 'It was confusing, no one really explained it to me.');
    expect(h.getPhase()).toBe('adult_effects');
  });

  it('records an unsupported adjective when no memory is offered', () => {
    const h = new Handler();
    step(h, 'My mother raised me.');
    step(h, 'A small household.');
    step(h, 'It was complicated.');
    step(h, 'kind, distant, busy, gentle, strict');
    expect(h.getPhase()).toBe('adjective_evidence');
    step(h, "I can't remember anything specific.");
    expect(h.caregivers[0].evidence['kind']).toBe('(no specific memory offered)');
    expect(h._patternSignals.unsupportedAdjectives).toBeGreaterThanOrEqual(1);
  });

  it('never places the back-end pattern in the model-facing mode context', () => {
    const h = new Handler();
    const json = JSON.stringify(h.getModeContext());
    expect(json).not.toMatch(/backendPattern|tentativePattern|dismissing|preoccupied/i);
  });
});
