const QUALITY_MULTIPLIERS = {
  unique: 50,
  set: 25,
  rare: 5
};

const QUIVER_PRICE = 117;
const STACK_SIZE = 100;
const REFILL_RATE = 100;
const FALLEN_TC_NAME = "CornucopiaFallenAct1";

const PATHS = {
  itemRatio: ["global/excel/itemratio.txt", "global/excel/ItemRatio.txt"],
  misc: ["global/excel/misc.txt", "global/excel/Misc.txt"],
  weapons: ["global/excel/weapons.txt", "global/excel/Weapons.txt"],
  automagic: ["global/excel/automagic.txt", "global/excel/Automagic.txt"],
  treasureClassEx: ["global/excel/treasureclassex.txt", "global/excel/TreasureClassEx.txt"],
  monStats: ["global/excel/monstats.txt", "global/excel/MonStats.txt"],
  inventory: ["global/excel/inventory.txt", "global/excel/Inventory.txt"]
};

const QUIVERS = [
  { base: "aqv", code: "cqa", namestr: "mod_cornucopia_arrows" },
  { base: "cqv", code: "cqb", namestr: "mod_cornucopia_bolts" }
];

const THROWN_VARIANTS = [
  { base: "jav", code: "cjj", namestr: "mod_cornucopia_javelin" },
  { base: "pil", code: "cjp", namestr: "mod_cornucopia_pilum" }
];

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

function normalizeKeyName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function findColumnKey(row, logicalName) {
  const target = normalizeKeyName(logicalName);
  return Object.keys(row).find((k) => normalizeKeyName(k) === target);
}

function getValue(row, logicalName, fallback = "") {
  const key = findColumnKey(row, logicalName);
  return key ? row[key] : fallback;
}

function setValue(row, logicalName, value) {
  const key = findColumnKey(row, logicalName);
  if (key) {
    row[key] = String(value);
    return true;
  }
  return false;
}

function readTsvFromCandidates(candidates, label) {
  let lastErr;
  for (let i = 0; i < candidates.length; i += 1) {
    try {
      const path = candidates[i];
      const rows = D2RMM.readTsv(path);
      return { path, rows };
    } catch (err) {
      lastErr = err;
    }
  }
  D2RMM.error(`Failed to read ${label} from: ${candidates.join(", ")}`);
  throw lastErr;
}

function writeTsvFile(file) {
  D2RMM.writeTsv(file.path, file.rows);
}

function getIndexedColumns(row, prefix) {
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

function setVendorFlags(row, vendorName) {
  const vendorLower = vendorName.toLowerCase();
  Object.keys(row).forEach((key) => {
    const lowered = key.toLowerCase();
    if (!lowered.includes(vendorLower)) {
      return;
    }
    row[key] = "1";
  });
}

function tuneItemQuality() {
  const file = readTsvFromCandidates(PATHS.itemRatio, "ItemRatio");
  file.rows.forEach((row) => {
    const uniqueDiv = asInt(getValue(row, "UniqueDivisor", "1"), 1);
    const setDiv = asInt(getValue(row, "SetDivisor", "1"), 1);
    const rareDiv = asInt(getValue(row, "RareDivisor", "1"), 1);

    setValue(row, "UniqueDivisor", Math.max(1, Math.floor(uniqueDiv / QUALITY_MULTIPLIERS.unique)));
    setValue(row, "SetDivisor", Math.max(1, Math.floor(setDiv / QUALITY_MULTIPLIERS.set)));
    setValue(row, "RareDivisor", Math.max(1, Math.floor(rareDiv / QUALITY_MULTIPLIERS.rare)));

    setValue(row, "MagicDivisor", "1000000000");
    setValue(row, "MagicMin", "0");
    setValue(row, "MagicMax", "0");
  });
  writeTsvFile(file);
}

function suppressMagicInTreasureClasses() {
  const file = readTsvFromCandidates(PATHS.treasureClassEx, "TreasureClassEx");
  file.rows.forEach((row) => {
    setValue(row, "Magic", "0");
  });
  writeTsvFile(file);
}

function upsertQuivers() {
  const file = readTsvFromCandidates(PATHS.misc, "misc");
  const rows = file.rows;

  QUIVERS.forEach((spec) => {
    const base = rows.find((r) => String(getValue(r, "code", "")).toLowerCase() === spec.base);
    if (!base) {
      D2RMM.error(`Missing base quiver code '${spec.base}' in misc.txt`);
      return;
    }

    let row = rows.find((r) => String(getValue(r, "code", "")).toLowerCase() === spec.code);
    if (!row) {
      row = cloneRow(base);
      setValue(row, "code", spec.code);
      rows.push(row);
    }

    setValue(row, "namestr", spec.namestr);
    setValue(row, "spawnable", "1");
    setValue(row, "PermStoreItem", "1");
    setValue(row, "level", "1");
    setValue(row, "levelreq", "1");
    setValue(row, "cost", QUIVER_PRICE);
    setValue(row, "gamble cost", QUIVER_PRICE);
    setValue(row, "maxstack", STACK_SIZE);
    setValue(row, "max stack", STACK_SIZE);
    setValue(row, "minstack", STACK_SIZE);
    setValue(row, "min stack", STACK_SIZE);
    setValue(row, "spawnstack", STACK_SIZE);
    setValue(row, "spawn stack", STACK_SIZE);

    setVendorFlags(row, "akara");
    setVendorFlags(row, "charsi");
  });

  writeTsvFile(file);
}

function upsertThrownVariants() {
  const file = readTsvFromCandidates(PATHS.weapons, "weapons");
  const rows = file.rows;

  THROWN_VARIANTS.forEach((spec) => {
    const base = rows.find((r) => String(getValue(r, "code", "")).toLowerCase() === spec.base);
    if (!base) {
      D2RMM.error(`Missing base thrown code '${spec.base}' in weapons.txt`);
      return;
    }

    let row = rows.find((r) => String(getValue(r, "code", "")).toLowerCase() === spec.code);
    if (!row) {
      row = cloneRow(base);
      setValue(row, "code", spec.code);
      rows.push(row);
    }

    setValue(row, "namestr", spec.namestr);
    setValue(row, "spawnable", "1");
    setValue(row, "PermStoreItem", "1");
    setValue(row, "level", "1");
    setValue(row, "levelreq", "1");
    setValue(row, "cost", QUIVER_PRICE);
    setValue(row, "gamble cost", QUIVER_PRICE);
    setValue(row, "maxstack", STACK_SIZE);
    setValue(row, "max stack", STACK_SIZE);
    setValue(row, "minstack", STACK_SIZE);
    setValue(row, "min stack", STACK_SIZE);
    setValue(row, "spawnstack", STACK_SIZE);
    setValue(row, "spawn stack", STACK_SIZE);

    const baseFreq = asInt(getValue(base, "frequency", "1"), 1);
    setValue(row, "frequency", Math.max(1, baseFreq * 50));

    setVendorFlags(row, "charsi");
  });

  writeTsvFile(file);
}

function addRegenAffixes() {
  const autoFile = readTsvFromCandidates(PATHS.automagic, "automagic");
  const autoRows = autoFile.rows;

  function ensureAutoRow(name) {
    let row = autoRows.find((r) => String(getValue(r, "Name", "")).toLowerCase() === name.toLowerCase());
    if (!row) {
      row = cloneRow(autoRows[0] || {});
      Object.keys(row).forEach((k) => {
        row[k] = "";
      });
      setValue(row, "Name", name);
      autoRows.push(row);
    }
    return row;
  }

  const quiver = ensureAutoRow("CornucopiaQuiverRefill");
  const thrown = ensureAutoRow("CornucopiaThrownRefill");

  [quiver, thrown].forEach((row) => {
    setValue(row, "enabled", "1");
    setValue(row, "spawnable", "1");
    setValue(row, "frequency", "1");
    setValue(row, "mod1code", "rep-qty");
    setValue(row, "mod1min", REFILL_RATE);
    setValue(row, "mod1max", REFILL_RATE);
  });

  setValue(quiver, "itype1", "aqv");
  setValue(quiver, "itype2", "cqv");
  setValue(thrown, "itype1", "");
  setValue(thrown, "itype2", "");

  writeTsvFile(autoFile);

  const miscFile = readTsvFromCandidates(PATHS.misc, "misc");
  miscFile.rows.forEach((row) => {
    const code = String(getValue(row, "code", "")).toLowerCase();
    if (code === "cqa" || code === "cqb") {
      setValue(row, "auto prefix", "CornucopiaQuiverRefill");
    }
  });
  writeTsvFile(miscFile);

  const weapFile = readTsvFromCandidates(PATHS.weapons, "weapons");
  weapFile.rows.forEach((row) => {
    const code = String(getValue(row, "code", "")).toLowerCase();
    if (code === "cjj" || code === "cjp") {
      setValue(row, "auto prefix", "CornucopiaThrownRefill");
    }
  });
  writeTsvFile(weapFile);
}

function setTreasureClassToItems(row, itemCodes) {
  setValue(row, "Picks", String(itemCodes.length));
  setValue(row, "NoDrop", "0");
  setValue(row, "Unique", "0");
  setValue(row, "Set", "0");
  setValue(row, "Rare", "0");
  setValue(row, "Magic", "0");

  const items = getIndexedColumns(row, "Item");
  items.forEach(({ key, idx }) => {
    row[key] = "";
    const probKey = Object.keys(row).find((k) => normalizeKeyName(k) === normalizeKeyName(`Prob${idx}`));
    if (probKey) {
      row[probKey] = "0";
    }
  });

  itemCodes.forEach((code, index) => {
    const target = items[index];
    if (!target) {
      return;
    }
    row[target.key] = code;
    const probKey = Object.keys(row).find((k) => normalizeKeyName(k) === normalizeKeyName(`Prob${target.idx}`));
    if (probKey) {
      row[probKey] = "1";
    }
  });
}

function ensureFallenTreasureClass() {
  const tcFile = readTsvFromCandidates(PATHS.treasureClassEx, "TreasureClassEx");
  const tcRows = tcFile.rows;

  const nameKey = Object.keys(tcRows[0] || {}).find((k) => normalizeKeyName(k) === normalizeKeyName("Treasure Class")) || "Treasure Class";
  let custom = tcRows.find((row) => String(row[nameKey] || "").toLowerCase() === FALLEN_TC_NAME.toLowerCase());
  if (!custom) {
    custom = cloneRow(tcRows[0] || {});
    Object.keys(custom).forEach((k) => {
      custom[k] = "";
    });
    custom[nameKey] = FALLEN_TC_NAME;
    tcRows.push(custom);
  }
  setTreasureClassToItems(custom, ["cqa", "cqb"]);

  tcRows.forEach((row) => {
    const tcName = String(row[nameKey] || "").toLowerCase();
    if (
      tcName.includes("fallen") ||
      tcName.includes("carver") ||
      tcName.includes("devilkin") ||
      tcName.includes("darkone") ||
      tcName.includes("dark one")
    ) {
      setTreasureClassToItems(row, ["cqa", "cqb"]);
    }
  });

  writeTsvFile(tcFile);
}

function bindFallenMonstersToCustomTC() {
  const monFile = readTsvFromCandidates(PATHS.monStats, "MonStats");
  monFile.rows.forEach((row) => {
    const id = String(getValue(row, "Id", "")).toLowerCase();
    const fallenFamily =
      id.includes("fallen") ||
      id.includes("carver") ||
      id.includes("devilkin") ||
      id.includes("darkone") ||
      id.includes("dark one");
    if (!fallenFamily) {
      return;
    }
    Object.keys(row).forEach((k) => {
      if (normalizeKeyName(k).startsWith(normalizeKeyName("TreasureClass"))) {
        row[k] = FALLEN_TC_NAME;
      }
    });
  });
  writeTsvFile(monFile);
}

function boostThrownDropsInTCs() {
  const tcFile = readTsvFromCandidates(PATHS.treasureClassEx, "TreasureClassEx");
  const tcRows = tcFile.rows;
  const variantMap = { jav: "cjj", pil: "cjp" };

  tcRows.forEach((row) => {
    const items = getIndexedColumns(row, "Item");
    if (!items.length) {
      return;
    }

    const empty = items.filter(({ key }) => String(row[key] || "").trim() === "");

    items.forEach(({ key, idx }) => {
      const code = String(row[key] || "").toLowerCase();
      const variant = variantMap[code];
      if (!variant) {
        return;
      }

      const probKey = Object.keys(row).find((k) => normalizeKeyName(k) === normalizeKeyName(`Prob${idx}`));
      const oldProb = probKey ? Math.max(1, asInt(row[probKey], 1)) : 1;
      const newProb = clamp(oldProb * 50, 1, 65535);

      if (empty.length > 0) {
        const target = empty.shift();
        row[target.key] = variant;
        const targetProb = Object.keys(row).find((k) => normalizeKeyName(k) === normalizeKeyName(`Prob${target.idx}`));
        if (targetProb) {
          row[targetProb] = String(newProb);
        }
      } else {
        row[key] = variant;
        if (probKey) {
          row[probKey] = String(newProb);
        }
      }
    });
  });

  writeTsvFile(tcFile);
}

function injectVendorInventory() {
  const invFile = readTsvFromCandidates(PATHS.inventory, "inventory");
  invFile.rows.forEach((row) => {
    const text = Object.values(row).join(" ").toLowerCase();
    const isAkara = text.includes("akara");
    const isCharsi = text.includes("charsi");
    if (!isAkara && !isCharsi) {
      return;
    }

    const itemCols = getIndexedColumns(row, "item");
    if (!itemCols.length) {
      return;
    }

    const want = [];
    if (isAkara) {
      want.push("cqa", "cqb");
    }
    if (isCharsi) {
      want.push("cjj", "cjp", "cqa", "cqb");
    }

    const existing = new Set(itemCols.map(({ key }) => String(row[key] || "").toLowerCase()));
    const empty = itemCols.filter(({ key }) => String(row[key] || "").trim() === "");
    const tail = [...itemCols].reverse();

    want.forEach((code) => {
      if (existing.has(code)) {
        return;
      }
      let slot = empty.shift();
      if (!slot) {
        slot = tail.shift();
      }
      if (slot) {
        row[slot.key] = code;
        existing.add(code);
      }
    });
  });
  writeTsvFile(invFile);
}

function addLocalization() {
  const jsonPaths = ["local/lng/strings/item-names.json", "local/lng/strings/item-name.json"];
  jsonPaths.forEach((path) => {
    try {
      const json = D2RMM.readJson(path);
      json.mod_cornucopia_arrows = "Cornucopia Arrows";
      json.mod_cornucopia_bolts = "Cornucopia Bolts";
      json.mod_cornucopia_javelin = "Cornucopia Javelin";
      json.mod_cornucopia_pilum = "Cornucopia Pilum";
      D2RMM.writeJson(path, json);
    } catch (err) {
      // Optional localization targets.
    }
  });
}

tuneItemQuality();
suppressMagicInTreasureClasses();
upsertQuivers();
upsertThrownVariants();
addRegenAffixes();
ensureFallenTreasureClass();
bindFallenMonstersToCustomTC();
boostThrownDropsInTCs();
injectVendorInventory();
addLocalization();

