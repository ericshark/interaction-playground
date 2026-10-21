# Interface Explorations implementation

[Project overview and setup](../README.md). Commands and source paths below
are relative to the project root.

## Browser checks

The browser suite exercises the demos at desktop (1440 × 1000) and mobile (390 × 844) sizes. It covers keyboard navigation, dragging, wheel browsing, hover lifts, autoplay, hold cancellation and completion, simulated transactions, local assets, and the header preferences.

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
- Motion runs by default, even when the operating system asks for reduced motion, because the page is a motion study. The header has four remembered toggles:
  - **Day/Night** switches between the light and dark themes. Colors are CSS tokens in `src/styles.css`, and canvases switch their ink to match.
  - **Sound** mutes the hover and click ticks.
  - **Motion** freezes decorative loops while keeping manual controls and live clocks working.
  - **Spotlight** is experimental. It dims the page and follows the cursor with a soft light.
- Browsers block audio until the first click, tap, or keypress on the page, so hover ticks start after that.
- Every image and font is served locally. The app makes no requests to third-party services during use.

## Fidelity and assets

The supplied HAR, screenshot, live light theme, and desktop/mobile browser captures were used as references. Seven fonts were recovered from the HAR, and 20 images were retrieved from publicly accessible assets used by the original site. Source URLs are recorded in [public/asset-sources.json](../public/asset-sources.json); the HAR itself and its request headers are not included.

The original logo videos returned HTTP 403 responses. **ASCII Logos uses procedural, animated logo studies instead of video frames.** The 3D gallery reuses locally recovered photographs. Its geometry, the stacked cards, the dotted world map (hand-simplified coastlines in `src/demos/worldMap.ts`), the chat orb, and other motion details are reconstructed or original approximations. This is a functional visual study, not a pixel-exact source recovery.

Demo state lives in memory and resets on reload; header preferences are remembered. Database creation, image delivery, transactions, calls, upgrades, and music playback are visual simulations. The voice orb does not record audio, and the music preview is silent.

The original design, fonts, and photographs retain their respective creators' rights. Asset provenance is preserved for reference; this project does not grant additional redistribution rights.
