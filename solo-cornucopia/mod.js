const DROP_PRESETS = {
  light: {
    noDropMult: 0.9,
    bossNoDropMult: 0.8,
    ratioDivisorMult: 0.95,
    tcMeaningfulBonus: 1
  },
  medium: {
    noDropMult: 0.75,
    bossNoDropMult: 0.6,
    ratioDivisorMult: 0.85,
    tcMeaningfulBonus: 2
  },
  high: {
    noDropMult: 0.6,
    bossNoDropMult: 0.45,
    ratioDivisorMult: 0.75,
    tcMeaningfulBonus: 3
  }
};

const QUVER_PRESETS = {
  large_stack: {
    maxstack: 4000
  },
  replenishing_like: {
    maxstack: 1200
  }
};

const TARGETED_UNIQUES = [
  "The Countess",
  "Pindleskin",
  "Eldritch the Rectifier",
  "Shenk the Overseer",
  "Nihlathak"
];

function getConfigValue(id, fallback) {
  if (!globalThis.config || config[id] === undefined || config[id] === null) {
    return fallback;
  }
  return config[id];
}

function asInt(value, fallback = 0) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return parsed;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getRowName(row) {
  return (
    row["Treasure Class"] ||
    row["treasure class"] ||
    row.Name ||
    row.name ||
    ""
  );
}

function looksLikeBossOrChampion(tcName) {
  const lower = tcName.toLowerCase();
  return (
    lower.includes("boss") ||
    lower.includes("champ") ||
    lower.includes("unique") ||
    lower.includes("andariel") ||
    lower.includes("duriel") ||
    lower.includes("mephisto") ||
    lower.includes("diablo") ||
    lower.includes("baal")
  );
}

function collectNumberedColumns(row, prefix) {
  return Object.keys(row)
    .filter((k) => k.startsWith(prefix))
    .sort((a, b) => asInt(a.slice(prefix.length), 0) - asInt(b.slice(prefix.length), 0));
}

function applyDropTuning() {
  const presetName = getConfigValue("dropIntensity", "medium");
  const preset = DROP_PRESETS[presetName] || DROP_PRESETS.medium;

  const treasureClasses = D2RMM.readTsv("global/excel/TreasureClassEx.txt");
  treasureClasses.forEach((row) => {
    const tcName = getRowName(row);
    const isBossLike = looksLikeBossOrChampion(tcName);

    if (row.NoDrop !== undefined) {
      const originalNoDrop = asInt(row.NoDrop, 0);
      const mult = isBossLike ? preset.bossNoDropMult : preset.noDropMult;
      row.NoDrop = String(clamp(Math.floor(originalNoDrop * mult), 0, 65535));
    }

    const itemColumns = collectNumberedColumns(row, "Item");
    itemColumns.forEach((itemCol) => {
      const idx = itemCol.slice(4);
      const probCol = `Prob${idx}`;
      if (row[probCol] === undefined) {
        return;
      }
      const item = String(row[itemCol] || "").toLowerCase();
      const isMeaningful =
        item.includes("armo") ||
        item.includes("weap") ||
        item.includes("jewl") ||
        item.includes("rune") ||
        item.includes("good");
      if (!isMeaningful) {
        return;
      }
      const prob = asInt(row[probCol], 0);
      row[probCol] = String(clamp(prob + preset.tcMeaningfulBonus, 0, 65535));
    });
  });
  D2RMM.writeTsv("global/excel/TreasureClassEx.txt", treasureClasses);

  const itemRatio = D2RMM.readTsv("global/excel/ItemRatio.txt");
  itemRatio.forEach((row) => {
    ["UniqueDivisor", "SetDivisor", "RareDivisor"].forEach((col) => {
      if (row[col] === undefined) {
        return;
      }
      const oldValue = asInt(row[col], 1);
      const tuned = Math.max(1, Math.floor(oldValue * preset.ratioDivisorMult));
      row[col] = String(tuned);
    });
  });
  D2RMM.writeTsv("global/excel/ItemRatio.txt", itemRatio);
}

function cloneRow(row) {
  const out = {};
  Object.keys(row).forEach((k) => {
    out[k] = row[k];
  });
  return out;
}

function upsertCornucopiaQuivers() {
  const enabled = !!getConfigValue("enableCornucopiaQuivers", true);
  if (!enabled) {
    return;
  }

  const style = getConfigValue("cornucopiaStyle", "large_stack");
  const quiverPreset = QUVER_PRESETS[style] || QUVER_PRESETS.large_stack;

  const misc = D2RMM.readTsv("global/excel/misc.txt");
  const baseArrow = misc.find((r) => r.code === "aqv");
  const baseBolt = misc.find((r) => r.code === "cqv");
  if (!baseArrow || !baseBolt) {
    D2RMM.error("Could not find aqv/cqv in misc.txt; cannot create Cornucopia quivers.");
    return;
  }

  function upsert(baseRow, code, nameStr) {
    let row = misc.find((r) => r.code === code);
    if (!row) {
      row = cloneRow(baseRow);
      row.code = code;
      misc.push(row);
    }
    row.namestr = nameStr;
    row.spawnable = "1";
    row.level = "45";
    row.levelreq = "40";
    row.maxstack = String(quiverPreset.maxstack);
    row.cost = String(Math.max(asInt(baseRow.cost, 1), 1) * 5);
  }

  upsert(baseArrow, "cqa", "mod_cornucopia_arrows");
  upsert(baseBolt, "cqb", "mod_cornucopia_bolts");
  D2RMM.writeTsv("global/excel/misc.txt", misc);
}

function tcMatchesSource(tcName, sourceMode) {
  const lower = tcName.toLowerCase();
  const isActBoss =
    lower.includes("andariel") ||
    lower.includes("duriel") ||
    lower.includes("mephisto") ||
    lower.includes("diablo") ||
    lower.includes("baal");

  if (sourceMode === "boss_only") {
    return isActBoss;
  }
  if (sourceMode === "boss_plus_targeted") {
    return (
      isActBoss ||
      TARGETED_UNIQUES.some((name) => lower.includes(name.toLowerCase()))
    );
  }
  if (sourceMode === "global_rare") {
    return lower.includes("unique") || lower.includes("champ");
  }
  return false;
}

function injectQuiversIntoTreasureClasses() {
  const enabled = !!getConfigValue("enableCornucopiaQuivers", true);
  if (!enabled) {
    return;
  }
  const sourceMode = getConfigValue("quiverSource", "boss_only");
  const dropIntensity = getConfigValue("dropIntensity", "medium");
  const baseWeight = dropIntensity === "high" ? 3 : dropIntensity === "light" ? 1 : 2;

  const treasureClasses = D2RMM.readTsv("global/excel/TreasureClassEx.txt");
  treasureClasses.forEach((row) => {
    const tcName = getRowName(row);
    if (!tcMatchesSource(tcName, sourceMode)) {
      return;
    }

    const itemColumns = collectNumberedColumns(row, "Item");
    const hasCqa = itemColumns.some((col) => row[col] === "cqa");
    const hasCqb = itemColumns.some((col) => row[col] === "cqb");
    if (hasCqa && hasCqb) {
      return;
    }

    const emptySlots = itemColumns.filter((col) => String(row[col] || "").trim() === "");
    if (emptySlots.length < 2) {
      return;
    }

    const first = emptySlots[0];
    const second = emptySlots[1];
    const firstIdx = first.slice(4);
    const secondIdx = second.slice(4);
    row[first] = "cqa";
    row[`Prob${firstIdx}`] = String(baseWeight);
    row[second] = "cqb";
    row[`Prob${secondIdx}`] = String(baseWeight);
  });

  D2RMM.writeTsv("global/excel/TreasureClassEx.txt", treasureClasses);
}

function addLocalizationStubs() {
  // D2RMM mods commonly ship localization JSON files under local/lng/strings.
  // We only create stubs if a target file already exists in merged data.
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
      // Safe no-op when a specific localization file is not present in current setup.
    }
  });
}

applyDropTuning();
upsertCornucopiaQuivers();
injectQuiversIntoTreasureClasses();
addLocalizationStubs();

