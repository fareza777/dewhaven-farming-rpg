# AdMob demo integration

Dewhaven 1.3 packages the official Google Mobile Ads Android SDK 25.5.0 and User Messaging Platform 4.0.0 through a small Capacitor plugin. The browser preview makes no ad requests and never simulates ad rewards. Android uses only hard-coded Google demo units; JavaScript cannot supply a different publisher or unit ID.

| Format | Official Google demo ID | Placement |
| --- | --- | --- |
| Application | `ca-app-pub-3940256099942544~3347511713` | Android manifest |
| Adaptive banner | `ca-app-pub-3940256099942544/9214589741` | Title and Pause |
| Interstitial | `ca-app-pub-3940256099942544/1033173712` | Begin a new day, after the opening |
| Rewarded | `ca-app-pub-3940256099942544/5224354917` | Optional Watch ad action on the home rest screen |

## Player experience

The adaptive banner occupies its own native bottom area and reduces the WebView height. It reserves the larger of the Android navigation-bar area (including while hidden), gesture area and cutout, plus an 8 dp gap. Back, Home and Recent buttons therefore sit below the ad, including when the navigation bar reappears. Hiding it restores the complete world viewport; failed banner requests reserve no blank area. It is hidden during gameplay, story scenes, forms and settings.

Interstitials require at least day 4, three elapsed session minutes, three in-game days since the last interstitial, and three real minutes since any previous full-screen ad. The policy checks only at the morning's Step outside transition. Unloaded/offline ads are skipped immediately. There are no ads during tool use, travel, conversations, vault puzzles, festivals or app startup.

Rewarded ads are a voluntary alternative to ordinary rest, food and sleep. The clearly labelled Watch ad button offers up to 25 energy, capped at maximum energy, with at most three claims per in-game day and a 90-second global full-screen cooldown. Only Google's `OnUserEarnedRewardListener` sets the earned flag. Each earned UUID receipt is consumed once and persisted in the save. Early dismissal, missing receipts, SDK errors and unavailable ads grant nothing. Changing save slots cannot bypass the native real-time cooldown.

Both full-screen formats release movement, freeze game time, suspend nature audio and restore the same menu or world on return. Offline startup defers SDK initialization entirely; returning connectivity initializes it through one shared request and one state listener. Ads are preloaded and refreshed after use; 55-minute-old ads are replaced. Failed requests retry with a delay, without blocking offline play.

The SDK's app volume is zero and muted after SDK initialization, before loading any ad. Ad audio does not follow the game's nature-volume slider. Requests use maximum content rating G and non-personalized extras. This is not a guarantee that third-party live creative imagery will meet every personal preference; live publishers must additionally configure their AdMob category/content controls.

## Testing and privacy

Android About → Ad previews provides all three Google demo formats without waiting several in-game days. Preview mode exists only with the hard-coded native `TEST_MODE` flag, bypasses frequency limits for QA, and never changes the farm, even after a completed rewarded demo.

UMP requests updated consent information on each app launch and shows any required form. A Privacy choices action appears when UMP requires it. Google's sample publisher cannot host this game's production privacy message, so the demo-only build permits initialization if its demo consent configuration is unavailable. This exception is explicitly restricted to demo IDs; **it must not ship with live IDs**. A live build must require `canRequestAds()`, use the owner's registered app/units and configured privacy message, and provide the owner's privacy policy and Play Data safety declarations. The demo manifest removes advertising-ID permission. No publisher credentials, signing key, live ad units or store listing have been created.

`src/game/ads.ts` holds deterministic reward and frequency rules. `src/ads.ts` serializes native full-screen calls and handles unavailable providers. `DewhavenAdsPlugin.java` owns the Google SDK, consent and banner layout. Unit/browser provider fixtures verify skipped/completed/duplicate responses; they are distinct from the real-device demo-ad verification in `tools/verify-ads-android.mjs` and its recorded report.

Official references, checked 13 October 2026: [test units](https://developers.google.com/admob/android/test-ads), [SDK setup](https://developers.google.com/admob/android/quick-start), [adaptive banners](https://developers.google.com/admob/android/banner), [interstitials](https://developers.google.com/admob/android/interstitial), [reward callbacks](https://developers.google.com/admob/android/rewarded), [UMP privacy](https://developers.google.com/admob/android/privacy), [mute and volume](https://developers.google.com/admob/android/global-settings).
