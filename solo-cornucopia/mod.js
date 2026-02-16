const QUALITY_MULTIPLIERS = {
  unique: 50,
  set: 25,
  rare: 5
};

const FALLEN_TC_NAME = "CornucopiaFallenAct1";
const QUIVER_CODES = ["aqv", "cqv"];
const JAVELIN_CODES = [
  "jav", "pil", "ssp", "glv", "tsp",
  "9ja", "9pi", "9s9", "9gl", "9ts",
  "7ja", "7pi", "7s7", "7gl", "7ts"
];

const STACK_SIZE = 100;
const SELL_PRICE = 117;
const REFILL_RATE = 100;

const PATHS = {
  itemRatio: ["global/excel/itemratio.txt", "global/excel/ItemRatio.txt"],
  treasureClassEx: ["global/excel/treasureclassex.txt", "global/excel/TreasureClassEx.txt"],
  monStats: ["global/excel/monstats.txt", "global/excel/MonStats.txt"],
  misc: ["global/excel/misc.txt", "global/excel/Misc.txt"],
  weapons: ["global/excel/weapons.txt", "global/excel/Weapons.txt"],
  automagic: ["global/excel/automagic.txt", "global/excel/Automagic.txt"],
  inventory: ["global/excel/inventory.txt", "global/excel/Inventory.txt"],
  charstats: ["global/excel/charstats.txt", "global/excel/CharStats.txt"]
};

function asInt(value, fallback = 0) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cloneRow(row) {
  const out = {};
  Object.keys(row).forEach((k) => {
    out[k] = row[k];
  });
  return out;
}

function normalizeKey(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findKey(row, logicalName) {
  const target = normalizeKey(logicalName);
  return Object.keys(row).find((k) => normalizeKey(k) === target);
}

function getVal(row, logicalName, fallback = "") {
  const k = findKey(row, logicalName);
  return k ? row[k] : fallback;
}

function setVal(row, logicalName, value) {
  const k = findKey(row, logicalName);
  if (k) {
    row[k] = String(value);
    return true;
  }
  return false;
}

function collectIndexedCols(row, prefix) {
  const re = new RegExp(`^${prefix}(\\d+)$`, "i");
  return Object.keys(row)
    .map((k) => {
      const m = k.match(re);
      if (!m) return null;
      return { key: k, idx: asInt(m[1], 0) };
    })
    .filter(Boolean)
    .sort((a, b) => a.idx - b.idx);
}

function readTable(pathCandidates, label) {
  let lastErr;
  for (let i = 0; i < pathCandidates.length; i += 1) {
    try {
      const path = pathCandidates[i];
      const rows = D2RMM.readTsv(path);
      return { path, rows };
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`Unable to read ${label}. Tried: ${pathCandidates.join(", ")}; last error: ${lastErr}`);
}

function writeTable(table) {
  D2RMM.writeTsv(table.path, table.rows);
}

function tuneItemQuality() {
  const tbl = readTable(PATHS.itemRatio, "ItemRatio");
  tbl.rows.forEach((row) => {
    const uniqueDiv = asInt(getVal(row, "UniqueDivisor", "1"), 1);
    const setDiv = asInt(getVal(row, "SetDivisor", "1"), 1);
    const rareDiv = asInt(getVal(row, "RareDivisor", "1"), 1);

    setVal(row, "UniqueDivisor", Math.max(1, Math.floor(uniqueDiv / QUALITY_MULTIPLIERS.unique)));
    setVal(row, "SetDivisor", Math.max(1, Math.floor(setDiv / QUALITY_MULTIPLIERS.set)));
    setVal(row, "RareDivisor", Math.max(1, Math.floor(rareDiv / QUALITY_MULTIPLIERS.rare)));

    // Strong magic suppression. True "never magic" is not a single official switch.
    setVal(row, "MagicDivisor", "1000000000");
    setVal(row, "MagicMin", "0");
    setVal(row, "MagicMax", "0");
  });
  writeTable(tbl);
}

function suppressMagicInTCs() {
  const tbl = readTable(PATHS.treasureClassEx, "TreasureClassEx");
  tbl.rows.forEach((row) => {
    setVal(row, "Magic", "0");
  });
  writeTable(tbl);
}

function patchVendorFlags(row, vendorName) {
  const tag = vendorName.toLowerCase();
  Object.keys(row).forEach((k) => {
    const low = k.toLowerCase();
    if (!low.includes(tag)) return;
    row[k] = "1";
  });
}

function patchQuiversInMisc() {
  const tbl = readTable(PATHS.misc, "misc");
  QUIVER_CODES.forEach((code) => {
    const row = tbl.rows.find((r) => String(getVal(r, "code", "")).toLowerCase() === code);
    if (!row) return;

    setVal(row, "spawnable", "1");
    setVal(row, "PermStoreItem", "1");
    setVal(row, "level", "1");
    setVal(row, "levelreq", "1");
    setVal(row, "cost", SELL_PRICE);
    setVal(row, "gamble cost", SELL_PRICE);
    setVal(row, "maxstack", STACK_SIZE);
    setVal(row, "max stack", STACK_SIZE);
    setVal(row, "minstack", STACK_SIZE);
    setVal(row, "min stack", STACK_SIZE);
    setVal(row, "spawnstack", STACK_SIZE);
    setVal(row, "spawn stack", STACK_SIZE);
    setVal(row, "auto prefix", "CornucopiaAmmoRefill");

    patchVendorFlags(row, "akara");
    patchVendorFlags(row, "charsi");
  });
  writeTable(tbl);
}

function patchJavelinsInWeapons() {
  const tbl = readTable(PATHS.weapons, "weapons");
  tbl.rows.forEach((row) => {
    const code = String(getVal(row, "code", "")).toLowerCase();
    if (!JAVELIN_CODES.includes(code)) return;

    setVal(row, "spawnable", "1");
    setVal(row, "PermStoreItem", "1");
    setVal(row, "levelreq", "1");
    setVal(row, "cost", SELL_PRICE);
    setVal(row, "gamble cost", SELL_PRICE);
    setVal(row, "maxstack", STACK_SIZE);
    setVal(row, "max stack", STACK_SIZE);
    setVal(row, "minstack", STACK_SIZE);
    setVal(row, "min stack", STACK_SIZE);
    setVal(row, "spawnstack", STACK_SIZE);
    setVal(row, "spawn stack", STACK_SIZE);
    setVal(row, "auto prefix", "CornucopiaJavelinRefill");

    const oldFreq = asInt(getVal(row, "frequency", "1"), 1);
    setVal(row, "frequency", clamp(oldFreq * 50, 1, 65535));

    patchVendorFlags(row, "charsi");
  });
  writeTable(tbl);
}

function ensureAutomagicRows() {
  const tbl = readTable(PATHS.automagic, "automagic");
  const ensureRow = (name) => {
    let row = tbl.rows.find((r) => String(getVal(r, "Name", "")).toLowerCase() === name.toLowerCase());
    if (!row) {
      row = cloneRow(tbl.rows[0] || {});
      Object.keys(row).forEach((k) => {
        row[k] = "";
      });
      setVal(row, "Name", name);
      tbl.rows.push(row);
    }
    return row;
  };

  const ammo = ensureRow("CornucopiaAmmoRefill");
  const jav = ensureRow("CornucopiaJavelinRefill");

  [ammo, jav].forEach((row) => {
    setVal(row, "enabled", "1");
    setVal(row, "spawnable", "1");
    setVal(row, "frequency", "1");
    setVal(row, "mod1code", "rep-qty");
    setVal(row, "mod1min", REFILL_RATE);
    setVal(row, "mod1max", REFILL_RATE);
    setVal(row, "itype1", "");
    setVal(row, "itype2", "");
  });

  writeTable(tbl);
}

function setTCItems(row, codes) {
  setVal(row, "Picks", String(codes.length));
  setVal(row, "NoDrop", "0");
  setVal(row, "Unique", "0");
  setVal(row, "Set", "0");
  setVal(row, "Rare", "0");
  setVal(row, "Magic", "0");

  const itemCols = collectIndexedCols(row, "Item");
  itemCols.forEach(({ key, idx }) => {
    row[key] = "";
    const probKey = Object.keys(row).find((k) => normalizeKey(k) === normalizeKey(`Prob${idx}`));
    if (probKey) row[probKey] = "0";
  });

  codes.forEach((code, i) => {
    const target = itemCols[i];
    if (!target) return;
    row[target.key] = code;
    const probKey = Object.keys(row).find((k) => normalizeKey(k) === normalizeKey(`Prob${target.idx}`));
    if (probKey) row[probKey] = "1";
  });
}

function forceFallenDropsToQuivers() {
  const tcTbl = readTable(PATHS.treasureClassEx, "TreasureClassEx");
  const tcRows = tcTbl.rows;

  const tcNameKey = Object.keys(tcRows[0] || {}).find((k) => normalizeKey(k) === normalizeKey("Treasure Class")) || "Treasure Class";
  let custom = tcRows.find((r) => String(r[tcNameKey] || "").toLowerCase() === FALLEN_TC_NAME.toLowerCase());
  if (!custom) {
    custom = cloneRow(tcRows[0] || {});
    Object.keys(custom).forEach((k) => {
      custom[k] = "";
    });
    custom[tcNameKey] = FALLEN_TC_NAME;
    tcRows.push(custom);
  }
  setTCItems(custom, QUIVER_CODES);

  tcRows.forEach((row) => {
    const name = String(row[tcNameKey] || "").toLowerCase();
    if (
      name.includes("fallen") ||
      name.includes("carver") ||
      name.includes("devilkin") ||
      name.includes("darkone") ||
      name.includes("dark one")
    ) {
      setTCItems(row, QUIVER_CODES);
    }
  });
  writeTable(tcTbl);

  const monTbl = readTable(PATHS.monStats, "MonStats");
  monTbl.rows.forEach((row) => {
    const id = String(getVal(row, "Id", "")).toLowerCase();
    const fallenFamily =
      id.includes("fallen") ||
      id.includes("carver") ||
      id.includes("devilkin") ||
      id.includes("darkone") ||
      id.includes("dark one");
    if (!fallenFamily) return;

    Object.keys(row).forEach((k) => {
      if (normalizeKey(k).startsWith(normalizeKey("TreasureClass"))) {
        row[k] = FALLEN_TC_NAME;
      }
    });
  });
  writeTable(monTbl);
}

function boostJavelinDropsInTCs() {
  const tcTbl = readTable(PATHS.treasureClassEx, "TreasureClassEx");
  tcTbl.rows.forEach((row) => {
    const itemCols = collectIndexedCols(row, "Item");
    itemCols.forEach(({ key, idx }) => {
      const code = String(row[key] || "").toLowerCase();
      if (!JAVELIN_CODES.includes(code)) return;
      const probKey = Object.keys(row).find((k) => normalizeKey(k) === normalizeKey(`Prob${idx}`));
      if (!probKey) return;
      const oldProb = asInt(row[probKey], 1);
      row[probKey] = String(clamp(oldProb * 50, 1, 65535));
    });
  });
  writeTable(tcTbl);
}

function patchVendorInventory() {
  const tbl = readTable(PATHS.inventory, "inventory");
  tbl.rows.forEach((row) => {
    const text = Object.values(row).join(" ").toLowerCase();
    const isAkara = text.includes("akara");
    const isCharsi = text.includes("charsi");
    if (!isAkara && !isCharsi) return;

    const want = [];
    if (isAkara) {
      want.push("aqv", "cqv");
    }
    if (isCharsi) {
      want.push("jav", "pil", "aqv", "cqv");
    }

    const itemCols = collectIndexedCols(row, "item");
    if (!itemCols.length) return;

    const existing = new Set(itemCols.map(({ key }) => String(row[key] || "").toLowerCase()));
    const empty = itemCols.filter(({ key }) => String(row[key] || "").trim() === "");
    const fallbackReplace = [...itemCols].reverse();

    want.forEach((code) => {
      if (existing.has(code)) return;
      let slot = empty.shift();
      if (!slot) {
        slot = fallbackReplace.shift();
      }
      if (slot) {
        row[slot.key] = code;
        existing.add(code);
      }
    });
  });
  writeTable(tbl);
}

function patchAmazonStarter() {
  const tbl = readTable(PATHS.charstats, "charstats");
  const amaRow = tbl.rows.find((row) => {
    const c = String(getVal(row, "class", "") || getVal(row, "Class", "")).toLowerCase();
    return c === "ama" || c === "amazon";
  });
  if (!amaRow) {
    writeTable(tbl);
    return;
  }

  const itemCols = collectIndexedCols(amaRow, "item");
  let chosenIdx = null;

  itemCols.forEach(({ key, idx }) => {
    const val = String(amaRow[key] || "").toLowerCase();
    if (chosenIdx === null && JAVELIN_CODES.includes(val)) {
      chosenIdx = idx;
    }
  });

  if (chosenIdx === null && itemCols.length > 0) {
    chosenIdx = itemCols[0].idx;
  }

  if (chosenIdx !== null) {
    const itemKey = Object.keys(amaRow).find((k) => normalizeKey(k) === normalizeKey(`item${chosenIdx}`));
    if (itemKey) amaRow[itemKey] = "jav";

    const countKey = Object.keys(amaRow).find((k) => normalizeKey(k) === normalizeKey(`item${chosenIdx}count`));
    if (countKey) amaRow[countKey] = String(STACK_SIZE);
  }

  writeTable(tbl);
}

tuneItemQuality();
suppressMagicInTCs();
patchQuiversInMisc();
patchJavelinsInWeapons();
ensureAutomagicRows();
forceFallenDropsToQuivers();
boostJavelinDropsInTCs();
patchVendorInventory();
patchAmazonStarter();

