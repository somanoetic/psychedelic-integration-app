/**
 * Worksheet config schema (declarative)
 *
 * A worksheet is a single printable page the user fills out by hand and then
 * scans back into the app. The same config drives THREE things:
 *
 *   1. The printable PDF (lib/worksheetPdfService.js renders this config to
 *      HTML, then expo-print converts to PDF).
 *   2. Claude vision interpretation on scan-in (lib/paperScanService.js sends
 *      the field list + per-field prompts alongside the image).
 *   3. The in-app review screen after a scan (each field becomes a card the
 *      user can correct).
 *
 * One source of truth, three artifacts. Adding a field updates all three.
 *
 * IDs are stable forever. Renames bump `version` (the glyph encodes it) so
 * older scans always reinterpret against the schema they were written on. If
 * a worksheet's design changes meaningfully (added/removed/renamed fields,
 * reordered for clinical reasons), increment version. Cosmetic-only changes
 * (label wording tweaks, layout polish) do not need a bump.
 *
 * @typedef {Object} WorksheetField
 * @property {string} id              Stable, kebab-case, unique within
 *                                    worksheet. Used as JSONB key in
 *                                    paper_scans.transcription.fields.
 * @property {string} label           Printed on the page above the field.
 *                                    Also shown in the review screen.
 * @property {'free-text'|'date'|'list'|'checkbox-list'|'scale'} kind
 *                                    Visual treatment on the printed page.
 *                                    - free-text:     blank writing lines (see `lines`)
 *                                    - date:          short single-line entry
 *                                    - list:          small numbered items (see `maxItems`)
 *                                    - checkbox-list: predefined options the
 *                                                     user can check (see `options`,
 *                                                     `allowOther`)
 *                                    - scale:         numeric scale, e.g. 1-10
 *                                                     (see `min`, `max`, `minLabel`,
 *                                                     `maxLabel`)
 * @property {number} [lines]         For kind='free-text'. Number of writing
 *                                    lines to render. Default 4.
 * @property {number} [maxItems]      For kind='list'. Default 3.
 * @property {string[]} [options]     For kind='checkbox-list'. The set of
 *                                    options printed next to checkboxes.
 *                                    Required for that kind.
 * @property {boolean} [allowOther]   For kind='checkbox-list'. Adds a final
 *                                    "Other: ____" write-in line. Default false.
 * @property {number} [min]           For kind='scale'. Default 1.
 * @property {number} [max]           For kind='scale'. Default 10.
 * @property {string} [minLabel]      For kind='scale'. Short word printed at
 *                                    the low end, e.g. "Exhausted".
 * @property {string} [maxLabel]      For kind='scale'. Short word printed at
 *                                    the high end, e.g. "Energized".
 * @property {string} [hint]          Optional small italic helper text under
 *                                    the label on the printed page.
 * @property {string} [promptForClaude]
 *                                    Optional extra context handed to Claude
 *                                    vision: "Read what the user wrote about
 *                                    body sensations; preserve their words."
 *                                    Only needed when the label alone is
 *                                    ambiguous.
 *
 * @typedef {Object} Worksheet
 * @property {string} id              Stable kebab-case. Embedded in glyph.
 * @property {number} version         Bumped on meaningful schema change.
 *                                    Embedded in glyph.
 * @property {string} title           Printed at top of page + shown in app.
 * @property {string} subtitle        Short one-liner under the title.
 * @property {string} description     Longer description, shown in the library
 *                                    browser. Not printed on the page.
 * @property {string[]} tracks        Track IDs this worksheet belongs to
 *                                    (matches content/tracks.js). Used to
 *                                    surface worksheets within a track.
 * @property {Object} [collection]    Optional logical grouping for the
 *                                    library browser. Many worksheets share a
 *                                    collection (e.g. the 5 pages of the
 *                                    Daily Check-In). Each scan is still its
 *                                    own paper_scans row; this only affects
 *                                    library presentation.
 * @property {string} collection.id   Stable kebab-case id of the collection.
 * @property {string} collection.title Human-readable title.
 * @property {string} [collection.description] One-liner shown above the
 *                                    grouped section in the library.
 * @property {number} [collection.order] Sort key WITHIN the collection
 *                                    (e.g. day-1 page-1=10, page-2=20, etc.).
 *                                    Lower = earlier. Default Infinity.
 * @property {WorksheetField[]} fields
 * @property {'a4-portrait'|'letter-portrait'} layout
 *                                    Print page size. Default 'letter-portrait'
 *                                    since US-primary audience.
 */

/**
 * Validate a worksheet config at module-load time. Throws on schema
 * violations so bad worksheets surface as a load error in dev, not a
 * runtime mystery when someone tries to print one.
 *
 * Validations:
 *   - required string fields are non-empty
 *   - version is a positive integer
 *   - field ids are unique
 *   - field ids and worksheet id are kebab-case (matches glyph regex
 *     in paperScanService.js)
 */
const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateWorksheet(w) {
  const errors = [];

  if (!w || typeof w !== 'object') {
    throw new Error('[Worksheet] Config must be an object');
  }
  if (!w.id || typeof w.id !== 'string') {
    errors.push('worksheet.id must be a non-empty string');
  } else if (!KEBAB_RE.test(w.id)) {
    errors.push(`worksheet.id "${w.id}" must be kebab-case (matches glyph format)`);
  }
  if (!Number.isInteger(w.version) || w.version < 1) {
    errors.push('worksheet.version must be a positive integer');
  }
  for (const k of ['title', 'subtitle', 'description']) {
    if (!w[k] || typeof w[k] !== 'string') {
      errors.push(`worksheet.${k} must be a non-empty string`);
    }
  }
  if (!Array.isArray(w.tracks) || w.tracks.length === 0) {
    errors.push('worksheet.tracks must be a non-empty array of track ids');
  }
  if (!Array.isArray(w.fields) || w.fields.length === 0) {
    errors.push('worksheet.fields must be a non-empty array');
  } else {
    const seen = new Set();
    w.fields.forEach((f, i) => {
      if (!f.id || typeof f.id !== 'string') {
        errors.push(`fields[${i}].id must be a non-empty string`);
      } else {
        if (!KEBAB_RE.test(f.id)) {
          errors.push(`fields[${i}].id "${f.id}" must be kebab-case`);
        }
        if (seen.has(f.id)) {
          errors.push(`fields[${i}].id "${f.id}" is duplicated`);
        }
        seen.add(f.id);
      }
      if (!f.label || typeof f.label !== 'string') {
        errors.push(`fields[${i}].label must be a non-empty string`);
      }
      if (!['free-text', 'date', 'list', 'checkbox-list', 'scale'].includes(f.kind)) {
        errors.push(`fields[${i}].kind must be free-text, date, list, checkbox-list, or scale`);
      }
      if (f.kind === 'free-text' && f.lines != null && (!Number.isInteger(f.lines) || f.lines < 1)) {
        errors.push(`fields[${i}].lines must be a positive integer`);
      }
      if (f.kind === 'list' && f.maxItems != null && (!Number.isInteger(f.maxItems) || f.maxItems < 1)) {
        errors.push(`fields[${i}].maxItems must be a positive integer`);
      }
      if (f.kind === 'checkbox-list') {
        if (!Array.isArray(f.options) || f.options.length === 0) {
          errors.push(`fields[${i}].options must be a non-empty array for checkbox-list`);
        } else if (f.options.some((o) => typeof o !== 'string' || !o.trim())) {
          errors.push(`fields[${i}].options must be non-empty strings`);
        }
      }
      if (f.kind === 'scale') {
        const min = f.min ?? 1;
        const max = f.max ?? 10;
        if (!Number.isInteger(min) || !Number.isInteger(max) || min >= max) {
          errors.push(`fields[${i}] scale must satisfy: integer min < integer max`);
        }
      }
    });
  }
  if (w.layout && !['a4-portrait', 'letter-portrait'].includes(w.layout)) {
    errors.push(`worksheet.layout must be a4-portrait or letter-portrait`);
  }
  if (w.collection != null) {
    if (typeof w.collection !== 'object') {
      errors.push('worksheet.collection must be an object when provided');
    } else {
      if (!w.collection.id || !KEBAB_RE.test(w.collection.id)) {
        errors.push('worksheet.collection.id must be kebab-case');
      }
      if (!w.collection.title || typeof w.collection.title !== 'string') {
        errors.push('worksheet.collection.title must be a non-empty string');
      }
    }
  }

  if (errors.length) {
    throw new Error(`[Worksheet] Invalid config for "${w.id ?? '?'}":\n  - ${errors.join('\n  - ')}`);
  }
  return w;
}

/**
 * Glyph format on printed page + what paperScanService.detectGlyph() returns.
 * Centralized so PDF generator + scan service stay in sync.
 */
export function buildGlyph(worksheet) {
  return `MT-${worksheet.id}-v${worksheet.version}`;
}
