/**
 * Markdown transcript writer.
 *
 * Layout on disk:
 *   __tests__/transcripts/personas/
 *     INDEX.md
 *     <persona-id>/
 *       INDEX.md
 *       <mode>_run1.md
 *       <mode>_run1.json
 *       <mode>_run2.md
 *       ...
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', '..', 'transcripts', 'personas');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function formatTranscriptMarkdown(transcript, evalResult) {
  const lines = [];

  // Header
  lines.push(`# ${transcript.persona}`);
  lines.push('');
  lines.push(`**Persona:** ${transcript.description}`);
  lines.push(`**Mode:** \`${transcript.mode}\``);
  lines.push(`**Run:** ${transcript.runIndex}`);
  lines.push(`**Safety-critical:** ${transcript.safetyCritical ? 'yes' : 'no'}`);
  lines.push(`**Turns:** ${transcript.totalTurns}`);
  lines.push(`**End reason:** ${transcript.endReason || 'n/a'}`);
  lines.push(`**Phases:** ${transcript.uniquePhases.join(' → ') || 'none recorded'}`);
  lines.push(`**Started:** ${transcript.startedAt}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Eval block (top, for triage)
  lines.push('## Clinical Eval');
  lines.push('');
  if (evalResult?.markdown) {
    lines.push(evalResult.markdown);
  } else if (evalResult?.error) {
    lines.push(`*(eval failed: ${evalResult.error})*`);
  } else {
    lines.push('*(no eval available)*');
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Conversation
  lines.push('## Conversation');
  lines.push('');
  for (const t of transcript.turns) {
    lines.push(`### Turn ${t.turn} — phase: \`${t.phase || 'none'}\` (${t.durationMs}ms)`);
    lines.push('');
    lines.push('**User:**');
    lines.push('');
    lines.push('> ' + t.user.split('\n').join('\n> '));
    lines.push('');
    lines.push('**Huxley:**');
    lines.push('');
    lines.push('> ' + t.huxley.split('\n').join('\n> '));
    lines.push('');
  }

  // Errors
  if (transcript.errors.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Errors');
    lines.push('');
    for (const e of transcript.errors) {
      lines.push(`- Turn ${e.turn} (${e.side}): \`${e.error}\``);
    }
    lines.push('');
  }

  // Therapeutic data
  if (transcript.finalTherapeuticData) {
    lines.push('---');
    lines.push('');
    lines.push('## Final Therapeutic Data');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(transcript.finalTherapeuticData, null, 2));
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}

function writeTranscript(transcript, evalResult) {
  const personaDir = path.join(BASE_DIR, transcript.personaId);
  ensureDir(personaDir);

  const baseFilename = `${transcript.mode}_run${transcript.runIndex}`;
  const mdPath = path.join(personaDir, `${baseFilename}.md`);
  const jsonPath = path.join(personaDir, `${baseFilename}.json`);

  fs.writeFileSync(mdPath, formatTranscriptMarkdown(transcript, evalResult), 'utf-8');
  fs.writeFileSync(
    jsonPath,
    JSON.stringify({ transcript, eval: evalResult }, null, 2),
    'utf-8'
  );

  return { mdPath, jsonPath };
}

/**
 * Build/update an index across all transcripts.
 *
 * @param {Array<{transcript, evalResult, mdPath}>} entries
 */
function writeTopLevelIndex(entries) {
  ensureDir(BASE_DIR);
  const lines = [];
  lines.push('# Persona Matrix — Transcript Index');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Total conversations: ${entries.length}`);
  lines.push('');

  // Summary by recommendation
  const byRec = {};
  for (const e of entries) {
    const rec = e.evalResult?.recommendation || 'UNKNOWN';
    byRec[rec] = (byRec[rec] || 0) + 1;
  }
  lines.push('## Recommendations Summary');
  lines.push('');
  for (const rec of ['BAD_OUTCOME', 'NEEDS_REVIEW', 'ACCEPTABLE', 'STRONG', 'UNKNOWN']) {
    if (byRec[rec]) lines.push(`- **${rec}**: ${byRec[rec]}`);
  }
  lines.push('');

  // Group by persona
  const byPersona = {};
  for (const e of entries) {
    const id = e.transcript.personaId;
    if (!byPersona[id]) byPersona[id] = { name: e.transcript.persona, entries: [] };
    byPersona[id].entries.push(e);
  }

  lines.push('## By Persona');
  lines.push('');
  for (const [personaId, group] of Object.entries(byPersona)) {
    lines.push(`### ${group.name}`);
    lines.push('');
    // Show a small table: mode | run | turns | rec
    lines.push('| Mode | Run | Turns | End | Recommendation | Link |');
    lines.push('|------|-----|-------|-----|----------------|------|');
    for (const e of group.entries) {
      const t = e.transcript;
      const rec = e.evalResult?.recommendation || '—';
      const rel = `./${personaId}/${t.mode}_run${t.runIndex}.md`;
      lines.push(
        `| \`${t.mode}\` | ${t.runIndex} | ${t.totalTurns} | ${t.endReason ? t.endReason.split(' ')[0] : '?'} | ${rec} | [open](${rel}) |`
      );
    }
    lines.push('');
  }

  const indexPath = path.join(BASE_DIR, 'INDEX.md');
  fs.writeFileSync(indexPath, lines.join('\n'), 'utf-8');
  return indexPath;
}

function writePersonaIndex(personaId, personaName, entries) {
  const dir = path.join(BASE_DIR, personaId);
  ensureDir(dir);
  const lines = [];
  lines.push(`# ${personaName}`);
  lines.push('');
  lines.push(`Conversations: ${entries.length}`);
  lines.push('');
  for (const e of entries) {
    const t = e.transcript;
    const rec = e.evalResult?.recommendation || '—';
    lines.push(`- [\`${t.mode}\` run ${t.runIndex}](./${t.mode}_run${t.runIndex}.md) — ${t.totalTurns} turns — **${rec}**`);
  }
  lines.push('');
  fs.writeFileSync(path.join(dir, 'INDEX.md'), lines.join('\n'), 'utf-8');
}

module.exports = {
  formatTranscriptMarkdown,
  writeTranscript,
  writeTopLevelIndex,
  writePersonaIndex,
  BASE_DIR,
};
