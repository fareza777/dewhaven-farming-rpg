# Asset and save migration plan

Status: design preparation on 14 October 2026. No Unity editor connection has been used. Unity **6000.3.20f1** is installed locally; the source asset master records the same editor version.

## Sources and what can move

| Source | Use in Unity | Treatment |
| --- | --- | --- |
| `E:/Pixel Games Asset Master/Assets/Gif/Super_Retro_Collection/Resources` | Original terrain, tile assets, buildings, furniture, props, characters, tool/hero animation sources | Read-only source; copy selected families with their dependencies and `.meta` files into the new project |
| `E:/Harvest Moon Sprite Opus/public/assets/pack` | Packaged farmer/crop/prop reference and animation comparison | Read-only reference for controls/topology and available sprites; no story/town/character copying |
| `public/assets/world/world.json` and `world.png` | Existing 787-frame extraction catalogue and quick visual reference | Keep stable frame-name mappings; original Unity sources are preferred for final imports |
| `public/assets/world/furnishings.json` | 49 proven furniture/meadow/wall blocks and source crop coordinates | Recreate individual Sprite/Tile assets with proper pivots and collision |
| `public/assets/items/*.webp`, `docs/art-source/*.png` | 32 original transparent generated item illustrations | Use PNG originals when needed for Unity texture import; keep alpha, no square backgrounds |
| `public/assets/cinematic/*.webp` | Four original scenery/still-life opening paintings | Convert losslessly from original generation sources or decode existing art; no licensed uploads |
| `public/assets/brand/*` | Icon and emblem | Reuse original emblem; generate density variants locally |
| `src/game/content.ts`, `simulation.ts`, `expansion-content.ts`, `expeditions.ts` | Item IDs, crop values, recipes, quest history, relationship/reward rules | Port data and pure rules to C#; no embedded browser or JavaScript runtime |
| `src/nature-audio.ts` | Original noise-based nature/foley timbres | Export local PCM clips or recreate equivalent Unity noise processing |
| `src/game/ads.ts`, `src/ads.ts`, native Java plugin | Reward, frequency, lifecycle and safe-banner behavioural reference | Reimplement with the official Unity SDK; do not copy the Capacitor bridge as a dependency |

`data/asset-audit.json` records the full local scan. The resource tree includes 3,724 PNG files across the audited folders, 247 decorative prefabs plus six behavioural prefabs, and many environment tile assets. These totals describe source material, not a promise to load or ship all of it. Character/furniture/terrain families are selected for each region and packed into bounded runtime atlases.

### Import manifest and pivots

Create `Assets/Dewhaven/Content/ImportManifest.json` with source-relative path, source GUID when present, destination, category, frame grid, pixels-per-unit, pivot, animation family and region usage. The import helper writes only beneath `Assets/Dewhaven` and never edits the source collection or Packages.

- Terrain/furniture: 16 PPU, point sampling, no mipmaps for the top-down pixel world; sRGB colour textures; region-specific atlases.
- Character sheets: four directions, three walking frames where supplied. Preserve consistent foot pivots across frames. For the trimmed farmer, visible feet at source Y = 24 determine the pivot; transparent cell padding is not the ground.
- Player appearances: `look-fieldkeeper` → farmer; `look-sunfarer` → chara_5; `look-wayfarer` → chara_17; `look-trailkeeper` → chara_26. The latter families require authored tool attachments/poses, not a hue filter.
- Named residents: 25 unique sprite families in `data/residents.json`; Sera changes to chara_6, Tamsin to chara_14 and Ilan to chara_30.
- Tree/rock/building collision: explicit trunk/base/foundation shapes, separate from the full source silhouette. Feet-level sort anchors are stored on prefabs.
- Generated inventory/paintings: smooth sampling and alpha; do not apply pixel filters to painterly UI art.
- Reused prefab families: copy referenced textures/materials/animations with original `.meta` files. Detect duplicate GUIDs before importing. Behaviour scripts are reviewed before enabling them; art import does not automatically activate unrelated demo gameplay.

## Content catalogue status

The archived `reference/places-draft.ts` contains the first proposed shop/resident/building data. It was moved out of `src/game` when Unity migration was selected; the web prototype does not import it. `tools/design-unity.mjs` combines that draft with the existing game’s original content and writes the current JSON design catalogues. `tools/render-unity-atlas.mjs` creates the self-contained local atlas.

Catalogue IDs and planned geometry become Unity content definitions. The atlas is a schematic design review, not collision-ready Unity scene data. Road connectors, room geometry, portals and stock displays receive a scene-authoring pass before the region is accepted. Decorative randomness is seeded and stays off doors, roads, service aisles and required puzzle controls.

## Save compatibility

Unity internal builds use application ID **`com.fajar.dewhaven.unity`** so they can coexist with the existing APK. Save import is an explicit file action through Android’s picker. The game cannot assume the previous WebView’s localStorage is directly available to Unity.

Use an explicit `SaveV2Dto` and the Unity-compatible Newtonsoft JSON package with `TypeNameHandling.None`, rather than deserializing arbitrary runtime types. Validate before building domain state. Size limit: 250,000 bytes, matching the existing export. Reject non-finite coordinates, negative balances, unknown item/quest/resident IDs, duplicate unique rewards, impossible energy/capacity, oversized strings and quantities outside supported limits. Import errors leave the target slot and backups untouched.

| Version-1 field | Unity mapping |
| --- | --- |
| `playerName`, `farmName`, `slot` | Same text limits and slot 0–2 |
| `avatar` 0 / 1 / 2 / 3 | Fieldkeeper / Sunfarer / Wayfarer / Trailkeeper appearance IDs |
| Date, time, weather, total days | Preserve; derive the Unity shared clock and current schedule phase |
| Gold, energy, max energy, capacity | Preserve within current supported bounds |
| Inventory, shipping, recipes, item IDs | Preserve keys and quantities; old relics remain protected |
| Crops/plots | Map stable original plot IDs into the new farm’s first patch; preserve crop, growth, tilling, water and fertilizer |
| Animals | Preserve stable ID, species, name, age, daily care and pending product |
| Nine friendships | Preserve points, met, talked, gifted; add 16 new residents with zero progress |
| Partner and completed bond IDs | Preserve; old bond scene 0/1/2 maps to new chapter 2/4/6 for that candidate |
| Main/side quest IDs and achievements | Preserve existing IDs, including `stone-song` displayed as Safe moorings |
| New connector chapters | Record historical route clearance from old progress, without granting connector rewards |
| Dungeon discoveries | Preserve old switches/chest completion in the corresponding complex state; already owned relics cannot be awarded again |
| Upgrade levels, skills and farm restoration | Preserve and rebuild their visible results in Unity |
| Ad reward day/count, receipts, interstitial day | Preserve; the global real-time cooldown remains outside individual save slots |
| Player saved in an old town | Spawn at that town’s new safe entry portal, facing away from it |
| Player saved in a dungeon | Spawn at the matching entrance checkpoint, preserving solved state |
| Old removed resources | Preserve mapped farm resource IDs; archive unmapped obsolete IDs without applying them to unrelated new objects |

The 16 legacy main chapter IDs keep their relative order inside the 24-chapter story. If a legacy chapter is already complete, inserted preceding connectors receive a historical access flag, not a new reward or fabricated hand-in. An old ending remains complete; the new regional requests and added relationship chapters can still be played.

Dungeon names such as `tide-vault` identify a complex, not an extra playable room. Its actual area IDs are `tide-vault-1` through `tide-vault-5`; the approach portal targets `tide-vault-1`. Likewise `mine` is a group whose entry is `mine-floor-1`. `world.json` records these mappings in `portalEntries`; this keeps the 81-area count distinct from registry groups.

### Safe persistence

Each slot uses a header (version, name, farm, date, timestamp), content body and checksum for accidental corruption detection. Write a temporary file, flush and validate it, then replace the slot while retaining its previous backup. The checksum is not an anti-cheat or security claim.

If writing fails, keep the previous save, keep the session playable and show a clear one-time storage message. Loading a corrupt primary offers its valid backup; it never resets the farm silently. Import shows a summary before replacing an occupied slot. Export writes a versioned JSON file and opens the native share sheet without selecting a recipient.

## Ready-to-start editor handoff

1. Wait for the user to say the shared editor/MCP is available, or use a separately connected editor explicitly assigned to this project.
2. Verify `Application.dataPath`, editor version and active scenes through a read-only call. A path belonging to another project is not authorization to change that project.
3. Create/open `E:/Harvest Moon GPT 61/unity/Dewhaven` with the installed 6000.3.20f1 editor and a compatible URP 2D template.
4. Record the chosen package versions in the new project’s lockfile. Confirm Android build support and the portrait build target before importing the art subset.
5. Add the project identity/area registry, import manifest and editor content helpers. All subsequent MCP mutations stay under this project’s Assets/Dewhaven hierarchy.
6. Follow the implementation plan milestone by milestone. The first Android build must finish one farming day and reload it before the world expansion is duplicated.

No running editor, scene, source asset, old APK or owner signing key needs to be changed to prepare these documents.
