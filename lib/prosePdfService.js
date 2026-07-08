/**
 * Prose PDF Service
 *
 * Renders a prose-page config (content/journal-prose/) to printable HTML in
 * the SAME visual language as the worksheets (Georgia serif titles, the same
 * type scale, the same footer band) so the full journal master reads as one
 * uniform book. Pairs with worksheetPdfService.js; the master assembly step
 * concatenates pages from both.
 *
 * Prose pages have no glyph (they're not scannable). They carry the same
 * "Multitudes" footer for visual continuity.
 *
 * renderProsePageHtml is pure (no Expo dependency) and is what the print-master
 * build uses. An on-device renderProsePageToPdf is provided for symmetry.
 */

export function renderProsePageHtml(page) {
  const pageSizeCss = page.layout === 'a4-portrait' ? 'A4' : 'Letter';
  const blocksHtml = page.blocks.map(renderBlock).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: ${pageSizeCss} portrait;
    margin: 0.7in 0.8in 0.85in 0.8in;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #2b2b2b;
    margin: 0;
    padding: 0;
    line-height: 1.5;
  }
  .page { position: relative; }
  h1.title {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 22pt;
    font-weight: 700;
    letter-spacing: 0.01em;
    margin: 0 0 0.28in 0;
    padding-bottom: 0.14in;
    border-bottom: 0.5px solid #b8b8b8;
  }
  h2.subhead {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 14pt;
    font-weight: 700;
    color: #3a3a3a;
    margin: 0.3in 0 0.1in 0;
  }
  p.body {
    font-size: 11pt;
    margin: 0 0 0.16in 0;
  }
  ul.bullets, ol.numbered {
    font-size: 11pt;
    margin: 0.04in 0 0.18in 0;
    padding-left: 0.28in;
  }
  ul.bullets li, ol.numbered li { margin-bottom: 0.05in; }
  /* Bold lead-in label + its bullet group (the journal's dominant pattern). */
  .lead-group { margin: 0.12in 0 0.18in 0; }
  .lead-group .lead {
    font-size: 11pt;
    font-weight: 700;
    color: #3a3a3a;
    margin-bottom: 0.05in;
  }
  .lead-group ul {
    font-size: 11pt;
    margin: 0;
    padding-left: 0.28in;
  }
  .lead-group li { margin-bottom: 0.04in; }
  /* Callout: emphasized block, lavender-tinted left rule. Two styles. */
  .callout {
    margin: 0.18in 0;
    padding: 0.12in 0.18in;
    border-left: 2.5pt solid #9d84b7;
    background: #f6f3fb;
    border-radius: 0 3pt 3pt 0;
    font-size: 11.5pt;
  }
  .callout.affirmation {
    font-style: italic;
    color: #4a3d5e;
  }
  .callout.emphasis {
    color: #3a3a3a;
  }
  .def-list { margin: 0.1in 0 0.18in 0; font-size: 11pt; }
  .def-list .row { margin-bottom: 0.06in; }
  .def-list .term { font-weight: 700; color: #3a3a3a; }
  .signature {
    margin-top: 0.3in;
    font-family: Georgia, serif;
    font-size: 11pt;
    font-style: italic;
    color: #4a4a4a;
  }
  .signature div { margin-bottom: 0.04in; }
  /* Footer: brand mark pinned to the bottom of every page (no glyph — prose
     pages are not scannable). Matches the worksheet footer band. */
  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: left;
    font-family: Georgia, serif;
    font-size: 9pt;
    font-style: italic;
    color: #9a9a9a;
  }
</style>
</head>
<body>
<div class="page">
  ${blocksHtml}
  <div class="footer">Multitudes</div>
</div>
</body>
</html>`;
}

function renderBlock(b) {
  switch (b.type) {
    case 'heading':
      return `<h1 class="title">${inline(b.text)}</h1>`;
    case 'subheading':
      return `<h2 class="subhead">${inline(b.text)}</h2>`;
    case 'paragraph':
      return `<p class="body">${inline(b.text)}</p>`;
    case 'bullets':
      return `<ul class="bullets">${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`;
    case 'numbered':
      return `<ol class="numbered">${b.items
        .map((i) =>
          typeof i === 'string'
            ? `<li>${inline(i)}</li>`
            : `<li>${inline(i.lead)}<ul class="bullets">${i.items
                .map((s) => `<li>${inline(s)}</li>`)
                .join('')}</ul></li>`,
        )
        .join('')}</ol>`;
    case 'leadGroup':
      return `<div class="lead-group"><div class="lead">${inline(b.lead)}</div>` +
        `<ul>${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul></div>`;
    case 'callout':
      return `<div class="callout ${b.style === 'affirmation' ? 'affirmation' : 'emphasis'}">${inline(b.text)}</div>`;
    case 'defList':
      return `<div class="def-list">${b.rows
        .map((r) => `<div class="row"><span class="term">${inline(r.term)}:</span> ${inline(r.desc)}</div>`)
        .join('')}</div>`;
    case 'signature':
      return `<div class="signature">${b.lines.map((l) => `<div>${inline(l)}</div>`).join('')}</div>`;
    default:
      return '';
  }
}

// Minimal inline markup: **bold** -> <strong>, with HTML escaping.
function inline(s) {
  const escaped = escapeHtml(String(s));
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
