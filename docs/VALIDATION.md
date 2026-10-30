# Dewhaven 1.3 validation

Verified locally on **13 October 2026**. Android portrait phones are the primary target. Browser checks use installed Google Chrome; native checks use the project's disposable Pixel 6 / Android 16 emulator. The APK hash in `android-verification.json` matches the final artifact in `release/build.json`.

| Check | Result | Coverage |
| --- | --- | --- |
| Simulation, movement and world tests | **40 passed** | Sixteen-chapter progression, farming, economy, saves, migration, paths, every doorway/return point, grounded sprites, timed tools, vaults, gatherings, relationship choices and offline ad initialization |
| Browser flows | **31 distinct scenarios passed** | Full 30-scenario run, followed by 12 focused control/ad/lifecycle checks including one new initial/duplicate Android resume regression |
| Responsive menu audit | **135 views passed** | 45 dialogs/tabs at 1440×900, 390×844 and 320×667; zero clipped text, horizontal overflow, small non-calendar text or runtime errors |
| Touch layouts | Passed | 320×667, 390×844 and 412×915, floating/fixed controls, left/right layouts, default 48 px shortcuts and 88 px action, maximum size/height, two-finger input, persistence and reset |
| Strict TypeScript and production bundle | Passed | Local assets/fonts, production-only development API removal, 41-file offline cache |
| Android build and lint | Passed | APK and unsigned AAB; version 1.3.0, code 4; application lint: 0 errors, 38 warnings |
| Final native Android integration | **15 checks passed** | Offline start, cinematic opening, full display, furnished farmhouse/bed, floating movement, tools, Back, backgrounding, plugins, export, restore, all new towns, generated art, journal targets and real keyboard resizing |
| Real Google demo ads | **5 checks passed; final reward claim not verified** | Native adaptive banner, visible three-button navigation clearance, full gameplay viewport, interstitial preview and completed rewarded preview; further testing stopped at the user's request |
| Production browser offline reload | Passed on the preceding bundle | 41 cached files and saved farm retained; the final APK separately passed offline native startup and restoration |
| Local rendering sample | Passed | Ten scenes; at most three cached backgrounds; desktop Chrome p95 canvas draw cost 0.6–1.6 ms |

The final focused browser runs cover real farmhouse entry/exit, all three vaults, calendar attendance, friendship choices, chapter replay, held tools, generated inventory art, ordinary shipping/sleep, late-game crafting/proposals and disabled use/shipping controls for atlas discoveries. The unit progression test finishes all sixteen main chapters through farming, shipping, crafting, ore gathering, mechanisms and town gatherings instead of assigning completion statistics. It also validates a save roundtrip after the ending.

Full-bag vault tests verify that one free slot is insufficient for two new reward types, failed attempts leave the entire state unchanged, and a successful discovery cannot be shipped or gifted. Mechanisms, treasures, weekly events and relationship choices cannot grant duplicate rewards. Original saves gain the new residents, journey fields and bounded ad history without losing gold, friendship or farm progress. Reward tests reject missing, skipped, duplicated and unshown receipts; cap energy and daily claims; serialize full-screen requests; protect the opening; enforce cooldowns; and leave web preview ad-free.

## Presentation and performance

The native world fills the logical **412×915** display. The disposable emulator uses a 540×1200 framebuffer at 210 dpi with software graphics and Vulkan disabled. There is no gameplay title, greeting, large bottom navigation card, world label or quest sidebar. Item illustrations and inventory cells have transparent backgrounds, without square plates. Tool shortcuts form a compact grid on the action side, mirrored for left-handed controls, leaving the movement corner clear. Interior screens have an opaque charcoal background below their floors on tall phones. Controls float above the world; menus pause time and release movement. Four original paintings and two concise guides form the opening. Small pixel faces remain visible as requested; generated paintings and item art contain no people or animal faces. Audio is original nature ambience and physical foley, without instruments or music.

The final menu audit finds no overlapping chapter titles or horizontal clipping. Ordinary supporting text is at least 14 px, body copy 16 px, and decorative captions 13 px. Only compact calendar headings use 12 px; dates use 16 px. The audit rejects visible non-calendar text below 13 px or calendar text below 12 px. Chapter controls use numbers/icons with accessible titles and 44 px or larger native targets. At 390 px wide, the bag and journal fit the screen; the longest audited dialog scroll at 320×667 is 157 px. Gameplay and cinematic pages have no page scrolling. Catalogs remain paged.

Static terrain, meadow patches, flowers, floor detail, walls, window light and fixed tree shade are painted when a location loads. An LRU cache retains at most three location/season backgrounds. Water tiles, moving grass and props outside the camera are culled; particles expire. Display settings provide wider/closer framing, reduced motion and 30/60 fps rendering. `world-performance.json` records 69–73 frame samples per scene in an isolated 390×844 Chrome touch viewport. These are desktop CPU draw measurements, **not a frame-rate guarantee for physical Android phones**.

Native verification ran with networking disabled before first launch. The final app had no runtime exception, app crash or app ANR. Android Back closes a panel before pausing the game; backgrounding saves progress and releases controls. Export creates a private JSON file for the native share sheet without selecting a recipient. The test confirms physical window focus and real keyboard resizing. The report includes the tested APK's SHA-256.

## Artifacts and reproduction

`release/Dewhaven-debug.apk` is a debug-signed installable test build, **17,187,192 bytes**. `release/Dewhaven-unsigned.aab` is **14,773,394 bytes** and contains no release signature; it needs the owner's upload key before Play submission. Package ID: `com.fajar.dewhaven`; version 1.3.0; version code 4; compile/target SDK 36; minimum SDK 24. Exact hashes are in `release/build.json`. Additional testing was stopped on 13 October 2026 at the user's request; the final APK is ready for installation.

```powershell
npm test
npm run test:e2e
npm run android:build
node tools/verify-android.mjs
node tools/verify-ads-android.mjs
node tools/audit-ui.mjs
node tools/inspect-expansion.mjs
node tools/verify-offline.mjs
```

Set Java 21 and `ANDROID_HOME` for Android tasks. The native verifiers refuse any device except the dedicated `dewhaven_sdk_13_qa` emulator, default serial `emulator-5572`, and use CDP port 9233. This separate device avoids interference with other projects. They install and clear only this app on that disposable device. No personal phone or unrelated emulator is modified. Browser tests/audits use port 5176; production offline verification uses port 4176. Development intentionally has no service worker; native Android packages its assets directly.

Reports: `ui-audit.json`, `android-verification.json`, `admob-verification.json`, `offline-verification.json`, `world-performance.json` and `../release/build.json`. Screenshots show all new regions, interiors, story paintings, generated inventory, settings and native menus. Artwork provenance is in [ASSETS.md](ASSETS.md), [CINEMATIC-ART.md](CINEMATIC-ART.md) and [ITEM-ART.md](ITEM-ART.md).

Physical-phone performance and tactile vibration quality remain unverified. No store publication or production signing key was created. Rating records clearly labelled local feedback. Both source asset directories remain unmodified.
