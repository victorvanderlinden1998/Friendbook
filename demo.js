'use strict';

/* =====================================================================
   Voorbeeldvrienden voor de proefversie.
   In de proefversie is er nog geen server, dus echte vrienden kunnen nog
   niets delen vanaf hun eigen telefoon. Deze verzonnen vrienden laten zien
   hoe het straks werkt. Alles hieruit is te herkennen aan `demo: true`
   of aan een id dat met "demo-" begint, en is met één tik weer weg te halen.
   ===================================================================== */

(function () {
  const svg = body => 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${body}</svg>`);

  // Getekend portretje: achtergrond, haar, trui, huid, lang haar ja/nee.
  function face(bg, hair, shirt, skin, long) {
    return svg(`<rect width="120" height="120" fill="${bg}"/>
      <path d="M26 120Q26 92 60 92Q94 92 94 120Z" fill="${shirt}"/>
      ${long ? `<path d="M31 56Q22 86 32 102L44 96 40 60ZM89 56Q98 86 88 102L76 96 80 60Z" fill="${hair}"/>` : ''}
      <circle cx="60" cy="62" r="27" fill="${skin}"/>
      <path d="M32 62Q26 26 60 27Q94 26 88 62Q84 44 60 45Q38 44 32 62Z" fill="${hair}"/>
      <circle cx="50" cy="63" r="3" fill="#232a4d"/><circle cx="70" cy="63" r="3" fill="#232a4d"/>
      <path d="M49 74Q60 85 71 74" fill="none" stroke="#232a4d" stroke-width="3" stroke-linecap="round"/>
      <circle cx="43" cy="71" r="4" fill="#ff6f59" opacity=".4"/><circle cx="77" cy="71" r="4" fill="#ff6f59" opacity=".4"/>`);
  }

  const PHOTOS = {
    pannenkoeken: svg(`<rect width="120" height="120" fill="#ffe8c7"/>
      <ellipse cx="60" cy="92" rx="46" ry="12" fill="#fffaf0" stroke="#232a4d" stroke-width="2"/>
      ${[84, 76, 68, 60].map(y => `<ellipse cx="60" cy="${y}" rx="34" ry="8" fill="#e9a23b" stroke="#b8721c" stroke-width="2"/>`).join('')}
      <path d="M40 58Q48 50 60 54Q74 50 80 58Q78 66 70 62Q64 72 56 63Q46 68 40 58Z" fill="#fffaf0"/>
      <circle cx="60" cy="52" r="6" fill="#ff6f59"/><path d="M60 46q4-8 10-6" fill="none" stroke="#6cc5a4" stroke-width="3" stroke-linecap="round"/>`),
    bergen: svg(`<rect width="120" height="120" fill="#bfe3f5"/><circle cx="94" cy="24" r="11" fill="#f6b93b"/>
      <path d="M0 100L34 44 58 82 80 36 120 100V120H0Z" fill="#8a8fa8"/>
      <path d="M80 36L68 62 78 56 84 64 92 56 Z" fill="#fffaf0"/><path d="M34 44L26 58 34 54 40 60Z" fill="#fffaf0"/>
      <path d="M0 104Q60 86 120 104V120H0Z" fill="#6cc5a4"/>
      <path d="M80 36V18" stroke="#232a4d" stroke-width="2.5"/><path d="M80 18l14 5-14 5Z" fill="#ff6f59"/>`),
    strand: svg(`<rect width="120" height="120" fill="#ffd9a8"/><rect y="0" width="120" height="50" fill="#ffb38a"/>
      <circle cx="60" cy="66" r="22" fill="#ff6f59"/>
      <rect y="66" width="120" height="30" fill="#4d8fd6"/>
      <path d="M0 74q10-5 20 0t20 0 20 0 20 0 20 0 20 0" fill="none" stroke="#fffaf0" stroke-width="2.5" opacity=".7"/>
      <path d="M0 92Q60 82 120 94V120H0Z" fill="#f3d9a4"/>
      <path d="M22 108l10-22M18 90q14-10 26 2" fill="none" stroke="#232a4d" stroke-width="2.5" stroke-linecap="round"/>`),
  };

  const HOUR = 3600000, DAY = 24 * HOUR;
  const iso = ms => { const d = new Date(ms); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
  // Een verjaardag die over `daysAhead` dagen valt, zodat de voorbeelden altijd actueel zijn.
  const birthday = (now, daysAhead, year) => { const d = new Date(now + daysAhead * DAY); const p = n => String(n).padStart(2, '0'); return `${year}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

  function friends(now) {
    const base = (id, daysAgo, photo, answers) => ({ id, demo: true, created: now - daysAgo * DAY, datum: iso(now - daysAgo * DAY), photo, answers });
    return [
      base('demo-sanne', 40, face('#bfe3f5', '#7a4a2b', '#ff6f59', '#f3c9a5', true), {
        naam: 'Sanne de Vries', bijnaam: 'San', verjaardag: birthday(now, 8, 1998), woonplaats: 'Utrecht', kleur: '#7048e8',
        kennenvan: 'De middelbare school, naast elkaar bij wiskunde', goedin: 'Taarten bakken', hekel: 'Vroeg opstaan',
        eten: 'Pannenkoeken', muziek: 'Froukje', film: 'Wie is de Mol?', dier: 'Otter', vakantie: 'Interrailen door Italië',
        hobbys: 'Hockey en tekenen', later: 'Dierenarts', samen: ['Slap lachen', 'Lekker eten', 'Niksen op de bank'],
        herinnering: 'Kamperen in Zeeland, toen de tent midden in de nacht wegwaaide', wens: 'Dat je altijd blijft lachen zoals nu',
        boodschap: 'Je bent een topper!', liefs: 'Sanne' }),
      base('demo-daan', 31, face('#d7f0df', '#2b2118', '#2f9e44', '#e0ac69', false), {
        naam: 'Daan Jansen', bijnaam: 'Daantje', verjaardag: birthday(now, 112, 1997), woonplaats: 'Gent', kleur: '#2f9e44',
        kennenvan: 'Het voetbalteam, jij stond altijd op doel', goedin: 'De weg vinden zonder kaart', hekel: 'Natte sokken',
        eten: 'Friet met stoofvlees', muziek: 'Stromae', film: 'The Bear', dier: 'Berggeit', vakantie: 'Huttentocht in Oostenrijk',
        hobbys: 'Wandelen en boulderen', later: 'Berggids', samen: ['Op avontuur gaan', 'Lekker eten'],
        herinnering: 'Die fietstocht naar zee waarbij we drie keer verkeerd reden', wens: 'Veel mooie uitzichten',
        boodschap: 'Volgende zomer ga je mee de bergen in.', liefs: 'Daan' }),
      base('demo-yara', 19, face('#ffe3d3', '#1c1c2e', '#f6b93b', '#c68642', true), {
        naam: 'Yara El Amrani', bijnaam: 'Yaar', verjaardag: birthday(now, 227, 1999), woonplaats: 'Rotterdam', kleur: '#e8590c',
        kennenvan: 'De introweek, we verdwaalden samen', goedin: 'Mensen aan het lachen maken', hekel: 'Afscheid nemen',
        eten: 'Mama’s couscous', muziek: 'S10', film: 'Alles van Studio Ghibli', dier: 'Rode panda', vakantie: 'Marrakech met de hele familie',
        hobbys: 'Dansen en fotograferen', later: 'Fotograaf', samen: ['Slap lachen', 'Urenlang kletsen', 'Tot laat dansen'],
        herinnering: 'Tot vier uur ’s nachts praten op het dak', wens: 'Dat al je plannen lukken',
        boodschap: 'Met jou is alles leuker.', liefs: 'Yara' }),
      base('demo-milan', 12, face('#e5dcff', '#c98b3c', '#1971c2', '#f3c9a5', false), {
        naam: 'Milan Bakker', bijnaam: 'Mil', verjaardag: birthday(now, 58, 1998), woonplaats: 'Zwolle', kleur: '#1971c2',
        kennenvan: 'Bijbaantje bij de bakker (echt waar)', goedin: 'Bordspellen winnen', hekel: 'Spoilers',
        eten: 'Pizza met ananas', muziek: 'Oude Queen-platen', film: 'Dune', dier: 'Kat', vakantie: 'Zeilen op de Waddenzee',
        hobbys: 'Zeilen en bordspellen', later: 'Uitvinder', samen: ['Urenlang kletsen', 'Niksen op de bank'],
        herinnering: 'De spelletjesavond die tot het ontbijt duurde', wens: 'Altijd wind in de zeilen',
        boodschap: 'Revanche met Catan, wanneer?', liefs: 'Milan' }),
    ];
  }

  function posts(now) {
    return [
      { id: 'demo-p1', from: 'demo-sanne', at: now - 2 * HOUR, text: 'Eerste pannenkoeken van de herfst gebakken. Wie komt er mee-eten?', photo: PHOTOS.pannenkoeken },
      { id: 'demo-p2', from: 'demo-daan', at: now - 26 * HOUR, text: 'Top gehaald! Halverwege dacht ik aan jullie (en aan friet).', photo: PHOTOS.bergen },
      { id: 'demo-p3', from: 'demo-yara', at: now - 2 * DAY - 3 * HOUR, text: 'Vandaag mijn rijbewijs gehaald!! Wie wil er een ritje?', photo: null },
      { id: 'demo-p4', from: 'demo-milan', at: now - 4 * DAY, text: 'Zonsondergang aan zee. Volgende keer gaan jullie mee.', photo: PHOTOS.strand },
    ];
  }

  function compliments(now) {
    return [
      { id: 'demo-c1', from: 'demo-sanne', to: 'me', at: now - 5 * HOUR, text: 'Jij luistert altijd echt. Dat is zeldzamer dan je denkt.' },
      { id: 'demo-c2', from: 'demo-daan', to: 'me', at: now - 3 * DAY, text: 'Dankjewel dat je kwam helpen verhuizen. Je bent een held.' },
      { id: 'demo-c3', from: 'demo-yara', to: 'me', at: now - 6 * DAY, text: 'Met jou is zelfs in de rij staan gezellig.' },
    ];
  }

  // Antwoorden van de voorbeeldvrienden op de voorbeeldvragen uit de app.
  const ANSWERS = {
    'Wat moeten we echt nog eens samen doen?': {
      'demo-sanne': 'Een weekend kamperen, maar dan mét haringen in de tent.',
      'demo-daan': 'Naar een festival! Ik regel de kaartjes.',
      'demo-yara': 'Samen leren surfen in Scheveningen.',
      'demo-milan': 'Een hele dag bordspellen en pizza.' },
    'Welk liedje doet je aan mij denken?': {
      'demo-sanne': '“Ik wil dansen”, want jij staat altijd als eerste op de dansvloer.',
      'demo-daan': 'Iets van Stromae. Vrolijk, en toch slim.',
      'demo-yara': '“Here Comes the Sun”. Duidelijk toch?' },
    'Wat is jouw beste tip voor een slechte dag?': {
      'demo-sanne': 'Pannenkoeken. Altijd pannenkoeken.',
      'demo-daan': 'Naar buiten, al is het maar een blokje om.',
      'demo-milan': 'Bel mij, dan verlies ik expres een potje.' },
    'Wat is onze mooiste herinnering van dit jaar?': {
      'demo-sanne': 'Die middag in het park die ineens avond was.',
      'demo-yara': 'Jouw verjaardag, toen iedereen bleef slapen.',
      'demo-milan': 'De spelletjesavond tot het ontbijt.' },
  };

  window.FriendbookDemo = {
    friends, posts, compliments,
    // Geeft [{from, text}] terug voor een voorbeeldvraag, of een lege lijst.
    answersFor(question) {
      const set = ANSWERS[question] || {};
      return Object.keys(set).map(from => ({ from, text: set[from] }));
    },
    isDemoId: id => typeof id === 'string' && id.startsWith('demo-'),
  };
})();
