# Dewhaven 2.3 evidence

The native Unity project is `unity/Dewhaven`. The dedicated editor/MCP was guarded to this project on port 8094; other editors were not used. Builds and previews came through that MCP.

## Delivered changes

Four town footprints reduced from 99,072 to 19,872 cells, preserving 44 town buildings and their interior IDs. Distinct gardens, canal/stream crossings, harbour piers and dungeon forecourts give the roads useful destinations. The farm, woodland, lake, outdoor approach dimensions and mission worksite coordinates remain stable.

One shared catalogue defines 16 opposing road pairs and safe arrivals. The native game owns a short fade and a clock pause; the joystick keeps reading movement/release during transit. A final review found an input update-order race. Its regression failed first, then passed after the crossing released its pause and refreshed input availability before dropping preservation.

Three local daytime visitors per town use separate guest dialogue. They do not enter the resident friendship/quest state. Residents and visitors use foot collision, a bounded path queue and one nearby painted Talk cue. The cue was corrected from .32 to .9 world units after checking IconArt's pixels-per-unit. Named resident sprite scale remains unchanged.

Main/Side journal pages show status, progress, giver/location, requirements, rewards and a walking route. Browsing is read-only; physical request discussion/hand-in remains at the person or ledger. A native reward view exposed a JSON-null restoration token being counted as a promised reward; a failing regression verified the correction.

Five portrait atlases generated with built-in image_gen supply 30 transparent busts. Faces have no eyes, nose, mouth or other facial features. Outfit, hair and pose distinguish the speakers. Cato's catch is fully wrapped. Source images, prompt sets and revision provenance are in `art/portraits`; final resources are in `Assets/Dewhaven/Resources/Dewhaven/Art/Portraits`. Import uses Android ASTC 6x6 without mipmaps or a CPU copy. Runtime portrait lookup is lazy.

CC0 field recordings supply birds, wind, river, rain and cavern water. Five loops stream. Nineteen short physical effects use a four-source pool; watering has three variants. Eight sources include the two crossfading beds, water, four foley voices and existing narration. Nature becomes quieter during narration. The user explicitly reaffirmed no musical instruments; no music is included.

## Observed checks

- Four initial feature tests observed failing before implementation: `compact-red-observation.json`.
- Two final regressions observed failing before fixes: `compact-input-red-observation.json`.
- Final EditMode result: **31 passed, 0 failed**, `tools/.cache/compact-final-domain-tests.json`.
- Content reachability audit: **81 areas, 328 anchors, 84 quests, 36 bond scenes, no issues**, `tools/.cache/compact-content-audit.json`.
- Focused actual native road/return/release/background/panel/guest/audio flow passed: `native-compact-check.json`. Inputs and background callbacks were controlled editor fixtures, not a phone.
- Native 360×640 captures at 135% text: `captures/compact-vo-short.png`, `compact-weather-short.png`, `compact-main-short.png`, `compact-side-short.png`, `compact-details-short.png`. Final street/approach captures are `compact-*-final.png`.
- Console inspection contained only the MCP plugin's generic project-path-spaces diagnostic; no game compile/runtime error was reported in these flows.
- Asset import: 30 portraits, 24 non-musical audio clips, `compact-asset-import.json`. Thirteen new processed audio files total about 2.26 MB with measured positive RMS and peak headroom below .71, `nature-audio-sources.json`.

## Decisions and limits

Existing task authorization covered routine implementation; no repeated plan confirmation was needed. There is no Git repository, so a native source snapshot, this ledger and separate versioned APKs replace Git-only worktree/commit scripts. Farm/approach coordinates remain stable to preserve worksites/equipment. Guests remain outside canonical resident/relationship state. The static review's minor suggestion of an extra HUD speaker-name label was deferred to preserve the user's compact HUD; names appear prominently when dialogue opens.

The existing VoiceDirector and voiceover catalogue are retained. Prior 2.2 narration lifecycle evidence is labelled as prior evidence; this update checks the same bundled recordings and their packaging rather than claiming a new full listening review.

Physical Android touch/audio routes, sustained memory/thermal performance, real test-ad impressions, document picker/share round trips and a natural full campaign playthrough remain unverified. Google demo ads and local test signing are retained. Store publication, owner production signing, rating URL, live ads and consent configuration are outside this candidate.

The exact APK, signature/alignment/resource checks, preserved old APK hashes and delivery digest are recorded after build by `record-unity-compact.py` and adjacent release metadata.
