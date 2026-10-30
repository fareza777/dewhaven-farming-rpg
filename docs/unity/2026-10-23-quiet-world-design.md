# Dewhaven 2.4 — quieter sound, purposeful landscapes

The user authorizes sparse, quiet background music and requests prettier outdoor areas with shorter, useful roads. Existing Android portrait controls, English narration, towns, shops, quests, saves, and all prior APKs remain supported.

## Design

Replace the generic outdoor crossroads with nine authored landscapes. Trails follow shorelines, woodland clearings, orchards and quarry contours; each branch ends at a connected area, home, fishing spot, resource clearing or dungeon approach. Keep all 16 reciprocal world connections. Keep all 44 town buildings; replace their perimeter grids with connected curved streets and refine gardens and waterfront edges. No extra signboards or floating explanatory boxes.

The homestead keeps its existing house, barn, crop and equipment coordinates; reduce its unused boundary to 104 × 80. Forest becomes 80 × 68; lake 78 × 68; cedar 68 × 60; marsh 70 × 64; Copperleaf 66 × 60; cliffs 64 × 58; Ember 64 × 60; observatory 64 × 72. Central destinations stay within a few portrait viewports. Authored curves replace automatic long L-shaped approach roads. Borders contain clustered vegetation or rocks, with clear walking corridors. Bridges occupy water crossings rather than giant paved rectangles.

Forest: ranger cottage beside a short branching trail, creek crossings and a forage glade. Lake: a cottage on the western bank, two compact piers, a gathering table and a southern marsh path. Cedar: orchard rows surrounding a picnic clearing. Marsh: a meandering bank path with short boardwalk crossings and two fishing bends. Copperleaf: a cart trail to a distinct minehead. Saltwind: a coastal path, tide fishing and a raised vault court. Ember: a curved quarry approach around a drainage pool. Observatory: a short climbing trail with three sheltered landings and an upper court.

Move outdoor worksite positions and every affected interior/dungeon return landing together. Preserve their IDs, receipt/stat keys and quest requirements. Old exterior save positions outside the new boundary fall back to a safe area entrance; crop/equipment state remains unchanged.

Remove the looping bird bed entirely from active playback. Use low wind and restrained water/rain recordings. Compose four original offline ambient loops: daylight, evening, trail and cavern. Soft sustained harmony, sparse tones, no percussion or vocals, no crowded orchestration. Crossfade two streamed music sources slowly; default music volume is low, independently adjustable. Narration ducks music strongly. Music follows background/ad suspension and resumes without extra sources. The fixed audio budget is ten sources including voice.

## Verification and delivery

Add focused checks for compact exterior footprints, authored trail connectivity, usable return landings, legacy audio preferences and sound selection. Run the existing native content/navigation audit and EditMode suite once after implementation. Inspect a landscape contact sheet and the short-phone audio settings. Keep narration assets byte-identical. Build a separate native Unity 2.4.0/code 14 APK with test advertising IDs; verify the actual package and preserve the 2.3 APK hash. No emulator test campaign.
