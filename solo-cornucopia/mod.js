const MULTIPLIERS = {
  unique: 50,
  set: 25,
  rare: 5
};

const QUIVER_CODES = ["aqv", "cqv"];
const JAVELIN_CODES = [
  "jav", "pil", "ssp", "glv", "tsp",
  "9ja", "9pi", "9s9", "9gl", "9ts",
  "7ja", "7pi", "7s7", "7gl", "7ts"
];

const FALLEN_TC_NAME = "CornucopiaFallenAct1";
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
  charstats: ["global/excel/charstats.txt", "global/excel/CharStats.txt"],
  cubeMain: ["global/excel/cubemain.txt", "global/excel/CubeMain.txt"]
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
  const key = findKey(row, logicalName);
  return key ? row[key] : fallback;
}

function setVal(row, logicalName, value) {
  const key = findKey(row, logicalName);
  if (!key) return false;
  row[key] = String(value);
  return true;
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

function readTable(paths) {
  for (let i = 0; i < paths.length; i += 1) {
    try {
      return { path: paths[i], rows: D2RMM.readTsv(paths[i]) };
    } catch (err) {
      // try next path
    }
  }
  return null;
}

function writeTable(table) {
  D2RMM.writeTsv(table.path, table.rows);
}

function runStep(stepName, fn) {
  try {
    fn();
  } catch (err) {
    // Keep installation alive so other steps still apply.
    // D2RMM doesn't expose a warning API consistently; fallback to no-op on step failures.
  }
}

function scaleQualityChance(row, name, multiplier) {
  const base = asInt(getVal(row, name, "0"), 0);
  const div = asInt(getVal(row, `${name}Divisor`, "0"), 0);
  const min = asInt(getVal(row, `${name}Min`, "0"), 0);

  if (base > 0) setVal(row, name, Math.max(1, Math.floor(base / multiplier)));
  if (div > 0) setVal(row, `${name}Divisor`, Math.max(1, Math.floor(div / multiplier)));
  if (min > 0) setVal(row, `${name}Min`, Math.max(1, Math.floor(min / multiplier)));
}

function patchItemRatio() {
  const tbl = readTable(PATHS.itemRatio);
  if (!tbl) return;

  tbl.rows.forEach((row) => {
    scaleQualityChance(row, "Unique", MULTIPLIERS.unique);
    scaleQualityChance(row, "Set", MULTIPLIERS.set);
    scaleQualityChance(row, "Rare", MULTIPLIERS.rare);

    // Extremely suppress magic quality.
    setVal(row, "Magic", "1000000000");
    setVal(row, "MagicDivisor", "1000000000");
    setVal(row, "MagicMin", "1000000000");
  });

  writeTable(tbl);
}

function patchTreasureClassQualityBias() {
  const tbl = readTable(PATHS.treasureClassEx);
  if (!tbl) return;

  tbl.rows.forEach((row) => {
    const u = asInt(getVal(row, "Unique", "0"), 0);
    const s = asInt(getVal(row, "Set", "0"), 0);
    const r = asInt(getVal(row, "Rare", "0"), 0);
    const m = asInt(getVal(row, "Magic", "0"), 0);

    setVal(row, "Unique", Math.max(u, 4096));
    setVal(row, "Set", Math.max(s, 3072));
    setVal(row, "Rare", Math.max(r, 2048));
    setVal(row, "Magic", Math.min(m, -1024));
  });

  writeTable(tbl);
}

function setVendorFlags(row, vendorName) {
  const tag = vendorName.toLowerCase();
  Object.keys(row).forEach((k) => {
    const low = k.toLowerCase();
    if (!low.includes(tag)) return;
    row[k] = "1";
  });
}

function patchVanillaQuivers() {
  const tbl = readTable(PATHS.misc);
  if (!tbl) return;

  tbl.rows.forEach((row) => {
    const code = String(getVal(row, "code", "")).toLowerCase();
    if (!QUIVER_CODES.includes(code)) return;

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

    setVendorFlags(row, "akara");
    setVendorFlags(row, "charsi");
  });

  writeTable(tbl);
}

function patchVanillaJavelins() {
  const tbl = readTable(PATHS.weapons);
  if (!tbl) return;

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

    setVendorFlags(row, "charsi");
  });

  writeTable(tbl);
}

function ensureAutomagicRows() {
  const tbl = readTable(PATHS.automagic);
  if (!tbl || !tbl.rows.length) return;

  function ensure(name) {
    let row = tbl.rows.find((r) => String(getVal(r, "Name", "")).toLowerCase() === name.toLowerCase());
    if (!row) {
      row = cloneRow(tbl.rows[0]);
      Object.keys(row).forEach((k) => {
        row[k] = "";
      });
      setVal(row, "Name", name);
      tbl.rows.push(row);
    }
    return row;
  }

  const ammo = ensure("CornucopiaAmmoRefill");
  const jav = ensure("CornucopiaJavelinRefill");

  [ammo, jav].forEach((row) => {
    setVal(row, "enabled", "1");
    setVal(row, "spawnable", "1");
    setVal(row, "frequency", "1");
    setVal(row, "mod1code", "rep-qty");
    setVal(row, "mod1min", REFILL_RATE);
    setVal(row, "mod1max", REFILL_RATE);
  });

  setVal(ammo, "itype1", "aqv");
  setVal(ammo, "itype2", "cqv");
  setVal(jav, "itype1", "");
  setVal(jav, "itype2", "");

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
    const slot = itemCols[i];
    if (!slot) return;
    row[slot.key] = code;
    const probKey = Object.keys(row).find((k) => normalizeKey(k) === normalizeKey(`Prob${slot.idx}`));
    if (probKey) row[probKey] = "1";
  });
}

function forceFallenDrops() {
  const tcTbl = readTable(PATHS.treasureClassEx);
  if (!tcTbl || !tcTbl.rows.length) return;

  const tcNameKey = Object.keys(tcTbl.rows[0]).find((k) => normalizeKey(k) === normalizeKey("Treasure Class")) || "Treasure Class";
  let custom = tcTbl.rows.find((row) => String(row[tcNameKey] || "").toLowerCase() === FALLEN_TC_NAME.toLowerCase());
  if (!custom) {
    custom = cloneRow(tcTbl.rows[0]);
    Object.keys(custom).forEach((k) => {
      custom[k] = "";
    });
    custom[tcNameKey] = FALLEN_TC_NAME;
    tcTbl.rows.push(custom);
  }
  setTCItems(custom, QUIVER_CODES);

  tcTbl.rows.forEach((row) => {
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

  const monTbl = readTable(PATHS.monStats);
  if (!monTbl) return;
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

function boostJavelinsInTCs() {
  const tcTbl = readTable(PATHS.treasureClassEx);
  if (!tcTbl) return;
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
  const tbl = readTable(PATHS.inventory);
  if (!tbl) return;

  tbl.rows.forEach((row) => {
    const text = Object.values(row).join(" ").toLowerCase();
    const isAkara = text.includes("akara");
    const isCharsi = text.includes("charsi");
    if (!isAkara && !isCharsi) return;

    const wanted = [];
    if (isAkara) wanted.push("aqv", "cqv");
    if (isCharsi) wanted.push("jav", "pil", "aqv", "cqv");

    const itemCols = collectIndexedCols(row, "item");
    if (!itemCols.length) return;

    const existing = new Set(itemCols.map(({ key }) => String(row[key] || "").toLowerCase()));
    const empty = itemCols.filter(({ key }) => String(row[key] || "").trim() === "");
    const fallback = [...itemCols].reverse();

    wanted.forEach((code) => {
      if (existing.has(code)) return;
      let slot = empty.shift();
      if (!slot) slot = fallback.shift();
      if (!slot) return;
      row[slot.key] = code;
      existing.add(code);
    });
  });

  writeTable(tbl);
}

function patchAmazonStarter() {
  const tbl = readTable(PATHS.charstats);
  if (!tbl) return;

  const ama = tbl.rows.find((row) => {
    const cls = String(getVal(row, "class", "")).toLowerCase();
    return cls === "ama" || cls === "amazon";
  });
  if (!ama) return;

  const itemCols = collectIndexedCols(ama, "item");
  if (!itemCols.length) return;

  let slot = itemCols.find(({ key }) => JAVELIN_CODES.includes(String(ama[key] || "").toLowerCase()));
  if (!slot) slot = itemCols[0];
  ama[slot.key] = "jav";

  const countKey = Object.keys(ama).find((k) => normalizeKey(k) === normalizeKey(`${slot.key}count`));
  if (countKey) ama[countKey] = String(STACK_SIZE);

  writeTable(tbl);
}

function patchCowPortalNoLeg() {
  const tbl = readTable(PATHS.cubeMain);
  if (!tbl) return;

  tbl.rows.forEach((row) => {
    const desc = String(getVal(row, "description", "")).toLowerCase();
    const output = String(getVal(row, "output", "")).toLowerCase();
    const input1 = String(getVal(row, "input 1", "")).toLowerCase();
    const input2 = String(getVal(row, "input 2", "")).toLowerCase();

    const isCowRecipe =
      output === "cow portal" ||
      desc.includes("secret cow level") ||
      (input1 === "leg" && input2 === "tbk") ||
      (input1 === "tbk" && input2 === "leg");
    if (!isCowRecipe) return;

    setVal(row, "numinputs", "1");
    setVal(row, "input 1", "tbk");
    setVal(row, "input 2", "");
    setVal(row, "input 3", "");
    setVal(row, "input 4", "");
    setVal(row, "input 5", "");
    setVal(row, "input 6", "");
    setVal(row, "input 7", "");
  });

  writeTable(tbl);
}

runStep("item ratio", patchItemRatio);
runStep("tc quality bias", patchTreasureClassQualityBias);
runStep("quivers", patchVanillaQuivers);
runStep("javelins", patchVanillaJavelins);
runStep("automagic", ensureAutomagicRows);
runStep("fallen drops", forceFallenDrops);
runStep("javelin tcs", boostJavelinsInTCs);
runStep("vendor inventory", patchVendorInventory);
runStep("amazon starter", patchAmazonStarter);
runStep("cow portal no leg", patchCowPortalNoLeg);
