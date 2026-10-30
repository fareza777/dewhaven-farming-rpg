# Intro and main-quest voiceover

19 October 2026. User explicitly requested Deepgram VO for every intro and main-quest narration. English, Unity Android portrait, nature/physical SFX and no music remain in force. This is an addition to the existing native game, not another migration.

Implementation choices: bundle generated speech for offline playback; a warm adult narrator for the opening/journal, appropriate cast voices for quest speakers, manual text-page progression, a compact Replay action and independent voice volume/autoplay settings. Replace the spoken intro's variable farm-name phrase with “the homestead” so the bundled recording exactly matches its subtitle. The entered farm name is retained in game/save identity.

Coverage: four opening pages plus objective, opening and completion text for every one of the 24 main chapters (76 passages). Sentence recordings are grouped into measured text pages; dialogue expands only enough for its longest sentence, preventing narration from running into unseen subtitles on a short phone or at large text sizes. Side quests and routine conversations are outside this VO request.

Deepgram's official Aura-2 REST API generates 24 kHz mono PCM WAV originals. A deterministic voice/text hash caches each segment; WAV validation and atomic files prevent error responses or incomplete requests from becoming audio assets. Limit concurrency to two and retry transient failures a bounded number of times. Store source/provenance, never the token. The supplied token is held only in a private generation session and sent in the Authorization header to api.deepgram.com. No runtime API requests, token, credentials file or token-bearing command arguments are added to the game.

Native playback loads only the current sentence, cancels stale loads/pages, has one speech source, pauses during background/fullscreen ads, and resumes retained narration without advancing the world clock. Ordinary shops still close on backgrounding. Skip, title, onboarding and closing a story stop speech. Nature/foley remain separate and are gently attenuated during narration.

Work sequence: (1) source manifest and real Deepgram probe, (2) cached full generation, (3) voice library/player, measured subtitle pages and settings/lifecycle integration, (4) focused coverage/cancellation/pause checks and review, (5) new versioned 2.2 VO APK, leaving 2.1 unchanged. No emulator campaign. Device audio-route/performance acceptance remains unverified until a real phone is used.

Primary references: https://developers.deepgram.com/docs/tts-models ; https://developers.deepgram.com/reference/text-to-speech/speak-request ; https://developers.deepgram.com/docs/tts-media-output-settings . No price claim is made.

Implementation evidence: 177 real recordings / 76 passages / 16 voices / 550.88 seconds. The actual provider response required finite RIFF/data lengths; only its observed streaming placeholders are normalized, preserving PCM. Two focused generator cases and 25 Unity domain cases passed. Native playback/cancellation/replay/mute/background/one-clip checks passed, plus the three canonical-journal text regressions. Source audio has no silent clips. The requested independent review was unavailable due to its agent usage limit; focused self-audit and the recorded checks provide the present evidence.

The final APK is versioned separately as 2.2.0 / code 12. Packaging, signing/alignment/resource inspection and credential scanning are recorded in `android-voice-*` and `voiceover-security-audit.json`; the adjacent release info/checksum describe the exact built file. Physical-device audio and performance acceptance remain open.
