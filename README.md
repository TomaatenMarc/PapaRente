# PapaRente 🎉

Private Geschenk-Seite zur Rente: Landingpage mit zwei Unterseiten
(Wellness-Hotel &amp; Planwagentour) inkl. kleiner Minispiele.

## Entwicklung

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Das Ergebnis liegt danach in `dist/` und kann als statische Seite gehostet werden.

## Deployment auf Vercel

1. Repo auf GitHub pushen (`git push`).
2. Auf [vercel.com](https://vercel.com) mit GitHub einloggen → "Add New Project" →
   dieses Repo auswählen.
3. Vercel erkennt automatisch das Vite-Preset (Build-Command `vite build`,
   Output-Verzeichnis `dist`) – einfach auf "Deploy" klicken.
4. Nach dem Deploy gibt es eine `*.vercel.app`-URL. Daraus lässt sich der
   QR-Code für die Übergabe erzeugen.

## Struktur

- `index.html` – Landingpage mit den zwei Kacheln
- `hotel.html` – Infos &amp; Minigame zur Wellness-Auszeit
- `planwagen.html` – Infos &amp; Minigame zur Planwagentour
- `src/games/` – die beiden Canvas-Minispiele
- `public/images/` – Fotos (Hotel &amp; Mosel-Weinberge)
