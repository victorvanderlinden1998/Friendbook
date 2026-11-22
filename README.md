# Friendbook

Een digitaal vriendenboekje voor op je iPhone. Laat je vrienden een pagina invullen
met hun naam, verjaardag, favorieten en een boodschap voor jou.

## Wat kan het?

- Een kaft met jouw naam, een inhoudsopgave en per vriend drie boekjespagina's:
  *Dit ben ik*, *Mijn favorieten* en *Voor jou*
- Invullen gebeurt op de pagina zelf, op schrijflijntjes, in een tekstballon en in wolkjes
- Foto, lievelingskleur en aankruishartjes per vriend
- Bladeren door te vegen; op een breed scherm liggen de pagina's naast elkaar
- Zoeken op naam en zien wie er als eerste jarig is
- Reservekopie opslaan en terugzetten
- Werkt zonder internet zodra het op je beginscherm staat

Alles wordt alleen op je eigen toestel bewaard; er is geen account of server.

## Huisstijl

Inktblauw op crèmekleurig papier, met koraal, zonnegeel en mint. Vormen hebben een
gekleurd vlak dat net naast de inktlijn valt, zoals bij een stempeldruk. De kleuren
staan bovenaan `style.css`, de tekeningetjes bovenaan `app.js`.

Versie 1 (de eerste, eenvoudige layout) staat nog in de geschiedenis: commit `ac10799`.

## Op je iPhone zetten

1. Open de website van Friendbook in Safari.
2. Tik op het deel-icoon.
3. Kies **Zet op beginscherm**.

## Op je computer uitproberen

```bash
python3 -m http.server 8000
```

Open daarna http://localhost:8000 in je browser.

## Bestanden

| Bestand | Waarvoor |
|---|---|
| `index.html` | De pagina zelf |
| `style.css` | Het uiterlijk |
| `app.js` | De werking, de vragen en de tekeningetjes |
| `sw.js` | Zorgt dat de app offline werkt |
| `manifest.webmanifest` | Naam en icoon voor het beginscherm |
| `fonts/` | De handschrift-lettertypen (vrij te gebruiken, zie `fonts/LICENSE.txt`) |
