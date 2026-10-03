# PF2e Game Summary

A local, client-side PWA for composing a Discord game summary. The form supports any number of players, ribbons, XP entries with optional bonuses, and loot links. The output field contains raw Discord Markdown for copying.

## Run locally

From this folder:

```powershell
npm ci
npm run dev
```

Open the local URL printed by Vite. To build and preview the production PWA:

```powershell
npm run build
npm run preview
```

The `dist/` folder is a known-good build copied from the guided bake-off. Rebuild it after source changes. The PWA works offline after its first successful load in a supported browser.

## Origin

Promoted from `C:\Project\Bakeoff_Ornith\GameSummaryApp_GuidedA` on 2026-10-03. The original bake-off candidate and evaluation transcripts remain in place. This project contains the app files, without the bake-off appearance reference or dependency cache.
