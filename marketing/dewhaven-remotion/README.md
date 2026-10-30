# Dewhaven — A quiet life. A hidden adventure.

Editable English Remotion campaign: a 30-second landscape trailer, a 30-second vertical trailer, an app icon, banners and eight store screenshots.

## Preview

Use Node.js 22 or newer. Run `npm ci` and `npm run dev`, then open http://localhost:3214/Dewhaven-Landscape or http://localhost:3214/Dewhaven-Vertical.

The preview includes **Play-Store** stills and **Editable-Scenes**. Every major scene has its own component and timeline. All fonts, artwork, footage and audio are bundled under `public/`.

## Export

- `npm run render` — Both H.264/AAC MP4s, 30 fps, CRF 17, 320 kbps audio.
- `npm run render:brand` — Icons and banners.
- `npm run render:screenshots` — Eight 1080 × 1920 RGB PNGs.
- `npm run render:overview` — Contact sheet, after rendering the screenshots.
- `npm run render:proof` — Scene proof images and video posters.
- `npm run lint` — ESLint and TypeScript verification.

Outputs go to the parent marketing folder. Change the Google Chrome path near the top of `render-campaign.mjs` for another computer. Remotion and its companion packages are pinned to 4.0.538.

## Edit

- `src/Campaign.tsx` — Timing and soundtrack.
- `src/scenes/` — Copy, clip choices and the end card.
- `src/scenes/GameScene.tsx` — Both layouts and frame-driven animation.
- `src/StoreAssets.tsx` — Screenshot headlines and store layouts.
- `src/design.tsx` — Typography, palette and key emblem.
- `src/Root.tsx` — Movies, store stills and independent scene registrations.

The icon and key art are generated promotional illustration. Native footage uses an isolated staged save from the Unity 2.4 game. The first 27 seconds show game content; the last three seconds show an illustrated brand card. Original game music and foley form the soundtrack; no spoken voiceover is used.

Artwork contains no people; the farmer is viewed from behind. Tiny native NPC sprites may appear in town footage. Font notices and audio provenance are in `public/fonts/` and `CREDITS/`. The parent README contains the complete delivery map and store placement guidance.
