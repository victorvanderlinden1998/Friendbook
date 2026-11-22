'use strict';

/* ---------- De vragen van het vriendenboekje ---------- */

const SECTIONS = [
  { title: 'Over mij', emoji: '🙋', items: [
    { key: 'naam', label: 'Naam', placeholder: 'Hoe heet je?', required: true },
    { key: 'bijnaam', label: 'Bijnaam', placeholder: 'Hoe noemen je vrienden je?' },
    { key: 'verjaardag', label: 'Verjaardag', type: 'date' },
    { key: 'woonplaats', label: 'Woonplaats', placeholder: 'Waar woon je?' },
  ]},
  { title: 'Mijn favorieten', emoji: '⭐', items: [
    { key: 'kleur', label: 'Lievelingskleur', type: 'color' },
    { key: 'eten', label: 'Lievelingseten', placeholder: 'Pizza, sushi, stamppot…' },
    { key: 'dier', label: 'Lievelingsdier' },
    { key: 'film', label: 'Lievelingsfilm of -serie' },
    { key: 'muziek', label: 'Lievelingsmuziek', placeholder: 'Artiest, band of nummer' },
    { key: 'vakantie', label: 'Mooiste vakantie' },
  ]},
  { title: 'Dit ben ik', emoji: '✨', items: [
    { key: 'hobbys', label: "Mijn hobby's" },
    { key: 'goedin', label: 'Hier ben ik goed in' },
    { key: 'hekel', label: 'Hier heb ik een hekel aan' },
    { key: 'later', label: 'Later word ik…' },
  ]},
  { title: 'Wij samen', emoji: '🤝', items: [
    { key: 'kennenvan', label: 'Hier ken ik je van' },
    { key: 'herinnering', label: 'Onze mooiste herinnering', type: 'textarea' },
    { key: 'boodschap', label: 'Dit wil ik je nog zeggen', type: 'textarea', placeholder: 'Schrijf iets liefs of grappigs…' },
  ]},
];

const DEFAULT_COLOR = '#e8590c';
const STORAGE_KEY = 'friendbook.v1';
const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli',
  'augustus', 'september', 'oktober', 'november', 'december'];

/* ---------- Opslag ---------- */

let memoryFallback = [];

function loadFriends() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
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

function getFriend(id) {
  return loadFriends().find(f => f.id === id);
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

// Aantal dagen tot de volgende verjaardag, en de leeftijd die iemand dan wordt.
function birthdayInfo(value, today = new Date()) {
  const p = parseDate(value);
  if (!p) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let next = new Date(start.getFullYear(), p.m - 1, p.d);
  if (next < start) next = new Date(start.getFullYear() + 1, p.m - 1, p.d);
  const days = Math.round((next - start) / 86400000);
  return { days, turns: next.getFullYear() - p.y };
}

function daysLabel(days) {
  if (days === 0) return 'vandaag jarig! 🎉';
  if (days === 1) return 'morgen jarig';
  return `over ${days} dagen jarig`;
}

function initials(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

function avatar(friend, cls = '') {
  const color = safeColor(friend.answers.kleur);
  if (friend.photo) {
    return `<span class="avatar ${cls}" style="border-color:${color}"><img src="${esc(friend.photo)}" alt=""></span>`;
  }
  return `<span class="avatar ${cls}" style="background:${color};border-color:${color}">${esc(initials(friend.answers.naam))}</span>`;
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

/* ---------- Schermen ---------- */

const app = document.getElementById('app');
let draftPhoto = null; // foto in het formulier dat nu open staat

function viewHome() {
  const friends = loadFriends().sort((a, b) =>
    (a.answers.naam || '').localeCompare(b.answers.naam || '', 'nl'));

  if (!friends.length) {
    return `
      <header class="topbar"><h1>Friendbook</h1>
        <a class="icon-btn" href="#/meer" aria-label="Meer">⋯</a></header>
      <main class="empty">
        <div class="empty-book">📖</div>
        <h2>Je vriendenboekje is nog leeg</h2>
        <p>Geef je telefoon aan een vriend of vriendin en laat de eerste pagina invullen.</p>
        <a class="btn primary" href="#/nieuw">Eerste pagina invullen</a>
      </main>`;
  }

  const upcoming = friends
    .map(f => ({ f, b: birthdayInfo(f.answers.verjaardag) }))
    .filter(x => x.b)
    .sort((a, b) => a.b.days - b.b.days)[0];

  const banner = upcoming ? `
    <a class="banner" href="#/vriend/${esc(upcoming.f.id)}">
      <span class="banner-emoji">🎂</span>
      <span><strong>${esc(upcoming.f.answers.naam)}</strong> is ${esc(daysLabel(upcoming.b.days))}
      <small>wordt ${upcoming.b.turns} jaar</small></span>
    </a>` : '';

  const cards = friends.map(f => `
    <a class="card" href="#/vriend/${esc(f.id)}" data-name="${esc((f.answers.naam + ' ' + (f.answers.bijnaam || '')).toLowerCase())}">
      ${avatar(f)}
      <span class="card-text">
        <strong>${esc(f.answers.naam)}</strong>
        <small>${esc(f.answers.bijnaam ? `“${f.answers.bijnaam}”` : (f.answers.woonplaats || 'Pagina bekijken'))}</small>
      </span>
      <span class="chev">›</span>
    </a>`).join('');

  return `
    <header class="topbar"><h1>Friendbook</h1>
      <a class="icon-btn" href="#/meer" aria-label="Meer">⋯</a></header>
    <main>
      ${banner}
      <input class="search" id="search" type="search" placeholder="Zoek een vriend…" aria-label="Zoek een vriend">
      <p class="count">${friends.length} ${friends.length === 1 ? 'pagina' : "pagina's"} in je boekje</p>
      <div class="cards" id="cards">${cards}</div>
      <p class="no-results" id="no-results" hidden>Niemand gevonden met die naam.</p>
    </main>
    <a class="fab" href="#/nieuw" aria-label="Nieuwe pagina">＋</a>`;
}

function fieldHtml(item, value) {
  const id = `f-${item.key}`;
  const common = `id="${id}" name="${item.key}"`;
  let input;
  if (item.type === 'textarea') {
    input = `<textarea ${common} rows="3" placeholder="${esc(item.placeholder || '')}">${esc(value)}</textarea>`;
  } else if (item.type === 'color') {
    input = `<input ${common} type="color" value="${esc(safeColor(value))}">`;
  } else {
    input = `<input ${common} type="${item.type || 'text'}" value="${esc(value)}"
      placeholder="${esc(item.placeholder || '')}" ${item.required ? 'required' : ''}
      ${item.type === 'date' ? '' : 'autocomplete="off"'}>`;
  }
  return `<label class="field ${item.type === 'color' ? 'field-color' : ''}" for="${id}">
    <span>${esc(item.label)}${item.required ? ' *' : ''}</span>${input}</label>`;
}

function viewForm(friend) {
  const answers = friend ? friend.answers : {};
  draftPhoto = friend ? friend.photo || null : null;
  const sections = SECTIONS.map(s => `
    <fieldset>
      <legend>${s.emoji} ${esc(s.title)}</legend>
      ${s.items.map(i => fieldHtml(i, answers[i.key] || '')).join('')}
    </fieldset>`).join('');

  return `
    <header class="topbar">
      <a class="icon-btn" href="${friend ? `#/vriend/${esc(friend.id)}` : '#/'}" aria-label="Terug">‹</a>
      <h1>${friend ? 'Pagina bewerken' : 'Nieuwe pagina'}</h1><span class="icon-btn ghost"></span>
    </header>
    <main>
      ${friend ? '' : '<p class="hint">Vul deze pagina in voor het vriendenboekje. Alleen je naam is verplicht.</p>'}
      <form id="friend-form" data-id="${friend ? esc(friend.id) : ''}" novalidate>
        <div class="photo-pick">
          <label class="photo-label" for="photo-input">
            <span class="avatar big" id="photo-preview">${draftPhoto ? `<img src="${esc(draftPhoto)}" alt="">` : '📷'}</span>
            <span class="link">Foto kiezen</span>
          </label>
          <input id="photo-input" type="file" accept="image/*" hidden>
          <button type="button" class="link danger" id="photo-remove" ${draftPhoto ? '' : 'hidden'}>Foto verwijderen</button>
        </div>
        ${sections}
        <p class="error" id="form-error" hidden>Vul eerst je naam in.</p>
        <button class="btn primary" type="submit">${friend ? 'Wijzigingen opslaan' : 'Opslaan in het boekje'}</button>
      </form>
    </main>`;
}

function viewFriend(friend) {
  const a = friend.answers;
  const color = safeColor(a.kleur);
  const b = birthdayInfo(a.verjaardag);

  const sections = SECTIONS.map(s => {
    const rows = s.items.filter(i => i.key !== 'naam' && i.key !== 'bijnaam' && a[i.key]).map(i => {
      let value;
      if (i.type === 'color') {
        value = `<span class="swatch" style="background:${color}"></span>`;
      } else if (i.type === 'date') {
        value = esc(formatDate(a[i.key])) + (b ? `<small class="sub">${esc(daysLabel(b.days))} · wordt ${b.turns}</small>` : '');
      } else {
        value = esc(a[i.key]).replace(/\n/g, '<br>');
      }
      return `<div class="qa"><dt>${esc(i.label)}</dt><dd>${value}</dd></div>`;
    }).join('');
    return rows ? `<section class="page-section"><h3>${s.emoji} ${esc(s.title)}</h3><dl>${rows}</dl></section>` : '';
  }).join('');

  return `
    <header class="topbar">
      <a class="icon-btn" href="#/" aria-label="Terug">‹</a>
      <h1>Vriendenpagina</h1>
      <a class="icon-btn" href="#/bewerk/${esc(friend.id)}" aria-label="Bewerken">✎</a>
    </header>
    <main class="page" style="--accent:${color}">
      <div class="page-head">
        ${avatar(friend, 'huge')}
        <h2>${esc(a.naam)}</h2>
        ${a.bijnaam ? `<p class="nick">“${esc(a.bijnaam)}”</p>` : ''}
      </div>
      ${sections || '<p class="hint">Deze pagina is nog bijna leeg. Tik op het potlood om hem aan te vullen.</p>'}
      <button class="btn danger-outline" id="delete-friend" data-id="${esc(friend.id)}">Pagina verwijderen</button>
    </main>`;
}

function viewMore() {
  const n = loadFriends().length;
  return `
    <header class="topbar">
      <a class="icon-btn" href="#/" aria-label="Terug">‹</a><h1>Meer</h1><span class="icon-btn ghost"></span>
    </header>
    <main>
      <section class="page-section">
        <h3>💾 Reservekopie</h3>
        <p>Je boekje wordt alleen op dit toestel bewaard. Maak af en toe een reservekopie,
        zodat je niets kwijtraakt als je van telefoon wisselt.</p>
        <button class="btn" id="export" ${n ? '' : 'disabled'}>Reservekopie opslaan (${n})</button>
        <label class="btn" for="import-input">Reservekopie terugzetten</label>
        <input id="import-input" type="file" accept="application/json,.json" hidden>
        <p class="status" id="more-status" role="status"></p>
      </section>
      <section class="page-section">
        <h3>📱 Op je beginscherm zetten</h3>
        <p>Open deze pagina in Safari, tik op het deel-icoon en kies
        <strong>Zet op beginscherm</strong>. Friendbook werkt daarna als een gewone app, ook zonder internet.</p>
      </section>
    </main>`;
}

/* ---------- Navigatie ---------- */

function render() {
  const [, route, id] = location.hash.split('/');
  let html;
  if (route === 'nieuw') html = viewForm(null);
  else if (route === 'meer') html = viewMore();
  else if ((route === 'vriend' || route === 'bewerk') && getFriend(id)) {
    html = route === 'vriend' ? viewFriend(getFriend(id)) : viewForm(getFriend(id));
  } else html = viewHome();
  app.innerHTML = html;
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);

/* ---------- Acties ---------- */

app.addEventListener('submit', e => {
  if (e.target.id !== 'friend-form') return;
  e.preventDefault();
  const form = e.target;
  const answers = {};
  SECTIONS.forEach(s => s.items.forEach(i => {
    const v = (form.elements[i.key].value || '').trim();
    if (v) answers[i.key] = v;
  }));
  if (!answers.naam) {
    document.getElementById('form-error').hidden = false;
    form.elements.naam.focus();
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
    list.push({ id, created: Date.now(), photo: draftPhoto, answers });
  }
  if (saveFriends(list)) location.hash = `#/vriend/${id}`;
});

app.addEventListener('change', async e => {
  if (e.target.id === 'photo-input' && e.target.files[0]) {
    try {
      draftPhoto = await resizeImage(e.target.files[0]);
      document.getElementById('photo-preview').innerHTML = `<img src="${esc(draftPhoto)}" alt="">`;
      document.getElementById('photo-remove').hidden = false;
    } catch (err) {
      alert('Deze foto kon niet worden geladen.');
    }
  }
  if (e.target.id === 'import-input' && e.target.files[0]) {
    const status = document.getElementById('more-status');
    try {
      const data = JSON.parse(await e.target.files[0].text());
      const incoming = (Array.isArray(data) ? data : data.friends || [])
        .filter(f => f && f.id && f.answers && f.answers.naam);
      if (!incoming.length) throw new Error('leeg');
      const list = loadFriends();
      let added = 0;
      incoming.forEach(f => {
        const clean = { id: String(f.id), created: f.created || Date.now(), answers: f.answers,
          photo: typeof f.photo === 'string' && f.photo.startsWith('data:image/') ? f.photo : null };
        const idx = list.findIndex(x => x.id === clean.id);
        if (idx >= 0) list[idx] = clean; else { list.push(clean); added++; }
      });
      if (saveFriends(list)) {
        status.textContent = `Gelukt: ${added} nieuwe en ${incoming.length - added} bijgewerkte pagina's.`;
      }
    } catch (err) {
      status.textContent = 'Dit bestand is geen geldige Friendbook-reservekopie.';
    }
    e.target.value = '';
  }
});

app.addEventListener('click', e => {
  const t = e.target;
  if (t.id === 'photo-remove') {
    draftPhoto = null;
    document.getElementById('photo-preview').textContent = '📷';
    t.hidden = true;
  }
  if (t.id === 'delete-friend') {
    const friend = getFriend(t.dataset.id);
    if (friend && confirm(`De pagina van ${friend.answers.naam} verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
      saveFriends(loadFriends().filter(f => f.id !== friend.id));
      location.hash = '#/';
    }
  }
  if (t.id === 'export') {
    const blob = new Blob([JSON.stringify({ app: 'friendbook', version: 1, friends: loadFriends() }, null, 2)],
      { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `friendbook-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
});

app.addEventListener('input', e => {
  if (e.target.id !== 'search') return;
  const q = e.target.value.trim().toLowerCase();
  let visible = 0;
  document.querySelectorAll('#cards .card').forEach(card => {
    const show = card.dataset.name.includes(q);
    card.hidden = !show;
    if (show) visible++;
  });
  document.getElementById('no-results').hidden = visible > 0;
});

render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
