# Dewhaven 2.4 delivery

Delivered native Android test candidate: `release/Dewhaven-Unity-2.4.apk`.

- Version: 2.4.0, code 14; package `com.fajar.dewhaven.unity`.
- Bytes: 80,978,669.
- SHA256: `4e190b28ff30b9ae5c5b2f11b85a6b6d7da876d8b435cee38a9f12e1d07f8397`.
- Android ARM64, API26â€“36, portrait, non-development player; local test signing.
- 54 exact-package/source checks pass, including APK signature, matching 2.3 signing certificate, ZIP/native 16 KB alignment, demo advertising IDs, four music resources, 177 speech resources, 30 portraits, 44 building IDs, frozen source manifest and all previous APK hashes.
- 37/37 EditMode tests pass. Flood audit covers 81 areas and 334 anchors with zero issues.
- Native road, guest, background/input and audio flow checks pass. Separate audio observation confirms rapid narration ducking, immediate mute and pause/resume with ten sources.
- Narration director, voice catalogue, intro and main campaign remain byte-identical to the 2.3 source snapshot. Current APK entries have no speech API endpoint; prior credential-audit evidence is retained for the unchanged narrator. No credential was copied into this update.

Final native portrait images were recaptured at390Ã—844 after the editor restart, correcting the temporary landscape preview layout. The actual Android package is locked to portrait. See `captures/quiet-world/forest-phone.png` and `lake-phone.png`. Small Audio settings were inspected at 135% text in a360Ã—568 usable viewport (`audio-settings-safe.png`), representing the available space of a360Ã—640 display after 24px status and 48px navigation reservations.

The four original ambient loops total 408 seconds; default Music gain is 0.22. Continuous birds are absent from the active playback bank. Nine wilderness layouts use 70.1% fewer surface tiles; the four town street networks retain all 44 physical venues. Frame-time and thermal performance on a physical phone are not claimed.

Physical Android installation, actual touch/audio interruptions, ads/native insets, full human listening and long campaign/economy pacing remain device/playtesting work. Owner production signing and Play/AdMob production configuration remain release work.
