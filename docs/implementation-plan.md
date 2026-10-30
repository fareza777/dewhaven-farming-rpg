# Dewhaven implementation plan

Goal: deliver a playable farming game and all requested app flows in E:/Harvest Moon GPT 61.

Architecture: serializable, UI-independent simulation modules feed a Canvas renderer and HTML application shell. Sprite atlases keep rendering small and crisp. Stable content identifiers connect crops, shops, requests, recipes and saves.

Tech stack: TypeScript, Canvas 2D, Vite, Capacitor 8 for Android, Phosphor web icons, self-hosted Fraunces and Nunito; Node test runner and Playwright. Android portrait is the primary delivery target; the web build supports development previews.

Spec: docs/design.md.

## Constraints
- Work only in this workspace; source project and asset master remain read-only.
- Paid sprites stay local and are ignored by Git. Image generation receives text only.
- Complete the authorized implementation in this chat without additional approval gates.
- Rating records local feedback; no fabricated store links or review submission.
- Implement and verify in this session; no delegation unless needed by an explicit instruction.

## Tasks
- [x] Extract supplied atlas, additional buildings, NPCs, animals and farm icons; record provenance.
- [x] Create tests for farming, economy, calendar, progression and save corruption before implementing simulation.
- [x] Implement content, state, actions, inventory, quests, villagers, animals, fishing, cooking/crafting and improvements.
- [x] Implement five maps, collision, player movement, sprite animation, camera, seasons, weather and effects.
- [x] Implement title, onboarding, game HUD, inventory, journal, market, relationships, calendar, settings, about, share, rate and saves.
- [x] Add text-only generated brand art, original soundscape, manifest and offline support.
- [x] Run unit and browser tests, typecheck and production build; inspect desktop/mobile screenshots and correct issues.
- [x] Write player guide, validation results and startup instructions; show the finished game.

## Review focus
Save files must reject missing or unbounded values; failed transactions must leave state untouched; full inventories must not lose items; holding controls while opening dialogs must not cause unintended movement; resize/touch layouts must retain a usable toolbelt and action button.

## Android portrait follow-up
- [x] Replace the desktop gameplay navigation on phones with floating shortcuts and short tool/menu sheets.
- [x] Add a left joystick and contextual right action button with independent two-finger input.
- [x] Retain readable text, safe areas, 44 px minimum touch targets, pagination, and a game screen without page scrolling.
- [x] Animate all seven tools with a single impact, grounded feet, droplets, soil, wood, stone, and harvest effects.
- [x] Improve seasonal grass, wind animation, flowers, and visible-object rendering.
- [x] Add the native Android project, original launcher icons/splash, portrait orientation, and packaged offline assets.
- [x] Add Android Back, background save/pause, vibration, native sharing, and JSON export.
- [x] Restore nature audio from a suspended context when the player resumes after backgrounding.
- [x] Build the installable debug APK and unsigned release AAB; run strict TypeScript, Android lint, and simulation/touch tests.
- [x] Finish the disposable Android emulator integration report and final native screenshots.
- [x] Update the validation document with final results and deliver the Android artifacts.

## Version 1.1 immersive redesign
- [x] Replace the header, greeting, large dock, sidebar and world labels with a full-height portrait world and floating controls.
- [x] Package four text-only generated paintings, four written story scenes and two concise guide pages; record prompts and provenance.
- [x] Polish the splash/title, home and dawn scenes; begin new stories at 6 am and guide the first three-seed promise.
- [x] Add proportional analog movement, smooth acceleration/release, collision sliding and camera easing.
- [x] Apply world changes at tool contact and add arcing water, persistent ripples, plant response, footsteps and improved grass.
- [x] Add custom tool shortcuts, a tool library, coin flight/count animation and concise feedback.
- [x] Verify cinematic navigation, save continuity, timed impacts, overnight growth/shipping and separated controls at 320/390/412 widths.
- [x] Build version 1.1 APK/AAB and verify packaged artwork and offline browser loading.
- [x] Draw behind native camera cutouts while offsetting controls; verify the physical portrait display is completely filled on older WebViews.
- [x] Verify Android Back, background/resume, native export and offline restoration in the rebuilt version 1.1 app.

## Version 1.2 — The Unwritten Atlas
- [x] Review Opus locally as a control/menu/terrain reference while retaining original towns, characters and writing.
- [x] Make floating movement the default, with live control, display, sound, game and save settings.
- [x] Add three connected towns, fifteen furnished enterable interiors, and three persistent puzzle vaults.
- [x] Extend progression to sixteen main chapters and nineteen side requests, with rereadable chapter scenes.
- [x] Add three residents, eighteen relationship moments, partner walks and three weekly calendar gatherings.
- [x] Generate and integrate thirty-two inanimate inventory illustrations using text-only imagegen; record provenance.
- [x] Cache static environment detail with an LRU limit of three backgrounds; cull moving water, objects and grass outside the camera.
- [x] Verify the complete sixteen-chapter story using earned farming, crafting, exploration and event actions.
- [x] Test enter/exit paths for every map/building, atomic discoveries, legacy saves, floating controls and real touch flows.
- [x] Remove overlapping chapter titles, simplify the bag, and protect story discoveries from shipping/gifts; verify full-bag rewards remain atomic.
- [x] Build final APK/AAB 1.2.0, pass 15 native checks against the exact APK hash, and verify all 41 browser assets offline.
- [x] Finish the 126-view menu audit, record rendering samples and validation, and provide the final artifacts.
