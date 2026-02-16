# Solo Cornucopia (D2RMM Mod)

This folder is a ready-to-drop D2RMM mod:

- `mod.json`: metadata + user config options
- `mod.js`: drop tuning + Cornucopia quiver injection logic

## What this mod currently changes

- Tunes `TreasureClassEx.txt` to reduce no-drop pressure and slightly bias meaningful item picks.
- Tunes `ItemRatio.txt` to improve unique/set/rare odds by reducing divisors.
- Adds two quiver base items in `misc.txt`:
  - `cqa` (`Cornucopia Arrows`)
  - `cqb` (`Cornucopia Bolts`)
- Injects those quivers into selected treasure classes based on config.

## D2RMM Config Options

- `Drop Intensity`: `light | medium | high`
- `Enable Cornucopia Quivers`: on/off
- `Cornucopia Style`: `large_stack | replenishing_like`
- `Quiver Source`: `boss_only | boss_plus_targeted | global_rare`

## Notes

- The script is defensive against missing files/columns, but always test in offline single-player.
- Localization is attempted through common JSON targets if present in your merged data.
- If another mod edits the same tables, load order determines final values.

