# Friendbook

Een digitaal vriendenboekje voor op je iPhone. Laat je vrienden een pagina invullen
met hun naam, verjaardag, favorieten en een boodschap voor jou.

## Wat kan het?

Friendbook draait om vriendschap en positiviteit: geen video's, geen tellers en
een tijdlijn die gewoon ophoudt. Vrienden zijn de mensen die jouw boekje hebben ingevuld.

- **Home**: wat je vrienden delen (foto's en berichtjes), de antwoorden op jouw vragen,
  wie er bijna jarig is en elke dag een *compliment van de dag* om naar een vriend te sturen
- **Delen**: zelf iets delen met je vrienden, of ze allemaal dezelfde vraag stellen;
  de antwoorden komen op een eigen pagina in je boek
- **Mijn boek**: je vriendenboek als echt boek waar je doorheen bladert, met kaft,
  inhoudsopgave met zoekveld, drie pagina's per vriend, je vragen met antwoorden en
  een pagina *Lieve woorden* met de complimenten die je kreeg
- Reservekopie opslaan en terugzetten; werkt zonder internet zodra het op je beginscherm staat

### Dit is een proefversie

Er is nog geen server en er zijn nog geen accounts. Alles wordt alleen op je eigen toestel
bewaard, dus vrienden kunnen nog niet vanaf hun eigen telefoon meedoen en wat jij deelt of
stuurt komt nog niet bij hen aan. Via *meer* laad je vier verzonnen **voorbeeldvrienden**
die laten zien hoe het straks werkt; je haalt ze daar ook weer weg. Een echte vriend kan
op jouw toestel het boekje invullen en een vraag beantwoorden.

## Huisstijl

Inktblauw op crèmekleurig papier, met koraal, zonnegeel en mint. Vormen hebben een
gekleurd vlak dat net naast de inktlijn valt, zoals bij een stempeldruk. De kleuren
staan bovenaan `style.css`, de tekeningetjes bovenaan `app.js`.

Eerdere versies staan in de geschiedenis: versie 1 (eenvoudige lijst) is commit `ac10799`,
versie 2 (alleen het boekje) is commit `8e13b5e`.

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
| `demo.js` | De voorbeeldvrienden van de proefversie |
| `sw.js` | Zorgt dat de app offline werkt |
| `manifest.webmanifest` | Naam en icoon voor het beginscherm |
| `fonts/` | De handschrift-lettertypen (vrij te gebruiken, zie `fonts/LICENSE.txt`) |
