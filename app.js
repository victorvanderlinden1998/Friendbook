'use strict';

/* =====================================================================
   Friendbook v3 (proefversie)
   - Home: wat je vrienden delen, plus een compliment van de dag
   - Delen: zelf iets delen of je vrienden een vraag stellen
   - Mijn boek: je vriendenboek als echt boek waar je doorheen bladert

   Alles wordt in deze proefversie op het toestel zelf bewaard. De functies
   onder "Opslag" zijn de enige plek die weet wáár de gegevens staan, zodat
   daar later een server achter gezet kan worden.
   ===================================================================== */

const STORAGE_KEY = 'friendbook.v1'; // zelfde sleutel als eerdere versies, zodat oude pagina's blijven bestaan
const OWNER_KEY = 'friendbook.owner';
const SOCIAL_KEY = 'friendbook.social';
const ME = 'me';
const DEFAULT_COLOR = '#ff6f59';
const PAGES_PER_FRIEND = 3;
const FEED_MAX = 20;
const DAY_MS = 86400000;
const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli',
  'augustus', 'september', 'oktober', 'november', 'december'];

// Alle tekstvragen (de aankruislijst 'samen' staat hier los van).
const TEXT_KEYS = ['naam', 'bijnaam', 'kennenvan', 'verjaardag', 'woonplaats', 'kleur',
  'eten', 'muziek', 'film', 'dier', 'vakantie', 'hobbys', 'goedin', 'hekel', 'later',
  'herinnering', 'wens', 'boodschap', 'liefs'];

const SAMEN = ['Slap lachen', 'Urenlang kletsen', 'Op avontuur gaan',
  'Lekker eten', 'Tot laat dansen', 'Niksen op de bank'];

const QUESTION_IDEAS = ['Wat moeten we echt nog eens samen doen?', 'Welk liedje doet je aan mij denken?',
  'Wat is jouw beste tip voor een slechte dag?', 'Wat is onze mooiste herinnering van dit jaar?'];

// De app vraagt elke dag om één compliment; {naam} wordt de voornaam van een vriend.
const COMPLIMENT_PROMPTS = ['Wat waardeer je aan {naam}?', 'Waar is {naam} volgens jou heel goed in?',
  'Welke herinnering met {naam} maakt je blij?', 'Waarom ben je blij dat {naam} in je boekje staat?',
  'Wat heeft {naam} laatst voor je gedaan?', 'Wat zou je {naam} willen toewensen?'];

const COMPLIMENT_STARTERS = ['Ik vind het knap dat je ', 'Dankjewel dat je ', 'Ik word altijd vrolijk als jij ',
  'Wat ik zo leuk aan je vind: '];

/* ---------- Opslag ---------- */

let memoryFriends = [];
let memorySocial = null;

function loadFriends() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return memoryFriends;
  }
}

function saveFriends(list) {
  memoryFriends = list;
  return store(STORAGE_KEY, list);
}

// posts: wat er gedeeld is · questions: jouw vragen met de antwoorden · compliments: lieve briefjes
function loadSocial() {
  const arr = v => (Array.isArray(v) ? v : []);
  try {
    const s = memorySocial || JSON.parse(localStorage.getItem(SOCIAL_KEY) || '{}') || {};
    return { posts: arr(s.posts), questions: arr(s.questions), compliments: arr(s.compliments),
      promptSkip: Number(s.promptSkip) || 0, lastSent: String(s.lastSent || '') };
  } catch (e) {
    return { posts: [], questions: [], compliments: [], promptSkip: 0, lastSent: '' };
  }
}

function saveSocial(social) {
  const ok = store(SOCIAL_KEY, social);
  memorySocial = ok ? null : social;
  return ok;
}

function store(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    alert('Opslaan is niet gelukt. Mogelijk is de opslag vol: probeer een kleinere foto of haal iets weg.');
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

// Haalt alles weg wat van deze personen kwam of voor hen bedoeld was.
function removePeople(ids) {
  const gone = id => ids.includes(id);
  saveFriends(loadFriends().filter(f => !gone(f.id)));
  const s = loadSocial();
  s.posts = s.posts.filter(p => !gone(p.from));
  s.compliments = s.compliments.filter(c => !gone(c.from) && !gone(c.to));
  s.questions.forEach(q => { q.answers = (q.answers || []).filter(a => !gone(a.from)); });
  saveSocial(s);
}

function loadDemo() {
  const now = Date.now();
  const demo = window.FriendbookDemo;
  const friends = loadFriends();
  demo.friends(now).forEach(f => { if (!friends.some(x => x.id === f.id)) friends.push(f); });
  if (!saveFriends(friends)) return;
  const s = loadSocial();
  demo.posts(now).forEach(p => { if (!s.posts.some(x => x.id === p.id)) s.posts.push(p); });
  demo.compliments(now).forEach(c => { if (!s.compliments.some(x => x.id === c.id)) s.compliments.push(c); });
  saveSocial(s);
}

function removeDemo() {
  removePeople(loadFriends().filter(f => f.demo).map(f => f.id));
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

function safePhoto(value) {
  return typeof value === 'string' && value.startsWith('data:image/') ? value : null;
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

function dayNumber(date = new Date()) {
  return Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / DAY_MS);
}

// Aantal dagen tot de volgende verjaardag, en de leeftijd die iemand dan wordt.
function birthdayInfo(value, today = new Date()) {
  const p = parseDate(value);
  if (!p) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let next = new Date(start.getFullYear(), p.m - 1, p.d);
  if (next < start) next = new Date(start.getFullYear() + 1, p.m - 1, p.d);
  return { days: Math.round((next - start) / DAY_MS), turns: next.getFullYear() - p.y };
}

function daysLabel(days) {
  if (days === 0) return 'vandaag jarig!';
  if (days === 1) return 'morgen jarig';
  return `over ${days} dagen jarig`;
}

function ago(ts, now = Date.now()) {
  const min = Math.floor((now - ts) / 60000);
  if (min < 1) return 'zojuist';
  if (min < 60) return `${min} min geleden`;
  if (min < 24 * 60) return `${Math.floor(min / 60)} uur geleden`;
  const days = dayNumber(new Date(now)) - dayNumber(new Date(ts));
  if (days <= 1) return 'gisteren';
  if (days < 7) return `${days} dagen geleden`;
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || '';
}

function initials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

// Naam, foto en kleur van een vriend (of van jezelf).
function person(id, friends = loadFriends()) {
  if (id === ME) return { name: getOwner() || 'Ik', photo: null, color: '#232a4d' };
  const f = friends.find(x => x.id === id);
  return f ? { name: f.answers.naam, photo: safePhoto(f.photo), color: safeColor(f.answers.kleur) } : null;
}

function avatar(p, cls = '') {
  const inner = p.photo ? `<img src="${esc(p.photo)}" alt="">` : esc(initials(p.name));
  return `<span class="avatar ${cls}" style="--c:${p.color}">${inner}</span>`;
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

const ICONS = {
  home: '<path d="M4 11.5 12 4l8 7.5V20H14.5v-5h-5v5H4Z"/>',
  delen: '<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6l-5 4 1-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M12 8v6M9 11h6"/>',
  boek: '<path d="M6 3.5h11a2 2 0 0 1 2 2V20H7.5A2.5 2.5 0 0 1 5 17.5v-13a1 1 0 0 1 1-1Z"/><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H19M9 3.5V15"/>',
};
const icon = name => `<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

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
  return `<div class="checks ${edit ? 'editing' : ''}"><span class="lbl">Met mij kun je altijd:</span>${items}</div>`;
}

function fPhoto(photo, edit) {
  const src = safePhoto(photo);
  const inner = src ? `<img src="${esc(src)}" alt="">` : `<span class="photo-empty">${edit ? 'tik voor<br>een foto' : ''}</span>`;
  const frame = `<span class="tape"></span><span class="photo" id="${edit ? 'photo-preview' : ''}">${inner}</span><span class="caption">Dit ben ik :)</span>`;
  if (!edit) return `<div class="polaroid">${frame}</div>`;
  return `<div class="photo-wrap"><label class="polaroid" for="photo-input">${frame}</label>
    <input id="photo-input" type="file" accept="image/*" hidden>
    <button type="button" class="link" id="photo-remove" ${src ? '' : 'hidden'}>foto weghalen</button></div>`;
}

function fColor(a, edit) {
  const color = safeColor(a.kleur);
  const blob = edit
    ? `<input class="blob" name="kleur" type="color" value="${color}" aria-label="Mijn lievelingskleur">`
    : `<span class="blob" style="background:${color}"></span>`;
  return `<${edit ? 'label' : 'div'} class="row color-row"><span class="lbl">Mijn lievelingskleur:</span>${blob}</${edit ? 'label' : 'div'}>`;
}

// opts: nr (paginanummer), turn (index van de volgende pagina in het invulformulier), confetti, fav (accentkleur)
function pageShell(title, body, opts = {}) {
  const next = opts.turn != null
    ? `<button type="button" class="turn" data-goto="${opts.turn}">blader verder →</button>` : '';
  return `<article class="page ${opts.cls || ''}" ${opts.fav ? `style="--fav:${opts.fav}"` : ''}>
    <span class="confetti tl">${CONFETTI}</span>${opts.confetti ? `<span class="confetti br">${CONFETTI}</span>` : ''}
    <header class="page-title"><h2>${esc(title)}</h2>${SQUIGGLE}</header>
    ${body}
    <footer class="page-foot"><span class="page-nr">${opts.nr != null ? `– ${opts.nr} –` : ''}</span>${next}</footer>
  </article>`;
}

// De drie pagina's van één vriend, als lijst. `edit` maakt van de lijntjes invulvelden.
function friendPages(friend, edit, firstNr) {
  const a = friend.answers;
  const fav = edit ? null : safeColor(a.kleur);
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

  return [
    pageShell('Dit ben ik', p1, { nr: firstNr, cls: 'p1', fav, turn: edit ? 1 : null }),
    pageShell('Mijn favorieten', p2, { nr: firstNr + 1, fav, turn: edit ? 2 : null }),
    pageShell('Voor jou', p3, { nr: firstNr + 2, fav, confetti: true }),
  ];
}

/* ---------- Het boek: alle pagina's op volgorde ---------- */

function coverHtml(welcome) {
  const n = loadFriends().length;
  return `<div class="cover">
      <span class="band"></span>
      <span class="cover-confetti a">${CONFETTI}</span><span class="cover-confetti b">${CONFETTI}</span>
      <div class="label"><h1>Friendbook</h1><p>mijn vriendenboekje</p></div>
      <label class="owner"><span>Dit boekje is van</span>
        <input id="owner" class="ink" value="${esc(getOwner())}" placeholder="jouw naam" autocomplete="off" autocapitalize="words">
      </label>
      ${welcome ? '<a class="btn" href="#/home">Begin →</a>'
        : `<p class="cover-count">${n ? `${n} ${n === 1 ? 'vriend' : 'vrienden'} in dit boekje` : 'nog helemaal leeg'}<br>veeg om te bladeren →</p>`}
    </div>`;
}

// Geeft [{key, cls, friendId, html}] terug: kaft, inhoud, drie pagina's per vriend,
// één pagina per gestelde vraag en als laatste de lieve woorden.
function bookPages() {
  const friends = sortedFriends();
  const social = loadSocial();
  const questions = social.questions.slice().sort((a, b) => a.at - b.at);
  const received = social.compliments.filter(c => c.to === ME && person(c.from, friends)).sort((a, b) => b.at - a.at);

  let nr = 2;
  const friendNr = {}, questionNr = {};
  friends.forEach(f => { friendNr[f.id] = nr; nr += PAGES_PER_FRIEND; });
  questions.forEach(q => { questionNr[q.id] = nr; nr += 1; });
  const wordsNr = nr;

  const tocRow = (page, name, label, dot) => `
    <button type="button" class="toc" data-page="${page}" data-name="${esc(name.toLowerCase())}">
      ${dot}<span class="toc-name">${esc(label)}</span><span class="leader"></span><span class="toc-nr">${page}</span></button>`;

  const toc = `
    <label class="row search-row"><span class="lbl">Zoek:</span>
      <input class="ink" id="search" type="search" autocomplete="off" aria-label="Zoek een vriend"></label>
    <nav class="toc-list" id="toc">
      ${friends.map(f => tocRow(friendNr[f.id], `${f.answers.naam} ${f.answers.bijnaam || ''}`, f.answers.naam,
        `<span class="toc-dot" style="background:${safeColor(f.answers.kleur)}"></span>`)).join('')}
      ${questions.map(q => tocRow(questionNr[q.id], q.text, `Vraag: ${q.text}`, '<span class="toc-mark">?</span>')).join('')}
      ${tocRow(wordsNr, 'lieve woorden complimenten', 'Lieve woorden', '<span class="toc-mark">♥</span>')}
    </nav>
    <p class="empty-note" id="no-results" hidden>Niets gevonden.</p>
    ${friends.length ? '' : '<p class="empty-note">Dit boekje is nog leeg.<br>Laat een vriend of vriendin de eerste pagina’s invullen!</p>'}
    <a class="btn" href="#/nieuw">+ Nieuwe vriend</a>`;

  const pages = [
    { key: 'kaft', cls: 'is-cover', html: coverHtml(false) },
    { key: 'inhoud', html: pageShell('Inhoud', toc, { nr: 1, confetti: true }) },
  ];

  friends.forEach(f => friendPages(f, false, friendNr[f.id]).forEach((html, i) => {
    pages.push({ key: i === 0 ? `vriend/${f.id}` : null, friendId: f.id, html });
  }));

  questions.forEach(q => {
    const answers = (q.answers || []).filter(a => person(a.from, friends));
    const body = `
      <div class="shape bubble asked">${BUBBLE}<div class="shape-in"><span class="lbl">Ik vroeg:</span><div class="ink">${esc(q.text)}</div></div></div>
      ${answers.map(a => { const p = person(a.from, friends); return `
        <div class="answer">${avatar(p)}<div><span class="lbl">${esc(firstName(p.name))} schreef:</span>
          <div class="ink lined">${esc(a.text)}</div></div></div>`; }).join('')}
      ${answers.length ? '' : '<p class="empty-note">Nog geen antwoorden.<br>Zodra je vrienden antwoorden, komen ze hier te staan.</p>'}`;
    pages.push({ key: `vraag/${q.id}`, html: pageShell('Vraag & antwoord', body, { nr: questionNr[q.id] }) });
  });

  const words = received.length
    ? `<div class="words">${received.map((c, i) => { const p = person(c.from, friends); return `
        <div class="word-note n${i % 3}"><span class="tape"></span><span class="ink">${esc(c.text)}</span>
          <small>– ${esc(firstName(p.name))}</small></div>`; }).join('')}</div>`
    : '<p class="empty-note">Hier komen de complimenten en lieve briefjes die je vrienden je sturen.</p>';
  pages.push({ key: 'woorden', html: pageShell('Lieve woorden', words, { nr: wordsNr, confetti: true }) });

  return pages;
}

/* ---------- Schermen ---------- */

const app = document.getElementById('app');
let draftPhoto = null;      // foto in het formulier dat nu open staat
let shareMode = 'delen';    // 'delen' of 'vraag' op het deelscherm
let answeringId = null;     // vraag waarbij een vriend nu op dit toestel antwoordt
let flash = '';             // eenmalig berichtje na een actie
let book = null;            // { pages, index, busy } zolang het boek open is
let bookIndex = 0;          // onthoudt waar je in het boek was

function topbar(left, right) {
  return `<header class="topbar">${left || '<span></span>'}${right || '<span></span>'}</header>`;
}

function tabbar(active) {
  const tab = (id, label) => `<a class="tab ${active === id ? 'on' : ''}" href="#/${id}" ${active === id ? 'aria-current="page"' : ''}>${icon(id)}<span>${label}</span></a>`;
  return `<nav class="tabbar" aria-label="Hoofdmenu">${tab('home', 'Home')}${tab('delen', 'Delen')}${tab('boek', 'Mijn boek')}</nav>`;
}

function toast() {
  if (!flash) return '';
  const html = `<div class="toast" role="status">${esc(flash)}</div>`;
  flash = '';
  return html;
}

function viewWelcome() {
  return `<main class="cover-wrap">${coverHtml(true)}</main>`;
}

function noFriendsCard() {
  return `<section class="card">
      <h2 class="card-title">Nog geen vrienden in je boekje</h2>
      <p class="text">Vrienden zijn de mensen die jouw vriendenboekje hebben ingevuld. Geef je telefoon aan een vriend, of bekijk eerst hoe het eruitziet met voorbeeldvrienden.</p>
      <a class="btn" href="#/nieuw">+ Laat een vriend invullen</a>
      <button class="btn alt" id="load-demo">Voorbeeldvrienden laden</button>
    </section>`;
}

function postCard(post, friends) {
  const p = person(post.from, friends);
  const mine = post.from === ME;
  const photo = safePhoto(post.photo);
  return `<article class="card post" style="--c:${p.color}">
      <header class="post-head">${avatar(p)}<div><strong>${esc(mine ? 'Jij' : p.name)}</strong><small>${esc(ago(post.at))}</small></div></header>
      ${post.text ? `<p class="post-text">${esc(post.text)}</p>` : ''}
      ${photo ? `<figure class="polaroid post-photo"><span class="tape"></span><img src="${esc(photo)}" alt="Foto bij dit bericht"></figure>` : ''}
      <footer class="post-foot">
        ${mine ? `<button class="mini-link danger" data-del-post="${esc(post.id)}">weghalen</button>`
          : `<button class="heart-btn ${post.hearted ? 'on' : ''}" data-heart="${esc(post.id)}" aria-pressed="${post.hearted ? 'true' : 'false'}">${HEART}<span>lief!</span></button>
             <a class="mini-link" href="#/compliment/${esc(post.from)}">stuur een compliment →</a>`}
      </footer>
    </article>`;
}

function answerCard(item, friends) {
  const p = person(item.from, friends);
  return `<article class="card post" style="--c:${p.color}">
      <header class="post-head">${avatar(p)}<div><strong>${esc(p.name)}</strong><small>beantwoordde je vraag · ${esc(ago(item.at))}</small></div></header>
      <p class="quote">${esc(item.question)}</p>
      <p class="ink answer-text">${esc(item.text)}</p>
      <footer class="post-foot"><span></span><a class="mini-link" href="#/boek/vraag/${esc(item.questionId)}">bekijk in je boek →</a></footer>
    </article>`;
}

function viewHome() {
  const friends = sortedFriends();
  const social = loadSocial();
  const owner = getOwner();
  let body;

  if (!friends.length) {
    body = noFriendsCard();
  } else {
    // Compliment van de dag: elke dag een andere vriend en een andere vraag.
    const turn = dayNumber() + social.promptSkip;
    const who = friends[turn % friends.length];
    const promptIndex = turn % COMPLIMENT_PROMPTS.length;
    const prompt = COMPLIMENT_PROMPTS[promptIndex].replace('{naam}', firstName(who.answers.naam));
    const sentToday = social.lastSent === isoDate(new Date());
    const promptCard = `<section class="sticky prompt"><span class="tape"></span>
        <small class="kicker">compliment van de dag</small>
        <p class="prompt-q">${esc(prompt)}</p>
        <a class="btn small" href="#/compliment/${esc(who.id)}/${promptIndex}">Schrijf het aan ${esc(firstName(who.answers.naam))} ♥</a>
        ${friends.length > 1 ? '<button class="mini-link" id="other-friend">liever iemand anders</button>' : ''}
        ${sentToday ? '<small class="done">Je hebt vandaag al iemand blij gemaakt ♥</small>' : ''}
      </section>`;

    const received = social.compliments.filter(c => c.to === ME && person(c.from, friends)).sort((a, b) => b.at - a.at);
    const mail = received.length ? `<section class="card mail">
        <h2 class="card-title">Post voor jou</h2>
        ${received.slice(0, 2).map(c => `<p class="mail-item"><span class="ink">${esc(c.text)}</span>
          <small>– ${esc(firstName(person(c.from, friends).name))}, ${esc(ago(c.at))}</small></p>`).join('')}
        <a class="mini-link" href="#/boek/woorden">alle lieve woorden in je boek →</a>
      </section>` : '';

    const soon = friends.map(f => ({ f, b: birthdayInfo(f.answers.verjaardag) }))
      .filter(x => x.b && x.b.days <= 14).sort((x, y) => x.b.days - y.b.days)[0];
    const birthday = soon ? `<a class="card birthday" href="#/boek/vriend/${esc(soon.f.id)}">
        <span class="cake">🎂</span><span><strong>${esc(soon.f.answers.naam)}</strong> is ${esc(daysLabel(soon.b.days))}
        <small>en wordt ${soon.b.turns} jaar</small></span></a>` : '';

    const items = social.posts.filter(p => person(p.from, friends)).map(p => ({ at: p.at, html: () => postCard(p, friends) }));
    social.questions.forEach(q => (q.answers || []).filter(a => person(a.from, friends)).forEach(a => items.push({
      at: a.at, html: () => answerCard({ ...a, question: q.text, questionId: q.id }, friends) })));
    items.sort((a, b) => b.at - a.at);
    const feed = items.slice(0, FEED_MAX).map(i => i.html()).join('');

    body = `
      ${friends.some(f => f.demo) ? '<p class="ribbon">Proefversie: de berichten van de voorbeeldvrienden zijn verzonnen. <a href="#/meer">meer</a></p>' : ''}
      ${promptCard}${mail}${birthday}
      <h2 class="section-title">Van je vrienden</h2>
      ${feed || '<p class="empty-note">Nog niets gedeeld. Deel zelf iets leuks via <a href="#/delen">Delen</a>!</p>'}
      ${feed ? '<p class="feed-end"><span>☀</span>Je bent helemaal bij.<br>Tijd om iets leuks te gaan doen!</p>' : ''}`;
  }

  return `${topbar('<span class="brand">Friendbook</span>', '<a class="nav-btn" href="#/meer">meer</a>')}
    <main class="column">
      ${toast()}
      <h1 class="greet">Hoi ${esc(firstName(owner) || 'daar')}!</h1>
      ${body}
    </main>${tabbar('home')}`;
}

function viewShare() {
  const friends = sortedFriends();
  const social = loadSocial();
  draftPhoto = null;
  let body;

  if (!friends.length) {
    body = noFriendsCard();
  } else if (shareMode === 'delen') {
    body = `
      <p class="text">Deel iets waar je blij van wordt met de ${friends.length} ${friends.length === 1 ? 'vriend' : 'vrienden'} uit je boekje. Alleen zij zien het.</p>
      <label class="block"><span class="lbl">Wat wil je delen?</span>
        <textarea class="ink lined grow" id="post-text" rows="4" maxlength="500" placeholder="Vandaag…"></textarea></label>
      <div class="attach">
        <label class="btn alt small" for="photo-input">+ Foto erbij</label>
        <input id="photo-input" type="file" accept="image/*" hidden>
        <span class="polaroid attach-preview" id="attach-preview" hidden><span class="tape"></span><span class="photo" id="photo-preview"></span></span>
        <button type="button" class="link" id="photo-remove" hidden>foto weghalen</button>
      </div>
      <p class="error" id="share-error" hidden>Schrijf iets of kies een foto.</p>
      <button class="btn" id="send-post">Deel met mijn vrienden</button>`;
  } else {
    const mine = social.questions.slice().sort((a, b) => b.at - a.at);
    body = `
      <p class="text">Stel al je vrienden dezelfde vraag. Hun antwoorden komen op een eigen pagina in je vriendenboek.</p>
      <label class="block"><span class="lbl">Mijn vraag:</span>
        <textarea class="ink lined grow" id="question-text" rows="2" maxlength="200" placeholder="Wat…"></textarea></label>
      <div class="chips">${QUESTION_IDEAS.map(q => `<button type="button" class="chip" data-fill="question-text" data-text="${esc(q)}">${esc(q)}</button>`).join('')}</div>
      <p class="error" id="share-error" hidden>Schrijf eerst je vraag op.</p>
      <button class="btn" id="send-question">Stel de vraag</button>
      ${mine.length ? '<h3 class="lbl">Mijn vragen</h3>' : ''}
      ${mine.map(q => {
        const answered = (q.answers || []).filter(a => person(a.from, friends)).map(a => a.from);
        const open = friends.filter(f => !f.demo && !answered.includes(f.id));
        const form = answeringId === q.id ? `<div class="answer-form">
            <label class="row"><span class="lbl">Ik ben:</span>
              <select class="ink" id="answer-from">${open.map(f => `<option value="${esc(f.id)}">${esc(f.answers.naam)}</option>`).join('')}</select></label>
            <textarea class="ink lined grow" id="answer-text" rows="2" maxlength="300" placeholder="Mijn antwoord…" aria-label="Mijn antwoord"></textarea>
            <button class="btn small" data-save-answer="${esc(q.id)}">Antwoord opslaan</button>
          </div>` : (open.length ? `<button class="mini-link" data-answer="${esc(q.id)}">laat een vriend hier antwoorden</button>` : '');
        return `<div class="my-question">
            <p class="ink">${esc(q.text)}</p>
            <small>${answered.length} ${answered.length === 1 ? 'antwoord' : 'antwoorden'} · ${esc(ago(q.at))}</small>
            <a class="mini-link" href="#/boek/vraag/${esc(q.id)}">bekijk in je boek →</a>
            ${form}
          </div>`; }).join('')}`;
  }

  return `${topbar('<span class="brand">Friendbook</span>', '<a class="nav-btn" href="#/meer">meer</a>')}
    <main class="single">
      ${toast()}
      <article class="page">
        <span class="confetti tl">${CONFETTI}</span>
        <header class="page-title"><h2>Delen</h2>${SQUIGGLE}</header>
        ${friends.length ? `<div class="seg" role="tablist">
          <button role="tab" aria-selected="${shareMode === 'delen'}" class="${shareMode === 'delen' ? 'on' : ''}" data-mode="delen">Iets delen</button>
          <button role="tab" aria-selected="${shareMode === 'vraag'}" class="${shareMode === 'vraag' ? 'on' : ''}" data-mode="vraag">Een vraag stellen</button></div>` : ''}
        ${body}
      </article>
    </main>${tabbar('delen')}`;
}

function viewCompliment(friend, promptIndex) {
  const name = firstName(friend.answers.naam);
  const p = person(friend.id);
  const prompt = COMPLIMENT_PROMPTS[promptIndex] ? COMPLIMENT_PROMPTS[promptIndex].replace('{naam}', name) : `Wat wil je tegen ${name} zeggen?`;
  const sent = loadSocial().compliments.filter(c => c.from === ME && c.to === friend.id).sort((a, b) => b.at - a.at);
  return `${topbar('<a class="nav-btn" href="#/home">‹ terug</a>')}
    <main class="single">
      <article class="page letter" style="--fav:${p.color}">
        <span class="confetti tl">${CONFETTI}</span>
        <header class="page-title"><h2>Lief briefje</h2>${SQUIGGLE}</header>
        <div class="to">${avatar(p, 'big')}<span class="lbl">Voor ${esc(friend.answers.naam)}</span></div>
        <p class="prompt-q">${esc(prompt)}</p>
        <div class="chips">${COMPLIMENT_STARTERS.map(s => `<button type="button" class="chip" data-fill="compliment-text" data-text="${esc(s)}">${esc(s.replace(/[: ]+$/, ''))}…</button>`).join('')}</div>
        <textarea class="ink lined grow" id="compliment-text" rows="4" maxlength="400" aria-label="Je compliment"></textarea>
        <p class="error" id="share-error" hidden>Schrijf eerst iets liefs.</p>
        <button class="btn" id="send-compliment" data-to="${esc(friend.id)}">Verstuur ♥</button>
        <p class="text fine">Proefversie: je briefje wordt bewaard, maar nog niet echt bij ${esc(name)} bezorgd.</p>
        ${sent.length ? `<h3 class="lbl">Eerder aan ${esc(name)} geschreven</h3>
          ${sent.map(c => `<p class="mail-item"><span class="ink">${esc(c.text)}</span><small>${esc(ago(c.at))}</small></p>`).join('')}` : ''}
      </article>
    </main>`;
}

function viewBook() {
  return `${topbar('<button class="nav-btn" id="book-toc">☰ inhoud</button>',
      '<span class="book-actions"><a class="nav-btn" id="book-compliment" hidden>♥ compliment</a><a class="nav-btn" id="book-edit" hidden>✎ bewerk</a></span>')}
    <main class="book-view">
      ${toast()}
      <div class="stage" id="stage">
        <div class="leaf" id="leaf-under"></div>
        <div class="leaf" id="leaf-top"></div>
      </div>
      <div class="book-pager">
        <button class="nav-btn" id="book-prev" aria-label="Vorige pagina">‹ terug</button>
        <span class="page-count" id="book-count" aria-live="polite"></span>
        <button class="nav-btn" id="book-next" aria-label="Volgende pagina">verder ›</button>
      </div>
    </main>${tabbar('boek')}`;
}

const DOTS = `<div class="dots" id="dots" aria-hidden="true">${'<i></i>'.repeat(PAGES_PER_FRIEND)}</div>`;

function viewForm(friend) {
  const isNew = !friend;
  const f = friend || { id: '', answers: {}, photo: null, datum: isoDate(new Date()) };
  draftPhoto = safePhoto(f.photo);
  return `${topbar(`<a class="nav-btn" href="${isNew ? '#/boek/inhoud' : `#/boek/vriend/${esc(f.id)}`}">‹ annuleer</a>`,
      isNew ? '<span class="topbar-note">vul maar in!</span>' : `<button class="nav-btn danger" id="delete-friend" data-id="${esc(f.id)}">verwijder</button>`)}
    <main>
      <form id="friend-form" data-id="${esc(f.id)}" novalidate>
        <div class="spread editing" id="spread" style="--fav:${safeColor(f.answers.kleur)}">
          ${friendPages(f, true, null).join('')}
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
  const friends = loadFriends();
  const hasDemo = friends.some(f => f.demo);
  return `${topbar('<a class="nav-btn" href="#/home">‹ terug</a>')}
    <main class="single">
      ${toast()}
      <article class="page">
        <span class="confetti tl">${CONFETTI}</span>
        <header class="page-title"><h2>Goed om te weten</h2>${SQUIGGLE}</header>
        <h3 class="lbl">Dit is een proefversie</h3>
        <p class="text">Alles wordt nu alleen op dit toestel bewaard. Vrienden kunnen nog niet vanaf hun eigen telefoon
          meedoen: wat jij deelt, vraagt of stuurt, komt nog niet bij hen aan. De voorbeeldvrienden laten zien hoe het straks werkt.</p>
        ${hasDemo ? '<button class="btn alt" id="remove-demo">Voorbeeldvrienden weghalen</button>'
          : '<button class="btn alt" id="load-demo">Voorbeeldvrienden laden</button>'}
        <h3 class="lbl">Reservekopie</h3>
        <p class="text">Maak af en toe een reservekopie, zodat je niets kwijtraakt als je van telefoon wisselt.</p>
        <button class="btn" id="export" ${friends.length ? '' : 'disabled'}>Reservekopie opslaan (${friends.length})</button>
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
  const [, route, a, b] = location.hash.split('/');
  const friend = id => loadFriends().find(f => f.id === id);
  let html;
  book = null;

  if (route === 'home' || (!route && getOwner())) html = viewHome();
  else if (route === 'delen') html = viewShare();
  else if (route === 'boek' || route === 'inhoud' || route === 'vriend') html = viewBook();
  else if (route === 'nieuw') html = viewForm(null);
  else if (route === 'bewerk' && friend(a)) html = viewForm(friend(a));
  else if (route === 'compliment' && friend(a)) html = viewCompliment(friend(a), parseInt(b, 10));
  else if (route === 'meer') html = viewMore();
  else if (route) html = viewHome();
  else html = viewWelcome();

  app.innerHTML = html;
  window.scrollTo(0, 0);
  app.querySelectorAll('textarea.grow').forEach(autoGrow);

  const spread = document.getElementById('spread');
  if (spread) {
    spread.addEventListener('scroll', updateDots, { passive: true });
    updateDots();
  }
  if (document.getElementById('stage')) {
    // Oude adressen (#/inhoud, #/vriend/ID) blijven werken.
    const key = route === 'inhoud' ? 'inhoud' : route === 'vriend' ? `vriend/${a}` : (a ? [a, b].filter(Boolean).join('/') : null);
    openBook(key);
  }
}

/* ---------- Bladeren door het boek ---------- */

function openBook(key) {
  const pages = bookPages();
  let index = key ? pages.findIndex(p => p.key === key) : bookIndex;
  if (index < 0 || index >= pages.length) index = 0;
  book = { pages, index, busy: false };
  showLeaf(document.getElementById('leaf-top'), pages[index]);
  updateBookChrome();

  const stage = document.getElementById('stage');
  let startX = 0, startY = 0;
  stage.addEventListener('touchstart', e => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) flipTo(book.index + (dx < 0 ? 1 : -1));
  }, { passive: true });
}

function showLeaf(el, page) {
  el.className = `leaf ${page.cls || ''}`;
  el.innerHTML = page.html;
  el.scrollTop = 0;
}

// Slaat de pagina om naar `target`, met een omslaande bladzijde als animatie.
function flipTo(target) {
  if (!book || book.busy || target < 0 || target >= book.pages.length || target === book.index) return;
  const top = document.getElementById('leaf-top');
  const under = document.getElementById('leaf-under');
  const forward = target > book.index;
  const finish = () => {
    showLeaf(top, book.pages[target]);
    under.className = 'leaf';
    under.innerHTML = '';
    book.index = target;
    book.busy = false;
    updateBookChrome();
  };
  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || !top.animate) { finish(); return; }

  book.busy = true;
  const open = { transform: 'rotateY(0deg)', filter: 'brightness(1)' };
  const turned = { transform: 'rotateY(-96deg)', filter: 'brightness(.72)' };
  let anim;
  if (forward) {
    showLeaf(under, book.pages[target]);
    anim = top.animate([open, turned], { duration: 480, easing: 'cubic-bezier(.5,0,.9,.6)' });
  } else {
    showLeaf(under, book.pages[book.index]);
    showLeaf(top, book.pages[target]);
    anim = top.animate([turned, open], { duration: 480, easing: 'cubic-bezier(.1,.4,.5,1)' });
  }
  anim.onfinish = finish;
  anim.oncancel = finish;
}

function updateBookChrome() {
  if (!book) return;
  bookIndex = book.index;
  const page = book.pages[book.index];
  const last = book.pages.length - 1;
  document.getElementById('book-count').textContent = book.index === 0 ? 'kaft' : `${book.index} / ${last}`;
  document.getElementById('book-prev').disabled = book.index === 0;
  document.getElementById('book-next').disabled = book.index === last;
  document.getElementById('book-toc').hidden = book.index === 1;
  const edit = document.getElementById('book-edit');
  const compliment = document.getElementById('book-compliment');
  edit.hidden = compliment.hidden = !page.friendId;
  if (page.friendId) {
    edit.href = `#/bewerk/${page.friendId}`;
    compliment.href = `#/compliment/${page.friendId}`;
  }
}

/* ---------- Het invulformulier (drie pagina's naast elkaar) ---------- */

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
window.addEventListener('keydown', e => {
  if (!book || e.target.matches('input, textarea, select')) return;
  if (e.key === 'ArrowRight') flipTo(book.index + 1);
  if (e.key === 'ArrowLeft') flipTo(book.index - 1);
});

/* ---------- Acties ---------- */

function showError(id = 'share-error') {
  const el = document.getElementById(id);
  if (el) el.hidden = false;
}

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
    showError('form-error');
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
  if (saveFriends(list)) location.hash = `#/boek/vriend/${id}`;
});

app.addEventListener('change', async e => {
  const t = e.target;
  if (t.id === 'photo-input' && t.files[0]) {
    try {
      draftPhoto = await resizeImage(t.files[0]);
      document.getElementById('photo-preview').innerHTML = `<img src="${esc(draftPhoto)}" alt="">`;
      document.getElementById('photo-remove').hidden = false;
      const attach = document.getElementById('attach-preview');
      if (attach) { attach.hidden = false; document.getElementById('share-error').hidden = true; }
    } catch (err) {
      alert('Deze foto kon niet worden geladen.');
    }
    t.value = '';
  }
  if (t.id === 'import-input' && t.files[0]) {
    const status = document.getElementById('more-status');
    try {
      status.textContent = importBackup(JSON.parse(await t.files[0].text()));
    } catch (err) {
      status.textContent = 'Dit bestand is geen geldige Friendbook-reservekopie.';
    }
    t.value = '';
  }
});

// Zet een reservekopie terug en geeft een zin terug over wat er gebeurd is.
function importBackup(data) {
  const text = (v, max) => String(v == null ? '' : v).slice(0, max);
  const incoming = (Array.isArray(data) ? data : data.friends || []).filter(f => f && f.id && f.answers && f.answers.naam);
  if (!incoming.length) throw new Error('leeg');
  const list = loadFriends();
  let added = 0;
  incoming.forEach(f => {
    const clean = { id: String(f.id), created: Number(f.created) || Date.now(), answers: f.answers,
      datum: parseDate(f.datum) ? f.datum : undefined, photo: safePhoto(f.photo) };
    if (f.demo) clean.demo = true;
    const i = list.findIndex(x => x.id === clean.id);
    if (i >= 0) list[i] = clean; else { list.push(clean); added++; }
  });
  if (!saveFriends(list)) throw new Error('vol');
  if (data.owner && !getOwner()) setOwner(text(data.owner, 60));

  if (data.social) {
    const s = loadSocial();
    const merge = (target, items, clean) => (Array.isArray(items) ? items : []).forEach(item => {
      if (!item || !item.id) return;
      const c = clean(item);
      const i = target.findIndex(x => x.id === c.id);
      if (i >= 0) target[i] = c; else target.push(c);
    });
    merge(s.posts, data.social.posts, p => ({ id: String(p.id), from: String(p.from), at: Number(p.at) || Date.now(),
      text: text(p.text, 500), photo: safePhoto(p.photo), hearted: !!p.hearted }));
    merge(s.questions, data.social.questions, q => ({ id: String(q.id), at: Number(q.at) || Date.now(), text: text(q.text, 200),
      answers: (Array.isArray(q.answers) ? q.answers : []).map(a => ({ from: String(a.from), at: Number(a.at) || Date.now(), text: text(a.text, 300) })) }));
    merge(s.compliments, data.social.compliments, c => ({ id: String(c.id), from: String(c.from), to: String(c.to),
      at: Number(c.at) || Date.now(), text: text(c.text, 400) }));
    saveSocial(s);
  }
  return `Gelukt: ${added} nieuwe en ${incoming.length - added} bijgewerkte vrienden.`;
}

app.addEventListener('click', e => {
  const t = e.target.closest('button, a, label') || e.target;
  const d = t.dataset || {};

  // --- boek ---
  if (t.id === 'book-prev' && book) flipTo(book.index - 1);
  if (t.id === 'book-next' && book) flipTo(book.index + 1);
  if (t.id === 'book-toc' && book) flipTo(1);
  if (d.page && book) flipTo(+d.page);

  // --- invulformulier ---
  if (d.goto) gotoPage(+d.goto);
  if (t.id === 'photo-remove') {
    draftPhoto = null;
    const attach = document.getElementById('attach-preview');
    document.getElementById('photo-preview').innerHTML = attach ? '' : '<span class="photo-empty">tik voor<br>een foto</span>';
    if (attach) attach.hidden = true;
    t.hidden = true;
  }
  if (t.id === 'delete-friend') {
    const friend = loadFriends().find(f => f.id === d.id);
    if (friend && confirm(`De pagina's van ${friend.answers.naam} uit het boekje scheuren? Ook wat ${firstName(friend.answers.naam)} deelde en schreef verdwijnt. Dit kan niet ongedaan worden gemaakt.`)) {
      removePeople([friend.id]);
      flash = `${firstName(friend.answers.naam)} staat niet meer in je boekje.`;
      location.hash = '#/boek/inhoud';
    }
  }

  // --- home ---
  if (d.heart) {
    const s = loadSocial();
    const post = s.posts.find(p => p.id === d.heart);
    if (post) {
      post.hearted = !post.hearted;
      saveSocial(s);
      t.classList.toggle('on', post.hearted);
      t.setAttribute('aria-pressed', String(post.hearted));
    }
  }
  if (d.delPost && confirm('Dit bericht weghalen?')) {
    const s = loadSocial();
    s.posts = s.posts.filter(p => p.id !== d.delPost);
    saveSocial(s);
    render();
  }
  if (t.id === 'other-friend') {
    const s = loadSocial();
    s.promptSkip += 1;
    saveSocial(s);
    render();
  }
  if (t.id === 'load-demo') { loadDemo(); flash = 'Vier voorbeeldvrienden staan in je boekje.'; render(); }
  if (t.id === 'remove-demo' && confirm('Alle voorbeeldvrienden en hun berichten weghalen?')) { removeDemo(); flash = 'De voorbeeldvrienden zijn weg.'; render(); }

  // --- delen ---
  if (d.mode) { shareMode = d.mode; answeringId = null; render(); }
  if (d.fill) {
    const field = document.getElementById(d.fill);
    field.value = d.text;
    document.getElementById('share-error').hidden = true;
    autoGrow(field);
    field.focus();
  }
  if (t.id === 'send-post') {
    const text = document.getElementById('post-text').value.trim();
    if (!text && !draftPhoto) { showError(); return; }
    const s = loadSocial();
    s.posts.push({ id: newId(), from: ME, at: Date.now(), text, photo: draftPhoto });
    if (saveSocial(s)) {
      const n = loadFriends().length;
      flash = `Gedeeld met je ${n} ${n === 1 ? 'vriend' : 'vrienden'}.`;
      location.hash = '#/home';
    }
  }
  if (t.id === 'send-question') {
    const text = document.getElementById('question-text').value.trim();
    if (!text) { showError(); return; }
    const now = Date.now();
    const present = loadFriends().filter(f => f.demo).map(f => f.id);
    const answers = window.FriendbookDemo.answersFor(text).filter(a => present.includes(a.from))
      .map((a, i) => ({ ...a, at: now + i + 1 }));
    const s = loadSocial();
    s.questions.push({ id: newId(), at: now, text, answers });
    if (saveSocial(s)) {
      flash = answers.length ? `Vraag gesteld. ${answers.length} voorbeeldvrienden antwoordden al.` : 'Vraag gesteld. De antwoorden komen in je boek.';
      render();
    }
  }
  if (d.answer) { answeringId = d.answer; render(); }
  if (d.saveAnswer) {
    const from = document.getElementById('answer-from').value;
    const text = document.getElementById('answer-text').value.trim();
    if (!from || !text) return;
    const s = loadSocial();
    const q = s.questions.find(x => x.id === d.saveAnswer);
    if (q) {
      q.answers = (q.answers || []).filter(a => a.from !== from).concat({ from, text, at: Date.now() });
      saveSocial(s);
      answeringId = null;
      flash = 'Antwoord toegevoegd aan je boek.';
      render();
    }
  }

  // --- compliment ---
  if (t.id === 'send-compliment') {
    const text = document.getElementById('compliment-text').value.trim();
    if (!text) { showError(); return; }
    const friend = loadFriends().find(f => f.id === d.to);
    const s = loadSocial();
    s.compliments.push({ id: newId(), from: ME, to: d.to, at: Date.now(), text });
    s.lastSent = isoDate(new Date());
    if (saveSocial(s)) {
      flash = `Geschreven! ${friend ? firstName(friend.answers.naam) : 'Je vriend'} wordt hier blij van ♥`;
      location.hash = '#/home';
    }
  }

  // --- meer ---
  if (t.id === 'export') {
    const data = { app: 'friendbook', version: 3, owner: getOwner(), friends: loadFriends(), social: loadSocial() };
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
  if (['post-text', 'question-text', 'compliment-text'].includes(t.id) && t.value.trim()) document.getElementById('share-error').hidden = true;
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
