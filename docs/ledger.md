# Implementation ledger

## 13 October 2026 — version 1.3

- Removed all item plates, including pixel fallbacks, and inventory card backgrounds. Tool shortcuts moved to a compact grid on the action side, mirrored for the opposite hand. Tall interior views now have an opaque charcoal backdrop below their floors.
- Increased phone typography, default shortcuts to 48 px and the main action to 88 px. Stronger selected-tool contrast, optional selection vibration and longer watering ripples make tool use clearer. Compact gold notation preserves readable HUD spacing even at one billion gold; full values remain accessible.
- Added native Google AdMob demo units with UMP, muted audio, separate adaptive-banner space, opening/day/cooldown interstitial guards, and voluntary bounded energy rewards validated by native completion receipts. Demo previews never change the farm. The banner reserves hidden or visible navigation insets plus an 8 dp gap and switches native navigation icons to dark on its ivory area.
- Initial and duplicate Android resume callbacks no longer open Pause while the farmer is active; only a genuine background/return cycle does. Full-screen ad restoration retains its separate guard. Late banner callbacks stop safely after plugin destruction.
- Final browser, native and artifact evidence is recorded in VALIDATION.md and ADMOB.md. Native QA targets the actual localhost game WebView explicitly, because Google ads create additional WebViews in the same process. An initial software-emulator video transition stalled Android's render thread; subsequent native testing uses the host GPU.
- Version 1.3 verification uses its own `dewhaven_sdk_13_qa` AVD on port 5572/CDP 9233 after another project began using the earlier test emulator. That other app and emulator are left alone.

## Initial implementation

- Workspace initially empty. Source contains a Phaser game and locally packed Unity assets.
- Ruling: native browser Canvas implementation — avoids inheriting another game's architecture and is immediately playable on desktop/touch. Platform preference requested asynchronously.
- Ruling: proceed on the explicit build instruction; process-skill approval gates do not override the session instruction to complete authorized work.
- User steering: English default, premium charcoal/ivory/bronze UI, viewport-fit play screen, concise copy; nature ambience and SFX only, no instruments.
- User clarification: normal small sprite faces in the game world are permitted. Pixel sprite faces in the character menus are also permitted after the latest clarification. Menu landscape art contains no humans or animals.
- Delivered Dewhaven: five maps, seasonal farming, animal care, crafting, fishing, villagers, seven story chapters and ten requests, app menus, saves, and production offline support. See README.md for the player guide.
- Feet now use the atlas's visible foot pivot, including tool animations. Black masking rectangles were removed from the original pixel sprites and character previews.
- Fences render and collide from the same segments. Continuous foot collisions cover trunks, buildings, rocks, stations, villagers, animals, water and mine walls. Click paths test each edge and enter through the field's gate.
- Home, Barn, Crop field, and route signs use short readable labels with viewport bounds. Text sizes and spacing were polished; phone catalogs use pages. The phone character list shows four neighbors per page and fits without scrolling.
- User follow-up: the two gold lines over the hero were a player-position marker. Removed this unclear decoration from rendering.
- Full-story verification exposed a friendship tracking error: quest rewards increased hearts before a neighbor was met. Permanent met flags now track introductions independently; older saves migrate safely.
- Storage-disabled browsers can still start and play; manual save reports unavailable storage. Export/import and existing three-slot saves remain supported.
- Production offline reload initially failed on Vite's Vary: Origin cache matching. Local static assets now match independently of request header variation. The build cache revision also includes service-worker source changes. Real offline reload and continue pass with all 26 files cached.

## 13 October 2026 — version 1.2

- The version 1.1 portrait redesign removed the earlier world labels, greeting, sidebar and large navigation card. Four cinematic paintings and concise floating shortcuts remain.
- Floating joystick movement is now the default. Five short settings tabs expose handedness, thumb layout, response, running, held actions, sound, framing, battery mode, motion, time and saves. Old preferences and stories migrate safely.
- Read the supplied Opus code/art and inspected its local built UI for terrain, menu and control reference. Dewhaven's towns, residents, story and layouts remain original.
- Added Aster Quay, Sunridge and Briar Hollow; fifteen authored interiors; Tide Vault, Ember Gallery and Sky Observatory. The world now has twenty-six scenes. Building doors return to their own doorstep; walls, furniture, people and barn animals have physical footprints.
- Expanded to sixteen main chapters, nineteen optional requests, nine residents, six adult romance candidates, eighteen choice scenes, daily partner walks and three weekly town gatherings in the calendar.
- Generated two text-only transparent item atlases with thirty-two illustrations. No paid source art was uploaded, and generated art contains no people or animal faces. Local source directories remain unchanged.
- Static meadow patches, flower detail, floors, walls and window light are baked into cached backgrounds, capped at three. Moving water/objects/grass are camera-culled. Added elapsed-time run/hold behaviour and optional 30 fps rendering.
- The full sixteen-chapter progression test completes the story through farming, shipping, crafting, ore collection, mechanisms and shared tables. Browser checks exercise actual farmhouse entry/exit, discoveries, gatherings, relationship choices, chapter replay, generated art and configurable touch controls. Final build/native evidence is in VALIDATION.md.
- Final visual review caught wrapped chapter titles overlapping in the small journal grid. Chapter controls now show a readable number/icon with accessible titles and at least 44 px touch targets; the bag no longer repeats navigation already in the menu. Added final protection for the three atlas discoveries: bag/shipping/gift flows cannot discard them, and full bags cannot partially consume vault rewards.
