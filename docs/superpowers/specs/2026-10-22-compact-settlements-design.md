# Compact settlements, natural travel and clearer quests

22 October 2026. The user requests smaller, attractive and lively towns that retain their services, unique destinations/dungeons, automatic travel by continuing along a road, an obvious Talk icon, and clearer main/side quests. Existing authorization is to implement and improve the native game through Unity MCP; retain that execution method and the existing English Android portrait game.

## Intended experience

The four town footprints become roughly 68–76 tiles per side, retaining every one of the 44 building/interior identities and their shops, residents, quest givers and return doors. Houses form connected, close frontages around a modest common space rather than isolated buildings across empty lawns. Village has a market garden and river crossings, Aster Quay has a working waterfront/canal and timber piers, Sunridge has orchard terraces and flower courts, and Briar Hollow has an archive court and mountain gardens. The builder authors exact coordinates and decoration using the existing cohesive pixel assets.

The existing 13 exterior / 48 interior / 15 vault / five mine area identities stay valid. Farms and their placed equipment/plots retain coordinates. Existing approach areas receive distinct landmarks, rest/fishing/forage spots and a framed dungeon entrance; no dungeon is entered directly from an unexplained town road. Keep completed puzzle and quest state, names, rewards, story text and all 76 bundled VO passages.

## Travel

An explicit reciprocal passage catalogue owns all 16 exterior links. Each joins opposing cardinal edges, with individual edge offsets where two roads share an edge. Walking outward on its clear road strip triggers a short restrained fade and arrives safely several tiles inside the reciprocal road, facing/moving inward. Do not require Use/Travel. Keep a still-held flexible joystick captured during this transition, observe release events, and cancel held tool actions. Modal panels, background pause, tools in mid-swing and locked routes prevent automatic travel. No arrival bounce or repeated blocked-route messages. Returning along the road works. Other world boundaries stay solid; doors and dungeon confirmation retain their existing intentional interactions. The builder chooses exact offsets and timings.

## Life and talk

Keep all 25 named residents and their schedules, with a small capped set of clearly identified visiting townsfolk on authored public routes during the day. Guests never become quest givers or alter canonical resident/relationship state. Reuse existing distinct sprite families; no generated faces or music. A single nearby conversation cue uses the existing painted Talk artwork above the closest reachable speaker. The main action shows Talk and the speaker's short name; closing/range changes remove the cue. Avoid permanent nameplates and sign clutter. Prevent the player walking through active speakers.

## Quests

The journal has explicit Main quest / Side quests tabs. Main pages distinguish the active chapter, ready hand-in, completed memory and future chapter, show concise objective/progress and direct the player to the actual giver. A readable paginated objectives/rewards view provides every requirement. Preserve exact narrated strings and chapter memory/replay.

Side requests distinguish accepted/in-progress, available from known towns, and completed, with title, giver/location and progress/status. A detail view shows requirements/reward and a walking route. Browsing never accepts or pays a request remotely. Accept/hand in still occurs with the person or farmhouse ledger. Physical requests distinguish main vs side and display clear progress and disabled completion until ready. No long scrolling list, overlapping labels or tiny text; inspect short portrait at 135% text.

## Constraints and evidence

English; bright sandstone/champagne/espresso UI; flexible Android portrait controls; transparent painted HUD art; nature/physical SFX and English VO with no music. Reuse active-region meshes and capped path queues, no valley-wide simulation/render or per-frame pathfinding. Old save positions blocked/outside a compact town must recover to a safe point. Keep old APKs and make a separately versioned 2.3 candidate. No emulator campaign: focused transition/quest tests, content reachability, representative actual native walking/return/pause/UI renders, compile, and package inspection. Phone performance/real touch acceptance remains distinct from editor evidence.

## Builder choices

22 October steering: the user requested attractive larger dialogue faces without eyes or noses. Generated transparent featureless portraits are now authorized for all speakers; pixel sprite faces remain permitted. The user explicitly reaffirmed nature ambience and physical SFX without musical instruments. Add field recordings, quiet dialogue ducking and bounded playback, preserving the existing offline VO and its exact text.

Exact town footprints/placements, palette accents, optional landmark prose, guest sprite selection, route coordinates and fade timings are implementation choices within this scope. Additional main-quest/story writing, re-recording VO, production signing, live ads and Play publication are outside this update.
