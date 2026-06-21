'use strict';
const fs = require('fs');
const path = require('path');

const LESSONS = path.join(__dirname, '..', 'lessons');

// ── 1. Rename directories (high→low to avoid conflicts) ──────────
const DIR_RENAMES = [
  ['capitolo-08-sistemi-auto-evolutivi',    'capitolo-09-sistemi-auto-evolutivi'],
  ['capitolo-07-workflow-multi-agente',     'capitolo-08-workflow-multi-agente'],
  ['capitolo-06-agent-package',             'capitolo-07-agent-package'],
  ['capitolo-05-agenti-architettura',       'capitolo-06-agenti-architettura'],
  ['capitolo-04-strumenti-infrastruttura',  'capitolo-05-strumenti-infrastruttura'],
  ['capitolo-03-llm',                       'capitolo-04-llm'],
  ['capitolo-02-intelligenza-artificiale',  'capitolo-03-intelligenza-artificiale'],
];

for (const [oldDir, newDir] of DIR_RENAMES) {
  const from = path.join(LESSONS, oldDir);
  const to   = path.join(LESSONS, newDir);
  if (fs.existsSync(from)) {
    fs.renameSync(from, to);
    console.log(`DIR  ${oldDir} → ${newDir}`);
  }
}

// ── 2. Rename files within each directory ────────────────────────
const FILE_RENAMES = [
  ['capitolo-09-sistemi-auto-evolutivi',   '08-', '09-'],
  ['capitolo-08-workflow-multi-agente',    '07-', '08-'],
  ['capitolo-07-agent-package',            '06-', '07-'],
  ['capitolo-06-agenti-architettura',      '05-', '06-'],
  ['capitolo-05-strumenti-infrastruttura', '04-', '05-'],
  ['capitolo-04-llm',                      '03-', '04-'],
  ['capitolo-03-intelligenza-artificiale', '02-', '03-'],
];

for (const [dir, oldPfx, newPfx] of FILE_RENAMES) {
  const dirPath = path.join(LESSONS, dir);
  if (!fs.existsSync(dirPath)) continue;
  for (const f of fs.readdirSync(dirPath)) {
    if (f.startsWith(oldPfx)) {
      const from = path.join(dirPath, f);
      const to   = path.join(dirPath, newPfx + f.slice(oldPfx.length));
      fs.renameSync(from, to);
      console.log(`FILE ${dir}/${f} → ${newPfx + f.slice(oldPfx.length)}`);
    }
  }
}

// ── 3. Update all content in .md files ──────────────────────────
// Cross-chapter folder+prefix patterns (most specific first)
const CONTENT_REPLACEMENTS = [
  // full folder/prefix combos
  ['capitolo-08-sistemi-auto-evolutivi/08-',    'capitolo-09-sistemi-auto-evolutivi/09-'],
  ['capitolo-07-workflow-multi-agente/07-',     'capitolo-08-workflow-multi-agente/08-'],
  ['capitolo-06-agent-package/06-',             'capitolo-07-agent-package/07-'],
  ['capitolo-05-agenti-architettura/05-',       'capitolo-06-agenti-architettura/06-'],
  ['capitolo-04-strumenti-infrastruttura/04-',  'capitolo-05-strumenti-infrastruttura/05-'],
  ['capitolo-03-llm/03-',                       'capitolo-04-llm/04-'],
  ['capitolo-02-intelligenza-artificiale/02-',  'capitolo-03-intelligenza-artificiale/03-'],
  // folder names alone (for any remaining references without prefix)
  ['capitolo-08-sistemi-auto-evolutivi',    'capitolo-09-sistemi-auto-evolutivi'],
  ['capitolo-07-workflow-multi-agente',     'capitolo-08-workflow-multi-agente'],
  ['capitolo-06-agent-package',             'capitolo-07-agent-package'],
  ['capitolo-05-agenti-architettura',       'capitolo-06-agenti-architettura'],
  ['capitolo-04-strumenti-infrastruttura',  'capitolo-05-strumenti-infrastruttura'],
  ['capitolo-03-llm',                       'capitolo-04-llm'],
  ['capitolo-02-intelligenza-artificiale',  'capitolo-03-intelligenza-artificiale'],
  // "**Capitolo X**:" text labels in connection sections
  ['**Capitolo 8**', '**Capitolo 9**'],
  ['**Capitolo 7**', '**Capitolo 8**'],
  ['**Capitolo 6**', '**Capitolo 7**'],
  ['**Capitolo 5**', '**Capitolo 6**'],
  ['**Capitolo 4**', '**Capitolo 5**'],
  ['**Capitolo 3**', '**Capitolo 4**'],
  ['**Capitolo 2**', '**Capitolo 3**'],
];

// Same-chapter relative link prefix per directory (applied after global replacements)
const SAME_CHAPTER_PREFIX = {
  'capitolo-09-sistemi-auto-evolutivi':   ['08-', '09-'],
  'capitolo-08-workflow-multi-agente':    ['07-', '08-'],
  'capitolo-07-agent-package':            ['06-', '07-'],
  'capitolo-06-agenti-architettura':      ['05-', '06-'],
  'capitolo-05-strumenti-infrastruttura': ['04-', '05-'],
  'capitolo-04-llm':                      ['03-', '04-'],
  'capitolo-03-intelligenza-artificiale': ['02-', '03-'],
};

for (const dir of fs.readdirSync(LESSONS)) {
  const dirPath = path.join(LESSONS, dir);
  if (!fs.statSync(dirPath).isDirectory()) continue;

  for (const file of fs.readdirSync(dirPath)) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(dirPath, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Global cross-chapter replacements
    for (const [from, to] of CONTENT_REPLACEMENTS) {
      content = content.split(from).join(to);
    }

    // Same-chapter relative link replacement: (05-XX → (06-XX etc.
    if (SAME_CHAPTER_PREFIX[dir]) {
      const [oldPfx, newPfx] = SAME_CHAPTER_PREFIX[dir];
      // Match markdown link targets starting with old prefix: (05-XX-
      const re = new RegExp(`\\(${oldPfx}(\\d{2}-[a-z0-9])`, 'g');
      content = content.replace(re, `(${newPfx}$1`);
    }

    fs.writeFileSync(filePath, content);
  }
}

console.log('\n✅ Migration complete.');
