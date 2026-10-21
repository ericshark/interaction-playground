# Interface Explorations

A local, white-themed take on the interactive playground on [Abil Shrestha's website](https://www.abilshr.com/). Twenty demos are included in their original order. The portfolio introduction, project listings, and writing pages are intentionally omitted.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite. The development server uses **5174**, one above Vite's default, and exits if that port is occupied. Use `npm run dev -- --port 5175` if needed, incrementing until an available port is found.

## Checks

```sh
npm run typecheck
npm run build
npm run format:check
```

The browser suite exercises the demos at desktop (1440 × 1000) and mobile (390 × 844) sizes. It covers keyboard navigation, dragging, wheel browsing, hover lifts, autoplay, hold cancellation and completion, simulated transactions, local assets, and the motion and sound preferences.

```sh
npx playwright install chromium
PW_HEADLESS=true npm test
```

Tests start a server on port 5174 when one is not already running. For another available port, use `PW_PORT=5175 PW_HEADLESS=true npm test`. Playwright stops servers it starts; stop a manually started Vite server with Ctrl+C.

## Implementation

- React, TypeScript, Vite, Motion, and Lucide icons.
- Shared viewport activity, autoplay, preferences, and controls live in `src/core.tsx`. UI sound effects are synthesized with the Web Audio API in `src/sound.ts`, with no audio files.
- Demo components are grouped by behavior under `src/demos/`. Styles, responsive rules, and light-theme colors are in `src/styles.css`.
- Canvas animation frames, observers, intervals, and action timers are cleaned up. Continuous animations pause outside the viewport.
- Motion runs by default, even when the operating system asks for reduced motion, because the page is a motion study. The **Motion** toggle in the header freezes decorative loops while keeping manual controls and live clocks working. The **Sound** toggle mutes the hover and click ticks. Both choices are remembered in `localStorage`.
- Browsers block audio until the first click, tap, or keypress on the page, so hover ticks start after that.
- Every image and font is served locally. The app makes no requests to third-party services during use.

## Fidelity and assets

The supplied HAR, screenshot, live light theme, and desktop/mobile browser captures were used as references. Seven fonts were recovered from the HAR, and 20 images were retrieved from publicly accessible assets used by the original site. Source URLs are recorded in `public/asset-sources.json`; the HAR itself and its request headers are not included.

The original logo videos returned HTTP 403 responses. **ASCII Logos uses procedural, animated logo studies instead of video frames.** The 3D gallery reuses locally recovered photographs. Its geometry, the stacked cards, map, chat orb, Image Send marks, and other motion details are reconstructed or original approximations. The Image Send marks are original geometric shapes, not real brand logos. This is a functional visual study, not a pixel-exact source recovery.

All demo state lives in memory and resets on reload. Database creation, image delivery, transactions, calls, upgrades, and music playback are visual simulations. The voice orb does not record audio, and the music preview is silent.

The original design, fonts, and photographs retain their respective creators' rights. Asset provenance is preserved for reference; this project does not grant additional redistribution rights.
