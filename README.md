# Cornucopia of Items (D2R Solo Mod Concept)

A Diablo II: Resurrected single-player mod concept focused on reducing early/mid grind and getting players to meaningful loot faster:

- Fewer dead-end magic item stretches
- More consistent access to rares, sets, and uniques
- Still controlled enough to avoid pure loot spam

This plan is designed for **D2RMM** and **offline/single-player** use.

## Goal

Create a solo-friendly loot experience where progression feels rewarding sooner, with intentional balancing targets:

- Increase consistency, not chaos
- Improve quality of drops, not just quantity
- Keep target-farming and boss kills meaningful

## Mod Scope

### 1) Setup

1. Install D2RMM.
2. Point D2RMM to your D2R install.
3. Enable launch with `-mod` via D2RMM.
4. Create mod folder: `D2RMM/mods/solo-cornucopia/`.

### 2) Mod Skeleton

Create:

- `mod.json` for metadata and options
- `mod.js` for table edits
- `README.md` (this document)

### 3) Solo-Friendly Drop Changes

Primary tables to edit:

- `TreasureClassEx.txt`
  - Increase meaningful boss/champion rewards
  - Reduce no-drop pressure and junk dilution
- `ItemRatio.txt`
  - Modestly improve rare/set/unique odds
- Optional routing:
  - `MonStats.txt` / `SuperUniques.txt` for targeted farm identity

Balancing intent:

- Better baseline loot consistency in solo
- Keep top-end drops exciting
- Avoid invalidating progression pacing

### 4) Add Cornucopia Quivers

Base item codes:

- Arrows: `aqv`
- Bolts: `cqv`

Add two named items:

- **Cornucopia Arrows**
- **Cornucopia Bolts**

Planned behavior:

- High stack size
- Replenishing behavior or very large capacity
- Optional light utility affixes

Also add localization strings for item names/descriptions.

### 5) Make Them Obtainable

Add quivers to selected treasure classes with controlled access, such as:

- Low chance from Act bosses, or
- A targeted farm source (specific super unique), or
- Rare global drop

### 6) Validate In-Game

1. Build via D2RMM.
2. Launch offline.
3. Smoke test:
   - New items appear
   - Quiver behavior works as intended
   - Drop feel is improved but not flooded
4. Resolve conflicts with other mods editing same tables.

### 7) Packaging

- Finalize versioned release in `solo-cornucopia/`
- Document install order
- Document known table conflicts
- Keep a changelog for loot tuning iterations

## Recommended Implementation Order

1. Skeleton + baseline drop edits
2. Add Cornucopia Arrows/Bolts definitions
3. Inject quivers into treasure classes
4. In-game balancing pass
5. Package + docs

## Decisions to Lock Before Coding

1. **Drop intensity:** light, medium, or high
2. **Cornucopia style:** replenishing or very large stack
3. **Acquisition model:** boss-only, targeted source, or global rare drop

## Suggested Default Baseline (Good First Pass)

- Drop intensity: **Medium**
- Cornucopia style: **Very large stack first**, replenishing later if needed
- Acquisition: **Boss-biased low chance** with one optional targeted source

This gives immediate solo quality-of-life gains without turning every run into guaranteed jackpot loot.
