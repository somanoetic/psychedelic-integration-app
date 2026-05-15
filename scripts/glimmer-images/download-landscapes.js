/**
 * Fetch curated landscape images from Unsplash API.
 *
 * Pulls across several calming-landscape search terms to get variety
 * (mountains, water, forests, golden hour, meadows, etc.) and saves
 * the raw downloads to staging-nature/ for the resize pipeline.
 *
 * Usage:
 *   UNSPLASH_ACCESS_KEY=xxx node scripts/glimmer-images/download-landscapes.js
 *
 * Notes:
 * - Demo apps: 50 API requests/hour. Each search call returns 30 results.
 * - Image downloads from images.unsplash.com don't count against the quota.
 * - Unsplash ToS requires triggering the photo's `download` endpoint to
 *   register a download event (good citizenship; doesn't return the image).
 */

const fs = require('fs');
const path = require('path');

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!ACCESS_KEY) {
  console.error('Set UNSPLASH_ACCESS_KEY env var');
  process.exit(1);
}

const OUT_DIR = path.join(__dirname, 'staging-nature');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Curated queries — each contributes to a varied set of calming landscapes.
// Mix of broad terms and specific moods. Aim ~10-15 per query, ~70 total.
const QUERIES = [
  { q: 'mountain landscape', count: 12 },
  { q: 'calm lake sunrise', count: 10 },
  { q: 'forest path', count: 10 },
  { q: 'golden hour meadow', count: 10 },
  { q: 'ocean horizon', count: 10 },
  { q: 'misty valley', count: 8 },
  { q: 'aspen autumn', count: 6 },
  { q: 'wildflower field', count: 6 },
];

async function searchUnsplash(query, perPage) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape&content_filter=high`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Unsplash search failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.results;
}

async function downloadImage(photo, outPath) {
  // Use the `regular` size (~1080px wide) — way smaller than `full`/`raw`
  // and still plenty for our 400x400 final crop.
  const imgRes = await fetch(photo.urls.regular);
  if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  fs.writeFileSync(outPath, buf);

  // Ping the download_location endpoint per Unsplash ToS — good citizenship.
  // Fire and forget; failure is non-fatal.
  try {
    await fetch(`${photo.links.download_location}?client_id=${ACCESS_KEY}`);
  } catch (_) {
    /* ignore */
  }
}

(async () => {
  const seen = new Set();
  let total = 0;
  let failed = 0;
  const credits = [];

  for (const { q, count } of QUERIES) {
    console.log(`\nSearching "${q}" (want ${count})...`);
    let photos;
    try {
      photos = await searchUnsplash(q, Math.min(count + 3, 30));
    } catch (err) {
      console.error(`  Search failed: ${err.message}`);
      continue;
    }

    let got = 0;
    for (const photo of photos) {
      if (got >= count) break;
      if (seen.has(photo.id)) continue;
      seen.add(photo.id);

      // Slug: photographer-name + photo-id, mirrors Unsplash's own naming.
      const slug = `${photo.user.username}-${photo.id}.jpg`.replace(/[^a-zA-Z0-9._-]/g, '-');
      const outPath = path.join(OUT_DIR, slug);

      try {
        await downloadImage(photo, outPath);
        credits.push({
          id: photo.id,
          file: slug,
          photographer: photo.user.name,
          username: photo.user.username,
          link: photo.links.html,
          description: photo.description || photo.alt_description,
        });
        got++;
        total++;
        process.stdout.write('.');
      } catch (err) {
        failed++;
        console.error(`\n  FAIL ${photo.id}: ${err.message}`);
      }
    }
    console.log(`\n  got ${got} from "${q}"`);
  }

  // Save credits manifest for later attribution work.
  fs.writeFileSync(
    path.join(OUT_DIR, '_credits.json'),
    JSON.stringify(credits, null, 2)
  );

  console.log(`\nDone. Downloaded ${total}, failed ${failed}.`);
  console.log(`Credits manifest: ${path.join(OUT_DIR, '_credits.json')}`);
})();
