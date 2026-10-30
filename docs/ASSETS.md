# Asset provenance

## Local game sprites

Supplied project: `E:/Harvest Moon Sprite Opus`.

Its packaged atlases were copied from `public/assets/pack`: farmer walk/tool animations, terrain, crops, and props. The supplied project is a Phaser/Vite game containing sprites sourced from a Unity asset collection.

The additional atlas was extracted by `tools/prepare_assets.py` from the licensed local collection:

`E:/Pixel Games Asset Master/Assets/Gif/Super_Retro_Collection/Resources`

Collection: **2D Cozy RPG Pixelart / Super Retro Collection**, by **Gif**. Additional local frames include houses, trees, rocks, crates, barrels, potted plants, lamps, statues, villagers, animals, farm icons, and eight grass animation frames. The packed extra atlas contains 787 frames. Grass frames come from `Prefabs_with_behavior/tall_grass_react_on_contact/Sprites` and are combined with original seasonal meadow textures.

Both source directories were read without modification. Raw paid sprite atlases remain local and are excluded by `.gitignore` from this public source export; their licensing continues to apply to distribution. Restore an authorized local copy using [the restoration instructions](RESTORING-LICENSED-ASSETS.md) and [file manifest](licensed-assets-manifest.json). No paid sprites were sent to an image-generation service. The runtime draws original small sprites, including original pixel faces in character menus. Ground placement compensates for atlas transparency and preserves the farmer's fixed foot pivot during tool actions.

## Original cinematic paintings

Version 1.1 uses four portrait paintings generated with the built-in OpenAI imagegen tool from text only:

- `public/assets/cinematic/letter.webp`: a letter and key in the old farmhouse.
- `public/assets/cinematic/valley.webp`: a bridge and a quiet valley at sunrise.
- `public/assets/cinematic/homestead.webp`: the waiting cottage and garden; also the title artwork.
- `public/assets/cinematic/dawn.webp`: first light in the empty bedroom; also home and morning scenes.

The original generated PNGs were converted to WebP without composition changes. All paintings were visually inspected. No people, animals or faces appear. Written narration is rendered by the game. The shared prompt and each scene prompt are recorded in [CINEMATIC-ART.md](CINEMATIC-ART.md).

## Earlier valley illustration

Retained file: `public/assets/brand/valley-v2.png`.

Generated with OpenAI imagegen from text. A subsequent edit used only the original generated illustration, never the licensed sprite pack. The illustration contains scenery and plants without human or animal figures. Version 1.1 uses the new homestead painting for the title and the original app emblem for the splash.

Final generation/edit prompt:

> Edit the original Dewhaven farm-valley illustration. Preserve the full panoramic composition, high quality detailed pixel art, cottage, vegetable garden, stream, bridge, forest, distant village, hazy mountains, sunrise and flowers. Remove every human, animal, bird and all other living creature figures completely, filling their former positions seamlessly with garden, grass, rocks or scenery. Absolutely no people, no animals, no birds, no creature faces anywhere in this illustration. Plants and trees are welcome. Refine the overall colors toward an elegant, restrained premium game key art palette: soft ivory-gold sunrise, weathered bronze and warm stone cottage, natural muted forest colors, clear desaturated teal water. Keep exquisite crisp pixel art and atmospheric depth. No text, no logos, no interface. Wide landscape full bleed. This artwork will be used as the main menu and splash screen of a farming game.

## Version 1.2 inventory and world art

Two text-only imagegen calls produced 32 original painterly item illustrations. The transparent WebP atlases are `public/assets/items/garden.webp` and `public/assets/items/workshop.webp`; generated PNG originals remain in `docs/art-source`. [ITEM-ART.md](ITEM-ART.md) records the tool mode, shared prompt, requested row order and source/output paths.

`tools/prepare-world-art.py` extracts 49 furniture, log-wall, floor, meadow, flower and pebble blocks from the licensed local `Environments/original_atlas.png` into `public/assets/world/furnishings.png` and its metadata. The already packed terrain atlas was copied locally from the supplied reference. No source directory was modified. Runtime world layouts and the slate vault floor detail are original to Dewhaven. Static ground details are cached; the source atlas is never uploaded.

## Branding, interface, and audio

The app icon is an original SVG barn, sun, and leaf motif, with PNG variants for web and Android launchers. `tools/android-assets.py` prepares Android density variants, adaptive icon foregrounds, and the branded splash from that icon. Interface typography uses self-hosted Fraunces and Nunito. Interface icons use Phosphor. Their upstream open-source font/icon licenses apply.

Tool shortcuts and the animated bronze coin are original editable SVG illustrations. Nature ambience and sound effects are original procedural Web Audio: wind, running water, weather, leaf rustle, and activity foley, including layered watering, soil scrape and coin rustle. There are no musical instruments, melodies, oscillators, or music recordings in the game.
