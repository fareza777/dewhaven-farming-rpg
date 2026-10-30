# Dewhaven Unity edition — design specification

**Status:** production design, 14 October 2026. All expanded counts below are targets, not implemented features. The user selected Unity migration and requested design preparation while another agent uses the editor. No Unity MCP operation, editor change, package installation or Unity project creation belongs to this design-only stage.

**Purpose:** an original Android portrait farming and life simulation whose large towns, interiors, residents, trading and exploration form a coherent playable world. Existing art is used deeply and consistently. The quality bar is a finished daily loop, believable places and reliable interaction, rather than a claim of AAA production scale.

## 1. Product constraints and decisions

| Constraint | Decision |
| --- | --- |
| Platform | Android, portrait; offline game and local saves |
| Engine | Installed Unity 6.3 LTS **6000.3.20f1**, observed locally and in the asset-master ProjectVersion.txt |
| Rendering | URP 2D, crisp pixel sprites; 16 pixels per world unit; full viewport; limited local lighting |
| UI | uGUI and TextMeshPro, 390 × 844 logical reference layout, width matching, safe-area root |
| Language | English by default; Indonesian strings kept in a separate localisation table |
| Appearance | Warm ivory, charcoal and bronze interface; natural world colours |
| Character imagery | Existing small pixel faces allowed, including selection and dialogue; generated paintings/items contain no humans, animals or faces |
| Sound | Nature ambience and physical activity SFX only; no music, instruments, melodies or musical UI tones |
| Controls | Floating/flexible joystick by default; left/right handedness, fixed mode and full response/layout settings |
| Commerce | Physical counter, correct shop, open hours and interaction distance; no personal-menu purchases or upgrades |
| World navigation | Streets, connected regions, useful map, visible entrances and return portals |
| Persistence | Three local slots, atomic saves, backups, export/import; version-1 browser saves explicitly imported |
| Ads | Official Google demo IDs during development; banner only on title/pause; sparing natural-break interstitials; voluntary rewarded rest |
| Work ownership | New Unity project under `unity/Dewhaven`; a dedicated or released editor connection must target that exact path before mutations |

Unity supplies 2D lighting in URP, sprite-atlas workflows and asynchronous scene loading. These are engineering tools, not automatic visual-quality or frame-rate guarantees. See [2D lighting](https://docs.unity3d.com/6000.3/Documentation/Manual/urp/2d-index.html), [sprite atlases](https://docs.unity3d.com/6000.3/Documentation/Manual/sprite/atlas/atlas-landing.html), and [LoadSceneAsync](https://docs.unity3d.com/6000.3/Documentation/ScriptReference/SceneManagement.SceneManager.LoadSceneAsync.html).

## 2. The playable world

The full authored target is **81 playable areas**: 13 exterior regions, 48 interior venues, 15 chambers across three dungeons, and five mining floors. An interior venue may contain several rooms within one floor plan. The count describes content, not simultaneous loaded scenes. The exact catalogue and links are in `docs/unity/data/world.json`.

| Region | Tile footprint | Purpose and landmarks |
| --- | --- | --- |
| Amber Homestead | 128 × 96 | Farmhouse, barn, first growing patch, pond, orchard edge, future expansion meadow |
| Dewhaven | 160 × 128 | Seed Lane, Foundry Quarter, Meadow Ranch, Letter Court, Willow Gardens |
| Whispering Woods | 144 × 128 | Ranger cabin, glades, old bridge, renewable timber, berries and mushrooms |
| Moonwater Lake | 144 × 112 | Shore walk, Finn’s home, two fishing piers, reed beds and a picnic landing |
| Aster Quay | 192 × 144 | Saltglass Row, canal bridges, Boatworks, Fish Quay, Customs Court, Old Pier |
| Sunridge | 176 × 144 | Orchard Kitchen, Winterglass, Flower Lane, Lower Orchard, Quarry Road |
| Briar Hollow | 160 × 160 | Archive Terrace, Mapmakers’ Court, Herb Lane, Heather Row, Upper Stair |
| Saltwind Cliffs | 128 × 112 | Coastal descent, tide pools, winch landing, dry shelter, Tide Vault gate |
| Ember Trail | 128 × 128 | Quarry cart track, drainage channel, broken aqueduct, glassworks entrance |
| Observatory Rise | 112 × 160 | Mountain switchbacks, two sheltered landings, upper stair, observatory court |
| Copperleaf Pass | 128 × 128 | Pine foothills, ore cart rails, miner’s shelter, physical mine entrance |
| Cedar Downs | 144 × 112 | Orchard route, seasonal forage, picnic clearings and a woodland shortcut |
| Reedwater Marsh | 144 × 128 | Lake-to-harbour boardwalk, fishing bends, reeds and raised wooden paths |

### Traversal and composition

Town streets form connected loops with secondary lanes and landmarks visible before intersections. A bridge, open courtyard or large roof helps orientation; at most three essential direction posts serve each town. Door emblems identify shop types. Floating house names, ground labels and signposts on every exit are excluded.

The walkable part of a district should offer a useful destination, social activity or view within roughly 8–14 seconds of ordinary movement. This is a layout target, checked while authoring. Water, gardens and orchard rows create breathing room around dense street fronts. Large map dimensions are not a reason to leave long empty corridors.

Major roads are 4–5 tiles wide; domestic lanes are at least 3 tiles; interior aisles at least 2 tiles. Door landings provide 2 × 2 clear tiles. Buildings use feet-level footprints; roofs and tree canopies may overlap visually without occupying their entire visible shape as collision. Fences, trunks, rocks, riverbanks and solid furnishings consistently block movement.

Region boundaries are authored portals. Entering a town road leads to another outdoor region, never directly to a dungeon chamber. Portal pairs have stable IDs, facing, safe spawn positions and a short transition. Arrival cannot immediately reactivate the return portal.

### The map

The personal map has **Town** and **Valley** views. The town view shows roads, buildings, store symbols, discovered places, the player and a single selected destination. Selecting a destination draws a traversable route and offers **Set route**. A subtle compass cue may point toward the next waypoint; it does not place text boxes across the world.

The valley view shows region connections and the next required exit. Fast travel becomes available between discovered public travel points after the bridge story, through an in-world travel interaction. No direct fast travel to locked interiors, a puzzle room or an undiscovered town. Opening the map pauses the shared simulation clock. Dungeon maps reveal visited rooms and exits, not puzzle solutions.

## 3. Towns, stores and interiors

There are **44 enterable town buildings**: 14 in Dewhaven, 11 at Aster Quay, 10 at Sunridge and 9 at Briar Hollow. Four additional venues are the farmhouse, homestead barn, Rowan’s cabin and Finn’s home. All 48 are enumerated with owner, style, dimensions and room purpose in `data/interiors.json`.

| Town | Functional identity | Physical services |
| --- | --- | --- |
| Dewhaven | Agricultural home town and working trades | Mira’s Seedhouse; Copper Kettle; Nora’s Meadow Ranch; Copper & Coal; Gareth’s Timberyard; Thread & Thimble |
| Aster Quay | Working harbour and delivery centre | Saltglass Inn; Quayside Exchange; Cato’s Fresh Catch |
| Sunridge | Orchard, conservatory and preserves | Tamsin’s Orchard Kitchen; Lyra’s Wildflower House; Hearth Pantry; Pavel’s Garden House |
| Briar Hollow | Archive and mountain outfitting | Bea’s Herb & Hearth; Ridge Outfitter; Wayfarer Lodge |

These 16 services have distinct stock and prices in `data/shops.json`. Tools are upgraded at Orin’s forge; house and growing-area work at Gareth’s timberyard; bag capacity at the tailor or outfitter. A shop’s product selection matches its displays. Food counters sell prepared meals, seedhouses sell seed packets, ranches sell feed and livestock. Story relics never enter normal shop stock.

Ordinary shops open 08:00–18:00. Food/inn services open 07:00–21:00. Their resident work shifts cover those hours; staff do not disappear mid-transaction. The daily scheduler may close a store for a published event, with a map status stating the next opening. When closed, tapping the door gives one concise status without opening a purchase catalogue.

Vesper’s Wayfarer Lodge has one explicitly labelled self-service trail pantry during guiding rounds. Its physical counter and price list remain required. This exception does not permit remote purchases or duplicate Vesper actors.

### Transaction rules

1. Interaction validates the venue, counter anchor, service hours and player distance of at most 1.5 world units.
2. A service session holds a stable shop ID and pauses the game clock while the menu is open.
3. A purchase verifies stock membership, positive quantity, available gold and inventory capacity before changing either balance.
4. Success commits inventory, gold, a save and one coin response together. Failure changes nothing and gives a concise local message.
5. Closing the panel, travelling, backgrounding or loading another slot invalidates the service session. Stale UI callbacks cannot complete transactions.

Crafting requires a physical workshop bench; cooking requires a kitchen or public cooking station. Shipping requires the homestead bin or a labelled delivery depot; inventory does not sell goods remotely. Animal feeding/petting/collecting requires the barn or proximity to that animal in the meadow. Sleeping/resting requires an owned bed or a paid inn bed. No remote Home action exists.

### Interior design

Each venue uses a purposeful plan with several spaces rather than a single empty floor. Layout families include home, shop, town hall, kitchen, barn, study, forge, conservatory, inn, tailor, botanical shop and harbour warehouse; each venue selects an authored variant.

- Homes have an entrance, kitchen, sitting area, bedroom and storage. The bedroom window establishes morning light and the bed interaction.
- Shops have a service counter, clear customer aisles, product displays, stock room and private quarters. Actual crop/food/tool sprites distinguish the stock.
- The forge has stone under the furnace/anvil, a timber rack, ore bins, assembly bench and a separate order desk.
- The ranch/barn has stalls, feed storage, wash area and a central aisle. Animal collision does not block the only exit.
- The café and pantry use food prep at the back, dining tables at the windows and a readable counter entrance.
- The archive has public desks, reading niches, shelves, map cases and a records room. The harbour office has cargo records, ropes and equipment.
- Inns have a lobby, dining area and private guest room. Paid rest has a clear price and result before confirmation.

Use original furniture, wall, floor, plant, barrel, crate and lamp assets. Windows, rugs, floor material transitions and small still-life arrangements define space. Pivots and collision shapes are hand-aligned; transparent atlas padding must never make feet float. Indoor lighting has a warm window source and restrained local lamps. The world outside the floor plan is opaque charcoal.

## 4. Residents and playable looks

**25 named residents use 25 different existing sprite families.** Original newcomer hue filters are removed. Four separate player looks use `farmer`, `chara_5`, `chara_17` and `chara_26`. Selection presents an enlarged pixel preview, an appearance name and one short clothing description. These are appearances, not classes or stat bonuses.

| Place | Residents |
| --- | --- |
| Dewhaven | Mira, Elias, Cleo, Orin, Nora, Gareth, Ellis, Aya |
| Aster Quay | Sera, Marin, Cato, Nemi, Basil |
| Sunridge | Tamsin, Lyra, Pavel, Ada, Cedar |
| Briar Hollow | Ilan, Bea, Tobin, Vesper, Jun |
| Woods / lake | Rowan / Finn |

Mira, Rowan, Cleo, Finn, Sera and Tamsin are adult romance candidates, ages 27, 29, 28, 30, 31 and 26 respectively. Friendship is available to every resident. Six relationship chapters per candidate give **36 optional bond scenes**, with two meaningful responses per scene. Existing favourite gifts, birthdays, proposals and partner walks continue; home life adds shared breakfast, a chosen household task and evening conversation. No candidate’s identity is represented by recolouring another character.

### Daily simulation

Residents have stable IDs, home venues, work venues and authored daily schedules in `data/residents.json`. Typical blocks are breakfast at 06:00, a commute around 07:00, work from 08:00, evening errands/walks around 18:00 and return home around 20:00. Food-service shifts extend to their 21:00 closing. Couriers, guides, orchard hands and dock workers use outdoor work routes. Weather and festival overrides are explicit, not random teleportation.

The shared game clock controls crop time, services, quests and residents. Opening a menu or conversation pauses all of them. Nearby residents move smoothly along paths, wait at crossings, avoid a blocked landing, use door portals and resume work after conversation. A conversation reserves its speaker until the panel closes.

Loaded actors use local collision-aware paths plus a district route graph. Limit new path searches to two per frame, stagger requests and cap a search at 2,048 local nodes. Repath when the target changes, a route becomes invalid or an actor has been blocked for a bounded interval. Do not search from every resident on every frame. NPCs briefly yield to the player; they never permanently seal a one-tile exit.

Unloaded residents exist as schedule data without Animator, AudioSource or GameObject updates. At load, derive their current area and route progress from clock and schedule. Maintain one actor view per resident ID. A resident cannot appear inside a shop and on its street simultaneously. Active actors enter/leave through visible doors; off-screen simulation does not create an on-screen teleport.

### Conversation

The world remains visible behind a compact dialogue sheet. Display the real pixel speaker, name, one role/status line and 1–3 short sentences in **18-unit** body text. Responses are 48-unit targets, with at most four immediate choices. Character biographies, favourite gifts and birthdays belong in the resident profile, not every conversation.

Greet a first meeting differently from a familiar visit. Context may use job, weather, time, current chapter, solved location and relationship stage. Keep factual directions consistent with the actual map. Daily friendship credit is granted once; further conversation can still read another topic without repeatedly granting points or telling the player to leave.

The response set is contextual: **Talk**, a specific topic, a ready request, **Gift**, **Browse stock** at a valid counter, an eligible bond scene, and **Goodbye**. Longer sets use a Topics page. The first tap completes text reveal; the next advances. Instant text and reduced motion are available. A dialogue transaction never fires twice from one held touch.

See `docs/unity/presentation.md` for screen composition, first-day scripting, scene direction and authored dialogue samples.

## 5. Story, quests and calendar

The narrative centres on Grandmother’s delivery atlas: a practical record of who needs food, which roads remain safe, and how four communities support each other through winter. Farming supplies the network; towns provide crafts, meals and relationships; exploration recovers the instruments that made the routes possible. The original towns, residents and plot remain distinct from the reference game.

**24 main chapters** form four acts of six. Act I makes the homestead productive and establishes Dewhaven. Act II restores the harbour route and discovers the Tide Vault. Act III links the orchard, glassworks and archive. Act IV tests the mountain routes and completes a first convoy. Each chapter names its physical giver/site, objective, prerequisite and story change in `data/quests.json`.

The journal tracks objectives, shows rewards and sets a route. Deliverable quests are handed in to the giver, work site or letter desk. Deliveries consume items once, reserve reward capacity first and issue rewards atomically. Restoration changes a bridge, a furnished room, traffic or a recurring activity. It cannot be represented solely by a congratulatory text box.

**60 optional requests** combine the 19 legacy requests, two original requests for each of 16 additional residents, and nine regional requests. Objectives include produce, meals, crafting, repairs, routes, deliveries and discoveries. Requests are paged by person/region. No exact repeated daily hand-in is required to finish the main story.

The calendar contains **12 annual events**: four major seasonal gatherings and eight town events. Four smaller weekly meetings rotate between the village, harbour, orchard and archive. Event attendance needs the actual place and date. Events use meals, gardening, practical work, conversation and lantern walks, with nature ambience and SFX. No musical performance, bell melody or instrumental celebration is added.

The legacy `stone-song` quest ID is retained for migration but displayed as **Safe moorings**, about iron bridge anchors. Its former bell premise is removed.

### First playable morning

The four existing generated opening paintings establish the letter, journey, homestead and dawn. The player wakes inside the farmhouse at 06:00. A single brief objective asks them to step outside. The doorway faces the first growing patch; ripe inherited crops and starter seeds let the player learn without visiting a closed store.

1. Leave the bed and house; movement instructions disappear after first successful movement.
2. Gather an inherited crop; its item enters the bag with a brief physical response.
3. Hoe, plant and water three starter seeds. A contextual instruction appears only for the next unlearned action.
4. Follow the village road and map marker to Mira’s Seedhouse after opening. Meet Mira and buy at her counter.
5. Meet another resident en route to the farm; ship produce at the actual bin.
6. Return to the bedroom and sleep. Dawn pays the shipment and grows watered crops once.

The opening is skippable/replayable. Existing saves with tutorial completion do not repeat it. There is no persistent greeting/title card on the world.

## 6. Dungeons and mining

The three complexes contain **five connected chambers each**. Exact chamber objectives, safe failure behaviour and unique rewards are in `data/dungeons.json`. Each has a physical approach region, recognisable architecture, entrance preview, safe checkpoint, persistent mechanism states and return shortcut. The approach has an environmental story and room for a shelter, equipment check and optional request.

| Complex | Approach and structure | Distinct systems | Unique discovery |
| --- | --- | --- | --- |
| Tide Vault | Saltwind cliff stairs → antechamber → pump hall → counterweight archive → salt lock → chart room | Water diversion, cargo carts and sluices | Ancient tide chart |
| Ember Gallery | Quarry cart track → vestibule → liftworks → cooling hall → maker’s workshop → lens chamber | Balanced lift, ventilation and reflector rail | Ember weather lens |
| Sky Observatory | Mountain switchbacks → wind stair → shutter gallery → gear room → meridian platform → compass gallery | Announced gusts, paired shutters and captive gears | Brass sky compass |

These are exploration/engineering dungeons. The principal challenge is reading the environment, operating mechanisms and navigating announced hazards. A hazard costs eight energy and returns the player to the latest safe checkpoint. Solved systems, inventory and quest progress remain. No unannounced death, invisible damage or lost relic is used.

Every puzzle can reset its current room safely. Captive puzzle objects cannot enter normal inventory, be sold or block the only control. Saving occurs after stable mechanism changes, outside moving gates. A return shortcut opens on completion. The relic and two crystals are an atomic, once-only chest reward; if there is insufficient capacity, the chest stays closed with a clear message.

Copperleaf Mine is entered through a mine head in Copperleaf Pass, not a street exit. Five floors introduce copper, mixed ore, iron, crystal pockets and the deep seam. Marked ladders/checkpoints allow return to daylight. Orin’s public forge is in Dewhaven, separate from the excavation. Mining and dungeon maps show the current floor/visited rooms.

## 7. Farming, movement and effects

Preserve the proven eight-crop seasonal system and crafting IDs while rebuilding the runtime in C#. Rain and sprinklers water; watered crops advance at sleep; regrow and seasonal limits remain explicit. Greenhouse restoration permits all-season growth. Livestock have feeding, petting, production and capacity rules. Fishing uses water proximity and a forgiving touch timing window; the harbour and marsh fishing spots use the same system with authored catch tables.

The default movement stick follows the initial thumb position on the movement side. UI targets exclude joystick capture. Release, pointer cancellation, Android Back, menu entry and backgrounding clear input. Support simultaneous movement/action touches; cap repeat to productive tool actions. Joystick size, height, opacity, dead zone, sensitivity, run behaviour, handedness and fixed/floating mode remain adjustable.

Design speeds are 3.7 units/second walking and 5.8 running, with approximately 0.10-second acceleration, 0.06-second release and 0.14-second camera smoothing. These are tunable feel targets. Physics must sweep or subdivide motion so a slow frame cannot pass through a fence. Sort actors and foreground objects by their grounded feet. Fade an obstructing canopy, retaining a clear character silhouette.

Each player appearance has four-direction movement and seven tool actions. The non-farmer sprite families need authored tool anchors and poses; they cannot borrow a mismatching farmer body or a hue filter. Tool impact fires once at a marked animation event. Reference durations are hand 0.48 s, hoe 0.64 s, watering 0.90 s, seed 0.62 s, axe 0.72 s, pickaxe 0.66 s and cast 0.82 s.

Watering uses a short can tilt, three light streams, droplets, a 1.65-second soil ripple and a restrained plant response. Hoeing moves earth into a furrow; seeds follow an arc; harvesting lifts produce; wood and stone produce small finite debris. Footsteps vary by ground. Coin flights and a count transition appear on genuine balance changes. Reduced motion suppresses flights and camera entry motion while keeping impact/state feedback.

## 8. Interface and sound

Gameplay fills one portrait screen. Date/time/energy sit at the upper left; gold at the upper right; compact map/journal/menu controls sit below the HUD. The movement corner stays clear. The action side contains an 88-unit primary action and a two-row cluster of 48-unit shortcuts including the bag. The whole arrangement mirrors for left-handed controls.

The personal menu contains Map, Journal, Bag, Residents, Calendar, Almanac, Save, Settings, Help and Pause. It cannot perform purchases, upgrades, crafting, shipping, animal care or rest. Settings use short pages for controls, sound, display, game and saves. About, Share and Rate are secondary. Rate opens the actual store listing only once one exists; before that it is explicitly local feedback.

UI body text is at least 16 logical units, dialogue 18, ordinary supporting labels 14, decorative captions 13, and calendar headers no smaller than 12 beside 16-unit dates. Fraunces headings pair with Nunito labels/body. Text never shrinks to fit a fixed box; it wraps, paginates or uses a shorter string. Large-font mode scales body text up to 1.35× and adapts the layout. Every action has a visible pressed state and a meaningful accessible label.

Shop interfaces show the merchant, venue, balance, two readable product rows per phone page, quantity and a clear purchase action. Upgrade panels show stage, gold/material requirements and outcome together. Dialogues, services and the personal menu have distinct visual structures; one generic oversized card is not reused everywhere. Generated item art keeps transparent backgrounds.

Nature zones crossfade wind, water, rain and foliage. Physical SFX include footfalls, soil, water, chopping, ore contact, doors, crates, fabric and coins. UI feedback uses quiet physical clicks/rustles. Export the original noise-based Web Audio timbres to local clips or implement equivalent Unity noise processing; do not add oscillating musical tones or instrument samples.

## 9. Ads and Android lifecycle

Keep the development Android IDs from `docs/ADMOB.md`; integrate through the official Google Mobile Ads Unity plugin rather than the Capacitor JavaScript bridge. Browser ad code is a behavioural reference, not a Unity dependency.

- Banner: title/pause only, outside gameplay, with a reserved native-safe region above navigation/gesture/cutout insets plus eight logical dp. Remove the reservation when hidden or unavailable.
- Interstitial: only a later day’s natural dawn transition; retain day/session/global cooldown protection. A missing/offline ad immediately continues the game.
- Rewarded: voluntary +25 energy, capped at max, three per day, real-time cooldown and unique earned receipt. Ordinary food/rest/sleep remain available.
- All full-screen ads clear touches, pause the shared clock and suspend game audio. Only the SDK earned callback creates a receipt. Skipped/failed/unshown responses grant nothing.
- Ads are muted independently of the nature-volume slider. Third-party imagery is not controlled by the game’s generated-art rules.

Use the plugin’s supported consent flow and privacy-options entry. Demo-only consent exceptions cannot carry into live ad units. SDK initialization stays off the first offline game path and is shared across reconnects. No live IDs, publisher credentials, store publication or signing key are part of this design.

Android Back closes the top panel, then pauses, then leaves the app through an explicit exit state. Backgrounding saves once, clears all input and pauses simulation/audio. A genuine return preserves the current context; initial/duplicate resume callbacks do not unexpectedly open Pause. Keyboard resizing and safe areas apply to name and save forms. Internal Unity builds use `com.fajar.dewhaven.unity` to coexist with the browser APK.

## 10. Architecture and content boundaries

Create the project at `E:/Harvest Moon GPT 61/unity/Dewhaven`. Keep all original source asset folders read-only. Import only used sprite/furniture/terrain families, preserving source `.meta` references when prefab dependencies need them. Do not drag the entire resource tree into every runtime Resources folder.

| Unit | Responsibility |
| --- | --- |
| Bootstrap / GameSession | Own one persistent state and compose services; no city art or dialogue logic |
| Simulation / GameClock | Day, season, weather, energy, crop/animal updates and one shared pause gate |
| World / SceneDirector | Area registry, asynchronous scene transition, stable portal IDs and safe landing |
| World / Navigation | District graph, local walkability, routes and path budgets |
| Characters / PlayerMotor | Touch input, physics, grounded sprite animation and tools |
| Residents / ResidentDirector | Schedules, area membership, path requests and actor view uniqueness |
| Interaction / InteractionResolver | Nearby physical targets, focus priority, service/session validation |
| Economy / CommerceService | Atomic purchase, shipping, upgrade and crafting rules |
| Story / QuestService | Prerequisites, delivery reservation, once-only reward and restoration flags |
| Dialogue / DialogueRunner | Contextual lines, response nodes and no duplicate daily credit |
| Exploration / DungeonService | Mechanism state, checkpoints, safe reset, relic reward |
| Persistence / SaveService | Three slots, migration, validation, backups and export/import |
| Presentation / Views | HUD, map, conversation, services, journal and settings |
| Audio / NatureMixer | Nature zones, physical SFX and lifecycle/ad suspension |
| Android / AdService | Official SDK, consent, safe banner area and earned receipts |

Definitions live in ScriptableObjects or validated content JSON with stable string IDs. Mutable progress lives in serializable C# state. A scene/prefab contains references and presentation, never the only copy of quest or crop progress. Keep pure simulation/economy code independent of MonoBehaviours so the existing edge-case fixtures can become focused EditMode tests.

## 11. Performance targets

These are budgets to measure during development, not current results: stable 30 fps on the lower target tier and optional 60 fps on the higher tier; full-app memory target below 350 MB; no routine traversal allocation spikes. Collect actual device data using the [Unity Profiler](https://docs.unity3d.com/6000.0/Documentation/Manual/profiler-profiling-applications.html).

- Exteriors use 32 × 32 tile chunks. Load the current district and a limited neighbour ring; keep adjacent collision ready before the player reaches a seam. Unload distant interiors.
- Pack sprites by region/common usage; retain shared characters/UI and a bounded current-region set. A new town does not keep every former atlas and scene alive.
- Static terrain/furniture uses tilemap batching and baked/painted shadow detail. Limit local 2D lights to two visible on the low tier and four on the high tier; no global per-object real-time shadows.
- Keep a maximum of about 12 fully animated nearby residents; use off-screen schedule data for the rest. Visible NPCs do not pop out during a conversation or near a doorway.
- Pool finite particles, item popups and coin flights. Low tier caps active tool particles at 96; default uses 192; reduced motion lowers effects further.
- Simulation advances on clock ticks, not per crop per render frame. Pause stops simulation. Screen/background states do not keep full-speed hidden rendering/audio.
- Test 320 × 667, 390 × 844 and 412 × 915 logical portrait layouts, notch/gesture and three-button navigation. Physical measurements set the final quality defaults.

## 12. Migration and acceptance

The old APK and save exporter remain available. Unity does not assume it can read WebView localStorage automatically. A player explicitly exports a version-1 JSON save, imports it into a selected Unity slot, sees the farm/day/balance summary and confirms replacement only if occupied. Invalid files never overwrite a valid slot.

Retain item IDs, existing main/side quest IDs, relationships, ad receipts, animals, crop states, skills, gold and inventory. Map numeric avatar IDs to the four new appearance IDs. Add the 16 new friendships with zero progress. Move a player saved in an old town to the corresponding safe new gate; move a player saved in a dungeon to its entrance checkpoint. Keep a backup of the original imported file.

The eight new connector chapters do not invalidate legacy completed chapters. Migration records historical route flags separately, without issuing their new rewards. Previously finished story progress remains finished; new side content and additional relationship scenes remain playable. See `docs/unity/migration.md` for exact mappings and data sources.

The first implementation milestone is accepted only when a real Android build can complete farmhouse wake-up → tool actions → village road → physical seed purchase → live resident conversation → shipping → sleep → reload with correct growth/payment. One Tide Vault then proves approach, entrance, five chambers, safe reset, reward and return. That standard is repeated for the remaining regions. Verification is focused on changed systems and these flows; do not restart the previous long emulator/ad test campaign.

The detailed work breakdown is `docs/superpowers/plans/2026-10-14-dewhaven-unity.md`. Current Unity scenes, play-mode performance, phone feel, completed new content and a new Unity APK are all still implementation work.
