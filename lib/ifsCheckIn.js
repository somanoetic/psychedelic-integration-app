// Pure, side-effect-free helpers for the IFS parts-work check-in intro.
//
// Extracted from enhanced-components/IFSPartsWorkChatWithContext.js so the
// experience-tier logic and the opening-message copy can be unit-tested
// without mounting the React Native component. Nothing here touches state,
// navigation, Supabase, or Huxley — inputs in, string/boolean out.

/**
 * Decide whether the user is "experienced" enough to skip the full teaching
 * intro and get the terse welcome instead.
 *
 * Bias is deliberately toward "new": over-explaining to a veteran costs a few
 * seconds of reading, but under-explaining loses a novice. So a SINGLE stray
 * session is NOT enough — we require a saved part (a strong "did real work"
 * signal) OR at least two prior sessions.
 *
 * @param {number} savedPartCount   how many parts the user has saved
 * @param {number} priorSessionCount how many prior IFS sessions exist
 * @returns {boolean} true = experienced (terse welcome); false = new (teaching)
 */
function isExperiencedUser(savedPartCount, priorSessionCount) {
  const parts = Number(savedPartCount) || 0;
  const sessions = Number(priorSessionCount) || 0;
  return parts > 0 || sessions >= 2;
}

/**
 * Build the opening check-in message.
 *
 * Three branches:
 *  - new (!isExperienced): full teaching intro, both doorways explained.
 *  - experienced, no saved parts: one-line reminder, no list.
 *  - experienced, with saved parts: one-line reminder + a preview of up to 5.
 *
 * @param {Array<{part_name?: string}>} parts saved parts (may be empty/undefined)
 * @param {boolean} isExperienced from isExperiencedUser()
 * @returns {string} the assistant's opening message (markdown)
 */
function getCheckInMessage(parts, isExperienced = false) {
  // New user — full teaching version.
  if (!isExperienced) {
    return `Before we dive in, a word on how this works.

Working with parts starts with *noticing* them. We don't have to know their names or understand them yet - we just turn toward what's here. There are two easy ways in:

**1. Notice what's present.** Parts show up as feelings, thoughts, or patterns of behavior. If you pause right now, what's the first feeling or thought that comes to mind?

**2. Start at a trailhead.** A trailhead is a problem or friction in your life - something you keep bumping into. It's a doorway to the part connected to it. Is there something that's been weighing on you lately?

There's no wrong way to begin. You can pick one, or just tell me what's here - I'll help you get to know it.`;
  }

  // Experienced, no saved parts — one-line reminder, no list.
  if (!parts || parts.length === 0) {
    return `Welcome back.

We can start by noticing what's present - a feeling, thought, or pattern - or follow a trailhead, some problem in your life that leads to the part behind it.

What's coming up for you right now?`;
  }

  // Experienced, with saved parts — one-line reminder + parts list.
  const partsPreview = parts.slice(0, 5).map((p) => `• ${p.part_name || 'Unnamed part'}`).join('\n');
  const moreCount = parts.length > 5 ? `\n... and ${parts.length - 5} more` : '';

  return `Welcome back.

We can notice what's present, or follow a trailhead - some problem in your life that leads to the part behind it.

You've worked with these parts before:
${partsPreview}${moreCount}

Is one of these active right now, is there a new part wanting attention, or is there something on your mind we could follow inward?`;
}

module.exports = { isExperiencedUser, getCheckInMessage };
