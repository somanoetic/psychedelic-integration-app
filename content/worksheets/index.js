/**
 * Worksheet registry.
 *
 * Add new worksheets here. The registry is a flat keyed-by-id map so
 * lookups by glyph (which encodes the id) are O(1). Iteration for the
 * library browser uses Object.values().
 *
 * Each module imports and runs validateWorksheet at module load, so a
 * broken worksheet config fails fast at app start rather than only when
 * someone tries to print it.
 */
import postSessionIntegration from './post-session-integration';

// Pre-Treatment Baseline Log (4 pages)
import baselineLifeNow from './baseline-life-now';
import baselineLifeAreas from './baseline-life-areas';
import baselineCopingStrategies from './baseline-coping-strategies';
import baselineRelationshipPatterns from './baseline-relationship-patterns';

// Daily Check-In (5 pages, repeats daily)
import dailyMorningCheckin from './daily-morning-checkin';
import dailyLifeExperience from './daily-life-experience';
import dailyRelationships from './daily-relationships';
import dailyEmotionalPhysical from './daily-emotional-physical';
import dailySelfCareEvening from './daily-self-care-evening';

// Educational chapter reflections (5 one-page prompts)
import eduPatternsResonance from './edu-patterns-resonance';
import eduHealingSenses from './edu-healing-senses';
import eduUniqueNs from './edu-unique-ns';
import eduMultisensoryIntegration from './edu-multisensory-integration';
import eduPreTreatmentLetter from './edu-pre-treatment-letter';

const ALL = [
  postSessionIntegration,
  baselineLifeNow,
  baselineLifeAreas,
  baselineCopingStrategies,
  baselineRelationshipPatterns,
  dailyMorningCheckin,
  dailyLifeExperience,
  dailyRelationships,
  dailyEmotionalPhysical,
  dailySelfCareEvening,
  eduPatternsResonance,
  eduHealingSenses,
  eduUniqueNs,
  eduMultisensoryIntegration,
  eduPreTreatmentLetter,
];

export const worksheets = Object.fromEntries(ALL.map((w) => [w.id, w]));

export function getWorksheet(id) {
  return worksheets[id] ?? null;
}

export function getWorksheetsByTrack(trackId) {
  return Object.values(worksheets).filter((w) => w.tracks.includes(trackId));
}

export function getAllWorksheets() {
  return Object.values(worksheets);
}

/**
 * Group worksheets by collection for the library screen. Worksheets with no
 * collection are returned under `{ collection: null, items: [...] }` so the
 * library can render them as "standalone" cards.
 *
 * Within each collection, items are sorted by collection.order (ascending,
 * Infinity = unsorted). Across collections, order is: standalone first,
 * then collections in insertion order of the first worksheet seen.
 */
export function getWorksheetsGroupedByCollection() {
  const standalone = [];
  const groups = new Map(); // collectionId -> { collection, items }

  for (const w of ALL) {
    if (!w.collection) {
      standalone.push(w);
      continue;
    }
    const cid = w.collection.id;
    if (!groups.has(cid)) {
      groups.set(cid, { collection: w.collection, items: [] });
    }
    groups.get(cid).items.push(w);
  }

  for (const group of groups.values()) {
    group.items.sort(
      (a, b) => (a.collection.order ?? Infinity) - (b.collection.order ?? Infinity),
    );
  }

  return {
    standalone,
    collections: Array.from(groups.values()),
  };
}
