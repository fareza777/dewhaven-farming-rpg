# Dewhaven 2.1 — native Unity campaign

Android 8.0 or newer, 64-bit ARM. Portrait. English. Signed with the local Android test key; not a Play production release.

## What is playable

- Wake in the farmhouse, plant/water/gather eight crops, fish, cook/craft, care for chickens/pigs/rabbits, ship harvests, and sleep for the next day.
- Walk through four towns and their physical shops, workrooms and homes. The current-region renderer covers 13 exteriors, 48 interiors, 15 vault chambers and five mining floors. Twenty-five named residents have distinct sprite families and schedules.
- Follow 24 main chapters and 60 optional requests, repair public routes/rooms, pack the valley convoy, and see its collection at the next dawn.
- Solve nine persistent water, lift, vent, rail, shutter, gear and plate systems across three five-room vaults. Each atlas instrument has one reward receipt and a return shortcut.
- Join 12 annual activities and four weekly tables. Meet six adult relationship candidates through 36 authored scenes, then choose optional partner/household routines.
- Use three validated save slots, farmhouse storage, physically placed sprinkler/scarecrow/fertilizer, town/valley maps, route markers, calendar and chapter replay.
- Bright sandstone/champagne menus, espresso text, transparent painted item/HUD art, large paginated dialogue, flexible joystick and configurable controls. Pixel faces are allowed; opening paintings contain landscapes/objects. Nature ambience and physical foley only, with no music or instruments.

## First morning

Choose Begin your story, enter names, select one of four travellers, then watch or skip the four-page opening. Leave the bedroom, follow the farm path to the growing beds, and use the shortcut tools with the large action button. Ripe crops are gathered contextually. Mira's Seedhouse opens at 08:00; walk to the counter to buy seeds. Put produce in the farm's shipping crate and sleep at your own bed for payment and crop growth.

The menu opens your bag, maps, journal, resident notebook, calendar, guide and settings. Purchases/upgrades/cooking/shipping/rest happen at the corresponding place. Select a map destination to draw a walking route. The game does not sell items or teleport to vaults from the personal menu.

## Saves and ads

The older web app and this native package are separate. Export the old homestead as JSON, then use Settings → Saves → Import a homestead. Review the summary and target slot before confirming. An import retains both the original source and replaced farm in permanent local import archives, separate from rotating backups. Existing native saves load from their normal three slots.

Only official Google demo application/unit IDs are configured. Title/pause banners reserve their loaded height; gameplay, dialogue, onboarding and forms hide them. Interstitials use natural sleep breaks and cooldowns. The voluntary rest ad grants 25 energy only after an earned callback, with daily and energy caps. Ads are muted and optional; offline farming does not depend on them. The demo consent fallback is not a production consent configuration.

## Verification and remaining release work

Twenty-two focused domain checks, one representative native farming day, and the actual 15-chamber puzzle/relic/save integration passed in Unity. The final season checks reject an unpurchased greenhouse and clear expired crops on season rollover while preserving restored-greenhouse crops. Eighty-one constructed areas and 325 interaction anchors passed the content reachability audit. Dungeon navigation used routes/anchor warps; all 24 chapter rules were checked with satisfied fixtures. Those checks are not a full natural campaign playthrough.

Native renders include 390 × 844 and 360 × 640 at 135% text. The package's version/signature/architecture/portrait settings, required content, Google Ads/consent classes and Android picker class were inspected. No physical Android device was connected: install/touch traversal, keyboard/navigation, actual demo-ad display, document-picker/share round trip, memory, thermal behaviour and frame/load times remain unverified. Economy/story pacing and further environment art finishing remain open. This is a substantial playable campaign candidate, not an asserted completed AAA game.

Before Play release, configure the owner's production signing, store listing/rating URL, live AdMob IDs and consent messages, and finish device acceptance. The current Rate action explains the listing is available at launch. Share opens Android's chooser without selecting a recipient.

The adjacent info JSON and checksum record this exact APK. Previous web and Unity preview APKs are retained unchanged. Native screenshots and evidence are under docs/unity; audio provenance is in docs/unity/foley-sources.json.
