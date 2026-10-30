# Dewhaven — English marketing collection

**Campaign:** A quiet life. A hidden adventure.

Created for the native Unity 2.4 edition of Dewhaven. The campaign opens with “Grandma left you a farm. And a secret.” Its imagery connects a welcoming farmhouse with the valley's exploration story.

## Ready-to-use files

| Asset | File | Size / format |
|---|---|---|
| Store app icon | `play-store/icon/dewhaven-icon-512.png` | 512 × 512, RGBA PNG, under 1 MB |
| Larger icon | `play-store/icon/dewhaven-icon-1024.png` | 1024 × 1024, RGBA PNG |
| Play Store feature graphic | `play-store/banner/dewhaven-feature-1024x500.png` | 1024 × 500, RGB PNG |
| Banner master | `play-store/banner/dewhaven-banner-master-2048x1000.png` | 2048 × 1000, RGB PNG |
| Video / social banner | `play-store/banner/dewhaven-banner-1920x1080.png` | 1920 × 1080, RGB PNG |
| Eight phone screenshots | `play-store/screenshots/01-…` through `08-…` | 1080 × 1920, RGB PNG |
| Landscape trailer | `video/dewhaven-trailer-landscape-1920x1080.mp4` | 30 seconds, 1920 × 1080, 30 fps |
| Vertical trailer | `video/dewhaven-trailer-vertical-1080x1920.mp4` | 30 seconds, 1080 × 1920, 30 fps |
| Trailer posters | `video/*-poster.png` | Matching landscape and vertical formats |
| All eight screenshots at a glance | `dewhaven-collection-overview.png` | Contact sheet for review |
| Editable source | `dewhaven-remotion/` | Remotion project with all media bundled |

Open `index.html` for a local gallery with both videos and all graphics. Checksums and inspection results are in `ASSET-MANIFEST.json` and `evidence/verification.json`.

## Screenshot order

1. **Your farm. Your fresh start.** — Farming, planted rows and tool controls.
2. **Little towns. A world of stories.** — Dewhaven's village square and houses.
3. **One more cast. One quieter moment.** — Fishing at the lake pier.
4. **Small friends. A place to belong.** — Barn animals and everyday care.
5. **Take the scenic route.** — Paths and buildings in Sunridge.
6. **Leave the road. Find your own story.** — Woodland exploration.
7. **A quiet valley. A hidden mystery.** — Native Tide Vault gameplay.
8. **Every day writes a new chapter.** — The actual quest journal and chapter navigation.

## Video and editing

The first three seconds establish the inherited farm. A cut to the vault at three seconds introduces the mystery. Farming, town life, fishing, animals and exploration build the promise of a life in the valley. The final three seconds show the wordmark and illustrated key art.

The first 27 seconds show native game footage. Landscape uses a wider cinematic capture with the HUD hidden; vertical uses a portrait capture with the HUD visible. The soundtrack uses original game music and physical foley. English headlines carry the narrative when audio is muted. There is no spoken voiceover. The `.srt` and `.vtt` files record the on-screen English copy.

In `dewhaven-remotion`, run `npm ci`, then `npm run dev`. Open `http://localhost:3214/Dewhaven-Landscape` or `http://localhost:3214/Dewhaven-Vertical`. Select a scene under **Editable-Scenes** to edit it independently. Run `npm run render` to export both MP4s. Update the Chrome path in `render-campaign.mjs` when using another computer.

## Artwork and provenance

The icon and key-art landscape were created with the built-in image generation tool. Exact prompts are in `production/image-generation-prompts.json`; original generated files are retained in `source-art/`. Typography and asset sizes are composed in Remotion. All store screenshot game content was captured from the native game; it is not generated UI.

The icon and banner contain no people. Gameplay keeps the farmer in rear view. No full-face portrait artwork or resident portrait panels are used. Tiny original background NPC sprites can appear in native town footage.

Capture used an isolated demonstration save with prepared crops, animals and destinations. It does not represent a natural complete playthrough. Shipping game code, the existing APK and player save files were preserved. This delivery does not certify physical-device release readiness.

Fraunces and Nunito are bundled with SIL Open Font License notices. Audio provenance is retained in `dewhaven-remotion/CREDITS/`. No stock commercial song or outside character franchise is used.

## Play Store placement

Upload the 512 px icon, the 1024 × 500 feature graphic and the eight numbered screenshots to the English store listing. Keep larger files as masters. The preview video field takes a YouTube video URL; upload the MP4 separately as public or unlisted, with monetization disabled. This package does not upload or publish anything.

Dimensions and presentation follow Google's [preview asset guidance](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en). Alt text is in `play-store/alt-text.csv`.
