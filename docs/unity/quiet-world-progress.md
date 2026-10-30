# Quiet-world update — 23 October 2026

- Preserved the delivered 2.3 native source in `tools/.cache/native-before-quiet-world.zip` and retained all previous APKs.
- Authored nine compact landscapes and four curved town street networks. Exterior surface area:146,432 →43,744 tiles (70.1% reduction). All44 town building IDs and all16 reciprocal world connections remain.
- Preserved crop/equipment coordinates. Moved outdoor worksites, cottage exits and all dungeon/mine surface returns together. Invalid legacy exterior positions use a checked safe entrance.
- Replaced the continuous bird bed with quieter air/water/rain. Added four original sparse ambient compositions (408seconds total), independent low-default Music volume, streamed crossfades, rapid narration focus, mute and suspension.
- Reviewed native overviews for all13 exteriors and portrait forest/lake views. Replaced broad generic crossroads with narrower trails and purposeful branches. Warmed paving, framed town edges, shortened piers/bridges and removed rectangular dirt sprites from roadside stone decoration.
- Builder check caught the two mine surface-return constants and the old landscape/forecourt layers. All were updated together.
- Fresh whole-change review found four P2 issues: forage renewal IDs, short safe-area audio overlap, slow voice ducking and a prebuilt paid crossing. All four were repaired; review follow-up reported no remaining P1/P2 defects.
- Curved roads exposed the old2,048-search route limit on a reachable town door. Heap-based A* with bridge/paving costs and a4,096-search cap restored the route; all44 town front doors pass.
- Final functional suite:37/37. Content flood audit:81 areas,334 anchors,84 quests,36 bond scenes; zero issues.
- Native road/guest/input flow passed, including background/resume and the ten-source audio budget. Native audio observation measured full Music gain0.65 →0.104 within250ms of narration, followed by recovery; mute and pause/resume passed.
- Audio settings inspected at135% text in a360×568 usable viewport, equivalent in size to a360×640 display after24px status/48px navigation reservations. This is an editor layout simulation, not a physical Android inset test.
- One test request was abandoned after accidentally starting an EditMode run from play mode. Stopped play mode, confirmed no active Unity test job, cleared the abandoned MCP lease and ran the final suite in edit mode. Its invalid intermediate result is not delivery evidence.
- The first packaging attempt was stopped in this project's editor to correct the roadside dirt sprite found in the last phone render. Other Unity editors were not touched. Rebuilt from the corrected source.

Physical Android installation, listening and thermal/frame-time performance remain device checks. This candidate uses the existing local test signing and Google demo advertising IDs.

Delivered 2.4.0/code14:80,978,669 bytes, SHA256 `4e190b28ff30b9ae5c5b2f11b85a6b6d7da876d8b435cee38a9f12e1d07f8397`. All54 package/source checks pass. Final forest/lake previews were recaptured at390×844 after restart; the temporary landscape-layout images were replaced. See `quiet-world-release-evidence.md` and the adjacent release info JSON.
