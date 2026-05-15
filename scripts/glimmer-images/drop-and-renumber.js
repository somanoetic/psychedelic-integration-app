/**
 * Drop specific numbered images from a folder and renumber the rest sequentially.
 *
 * Usage:
 *   node scripts/glimmer-images/drop-and-renumber.js \
 *     --dir assets/images/glimmer-swiper/faces \
 *     --prefix face \
 *     --drop 5,8,14,31,50,57,65,76,80
 */

const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, val, i, arr) => {
    if (val.startsWith('--')) acc.push([val.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);

const dir = args.dir;
const prefix = args.prefix;
const drop = (args.drop || '')
  .split(',')
  .map((s) => parseInt(s.trim(), 10))
  .filter((n) => !Number.isNaN(n));

if (!dir || !prefix || drop.length === 0) {
  console.error('Usage: node drop-and-renumber.js --dir <dir> --prefix <name> --drop 1,2,3');
  process.exit(1);
}

const dropSet = new Set(drop);

const allFiles = fs
  .readdirSync(dir)
  .filter((f) => new RegExp(`^${prefix}_\\d+\\.jpg$`, 'i').test(f))
  .map((f) => ({ file: f, num: parseInt(f.match(/\d+/)[0], 10) }))
  .sort((a, b) => a.num - b.num);

const toDelete = allFiles.filter((f) => dropSet.has(f.num));
const keepers = allFiles.filter((f) => !dropSet.has(f.num));

console.log(`Dropping ${toDelete.length}: ${toDelete.map((f) => f.num).join(', ')}`);
console.log(`Keeping ${keepers.length}`);

// Delete the dropped ones
for (const f of toDelete) {
  fs.unlinkSync(path.join(dir, f.file));
}

// Two-phase rename to avoid collisions: first to .tmp_N, then to final
keepers.forEach((f, i) => {
  const tmp = path.join(dir, `${prefix}_tmp_${i + 1}.jpg`);
  fs.renameSync(path.join(dir, f.file), tmp);
});
keepers.forEach((_, i) => {
  const tmp = path.join(dir, `${prefix}_tmp_${i + 1}.jpg`);
  const final = path.join(dir, `${prefix}_${i + 1}.jpg`);
  fs.renameSync(tmp, final);
});

console.log(`Renumbered to ${prefix}_1..${prefix}_${keepers.length}.jpg`);
