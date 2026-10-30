# Dewhaven 1.4 — towns and everyday life

The requested outcome is a larger, coherent farming world that feels inhabited. English remains the default; the UI uses ivory, charcoal and bronze. Portrait controls, transparent item art, nature-only sound, and existing farm progress stay compatible.

## World and play

- Four authored towns replace the small crossroad layouts. Distinct neighbourhoods, waterways, gardens, courtyards and useful storefronts create destinations along connected streets.
- Every visible house has an interior. Seed shops, food shops, ranch, forge, carpenter and outfitters sell their own stock or upgrades at physical counters. The pause menu contains personal information and settings, never remote shopping, shipping, crafting, resting or upgrades.
- Twenty-five residents have actual sprite identities and daily work, errands and evening walks. Movement uses the same solid terrain as the player, with bounded pathfinding and camera culling.
- Four distinct playable sprites replace colour filters. All movement and tool effects use the selected character.
- Conversation uses a compact dialogue sheet with a speaker, readable text and clear responses. Resident profiles remain separate. Gifts, requests and friendship scenes require meeting the resident.
- Saltwind Cliffs, Ember Trail and Observatory Rise lead to dedicated ruins entrances. Copperleaf Pass leads into the mine. City streets no longer drop directly into a dungeon. Entrance previews explain the place before entering.
- Interiors use distinct floor plans and palettes: stock displays, service counters, kitchens, bedrooms, storage, reading rooms and work areas.

## Delivery

Implement data and maps first, then residents and physical services, then conversation and menu presentation. Preserve version-1 save files, migrating coordinates from old town layouts and adding new friendships. Keep static scenery cached with a maximum of three backgrounds. Run focused checks of changed systems and compile a new Android APK; do not repeat the long emulator/ad test campaign.
