# Friendbook

Een digitaal vriendenboekje voor op je iPhone. Laat je vrienden een pagina invullen
met hun naam, verjaardag, favorieten en een boodschap voor jou.

## Wat kan het?

- Pagina's toevoegen, bekijken, bewerken en verwijderen
- Foto en lievelingskleur per vriend
- Zoeken op naam
- Zien wie er als eerste jarig is
- Reservekopie opslaan en terugzetten
- Werkt zonder internet zodra het op je beginscherm staat

Alles wordt alleen op je eigen toestel bewaard; er is geen account of server.

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
| `app.js` | De werking, met bovenaan de lijst met vragen |
| `sw.js` | Zorgt dat de app offline werkt |
| `manifest.webmanifest` | Naam en icoon voor het beginscherm |
