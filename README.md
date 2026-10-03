# PF2e Game Summary

A client-side app for composing a Discord game summary. The form supports players, ribbons, XP entries with bonuses, and loot links. Generate Summary displays the Discord Markdown and attempts to copy it.

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

The PWA works offline after its first successful load in a supported browser.

## Share one file

After `npm ci`, run:

```powershell
npm run build:single
```

Download `Game-Summary.html` from the [latest GitHub release](https://github.com/tuhs1985/pf2e-game-summary/releases/latest), or share your local `dist-single/Game-Summary.html`. The recipient downloads that one file and double-clicks it to open in a browser. It runs offline and does not require Node or an installer on their computer. This build does not include the PWA install and update features. The normal `npm run build` command still produces the PWA in `dist/`.

## Future hosting

The source is available in this repository if GitHub Pages hosting is desired later. Pages is not enabled; the downloadable release works without hosting.
