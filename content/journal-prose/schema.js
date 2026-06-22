/**
 * Prose-page schema (declarative) — the teaching / non-fillable pages of the
 * Integration Companion journal, modeled as structured data so they can be
 * re-rendered in the app's own style for the print master.
 *
 * Mirrors the worksheet philosophy: one config -> rendered page. A prose page
 * is an ordered list of blocks. The block vocabulary was derived from auditing
 * every prose page in the source journal; these primitives cover 100% of them:
 *
 *   - heading      { text }                     H1 chapter title (top of page)
 *   - subheading   { text }                     H2 section divider
 *   - paragraph    { text }                     body copy (may include **bold**)
 *   - bullets      { items: string[] }          bulleted list
 *   - numbered     { items: (string|Group)[] }  numbered list; an item may be a
 *                                               { lead, items } group for nesting
 *   - leadGroup    { lead, items: string[] }    bold lead-in label + bullets
 *                                               (the journal's dominant pattern,
 *                                               e.g. "Make Sense of Your Responses:")
 *   - callout      { text, style }              emphasized block; style is
 *                                               'affirmation' (first-person quote)
 *                                               or 'emphasis' (standalone statement)
 *   - defList      { rows: {term, desc}[] }     label->value list (p.13 timeline)
 *   - signature    { lines: string[] }          closing signature (cover letter)
 *
 * @typedef {Object} ProsePage
 * @property {string} id        Stable kebab-case. Used for ordering/assembly.
 * @property {number} sourcePage  Page number in the original journal (for the
 *                                assembly order + provenance).
 * @property {Block[]} blocks   Ordered content blocks.
 * @property {'a4-portrait'|'letter-portrait'} [layout]  Default letter-portrait.
 */

const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BLOCK_TYPES = new Set([
  'heading', 'subheading', 'paragraph', 'bullets',
  'numbered', 'leadGroup', 'callout', 'defList', 'signature',
]);

export function validateProsePage(p) {
  const errors = [];
  if (!p || typeof p !== 'object') throw new Error('[ProsePage] must be an object');
  if (!p.id || !KEBAB_RE.test(p.id)) errors.push('id must be kebab-case');
  if (!Number.isInteger(p.sourcePage) || p.sourcePage < 1) {
    errors.push('sourcePage must be a positive integer');
  }
  if (!Array.isArray(p.blocks) || p.blocks.length === 0) {
    errors.push('blocks must be a non-empty array');
  } else {
    p.blocks.forEach((b, i) => {
      if (!b || !BLOCK_TYPES.has(b.type)) {
        errors.push(`blocks[${i}].type "${b?.type}" is not a known block`);
      }
    });
  }
  if (p.layout && !['a4-portrait', 'letter-portrait'].includes(p.layout)) {
    errors.push('layout must be a4-portrait or letter-portrait');
  }
  if (errors.length) {
    throw new Error(`[ProsePage] Invalid "${p.id ?? '?'}":\n  - ${errors.join('\n  - ')}`);
  }
  return p;
}
