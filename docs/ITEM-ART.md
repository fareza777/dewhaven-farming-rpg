# Original inventory illustrations

Tool mode: **built-in OpenAI imagegen**, text-to-image generation, two separate calls, transparent background enabled. No reference image was supplied, and no licensed sprite was uploaded. Generated art contains plants, food, materials and inanimate objects only.

## Shared prompt

> Create a premium inventory ICON ATLAS for the original mobile farming adventure Dewhaven. ONE square image, exactly a clean 4 by 4 arrangement of sixteen isolated item illustrations on a fully transparent background. All sixteen cells equal sized, each icon centered in its cell with generous empty transparent padding, no object crosses a cell boundary. Painterly hand-painted gouache game-item art, beautiful confident shapes, warm ivory and antique bronze lighting, restrained jewel colors, rich natural detail yet readable at 48 pixels, soft dimensional shading, consistent three-quarter view. No panels, tile backgrounds, dividing lines, frames, labels, letters, numbers, logos, watermark or decorative borders. No people, human faces, animals, animal faces, birds or insects. Plants, food, materials and inanimate objects only. Items must remain separate, not form a scene. Follow the precise row order.

Garden atlas row order: turnip, potato, carrot, cabbage; radish, corn, pumpkin, cauliflower; berries, mushroom, wildflower, egg; wool, truffle, feed bag, fertilizer bag. Workshop atlas row order: timber, stone, copper ore, iron ore; crystal, sprinkler, bouquet, ring; soup, omelet, stew, boneless fish dinner; jam, brass compass, glass lens, ancient chart. The fish dinner prompt specifies a boneless fillet with no fish head or eyes.

## Generated sources

- Garden: `C:/Users/FAJAR/.codex/generated_images/01a103ca-7673-7361-a514-47acaae3a367/exec-489ae26b-8d31-4e55-b9f1-7f33b80a1562.png`
- Workshop: `C:/Users/FAJAR/.codex/generated_images/01a103ca-7673-7361-a514-47acaae3a367/exec-6c170772-4f56-4dc3-9de8-7230c0d410c9.png`

The original 1254 × 1254 RGBA images were copied to `docs/art-source/garden.png` and `docs/art-source/workshop.png` and converted to WebP without changing their composition. Alpha channels range from 0 to 255. Both atlases were visually inspected. The originals remain outside the runtime bundle to avoid packaging duplicate images.

Runtime files are `public/assets/items/garden.webp` and `public/assets/items/workshop.webp`. `src/ui/item-art.ts` maps the 32 illustrations to equal atlas cells. Existing pixel/vector artwork remains for items absent from the generated set. No new image requests are made while playing, and no prompts or licensed source assets are sent over the network by the game.
