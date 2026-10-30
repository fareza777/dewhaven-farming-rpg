# Dewhaven Unity Migration Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan task by task in the current session. The user requested design preparation while another agent occupies Unity. Do not connect to, change or switch that editor during the design-only stage. Native execution is the proposed method; no subagent dispatch is required by this plan.

**Goal:** build Dewhaven as an original Android portrait Unity farming/life simulation with four inhabited towns, physical services, authored interiors, dynamic residents and three coherent exploration dungeons.

**Architecture:** persistent C# domain state and a shared clock drive modular simulation services. ScriptableObject/JSON definitions describe regions, venues, residents, quests and puzzles. Unity scenes/prefabs present that state through bounded world loading, physics, navigation and distinct mobile views.

**Tech stack:** installed Unity **6000.3.20f1**, URP 2D, Tilemaps/Physics2D, uGUI/TextMeshPro, compatible Input System, Unity-compatible Newtonsoft JSON, and official Google Mobile Ads Unity plugin. Resolve compatible package versions in this editor and commit its package lock before content production; do not upgrade the shared editor.

**Spec:** `docs/superpowers/specs/2026-10-14-dewhaven-unity-design.md`.

## Global constraints

- English by default; UI ivory–charcoal–bronze, Fraunces/Nunito; body 16, dialogue 18, supporting 14, captions 13, calendar minimum 12 logical units.
- Android portrait, full viewport, safe areas, default flexible joystick; touch targets 48 and primary action 88 logical units.
- Pixel sprite faces allowed; generated paintings and item art contain no people/animals/faces; transparent inventory illustrations.
- Nature ambience and physical SFX only; no music or instruments; muted ads.
- Commerce/upgrades/cooking/shipping/rest/animal care require their physical place. The personal menu does not execute them.
- Author four towns, 13 exterior regions, 48 interior venues, 15 dungeon chambers and five mining floors: 81 playable areas in the final content milestone.
- 25 named residents with distinct sprite families; four distinct player looks; 24 main chapters, 60 side requests, 12 annual events, four weekly tables, six adult romance candidates and 36 bond scenes.
- Preserve the existing APK and source assets. Import version-1 saves explicitly; no assumption of direct WebView localStorage access.
- Create Unity work only under `E:/Harvest Moon GPT 61/unity/Dewhaven`; verify the connected editor’s project path before every new execution session.
- Keep verification focused on changed systems and milestone flows. Do not repeat the previous long emulator/ad campaign.

## Review focus

1. A pointer held during menu/background/ad transitions must release movement and repeat-tool input; it cannot trigger a response in the newly opened panel. Owned by Tasks 3 and 14.
2. A paid transaction with a full bag, insufficient material or a stale service session must leave both balance and inventory unchanged. Owned by Tasks 5 and 14.
3. A resident changing schedule area or passing through a door must have one view, use a valid landing and remain reachable for a conversation. Owned by Tasks 6 and 10.
4. A legacy or corrupt save must preserve the original slot and unique rewards; inserted story chapters must not erase prior completion or issue free rewards. Owned by Tasks 2, 9 and 13.
5. A narrow phone, large font, keyboard or returning navigation bar must retain readable text and reachable controls without collisions, scroll-covered actions or ad overlap. Owned by Tasks 3, 7 and 14.

## File structure

All following `Assets/...`, `Packages/...` and `ProjectSettings/...` paths are relative to the **new** `unity/Dewhaven` project. No listed file currently exists as a Unity implementation.

```text
Assets/Dewhaven/
  Art/{Common,Characters,Terrain,Towns,Interiors,Dungeons,Items,Cinematics,Brand}/
  Audio/{Nature,Foley}/
  Content/{Areas,Venues,Residents,Shops,Crops,Recipes,Quests,Events,Bonds,Dungeons}/
  Editor/{ProjectGuard,ImportContent,BuildRegions,BuildAndroid,ContentValidation}.cs
  Prefabs/{Player,Residents,World,Interaction,UI,VFX}/
  Scenes/{Bootstrap,Title,Farm,Dewhaven,TideVault,Regions,Interiors,Dungeons}/
  Scripts/
    Core/{GameSession,GameState,GameClock,PauseGate,ContentRegistry}.cs
    Simulation/{FarmingService,AnimalService,FishingService,CraftingService}.cs
    World/{AreaDefinition,PortalDefinition,SceneDirector,ChunkLoader,NavGrid,RoutePlanner}.cs
    Characters/{PlayerMotor,PlayerAnimation,PlayerAppearance,ToolController,TouchInput}.cs
    Residents/{ResidentDefinition,ResidentState,ResidentDirector,ResidentMotor}.cs
    Interaction/{IInteractable,InteractionContext,InteractionResolver,ServiceSession}.cs
    Economy/{CommerceService,ShippingService,UpgradeService}.cs
    Dialogue/{DialogueDefinition,DialogueContext,DialogueRunner}.cs
    Story/{QuestDefinition,QuestService,RestorationService,CalendarService,BondService}.cs
    Exploration/{DungeonDefinition,DungeonState,DungeonService,HazardController}.cs
    Persistence/{SaveV2Dto,SaveValidator,SaveService,LegacyImporter,AndroidSavePicker}.cs
    Presentation/{HudView,WorldMapView,DialogueView,ShopView,JournalView,ResidentView,SettingsView,SafeAreaRoot}.cs
    Audio/{NatureMixer,FoleyPlayer}.cs
    Android/{AndroidLifecycle,AdService,AdPolicy,AdReceiptStore,AdSafeArea}.cs
  Tests/{EditMode,PlayMode}/
```

Content starts from `docs/unity/data/*.json`; imports preserve stable IDs. `reference/places-draft.ts` is only source material for those planning files, not Unity runtime code. Scene authoring follows `docs/unity/presentation.md` and the atlas.

## Shared contracts

Define these contracts before their consumers. Use ordinary C# classes/structs compatible with the pinned editor; avoid unsupported language features or implicit Unity scene dependencies.

```csharp
public interface IGameClock
{
    int MinuteOfDay { get; }
    int TotalDays { get; }
    IDisposable Pause(string owner);
    void Advance(float elapsedSeconds);
    event Action<int> MinuteChanged;
}

public interface IInteractable
{
    string Id { get; }
    string ActionLabel { get; }
    bool CanInteract(InteractionContext context, out string reason);
    void Interact(InteractionContext context);
}

public interface IWorldTravel
{
    Task<TravelResult> TravelAsync(string portalId, CancellationToken cancellation);
}

public interface IServiceSession : IDisposable
{
    string ShopId { get; }
    bool IsValid { get; }
    TransactionResult Buy(string itemId, int quantity);
    TransactionResult OrderUpgrade(string upgradeId);
}

public interface ISaveService
{
    SaveResult Save(int slot, GameState state);
    LoadResult Load(int slot);
    ImportResult PreviewLegacy(byte[] json);
    SaveResult Import(int slot, ImportResult preview);
}
```

`InteractionContext` contains session ID, player area, grounded position, target anchor, clock and selected tool. `TransactionResult`, `TravelResult`, `SaveResult`, `LoadResult` and `ImportResult` are explicit success/failure DTOs with a player-facing error key, never a null success value. An `ImportResult` carries a validated candidate and source-file backup, not a mutable live session. All long-lived sessions can be invalidated by lifecycle/slot/travel changes.

## Milestone A — one complete farming day and a real town

### Task 1: isolated project, art imports and a playable boot

**Create:** new project, `ProjectGuard.cs`, `ImportContent.cs`, `ContentRegistry.cs`, Bootstrap/Title scenes, common atlases and import manifest.

**Consumes:** installed engine, the read-only source paths and asset mappings in `docs/unity/migration.md`.
**Produces:** a portrait player build that loads a title and one farm scene; a verified project identity and validated stable content registry.

- [ ] After the user reports Unity available, read `Application.dataPath`, editor version and opened scenes. Continue only when the editor is dedicated to this project; do not save or replace another project’s scenes.
- [ ] Create/open `unity/Dewhaven` using the installed 6000.3.20f1 URP 2D template. Set internal application ID `com.fajar.dewhaven.unity`, portrait orientation and the Android build profile.
- [ ] Add only compatible packages needed by the contracts. Record the package lock. Confirm Android build support through this project before importing the asset subset.
- [ ] Write the import manifest and copy common terrain, farmer, four look families, 25 resident families, chosen houses/furniture, brand, paintings and item illustrations. Preserve required prefab GUID dependencies; detect duplicates.
- [ ] Configure point sampling/16 PPU for world art and smooth alpha for painterly UI art. Make four player appearance definitions and 25 distinct resident definitions; create a contact sheet for review.
- [ ] Build Bootstrap → Title → Farm with no gameplay content beyond grounded placement and camera. A compile or missing-asset error stops this task; do not proceed by drawing coloured placeholder characters.

**Accept:** the new Android build boots offline into the real bundled title/farm, with crisp art, full portrait viewport and correct project isolation. Record one screenshot; no repeated emulator campaign.

### Task 2: domain state, clock and safe three-slot persistence

**Create:** `GameState.cs`, `GameClock.cs`, `PauseGate.cs`, `SaveV2Dto.cs`, `SaveValidator.cs`, `SaveService.cs`; `Tests/EditMode/ClockAndSaveTests.cs`.

**Consumes:** content registry and legacy crop/item/animal/quest IDs.
**Produces:** `IGameClock`, `ISaveService`, one `GameSession`, and serialized state independent of scene GameObjects.

- [ ] Define day/season/weather, player appearance/area/portal, inventory/shipping, plots, animals, friendships, skills, upgrades, quests, discoveries and ad history. Use dictionaries in domain state and explicit JSON DTO fields.
- [ ] Pin clock tests before implementation: two pause owners keep time frozen until both release; duplicate disposal does not resume another owner’s pause; one sleep advances crops/payment/date once.
- [ ] Implement minute ticks and weather/season rollover using the existing simulation values. Do not tie day length to frame count.
- [ ] Pin save tests: invalid quantity, NaN coordinate, duplicate relic receipt and oversized input reject; a failed replacement keeps the previous slot; corrupt primary can load a validated backup.
- [ ] Implement temporary write → flush/validate → replace with backup. Expose readable slot headers, explicit errors and an import preview; no silent reset on a file error.
- [ ] Run only the clock/save EditMode group. Add a real save/relaunch to the first-day acceptance flow.

**Accept:** three slots save and restore correct state, pause ownership is stable and interrupted writes preserve the prior valid file.

### Task 3: portrait controls, four looks and physical tool impacts

**Create:** `TouchInput.cs`, `PlayerMotor.cs`, `PlayerAnimation.cs`, `PlayerAppearance.cs`, `ToolController.cs`, `SafeAreaRoot.cs`, `HudView.cs`, player/HUD/tool prefabs; `Tests/PlayMode/PlayerInputTests.cs`.

**Consumes:** shared clock/state, imported four appearance families and the grounded sprite pivot manifest.
**Produces:** stable foot position, collision-safe movement, seven timed actions and a configurable portrait control surface.

- [ ] Build a small collision fixture with trunk, fence, doorway and riverbank. Write the movement check for a slow frame, diagonal slide and release before extending the world.
- [ ] Implement flexible joystick capture on the movement side, two-pointer input, acceleration/release and running. Pointer cancel, menu, background and slot load release every pointer/repeat state.
- [ ] Build the four-direction animation/attachment set for each appearance. Hoe, watering can, seed, axe, pick and rod have the correct grip/pose; do not substitute a recoloured farmer.
- [ ] Tie the single simulation impact to a guarded animation event. Add finite soil/seed/water/wood/stone/harvest effects and a 1.65-second watering ripple.
- [ ] Add the compact HUD, three top controls, 88-unit contextual action and 48-unit shortcut grid. Mirror the whole group for left-handed mode.
- [ ] Apply size/height/dead-zone/sensitivity/run/camera settings and persist them separately from the farm save. The input test covers holding an action while a dialogue opens: no new choice is selected.
- [ ] Inspect 320 × 667 and one taller safe-area layout with large text, once. Correct overlap/foot pivots before proceeding.

**Accept:** every appearance walks and uses every tool convincingly; feet remain grounded and no wall/fence traversal occurs at a slow frame.

### Task 4: farmhouse, first growing patch, livestock and sleep

**Create:** `FarmingService.cs`, `AnimalService.cs`, `FishingService.cs`, `CraftingService.cs`, farm/farmhouse/barn, woodland/lake/cabin, Copperleaf Pass and the complete first mining-floor scenes and corresponding prefabs; `Tests/EditMode/FarmDayTests.cs`.

**Consumes:** shared clock, tool events, save service, eight existing crops, animal/recipe rules.
**Produces:** a complete physical farming day that saves and restores.

- [ ] Author the farmhouse bedroom, kitchen, sitting area and storage; pair its door with the actual farm landing. The player wakes inside at 06:00.
- [ ] Place the original stable plot IDs in a readable first patch, inherited ripe crops, starter seeds, a real shipping crate and a clear village road. Add coherent pond/meadow/expansion areas.
- [ ] Implement till → plant → water → overnight growth → harvest with the original season/regrowth/energy rules. A held action cannot double-consume a seed.
- [ ] Build the barn/stalls, meadow animal route and feed station. Pet/feed/collect requires the physical animal or barn interaction and grants daily results once.
- [ ] Implement actual kitchen/workbench recipe interactions and water-proximity fishing. Cooking and crafting close cleanly without leaving movement held.
- [ ] Author the core woods/lake routes and their two homes, plus Copperleaf Pass and a complete copper floor with a return ladder. This supplies Act I’s timber, fish and copper before later exploration expansion; no main quest depends on an absent mine.
- [ ] Pin the one-day simulation check: ship crop, sleep, earn exact value, grow only watered crops, reset daily care/social state, then save/reload.
- [ ] Show the concise dawn result and return control in the bedroom; no persistent Good morning card stays over gameplay.

**Accept:** the first farming day works without shopping, an account, an ad request or a network connection.

### Task 5: Dewhaven streets, interiors and physical commerce

**Create:** `AreaDefinition.cs`, `PortalDefinition.cs`, `SceneDirector.cs`, `IInteractable.cs`, `InteractionContext.cs`, `InteractionResolver.cs`, `ServiceSession.cs`, `CommerceService.cs`, `ShippingService.cs`, `UpgradeService.cs`, `ShopView.cs`; Dewhaven’s 14 venues; `Tests/EditMode/CommerceTests.cs`.

**Consumes:** town/interior/shop catalogues, motor, content registry and shared clock.
**Produces:** `IWorldTravel`, service sessions, six distinct home-town services and a town with working return doors.

- [ ] Author Dewhaven’s five neighbourhoods, roads, stream bridges, square, yards, gardens and all 14 facades from the atlas. Put no building over a required road or river crossing.
- [ ] Build each interior’s actual room plan and purposeful furnishing. Add service anchors, product displays, work areas and owner quarters. Pair every doorway with an unobstructed return landing.
- [ ] Implement context resolution: door/person/counter/work surface/animal/ground, with a short range and clear primary action. A counter creates an expiring service session.
- [ ] Write commerce checks first: a full bag, insufficient materials, wrong shop stock, closed hour and disposed session all preserve gold/inventory; one success commits exactly once.
- [ ] Implement seed/food/feed/livestock/material sales and place-specific tool, house, patch and bag upgrades. Price and materials stay visible through an order.
- [ ] Remove every remote commerce/rest/crafting/care/shipping action from personal UI and hotkeys. A bag can select/eat an owned item, never ship it remotely.
- [ ] Walk through the village road, buy at Mira’s counter, visit another service and return to the same farmhouse door. Record one visual review of the town and its key interiors.

**Accept:** a real town with useful streets, distinct venues and atomic physical commerce, rather than a catalogue reachable anywhere.

### Task 6: resident schedules, navigation and dialogue

**Create:** `ResidentDefinition.cs`, `ResidentState.cs`, `ResidentDirector.cs`, `ResidentMotor.cs`, `NavGrid.cs`, `RoutePlanner.cs`, `DialogueDefinition.cs`, `DialogueContext.cs`, `DialogueRunner.cs`, `DialogueView.cs`, `ResidentView.cs`; `Tests/EditMode/ResidentScheduleTests.cs`.

**Consumes:** home/work/sprite definitions, portals, walkability, shared clock and scripts in `presentation.md`.
**Produces:** active residents with one actor view each, bounded routes and contextual physical conversation.

- [ ] Import Dewhaven’s eight resident definitions plus Rowan and Finn on the core woods/lake routes; use each actual sprite family and declared grounded pivot.
- [ ] Build a district route graph and local grid from collision geometry. Pin checks for a blocked landing, a changed destination and a resident crossing a door without duplicate views.
- [ ] Implement breakfast, commute, work, evening and home blocks. Food-service shifts cover their declared hours; weather/event overrides are explicit. Two new path requests per frame, at most 2,048 local nodes per search.
- [ ] Keep unloaded residents as schedule state. Loaded ones interpolate along valid paths, wait/yield, reserve their conversation and resume its route on close.
- [ ] Implement first greeting, daily credit, contextual topics, request/gift/shop choices and a four-choice limit. Use the authored Mira/Orin dialogue sample as the first complete conversations.
- [ ] Build a separate resident notebook profile. A remote profile opens Set route; it cannot chat/gift/propose across the map.
- [ ] Check one morning commute, one working shop and one evening walk in the authored town. A path failure keeps an actor at a safe reachable place, not inside a wall.

**Accept:** the city visibly has daily life, conversation remains compact/readable, and NPCs do not stand at static coordinates forever.

### Task 7: map, journal, app shell, onboarding and nature audio

**Create:** `WorldMapView.cs`, `JournalView.cs`, `SettingsView.cs`, `NatureMixer.cs`, `FoleyPlayer.cs`, title/new game/intro/settings/menu views and four generated-art scenes.

**Consumes:** roads/portal graph, resident snapshots, task progress, appearance definitions and the existing paintings/icon/transparent item art.
**Produces:** a complete first Android milestone with a useful map and one coherent UI system.

- [ ] Add Town/Valley maps using the same navigation graph as the actors. Destination selection sets a valid route to a counter/door/giver, and valley routing picks the next outdoor exit.
- [ ] Add the active-objective journal, separate resident notebook and compact personal menu. The map may show store names; the world does not acquire persistent text plates.
- [ ] Build four distinct look previews and named save slots. Script the four short opening pages and first-day transient help exactly from `presentation.md`.
- [ ] Add settings for controls, sound, display, game and saves, including large fonts, instant dialogue and reduced motion. Android keyboard resize cannot hide name fields or submit.
- [ ] Port the original nature/foley palette into local Unity audio. Crossfade by environment and pause/suspend on lifecycle events; include no music assets or musical UI tones.
- [ ] Complete the milestone flow once on Android: bedroom → farm → village map → real seed purchase → conversation → shipment → sleep → reload. Save its screenshots/build hash and stop repeating this flow unless a relevant change breaks it.

**Accept:** Milestone A is an installable, coherent farming game day with the whole Dewhaven town, not an isolated graphics demonstration.

## Milestone B — one complete exploration complex

### Task 8: coastal approach, five Tide Vault chambers and checkpoints

**Create:** `DungeonDefinition.cs`, `DungeonState.cs`, `DungeonService.cs`, `HazardController.cs`, Aster Quay and its eleven interiors/five residents, Saltwind Cliffs and Tide Vault scenes/prefabs; `Tests/EditMode/DungeonStateTests.cs`.

**Consumes:** portals, state/save, physical interaction, mechanism definitions in `data/dungeons.json`.
**Produces:** an entrance preview, five connected engineering rooms, safe hazard recovery and a completed return route.

- [ ] Author the cliff approach with stone stairs, tide pools, winch shelter and visible rock-cut entrance. The harbour exit first reaches this outdoor approach.
- [ ] Build the complete Aster Quay town from its catalogue: canal bridges, eleven enterable venues, three physical services and five resident routines. Sera’s boatworks and Basil’s winch work site must exist before their quests and the vault route are wired.
- [ ] Build antechamber, pump hall, counterweight archive, salt lock and chart room with distinct geometry, props, sound and a room map.
- [ ] Implement three persistent water/counterweight systems and a room-local reset. A captive cart or valve cannot leave the room or trap the only exit.
- [ ] Pin mechanism and reward checks: repeated activation is harmless; the chest needs all systems; insufficient bag capacity changes nothing; a claimed chart cannot be awarded again after reload.
- [ ] Implement announced water hazards, eight-energy recovery, stable safe checkpoints and a return shortcut. Save after stable changes, not halfway through a moving gate.
- [ ] Complete the approach → entrance → five rooms → chart → harbour return once, using touch controls and muted visual cues as well as SFX.

**Accept:** the dungeon has a reason, a route, several meaningful rooms and a reliable escape—not a city trigger linked to a generic cave rectangle.

### Task 9: first story acts and explicit legacy import

**Create:** `QuestDefinition.cs`, `QuestService.cs`, `RestorationService.cs`, `LegacyImporter.cs`, `AndroidSavePicker.cs`; first eleven main chapters and relevant requests; `Tests/EditMode/LegacyImportTests.cs` and `QuestRewardTests.cs`.

**Consumes:** farm, physical givers/services, Tide Vault state, save contracts and old exported JSON.
**Produces:** physical quest hand-ins, visible route restoration and safe old-save migration.

- [ ] Import Act I/II chapter prerequisites and physical turn-in anchors. Reward capacity is reserved before consuming items; one valid completion commits once.
- [ ] Connect bridge/garden/winch restoration to actual scene geometry and routes. Reopening a route updates navigation and relevant schedules without rebuilding every scene.
- [ ] Implement explicit version-1 JSON preview/import and the mappings in `migration.md`. Use `TypeNameHandling.None` and allow only known IDs/limits.
- [ ] Pin legacy cases: an early farm save, a town-position save, a finished old story, an old relic and bond IDs, and a corrupt/full-bag file. Inserted connectors get historical access flags without new rewards.
- [ ] Show the slot summary before replacing an occupied save and keep the original import file. A source JSON without new residents gains only zeroed friendships.
- [ ] Build Milestone B APK with a first connected story arc and real dungeon. Do not claim the remaining towns/content are finished yet.

**Accept:** story/restoration and migration are reliable before content multiplication.

## Milestone C — the full valley

### Task 10: Sunridge, Briar Hollow and the remaining outdoor routes

**Create:** two remaining city region scenes, their 19 additional town interiors, down/marsh/rise/trail regions, `ChunkLoader.cs`, remaining resident view bindings; finish the core-region visual pass.

**Consumes:** the accepted Dewhaven venue/interaction/resident patterns and all world/town/interior data.
**Produces:** all 13 exterior regions, all 48 interior venues and all 25 distinct residents in a coherent region graph.

- [ ] Connect the accepted Aster Quay/Saltwind region to the valley route graph and marsh route; preserve its authored bridges and working coastal exit.
- [ ] Build Sunridge’s terraces/orchards/conservatory/presshouse/quarry road and ten interiors, with curving paths and readable elevation transitions.
- [ ] Build Briar’s stream/archive terraces/herb lane/reading gardens/upper stair and nine interiors, with sheltered mountain access.
- [ ] Complete Whispering Woods, Moonwater, Cedar Downs, Reedwater Marsh and the four approach regions. Author their renewable resources, fishing spots, shelters and shortcuts.
- [ ] Bind the remaining ten resident definitions and their home/work/event/weather routes. Vesper’s self-service lodge pantry is explicitly labelled and stays physical.
- [ ] Add chunk load/unload with prepared collision at seams. Keep one persistent session and one actor view per ID across additive transitions.
- [ ] Run one content-validation pass for the region graph, every paired portal, a clear landing and a route from each public entrance to its service anchor. Inspect each city’s composition once and correct empty stretches, clutter and duplicate interiors.

**Accept:** every destination in the world atlas is real, useful, accessible and visually distinct.

### Task 11: Ember Gallery, Sky Observatory and five mining floors

**Create:** ten remaining dungeon chamber scenes, mining floors 2–5 and their mechanism/hazard prefab variants; finish the existing first-floor art pass.

**Consumes:** accepted dungeon/checkpoint/reward service and the chamber-by-chamber catalogue.
**Produces:** all 15 dungeon chambers and five extraction floors, with unique themes and once-only discoveries.

- [ ] Author the quarry vestibule, liftworks, cooling hall, maker’s workshop and lens chamber. Add balanced lift, ventilation and reflector rail interactions.
- [ ] Author wind stair, shutter gallery, gear room, meridian platform and compass gallery. Add announced gusts, paired shutters and captive gear controls.
- [ ] Extend the accepted mine head/copper floor with mixed ore, iron, crystal pockets and the deep seam, for five complete floors. Ladders/checkpoints return to daylight; Orin’s public workshop remains in Dewhaven.
- [ ] Reuse the dungeon state checks with each unique definition. Validate reset reachability, safe checkpoint loading, protected relics and once-only rewards.
- [ ] Traverse each new complex once and review its entrance, distinctive room silhouettes and return shortcut. Correct collisions/signposting before adding story dependence.

**Accept:** all exploration locations are complete; neither art nor puzzle sequence is a renamed duplicate of Tide Vault.

### Task 12: full story, sixty requests and the annual calendar

**Create:** remaining main/side quest definitions, twelve annual event scenes/overrides, four weekly table interactions, `CalendarService.cs` and chapter replay views.

**Consumes:** completed world, residents, restoration and quest services; `data/quests.json`.
**Produces:** all 24 main chapters, 60 side requests, 12 annual events and four weekly gatherings.

- [ ] Author Act III/IV’s scenes and dialogue using the specified objective/beat/prerequisite for every chapter. Every required hand-in has a physical giver/site and a route.
- [ ] Write the full 60-request catalogue into short local interactions, matching actual produce, resources, routes and work sites. Retain legacy IDs while revising the bell quest to bridge anchors.
- [ ] Connect four restored public rooms, convoy preparation and next-day deliveries to visible world changes. The ending leaves farming/social/exploration play available.
- [ ] Add calendar event hours, host locations, offerings and participation flags. Attendance requires date/place and consumes the offering once.
- [ ] Add chapter replay and concise journal pagination. Long narration uses authored page boundaries, not smaller text or repeated filler.
- [ ] Validate prerequisite reachability and unique reward paths in the content pass. Check one calendar rollover and one physical gathering; do not play weeks of repeated emulator waiting.

**Accept:** the valley’s work and exploration feed a complete story with meaningful optional life activities.

### Task 13: thirty-six bond scenes and partner everyday life

**Create:** `BondService.cs`, 36 scripted relationship scenes, adult candidate profiles and household routines.

**Consumes:** `data/bonds.json`, friendship/gift/day flags, dialogue, venues and legacy mapping.
**Produces:** six complete adult romance paths and persistent, optional partner life.

- [ ] Script six scenes per candidate from the supplied outlines, retaining the old scene anchors at new chapters 2/4/6. Give both responses coherent spoken results instead of generic point messages.
- [ ] Add friendship thresholds, physical meeting/location requirements, once-only completion and daily gift/quiet-walk limits.
- [ ] Preserve proposals at eight hearts, with an explicit player choice and stable partner ID. Add a shared breakfast, a chosen household task and evening conversation without blocking either person’s profession.
- [ ] Pin a duplicate scene response, a remote gift attempt and a migrated partner save. Each must preserve points/items/partner identity correctly.
- [ ] Inspect one representative scene for each candidate, correct awkward pacing or repetitive voice, then apply the same presentation standard to the remaining scripts.

**Accept:** romance has adult identities, individual motivations and daily continuity, with safe legacy progress.

## Milestone D — Android delivery

### Task 14: lifecycle, native file/share flows and Google demo ads

**Create:** `AndroidLifecycle.cs`, `AdService.cs`, `AdPolicy.cs`, `AdReceiptStore.cs`, `AdSafeArea.cs`, native save-picker/share adapters; `Tests/EditMode/AdPolicyTests.cs`.

**Consumes:** shared pause gate, physical home-rest view, save service and existing ad policy/test IDs.
**Produces:** robust Android interruption handling and restrained test-ad placements.

- [ ] Add Back, keyboard/safe-area and genuine background/resume handling. Initial/duplicate resume must not unexpectedly pause a new game.
- [ ] Integrate the official compatible Google Mobile Ads Unity plugin and consent flow in the isolated project. Use Google demo IDs only; initialize once on connectivity, without blocking offline boot.
- [ ] Place adaptive banners on title/pause with the native navigation/gesture/cutout reservation plus eight dp. Hide the banner and reservation for gameplay, forms, dialogue and stories.
- [ ] Implement natural-break interstitial policy and voluntary +25-energy rewarded rest with persisted unique receipts, max-energy/day caps and global cooldown.
- [ ] Pin skipped/unshown/duplicate reward, a full-energy offer, cross-slot cooldown, background while holding input and overlapping full-screen request cases. These are local deterministic checks.
- [ ] Check one real demo of each format and one three-button navigation layout, then stop. A remaining external SDK/network issue is reported precisely; do not run hours of repeated tests.
- [ ] Export/share a save through Android’s real picker/share sheet without selecting a recipient. Add actual store rate/share URLs only after owner-supplied listings exist.

**Accept:** interruptions keep state/time/input correct; ads never become a prerequisite to farming or cover native controls.

### Task 15: visual finishing, measured quality presets and installable build

**Create/modify:** quality settings, atlas/chunk budgets, final scenes/UI/text, Android build helper and release notes.

**Consumes:** every accepted milestone and the performance/presentation budgets in the spec.
**Produces:** a new installable Unity APK, optional unsigned AAB and accurate build/verification records.

- [ ] Review each town and interior family for readable entrances, purposeful dressing, solid collision, grounded characters, camera occlusion and useful paths. Replace any missing placeholder scene or repeated generic room.
- [ ] Review all visible phone text in the three logical sizes and large-font mode. Fix layout/content; never shrink text to hide overflow. Review dialogue voice and main chapter continuity against the catalogue.
- [ ] Measure current-region loading, memory, CPU/GPU frames and allocations on an available physical Android device. Set 30/60 presets, local-light/particle budgets and neighbour chunk radius from the results. If no phone is available, label physical performance unverified.
- [ ] Run the focused changed-system checks plus one final representative first-day/dungeon/save flow. Repeat only when a new failure or relevant change justifies it.
- [ ] Build versioned APK and optional AAB through this project, record package/version, exact sizes and SHA-256. A debug/test signature is labelled; no owner release key or Play publication is implied.
- [ ] Deliver APK, a concise changelog and real screenshots. Report unfinished content or unverified platform behaviour explicitly rather than calling the scope complete because a build exists.

**Accept:** the complete target content is reviewable in the actual Android game, and claims match observed results.

## Design-only completion record

At the end of this planning stage: world/town/interior/resident/shop/quest/event/bond/dungeon catalogues exist; an interactive offline atlas exists; original asset families and installed editor version have been inspected; the web prototype’s unconnected draft has been archived outside `src`. No Unity project, scene, live editor connection, new game test campaign or Unity APK has been created. Execution begins after Unity is available for this project.
