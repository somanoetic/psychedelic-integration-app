/**
 * Build printable worksheet PDFs from the app's own configs.
 *
 * Uses the SAME renderer the app uses (renderWorksheetHtml from
 * lib/worksheetPdfService.js), so the output matches what expo-print
 * produces on-device. expo-print is a native API and can't run here, so we
 * render the HTML (pure, no Expo dep) and convert to PDF with headless
 * Chrome, which honors the @page size CSS the same way.
 *
 * ESM `import` syntax in the configs/renderer is handled by sucrase/register.
 * expo-print is stubbed in require() so the renderer module loads (we never
 * call the function that uses it).
 *
 * Output: out/worksheet-pdfs/<id>.pdf  (+ <id>.html for inspection)
 * Run:    node scripts/build-worksheet-pdfs.cjs
 */
const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'out', 'worksheet-pdfs');

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const CHROME = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!CHROME) throw new Error('No Chrome/Edge found for PDF conversion');

// Transpile ESM imports on require.
require(path.join(ROOT, 'node_modules/sucrase/register'));

// Stub expo-print before the renderer is required: intercept the require
// call itself and hand back an empty module (renderWorksheetToPdf is the only
// thing that touches it, and we never call it).
const Module = require('node:module');
const origRequire = Module.prototype.require;
Module.prototype.require = function (request) {
  if (request === 'expo-print') return {};
  return origRequire.apply(this, arguments);
};

const { getAllWorksheets } = require(path.join(ROOT, 'content/worksheets/index.js'));
const { renderWorksheetHtml } = require(path.join(ROOT, 'lib/worksheetPdfService.js'));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const worksheets = getAllWorksheets();
console.log(`Rendering ${worksheets.length} worksheets...`);

for (const w of worksheets) {
  const html = renderWorksheetHtml(w);
  const htmlPath = path.join(OUT, `${w.id}.html`);
  const pdfPath = path.join(OUT, `${w.id}.pdf`);
  fs.writeFileSync(htmlPath, html, 'utf8');

  execFileSync(CHROME, [
    '--headless',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${pdfPath}`,
    'file://' + htmlPath.replace(/\\/g, '/'),
  ], { stdio: 'ignore' });
  console.log(`  ${w.id}.pdf`);
}

console.log(`\nDone. ${worksheets.length} PDFs + HTML in ${path.relative(ROOT, OUT)}`);
