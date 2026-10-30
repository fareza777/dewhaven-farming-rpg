# Dewhaven 2.3

Native Unity Android game, English and portrait. Android 8.0+, ARM64. This candidate uses the local Android test signing key.

## This update

- Four more compact towns preserve all 44 enterable town buildings, physical shops and upgrades. Timber crossings, waterfront piers, orchard pockets, reading gardens and distinct dungeon forecourts clarify the valley.
- Follow an outdoor road to its edge to change locations automatically. Sixteen reciprocal road pairs arrive safely inside the next area. Doors and dungeon gates keep their deliberate interaction.
- Three visiting townsfolk walk each town during the day. Nearby speakers have a painted Talk cue; their names appear in dialogue. Named residents keep their existing schedules.
- The journal separates Main quest and Side quests, with status, progress, giver/location, objectives, rewards and walking directions. Available/Active/Done filters do not accept or pay requests remotely. Meet the giver to discuss and complete a request.
- New hand-painted dialogue portraits show illuminated, featureless faces without eyes or noses. Different clothes, hair and poses distinguish the cast. Transparent art sits directly on the warm dialogue surface.
- Nature recordings add birds, wind, river, rain and underground water, with smooth environmental fades. Three watering splashes and physical tool/UI sounds add variation. Nature ambience, activity sounds and VO have separate settings; ambience becomes quieter during speech. **No music or musical instruments.**

The flexible joystick and tool shortcuts remain. The current region is rendered rather than the whole valley. Only a small guest group and two path requests per frame are active. Field recordings stream; portraits load when needed and use Android ASTC compression.

## Continuing your story

Keep the app installed and install this update over the earlier native Dewhaven package to retain saves and preferences. Old positions outside a compact town recover to a safe landing. Older APKs are preserved alongside this candidate. The older web package has a separate save format; use its JSON export/import flow when needed.

The campaign remains 24 main chapters, 60 side requests, 25 named residents, 36 relationship scenes and 81 exterior/interior/dungeon/mining areas. The existing 76 voiced intro/main-quest passages, 177 sentence recordings and 16 English voices remain bundled offline. Replay repeats the visible spoken page. Daily dialogue and side requests use text.

## Verification and release limits

The adjacent info JSON and SHA-256 identify the finished APK. Evidence under `docs/unity` includes 31 passing Unity EditMode checks, a focused native road/return/background/input/guest/audio flow, content reachability, and actual short portrait UI captures at 135% text. Native input checks use a controlled editor fixture. They do not replace real phone acceptance or a full campaign playthrough.

Physical Android installation, touch feel, audio routes/interruptions, sustained memory/thermal performance, real test-ad display, navigation insets and file/share round trips still need device acceptance. This candidate retains Google demo ad IDs and muted ads. Production signing, live AdMob configuration, consent messages, store listing and rating URL remain owner release work.

Nature/physical audio sources are CC0: [Thimras](https://opengameart.org/content/park-ambiences), [Ylmir](https://opengameart.org/content/rain-loopable), [rubberduck](https://opengameart.org/content/40-cc0-water-splash-slime-sfx) and [Kenney](https://kenney.nl/assets/rpg-audio). Portrait prompt/source manifests are in `art/portraits`; extraction and imported assets are in the Unity project.
