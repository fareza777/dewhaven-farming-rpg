# Restoring licensed sprites

This repository is public. Raw sprites from the licensed local collection remain in the owner's working folder and are intentionally excluded from Git. Third-party assets retain their original licenses.

The excluded files are listed, with SHA256 hashes, in [licensed-assets-manifest.json](licensed-assets-manifest.json). They include the browser sprite atlases, native Unity atlas/animal resources, and the standalone local atlas preview that embeds licensed sprites. Generated artwork, original character art, portraits, UI icons, fonts, audio, gameplay screenshots and compiled Android packages are stored separately and remain in this repository under their respective provenance terms.

To use a fresh clone, restore the raw sprites from an authorized complete local copy before opening the game in Unity or starting the browser prototype:

```powershell
python tools/restore-licensed-assets.py "E:\Harvest Moon GPT 61" --dry-run
python tools/restore-licensed-assets.py "E:\Harvest Moon GPT 61"
```

Run these commands from the new clone. The source argument points to the original complete working folder. The tool checks every source hash before copying, preserves existing matching files, and refuses different destination files unless `--overwrite` is explicitly supplied. It never downloads or publishes licensed assets. Keep the complete local working folder as the asset backup.

Android signing keys and credentials are also local-only. Restore those separately through the owner's secure signing workflow; they are not part of the sprite manifest.
