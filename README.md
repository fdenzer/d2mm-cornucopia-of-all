# Cornucopia of Items (D2RMM Solo Mod)

Mac is used for development; Windows gaming PC is used for D2RMM build + D2R playtest.

## What exists now

- Ready-to-use mod folder: `/Users/me/Downloads/d2mm-cornucopia-of-all/solo-cornucopia`
- D2RMM files:
  - `/Users/me/Downloads/d2mm-cornucopia-of-all/solo-cornucopia/mod.json`
  - `/Users/me/Downloads/d2mm-cornucopia-of-all/solo-cornucopia/mod.js`
  - `/Users/me/Downloads/d2mm-cornucopia-of-all/solo-cornucopia/README.md`
- Mac validator:
  - `/Users/me/Downloads/d2mm-cornucopia-of-all/tools/validate-mod.sh`
- Windows deploy/package scripts:
  - `/Users/me/Downloads/d2mm-cornucopia-of-all/deploy/windows/install-to-d2rmm.ps1`
  - `/Users/me/Downloads/d2mm-cornucopia-of-all/deploy/windows/package-zip.ps1`
  - `/Users/me/Downloads/d2mm-cornucopia-of-all/deploy/windows/README.md`

## Mod intent

- Skip long magic-item grind in solo
- Improve access to rare/set/unique drops
- Keep progression intact (consistency over loot spam)
- Add two quivers:
  - Cornucopia Arrows (`cqa`)
  - Cornucopia Bolts (`cqb`)

## D2RMM options (in `mod.json`)

- `Drop Intensity`: `light | medium | high`
- `Enable Cornucopia Quivers`: `true/false`
- `Cornucopia Style`: `large_stack | replenishing_like`
- `Quiver Source`: `boss_only | boss_plus_targeted | global_rare`

## Tables touched by `mod.js`

- `global/excel/TreasureClassEx.txt`
- `global/excel/ItemRatio.txt`
- `global/excel/misc.txt`
- Optional localization attempts in:
  - `local/lng/strings/item-names.json`
  - `local/lng/strings/item-name.json`

## Mac workflow

1. Edit files in this repo.
2. Run:
   ```bash
   /Users/me/Downloads/d2mm-cornucopia-of-all/tools/validate-mod.sh
   ```
3. Push to GitHub.

## Windows workflow

1. Pull latest repo on gaming PC.
2. Copy mod into D2RMM mods path with:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\deploy\windows\install-to-d2rmm.ps1 `
     -RepoRoot "C:\path\to\d2mm-cornucopia-of-all" `
     -D2RMMModsPath "C:\path\to\D2RMM\mods"
   ```
3. Open D2RMM, enable `Solo Cornucopia`, click `Install mods`.
4. Launch D2R offline and playtest.

Full Windows instructions: `/Users/me/Downloads/d2mm-cornucopia-of-all/deploy/windows/README.md`
