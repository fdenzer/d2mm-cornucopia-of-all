# Solo Cornucopia (D2RMM Mod)

This folder is a ready-to-drop D2RMM mod:

- `mod.json`: metadata
- `mod.js`: fixed behavior logic

## What this mod currently changes

- Tunes `ItemRatio.txt` with fixed quality rates:
  - `Rare`: 5x
  - `Set`: 25x
  - `Unique`: 50x
  - `Magic`: heavily suppressed via very large `MagicDivisor`
- Adds two quiver base items in `misc.txt`:
  - `cqa` (`Cornucopia Arrows`)
  - `cqb` (`Cornucopia Bolts`)
- Attempts to make Akara sell both quivers with fixed store price `117`.
- Forces quiver stack-related fields to `100` where supported.
- Adds a strong replenish-quantity automagic entry targeted at quivers.

## Notes

- The script is defensive against missing files/columns, but always test in offline single-player.
- Exact "100 per second" replenish timing is engine-limited; this mod approximates the strongest practical refill behavior through `rep-qty`.
- Localization is attempted through common JSON targets if present in your merged data.
- If another mod edits the same tables, load order determines final values.
