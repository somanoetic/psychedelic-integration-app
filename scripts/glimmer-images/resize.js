/**
 * Resize images for the Glimmer Swiper.
 *
 * Reads every .jpg from --input, writes a 400x400 JPEG to --output
 * using sharp's attention-based crop (entropy/edge detection — focuses
 * on the most "interesting" region, which for portraits is usually the face).
 *
 * Usage:
 *   node scripts/glimmer-images/resize.js --input <dir> --output <dir>
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, val, i, arr) => {
    if (val.startsWith('--')) acc.push([val.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);

const inputDir = args.input;
const outputDir = args.output;

if (!inputDir || !outputDir) {
  console.error('Usage: node resize.js --input <dir> --output <dir>');
  process.exit(1);
}

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const files = fs
  .readdirSync(inputDir)
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

console.log(`Processing ${files.length} images from ${inputDir}`);

let done = 0;
let failed = 0;

(async () => {
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputName = file.replace(/\.(jpe?g|png|webp)$/i, '.jpg');
    const outputPath = path.join(outputDir, outputName);

    try {
      await sharp(inputPath)
        .resize(400, 400, {
          fit: 'cover',
          position: sharp.strategy.attention,
        })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(outputPath);
      done++;
      if (done % 10 === 0) console.log(`  ${done}/${files.length}`);
    } catch (err) {
      failed++;
      console.error(`  FAIL ${file}: ${err.message}`);
    }
  }

  console.log(`Done. Processed ${done}, failed ${failed}. Output: ${outputDir}`);
})();
