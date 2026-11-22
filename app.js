'use strict';

/* =====================================================================
   Friendbook v2 – een vriendenboekje dat er ook echt uitziet als een boekje.
   Elke vriend vult drie pagina's in. Bekijken en invullen gebruiken dezelfde
   pagina's: bij invullen zijn de schrijflijntjes invulvelden.
   ===================================================================== */

const STORAGE_KEY = 'friendbook.v1'; // zelfde sleutel als versie 1, zodat oude pagina's blijven bestaan
const OWNER_KEY = 'friendbook.owner';
const DEFAULT_COLOR = '#ff6f59';
const PAGES_PER_FRIEND = 3;
const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli',
  'augustus', 'september', 'oktober', 'november', 'december'];

// Alle tekstvragen (de aankruislijst 'samen' staat hier los van).
const TEXT_KEYS = ['naam', 'bijnaam', 'kennenvan', 'verjaardag', 'woonplaats', 'kleur',
  'eten', 'muziek', 'film', 'dier', 'vakantie', 'hobbys', 'goedin', 'hekel', 'later',
  'herinnering', 'wens', 'boodschap', 'liefs'];

const SAMEN = ['Slap lachen', 'Urenlang kletsen', 'Op avontuur gaan',
  'Lekker eten', 'Tot laat dansen', 'Niksen op de bank'];

/* ---------- Opslag ---------- */

let memoryFallback = [];

function loadFriends() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return memoryFallback;
  }
}

function saveFriends(list) {
  memoryFallback = list;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    alert('Opslaan is niet gelukt. Mogelijk is de opslag vol: probeer een kleinere foto of verwijder een pagina.');
    return false;
  }
}

function sortedFriends() {
  return loadFriends().sort((a, b) => (a.answers.naam || '').localeCompare(b.answers.naam || '', 'nl'));
}

function getOwner() {
  try { return localStorage.getItem(OWNER_KEY) || ''; } catch (e) { return ''; }
}

function setOwner(name) {
  try { localStorage.setItem(OWNER_KEY, name); } catch (e) { /* niet erg */ }
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ---------- Hulpjes ---------- */

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function safeColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : DEFAULT_COLOR;
}

function parseDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
}

function formatDate(value) {
  const p = parseDate(value);
  return p ? `${p.d} ${MONTHS[p.m - 1]} ${p.y}` : '';
}

function isoDate(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Aantal dagen tot de volgende verjaardag, en de leeftijd die iemand dan wordt.
function birthdayInfo(value, today = new Date()) {
  const p = parseDate(value);
  if (!p) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let next = new Date(start.getFullYear(), p.m - 1, p.d);
  if (next < start) next = new Date(start.getFullYear() + 1, p.m - 1, p.d);
  return { days: Math.round((next - start) / 86400000), turns: next.getFullYear() - p.y };
}

function daysLabel(days) {
  if (days === 0) return 'vandaag jarig!';
  if (days === 1) return 'morgen jarig';
  return `over ${days} dagen jarig`;
}

// Verkleint een foto zodat hij weinig opslag kost.
function resizeImage(file, max = 480) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Geen geldige afbeelding')); };
    img.src = url;
  });
}

/* ---------- Tekeningetjes van de huisstijl ---------- */

const HEART_PATH = 'M12 20.5C5.5 15.6 3 12.4 3 8.9 3 6.2 5.1 4.2 7.6 4.2c1.8 0 3.4 1 4.4 2.6 1-1.6 2.6-2.6 4.4-2.6 2.5 0 4.6 2 4.6 4.7 0 3.5-2.5 6.7-9 11.6z';

const HEART = `<svg class="heart" viewBox="0 0 24 24" aria-hidden="true"><path class="heart-fill" d="${HEART_PATH}" transform="translate(2.2 1.6)"/><path class="heart-line" d="${HEART_PATH}"/></svg>`;

const SPARKLE_PATH = 'M12 1.5c.9 5.6 3 7.7 8.6 8.6-5.6.9-7.7 3-8.6 8.6-.9-5.6-3-7.7-8.6-8.6 5.6-.9 7.7-3 8.6-8.6z';

// Confetti voor in de hoeken van een pagina.
const CONFETTI = `<svg viewBox="0 0 130 130" aria-hidden="true">
  <path d="${SPARKLE_PATH}" transform="translate(14 12) scale(1.5)" fill="var(--sun)"/>
  <path d="${SPARKLE_PATH}" transform="translate(84 6) scale(.8)" fill="var(--fav)"/>
  <path d="M8 74c8-10 14 8 22-2s14 8 22-2" fill="none" stroke="var(--mint)" stroke-width="4" stroke-linecap="round"/>
  <circle cx="62" cy="36" r="6" fill="var(--fav)"/>
  <circle cx="112" cy="46" r="4" fill="var(--mint)"/>
  <circle cx="26" cy="104" r="4.5" fill="var(--sun)"/>
  <rect x="68" y="62" width="16" height="7" rx="3.5" transform="rotate(-28 76 65)" fill="var(--ink)"/>
  <rect x="42" y="52" width="12" height="6" rx="3" transform="rotate(40 48 55)" fill="var(--sun)"/>
  <path d="M100 18l8 8m0-8l-8 8" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>
</svg>`;

const SQUIGGLE = `<svg class="squiggle" viewBox="0 0 160 12" preserveAspectRatio="none" aria-hidden="true">
  <path d="M3 7c11-8 15 6 26 0s15-6 26 0 15 6 26 0 15-6 26 0 15 6 26 0 15-6 24-1" fill="none" stroke="var(--fav)" stroke-width="4" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;

// Tekstballon: gekleurd vlak dat een stukje verschoven is ten opzichte van de inktlijn.
const BUBBLE_D = 'M14 6H184Q194 6 194 16V104Q194 114 184 114H76L44 144 50 114H16Q6 114 6 104V16Q6 6 14 6Z';
const BUBBLE = `<svg class="shape-svg" viewBox="0 0 206 152" preserveAspectRatio="none" aria-hidden="true">
  <path d="${BUBBLE_D}" transform="translate(6 5)" fill="var(--fav)" opacity=".28"/>
  <path d="${BUBBLE_D}" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;

// Geschulpte wolk, opgebouwd uit boogjes rond een ovaal.
function scallopPath(w, h, bumps) {
  const cx = w / 2, cy = h / 2, rx = w / 2 - 14, ry = h / 2 - 14;
  const pts = [];
  for (let i = 0; i < bumps; i++) {
    const t = (i / bumps) * Math.PI * 2 - Math.PI / 2;
    pts.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i <= bumps; i++) {
    const [x, y] = pts[i % bumps];
    const [px, py] = pts[i - 1];
    const r = Math.hypot(x - px, y - py) / 2 * 1.08;
    d += `A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + 'Z';
}
const CLOUD_D = scallopPath(220, 150, 12);
const CLOUD = `<svg class="shape-svg" viewBox="0 0 228 156" preserveAspectRatio="none" aria-hidden="true">
  <path d="${CLOUD_D}" transform="translate(7 6)" fill="var(--sun)" opacity=".55"/>
  <path d="${CLOUD_D}" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;

/* ---------- Bouwstenen van een boekjespagina ---------- */

// Eén schrijflijn achter een zin: "Mijn naam is: ______"
function fLine(a, edit, key, label, opts = {}) {
  const v = a[key] || '';
  if (edit) {
    return `<label class="row"><span class="lbl">${esc(label)}</span>
      <input class="ink" name="${key}" type="${opts.type || 'text'}" value="${esc(v)}"
        ${opts.type === 'date' ? '' : 'autocomplete="off"'} aria-label="${esc(label)}"></label>`;
  }
  let shown = esc(opts.type === 'date' ? formatDate(v) : v);
  if (opts.type === 'date' && v) {
    const b = birthdayInfo(v);
    if (b) shown += `<small class="note">${esc(daysLabel(b.days))} · wordt ${b.turns}</small>`;
  }
  return `<div class="row"><span class="lbl">${esc(label)}</span><span class="ink line">${shown}</span></div>`;
}

// Een paar schrijflijntjes onder elkaar.
function fLines(a, edit, key, label, rows = 3) {
  const v = a[key] || '';
  const body = edit
    ? `<textarea class="ink lined grow" name="${key}" rows="${rows}" aria-label="${esc(label)}">${esc(v)}</textarea>`
    : `<div class="ink lined" style="min-height:${rows * 34}px">${esc(v)}</div>`;
  return `<div class="block"><span class="lbl">${esc(label)}</span>${body}</div>`;
}

// Tekst in een getekende vorm (tekstballon of wolk).
function fShape(a, edit, key, label, svg, cls, rows = 2) {
  const v = a[key] || '';
  const body = edit
    ? `<textarea class="ink grow" name="${key}" rows="${rows}" aria-label="${esc(label)}" placeholder="…">${esc(v)}</textarea>`
    : `<div class="ink">${esc(v)}</div>`;
  return `<div class="shape ${cls}">${svg}<div class="shape-in"><span class="lbl">${esc(label)}</span>${body}</div></div>`;
}

function fChecks(a, edit) {
  const chosen = Array.isArray(a.samen) ? a.samen : [];
  const items = SAMEN.map(text => {
    const on = chosen.includes(text);
    return edit
      ? `<label class="check"><input type="checkbox" name="samen" value="${esc(text)}" ${on ? 'checked' : ''}>${HEART}<span>${esc(text)}</span></label>`
      : `<div class="check ${on ? 'on' : ''}">${HEART}<span>${esc(text)}</span></div>`;
  }).join('');
  return `<div class="checks"><span class="lbl">Met mij kun je altijd:</span>${items}</div>`;
}

function fPhoto(photo, edit) {
  const inner = photo ? `<img src="${esc(photo)}" alt="">` : `<span class="photo-empty">${edit ? 'tik voor<br>een foto' : ''}</span>`;
  const frame = `<span class="tape"></span><span class="photo" id="photo-preview">${inner}</span><span class="caption">Dit ben ik :)</span>`;
  if (!edit) return `<div class="polaroid">${frame}</div>`;
  return `<div class="photo-wrap"><label class="polaroid" for="photo-input">${frame}</label>
    <input id="photo-input" type="file" accept="image/*" hidden>
    <button type="button" class="link" id="photo-remove" ${photo ? '' : 'hidden'}>foto weghalen</button></div>`;
}

function fColor(a, edit) {
  const color = safeColor(a.kleur);
  const blob = edit
    ? `<input class="blob" name="kleur" type="color" value="${color}" aria-label="Mijn lievelingskleur">`
    : `<span class="blob" style="background:${color}"></span>`;
  return `<${edit ? 'label' : 'div'} class="row color-row"><span class="lbl">Mijn lievelingskleur:</span>${blob}</${edit ? 'label' : 'div'}>`;
}

function pageShell(nr, title, body, opts = {}) {
  const next = opts.last
    ? ''
    : `<button type="button" class="turn" data-goto="${opts.index + 1}">blader verder →</button>`;
  return `<article class="page ${opts.cls || ''}" data-page="${opts.index}">
    <span class="confetti tl">${CONFETTI}</span>${opts.last ? `<span class="confetti br">${CONFETTI}</span>` : ''}
    <header class="page-title"><h2>${esc(title)}</h2>${SQUIGGLE}</header>
    ${body}
    <footer class="page-foot"><span class="page-nr">– ${nr} –</span>${next}</footer>
  </article>`;
}

// De drie pagina's van één vriend.
function friendPages(friend, edit, firstNr) {
  const a = friend.answers;
  const when = parseDate(friend.datum) || parseDate(isoDate(friend.created ? new Date(friend.created) : new Date()));
  const stamp = `${when.d} ${MONTHS[when.m - 1].slice(0, 3)} ${when.y}`;

  const p1 = `
    <div class="stamp"><small>ingevuld op</small>${esc(stamp)}</div>
    ${fLine(a, edit, 'naam', 'Mijn naam is:')}
    ${fLine(a, edit, 'bijnaam', 'Maar iedereen noemt mij:')}
    <div class="duo">
      ${fShape(a, edit, 'kennenvan', 'Ik ken jou van:', BUBBLE, 'bubble', 3)}
      ${fPhoto(friend.photo, edit)}
    </div>
    ${fLine(a, edit, 'verjaardag', 'Ik ben jarig op:', { type: 'date' })}
    ${fLine(a, edit, 'woonplaats', 'Ik woon in:')}
    ${fLine(a, edit, 'goedin', 'Hier ben ik goed in:')}
    ${fLine(a, edit, 'hekel', 'Hier heb ik een hekel aan:')}`;

  const p2 = `
    ${fLine(a, edit, 'eten', 'Ik eet het liefst:')}
    ${fLine(a, edit, 'muziek', 'Ik luister graag naar:')}
    ${fLine(a, edit, 'film', 'Ik kijk het liefst:')}
    ${fLine(a, edit, 'dier', 'Mijn lievelingsdier:')}
    ${fLine(a, edit, 'vakantie', 'Mijn mooiste vakantie:')}
    ${fLine(a, edit, 'hobbys', 'In mijn vrije tijd:')}
    ${fColor(a, edit)}
    ${fChecks(a, edit)}
    ${fShape(a, edit, 'later', 'Later word ik…', CLOUD, 'cloud', 2)}`;

  const p3 = `
    ${fLines(a, edit, 'herinnering', 'Onze mooiste herinnering:', 4)}
    ${fShape(a, edit, 'wens', 'Mijn wens voor jou', CLOUD, 'cloud wide', 3)}
    ${fLines(a, edit, 'boodschap', 'En dan nog even dit…', 3)}
    <div class="sign">${fLine(a, edit, 'liefs', 'liefs,')}</div>`;

  return pageShell(firstNr, 'Dit ben ik', p1, { index: 0, cls: 'p1' })
    + pageShell(firstNr + 1, 'Mijn favorieten', p2, { index: 1 })
    + pageShell(firstNr + 2, 'Voor jou', p3, { index: 2, last: true });
}

const DOTS = `<div class="dots" id="dots" aria-hidden="true">${'<i></i>'.repeat(PAGES_PER_FRIEND)}</div>`;

/* ---------- Schermen ---------- */

const app = document.getElementById('app');
let draftPhoto = null; // foto op de pagina die nu wordt ingevuld

function viewCover() {
  const n = loadFriends().length;
  return `
    <main class="cover-wrap">
      <div class="cover">
        <span class="band"></span>
        <span class="cover-confetti a">${CONFETTI}</span><span class="cover-confetti b">${CONFETTI}</span>
        <div class="label">
          <h1>Friendbook</h1>
          <p>mijn vriendenboekje</p>
        </div>
        <label class="owner"><span>Dit boekje is van</span>
          <input id="owner" class="ink" value="${esc(getOwner())}" placeholder="jouw naam" autocomplete="off" autocapitalize="words">
        </label>
        <a class="btn" href="#/inhoud">Sla open →</a>
        <p class="cover-count">${n ? `${n} ${n === 1 ? 'vriend' : 'vrienden'} in dit boekje` : 'nog helemaal leeg'}</p>
      </div>
    </main>`;
}

function viewContents() {
  const friends = sortedFriends();
  const upcoming = friends.map(f => ({ f, b: birthdayInfo(f.answers.verjaardag) }))
    .filter(x => x.b).sort((x, y) => x.b.days - y.b.days)[0];

  const sticky = upcoming ? `
    <a class="sticky" href="#/vriend/${esc(upcoming.f.id)}"><span class="tape"></span>
      <strong>${esc(upcoming.f.answers.naam)}</strong> is ${esc(daysLabel(upcoming.b.days))}
      <small>en wordt ${upcoming.b.turns} jaar</small></a>` : '';

  const rows = friends.map((f, i) => `
    <a class="toc" href="#/vriend/${esc(f.id)}" data-name="${esc((f.answers.naam + ' ' + (f.answers.bijnaam || '')).toLowerCase())}">
      <span class="toc-dot" style="background:${safeColor(f.answers.kleur)}"></span>
      <span class="toc-name">${esc(f.answers.naam)}</span><span class="leader"></span>
      <span class="toc-nr">${i * PAGES_PER_FRIEND + 1}</span></a>`).join('');

  const body = friends.length ? `
      ${sticky}
      <label class="row search-row"><span class="lbl">Zoek:</span>
        <input class="ink" id="search" type="search" autocomplete="off" aria-label="Zoek een vriend"></label>
      <nav class="toc-list" id="toc">${rows}</nav>
      <p class="empty-note" id="no-results" hidden>Niemand gevonden met die naam.</p>`
    : `<p class="empty-note">Dit boekje is nog leeg.<br>Geef je telefoon aan een vriend of vriendin en laat de eerste pagina's invullen!</p>`;

  return `
    <header class="topbar">
      <a class="nav-btn" href="#/" aria-label="Naar de kaft">‹ kaft</a>
      <a class="nav-btn" href="#/meer">meer</a>
    </header>
    <main class="single">
      <article class="page">
        <span class="confetti tl">${CONFETTI}</span><span class="confetti br">${CONFETTI}</span>
        <header class="page-title"><h2>Inhoud</h2>${SQUIGGLE}</header>
        ${body}
        <a class="btn" href="#/nieuw">+ Nieuwe vriend</a>
      </article>
    </main>`;
}

function viewFriend(friend) {
  const friends = sortedFriends();
  const idx = friends.findIndex(f => f.id === friend.id);
  const prev = friends[idx - 1], next = friends[idx + 1];
  return `
    <header class="topbar">
      <a class="nav-btn" href="#/inhoud" aria-label="Terug naar de inhoud">‹ inhoud</a>
      <a class="nav-btn" href="#/bewerk/${esc(friend.id)}">✎ bewerk</a>
    </header>
    <main>
      <div class="spread" id="spread" style="--fav:${safeColor(friend.answers.kleur)}">
        ${friendPages(friend, false, idx * PAGES_PER_FRIEND + 1)}
      </div>
      <div class="pager">
        ${prev ? `<a class="nav-btn" href="#/vriend/${esc(prev.id)}" aria-label="Vorige vriend">‹ ${esc(prev.answers.naam.split(' ')[0])}</a>` : '<span class="nav-btn ghost"></span>'}
        ${DOTS}
        ${next ? `<a class="nav-btn" href="#/vriend/${esc(next.id)}" aria-label="Volgende vriend">${esc(next.answers.naam.split(' ')[0])} ›</a>` : '<span class="nav-btn ghost"></span>'}
      </div>
    </main>`;
}

function viewForm(friend) {
  const isNew = !friend;
  const count = loadFriends().length;
  const f = friend || { id: '', answers: {}, photo: null, datum: isoDate(new Date()) };
  draftPhoto = f.photo || null;
  const idx = isNew ? count : sortedFriends().findIndex(x => x.id === f.id);
  return `
    <header class="topbar">
      <a class="nav-btn" href="${isNew ? '#/inhoud' : `#/vriend/${esc(f.id)}`}">‹ annuleer</a>
      ${isNew ? '<span class="topbar-note">vul maar in!</span>' : `<button class="nav-btn danger" id="delete-friend" data-id="${esc(f.id)}">verwijder</button>`}
    </header>
    <main>
      <form id="friend-form" data-id="${esc(f.id)}" novalidate>
        <div class="spread editing" id="spread" style="--fav:${safeColor(f.answers.kleur)}">
          ${friendPages(f, true, idx * PAGES_PER_FRIEND + 1)}
        </div>
        <div class="savebar">
          ${DOTS}
          <p class="error" id="form-error" hidden>Vul eerst je naam in.</p>
          <button class="btn" type="submit">${isNew ? 'Klaar! Opslaan in het boekje' : 'Wijzigingen opslaan'}</button>
        </div>
      </form>
    </main>`;
}

function viewMore() {
  const n = loadFriends().length;
  return `
    <header class="topbar">
      <a class="nav-btn" href="#/inhoud">‹ inhoud</a><span></span>
    </header>
    <main class="single">
      <article class="page">
        <span class="confetti tl">${CONFETTI}</span>
        <header class="page-title"><h2>Goed om te weten</h2>${SQUIGGLE}</header>
        <h3 class="lbl">Reservekopie</h3>
        <p class="text">Je boekje wordt alleen op dit toestel bewaard. Maak af en toe een reservekopie,
          zodat je niets kwijtraakt als je van telefoon wisselt.</p>
        <button class="btn" id="export" ${n ? '' : 'disabled'}>Reservekopie opslaan (${n})</button>
        <label class="btn alt" for="import-input">Reservekopie terugzetten</label>
        <input id="import-input" type="file" accept="application/json,.json" hidden>
        <p class="text status" id="more-status" role="status"></p>
        <h3 class="lbl">Op je beginscherm</h3>
        <p class="text">Open deze pagina in Safari, tik op het deel-icoon en kies
          <strong>Zet op beginscherm</strong>. Friendbook werkt daarna als een gewone app, ook zonder internet.</p>
      </article>
    </main>`;
}

/* ---------- Navigatie ---------- */

function render() {
  const [, route, id] = location.hash.split('/');
  const friend = id ? loadFriends().find(f => f.id === id) : null;
  let html;
  if (route === 'inhoud') html = viewContents();
  else if (route === 'nieuw') html = viewForm(null);
  else if (route === 'meer') html = viewMore();
  else if (route === 'vriend' && friend) html = viewFriend(friend);
  else if (route === 'bewerk' && friend) html = viewForm(friend);
  else if (route === 'vriend' || route === 'bewerk') html = viewContents();
  else html = viewCover();
  app.innerHTML = html;
  window.scrollTo(0, 0);
  app.querySelectorAll('textarea.grow').forEach(autoGrow);
  const spread = document.getElementById('spread');
  if (spread) {
    spread.addEventListener('scroll', updateDots, { passive: true });
    updateDots();
  }
}

function pagesOf(spread) {
  return Array.from(spread.querySelectorAll('.page'));
}

// Welke pagina ligt nu open? (voor de bolletjes onderaan)
function updateDots() {
  const spread = document.getElementById('spread');
  if (!spread) return;
  const pages = pagesOf(spread);
  const mid = spread.scrollLeft + spread.clientWidth / 2;
  let current = 0;
  pages.forEach((p, i) => { if (p.offsetLeft <= mid) current = i; });
  const fitsAll = spread.scrollWidth <= spread.clientWidth + 2;
  spread.classList.toggle('fits', fitsAll);
  document.querySelectorAll('.dots').forEach(dots => {
    dots.hidden = fitsAll;
    Array.from(dots.children).forEach((dot, i) => dot.classList.toggle('on', i === current));
  });
}

function gotoPage(index) {
  const spread = document.getElementById('spread');
  const page = spread && pagesOf(spread)[index];
  if (!page) return;
  spread.scrollTo({ left: page.offsetLeft - (spread.clientWidth - page.offsetWidth) / 2, behavior: 'smooth' });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function autoGrow(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

window.addEventListener('hashchange', render);
window.addEventListener('resize', updateDots);

/* ---------- Acties ---------- */

app.addEventListener('submit', e => {
  if (e.target.id !== 'friend-form') return;
  e.preventDefault();
  const form = e.target;
  const answers = {};
  TEXT_KEYS.forEach(key => {
    const v = (form.elements[key].value || '').trim();
    if (v) answers[key] = v;
  });
  const samen = Array.from(form.querySelectorAll('input[name="samen"]:checked')).map(i => i.value);
  if (samen.length) answers.samen = samen;

  if (!answers.naam) {
    document.getElementById('form-error').hidden = false;
    gotoPage(0);
    form.elements.naam.focus({ preventScroll: true });
    return;
  }
  const list = loadFriends();
  let id = form.dataset.id;
  const existing = list.find(f => f.id === id);
  if (existing) {
    existing.answers = answers;
    existing.photo = draftPhoto;
    existing.updated = Date.now();
  } else {
    id = newId();
    list.push({ id, created: Date.now(), datum: isoDate(new Date()), photo: draftPhoto, answers });
  }
  if (saveFriends(list)) location.hash = `#/vriend/${id}`;
});

app.addEventListener('change', async e => {
  const t = e.target;
  if (t.id === 'photo-input' && t.files[0]) {
    try {
      draftPhoto = await resizeImage(t.files[0]);
      document.getElementById('photo-preview').innerHTML = `<img src="${esc(draftPhoto)}" alt="">`;
      document.getElementById('photo-remove').hidden = false;
    } catch (err) {
      alert('Deze foto kon niet worden geladen.');
    }
  }
  if (t.id === 'import-input' && t.files[0]) {
    const status = document.getElementById('more-status');
    try {
      const data = JSON.parse(await t.files[0].text());
      const incoming = (Array.isArray(data) ? data : data.friends || [])
        .filter(f => f && f.id && f.answers && f.answers.naam);
      if (!incoming.length) throw new Error('leeg');
      const list = loadFriends();
      let added = 0;
      incoming.forEach(f => {
        const clean = { id: String(f.id), created: f.created || Date.now(), answers: f.answers,
          datum: parseDate(f.datum) ? f.datum : undefined,
          photo: typeof f.photo === 'string' && f.photo.startsWith('data:image/') ? f.photo : null };
        const i = list.findIndex(x => x.id === clean.id);
        if (i >= 0) list[i] = clean; else { list.push(clean); added++; }
      });
      if (saveFriends(list)) {
        if (data.owner && !getOwner()) setOwner(String(data.owner));
        status.textContent = `Gelukt: ${added} nieuwe en ${incoming.length - added} bijgewerkte vrienden.`;
      }
    } catch (err) {
      status.textContent = 'Dit bestand is geen geldige Friendbook-reservekopie.';
    }
    t.value = '';
  }
});

app.addEventListener('click', e => {
  const t = e.target.closest('button, a') || e.target;
  if (t.dataset && t.dataset.goto) gotoPage(+t.dataset.goto);
  if (t.id === 'photo-remove') {
    draftPhoto = null;
    document.getElementById('photo-preview').innerHTML = '<span class="photo-empty">tik voor<br>een foto</span>';
    t.hidden = true;
  }
  if (t.id === 'delete-friend') {
    const friend = loadFriends().find(f => f.id === t.dataset.id);
    if (friend && confirm(`De pagina's van ${friend.answers.naam} uit het boekje scheuren? Dit kan niet ongedaan worden gemaakt.`)) {
      saveFriends(loadFriends().filter(f => f.id !== friend.id));
      location.hash = '#/inhoud';
    }
  }
  if (t.id === 'export') {
    const data = { app: 'friendbook', version: 2, owner: getOwner(), friends: loadFriends() };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = `friendbook-${isoDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
});

app.addEventListener('input', e => {
  const t = e.target;
  if (t.matches('textarea.grow')) autoGrow(t);
  if (t.id === 'owner') setOwner(t.value.trim());
  if (t.name === 'naam' && t.value.trim()) document.getElementById('form-error').hidden = true;
  if (t.name === 'kleur') document.getElementById('spread').style.setProperty('--fav', safeColor(t.value));
  if (t.id === 'search') {
    const q = t.value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll('#toc .toc').forEach(row => {
      const show = row.dataset.name.includes(q);
      row.hidden = !show;
      if (show) visible++;
    });
    document.getElementById('no-results').hidden = visible > 0;
  }
});

render();
// De hoogte van tekstvakken klopt pas als de handschrift-lettertypen geladen zijn.
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => { app.querySelectorAll('textarea.grow').forEach(autoGrow); updateDots(); });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
