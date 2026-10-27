# Interface Explorations

A React, TypeScript, and Motion playground with sixteen interactive UI studies.
Explore animated cards, galleries, controls, and graphics across three collections
with light and dark themes.

## Run locally

Use Node.js 22.12+ and npm. From the project root:

```sh
npm ci
npm run dev
```

Open the URL Vite prints. The server starts at port 5174 and
moves to the next free port if it is occupied.

## Useful commands

- `npm run typecheck`: check TypeScript.
- `npm run build`: type-check and build into `dist/`.
- `npm run format:check`: check formatting.
- `PW_HEADLESS=true npm test`: run desktop and mobile browser tests;
  install Chromium first with `npx playwright install chromium`.

## How it works

- `src/demos/`: demo components grouped by behavior.
- `src/core.tsx`: shared controls, preferences, autoplay, and viewport activity.
- `src/styles.css`: themes and responsive styles; `src/sound.ts`: synthesized sounds.
- `public/`: local fonts, images, and asset provenance.

Calls, music, and other services are visual simulations; music previews are silent.
Demo state resets on reload; theme and sound preferences are remembered.

See [implementation notes](docs/implementation.md) for animation behavior,
browser checks, and asset sources. Fonts and photographs retain their creators'
rights; no additional redistribution rights are granted.
