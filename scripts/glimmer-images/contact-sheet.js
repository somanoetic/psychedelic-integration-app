/**
 * Build a contact sheet from a folder of images.
 *
 * Lays out every .jpg in --input as a grid in one big PNG with file-number
 * labels overlaid, so the user can review all images at once and call out
 * which ones to fix/drop by number.
 *
 * Usage:
 *   node scripts/glimmer-images/contact-sheet.js \
 *     --input assets/images/glimmer-swiper/faces \
 *     --output scripts/glimmer-images/face-contact-sheet.png \
 *     --prefix face
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
const outputPath = args.output;
const prefix = args.prefix || 'img';

if (!inputDir || !outputPath) {
  console.error('Usage: node contact-sheet.js --input <dir> --output <png> --prefix <name>');
  process.exit(1);
}

const CELL = 200; // each thumbnail 200x200
const COLS = 8;
const LABEL_H = 24;

(async () => {
  const files = fs
    .readdirSync(inputDir)
    .filter((f) => new RegExp(`^${prefix}_\\d+\\.jpg$`, 'i').test(f))
    .sort((a, b) => {
      const ai = parseInt(a.match(/\d+/)[0], 10);
      const bi = parseInt(b.match(/\d+/)[0], 10);
      return ai - bi;
    });

  const rows = Math.ceil(files.length / COLS);
  const sheetW = COLS * CELL;
  const sheetH = rows * (CELL + LABEL_H);

  console.log(`${files.length} images, ${COLS}x${rows} grid, ${sheetW}x${sheetH}`);

  const composites = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * CELL;
    const y = row * (CELL + LABEL_H);

    const thumb = await sharp(path.join(inputDir, file))
      .resize(CELL, CELL, { fit: 'cover' })
      .toBuffer();
    composites.push({ input: thumb, top: y + LABEL_H, left: x });

    // Number label as SVG overlay
    const num = file.match(/\d+/)[0];
    const labelSvg = Buffer.from(
      `<svg width="${CELL}" height="${LABEL_H}">
        <rect width="${CELL}" height="${LABEL_H}" fill="#222"/>
        <text x="${CELL / 2}" y="${LABEL_H - 7}" font-family="Arial" font-size="14" font-weight="bold" fill="#fff" text-anchor="middle">#${num}</text>
      </svg>`
    );
    composites.push({ input: labelSvg, top: y, left: x });
  }

  await sharp({
    create: {
      width: sheetW,
      height: sheetH,
      channels: 3,
      background: { r: 40, g: 40, b: 40 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 8 })
    .toFile(outputPath);

  console.log(`Wrote ${outputPath}`);
})();
