# Dewhaven — Farming RPG

A farming and life simulation for Android phones in portrait orientation. The main game is the native Unity project in `unity/Dewhaven`; the earlier browser/Capacitor prototype and the complete marketing sources are also included.

## Get the complete checkout

Large Android packages, archives, video and source recordings use Git LFS:

```powershell
git lfs install
git clone https://github.com/fareza777/dewhaven-farming-rpg.git
cd dewhaven-farming-rpg
git lfs pull
```

This is a public source export. Raw third-party licensed sprites and private signing credentials remain local. Before running a fresh clone, follow [Restoring licensed assets](docs/RESTORING-LICENSED-ASSETS.md). See [asset provenance](docs/ASSETS.md) for the supplied sprite collection and original/generated artwork.

## Native Unity game

- Project: `unity/Dewhaven`
- Editor: **Unity 6000.3.20f1**
- Current project version: **1.0.3**, Android version code **4**
- Android App Bundle: [Dewhaven-1.0.3.aab](release/Dewhaven-1.0.3.aab)
- Earlier Unity test APK: [Dewhaven-Unity-2.4.apk](release/Dewhaven-Unity-2.4.apk)

Open the project with the matching Unity editor and restore its Package Manager dependencies. The repository contains `Assets`, `Packages` and `ProjectSettings`; Unity rebuilds `Library`, `Temp` and other editor caches locally. Android release signing requires the owner's local key.

The game includes farming, physical shops and services, four towns, furnished interiors, resident schedules, quests, relationships, fishing, exploration and dungeons. English is the default language. The portrait interface uses warm sandstone, champagne and bronze, with flexible touch movement and tool shortcuts. Original ambient music, nature, physical sound effects and offline English narration have separate volume controls.

[Unity overview](docs/unity/README.md) · [Quiet-world update and verification](docs/unity/quiet-world-release-evidence.md) · [Android artifacts](release/)

The APK and AAB filenames reflect separate historical build tracks. Build metadata, checksums and previous packages are kept in `release/`. Editor/package verification is documented alongside each candidate; physical-device performance and store acceptance are separate checks.

## Repository layout

| Folder | Contents |
| --- | --- |
| `unity/Dewhaven` | Main native Unity game, content catalogues, editor tools and tests |
| `src`, `public`, `android` | Earlier TypeScript/Vite/Capacitor prototype |
| `art` | Original/generated artwork, narration and audio source material |
| `marketing` | Store materials, screenshots, videos and Remotion project sources |
| `release` | Android APK/AAB packages, build metadata and checksums |
| `docs` | Designs, asset provenance, validation and restoration instructions |
| `tools` | Asset preparation, build, capture and verification utilities |

Some editor/MCP automation utilities reference the original local workspace. Review their project paths before using them from a different checkout.

## Browser prototype

```powershell
npm ci
npm run dev
```

The development server uses port **5176**. This earlier prototype has its own version and feature set; it is retained as source history. Its original instructions are preserved in [legacy-web-prototype.md](docs/legacy-web-prototype.md).

## Marketing sources

See [marketing/README.md](marketing/README.md). The Remotion working sources are included as ordinary files under `marketing/dewhaven-remotion`; the separate local Git metadata is excluded. Finished videos, store images and ZIP packages are tracked through this repository, with large files stored in Git LFS.
