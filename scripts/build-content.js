#!/usr/bin/env node
/* Build lessons/content.js from the source .md files.
   The website reads LEZIONI_CONTENT and ROADMAP_CONTENT from content.js,
   so this regenerates that bundle from the canonical markdown sources. */

const fs = require('fs');
const path = require('path');

const LESSONS_DIR = path.join(__dirname, '..', 'lessons');
const OUT_FILE = path.join(LESSONS_DIR, 'content.js');

function buildLezioni() {
  const lezioni = {};
  const chapterDirs = fs.readdirSync(LESSONS_DIR)
    .filter(name => name.startsWith('capitolo-'))
    .filter(name => fs.statSync(path.join(LESSONS_DIR, name)).isDirectory())
    .sort();

  for (const chapter of chapterDirs) {
    lezioni[chapter] = {};
    const files = fs.readdirSync(path.join(LESSONS_DIR, chapter))
      .filter(f => f.endsWith('.md'))
      .sort();
    for (const file of files) {
      const id = file.replace(/\.md$/, '');
      lezioni[chapter][id] = fs.readFileSync(path.join(LESSONS_DIR, chapter, file), 'utf8');
    }
  }
  return lezioni;
}

function main() {
  const lezioni = buildLezioni();
  const roadmap = fs.readFileSync(path.join(LESSONS_DIR, 'ROADMAP.md'), 'utf8');
  const glossarioPath = path.join(LESSONS_DIR, 'GLOSSARIO.md');
  const glossario = fs.existsSync(glossarioPath) ? fs.readFileSync(glossarioPath, 'utf8') : '';

  const content =
    'const LEZIONI_CONTENT = ' + JSON.stringify(lezioni) + ';\n' +
    'const ROADMAP_CONTENT = ' + JSON.stringify(roadmap) + ';\n' +
    'const GLOSSARIO_CONTENT = ' + JSON.stringify(glossario) + ';\n';

  fs.writeFileSync(OUT_FILE, content);

  let lessonCount = 0;
  for (const ch of Object.keys(lezioni)) lessonCount += Object.keys(lezioni[ch]).length;
  console.log(`content.js generato: ${Object.keys(lezioni).length} capitoli, ${lessonCount} lezioni.`);
}

main();
