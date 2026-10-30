# Dewhaven

An original Android farming and life simulation, designed for phones in portrait orientation. English is the default language, with an optional Indonesian translation. The world fills the screen; charcoal, ivory, and bronze controls float above it, with large touch targets and short, paged menus.

## Android

The installable test build is `release/Dewhaven-debug.apk`, version **1.3.0**. `release/Dewhaven-unsigned.aab` is the release bundle for signing with the owner's upload key before submission to Google Play. Package ID: `com.fajar.dewhaven`. Neither artifact has been published to a store.

```powershell
npm install
npm run android:build
```

Building requires Java 21, an Android SDK with platform/build tools 36, Python with Pillow, and `ANDROID_HOME` configured. The build script bundles the game, syncs the native project, prepares branded Android icons/splash, runs Gradle APK/AAB builds and lint, then copies both artifacts and SHA-256 hashes into `release/`.

All game assets and fonts are packaged in the app. Android can start and play offline without first opening a website. The app locks to portrait, handles the Android Back button, pauses and saves on backgrounding, provides optional light vibration, and uses the Android share sheet for stories and save exports.

## Play

Create a farmer, name the farm, and choose one of three save slots. Four original cinematic paintings introduce Grandmother's letter, the valley, your homestead, and the first morning. Two short guide pages explain controls and the daily loop. The opening is skippable and can be replayed from About. Continue loads an existing story without resetting progress.

| Touch control | Action |
| --- | --- |
| Floating joystick | Touch the movement side, then drag; push past the rim to run, release to stop |
| Action button | Tap to work; hold to keep tending nearby plots or resources |
| Tap the world | Walk to a place or interact with a patch, neighbor, or door |
| Four tool shortcuts on the action side | Gather, hoe, water, or plant; tap Plant again to change seeds |
| Tool icon with three dots | Choose any of the seven tools, including axe, pickaxe, and fishing rod |
| Bag | Eat, use, and ship items |
| Journal | Story chapters, village requests, and rewards |
| More menu | Map, shipping, shops, crafting, neighbors, animals, improvements, and settings |
| Pause | Resume, save, settings, or return to title |
| Android Back | Close a panel, then pause gameplay |

Wake at 6 am and step outside the farmhouse. Your first promise is to plant three seeds: hoe, plant, then water. Tend crops and animals, explore the valley, and ship produce before sleeping at home. The next dawn settles earnings, advances watered crops, restores energy, and offers one useful task. Coins fly into the gold counter when you receive payment. Four seasons each last 28 days. Eat or rest to restore energy during the day. Passing out at 11 pm costs some gold.

Tool swings change the world at contact. Water arcs toward the soil with drops, splashes, and lingering ripples; plants respond to the impact. Soil, seed, harvest, timber, and stone actions have distinct effects and physical sounds. The playing screen has no greeting, title, bottom navigation card, building labels, or quest sidebar.

Settings opens five short sections. Controls can change floating/fixed movement, dominant hand, size, opacity, thumb height, sensitivity, dead zone, camera follow, tap-to-walk, running, held actions and vibration. Display can hide the HUD, reduce motion, widen/close the outdoor view and choose 30 or 60 fps. Reset controls preserves the farm and other preferences.

Enter homes and shops through their doors. Use the bed, kitchen, counters and residents inside, then leave through the hallway to return to the same doorstep. The calendar's Town gatherings tab shows three weekly events and their offerings. Completed story chapters can be read again from their journal buttons. Relationship moments unlock through friendship; a partner can share a daily walk.

## Development preview

Open **http://localhost:5176/** while the development server is running.

```powershell
cd 'E:\Harvest Moon GPT 61'
npm install
npm run dev
```

The browser preview is for development and responsive testing. Keyboard support is available for debugging; Android instructions and controls use touch.

| Control | Action |
| --- | --- |
| WASD / arrow keys | Walk |
| Shift | Run |
| Click / tap the world | Walk to a place or interact with a target |
| E / Space | Use the selected tool or interact nearby |
| 1–7 | Gather, hoe, water, plant, axe, pickaxe, fishing rod |
| B / J / M / C / F | Backpack, journal, map, calendar, crafting |
| Esc / P | Pause |

## Included

- Twenty-six playable scenes: eight outdoor regions, fifteen furnished interiors and three puzzle vaults. Four towns include Dewhaven Village, Aster Quay, Sunridge and Briar Hollow; the five-floor mine remains available.
- Eight crops with seasonal planting, overnight growth, fertilizer, corn regrowth, sprinklers, a scarecrow, and a greenhouse unlock.
- Inventory, seed/supply/animal shops, shipping, cooking, ten recipes, renewable forage, timber, stone, copper, iron, and moonstone.
- Sixteen main chapters with 32 written story pages, nineteen side requests, eight achievements, four seasonal festivals, three weekly town gatherings and birthdays.
- Nine residents, six adult romance candidates, eighteen written friendship moments with choices, daily conversations/gifts, favourite items, partner proposals and daily partner walks.
- Three persistent vault puzzles with unique chart, lens and compass discoveries; capacity checks and once-only treasure rewards.
- Thirty-two original generated item illustrations in two transparent atlases, without square plates or inventory card backgrounds, including crops, food, ore, equipment and discoveries.
- Chickens, pigs, and rabbits with daily feeding, petting, produce, and affection.
- A timed three-reel fishing minigame and four fish species, including a rare evening moonfish.
- Farm expansion, house/tool/backpack upgrades, and four skills that improve with practice.
- Branded splash and app icons, a painted title, four cinematic story pages, two concise guides, illustrated home/dawn scenes, new/continue game, settings, about, share, and rating screens.
- Three local save slots, autosave, manual save, JSON export/import, and strict save validation. Menus pause game time.
- Original nature ambience and activity sound effects. No music or instrumental audio. Pixel sprite faces use the original assets, including character previews, as requested.
- Readable text, keyboard navigation, touch controls, shorter menus, and paged catalogs.
- Android AdMob demo ads: adaptive banners on title/pause, sparing interstitials between days and voluntary rewarded energy at home. Ads are muted, preserve controls and time, and never cover gameplay. [Integration and test policy](docs/ADMOB.md).

Progress and preferences are stored locally on the current device. Export a save for backup or transfer. Rating records local feedback; sharing opens the Android share sheet for your farm's story. There is no public store listing or hosted multiplayer service.

## Production / offline

```powershell
npm run build
npm run preview
```

Open **http://localhost:4176/**. The optional browser build includes a web manifest and a service worker that caches the game, fonts, icons, and sprite atlases. Open this browser version online once before playing offline. The Android app packages the same assets directly and skips the service worker.

## Development

The simulation is independent of rendering: `src/game` contains content, economy, progression, and save validation; `src/world` contains maps, collision, pathfinding, sprite placement, and rendering; `src/ui` and `src/main.ts` implement the app flows. Audio is generated locally through Web Audio noise and physical foley.

```powershell
npm run test        # Simulation, progression, collision, sprite foot placement
npm run test:e2e    # Chrome browser and touch flows
npm run typecheck
npm run build
```

Browser tests use the installed Google Chrome. `tools/audit-ui.mjs` captures desktop/mobile views and reports clipped text or long dialogs. `tools/render-icons.mjs` rasterizes the original vector app icon. `npm run assets` rebuilds the additional sprite atlas from the local licensed source directories; it needs Python and Pillow.

`tools/verify-android.mjs` checks the installed debug APK on the dedicated `dewhaven_portrait_qa` emulator, including an offline first launch, portrait controls, native Back/background handling, save export, and restore. It does not run against a personal phone.

Asset provenance is recorded in [docs/ASSETS.md](docs/ASSETS.md), with painting prompts in [docs/CINEMATIC-ART.md](docs/CINEMATIC-ART.md). The portrait redesign is described in [docs/immersive-redesign.md](docs/immersive-redesign.md). Verification details are in [docs/VALIDATION.md](docs/VALIDATION.md).

The new towns, story, interiors, controls and performance approach are described in [docs/EXPANSION.md](docs/EXPANSION.md). Generated item prompts and paths are in [docs/ITEM-ART.md](docs/ITEM-ART.md). `tools/prepare-world-art.py` rebuilds the small local furniture/terrain-detail atlas and converts the original generated PNGs to runtime WebP. Static backgrounds are cached with a three-location limit; moving water, props and grass outside the camera are culled.
