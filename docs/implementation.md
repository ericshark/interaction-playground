# Interface Explorations implementation

[Project overview and setup](../README.md). Commands and source paths below
are relative to the project root.

## Browser checks

The browser suite exercises the demos at desktop (1440 × 1000) and mobile (390 × 844) sizes. It covers keyboard navigation, dragging, wheel browsing, hover lifts, autoplay, hold cancellation and completion, local assets, and the header preferences.

```sh
npx playwright install chromium
PW_HEADLESS=true npm test
```

Tests start their own server on port 5199 with `--strictPort` and never reuse an existing one, so a busy port fails the run instead of hitting another server. For a different port, use `PW_PORT=5200 PW_HEADLESS=true npm test`. Playwright stops the server it starts.

## Animation and preferences

- React, TypeScript, Vite, Motion, and Lucide icons.
- Shared viewport activity, autoplay, preferences, and controls live in `src/core.tsx`. UI sound effects are synthesized with the Web Audio API in `src/sound.ts`, with no audio files.
- Demo components are grouped by behavior under `src/demos/`. Styles, responsive rules, and light-theme colors are in `src/styles.css`.
- Canvas animation frames, observers, intervals, and action timers are cleaned up. Continuous animations pause outside the viewport.
- Motion stays enabled, including when the operating system requests reduced motion. Individual demos can be paused, and offscreen animation work is suspended.
- The header remembers two preferences:
  - **Day/Night** switches between the light and dark themes. Colors are CSS tokens in `src/styles.css`, and canvases switch their ink to match.
  - **Sound** uses an icon-only toggle; a red crossed-out speaker indicates muted sound.
- Browsers block audio until the first click, tap, or keypress on the page, so hover ticks start after that.
- Every image and font is served locally. The app makes no requests to third-party services during use.

## Jellyfish background

Three procedural ASCII jellyfish follow the curved paths from the portfolio's
`codex/shark-background` animation. Their bells pulse and their tentacles sway
as they cross behind the opaque content column, appearing only in the margins.
The fixed canvas sits above the page guides, ignores pointer input, and follows
the existing Day/Night preference with grayscale palettes.

Drawing is limited to 30 FPS with a maximum 2× pixel density. Below 1024px,
the canvas is hidden and its backing store is released. Hidden tabs suspend
animation and resume without advancing through the hidden time. Frames and
listeners are cleaned up on unmount, including React Strict Mode remounts.
No canvas context leaves the content usable without the decoration.

The browser suite checks animation, theme changes, center-column occlusion,
responsive activation, density limits, and canvas fallback behavior.

## Graphics and assets

Fonts and images are served from `public/`. Asset source URLs are recorded in [public/asset-sources.json](../public/asset-sources.json).

ASCII Logos uses procedural, animated drawings. Gallery animations use local photographs. The dotted world map uses hand-simplified coastlines in `src/demos/worldMap.ts`.

Demo state lives in memory and resets on reload; theme and sound preferences are remembered. Database selection, image delivery, calls, upgrades, and music playback are visual simulations. The music preview is silent.

Fonts and photographs retain their respective creators' rights. Asset provenance is preserved; this project does not grant additional redistribution rights.
