const QUALITY_MULTIPLIERS = {
  unique: 50,
  set: 25,
  rare: 5
};

const QUIVER_PRICE = 117;
const QUIVER_STACK = 100;
const QUIVER_REFILL_RATE = 100;

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

    // D2 quality rolls do not expose a strict "never magic" switch in ItemRatio.
    // Set to a huge divisor so magic drops are effectively suppressed.
    if (row.MagicDivisor !== undefined) {
      row.MagicDivisor = "1000000000";
    }
  });
  D2RMM.writeTsv("global/excel/ItemRatio.txt", itemRatio);
}

function upsertCornucopiaQuivers() {
  const misc = D2RMM.readTsv("global/excel/misc.txt");
  const baseArrow = misc.find((r) => r.code === "aqv");
  const baseBolt = misc.find((r) => r.code === "cqv");
  if (!baseArrow || !baseBolt) {
    D2RMM.error("Could not find aqv/cqv in misc.txt; cannot create Cornucopia quivers.");
    return;
  }

  function applyQuiverRow(baseRow, code, nameStr) {
    let row = misc.find((r) => r.code === code);
    if (!row) {
      row = cloneRow(baseRow);
      row.code = code;
      misc.push(row);
    }

    row.namestr = nameStr;
    row.spawnable = "1";
    row.level = "1";
    row.levelreq = "1";
    row.cost = String(QUIVER_PRICE);
    if (row["gamble cost"] !== undefined) {
      row["gamble cost"] = String(QUIVER_PRICE);
    }
    row.maxstack = String(QUIVER_STACK);

    // Keep appearance/behavior close to normal quivers while forcing fixed quantity.
    setIfPresent(row, ["minstack", "min stack"], QUIVER_STACK);
    setIfPresent(row, ["spawnstack", "spawn stack"], QUIVER_STACK);

    // Try to force vendor stocking by enabling all Akara-related columns if they exist.
    Object.keys(row).forEach((key) => {
      const lowered = key.toLowerCase();
      if (lowered.includes("akara")) {
        if (lowered.includes("magic")) {
          row[key] = "0";
        } else if (lowered.includes("min")) {
          row[key] = "1";
        } else if (lowered.includes("max")) {
          row[key] = "1";
        } else {
          row[key] = "1";
        }
      }
    });
  }

  applyQuiverRow(baseArrow, "cqa", "mod_cornucopia_arrows");
  applyQuiverRow(baseBolt, "cqb", "mod_cornucopia_bolts");
  D2RMM.writeTsv("global/excel/misc.txt", misc);
}

function addRefillAffixToQuivers() {
  // Replenish quantity is an item stat, but exact "100 per second" is not directly exposed.
  // We add a very strong replenish stat via automagic to approximate the requested behavior.
  const automagic = D2RMM.readTsv("global/excel/automagic.txt");
  let row = automagic.find((r) => r.Name === "CornucopiaRefill");
  if (!row) {
    row = {};
    // Keep a minimal but valid row shape by cloning first entry when possible.
    if (automagic[0]) {
      Object.keys(automagic[0]).forEach((k) => {
        row[k] = "";
      });
    }
    row.Name = "CornucopiaRefill";
    automagic.push(row);
  }

  row.enabled = "1";
  row.classspecific = "";
  row.divide = "1";
  row.multiply = "1";
  row.itype1 = "aqv";
  row.itype2 = "cqv";
  row.mod1code = "rep-qty";
  row.mod1min = String(QUIVER_REFILL_RATE);
  row.mod1max = String(QUIVER_REFILL_RATE);
  row.spawnable = "1";
  row.frequency = "1";

  D2RMM.writeTsv("global/excel/automagic.txt", automagic);

  const misc = D2RMM.readTsv("global/excel/misc.txt");
  misc.forEach((r) => {
    if (r.code === "cqa" || r.code === "cqb") {
      if (r["auto prefix"] !== undefined) {
        r["auto prefix"] = "CornucopiaRefill";
      }
    }
  });
  D2RMM.writeTsv("global/excel/misc.txt", misc);
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
      D2RMM.writeJson(path, json);
    } catch (err) {
      // No-op if not present in current install.
    }
  });
}

tuneQualityRolls();
upsertCornucopiaQuivers();
addRefillAffixToQuivers();
addLocalizationStubs();
