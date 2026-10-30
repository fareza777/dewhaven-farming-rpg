# Compact settlements and natural travel implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Native execution in this session preserves the user's Unity MCP workflow.

**Goal:** Make four compact lively towns, readable destinations, automatic reciprocal road travel, a visible Talk cue and an understandable main/side quest journal.

**Architecture:** Keep stable content identities and the existing active-region renderer. Explicit reciprocal passage data and a small traversal policy drive automatic travel; focused settlement dressing and guest actors provide density without changing the canonical schedules. A shared quest presentation helper feeds journal/detail/physical request views without changing quest rewards or VO text.

**Tech Stack:** Unity 6000.3.20f1, C#, Newtonsoft JSON, existing sprite atlases/UI fonts, Android ARM64 IL2CPP, dedicated MCP :8094.

**Spec:** `docs/superpowers/specs/2026-10-22-compact-settlements-design.md`

## Global constraints

- English Android portrait, bright sandstone/champagne/espresso, flexible controls; no music.
- Preserve all 81 area IDs, 44 town buildings, farm coordinates/equipment, 25 residents, quests/puzzle receipts and 76 VO passages.
- Current region only, bounded guest actors and two path requests/frame; no continuous world-wide render.
- No remote request acceptance/payment; retain physical shops and quest givers.
- Preserve previous APKs/saves; separate 2.3.0 / code 13 output. No emulator campaign.

## Review focus

- Reciprocal gate offsets and held input must not produce arrival bounce, wall spawning or control suppression.
- Background/modal/locked-route/tool pause must not accidentally cross or leak its pause owner.
- Old town save coordinates must recover, and all doors/anchors remain reachable after compact dressing.
- Guest talk must not reach resident-only quest/relationship state or duplicate a canonical actor.
- Quest text/progress/reward/footer must remain readable at 360 Ãƒâ€” 640 / 135%, with exact VO text preserved.

### Task 1: Compact content and distinct places

Files: content `towns.json`, `world.json`, `World/AreaDefinition.cs`, `World/WorldDressing.cs`, new `World/SettlementDressing.cs`, `World/WorldView.cs`.

- [x] Snapshot native source/content/editor/tests; inspect sprite dimensions and current reachable areas.
- [x] Author compact footprints, roads/water/bridges, all building coordinates, guest routes and restrained landmarks; retain identifiers.
- [x] Add settlement-specific dressing and clearer dungeon forecourts, with clear approach/landing cells and boardwalk terrain.
- [x] Check door/anchor reachability and representative town/approach native renders.

### Task 2: Natural road passages

Files: new `World/WorldPassages.cs`, new `Simulation/RoadTravelPolicy.cs`, `AreaDefinition.cs`, `DewhavenGame.cs`, `TouchInput.cs`, `GameUI.cs`, focused `Tests/EditMode/TravelAndJournalTests.cs`.

Interfaces: `WorldPassages.Attach(AreaDefinition)`, `WorldPassages.Arrival(string target,string from)`, gate metadata on `WorldAnchor`; a pure travel policy evaluates outward movement/strip/cooldown and lock ownership; native game owns the fade and area switch.

- [x] Write and run focused failing cases for reciprocal safe arrivals, outward-only crossings and cooldown/paused input conditions.
- [x] Implement 16 explicit opposing passages, clear edge corridors and safe incoming offsets, preserving manual doors/dungeon confirmation.
- [x] Implement a short fade/clock pause with still-held input retention and guaranteed cleanup on background/destruction.
- [x] Verify actual walking across/returning, a held-input release during transit and blocked-route behavior in the native player.

### Task 3: Lively streets and Talk

Files: `ResidentDirector.cs`, `PlayerMotor.cs`, `GameUI.cs`, new `GameUI.Quests.cs` if used for guest dialogue.

- [x] Add a capped set of local daytime guests using authored paths and existing sprites, with guest-only simple dialogue.
- [x] Add physical speaker collision and one closest-speaker cue; retain named schedules, counters and dialogue/VO behavior.
- [x] Inspect daylight population and actual nearby Talk action, and statically check morning/evening eligibility while retaining canonical schedules; keep path budget bounded.

### Task 4: Clear quest journal

Files: new `Simulation/QuestPresentation.cs`, `GameUI.World.cs`, `GameUI.Life.cs`, new `GameUI.Quests.cs`, focused tests above.

- [x] Write/run failing cases for future/ready/complete statuses and accepted/available/completed side lists without mutating accepted/rewards.
- [x] Implement shared status/progress/location helpers, Main/Side tabs, paginated details/rewards and physical hand-in clarity, preserving narrated copy.
- [x] Verify route targets, physical completion and short portrait renders at large text, then run the focused domain suite once after relevant fixes.

### Task 5: Review and native delivery

Files: editor audit/check helper, `Editor/BuildProject.cs`, new package recorder and `docs/unity` evidence/release notes.

- [x] Review the final implementation and resolve concrete issues; verify content and focused native flow.
- [x] Queue a separate Android 2.3 build through dedicated Unity MCP; no source changes during build.
- [x] Inspect exact package/version/signature/resources/alignment, preserve old APK hashes, record honest evidence/limits and deliver the new APK.

No Git repository exists; source snapshots and separate versioned outputs replace commits/worktrees here.
