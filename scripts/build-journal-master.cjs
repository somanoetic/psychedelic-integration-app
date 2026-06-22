/**
 * Build the Integration Companion print master: prose pages (re-rendered in
 * the app style) + worksheet pages, interleaved in book order, merged into a
 * single PDF a printer can use as the master.
 *
 * Pages are rendered individually to PDF via headless Chrome (each page type
 * keeps its own @page margins), then concatenated with pypdf.
 *
 * Pass --mini to build only the prototype subset (a few prose pages + a couple
 * of worksheets) for style review.
 *
 *   node scripts/build-journal-master.cjs --mini
 *   node scripts/build-journal-master.cjs            (full, once all prose pages exist)
 */
const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'out', 'journal-master');
const MINI = process.argv.includes('--mini');

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
if (!CHROME) throw new Error('No Chrome/Edge found');

require(path.join(ROOT, 'node_modules/sucrase/register'));
const Module = require('node:module');
const origRequire = Module.prototype.require;
Module.prototype.require = function (request) {
  if (request === 'expo-print') return {};
  return origRequire.apply(this, arguments);
};

const { getWorksheet } = require(path.join(ROOT, 'content/worksheets/index.js'));
const { renderWorksheetHtml } = require(path.join(ROOT, 'lib/worksheetPdfService.js'));
const { renderProsePageHtml } = require(path.join(ROOT, 'lib/prosePdfService.js'));

const prose = (id) =>
  require(path.join(ROOT, `content/journal-prose/${id}.js`)).default;

// The 5 daily worksheet pages, in order. Repeated per day in the full book.
const DAILY_PAGES = [
  'daily-morning-checkin',
  'daily-life-experience',
  'daily-relationships',
  'daily-emotional-physical',
  'daily-self-care-evening',
];

// Expand the daily set across `days` days. Each entry carries a `day` number
// so the renderer can stamp "Day N" on the page.
function dailyCheckInDays(days) {
  const out = [];
  for (let day = 1; day <= days; day++) {
    for (const id of DAILY_PAGES) {
      out.push({ type: 'worksheet', id, day });
    }
  }
  return out;
}

// Book order. Each entry is a page to render. type 'prose' | 'worksheet'.
// MINI = a representative slice for style review.
const SEQUENCE = MINI
  ? [
      { type: 'prose', file: 'p01-dear-reader' },
      { type: 'prose', file: 'p08-connection-to-healing' },
      { type: 'worksheet', id: 'edu-unique-ns' },
      { type: 'worksheet', id: 'baseline-life-now' },
      { type: 'prose', file: 'p92-sample-intentions' },
    ]
  : [
      // Full book in source-page order: prose chapters interleaved with the
      // worksheet pages that sit between them.
      // --- Front matter / teaching chapters ---
      { type: 'prose', file: 'p01-dear-reader' },
      { type: 'prose', file: 'p02-understanding-healing-system-polyvagal' },
      { type: 'prose', file: 'p03-window-of-tolerance' },
      { type: 'worksheet', id: 'edu-patterns-resonance' },        // p.3 prompt
      { type: 'prose', file: 'p04-support-nervous-system-daily' },
      { type: 'prose', file: 'p06-what-happens-during-ketamine-sessions' },
      { type: 'worksheet', id: 'edu-healing-senses' },            // p.5
      { type: 'worksheet', id: 'edu-unique-ns' },                 // p.7
      { type: 'prose', file: 'p08-connection-to-healing' },
      { type: 'prose', file: 'p09-why-integration-is-essential' },
      { type: 'prose', file: 'p10-integration-as-relationship' },
      { type: 'prose', file: 'p11-the-immersion-effect' },
      { type: 'worksheet', id: 'edu-multisensory-integration' },  // p.12
      { type: 'prose', file: 'p13-neuroscience-compounding' },
      { type: 'worksheet', id: 'edu-pre-treatment-letter' },      // p.14
      // --- Pre-Treatment Baseline Log ---
      { type: 'worksheet', id: 'baseline-life-now' },
      { type: 'worksheet', id: 'baseline-life-areas' },
      { type: 'worksheet', id: 'baseline-coping-strategies' },
      { type: 'worksheet', id: 'baseline-relationship-patterns' },
      { type: 'prose', file: 'p19-instructions-for-use' },
      // --- Daily Check-In: the 5-page template repeated for 14 days, each
      //     instance stamped "Day N" so the printed book matches the source
      //     journal (source pages 20-89 = 14 days x 5 pages). ---
      ...dailyCheckInDays(14),
      // --- Session Reflections ---
      { type: 'worksheet', id: 'post-session-integration' },
      // --- Setting Intentions back-matter ---
      { type: 'prose', file: 'p90-setting-intentions-goals-vs-intentions' },
      { type: 'prose', file: 'p91-art-of-setting-healing-intentions' },
      { type: 'prose', file: 'p92-sample-intentions' },
      { type: 'prose', file: 'p93-how-to-connect-with-your-intentions' },
      { type: 'prose', file: 'p94-transforming-experience-into-wisdom' },
    ];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// Return a render-time copy of a worksheet with "Day N" stamped into its
// subtitle. Does not mutate the config; the day label is a master-only
// decoration so the printed daily pages are unambiguous.
function withDayLabel(worksheet, day) {
  if (!day) return worksheet;
  const dayText = `Day ${day}`;
  return {
    ...worksheet,
    subtitle: worksheet.subtitle ? `${dayText} · ${worksheet.subtitle}` : dayText,
  };
}

const pdfPaths = [];
SEQUENCE.forEach((entry, i) => {
  const idx = String(i + 1).padStart(3, '0');
  const daySuffix = entry.day ? `-d${String(entry.day).padStart(2, '0')}` : '';
  const name = entry.type === 'prose' ? entry.file : `ws-${entry.id}${daySuffix}`;
  const html = entry.type === 'prose'
    ? renderProsePageHtml(prose(entry.file))
    : renderWorksheetHtml(withDayLabel(getWorksheet(entry.id), entry.day));
  const htmlPath = path.join(OUT, `${idx}-${name}.html`);
  const pdfPath = path.join(OUT, `${idx}-${name}.pdf`);
  fs.writeFileSync(htmlPath, html, 'utf8');
  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--no-pdf-header-footer',
    `--print-to-pdf=${pdfPath}`,
    'file://' + htmlPath.replace(/\\/g, '/'),
  ], { stdio: 'ignore' });
  pdfPaths.push(pdfPath);
  console.log(`  ${idx} ${entry.type}: ${name}`);
});

// Merge with pypdf.
const masterPath = path.join(OUT, MINI ? 'mini-master.pdf' : 'integration-companion-master.pdf');
const pyMerge = `
import sys
from pypdf import PdfWriter
w = PdfWriter()
for p in sys.argv[1:-1]:
    w.append(p)
with open(sys.argv[-1], 'wb') as f:
    w.write(f)
`;
const pyPath = path.join(OUT, '_merge.py');
fs.writeFileSync(pyPath, pyMerge);
execFileSync('python', [pyPath, ...pdfPaths, masterPath], { stdio: 'inherit' });
fs.rmSync(pyPath, { force: true });

console.log(`\nMaster: ${path.relative(ROOT, masterPath)}  (${pdfPaths.length} pages merged)`);
