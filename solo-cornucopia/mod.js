const QUALITY_MULTIPLIERS = {
  unique: 50,
  set: 25,
  rare: 5
};

const QUIVER_PRICE = 117;
const QUIVER_STACK = 100;
const REFILL_RATE = 100;
const FALLEN_ACT1_TCS = "CornucopiaFallenAct1";

const CORNUCOPIA_QUIVERS = [
  { code: "cqa", base: "aqv", namestr: "mod_cornucopia_arrows" },
  { code: "cqb", base: "cqv", namestr: "mod_cornucopia_bolts" }
];

const CORNUCOPIA_THROWN = [
  { code: "cjj", base: "jav", namestr: "mod_cornucopia_javelin" },
  { code: "cjp", base: "pil", namestr: "mod_cornucopia_pilum" }
];

function asInt(value, fallback = 0) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function cloneRow(row) {
  const out = {};
  Object.keys(row).forEach((k) => {
    out[k] = row[k];
  });
  return out;
}

function setIfPresent(row, keys, value) {
  keys.forEach((key) => {
    if (row[key] !== undefined) {
      row[key] = String(value);
    }
  });
}

function getTcName(row) {
  return String(row["Treasure Class"] || row.treasureclass || "").trim();
}

function collectColumns(row, pattern) {
  return Object.keys(row).filter((k) => pattern.test(k));
}

function ensureAutomagicRow(automagic, name) {
  let row = automagic.find((r) => String(r.Name || "") === name);
  if (!row) {
    row = {};
    if (automagic[0]) {
      Object.keys(automagic[0]).forEach((k) => {
        row[k] = "";
      });
    }
    row.Name = name;
    automagic.push(row);
  }
  return row;
}

function tuneQualityRolls() {
  const itemRatio = D2RMM.readTsv("global/excel/ItemRatio.txt");
  itemRatio.forEach((row) => {
    if (row.UniqueDivisor !== undefined) {
      row.UniqueDivisor = String(Math.max(1, Math.floor(asInt(row.UniqueDivisor, 1) / QUALITY_MULTIPLIERS.unique)));
    }
    if (row.SetDivisor !== undefined) {
      row.SetDivisor = String(Math.max(1, Math.floor(asInt(row.SetDivisor, 1) / QUALITY_MULTIPLIERS.set)));
    }
    if (row.RareDivisor !== undefined) {
      row.RareDivisor = String(Math.max(1, Math.floor(asInt(row.RareDivisor, 1) / QUALITY_MULTIPLIERS.rare)));
    }
    if (row.MagicDivisor !== undefined) {
      row.MagicDivisor = "1000000000";
    }
  });
  D2RMM.writeTsv("global/excel/ItemRatio.txt", itemRatio);
}

function setVendorFlags(row, vendorName) {
  Object.keys(row).forEach((key) => {
    const lowered = key.toLowerCase();
    if (!lowered.includes(vendorName)) {
      return;
    }
    if (lowered.includes("magic")) {
      // Vendors naturally support magic quality, not guaranteed rare-quality shop items.
      row[key] = "1";
    } else if (lowered.includes("min") || lowered.includes("max") || lowered.includes("lvl")) {
      row[key] = "1";
    } else {
      row[key] = "1";
    }
  });
}

function upsertCornucopiaQuivers() {
  const misc = D2RMM.readTsv("global/excel/misc.txt");
  CORNUCOPIA_QUIVERS.forEach((spec) => {
    const baseRow = misc.find((r) => r.code === spec.base);
    if (!baseRow) {
      D2RMM.error(`Could not find base quiver code ${spec.base} in misc.txt.`);
      return;
    }

    let row = misc.find((r) => r.code === spec.code);
    if (!row) {
      row = cloneRow(baseRow);
      row.code = spec.code;
      misc.push(row);
    }

    row.namestr = spec.namestr;
    row.spawnable = "1";
    if (row.PermStoreItem !== undefined) row.PermStoreItem = "1";
    row.level = "1";
    row.levelreq = "1";
    row.cost = String(QUIVER_PRICE);
    if (row["gamble cost"] !== undefined) row["gamble cost"] = String(QUIVER_PRICE);

    setIfPresent(row, ["maxstack", "max stack"], QUIVER_STACK);
    setIfPresent(row, ["minstack", "min stack"], QUIVER_STACK);
    setIfPresent(row, ["spawnstack", "spawn stack"], QUIVER_STACK);

    setVendorFlags(row, "akara");
    setVendorFlags(row, "charsi");
  });
  D2RMM.writeTsv("global/excel/misc.txt", misc);
}

function upsertCornucopiaThrownWeapons() {
  const weapons = D2RMM.readTsv("global/excel/weapons.txt");

  CORNUCOPIA_THROWN.forEach((spec) => {
    const base = weapons.find((r) => r.code === spec.base);
    if (!base) {
      D2RMM.error(`Could not find base thrown code ${spec.base} in weapons.txt.`);
      return;
    }

    let row = weapons.find((r) => r.code === spec.code);
    if (!row) {
      row = cloneRow(base);
      row.code = spec.code;
      weapons.push(row);
    }

    row.namestr = spec.namestr;
    row.spawnable = "1";
    row.level = "1";
    row.levelreq = "1";
    row.cost = String(QUIVER_PRICE);
    if (row["gamble cost"] !== undefined) row["gamble cost"] = String(QUIVER_PRICE);
    if (row.PermStoreItem !== undefined) row.PermStoreItem = "1";

    setIfPresent(row, ["maxstack", "max stack"], QUIVER_STACK);
    setIfPresent(row, ["minstack", "min stack"], QUIVER_STACK);
    setIfPresent(row, ["spawnstack", "spawn stack"], QUIVER_STACK);

    if (row.frequency !== undefined) {
      const baseFreq = Math.max(1, asInt(base.frequency, 1));
      row.frequency = String(Math.max(1, baseFreq * 50));
    }

    setVendorFlags(row, "charsi");
  });

  D2RMM.writeTsv("global/excel/weapons.txt", weapons);
}

function addRefillAffixes() {
  const automagic = D2RMM.readTsv("global/excel/automagic.txt");
  const quiverRefill = ensureAutomagicRow(automagic, "CornucopiaQuiverRefill");
  const thrownRefill = ensureAutomagicRow(automagic, "CornucopiaThrownRefill");

  quiverRefill.enabled = "1";
  quiverRefill.spawnable = "1";
  quiverRefill.frequency = "1";
  quiverRefill.mod1code = "rep-qty";
  quiverRefill.mod1min = String(REFILL_RATE);
  quiverRefill.mod1max = String(REFILL_RATE);
  quiverRefill.itype1 = "aqv";
  quiverRefill.itype2 = "cqv";

  thrownRefill.enabled = "1";
  thrownRefill.spawnable = "1";
  thrownRefill.frequency = "1";
  thrownRefill.mod1code = "rep-qty";
  thrownRefill.mod1min = String(REFILL_RATE);
  thrownRefill.mod1max = String(REFILL_RATE);
  thrownRefill.itype1 = "";
  thrownRefill.itype2 = "";

  D2RMM.writeTsv("global/excel/automagic.txt", automagic);

  const misc = D2RMM.readTsv("global/excel/misc.txt");
  misc.forEach((row) => {
    if (CORNUCOPIA_QUIVERS.some((q) => q.code === row.code) && row["auto prefix"] !== undefined) {
      row["auto prefix"] = "CornucopiaQuiverRefill";
    }
  });
  D2RMM.writeTsv("global/excel/misc.txt", misc);

  const weapons = D2RMM.readTsv("global/excel/weapons.txt");
  weapons.forEach((row) => {
    if (CORNUCOPIA_THROWN.some((w) => w.code === row.code) && row["auto prefix"] !== undefined) {
      row["auto prefix"] = "CornucopiaThrownRefill";
    }
  });
  D2RMM.writeTsv("global/excel/weapons.txt", weapons);
}

function ensureTreasureClassRow(treasureClasses, name, itemCodes) {
  const sample = treasureClasses[0];
  let row = treasureClasses.find((r) => getTcName(r).toLowerCase() === name.toLowerCase());
  if (!row) {
    row = cloneRow(sample);
    Object.keys(row).forEach((k) => {
      row[k] = "";
    });
    if (row["Treasure Class"] !== undefined) {
      row["Treasure Class"] = name;
    } else {
      row.treasureclass = name;
    }
    treasureClasses.push(row);
  }

  if (row.group !== undefined) row.group = "0";
  if (row.level !== undefined) row.level = "1";
  if (row.Picks !== undefined) row.Picks = String(itemCodes.length);
  if (row.NoDrop !== undefined) row.NoDrop = "0";

  const itemCols = collectColumns(row, /^Item\d+$/i).sort((a, b) => asInt(a.replace(/\D/g, ""), 0) - asInt(b.replace(/\D/g, ""), 0));
  itemCols.forEach((itemCol) => {
    const idx = itemCol.replace(/\D/g, "");
    const probCol = `Prob${idx}`;
    row[itemCol] = "";
    if (row[probCol] !== undefined) row[probCol] = "0";
  });

  itemCodes.forEach((code, i) => {
    const col = `Item${i + 1}`;
    const prob = `Prob${i + 1}`;
    if (row[col] !== undefined) row[col] = code;
    if (row[prob] !== undefined) row[prob] = "1";
  });
}

function forceFallenAct1QuiverDrops() {
  let treasureClasses;
  let monStats;
  try {
    treasureClasses = D2RMM.readTsv("global/excel/TreasureClassEx.txt");
    monStats = D2RMM.readTsv("global/excel/MonStats.txt");
  } catch (err) {
    return;
  }

  const quiverCodes = CORNUCOPIA_QUIVERS.map((q) => q.code);
  ensureTreasureClassRow(treasureClasses, FALLEN_ACT1_TCS, quiverCodes);

  treasureClasses.forEach((row) => {
    const name = getTcName(row).toLowerCase();
    if (name.includes("fallen") || name.includes("carver") || name.includes("devilkin") || name.includes("darkone") || name.includes("dark one")) {
      ensureTreasureClassRow(treasureClasses, getTcName(row), quiverCodes);
    }
  });
  D2RMM.writeTsv("global/excel/TreasureClassEx.txt", treasureClasses);

  monStats.forEach((row) => {
    const id = String(row.Id || row.id || "").toLowerCase();
    const isFallenFamily =
      id.includes("fallen") || id.includes("carver") || id.includes("devilkin") || id.includes("darkone");
    if (!isFallenFamily) {
      return;
    }

    Object.keys(row).forEach((k) => {
      if (k.toLowerCase().startsWith("treasureclass")) {
        row[k] = FALLEN_ACT1_TCS;
      }
    });
  });
  D2RMM.writeTsv("global/excel/MonStats.txt", monStats);
}

function injectVendorInventoryEntries() {
  let inventory;
  try {
    inventory = D2RMM.readTsv("global/excel/inventory.txt");
  } catch (err) {
    return;
  }

  inventory.forEach((row) => {
    const text = Object.values(row).join(" ").toLowerCase();
    const isAkara = text.includes("akara");
    const isCharsi = text.includes("charsi");
    if (!isAkara && !isCharsi) {
      return;
    }

    const desiredCodes = [];
    if (isAkara) {
      desiredCodes.push("cqa", "cqb");
    }
    if (isCharsi) {
      desiredCodes.push("cjj", "cjp", "cqa", "cqb");
    }

    const itemCols = collectColumns(row, /^item\d+$/i).sort((a, b) => asInt(a.replace(/\D/g, ""), 0) - asInt(b.replace(/\D/g, ""), 0));
    if (!itemCols.length) {
      return;
    }

    const existing = new Set(itemCols.map((c) => String(row[c] || "").toLowerCase()));
    const empty = itemCols.filter((c) => String(row[c] || "").trim() === "");
    desiredCodes.forEach((code) => {
      if (existing.has(code) || !empty.length) {
        return;
      }
      row[empty.shift()] = code;
    });

    if (isCharsi) {
      Object.keys(row).forEach((k) => {
        const lowered = k.toLowerCase();
        if (lowered.includes("charsi") && lowered.includes("magic")) {
          row[k] = "1";
        }
      });
    }
  });

  D2RMM.writeTsv("global/excel/inventory.txt", inventory);
}

function addLocalizationStubs() {
  const candidates = [
    "local/lng/strings/item-names.json",
    "local/lng/strings/item-name.json"
  ];
  candidates.forEach((path) => {
    try {
      const json = D2RMM.readJson(path);
      json.mod_cornucopia_arrows = "Cornucopia Arrows";
      json.mod_cornucopia_bolts = "Cornucopia Bolts";
      json.mod_cornucopia_javelin = "Cornucopia Javelin";
      json.mod_cornucopia_pilum = "Cornucopia Pilum";
      D2RMM.writeJson(path, json);
    } catch (err) {
      // No-op when file does not exist in merged data.
    }
  });
}

tuneQualityRolls();
upsertCornucopiaQuivers();
upsertCornucopiaThrownWeapons();
addRefillAffixes();
forceFallenAct1QuiverDrops();
injectVendorInventoryEntries();
addLocalizationStubs();

