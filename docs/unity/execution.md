# Unity execution ledger

Plan: `docs/superpowers/plans/2026-10-14-dewhaven-unity.md`.
Spec: `docs/superpowers/specs/2026-10-14-dewhaven-unity-design.md`.

15 October 2026: user authorised execution and explicitly requested Unity MCP.

## Rulings

- This workspace has no Git repository. Directory isolation at `unity/Dewhaven` replaces a Git worktree; the existing web source and release artifacts are preserved.
- The shared MCP endpoint on port 8080 still targets `D:/MCP Unreal Unity Godot Blender/projects/Unity-MCP-Local` with the saved `ArgonRoguelikeMain` scene. No mutations were made there. Dewhaven gets a dedicated editor and MCP server on loopback port 8094, with no global Codex configuration changes.
- Keep verification focused, as requested by the user. Check meaningful state changes and compile/visual milestones; do not repeat the old emulator campaign.
- Interior schematic sizes in the atlas are planning footprints. The first native rooms use compact portrait layouts (18–22 tiles wide) so the bed, kitchen, counter and doorway remain readable. The house order adds a furnished studio and an actual workbench.
- Dialogue may occupy slightly more than 44% of a short display. A 364-unit minimum and measured sentence pagination protect 18-point body text and two 48-unit responses; larger text stays readable.

## Voiceover addition — 19 October 2026

The user explicitly requested English Deepgram narration for every intro and main-quest passage. Generated speech now covers the four intro pages and objective/opening/completion for all 24 main chapters: 76 passages, 177 unique sentence clips, 16 Aura-2 voices and 550.88 seconds. Source PCM originals and a deterministic generation manifest are retained under `art/voice/deepgram-v1`; native copies are imported as mono 24 kHz Vorbis at quality 0.85, with background loading and no preload. Only the current sentence is held by the speech player. No runtime synthesis or generation credential is required.

The intro subtitle uses “the homestead” instead of interpolating a farm name into a prerecorded line. Player/farm save identity remains unchanged. Main-quest dialogues use measured sentence pages, manual Continue and Replay, exact subtitle matching and independent voice preferences. Journal objectives now read canonical quest rules: three old apostrophe differences had prevented their VO. Voice preference migration preserves existing control/sound settings. Nature and physical sounds duck during speech; there is no music.

The provider's real WAV response used streaming length placeholders. A narrowly scoped header normalizer repairs those observed placeholders without changing samples; two focused Node checks passed and reject incomplete/non-audio responses. All 177 originals passed format/duration/non-silence audit. Unity imported every clip successfully. Twenty-five focused domain checks passed, including full 76-passage coverage, additive preference defaults and sentence pagination.

`native-voice-check.json` records actual AudioSource playback, page cancellation/replay/mute, one loaded clip, retained intro/dialogue background pause/resume with no clock movement, and ordinary-shop invalidation. Its main hand-in uses deliberately satisfied requirements; it is not a natural campaign playthrough or a phone test. `native-voice-visual-check.json` additionally checks the three repaired journal triggers and stages 360 × 640 views at 135% text. Replay/Skip received solid warm surfaces, and settings tabs use short Input/Audio/View labels to avoid splitting words.

A requested independent review seat could not run because of its agent usage limit; no independent review success is claimed. A bounded self-audit covered the player/load cancellation, exact text/page mapping, preferences, lifecycle/ad pause ownership and generation credential handling. No emulator campaign was started. Physical audio routes/focus, phone performance and a full human listening review remain open.

The dedicated editor completed the separate **2.2.0 / code 12** APK at `release/Dewhaven-Unity-2.2-VO.apk`, 77,208,840 bytes, SHA-256 `6efc8cab12499d072635e594aa6b1ca1b684b7bc6330df00984500f135765e8e`. Thirty fresh package/evidence checks passed: v2 signature, non-development ARM64 portrait/API 26–36 settings, all 177 voice resources, 14 HUD resources, Ads/consent/picker classes, ZIP/native 16 KB alignment, and unchanged hashes for all three older APKs. The credential inspection covered 274 selected source/config/document files and every one of the APK's 1,197 decompressed ZIP entries; no supplied-credential marker was found. Scope/exclusions are recorded in `voiceover-security-audit.json`; the exact APK is bound by its SHA-256. The release info, README and checksum describe this candidate without claiming phone or production acceptance.

## Previous campaign milestone — 18 October 2026

The native campaign implementation now extends beyond the 15 October farming preview. The new version is **2.1.0 / code 11**; its Android package is built separately from both previous APKs. Content implementation and editor evidence below do not constitute physical-device acceptance or a completed AAA production.

| Plan scope | Implemented in the native player | Acceptance still open |
| --- | --- | --- |
| Tasks 1–7 | Bundled title/intro/four looks, three slots, flexible touch controls, physical tools/farming/commerce, scheduled residents, maps/journal/settings, nature/foley | Android touch, keyboard, navigation bars and device performance |
| Tasks 8–11 | Four towns, 13 exteriors, 48 interior venues, 15 distinct vault rooms, five mining floors, physical restoration sites and nine persistent puzzles | Complete natural traversal and deeper visual finishing of every location |
| Task 12 | 24 main chapters, 60 requests, 12 annual contributions, four weekly tables, four public-room repairs and next-dawn convoy collection | Full-length campaign/economy pacing and individual event presentation review |
| Task 13 | 36 authored conversations across six adults, location/heart/day requirements, proposal, household task, breakfast/evening interactions | Each complete relationship path played naturally |
| Task 14 | Official Google demo ads, muted audio, lifecycle ownership, native document picker, preview/slot confirmation, permanent import archives | Actual ad impressions, navigation-safe placement and picker/share round trip on Android |
| Task 15 | Sandstone menus, generated HUD/item art, measured dialogue pagination, selected recorded foley, non-development ARM64 package preparation | Physical CPU/GPU/memory/loading/thermal measurements, production signing and Play setup |

### Observed 18 October evidence

- The dedicated editor identity was checked again through MCP: `E:/Harvest Moon GPT 61/unity/Dewhaven/Assets`, Unity 6000.3.20f1. Only loopback port 8094 was used for mutations. Other live Unity projects were left alone.
- A source snapshot was saved before implementation: `tools/.cache/native-before-oct18.zip`. No master/reference assets or existing APK were replaced.
- `tools/author-unity-campaign.py` writes playable native definitions: `campaign.json`, `bond-scenes.json`, `vault-puzzles.json`, `worksites.json`, and `calendar-activities.json`. The older atlas remains a design reference and is not an embedded WebView.
- Content validation created all **81 areas**, examined **325 interaction anchors**, **84 quest bindings** and **36 bond scenes**, with zero reported issues. Entrance-to-anchor grid reachability was checked with restored access. This does not prove phone traversal or every intermediate story state.
- The actual native player integration exercised all **15 vault chambers**, **nine control sequences**, forward locks, three unique relics, return shortcuts and save/reload. The check routed to/warped between reachable anchors; it did **not** simulate touch traversal. All **24 chapter hand-ins** passed with deliberately satisfied fixtures; this is not a natural full-campaign playthrough. Evidence: `native-campaign-check.json`.
- A final representative native farming day passed after the changes: till/plant/water, ripe gathering, physical seed purchase and conversation, shipping, sleep/payment/growth, reload, slow-step fence collision, failed-save feedback and background/resume ownership. Evidence: `native-day-check.json`.
- Focused EditMode checks finished **20 passed / 0 failed**, 0.496 seconds, after observed failing cases for the changed systems. They cover transactions, pauses, tool impacts, backups, quest/puzzle rewards, gatherings/bonds, storage/equipment, legacy migration and ad receipts. Evidence: `tools/.cache/campaign-domain-final.json`.
- Independent review identified three important issues, all repaired and covered: replaced-slot imports now archive the old farm outside rotating backups; removed ore/forage no longer retains invisible colliders/resources; malformed legacy entries and null native plots reject safely. Imported vault totals and the old whole-field irrigation benefit were also restored without paying rewards twice.
- Actual native captures of all four town streets, a Tide Vault room, puzzle diagrams, calendar and dialogue were inspected. A **360 × 640** preview with **135% text** retained readable paginated dialogue, a three-control diagram and map actions. Captures are in `captures/campaign-*.png`; these are editor renders, not device screenshots.
- Rabbit animation and two terrain textures were copied from the existing licensed master, without editing it. Eleven selected physical foley clips came from Kenney's CC0 RPG Audio pack. `foley-sources.json` records source, selection and hashes; no music, instrument or preview-mix clip was imported.
- Official Google Mobile Ads Unity **11.6.0** and EDM **2.1.0** resolved in this project. The Android dependency declarations use Google Ads 25.5.0 and UMP 4.0.0. Only Google's demo app/unit IDs are configured. Banner reservation occurs only after a real banner loads on title/pause; gameplay and forms hide it. Reward grants require a captured earned receipt; cooldown spans slots and fullscreen formats.
- No Android device was attached when checked. No emulator was started. Actual device performance, real ad display and native document-picker behaviour remain unverified.
- The first Android 2.1 build succeeded at 72,802,215 bytes. Independent inspection verified its v2 signature, ARM64/portrait/API levels, non-development player, Google demo application, real Ads/UMP/picker DEX classes, content/HUD resources, ZIP alignment and every native ELF load segment's 16 KB alignment. This initial package was superseded by the final form fix, not delivered as final.
- A native title → name form → banner-layout-callback reproduction initially failed: banner surface remained 1 and the callback removed both input fields. Releasing the title/banner surface when entering the name page fixed the cause. The same reproduction passed with surface 0 and both inputs intact. `native-form-banner-check.json` records this UI-state check; it does not claim a real ad impression. A final Android build was queued with this fix.

### Android release boundary

`BuildProject.QueueAndroid` writes `android-campaign-build-result.json`. Only a successful result and the independent package check permit publishing new APK metadata. `tools/record-unity-campaign.py` checks the signed package, version, portrait/ARM64/API levels, demo app ID, Google Ads/UMP and native save-picker DEX classes, generated HUD/content resources, and unchanged previous APK hashes. Result files are recorded after the build completes.

The demo app's missing publisher-consent configuration has a test-only fallback to non-personalised demo requests. A live release requires the owner's AdMob IDs/consent messages, signing key, store listing/rating URL and device acceptance. The Rate action currently explains that the listing is available at launch; it does not open a fabricated listing.

### 19 October finalization

- Continued in the same dedicated project/editor; MCP identity again confirmed Unity 6000.3.20f1, not compiling or playing.
- Two season-boundary cases first failed: a zero-valued greenhouse flag allowed out-of-season planting, and expired crops survived the season change. A shared positive-level/season rule now governs planting and dawn crop cleanup; a restored greenhouse preserves the crop. The optional woodland bridge also requires a positive restoration level, preserving locked legacy flags at zero.
- After that correction, **22 focused checks passed / 0 failed**, 0.531 seconds. This supersedes the earlier 20-test final result. No emulator or repeat multi-day campaign was run.
- The form-fix APK had already built successfully at 72,804,371 bytes. A final version-2.1 build was queued after the season correction; publish the new metadata/checksum only after observing its result and inspecting that exact APK.
- **Final build observed:** `release/Dewhaven-Unity-2.1.apk`, version **2.1.0 / code 11**, **72,797,467 bytes**; completed 19 October in Jakarta (18 October 21:22:27 UTC). SHA-256: `7f08e766d53e85ae8e873a252526fdbe38040ef879da27ac551aae6f0eb7899b`.
- `record-unity-campaign.py` passed all **20 package/preservation checks** on that final APK: verified v2 signature, non-development portrait ARM64 player, API 26/36, demo app ID, real Google Ads/UMP/save-picker classes, all 14 HUD resources and native campaign/bond/puzzle resources, 16 KB ZIP/ELF alignment, and unchanged web/Unity preview hashes. Metadata, install/readme notes and checksum were written beside the APK. These packaging checks do not replace device acceptance.

## Historical progress — 15 October preview

- [x] Read-only shared MCP identity check: Unity 6000.3.20f1, Android target, not playing/compiling/updating; unrelated Argon scene left intact.
- [x] Dedicated Dewhaven editor connected and identity verified through MCP: `E:/Harvest Moon GPT 61/unity/Dewhaven/Assets`, Unity 6000.3.20f1. The shared editor was never switched.
- [x] Native preview artifact delivered: working first-day foundation, updated generated HUD, bright sandstone menus and signed Android APK. This does not close the broader content tasks below.
- [ ] Task 1: project, selected art, title and farm boot.
- [ ] Task 2: clock and safe saves.
- [ ] Task 3: touch controls and tools.
- [ ] Task 4: complete farming day.
- [ ] Tasks 5–7: inhabited Dewhaven, physical services, maps and app shell.
- [ ] Milestones B–D: regional expansion, story, Android integration, polish and release.

Tasks remain open where their full acceptance criteria extend beyond this first native preview; data catalogue coverage is not finished level authoring.

Build/test evidence is recorded here only after observing results.

## Observed evidence

- Installed 2D URP template extracted into the dedicated project; Android SDK/NDK/OpenJDK modules exist.
- Package lock resolved: URP 17.3.0, Input System 1.17.0, Newtonsoft 3.2.2, Test Framework 1.6.0, Unity MCP 0.93.4.
- Selected local imports: four packed sprite atlases, terrain, 28 original character families with their source metadata, 32 alpha item crops, four converted opening paintings, original emblem and locally converted OFL fonts. Master/reference files were not changed.
- MCP configured 70 textures for pixel or smooth sampling, and native Android portrait player settings.
- Six focused EditMode domain checks: initial RED 5 failed / 1 passed; after implementation and error handling repair, GREEN 6 passed / 0 failed (0.335 seconds). Checks exercise nested pause ownership, one-day crop/shipment settlement, successful/stale/full-bag transactions, one tool impact over a slow frame, and validated backup recovery/rejected negative quantities.
- Unity MCP itself emits a generic project-path-spaces error on domain reload. Paths are explicitly quoted and guarded; connection, scripts and tests have worked at the required workspace path. This plugin diagnostic is recorded separately from application compile/runtime errors.
- Native Bootstrap, custom splash, title, four opening paintings, two-step name/appearance setup, onboarding, safe-area HUD and five settings tabs now run in the dedicated Unity player. Four distinct source sprite families are used for travellers, without colour-swapping one body.
- One actual native UI day passed, including hoe/seed/water impacts, ripe gathering, seedhouse purchase, daily conversation credit, shipping, sleep, dawn payment/growth, reload and a long-step fence collision check: `native-day-check.json`.
- The short review found five concrete issues, now repaired: save failures no longer show success or leave the current farm; backup-only slots remain occupied and corrupt-primary recovery preserves the valid backup; short dialogue and onboarding receive enough space; paid tool/house upgrades give real benefits and have level caps; backgrounding invalidates commerce, releases held actions, and acquires only one pause owner.
- After those save/lifecycle changes, the same six domain checks passed (0.300 seconds), and the native day additionally passed failed-storage and repeated background/resume checks. A separate MCP call confirmed that the first intro can background before player input is initialized.
- Adaptive and legacy Android icons are configured; the native custom splash replaces the engine splash.
- The first native ARM64 IL2CPP APK build succeeded. Actual APK size: 74,632,812 bytes; the initial BuildReport total also counted ancillary build output, so the build helper now reports the APK file's own length.
- Latest user direction replaces almost-white menu surfaces with a bright sandstone/champagne wash, espresso text and bronze actions. It does not change the daytime world into a dark theme.
- Fourteen separate transparent HUD illustrations were created with built-in image generation: hoe, water, seeds, axe, pick, bag, empty work glove, rod, door, speech, map, journal, menu and wheat coin. All alpha channels were verified. Originals and prompts are preserved in `art/generated/hud-v1` and `hud-icon-generation.json`; Unity imports each at 256 pixels without mipmaps.
- Actual native captures of the new HUD, shop, inventory, menu and square town map were inspected. The active tool has a thin ring; the coin pulses/tilts and its displayed balance eases to the actual value. Reduced motion suppresses these animations.
- A first-frame particle initialization issue discovered in the watering capture was repaired: newly enabled pooled effects now receive their tint and scale before rendering, avoiding an initial white disc.
- Final updated build succeeded through dedicated MCP. APK: `release/Dewhaven-Unity-preview.apk`, 104,570,868 bytes, SHA-256 `b63c0748062a390d9349eaea81d5f3cefe71afe091f74dbd685f4b0374281c13`. Bundled SDK tools verified the v2 signature, portrait orientation, ARM64 architecture, minimum API 26 and target API 36. All 14 HUD resource paths are present in the APK; the build asset report lists each icon at 256.1 KB.
- `release/Dewhaven-Unity-preview-info.json`, the adjacent README and checksum record the artifact and outstanding migration scope. The original web APK's hash was checked again and remains unchanged. No emulator or physical-device test campaign was restarted.
- The previous web APK is preserved with SHA-256 `F6858E64404DD911B224F1689BE5CFEC76AA8CE94C123E8FE4A16C749F612F92`.

Runtime regional composition is being used for the first playable slice: one native Bootstrap scene loads only the current region's geometry, actors and effects from the authored content catalogue. The imported atlas remains a planning reference, not an embedded browser runtime.

## Remaining migration work at the 15 October preview

The 15 October preview used the 81-area catalogue as scaffolding. Expanded quest/event/romance scripts, authored vault puzzles, Unity AdMob and legacy save import/export were subsequent work; their 18 October implementation is recorded above. Production signing, measured Android-device performance, natural campaign acceptance and further environmental art direction remain open. No store-release or AAA-completion claim is made.
