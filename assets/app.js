/* ============================================================
   CYBERPUNK COURSE APP — Main Application Logic
   ============================================================ */

'use strict';

// ── State ────────────────────────────────────────────────────
const state = {
  manifest: null,
  current: { chapterId: null, lessonId: null },
};

// ── DOM refs ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    state.manifest = await loadManifest();
    buildSidebar();
    setupMobileToggle();
    routeFromHash(location.hash.slice(1));
  } catch (e) {
    console.error('Init error:', e);
    showError('Errore durante il caricamento del corso.');
  }
});

// ── Load manifest ─────────────────────────────────────────────
async function loadManifest() {
  if (typeof MANIFEST_DATA !== 'undefined') return MANIFEST_DATA;
  const res = await fetch('lessons/manifest.json');
  if (!res.ok) throw new Error('manifest.json non trovato');
  return res.json();
}

// ── Build sidebar ─────────────────────────────────────────────
function buildSidebar() {
  const sidebarEl = $('sidebar-chapters');
  if (!sidebarEl) return;
  sidebarEl.innerHTML = '';

  // Search bar
  const searchWrap = document.createElement('div');
  searchWrap.className = 'sidebar-search';
  searchWrap.innerHTML = `<input type="text" id="lesson-search" placeholder="🔍 Cerca lezione..." autocomplete="off">`;
  sidebarEl.appendChild(searchWrap);

  const searchInput = searchWrap.querySelector('#lesson-search');
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    $$('.chapter-item').forEach(chItem => {
      let anyVisible = false;
      chItem.querySelectorAll('.lesson-link').forEach(link => {
        const match = !q || link.textContent.toLowerCase().includes(q);
        link.style.display = match ? '' : 'none';
        if (match) anyVisible = true;
      });
      chItem.style.display = anyVisible ? '' : 'none';
      if (q && anyVisible) chItem.classList.add('open');
      else if (!q) chItem.classList.remove('open');
    });
    // Keep active chapter open
    if (!q) {
      const activeLessonLink = document.querySelector('.lesson-link.active');
      if (activeLessonLink) {
        const activeChap = activeLessonLink.closest('.chapter-item');
        if (activeChap) activeChap.classList.add('open');
      }
    }
  });

  // Roadmap button
  const roadmapBtn = document.createElement('div');
  roadmapBtn.className = 'sidebar-roadmap-btn';
  roadmapBtn.id = 'roadmap-btn';
  roadmapBtn.innerHTML = `<span>🗺</span> ROADMAP DEL CORSO`;
  roadmapBtn.addEventListener('click', () => { showRoadmap(); closeMobileSidebar(); });
  sidebarEl.appendChild(roadmapBtn);

  // Chapters
  state.manifest.roadmap.forEach((chapter, ci) => {
    const item = document.createElement('div');
    item.className = 'chapter-item';
    item.id = `chap-${chapter.id}`;

    const header = document.createElement('div');
    header.className = 'chapter-header';
    header.style.setProperty('--chap-color', chapter.colore);
    header.innerHTML = `
      <span class="chapter-icon" style="color:${chapter.colore}">${chapter.icona}</span>
      <div>
        <div class="chapter-num">CAP. ${String(chapter.numero).padStart(2,'0')}</div>
        <div class="chapter-name">${chapter.titolo}</div>
      </div>
      <span class="chapter-toggle">›</span>
    `;
    header.addEventListener('click', () => toggleChapter(item));

    const lessonsList = document.createElement('div');
    lessonsList.className = 'lessons-list';

    chapter.lezioni.forEach((lesson, li) => {
      const link = document.createElement('a');
      link.className = 'lesson-link';
      link.id = `lesson-${chapter.id}-${lesson.id}`;
      link.style.setProperty('--chap-color', chapter.colore);
      link.innerHTML = `
        <span class="lesson-dot"></span>
        <span>${lesson.titolo}</span>
      `;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openLesson(chapter.id, lesson.id);
        closeMobileSidebar();
      });
      lessonsList.appendChild(link);
    });

    item.appendChild(header);
    item.appendChild(lessonsList);
    sidebarEl.appendChild(item);
  });

}

function toggleChapter(item, forceOpen) {
  const isOpen = item.classList.contains('open');
  if (forceOpen === true || !isOpen) {
    item.classList.add('open');
  } else {
    item.classList.remove('open');
  }
}

// ── Lesson loading ────────────────────────────────────────────
async function openLesson(chapterId, lessonId, pushHistory = true) {
  const chapter = state.manifest.roadmap.find(c => c.id === chapterId);
  const lesson = chapter?.lezioni.find(l => l.id === lessonId);
  if (!chapter || !lesson) { showError(`Lezione non trovata: ${chapterId}/${lessonId}`); return; }

  state.current = { chapterId, lessonId };

  // Update URL
  if (pushHistory) history.pushState({}, '', `#${chapterId}/${lessonId}`);

  // Update sidebar active state
  $$('.lesson-link').forEach(el => el.classList.remove('active'));
  $$('.chapter-header').forEach(el => el.classList.remove('active'));
  const activeLink = $(`lesson-${chapterId}-${lessonId}`);
  if (activeLink) activeLink.classList.add('active');

  // Open chapter in sidebar
  const chapEl = $(`chap-${chapterId}`);
  if (chapEl) toggleChapter(chapEl, true);

  // Scroll sidebar to active lesson
  setTimeout(() => {
    const activeEl = $(`lesson-${chapterId}-${lessonId}`);
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, 50);

  // Update roadmap btn
  $('roadmap-btn')?.classList.remove('active');

  // Update breadcrumb
  const bc = $('breadcrumb');
  if (bc) bc.innerHTML = `<span>${chapter.titolo}</span> › ${lesson.titolo}`;

  // Get content from embedded JS object
  let rawMd = getEmbeddedContent(chapterId, lessonId);
  if (!rawMd) {
    showError(`Contenuto non trovato per ${lessonId}`);
    return;
  }

  // Parse frontmatter
  const { meta, body } = parseFrontmatter(rawMd);

  // Render
  renderLesson(chapter, lesson, meta, body, chapterId, lessonId);
}

function getEmbeddedContent(chapterId, lessonId) {
  if (typeof LEZIONI_CONTENT === 'undefined') return null;
  const cap = LEZIONI_CONTENT[chapterId];
  if (!cap) return null;
  return cap[lessonId] || null;
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const [key, ...vals] = line.split(':');
    if (!key || !vals.length) return;
    const val = vals.join(':').trim().replace(/^"(.*)"$/, '$1');
    // Parse JSON arrays (e.g. prerequisiti: ["03-05", "01-05"])
    if (val.startsWith('[')) {
      try { meta[key.trim()] = JSON.parse(val.replace(/'/g, '"')); return; } catch(e) {}
    }
    meta[key.trim()] = val;
  });
  return { meta, body: match[2] };
}

function renderLesson(chapter, lesson, meta, body, chapterId, lessonId) {
  const area = $('content-area');
  if (!area) return;

  // Find prev/next
  const allLessons = [];
  state.manifest.roadmap.forEach(ch => ch.lezioni.forEach(l => allLessons.push({ chId: ch.id, l })));
  const idx = allLessons.findIndex(x => x.chId === chapterId && x.l.id === lessonId);

  const prev = idx > 0 ? allLessons[idx - 1] : null;
  const next = idx < allLessons.length - 1 ? allLessons[idx + 1] : null;

  const html = typeof marked !== 'undefined' ? marked.parse(body) : `<pre>${escHtml(body)}</pre>`;

  const totalLessons = allLessons.length;
  const lessonNum = idx + 1;

  // Resolve prerequisiti to clickable links
  let prereqHtml = '';
  if (Array.isArray(meta.prerequisiti) && meta.prerequisiti.length) {
    const prereqLinks = meta.prerequisiti.map(preId => {
      const found = allLessons.find(x => x.l.id.startsWith(preId));
      if (!found) return null;
      return `<a class="meta-tag prereq" onclick="openLesson('${found.chId}','${found.l.id}')" title="Vai al prerequisito">⤴ ${found.l.titolo}</a>`;
    }).filter(Boolean).join('');
    if (prereqLinks) prereqHtml = `<div class="meta-prereqs"><span class="prereq-label">Prerequisiti:</span>${prereqLinks}</div>`;
  }

  area.innerHTML = `
    <div class="content-inner" id="content-inner">
      <div class="lesson-meta">
        <span class="meta-tag chapter">CAP. ${String(chapter.numero).padStart(2,'0')} — ${chapter.titolo}</span>
        ${meta.difficolta ? `<span class="meta-tag difficulty">▲ ${meta.difficolta}</span>` : ''}
        <span class="meta-tag progress">LEZIONE ${lessonNum} DI ${totalLessons}</span>
      </div>
      ${prereqHtml}
      <div class="md-content">${html}</div>
      <div class="lesson-nav">
        ${prev ? `<a class="nav-btn" onclick="openLesson('${prev.chId}','${prev.l.id}')">
          <span>←</span>
          <div><div class="nav-btn-label">PRECEDENTE</div>${prev.l.titolo}</div>
        </a>` : '<div></div>'}
        ${next ? `<a class="nav-btn" onclick="openLesson('${next.chId}','${next.l.id}')">
          <div><div class="nav-btn-label">SUCCESSIVA</div>${next.l.titolo}</div>
          <span>→</span>
        </a>` : '<div></div>'}
      </div>
    </div>
  `;
  area.scrollTop = 0;
}

// ── Roadmap ───────────────────────────────────────────────────
function showRoadmap() {
  state.current = { chapterId: null, lessonId: null };
  history.pushState({}, '', '#roadmap');

  $$('.lesson-link').forEach(el => el.classList.remove('active'));
  $$('.chapter-header').forEach(el => el.classList.remove('active'));
  $('roadmap-btn')?.classList.add('active');

  const bc = $('breadcrumb');
  if (bc) bc.innerHTML = `<span>Roadmap</span>`;

  let content = '';
  if (typeof ROADMAP_CONTENT !== 'undefined') {
    const { body } = parseFrontmatter(ROADMAP_CONTENT);
    content = typeof marked !== 'undefined' ? marked.parse(body) : `<pre>${escHtml(body)}</pre>`;
  }

  const area = $('content-area');
  area.innerHTML = `
    <div class="content-inner">
      <div class="roadmap-content">${content}</div>
    </div>
  `;
  area.scrollTop = 0;
}

// ── Welcome ───────────────────────────────────────────────────
function showWelcome() {
  const area = $('content-area');
  if (!area) return;
  const m = state.manifest;
  area.innerHTML = `
    <div class="welcome-screen">
      <div class="welcome-logo">⬡</div>
      <div class="welcome-title">${m.corso}</div>
      <p class="welcome-sub">${m.sottotitolo}</p>
      <div style="margin-bottom:2rem">
        <div class="terminal-line">$ corso --init<span>_</span></div>
        <div class="terminal-line" style="color:var(--text-dim)">  ${m.roadmap.length} capitoli · ${m.totale_lezioni} lezioni caricate</div>
        <div class="terminal-line" style="color:var(--text-dim)">  livello: principianti → avanzato</div>
      </div>
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;justify-content:center">
        <button class="btn btn-primary" onclick="openLesson('${m.roadmap[0].id}','${m.roadmap[0].lezioni[0].id}')">
          ⚡ Setup Ambiente
        </button>
        <button class="btn btn-outline" onclick="openLesson('${m.roadmap[1]?.id || m.roadmap[0].id}','${m.roadmap[1]?.lezioni[0].id || m.roadmap[0].lezioni[0].id}')">
          ▶ Inizia dal Cap. 1
        </button>
        <button class="btn btn-outline" onclick="showRoadmap()">
          🗺 Vedi Roadmap
        </button>
      </div>
    </div>
  `;
}


// ── Mobile sidebar ────────────────────────────────────────────
function setupMobileToggle() {
  const toggle = $('sidebar-toggle');
  const sidebar = $('sidebar');
  const overlay = $('sidebar-overlay');
  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay?.classList.toggle('show');
  });
  overlay?.addEventListener('click', closeMobileSidebar);
}

function closeMobileSidebar() {
  $('sidebar')?.classList.remove('open');
  $('sidebar-overlay')?.classList.remove('show');
}

// ── Error ─────────────────────────────────────────────────────
function showError(msg) {
  const area = $('content-area');
  if (area) area.innerHTML = `
    <div class="welcome-screen">
      <div style="color:var(--pink);font-size:3rem;margin-bottom:1rem">⚠</div>
      <div class="welcome-title" style="color:var(--pink)">Errore</div>
      <p class="welcome-sub">${msg}</p>
      <p style="font-family:'Share Tech Mono',monospace;font-size:.8rem;color:var(--text-dim)">
        Assicurati di aprire il sito tramite un server locale (es. <code>python -m http.server</code>)
      </p>
    </div>
  `;
}

// ── Helpers ───────────────────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Routing ───────────────────────────────────────────────────
function routeFromHash(hash) {
  if (hash === 'roadmap') { showRoadmap(); return; }
  if (hash) {
    const [chId, lesId] = hash.split('/');
    if (chId && lesId) { openLesson(chId, lesId, false); return; }
    if (chId) { openFirstLessonOfChapter(chId); return; }  // hash = solo capitolo
  }
  showWelcome();
}

// Apre la prima lezione di un capitolo (usato dalle card della landing,
// che linkano a #<chapterId> senza specificare una lezione)
function openFirstLessonOfChapter(chapterId) {
  const chapter = state.manifest?.roadmap.find(c => c.id === chapterId);
  if (chapter && chapter.lezioni.length) {
    openLesson(chapterId, chapter.lezioni[0].id, false);
  } else {
    showWelcome();
  }
}

// Handle browser back/forward
window.addEventListener('popstate', () => routeFromHash(location.hash.slice(1)));
