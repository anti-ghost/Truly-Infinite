// DEBUG is true in development environments, false otherwise
// Change this to false when deploying for production
const DEBUG = true;

const VERSION = "0.1";

const V = window.Vue,
  D = window.Decimal;

// Variables

const game = V.reactive({});

const newGame = {
  debug: DEBUG,
  version: VERSION,
  timePlayed: 0,
  lastTick: Date.now(),
  offlineProg: true,
  maxTicks: 10000,
  points: D(0),
  bestPoints: D(0),
  totalPoints: D(0),
  letters: [
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
  ],
};

const tabs = V.reactive({
  tab: 0,
});

let NaNerror = false;

const INFINITY = D.pow(2, 1024),
  LOG_INF = D.log10(INFINITY);

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// NaN-checking functions

function NaNalert() {
  if (NaNerror) return;
  NaNerror = true;
  copyStringToClipboard(btoa(JSON.stringify(game)));
  alert(
    "We have detected a NaN in your save! We have exported it to your clipboard (although it might be broken). " +
      "Please report this save to the developers of The Number Line, so they can look into it."
  );
}

function checkNaNs(obj = game) {
  for (const i in obj) {
    if (typeof obj[i] == "object" && obj[i] !== obj && checkNaNs(obj[i]))
      return true;
    if (Number.isNaN(obj[i])) return true;
  }
  return false;
}

// Functions that do not change the game save

function getPointGain(t = 1) {
  let rate = D.pow(getLetterBase(), getTotalLetters());
  return rate.mul(t);
}

function getLetterBase() {
  return D(2);
}

function getLetterScalingStart(x) {
  return D.floor(LOG_INF / x);
}

function getLetterCost(x) {
  let e = game.letters[x - 1].add(1).mul(x);
  if (game.letters[x - 1] >= getLetterScalingStart(x)) {
    const s = game.letters[x - 1] - getLetterScalingStart(x);
    e += s.mul(s.add(1)).div(2);
  }
  return D.pow10(e);
}

function canBuyLetter(x) {
  return game.points.gte(getLetterCost(x));
}

function getTotalLetters() {
  return game.letters.reduce((x, y) => x.add(y));
}

/* function getExponentGain(x = game.number) {
    return x.root(12 - 2 * game.chalComp.includes(2)).div(10).floor();
  }
  
  function getNextExponent(x = game.number) {
    return getExponentGain(x).add(1).mul(10).pow(12 - 2 * game.chalComp.includes(2));
  }
  
  function canUpgrade(x) {
    return (x == 1 || game.upgrades.includes(x - 1)) && game.exponents.gte(UPGRADE_COSTS[x - 1]);
  }
  
  function inChal(x) {
    return game.challenge == x;
  }
  
  function getMatterGain(t = 1) {
    let rate = getNumberRate(t);
    if (!game.chalComp.includes(5)) rate = rate.div(getMatterEffect());
    rate = rate.mul(D.pow(2, game.matterUpgrades[1]));
    return rate;
  }
  
  function getMatterEffect(x = game.matter) {
    return x.add(10).log10().pow(game.matterUpgrades[0].add(10).log10()).mul(D.pow(1.2, game.matterUpgrades[2]));
  }
  
  function getMatterUpgradeCost(x) {
    return MATTER_UPGRADE_COSTS[x].pow(game.matterUpgrades[x]).mul(1e30);
  }
  
  function getBlackHoleCost(x = game.blackHole) {
    let cost = x.gte(10) ? D.pow(2, x.sub(9)).mul(4000) : D.mul(400, x.add(1));
    return cost;
  }
  
  function getBlackHoleEffect(x = game.blackHole) {
    return x.add(10).log10().mul(game.upgrades.includes(15) ? 1.3 : 1);
  }
  
  function getDarkEnergyGain(t = 1) {
    return game.number.log10().div(10).mul(t);
  } */

// Rendering functions

function format(number, f = 0) {
  number = D(number);
  if (number.isNaN()) {
    NaNalert();
    return "NaN";
  }
  if (number.sign == -1) return "-" + format(number.neg());
  if (number.eq(Infinity)) return "Infinity";
  if (number.sign == 0) return "0";
  if (number.lt(1000)) return number.toNumber().toFixed(f);
  if (number.lt(1e6)) return number.toNumber().toFixed(0);
  if (number.lt("e1e6")) {
    let exponent = number.e;
    let mantissa = number.m;
    if (format(mantissa, 3) === "10.000") {
      mantissa = 1;
      exponent++;
    }
    return format(mantissa, 3) + "e" + format(exponent);
  }
  if (number.lt(D.tetrate(10, 6))) {
    return "e" + format(number.log10());
  }
  return "10^^" + format(number.slog());
}

function formatTime(time, f = 0) {
  time = D(time);
  if (time.isNaN()) {
    NaNalert();
    return "NaN seconds";
  }
  if (time.eq(Infinity)) return "forever";
  if (time.lt(60)) return format(time, f) + " seconds";
  if (time.lt(3600))
    return (
      format(time.div(60).floor()) +
      " minutes " +
      format(time.sub(time.div(60).floor().mul(60)), f) +
      " seconds"
    );
  if (time.lt(86400))
    return (
      format(time.div(3600).floor()) +
      " hours " +
      format(time.div(60).floor().sub(time.div(3600).floor().mul(60))) +
      " minutes " +
      format(time.sub(time.div(60).floor().mul(60)), f) +
      " seconds"
    );
  if (time.lt(31536000))
    return (
      format(time.div(86400).floor()) +
      " days " +
      format(time.div(3600).floor().sub(time.div(86400).floor().mul(24))) +
      " hours " +
      format(time.div(60).floor().sub(time.div(3600).floor().mul(60))) +
      " minutes"
    );
  if (time.lt(31536000000))
    return (
      format(time.div(31536000).floor()) +
      " years " +
      format(time.div(86400).floor().sub(time.div(31536000).floor().mul(365))) +
      " days"
    );
  return format(time.div(31536000)) + " years";
}

function onOff(x) {
  return x ? "ON" : "OFF";
}

function enableDisable(x) {
  return x ? "Disable" : "Enable";
}

// Buy-max functions

function buyMax(x) {
  if (game.points.lt(INFINITY)) {
    const b = D.affordGeometricSeries(
      game.points,
      D.pow10(x),
      D.pow10(x),
      game.letters[x - 1]
    );
    const c = D.sumGeometricSeries(
      b,
      D.pow10(x),
      D.pow10(x),
      game.letters[x - 1]
    );
    game.points = game.points.sub(c);
    game.letters[x - 1] = game.letters[x - 1].add(c);
  }
}

// Soft reset functions

/* function resetCompressors() {
  game.number = D(0);
  game.compressors = [
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
    D(0),
  ];
  game.darkEnergy = D(0);
} */

// QoL functions

function increasePoints(x) {
  game.points = game.points.add(x);
  game.totalPoints = game.totalPoints.add(x);
  if (game.points.gt(INFINITY)) game.points = INFINITY;
  if (game.totalPoints.gt(INFINITY)) game.totalPoints = INFINITY;
  if (game.points.gt(game.bestPoints)) game.bestPoints = game.points;
}

// Functions executed manually

function buyLetter(x) {
  if (canBuyLetter(x)) {
    game.points = game.points.sub(getLetterCost(x));
    game.letters[x - 1] = game.letters[x - 1].add(1);
  }
}

/* function exponentiate() {
  if (game.challenge > 0) {
    if (
      !game.chalComp.includes(game.challenge) &&
      game.number.gte(CHALLENGE_GOALS[game.challenge - 1])
    )
      game.chalComp.push(game.challenge);
    game.challenge = 0;
    resetCompressors();
  } else if (game.number.gte(1e12)) {
    game.expUnlocked = true;
    game.exponents = game.exponents.add(getExponentGain());
    resetCompressors();
  }
}

function upgrade(x) {
  if (canUpgrade(x)) {
    if (x % 4 > 0) game.exponents = game.exponents.sub(UPGRADE_COSTS[x - 1]);
    game.upgrades.push(x);
  }
}

function enableAutobuyers() {
  for (let i = 0; i < 10; i++) game.autobuyers[i] = true;
}

function disableAutobuyers() {
  for (let i = 0; i < 10; i++) game.autobuyers[i] = false;
}

function enterChal(x) {
  if (
    game.upgrades.includes(4) &&
    game.challenge == 0 &&
    (!game.chalConf ||
      confirm(
        "Entering a challenge will perform an Exponent reset. You will need to reach the required number under certain restrictions to complete the challenge."
      ))
  ) {
    if (game.expOnChal) game.exponents = game.exponents.add(getExponentGain());
    resetCompressors();
    game.challenge = x;
  }
}

function matterUpgrade(x) {
  if (game.matter.gte(getMatterUpgradeCost(x))) {
    game.matter = game.matter.sub(getMatterUpgradeCost(x));
    game.matterUpgrades[x] = game.matterUpgrades[x].add(1);
  }
}

function upgradeBlackHole() {
  if (getMatterEffect().gte(getBlackHoleCost())) {
    game.matter = D(0);
    game.blackHole = game.blackHole.add(1);
  }
} */

// Game loop functions

function loop(time) {
  if (NaNerror) return;
  if (checkNaNs()) {
    NaNalert();
    return;
  }
  increasePoints(getPointGain(time));
}

function simulateTime(ms) {
  if (NaNerror) return;
  game.lastTick = Date.now();
  ms *= dev.speed;
  for (let i = 0; i < Math.min(ms, 16); i++) {
    loop(ms / (1000 * Math.min(ms, 16)));
    if (NaNerror) return;
  }
}

// Save-load functions

// Transform the game save to Decimal
function transformSaveToDecimal() {
  let i;
  game.points = D(game.points);
  game.bestPoints = D(game.highestPoints);
  game.totalPoints = D(game.totalPoints);
  for (i = 0; i < 26; i++) game.letters[i] = D(game.letters[i]);
}

function reset(obj = newGame) {
  for (const i in obj) {
    game[i] = obj[i];
  }
}

function loadGame(loadgame) {
  // Prevent loading a development save into the main game
  /* if (loadgame.debug && !DEBUG) {
    $.notify(
      "Import failed, attempted to load development save into the main game.",
      "error"
    );
    return;
  } */
  reset();
  for (const i in loadgame) {
    game[i] = loadgame[i];
  }
  game.debug = DEBUG;
  game.version = VERSION;
  transformSaveToDecimal();
  const diff = Date.now() - game.lastTick;
  if (DEBUG) console.log(diff);
  if (game.offlineProg) {
    simulateTime(diff, true);
  }
}

function save(auto = false) {
  // Prevent saving of games that contain NaNs
  if (NaNerror) {
    if (auto) $.notify("Save failed, attempted to save a broken game", "error");
    return;
  }
  localStorage.setItem("TrulyInfiniteSave", btoa(JSON.stringify(game)));
  if (auto) $.notify("Game saved", "success");
}

function load() {
  reset();
  if (localStorage.getItem("TrulyInfiniteSave") !== null) {
    loadGame(JSON.parse(atob(localStorage.getItem("TrulyInfiniteSave"))));
  }
  setInterval(() => simulateTime(Date.now() - game.lastTick));
  setInterval(() => save(), 5000);
}

function copyStringToClipboard(str) {
  const el = document.createElement("textarea");
  el.value = str;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

function importSave() {
  try {
    const txt = prompt(
      "Copy-paste your save. WARNING: WILL OVERWRITE YOUR SAVE"
    );
    loadGame(JSON.parse(atob(txt)));
    save();
  } catch (e) {
    if (DEBUG) console.log(e);
  }
}

function exportSave() {
  copyStringToClipboard(btoa(JSON.stringify(game)));
  $.notify("Copied to clipboard", "success");
}

function hardReset() {
  if (
    prompt(
      "Are you sure you want to reset your game? This cannot be undone! Type “reset” without quotation marks to reset your game."
    ) === "reset"
  ) {
    localStorage.removeItem("TrulyInfiniteSave");
    location.reload();
  }
}

// Define a Vue instance
const app = V.createApp({
  data() {
    return dev;
  },
});

// Define the object containing all local variables
const dev = {
  V,
  $,
  D,
  VERSION,
  DEBUG,
  speed: 1,
  game,
  newGame,
  tabs,
  NaNerror,
  INFINITY,
  LOG_INF,
  LETTERS,
  NaNalert,
  checkNaNs,
  getPointGain,
  getLetterBase,
  getLetterScalingStart,
  getLetterCost,
  canBuyLetter,
  getTotalLetters,
  format,
  formatTime,
  onOff,
  enableDisable,
  buyMax,
  buyLetter,
  loop,
  simulateTime,
  reset,
  loadGame,
  save,
  load,
  copyStringToClipboard,
  importSave,
  exportSave,
  hardReset,
  app,
};

dev.dev = dev;

load();

// Mount the Vue instance to the #app container
app.mount("#app");

// Display the #app container
document.getElementById("app").style.display = "";
