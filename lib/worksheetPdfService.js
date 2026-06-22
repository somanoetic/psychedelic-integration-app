/**
 * Worksheet PDF Service
 *
 * Renders a worksheet config to a printable PDF via expo-print.
 *
 * Pipeline: worksheet config -> HTML string -> expo-print PDF -> file URI.
 * Caller decides what to do with the URI (share-sheet, email, direct print).
 *
 * Layout choices (locked here, not per-worksheet, so all printed pages have a
 * consistent feel):
 *   - Letter portrait by default, A4 if the worksheet asks for it. Both work
 *     fine on most printers.
 *   - Serif title (Georgia) on a hairline rule. Sans-serif body. Calm.
 *   - Generous white space and writing lines tall enough for adult handwriting
 *     (about 9mm line height).
 *   - Glyph in the bottom-right corner: small box with the encoded id.
 *     Format matches the regex in paperScanService.detectGlyph().
 *   - Single page. If a worksheet doesn't fit on one page, that's a content
 *     problem (it's asking the user to write too much in one sitting) — split
 *     it into two worksheets instead of letting it overflow.
 *
 * Why HTML over a programmatic PDF library (pdfkit, react-pdf): expo-print is
 * already installed, HTML is dead simple to iterate on, and we don't need the
 * pixel-perfect control a programmatic library would give us. If we later
 * want truly designer-led layouts (e.g. for the purchased physical journal),
 * those can stay as pre-designed PDFs with a sidecar field-map — this code
 * path is for the in-app generated worksheets.
 */

import * as Print from 'expo-print';
import { buildGlyph } from '../content/worksheets/schema';

/**
 * Render worksheet -> PDF file. Returns { uri } where uri is a local file://
 * path the caller can hand to expo-sharing, expo-mail-composer, or Print.
 */
export async function renderWorksheetToPdf(worksheet) {
  const html = renderWorksheetHtml(worksheet);
  const pageSize = worksheet.layout === 'a4-portrait' ? 'A4' : 'Letter';

  const result = await Print.printToFileAsync({
    html,
    base64: false,
    // expo-print uses CSS @page for size; we pass html with the appropriate
    // page-size rule baked in.
    width: pageSize === 'A4' ? 595 : 612,    // points (1/72 inch)
    height: pageSize === 'A4' ? 842 : 792,
  });

  return { uri: result.uri };
}

/**
 * Build the print HTML for a worksheet. Exported separately for tests.
 */
export function renderWorksheetHtml(worksheet) {
  const glyph = buildGlyph(worksheet);
  const fieldsHtml = worksheet.fields.map(renderField).join('\n');
  const pageSizeCss = worksheet.layout === 'a4-portrait' ? 'A4' : 'Letter';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: ${pageSizeCss} portrait;
    margin: 0.6in 0.7in;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #2b2b2b;
    margin: 0;
    padding: 0;
    line-height: 1.4;
  }
  .page {
    position: relative;
    min-height: 9.5in;
  }
  .header {
    text-align: center;
    margin-bottom: 0.35in;
    padding-bottom: 0.15in;
    border-bottom: 0.5px solid #b8b8b8;
  }
  .title {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 22pt;
    font-weight: 700;
    letter-spacing: 0.01em;
    margin: 0 0 0.06in 0;
  }
  .subtitle {
    font-size: 10pt;
    color: #6a6a6a;
    font-style: italic;
    margin: 0;
  }
  .field {
    margin-bottom: 0.32in;
  }
  .field-label {
    font-size: 10.5pt;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #4a4a4a;
    margin-bottom: 0.04in;
  }
  .field-hint {
    font-size: 9pt;
    color: #8a8a8a;
    font-style: italic;
    margin-bottom: 0.1in;
  }
  /* Writing lines: thin baseline rules, evenly spaced. */
  .writing-lines .line {
    border-bottom: 0.5px solid #c8c8c8;
    height: 0.36in;
  }
  /* Write | Draw two-column layout (source journal pages 7 & 12).
     Print-only: the draw box is for sketching by hand on the page. */
  .write-draw {
    display: flex;
    gap: 0.2in;
    align-items: stretch;
  }
  .write-draw .wd-col {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .write-draw .wd-head {
    font-size: 8.5pt;
    font-style: italic;
    color: #8a8a8a;
    margin-bottom: 0.05in;
  }
  .write-draw .draw-box {
    flex: 1;
    border: 0.5px solid #c8c8c8;
    border-radius: 2pt;
    min-height: 0.9in;
  }
  /* Date: single short line. */
  .date-line {
    border-bottom: 0.5px solid #c8c8c8;
    height: 0.34in;
    width: 2.4in;
  }
  /* List items: numbered short lines. */
  .list-items .list-item {
    display: flex;
    align-items: flex-end;
    margin-bottom: 0.08in;
  }
  .list-items .num {
    font-size: 10pt;
    color: #8a8a8a;
    width: 0.2in;
    flex-shrink: 0;
    padding-bottom: 0.04in;
  }
  .list-items .line {
    border-bottom: 0.5px solid #c8c8c8;
    height: 0.32in;
    flex: 1;
  }
  /* Checkbox list: small square + label, wrapping rows. */
  .checkbox-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.06in 0.18in;
    margin-top: 0.04in;
  }
  .checkbox-list .checkbox-item {
    display: flex;
    align-items: center;
    font-size: 10pt;
    color: #3a3a3a;
  }
  .checkbox-list .box {
    display: inline-block;
    width: 9pt;
    height: 9pt;
    border: 0.5px solid #6a6a6a;
    border-radius: 1.5pt;
    margin-right: 4pt;
  }
  .checkbox-list .other-row {
    width: 100%;
    display: flex;
    align-items: flex-end;
    margin-top: 0.04in;
  }
  .checkbox-list .other-row .other-label {
    font-size: 10pt;
    color: #3a3a3a;
    margin-right: 4pt;
    display: flex;
    align-items: center;
  }
  .checkbox-list .other-row .other-label .box {
    margin-right: 4pt;
  }
  .checkbox-list .other-row .other-line {
    border-bottom: 0.5px solid #c8c8c8;
    height: 0.28in;
    flex: 1;
  }
  /* Scale: small circles min..max + min/max labels. */
  .scale {
    display: flex;
    align-items: center;
    margin-top: 0.06in;
  }
  .scale .end-label {
    font-size: 9pt;
    color: #6a6a6a;
    font-style: italic;
  }
  .scale .marks {
    display: flex;
    gap: 0.05in;
    margin: 0 0.12in;
  }
  .scale .mark {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1pt;
    font-size: 8pt;
    color: #6a6a6a;
  }
  .scale .mark .circle {
    width: 10pt;
    height: 10pt;
    border: 0.5px solid #6a6a6a;
    border-radius: 50%;
  }
  /* Glyph: small framed text mark in bottom-right. Sized + framed for
     reliable detection by Claude vision (paperScanService.detectGlyph). */
  .glyph {
    position: absolute;
    bottom: 0;
    right: 0;
    font-family: "Courier New", Courier, monospace;
    font-size: 7.5pt;
    color: #6a6a6a;
    letter-spacing: 0.04em;
    padding: 2pt 5pt;
    border: 0.5px solid #b0b0b0;
    border-radius: 2pt;
  }
  .footer-mark {
    position: absolute;
    bottom: 0;
    left: 0;
    font-family: Georgia, serif;
    font-size: 9pt;
    font-style: italic;
    color: #9a9a9a;
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1 class="title">${escapeHtml(worksheet.title)}</h1>
    <p class="subtitle">${escapeHtml(worksheet.subtitle)}</p>
  </div>

  ${fieldsHtml}

  <div class="footer-mark">Multitudes</div>
  <div class="glyph">${glyph}</div>
</div>
</body>
</html>`;
}

function renderField(field) {
  const label = `<div class="field-label">${escapeHtml(field.label)}</div>`;
  const hint = field.hint
    ? `<div class="field-hint">${escapeHtml(field.hint)}</div>`
    : '';

  let body;
  switch (field.kind) {
    case 'date':
      body = `<div class="date-line"></div>`;
      break;
    case 'free-text': {
      const n = field.lines ?? 4;
      const lines = Array.from({ length: n }, () => `<div class="line"></div>`).join('');
      const writing = `<div class="writing-lines">${lines}</div>`;
      if (field.drawColumn) {
        // Source journal's "Write | Draw" two-column table (pages 7 & 12):
        // writing lines on the left, an empty bordered sketch box on the
        // right for drawing by hand on the printed page.
        body = `<div class="write-draw">` +
          `<div class="wd-col"><div class="wd-head">Write</div>${writing}</div>` +
          `<div class="wd-col"><div class="wd-head">Draw</div><div class="draw-box"></div></div>` +
          `</div>`;
      } else {
        body = writing;
      }
      break;
    }
    case 'list': {
      const n = field.maxItems ?? 3;
      const items = Array.from({ length: n }, (_, i) =>
        `<div class="list-item"><span class="num">${i + 1}.</span><div class="line"></div></div>`
      ).join('');
      body = `<div class="list-items">${items}</div>`;
      break;
    }
    case 'checkbox-list': {
      const items = field.options.map((opt) =>
        `<div class="checkbox-item"><span class="box"></span>${escapeHtml(opt)}</div>`
      ).join('');
      const otherRow = field.allowOther
        ? `<div class="other-row"><span class="other-label"><span class="box"></span>Other:</span><div class="other-line"></div></div>`
        : '';
      body = `<div class="checkbox-list">${items}${otherRow}</div>`;
      break;
    }
    case 'scale': {
      const min = field.min ?? 1;
      const max = field.max ?? 10;
      const marks = [];
      for (let n = min; n <= max; n++) {
        marks.push(`<div class="mark"><span class="circle"></span>${n}</div>`);
      }
      const minLabel = field.minLabel
        ? `<span class="end-label">${escapeHtml(field.minLabel)}</span>`
        : '';
      const maxLabel = field.maxLabel
        ? `<span class="end-label">${escapeHtml(field.maxLabel)}</span>`
        : '';
      body = `<div class="scale">${minLabel}<div class="marks">${marks.join('')}</div>${maxLabel}</div>`;
      break;
    }
    default:
      // Validator would have caught this — defensive fallback.
      body = `<div class="writing-lines"><div class="line"></div></div>`;
  }

  return `<div class="field">\n  ${label}\n  ${hint}\n  ${body}\n</div>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
