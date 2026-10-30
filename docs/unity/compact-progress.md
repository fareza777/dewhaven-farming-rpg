# Execution ledger — docs/superpowers/plans/2026-10-22-compact-settlements.md

22 October 2026. Native execution in the existing dedicated non-Git Unity workspace. Original source/content/editor/tests snapshot: `tools/.cache/native-before-compact-towns.zip`.

Pre-flight: town geometry feeds interior return doors, NPC destinations, map routes and passage arrivals. Stable building/area IDs and a shared explicit passage catalogue prevent these interfaces drifting.

Ruling: use current task authorization and the established Unity MCP execution workflow; no repeated plan approval for routine design choices. The fresh builder check found no important unanswered questions.

Ruling: no Git repository; retain source snapshots and an ordinary ledger instead of Git-only workspace/commit scripts. Old APKs remain separate.

Ruling: keep farm, woodland, lake and approach dimensions/mission coordinates stable; compact the four town footprints, then improve approach composition and connect explicit road edges. This preserves placed equipment and worksites.

Ruling: add three daytime visiting townsfolk per town with guest-only dialogue, never quest/relationship state. Existing 25 residents and shop schedules remain canonical.

Task 1–4: in progress. Four focused tests added before implementation: compact reachable doors, reciprocal safe passages, outward/cooldown policy, and side/main status browsing without acceptance/payment.

RED observed: all four actual NUnit methods failed for the expected missing features, recorded in compact-red-observation.json. Cold tests-run timed out during editor import; the subsequent reflection observer invoked the real test methods and captured their assertions.

Latest steering: add generated dialogue portraits with no eyes or noses, while preserving readable short-screen dialogue. Music is pending the user's answer to the conflict with their earlier no-instrument instruction; continue world, quest, portrait and physical SFX improvements independently.

User answered: keep nature ambience and SFX, without instruments. Five portrait atlases generated with built-in image_gen; 30 transparent busts extracted at 384px (25 residents, Grandmother, three visitors, one traveller). Prompt/source manifests in art/portraits. No eyes/noses or facial features.

GREEN: 29/29 Unity EditMode checks passed, including the four new behavior tests. Content audit: 81 areas, 328 anchors, 84 quests, 36 bond scenes, no issues. Physical UI/play review and final package still pending.

Final review: one Important input-order finding; one Minor suggestion to put the speaker name beside Talk. Ruling: retain the compact Talk icon/label; speaker identity is shown prominently in dialogue, matching the user's request for minimal HUD text. Cost: identity is learned when opening the conversation rather than before pressing Talk.

Final review findings set aside: repeated locked-exterior warnings cannot occur with current content (all automatic targets are unlocked exteriors); native renders are authority for safe-area layout; no device/audio perceptual/APK claims come from static review; no demonstrated coroutine-destruction lease leak.

Final regression RED observed: releasing a road lease left Controls.Enabled false; a null restoration token incorrectly advertised a restoration reward. Actual NUnit assertions recorded in compact-input-red-observation.json. Fix: synchronize input from remaining pause owners before ending road preservation, and require a non-empty restoration ID.

Native short portrait captures at 360x640/135% show narrated dialogue, long physical weather request, main/side journal and objective/reward details without overlapping text. Painted Talk cue was only .32 world units because IconArt uses a one-unit sprite; enlarge the cue to .9, retaining canonical NPC scale. Half-texel terrain UV inset addresses sampled atlas-edge lines visible in the native street capture.

Final fixes GREEN: 31/31 EditMode checks passed (tools/.cache/compact-final-domain-tests.json), including both new regressions. The input assertion failed before synchronization, and the null-restoration reward assertion failed before token validation. Current art: tightened portrait extraction bounds exclude neighbouring-cell fragments; Cato holds a wrapped parcel, with no animal facial details.

Native focus check passed: real game crossing coroutine farm→village→farm, release/background/panel behavior, safe arrival, visitor-only dialogue, Talk cue and bounded field-audio bank. Inputs/background callbacks are editor fixtures, not a physical phone. Final street/forecourt captures saved for all four towns and Saltwind. No game errors in the inspected native console; the known MCP path-spaces diagnostic remains.

Task 1–4 complete. Ruling: retain prior canonical morning/evening schedules; inspect daylight guests in the native flow and statically check their 07:30–19:30/non-rain eligibility, following the user's request to avoid repeated test campaigns. Cost: no new morning/evening phone/session acceptance is claimed.

Task 5: build 2.3.0/code13 queued through the dedicated Unity MCP. No Assets edits during build. Exact package inspection and delivery still pending.

Task 5 complete: dedicated Unity build succeeded at 2026-10-22T13:56:33Z. APK `release/Dewhaven-Unity-2.3.apk`, 79,944,601 bytes, SHA-256 `d7290de5e81434e5569f3f759bb8990a73dabd685d39873d28b0f3bc7ecb5865`. Forty exact-package checks passed, including package/version, ARM64 portrait/API26–36, local test signature, ZIP/native 16K alignment, all 177 VO resources, 30 portrait resources, five field loops, three watering variants, demo ads/consent/save-picker classes, unchanged VoiceDirector/catalogue, 31 domain checks, native compact flow and all four older APK hashes. Fresh source/full-APK credential-marker scan passed; no credential value is recorded. Delivery metadata, checksum and README saved alongside the APK. Physical phone acceptance remains unverified.
