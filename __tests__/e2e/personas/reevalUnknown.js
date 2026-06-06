/**
 * Re-evaluate transcripts whose original eval failed (UNKNOWN / fetch failed).
 *
 * Usage:
 *   node __tests__/e2e/personas/reevalUnknown.js
 *
 * Reads __tests__/transcripts/personas/<persona>/<mode>_run<N>.json, finds the
 * ones where eval.recommendation === "UNKNOWN" or eval.error is set, re-runs
 * evaluateTranscript on each, writes the updated .json AND .md, then rebuilds
 * the top-level + per-persona indexes.
 */

const fs = require('fs');
const path = require('path');

const { evaluateTranscript, MODE_DESCRIPTIONS } = require('./evalPass');
const {
  writeTranscript,
  writeTopLevelIndex,
  writePersonaIndex,
  BASE_DIR,
} = require('./transcriptWriter');

function findUnknowns() {
  const personaDirs = fs.readdirSync(BASE_DIR).filter((d) => {
    const full = path.join(BASE_DIR, d);
    return fs.statSync(full).isDirectory();
  });

  const targets = [];
  for (const dir of personaDirs) {
    const full = path.join(BASE_DIR, dir);
    for (const file of fs.readdirSync(full)) {
      if (!file.endsWith('.json')) continue;
      const fullPath = path.join(full, file);
      try {
        const raw = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        const transcript = raw.transcript;
        const evalResult = raw.eval;
        if (!transcript || transcript.totalTurns === 0) continue;
        const rec = evalResult?.recommendation;
        if (!rec || rec === 'UNKNOWN' || evalResult?.error) {
          targets.push({ fullPath, transcript, evalResult });
        }
      } catch (_) {}
    }
  }
  return targets;
}

function loadAllEntries() {
  const personaDirs = fs.readdirSync(BASE_DIR).filter((d) => {
    const full = path.join(BASE_DIR, d);
    return fs.statSync(full).isDirectory();
  });
  const entries = [];
  const byPersona = {};
  for (const dir of personaDirs) {
    const full = path.join(BASE_DIR, dir);
    for (const file of fs.readdirSync(full)) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(full, file), 'utf-8'));
        if (!raw?.transcript) continue;
        const entry = { transcript: raw.transcript, evalResult: raw.eval };
        entries.push(entry);
        const pid = raw.transcript.personaId;
        if (!byPersona[pid]) byPersona[pid] = { name: raw.transcript.persona, entries: [] };
        byPersona[pid].entries.push(entry);
      } catch (_) {}
    }
  }
  return { entries, byPersona };
}

(async () => {
  const targets = findUnknowns();
  console.log(`Found ${targets.length} transcripts to re-evaluate.`);
  let ok = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const { transcript } = targets[i];
    const label = `[${i + 1}/${targets.length}] ${transcript.personaId} × ${transcript.mode} × run${transcript.runIndex}`;
    process.stdout.write(`${label}... `);
    try {
      const evalResult = await evaluateTranscript(
        transcript,
        MODE_DESCRIPTIONS[transcript.mode] || `Mode: ${transcript.mode}`
      );
      writeTranscript(transcript, evalResult);
      console.log(`${evalResult.recommendation}`);
      ok++;
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      failed++;
    }
  }

  // Rebuild indexes
  const { entries, byPersona } = loadAllEntries();
  writeTopLevelIndex(entries);
  for (const [pid, group] of Object.entries(byPersona)) {
    writePersonaIndex(pid, group.name, group.entries);
  }
  console.log(`\nDone. ${ok} re-evaluated, ${failed} failed. Indexes rebuilt.`);
})().catch((e) => {
  console.error('Re-eval script crashed:', e);
  process.exit(1);
});
