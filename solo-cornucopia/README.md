# Solo Cornucopia (D2RMM Mod)

This folder is a ready-to-drop D2RMM mod:

- `mod.json`: metadata
- `mod.js`: fixed behavior logic

## What this mod currently changes

- Tunes `ItemRatio.txt` with fixed quality rates:
  - `Rare`: 5x
  - `Set`: 25x
  - `Unique`: 50x
  - `Magic`: aggressively suppressed
- Adds global treasure-class quality bias toward rare/set/unique and away from magic.
- Alters existing vanilla quivers in `misc.txt`:
  - `aqv` and `cqv` set to stack `100`
  - price set to `117`
  - refill automagic attached
- Alters existing javelin-family entries in `weapons.txt`:
  - stack and starter-friendly quantity behavior
  - refill automagic attached
  - boosted frequency/drop weighting
- Forces Fallen-family drops to quivers by redirecting to a dedicated treasure class.
- Patches Akara/Charsi inventory rows to include vanilla quivers/javelins.
- Patches Amazon starting loadout in `charstats.txt` to use javelin with count `100`.
- Adds a permanent no-Wirt's-Leg path to the Cow Level by changing the cube recipe to Tome of Town Portal only.

## Notes

- The script is defensive against missing files/columns and avoids hard abort on optional table issues.
- Exact "100 per second" replenish timing is engine-limited; this mod approximates the strongest practical refill behavior through `rep-qty`.
- Localization is attempted through common JSON targets if present in your merged data.
- If another mod edits the same tables, load order determines final values.
