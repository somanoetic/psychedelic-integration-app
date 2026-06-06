/**
 * Trail progress — engagement state for curriculum trail markers.
 *
 * Binary states: 'engaged' or 'not_started'. A marker becomes engaged
 * when its payload is opened (exercise started, tool launched, education
 * topic viewed, conversational flow entered).
 *
 * Storage: AsyncStorage. One JSON blob keyed by TRAIL_STORAGE_KEY,
 * shape: { [trackId]: { [markerId]: { engagedAt: ISOString } } }.
 *
 * Migration: the legacy CurriculumTracker stored exercise completions under
 * PROGRESS_STORAGE_KEY = 'exercise_progress_data'. On first read we map any
 * matching exercise refIds to marker engagement so users don't see a fresh
 * trail. We DO NOT delete the legacy key — it's still referenced by the
 * exercise library favorites feature.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { tracks } from '../content/tracks';

const TRAIL_STORAGE_KEY = 'trail_engagement_v1';
const LEGACY_PROGRESS_KEY = 'exercise_progress_data';

let cache = null;
let migrated = false;

const buildExerciseRefIdIndex = () => {
  const index = new Map();
  tracks.forEach(track => {
    track.markers.forEach(m => {
      if (m.payload.type === 'exercise') {
        index.set(m.payload.refId, { trackId: track.id, markerId: m.id });
      }
    });
  });
  return index;
};

const migrateLegacyIfNeeded = async (engagement) => {
  if (migrated) return engagement;
  migrated = true;

  try {
    const raw = await AsyncStorage.getItem(LEGACY_PROGRESS_KEY);
    if (!raw) return engagement;

    const legacy = JSON.parse(raw);
    const index = buildExerciseRefIdIndex();
    let didChange = false;

    Object.values(legacy).forEach(record => {
      if (!record || record.times_completed <= 0) return;

      // Legacy IDs look like `${category}_${slug}`. We don't have the
      // exercise's BR-001-style ID directly. Match by title slug instead.
      const slugifiedTitle = record.exercise_title
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

      // Walk tracks to find a marker whose exercise title slug matches.
      // Fallback only — most users will have few legacy completions.
      tracks.forEach(track => {
        track.markers.forEach(m => {
          if (m.payload.type !== 'exercise') return;
          const markerSlug = m.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');
          if (markerSlug === slugifiedTitle) {
            if (!engagement[track.id]) engagement[track.id] = {};
            if (!engagement[track.id][m.id]) {
              engagement[track.id][m.id] = {
                engagedAt: record.last_completed_at || record.first_completed_at || new Date().toISOString(),
              };
              didChange = true;
            }
          }
        });
      });
    });

    if (didChange) {
      await AsyncStorage.setItem(TRAIL_STORAGE_KEY, JSON.stringify(engagement));
    }
  } catch (err) {
    console.warn('[trailProgress] legacy migration skipped:', err);
  }

  return engagement;
};

export const loadEngagement = async () => {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(TRAIL_STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('[trailProgress] load failed, starting fresh:', err);
    cache = {};
  }
  cache = await migrateLegacyIfNeeded(cache);
  return cache;
};

export const isEngaged = (engagement, trackId, markerId) => {
  return !!engagement?.[trackId]?.[markerId];
};

export const markEngaged = async (trackId, markerId) => {
  const engagement = await loadEngagement();
  if (!engagement[trackId]) engagement[trackId] = {};
  if (engagement[trackId][markerId]) return engagement; // already engaged
  engagement[trackId][markerId] = { engagedAt: new Date().toISOString() };
  cache = engagement;
  try {
    await AsyncStorage.setItem(TRAIL_STORAGE_KEY, JSON.stringify(engagement));
  } catch (err) {
    console.warn('[trailProgress] save failed:', err);
  }
  return engagement;
};

export const getTrackProgress = (engagement, trackId) => {
  const track = tracks.find(t => t.id === trackId);
  if (!track) return { engaged: 0, total: 0 };
  const engagedCount = track.markers.filter(m => isEngaged(engagement, trackId, m.id)).length;
  return { engaged: engagedCount, total: track.markers.length };
};

export const resetCache = () => { cache = null; migrated = false; };
