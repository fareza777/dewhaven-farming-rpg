# Dewhaven 2.2 VO

Native Unity Android game. English, portrait, Android 8.0 or newer, 64-bit ARM. This APK uses the local Android test signing key; production Play signing and device acceptance remain open.

## Narration

All four opening pages and every main chapter's objective, opening story and completion have English voiceover: 76 passages across 24 chapters, 177 sentence recordings and 16 Deepgram Aura-2 cast voices, totalling about 9 minutes 11 seconds. Recordings are bundled for offline playback. The supplied generation credential is not needed by the game.

Intro speech starts automatically. Meet a quest giver or read the farmhouse ledger to hear the objective; choose **Hear the story** for its opening, and complete the request in person for its closing. The journal voices chapter objectives and lets you revisit completed memories. Sentences follow the visible subtitle page. Continue advances manually; Replay repeats the current spoken page. Skip or closing the story stops its voice. Side requests and ordinary daily conversations retain text dialogue.

Use **Settings → Audio → Voiceover & narration** for voice on/off, independent volume and a narrator preview. Existing control, ambience and activity-sound preferences are retained. Nature/physical sounds become quieter during speech. There is no music or instrumental soundtrack.

Only the current sentence is loaded. Changing pages cancels stale speech. Backgrounding pauses retained story audio and the world clock; returning resumes it. Ordinary trade panels still close on backgrounding. Headphone, Bluetooth, call/audio-focus interruptions and memory/performance need acceptance on a physical phone.

## The game

The existing native campaign remains: four towns, 81 exterior/interior/dungeon/mining areas, 25 residents with schedules, 24 main chapters, 60 side requests, 36 relationship scenes, seasonal farming, animals, fishing, crafting, public restoration work and persistent vault puzzles. Purchases and upgrades happen at physical shops. The world uses the active region rather than rendering the whole valley at once.

Bright sandstone/champagne menus use espresso text and bronze actions. Controls include a flexible joystick, tool shortcuts, action targeting and adjustable text size. Pixel sprite faces are allowed; opening paintings show landscapes and objects. The two top opening actions now have solid warm surfaces for legibility.

Existing native save slots and preferences are compatible. Keep the app installed when updating. The older web package is separate; its exported JSON can be reviewed and imported through Settings → Saves. Older APKs are preserved alongside this version. Only Google demo ad application/unit IDs are configured; gameplay, stories and setup hide banners, and ads are muted.

See [the previous campaign notes](Dewhaven-Unity-2.1-README.md) for the first morning, save import, world systems and current release work.

## Evidence and limits

The adjacent info JSON and SHA-256 record this exact APK. Focused Unity domain checks, actual native narration/page cancellation/replay/mute/background flow, and short portrait renders at 135% text are recorded under `docs/unity`. The main-quest hand-in check uses a deliberately satisfied requirements fixture; it is not a natural campaign playthrough. Audio originals passed format, duration and non-silence checks. Full human listening review, phone install/touch/audio routes, thermal performance, real test-ad impressions and native file/share round trips remain unverified.

This is a playable voiced campaign candidate, not a claim of completed AAA or Play production readiness. Production signing, store listing/rating URL, live AdMob IDs and consent messages still require owner release configuration.
