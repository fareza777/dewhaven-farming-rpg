# Dewhaven 1.2 — The Unwritten Atlas

The supplied Opus game was used as a local reference for comfortable portrait controls, short menus, terrain transitions, and entering buildings. Dewhaven retains original towns, residents, writing, layouts, and progression. Both supplied asset directories remain read-only.

## Places and story

There are 26 playable scenes: eight outdoor regions, fifteen building interiors, and three puzzle vaults. The original village connects to the canal harbour of Aster Quay, the orchards of Sunridge, and the upland archive of Briar Hollow. Roads connect those regions; the map also provides short trips. Enter a building by approaching its door and pressing upward, using the nearby action, or tapping the door. Walk through the interior exit to return to its original doorstep.

Homes, the barn, market, town hall, café, ranch, ranger's cabin, lakeside cabin, forge, inn, boatworks, orchard kitchen, glasshouse, archive, and archivist's study have authored furniture and usable stations. Barn animals share their real feeding and affection state with the farm animals. Rooms have wood floors, log walls, windows, rugs, plants and appropriate furniture. Interior travel does not spend outdoor journey time.

Sixteen sequential main quests and nineteen optional requests carry the story from the first seeds to Grandmother's unfinished delivery atlas. The second act follows a tide chart, a weather lens and a winter compass across three towns. Each main chapter has two written pages, readable again from the journal. Important milestones open the story automatically. The final chapter restores the valley's shared routes and tables.

Tide Vault, Ember Gallery and Sky Observatory each contain three persistent mechanisms, renewable ore and a unique discovery. Their rewards check bag capacity before consuming anything and cannot pay twice. These are exploration and mechanism puzzles, without combat.

The chart, lens and compass stay with the atlas. Their bag controls cannot use or ship them, they are excluded from the shipping and gift lists, and the simulation rejects attempts to ship or gift them without changing the inventory or friendship state.

Nine residents include six adult romance candidates. Eighteen written relationship moments unlock in order at two, four-and-a-half, and seven hearts, with two responses per scene. Daily conversation, favourite gifts, birthdays, eight-heart proposals and a daily walk with a partner remain available. Three weekly town gatherings have different dates and food offerings, friendship rewards and a once-per-day participation check. The calendar shows their next date and provides a visit action. Four seasonal festivals remain in the base game.

## Controls and presentation

Floating movement is the default. Touch the movement side and drag; the stick follows the initial thumb position. Release to stop. Controls support fixed positioning, left- or right-handed play, size, opacity, vertical placement, sensitivity, dead zone, camera follow, tap-to-walk, vibration, running behaviour and holding the action to keep tending nearby ground. Dialogs always release movement and repeated work.

Display options include wider/closer outdoor framing, 30/60 fps rendering, visible/hidden HUD, larger text and reduced motion. Sound, game speed, language and save management have separate short tabs. Resetting controls preserves farm progress and unrelated display/sound preferences.

Thirty-two original generated item illustrations share two transparent atlases of approximately 1 MB combined. Seeds reuse their crop art with a small grain badge. Game-world sprites retain crisp pixels; inventory art uses smooth painterly sampling. The title and four original opening paintings remain separate from licensed sprites. No people, animals or faces appear in generated art.

## Performance design

- Static terrain, meadow patches, flowers, room walls, floor detail and window light are painted when a location loads, rather than rebuilt each frame.
- A least-recently-used cache retains at most three location/season backgrounds.
- Moving water visits only visible tiles; objects and grass tufts outside the camera are culled.
- Animated particles have finite lifetimes. Reduced motion suppresses entry motion and coin flights.
- Both 30 and 60 fps modes use the same elapsed-time movement model. No third-party game engine or remote runtime dependency is required.

`world-performance.json` records actual desktop Chrome canvas-draw samples at a 390 × 844 touch viewport. These measurements establish local rendering cost, not a guarantee of frame rate on every physical Android phone. The final functional and native checks are recorded in `VALIDATION.md`.
