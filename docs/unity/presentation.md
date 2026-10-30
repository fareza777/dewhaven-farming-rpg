# Presentation, conversations and the first day

This is a direction document for the Unity edition, not screenshots of a finished Unity game. English strings below are draft game copy. Placeholders use a controlled formatter for player/farm names and are never interpreted as rich-text markup from a save.

## A consistent visual language

| Layer | Treatment |
| --- | --- |
| Interface background | Warm ivory `#F4EFE5` |
| Primary ink | Charcoal `#283236` |
| Main accent | Bronze `#9C7848` |
| Secondary ink | Warm slate `#736D62` |
| Divider | Sandstone `#D7CDBD` |
| Headings | Fraunces, regular; 28–36 logical units in phone panels |
| Body / controls | Nunito; body 16, dialogue 18, supporting labels 14 |
| Touch targets | Minimum 48; primary world action 88 |
| Corners | 6–8 on controls, 12 on sheets; no nested rounded cards |
| Feedback | Small physical movement, quiet foley, brief colour/weight change |

Town colour appears through roofs, stone, water, flowers and planting. It does not turn the menu chrome green. Keep sprite pixels crisp and painterly item art smoothly sampled. Generated item art has a transparent silhouette and restrained shadow, never a square colour plate. Use natural light to unify disparate existing assets rather than rotating each character’s hue.

### Town identities

**Dewhaven:** red tile and warm timber along Seed Lane; blue-grey civic roofs across the stream; gardens and workshops frame the main square. The ranch opens onto a meadow, the timberyard has visible stacks, and the forge has a stone yard. The letter court gives the courier a visible destination. Houses sit in small gardens connected to the same street network.

**Aster Quay:** weathered timber, pale stone, teal-grey water and bronze fittings. Canal bridges connect shops to the boatworks. Cargo lanes, a fish counter, a storehouse, mooring posts, boats and a lighthouse establish a working harbour. A broad promenade becomes the social route after work. The cliff road leaves the harbour before the coastal descent begins.

**Sunridge:** honey-coloured stone, orchard rows, terraced beds and glass. Paths curve around the slope rather than copying the harbour grid. A potting bench, flower shop, pantry, presshouse and seed library give the orchards a working economy. The quarry road changes from planted land to gravel, machinery and old masonry before reaching the glassworks.

**Briar Hollow:** grey stone, dark timber, heather, clear stream water and sheltered reading gardens. Steps connect an archive terrace to workshops and homes. Map cases and drying herbs give the interiors their identities. The upper route narrows into a mountain path with shelter before the observatory stair.

Keep each shop recognisable without a floating text label. A sewn pack, seed emblem, anvil or fish silhouette attached to the facade is sufficient. Direction posts appear only at the relevant town forks. Lamp/plant placement helps guide the eye without filling every tile.

## Screen composition

### World

The canvas fills the portrait display behind a thin top HUD. Date/time/energy occupy the upper left; a bronze coin and balance occupy the upper right. Three compact controls open Map, Journal and Menu. Android Back and Menu expose Pause. No persistent house name, field name, greeting, objective card or large bottom dock covers the scenery.

The flexible joystick starts at the thumb on the movement side. The opposite thumb gets the main contextual action, with a small two-row tool cluster below. The bag is in that same cluster. Ground work shows only a subtle target ring. Approaching a person changes the action label to **Talk**; a door to **Enter**; a valid counter to **Shop** or **Orders**. A held farming action cannot accidentally open and choose dialogue responses.

The action-side group mirrors as a whole in left-handed mode. Size/height settings cannot move a button into the system navigation inset. HUD spacing accommodates a compact million-gold amount and a full accessible balance.

### Conversation

A bottom sheet occupies roughly 35–45% of the phone, leaving the world and speaker location visible. A 64–80-unit pixel portrait sits beside a 28-unit name and one short role/status line. The body uses 18-unit text, a comfortable line height and an authored page boundary. The bottom contains up to four response targets.

Text reveal defaults to fast, approximately 14 ms per character. The first tap completes the current line; a second tap advances. An instant setting is available. No continuous typing loop, portrait bounce, looping music or repeated friendship toast accompanies ordinary conversation.

Birthday, favourites and biography live in the resident notebook. A conversation can expose a relevant favourite through an actual line. First meetings mark the resident met. One daily greeting/conversation grants the daily friendship credit; switching topics never grants it again.

### Shop

Show the venue, merchant and current balance at the top. Two products per phone page have unboxed art, an 18-unit name, one useful description, price and quantity controls. A single clear **Buy** action completes the selected quantity. The balance and owned quantity update in place, with one short coin animation. Product paging stays in the same position.

Upgrade orders show the current tool/house/bag stage, required gold and materials, and the concrete benefit together. Insufficient materials are named directly. The button says **Order upgrade**, not a vague icon-only action. A confirmation is reserved for a costly irreversible order, with the full cost visible; ordinary one-item shopping uses direct feedback.

### Personal menu and journal

Use a small, deliberate list of personal tools: Map, Journal, Bag, Residents, Calendar, Almanac, Save, Settings, Help and Pause. It is not a second shopping centre. About, Share and Rate sit in a secondary footer.

The journal opens at the active objective. **Set route** directs the player to the giver or work site. The reward is displayed as information. **Hand over items** belongs to the physical interaction with that giver. Chapter replay has a simple page control and keeps its own readable story layout. A failed hand-in leaves inventory and progress unchanged.

## Four opening paintings

Use the existing paintings with deliberate, restrained pan/crop direction. Narration is rendered as real text rather than baked into the art. Each page contains one short passage and a clear Continue/Skip control.

| Page / existing artwork | English narration |
| --- | --- |
| Letter / `letter.webp` | Your grandmother left you {farmName} Homestead—and a key wrapped in a delivery ledger. Her final note is brief: “The garden can feed more than one household. Start there.” |
| Journey / `valley.webp` | Beyond Dewhaven, three towns still rely on roads the winter storms have damaged. Aya, the valley courier, brings you as far as the old bridge. |
| Arrival / `homestead.webp` | The farmhouse is standing. The beds need tending, the shipping crate needs a hinge, and a few of Grandmother’s crops are ready to gather. |
| Dawn / `dawn.webp` | At six, sunlight reaches the bedroom floor. Mira opens the seedhouse at eight. There is time to plant your first rows before walking into town. |

At the end, fade into the actual bedroom. A cloth rustle and outside wind replace any musical cue. The player controls the walk to the door. The first-day help consists of transient instructions for the next unlearned action; the same guidance is available later in Help.

## Authored dialogue samples

The following nodes define tone, context and response behaviour. They are sample scripts, not all 25 residents’ final lines. The resident catalogue contains their job-specific seed dialogue; `data/bonds.json` contains 36 relationship outlines and legacy ID mappings.

### Mira — first meeting, inside the seedhouse

**Mira:** “You must be {playerName}. Aya said someone had opened the old farmhouse. How did the garden look?”

- **“Some of the crops are ready.”** → “Then gather those first. They will pay for your next seed packets. Keep the new rows watered each day.”
- **“I’m still finding my way.”** → “Start with turnips. The packets are here on the counter, and the village road takes you straight back to the farm.”
- **“Show me the seeds.”** → Open this counter’s seed stock. Return to the same conversation context on close.

First contact records Mira as met. Daily friendship is credited once. A stock purchase is a separate atomic transaction, not an additional social reward.

### Mira — wet morning, familiar player

**Mira:** “You picked a good day for planting. The rain will water the new rows; just make sure the seeds are in before you turn in.”

- **“Anything for this season?”** → Show seasonal seed information without buying remotely.
- **“About your basket…”** → If the request is active, show its three-turnip requirement. **Hand over 3 turnips** is enabled only when the player is here with enough produce and room for the reward.
- **“I’ll see you later.”** → Close and release the resident reservation.

### Orin — tool order, at the forge desk

**Orin:** “Set the tools here. The first reinforcement takes five copper and 700 gold. You will use less energy, and the axe will bring back more timber.”

- **“Show the order.”** → Open Tools I with materials, price and benefits together.
- **“Where can I find copper?”** → “Take the forest road into Copperleaf Pass. The cart track ends at the mine head. Bring food and leave room in your pack.”
- **“Not today.”** → “The desk will be here when you are ready.” No error or punishment.

### Sera — before the Tide Vault

**Sera:** “The chart was kept above the flood line. The vault’s three water systems still lock the case. The pump diagram should be beside the first landing.”

- **“How do I get there?”** → “Leave by the east harbour road. Follow the stone steps through Saltwind Cliffs, past the winch shelter. The gate is cut into the rock.” Set a route to the trail exit.
- **“I repaired the landing winch.”** → Inspect the quest flag and acknowledge the visible repaired route; never ask for its materials a second time.
- **“I’ll prepare first.”** → “Marin has meals at the inn. You can always return from the entrance stair.”

### Tamsin — on the orchard path

**Tamsin:** “Cedar has checked the lower rows. I am taking these jars to the kitchen. Will you walk with me as far as the next turn?”

- **“Tell me about the shared table.”** → “We used to set it out on the fourth day each week. I kept the blankets when the deliveries stopped. They are ready to use again.”
- **“I brought preserves.”** → Open the appropriate physical hand-in, not a generic purchase screen.
- **“I’m heading to the quarry.”** → “Take the upper road beside Winterglass. Pavel repaired the first drain, but the old glassworks is farther on.”

The conversation freezes the clock. On closing, Tamsin resumes the reserved route instead of spawning at her destination.

### Ilan — after recovering the compass

**Ilan:** “That is the missing instrument. Set it beside the chart and lens. We can check the mountain bearings before Aya commits a delivery cart to the route.”

- **“What happens next?”** → “Jun will walk the marked route with you. Then we ask each town to reopen one room for travellers.”
- **“The atlas is nearly complete.”** → “The map will be useful because you tested it. We should record the shelters as carefully as the roads.”
- **“I’ll find Jun.”** → Set a route to Jun’s current reachable public location.

### A full bag at a dungeon chest

**System:** “Make two spaces for the chart and crystals.”

- **Open bag** → Bag view; the solved chest stays available.
- **Leave it here** → Close; no relic, gold or completion flag is granted.

### A closed shop

**Door status:** “Mira’s Seedhouse opens at 08:00.”

The map uses the same hours. No Buy button opens; the one status fades after a short interval. Starter seeds allow the first morning to proceed before opening time.

## Sound and motion direction

Use wind/foliage at the farm, running water near the stream, gentle water and timber creaks at the quay, leaves and irrigation in Sunridge, and stronger sheltered wind at Briar. Interiors attenuate outside ambience; a window may retain a quiet weather layer. Avoid adding an AudioSource to every decorative object.

Tool impacts are tied to the visible motion: soil at hoe contact, water at can tilt, wood at axe contact, ore at pick contact. Sparse particles expire and return to a pool. Coin motion occurs only on a real balance change. The dialogue reveal can be interrupted; camera fades and coin flights respect reduced motion.

Puzzles use a valve hiss, a wooden cart roll, a mechanical click and a stone/gear response. These communicate state without melodies or instruments. Visual cues carry the same information for muted play.
