(() => {
  // ../.dart_tool/skybound_source/game/constants.js
  var T = 32;
  var COLS = 48;
  var AREA_ROWS = 36;
  var AREA_COUNT = 13;
  var ROWS = AREA_ROWS * AREA_COUNT;
  var WORLD_W = COLS * T;
  var WORLD_H = ROWS * T;
  var TILE = { EMPTY: 0, SOLID: 1, FERTILE: 2, ONEWAY: 3, VINE: 4, THORN: 5, REAL: 6, MOON: 7 };
  var AREA_NAMES = [
    "Lembah Akar Embun",
    "Kanopi Jembatan Putus",
    "Kota Air Terbalik",
    "Reruntuhan Matahari Pecah",
    "Menara Lonceng Sunyi",
    "Kepulauan Angin Pengembara",
    "Kebun Bara Senja",
    "Gua Kristal Gemerlap",
    "Danau Cermin Bulan",
    "Mesin Waktu Akar",
    "Sarang Awan Petir",
    "Taman Jamur Senja",
    "Mahkota Bintang"
  ];
  var AREA_KIND = ["puzzle", "puzzle", "puzzle", "puzzle", "puzzle", "puzzle", "puzzle", "bonus", "puzzle", "puzzle", "combat", "bonus", "final"];
  var AREA_TAG = { puzzle: "", bonus: "Area Bonus", combat: "Area Tempur", final: "Lapisan Terakhir" };
  var areaTopRow = (a) => (AREA_COUNT - 1 - a) * AREA_ROWS;
  var areaOfRow = (row) => Math.max(0, Math.min(AREA_COUNT - 1, AREA_COUNT - 1 - Math.floor(row / AREA_ROWS)));
  var areaOfY = (y) => areaOfRow(Math.floor(y / T));
  var PLAYER_W = 20;
  var PLAYER_H = 44;
  var PLAYER_VIS_H = 60;
  var ARROW_TYPES = ["normal", "sprout", "thread", "echo", "wind", "ember"];
  var ARROW_COST = { normal: 0, sprout: 25, thread: 20, echo: 15, wind: 15, ember: 20 };
  var ARROW_COLOR = { normal: "#f3e2b0", sprout: "#7ed957", thread: "#e8f1ff", echo: "#c08cff", wind: "#9fe6ff", ember: "#ff8a3c" };
  var ARROW_NAME = {
    normal: "Panah biasa",
    sprout: "Panah Tunas",
    thread: "Panah Benang",
    echo: "Panah Gema",
    wind: "Panah Angin",
    ember: "Panah Bara"
  };
  var FXC = { spark: "arrow_hit", fire: "sprout_grow", wind: "splash", bolt: "dust" };
  var ARROW_SPRITE = {
    normal: ["PROPS_B", "arrow_normal"],
    sprout: ["PROPS_B", "arrow_sprout"],
    thread: ["PROPS_B", "arrow_thread"],
    echo: ["PROPS_C", "arrow_echo"],
    wind: ["PROPS_C", "arrow_wind"],
    ember: ["PROPS_C", "arrow_ember"]
  };
  var SKINS = [
    { id: "aera", price: 0, name: "Aera", prefix: "AERA", col: "#d9542b" },
    { id: "rimba", price: 20, name: "Rimba", prefix: "SKIN_RIMBA", col: "#3f7a1c" },
    { id: "salju", price: 30, name: "Salju", prefix: "SKIN_SALJU", col: "#bfe4ff" },
    { id: "senja", price: 40, name: "Senja", prefix: "SKIN_SENJA", col: "#7a4bb3" },
    { id: "bara", price: 50, name: "Bara", prefix: "SKIN_BARA", col: "#b3261e" },
    { id: "samudra", price: 60, name: "Samudra", prefix: "SKIN_SAMUDRA", col: "#1f9aa0" },
    { id: "sakura", price: 75, name: "Sakura", prefix: "SKIN_SAKURA", col: "#f2a2c0" },
    { id: "bintang", price: 90, name: "Malam Bintang", prefix: "SKIN_BINTANG", col: "#1f2f6b" },
    { id: "mentari", price: 105, name: "Mentari", prefix: "SKIN_MENTARI", col: "#f2c230" },
    { id: "peri", price: 120, name: "Peri Jamur", prefix: "SKIN_PERI", col: "#d33b2c" },
    { id: "bayangan", price: 150, name: "Bayangan", prefix: "SKIN_BAYANGAN", col: "#2b3440" }
  ];
  var SKIN_PARTS = ["BASIC", "AIR", "ACTION", "CLIMB", "BOW", "MISC"];
  var COIN_ENEMY = 2;
  var COIN_BOSS = 20;
  var skinById = (id) => SKINS.find((k) => k.id === id) || SKINS[0];

  // ../.dart_tool/skybound_source/game/world.js
  var S = TILE.SOLID;
  var F = TILE.FERTILE;
  var O = TILE.ONEWAY;
  var V = TILE.VINE;
  var X = TILE.THORN;
  var RL = TILE.REAL;
  var MN = TILE.MOON;
  var tiles = new Uint8Array(COLS * ROWS);
  var defs = [];
  var A = 0;
  var top = (a) => (AREA_COUNT - 1 - a) * AREA_ROWS;
  function fill(x0, y0, x1, y1, code) {
    const oy = top(A);
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const gy = oy + y;
        if (x < 0 || x >= COLS || gy < 0 || gy >= ROWS) continue;
        tiles[gy * COLS + x] = code;
      }
  }
  var clear = (x0, y0, x1, y1) => fill(x0, y0, x1, y1, TILE.EMPTY);
  var foot = (tx, ty) => ({ x: (tx + 0.5) * T, y: (top(A) + ty + 1) * T });
  var cen = (tx, ty) => ({ x: (tx + 0.5) * T, y: (top(A) + ty + 0.5) * T });
  var rect = (x0, y0, x1, y1) => ({ x: x0 * T, y: (top(A) + y0) * T, w: (x1 - x0 + 1) * T, h: (y1 - y0 + 1) * T });
  var pt = (tx, ty) => ({ x: tx * T, y: (top(A) + ty) * T });
  var add = (d) => {
    d.area = A;
    defs.push(d);
    return d;
  };
  function shaft(gate, hx, landingRow) {
    let i = 0;
    for (let g = top(A) + landingRow - 3; g > top(A) - 4; g -= 3, i++)
      add({ id: `step_${A}_${i}`, type: "step", gate, x: (i % 2 ? hx + 2 : hx) * T, y: g * T, w: 2 * T });
  }
  A = 0;
  fill(0, 0, 0, 35, S);
  fill(47, 0, 47, 35, S);
  fill(0, 0, 47, 3, S);
  clear(22, 0, 25, 3);
  fill(0, 34, 47, 35, S);
  fill(16, 33, 18, 33, X);
  fill(10, 32, 13, 33, S);
  fill(20, 31, 23, 33, S);
  fill(34, 24, 46, 25, S);
  fill(3, 20, 14, 21, S);
  fill(1, 12, 14, 13, S);
  fill(15, 9, 16, 21, F);
  fill(2, 19, 2, 33, V);
  fill(25, 28, 28, 28, O);
  fill(29, 25, 32, 25, O);
  fill(17, 22, 27, 23, S);
  fill(30, 10, 31, 20, S);
  fill(34, 22, 37, 22, O);
  fill(39, 19, 42, 19, O);
  fill(43, 16, 46, 16, O);
  fill(33, 13, 41, 13, S);
  fill(46, 8, 46, 12, F);
  fill(41, 7, 43, 7, S);
  fill(19, 8, 29, 9, S);
  fill(4, 9, 9, 9, S);
  add({ id: "start", type: "start", ...foot(3, 33) });
  add({ id: "cp1", type: "checkpoint", ...foot(5, 33) });
  add({ id: "cp2", type: "checkpoint", ...foot(19, 21) });
  add({ id: "cp3", type: "checkpoint", ...foot(20, 7) });
  add({ id: "nest1", type: "nest", ...foot(8, 33) });
  add({ id: "bird", type: "npc", npc: "bird", ...foot(12, 31) });
  add({ id: "lumi", type: "npc", npc: "lumi", ...foot(45, 33) });
  add({ id: "spring", type: "spring", ...foot(22, 21) });
  add({ id: "latchL", type: "latch", ...cen(11, 16) });
  add({ id: "latchR", type: "latch", ...cen(32, 18) });
  add({ id: "latchU", type: "latch", ...cen(29, 13) });
  add({ id: "switchR", type: "switch", ...cen(35, 9) });
  add({ id: "gardenL", type: "garden", ...rect(5, 18, 6, 19) });
  add({ id: "gardenR", type: "garden", ...rect(37, 11, 38, 12) });
  add({ id: "gardenU", type: "garden", ...rect(26, 6, 27, 7) });
  add({
    id: "chanL",
    type: "channel",
    garden: "gardenL",
    latch: "latchL",
    before: [pt(22.5, 21.5), pt(16, 21.5), pt(16, 16.5), pt(11.5, 16.5)],
    after: [pt(11.5, 16.5), pt(6, 16.5), pt(6, 18)]
  });
  add({
    id: "chanR",
    type: "channel",
    garden: "gardenR",
    latch: "latchR",
    switchId: "switchR",
    before: [pt(22.5, 21.6), pt(32.5, 21.6), pt(32.5, 18.5)],
    mid: [pt(32.5, 18.5), pt(32.5, 14.5), pt(35.5, 14.5), pt(35.5, 9.5)],
    right: [pt(35.5, 9.5), pt(38, 9.5), pt(38, 11)],
    wrong: [pt(35.5, 9.5), pt(35.5, 5.5), pt(39.5, 5.5)]
  });
  add({
    id: "chanU",
    type: "channel",
    garden: "gardenU",
    latch: "latchU",
    before: [pt(22.6, 21.5), pt(22.6, 18.5), pt(29.5, 18.5), pt(29.5, 13.5)],
    after: [pt(29.5, 13.5), pt(29.5, 10.5), pt(27, 10.5), pt(27, 8)]
  });
  add({ id: "gate1", type: "gate", anim: "root_gate", ...rect(22, 0, 25, 3), opensWith: "gardens" });
  shaft("gate1", 22, 8);
  add({ id: "mush1", type: "mushroom", seq: "mush", order: 2, ...foot(36, 33) });
  add({ id: "mush2", type: "mushroom", seq: "mush", order: 3, ...foot(39, 33) });
  add({ id: "mush3", type: "mushroom", seq: "mush", order: 1, ...foot(42, 33) });
  add({ id: "seedA1a", type: "seed", seqReward: "mush", ...cen(39, 28) });
  add({ id: "seedA1b", type: "seed", ...cen(6, 8) });
  add({ id: "featherA1", type: "feather", ...cen(42, 6) });
  add({ id: "boss1", type: "boss", boss: "moss", ...foot(40, 33), arena: rect(34, 26, 46, 33) });
  add({ id: "e1", type: "enemy", kind: "beetle", ...foot(25, 33) });
  add({ id: "e2", type: "enemy", kind: "slime", ...foot(30, 33) });
  add({ id: "e3", type: "enemy", kind: "beetle", ...foot(35, 21) });
  add({ id: "e4", type: "enemy", kind: "slime", ...foot(38, 12) });
  add({ id: "stump1", type: "stump", ...pt(39.5, 5.5) });
  A = 1;
  fill(0, 0, 0, 35, S);
  fill(47, 0, 47, 35, S);
  fill(0, 0, 47, 3, S);
  clear(34, 0, 37, 3);
  fill(0, 32, 47, 35, S);
  clear(22, 32, 25, 35);
  fill(1, 5, 2, 20, F);
  fill(5, 7, 9, 7, S);
  fill(3, 22, 19, 23, S);
  fill(20, 21, 20, 31, V);
  fill(33, 12, 38, 13, S);
  fill(39, 12, 46, 12, S);
  fill(39, 22, 46, 23, S);
  fill(29, 31, 36, 31, X);
  fill(38, 22, 38, 31, V);
  add({ id: "cp4", type: "checkpoint", ...foot(19, 31) });
  add({ id: "cp5", type: "checkpoint", ...foot(40, 31) });
  add({ id: "cp6", type: "checkpoint", ...foot(35, 11) });
  add({ id: "nest2", type: "nest", ...foot(27, 31) });
  add({ id: "simpul", type: "npc", npc: "simpul", ...foot(5, 31) });
  var liftRow = (w) => top(1) + 21 - 2 * w;
  add({ id: "liftA", type: "lift", basket: "A", x: 21 * T, w: 3 * T, target: 1, baseRow: liftRow(0), post: 24 });
  add({ id: "liftB", type: "lift", basket: "B", x: 25 * T, w: 3 * T, target: 2, baseRow: liftRow(0), post: 28 });
  add({ id: "liftC", type: "lift", basket: "C", x: 29 * T, w: 3 * T, target: 3, baseRow: liftRow(0), post: 32 });
  add({ id: "basketA", type: "basket", basket: "A", ...foot(6, 21) });
  add({ id: "basketB", type: "basket", basket: "B", ...foot(10, 21) });
  add({ id: "basketC", type: "basket", basket: "C", ...foot(14, 21) });
  add({ id: "lever2", type: "lever", action: "emptyBaskets", ...foot(17, 21) });
  add({ id: "fruit1", type: "fruit", weight: 1, ...cen(9, 26), stemTop: (top(1) + 24) * T });
  add({ id: "fruit2", type: "fruit", weight: 2, ...cen(44, 15), stemTop: (top(1) + 13) * T });
  add({ id: "fruit3", type: "fruit", weight: 3, ...cen(43, 26), stemTop: (top(1) + 24) * T });
  add({ id: "leaf1", type: "leaf", x: 31 * T, y: (top(1) + 29) * T, w: 2 * T });
  add({ id: "anchor1", type: "anchor", ...cen(33, 24) });
  add({ id: "anchor2", type: "anchor", ...cen(13, 12) });
  add({ id: "door2", type: "gate", anim: "canopy_door", ...rect(34, 0, 37, 3), opensWith: "lifts" });
  shaft("door2", 34, 12);
  add({ id: "hangnest", type: "hangnest", ...cen(12, 8), stemTop: (top(1) + 4) * T, dropY: (top(1) + 22) * T });
  add({ id: "seedA2a", type: "seed", hidden: "hangnest", ...cen(12, 21) });
  add({ id: "seedA2b", type: "seed", ...cen(44, 31) });
  add({ id: "featherA2", type: "feather", ...cen(7, 6) });
  add({ id: "boss2", type: "boss", boss: "eagle", ...cen(43, 16), arena: rect(39, 13, 46, 21) });
  add({ id: "e5", type: "enemy", kind: "swooper", ...cen(12, 28) });
  add({ id: "e6", type: "enemy", kind: "swooper", ...cen(27, 17) });
  add({ id: "e7", type: "enemy", kind: "sentry", ...foot(46, 31) });
  A = 2;
  fill(0, 0, 0, 35, S);
  fill(47, 0, 47, 35, S);
  fill(0, 0, 47, 1, S);
  clear(40, 0, 43, 1);
  fill(0, 32, 47, 35, S);
  clear(34, 32, 37, 35);
  fill(1, 20, 6, 20, S);
  fill(6, 21, 6, 31, S);
  fill(17, 23, 17, 31, S);
  fill(16, 24, 16, 31, V);
  fill(19, 29, 21, 29, O);
  fill(18, 26, 19, 26, O);
  fill(9, 17, 11, 17, O);
  fill(13, 14, 15, 14, O);
  fill(19, 21, 32, 22, S);
  fill(19, 13, 19, 20, S);
  fill(32, 13, 32, 20, S);
  fill(20, 13, 20, 20, V);
  fill(19, 10, 31, 10, S);
  fill(19, 2, 19, 9, S);
  fill(32, 2, 32, 9, S);
  fill(33, 2, 35, 9, S);
  fill(33, 13, 46, 22, S);
  add({ id: "cp7", type: "checkpoint", ...foot(32, 31) });
  add({ id: "cp8", type: "checkpoint", ...foot(2, 19) });
  add({ id: "cp9", type: "checkpoint", ...foot(34, 12) });
  add({ id: "nest3", type: "nest", ...foot(38, 31) });
  add({ id: "nira", type: "npc", npc: "nira", ...foot(26, 31) });
  add({ id: "mural", type: "mural", ...foot(29, 31) });
  add({ id: "lever3", type: "lever", action: "resetWater", ...foot(31, 31) });
  add({ id: "v1", type: "valve", action: "fillLower", label: "Katup Sumber", ...foot(23, 31) });
  add({ id: "v4", type: "valve", action: "drainLower", label: "Katup Buang", ...foot(20, 31) });
  add({ id: "v2", type: "valve", action: "lowerToMiddle", label: "Katup Hubung", ...foot(4, 19) });
  add({ id: "v3", type: "valve", action: "middleToUpper", label: "Katup Kanal", ...foot(46, 12) });
  add({
    id: "resL",
    type: "reservoir",
    key: "L",
    x: 7 * T,
    w: 10 * T,
    bottom: (top(2) + 32) * T,
    step: 3 * T,
    raft: { x: 7 * T, w: 3 * T }
  });
  add({
    id: "resM",
    type: "reservoir",
    key: "M",
    x: 20 * T,
    w: 12 * T,
    bottom: (top(2) + 21) * T,
    step: 2.5 * T,
    raft: { x: 28 * T, w: 3 * T }
  });
  add({ id: "resU", type: "reservoir", key: "U", x: 20 * T, w: 12 * T, bottom: (top(2) + 10) * T, step: 2 * T });
  add({
    id: "dome",
    type: "gate",
    anim: "water_dome",
    ...rect(40, 0, 43, 3),
    opensWith: "water",
    current: { x: 40 * T, y: (top(3) + 26) * T, w: 4 * T, h: (top(2) + 13 - (top(3) + 26)) * T }
  });
  add({ id: "bub1", type: "bubbleT", seq: "bub", order: 3, ...cen(39, 26) });
  add({ id: "bub2", type: "bubbleT", seq: "bub", order: 1, ...cen(42, 24) });
  add({ id: "bub3", type: "bubbleT", seq: "bub", order: 2, ...cen(45, 27) });
  add({ id: "seedA3a", type: "seed", seqReward: "bub", ...cen(41, 29) });
  add({ id: "seedA3b", type: "seed", ...cen(31, 20) });
  add({ id: "featherA3", type: "feather", ...cen(8, 31) });
  add({ id: "boss3", type: "boss", boss: "crab", ...foot(42, 12), arena: rect(36, 2, 46, 12) });
  add({ id: "e8", type: "enemy", kind: "crab", ...foot(24, 31) });
  add({ id: "e9", type: "enemy", kind: "crab", ...foot(42, 31) });
  add({ id: "e10", type: "enemy", kind: "bubbler", ...foot(46, 31) });
  function frame(exitX, entryX, topRows = 3) {
    fill(0, 0, 0, 35, S);
    fill(47, 0, 47, 35, S);
    fill(0, 0, 47, topRows, S);
    if (exitX !== null) clear(exitX, 0, exitX + 3, topRows);
    fill(0, 32, 47, 35, S);
    clear(entryX, 32, entryX + 3, 35);
  }
  A = 3;
  frame(6, 40);
  fill(37, 28, 38, 28, O);
  fill(45, 28, 46, 28, O);
  fill(30, 29, 33, 29, O);
  fill(25, 26, 28, 26, O);
  fill(20, 23, 23, 23, O);
  fill(16, 20, 19, 20, O);
  fill(11, 17, 14, 17, O);
  fill(15, 14, 23, 15, S);
  fill(16, 11, 18, 11, O);
  fill(3, 8, 14, 9, S);
  fill(37, 13, 46, 13, S);
  fill(35, 23, 37, 23, S);
  fill(27, 18, 27, 22, S);
  fill(46, 18, 46, 22, S);
  fill(2, 17, 6, 17, S);
  add({ id: "cp4a", type: "checkpoint", ...foot(34, 31) });
  add({ id: "cp4b", type: "checkpoint", ...foot(21, 13) });
  add({ id: "cp4c", type: "checkpoint", ...foot(12, 7) });
  add({ id: "nest4", type: "nest", ...foot(4, 31) });
  add({ id: "sora", type: "npc", npc: "sora", ...foot(10, 31) });
  add({ id: "lens4", type: "lens", tx: 24, ty: top(A) + 4, dx: 0, dy: 1, ...cen(24, 4) });
  add({ id: "mirror4a", type: "mirror", tx: 24, ty: top(A) + 14, s0: "/", ...cen(24, 14) });
  add({ id: "mirror4b", type: "mirror", tx: 36, ty: top(A) + 14, s0: "/", lock: "pin4", ...cen(36, 14) });
  add({ id: "pin4", type: "lockpin", ...cen(40, 12) });
  add({ id: "prism4", type: "prism", tx: 36, ty: top(A) + 20, ...cen(36, 20) });
  add({ id: "eye4a", type: "eye", tx: 36, ty: top(A) + 22, ...cen(36, 22) });
  add({ id: "eye4b", type: "eye", tx: 28, ty: top(A) + 20, ...cen(28, 20) });
  add({ id: "eye4c", type: "eye", tx: 45, ty: top(A) + 20, ...cen(45, 20) });
  add({ id: "bridge4", type: "lightbridge", x: 25 * T, y: (top(A) + 14) * T, w: 11 * T, row: top(A) + 14, x0: 25, x1: 35 });
  add({ id: "gate4", type: "gate", anim: "sun_door", ...rect(6, 0, 9, 3), opensWith: "light" });
  shaft("gate4", 6, 8);
  add({ id: "boss4", type: "boss", boss: "mirror", ...foot(38, 31), arena: rect(29, 24, 46, 31) });
  add({ id: "seedA4", type: "seed", ...cen(45, 12) });
  add({ id: "featherA4", type: "feather", ...cen(4, 16) });
  add({ id: "e11", type: "enemy", kind: "mirrorBeetle", ...foot(14, 31) });
  add({ id: "e12", type: "enemy", kind: "prismWisp", ...cen(8, 22) });
  add({ id: "e13", type: "enemy", kind: "prismWisp", ...cen(42, 8) });
  A = 4;
  frame(38, 6);
  fill(14, 29, 18, 29, O);
  fill(20, 26, 24, 26, O);
  fill(26, 23, 31, 24, S);
  fill(33, 20, 37, 20, O);
  fill(40, 17, 45, 18, S);
  fill(38, 15, 39, 15, O);
  fill(8, 19, 14, 20, S);
  fill(10, 12, 37, 13, S);
  fill(38, 9, 44, 10, S);
  fill(1, 11, 5, 11, S);
  add({ id: "cp5a", type: "checkpoint", ...foot(3, 31) });
  add({ id: "cp5b", type: "checkpoint", ...foot(28, 22) });
  add({ id: "cp5c", type: "checkpoint", ...foot(35, 11) });
  add({ id: "nest5", type: "nest", ...foot(44, 31) });
  add({ id: "librarian", type: "npc", npc: "librarian", ...foot(12, 31) });
  add({ id: "bmural1", type: "bellMural", reveals: [1, 2], ...foot(36, 31) });
  add({ id: "bmural2", type: "bellMural", reveals: [3, 4], ...foot(43, 16) });
  add({ id: "bmural3", type: "bellMural", reveals: [5], ...foot(10, 18) });
  [
    [14, 3],
    [19, 1],
    [24, 5],
    [29, 2],
    [34, 4]
  ].forEach(([x, order], i) => add({ id: `bell${i + 1}`, type: "bell", seq: "bell", order, ...cen(x, 7) }));
  add({ id: "crystal5", type: "echoCrystal", bridge: "ebridge5", ...foot(30, 22) });
  add({ id: "ebridge5", type: "echoBridge", x: 15 * T, y: (top(A) + 20) * T, w: 11 * T });
  add({ id: "gate5", type: "gate", anim: "resonance", ...rect(38, 0, 41, 3), opensWith: "bells" });
  shaft("gate5", 38, 9);
  add({ id: "seedA5", type: "seed", ...cen(3, 10) });
  add({ id: "featherA5", type: "feather", ...cen(12, 16) });
  add({ id: "e14", type: "enemy", kind: "inkBlob", ...foot(24, 31) });
  add({ id: "e15", type: "enemy", kind: "echoHunter", ...foot(30, 31) });
  add({ id: "e16", type: "enemy", kind: "echoHunter", ...foot(20, 11) });
  add({ id: "e17", type: "enemy", kind: "inkBlob", ...foot(42, 16) });
  A = 5;
  frame(6, 38);
  fill(16, 31, 30, 31, X);
  fill(15, 23, 15, 31, S);
  fill(4, 28, 11, 28, S);
  fill(2, 28, 3, 28, S);
  fill(10, 22, 11, 22, S);
  fill(16, 22, 23, 22, S);
  fill(12, 13, 17, 13, S);
  fill(3, 8, 30, 9, S);
  fill(27, 29, 29, 29, O);
  fill(24, 26, 26, 26, O);
  fill(27, 23, 29, 23, O);
  fill(33, 29, 36, 29, O);
  fill(38, 26, 41, 26, O);
  fill(42, 23, 45, 23, O);
  fill(37, 20, 40, 20, O);
  fill(33, 17, 36, 17, O);
  fill(37, 14, 40, 14, O);
  fill(32, 11, 34, 11, O);
  add({ id: "cp6a", type: "checkpoint", ...foot(35, 31) });
  add({ id: "cp6b", type: "checkpoint", ...foot(39, 13) });
  add({ id: "cp6c", type: "checkpoint", ...foot(12, 7) });
  add({ id: "nest6", type: "nest", ...foot(46, 31) });
  add({ id: "bayu", type: "npc", npc: "bayu", ...foot(43, 31) });
  add({ id: "fan1", type: "fan", tx: 2, ty: top(A) + 27, dir0: "up", len: 10 });
  add({ id: "fan2", type: "fan", tx: 12, ty: top(A) + 31, dir0: "right", len: 10 });
  add({ id: "fan3", type: "fan", tx: 10, ty: top(A) + 21, dir0: "left", len: 9 });
  add({ id: "fan4", type: "fan", tx: 22, ty: top(A) + 21, dir0: "left", len: 12 });
  add({ id: "fan5", type: "fan", tx: 25, ty: top(A) + 11, dir0: "right", len: 11 });
  add({ id: "way0", type: "waystation", ...foot(9, 27) });
  add({ id: "way1", type: "waystation", ...foot(19, 21) });
  add({ id: "house6", type: "seedHouse", ...foot(14, 12), goal: rect(12, 9, 16, 12) });
  add({ id: "gate6", type: "gate", anim: "storm", ...rect(6, 0, 9, 3), opensWith: "pod" });
  shaft("gate6", 6, 8);
  add({ id: "seedA6", type: "seed", ...cen(3, 31) });
  add({ id: "featherA6", type: "feather", ...cen(12, 19) });
  add({ id: "e18", type: "enemy", kind: "cloudRay", ...cen(30, 16) });
  add({ id: "e19", type: "enemy", kind: "windShooter", ...foot(44, 22) });
  add({ id: "e20", type: "enemy", kind: "cloudRay", ...cen(20, 5) });
  A = 6;
  frame(38, 6);
  fill(14, 29, 17, 29, O);
  fill(20, 27, 22, 27, O);
  fill(2, 24, 19, 25, S);
  fill(19, 13, 19, 23, V);
  fill(20, 14, 30, 15, S);
  fill(33, 22, 45, 23, S);
  fill(33, 16, 45, 16, S);
  fill(27, 29, 29, 29, O);
  fill(29, 26, 31, 26, O);
  fill(30, 23, 31, 23, O);
  fill(29, 19, 31, 19, O);
  fill(31, 13, 32, 13, O);
  fill(33, 10, 34, 10, O);
  fill(36, 8, 46, 9, S);
  add({ id: "cp7a", type: "checkpoint", ...foot(3, 31) });
  add({ id: "cp7b", type: "checkpoint", ...foot(16, 23) });
  add({ id: "cp7c", type: "checkpoint", ...foot(40, 7) });
  add({ id: "nest7", type: "nest", ...foot(44, 31) });
  add({ id: "rara", type: "npc", npc: "rara", ...foot(12, 31) });
  add({ id: "furnace7", type: "furnace", ...foot(24, 31) });
  add({ id: "room1", type: "room", ...rect(2, 19, 11, 23), flower: foot(8, 23) });
  add({ id: "room2", type: "room", ...rect(24, 9, 30, 13), flower: foot(28, 13) });
  add({ id: "room3", type: "room", ...rect(36, 17, 45, 21), flower: foot(39, 21) });
  add({ id: "vent1", type: "vent", rooms: ["room1", "room2"], open0: true, ...foot(4, 23) });
  add({ id: "vent2", type: "vent", rooms: ["room2", "room3"], open0: true, ...foot(26, 13) });
  add({ id: "vent3", type: "vent", rooms: ["room3"], open0: true, ...foot(43, 21) });
  add({ id: "vent4", type: "vent", rooms: ["room1"], open0: true, ...foot(20, 31) });
  add({ id: "bram1", type: "bramble", ...rect(12, 22, 13, 23) });
  add({ id: "bram2", type: "bramble", ...rect(22, 12, 23, 13) });
  add({ id: "bram3", type: "bramble", ...rect(34, 20, 35, 21) });
  add({ id: "gate7", type: "gate", anim: "ember_flower", ...rect(38, 0, 41, 3), opensWith: "heat" });
  shaft("gate7", 38, 8);
  add({ id: "boss7", type: "boss", boss: "stag", ...foot(30, 31), arena: rect(11, 25, 34, 31) });
  add({ id: "seedA7", type: "seed", ...cen(29, 12) });
  add({ id: "featherA7", type: "feather", ...cen(3, 20) });
  add({ id: "e21", type: "enemy", kind: "emberImp", ...foot(37, 31) });
  add({ id: "e22", type: "enemy", kind: "ashBeetle", ...foot(6, 23) });
  add({ id: "e23", type: "enemy", kind: "emberImp", ...foot(27, 13) });
  add({ id: "e24", type: "enemy", kind: "ashBeetle", ...foot(42, 21) });
  A = 7;
  frame(6, 38);
  fill(30, 29, 33, 29, O);
  fill(24, 26, 27, 26, O);
  fill(18, 23, 21, 23, O);
  fill(12, 20, 15, 20, O);
  fill(1, 22, 9, 22, S);
  fill(6, 17, 9, 17, O);
  fill(12, 14, 15, 14, O);
  fill(18, 11, 21, 11, O);
  fill(3, 8, 14, 9, S);
  fill(22, 8, 33, 9, S);
  fill(30, 23, 33, 23, O);
  fill(35, 20, 38, 20, O);
  fill(40, 17, 43, 17, O);
  fill(43, 14, 46, 14, O);
  fill(36, 11, 39, 11, O);
  add({ id: "cp8a", type: "checkpoint", ...foot(34, 31) });
  add({ id: "cp8b", type: "checkpoint", ...foot(25, 7) });
  add({ id: "nest8", type: "nest", ...foot(4, 31) });
  add({ id: "chest8a", type: "chest", item: "seed", ...foot(44, 31) });
  add({ id: "chest8b", type: "chest", item: "feather", ...foot(3, 21) });
  add({ id: "chest8c", type: "chest", item: "seed", ...foot(44, 13) });
  add({ id: "chest8d", type: "chest", item: "both", needs: "shards", ...foot(28, 7) });
  add({ id: "shardStart", type: "shardStart", ...foot(36, 31) });
  [
    [28, 25],
    [20, 22],
    [13, 19],
    [8, 16],
    [14, 13],
    [20, 10],
    [37, 19],
    [41, 16]
  ].forEach(([x, y], i) => add({ id: `shard${i + 1}`, type: "shard", ...cen(x, y) }));
  shaft(null, 6, 8);
  add({ id: "e25", type: "enemy", kind: "crystalCrab", ...foot(20, 31) });
  add({ id: "e26", type: "enemy", kind: "shardFloater", ...cen(10, 26) });
  add({ id: "e27", type: "enemy", kind: "shardFloater", ...cen(38, 8) });
  add({ id: "e28", type: "enemy", kind: "crystalCrab", ...foot(31, 7) });
  A = 8;
  frame(38, 6);
  fill(12, 29, 15, 29, MN);
  fill(14, 26, 16, 26, MN);
  fill(11, 23, 13, 23, MN);
  fill(3, 20, 10, 20, S);
  fill(2, 17, 4, 17, MN);
  fill(12, 17, 14, 17, O);
  fill(16, 14, 18, 14, O);
  fill(21, 14, 23, 14, O);
  fill(26, 14, 34, 15, S);
  fill(35, 12, 36, 12, MN);
  fill(37, 9, 46, 10, S);
  fill(24, 29, 27, 29, RL);
  fill(28, 26, 31, 26, RL);
  fill(34, 23, 36, 23, RL);
  fill(39, 21, 46, 21, S);
  add({ id: "cp9a", type: "checkpoint", ...foot(3, 31) });
  add({ id: "cp9b", type: "checkpoint", ...foot(29, 13) });
  add({ id: "cp9c", type: "checkpoint", ...foot(42, 8) });
  add({ id: "nest9", type: "nest", ...foot(40, 31) });
  add({ id: "hermit", type: "npc", npc: "hermit", ...foot(12, 31) });
  add({ id: "altar9a", type: "altar", ...foot(17, 31) });
  add({ id: "altar9b", type: "altar", ...foot(27, 13) });
  add({ id: "statue1", type: "statue", target: 2, p0: 1, ...foot(22, 31) });
  add({ id: "statue2", type: "statue", target: 0, p0: 1, ...foot(6, 19) });
  add({ id: "statue3", type: "statue", target: 1, p0: 0, ...foot(31, 13) });
  add({ id: "gate9", type: "gate", anim: "moon_door", ...rect(38, 0, 41, 3), opensWith: "moon" });
  shaft("gate9", 38, 9);
  add({ id: "boss9", type: "boss", boss: "shadow", ...foot(32, 13), arena: rect(24, 4, 36, 13) });
  add({ id: "seedA9", type: "seed", ...cen(44, 20) });
  add({ id: "featherA9", type: "feather", ...cen(3, 14) });
  add({ id: "e29", type: "enemy", kind: "moonMoth", ...cen(20, 24) });
  add({ id: "e30", type: "enemy", kind: "shadowArcher", ...foot(45, 31) });
  add({ id: "e31", type: "enemy", kind: "moonMoth", ...cen(42, 5) });
  A = 9;
  frame(6, 38);
  fill(30, 29, 33, 29, O);
  fill(24, 26, 27, 26, O);
  fill(18, 23, 21, 23, O);
  fill(2, 16, 8, 17, S);
  fill(16, 10, 40, 11, S);
  fill(3, 8, 12, 9, S);
  add({ id: "cp10a", type: "checkpoint", ...foot(34, 31) });
  add({ id: "cp10b", type: "checkpoint", ...foot(4, 15) });
  add({ id: "cp10c", type: "checkpoint", ...foot(18, 9) });
  add({ id: "nest10", type: "nest", ...foot(2, 31) });
  add({ id: "tiko", type: "npc", npc: "tiko", ...foot(44, 31) });
  add({ id: "rot1", type: "rotplat", cx: 13 * T, cy: (top(A) + 21) * T, r: 3 * T, speed: 0.75, w: 2 * T });
  add({ id: "rot2", type: "rotplat", cx: 14 * T, cy: (top(A) + 14) * T, r: 2.5 * T, speed: -0.7, w: 2 * T });
  add({ id: "pend1", type: "pendulum", ax: 22 * T, ay: (top(A) + 16) * T, len: 5 * T, amp: 0.95, speed: 1.6 });
  add({ id: "pend2", type: "pendulum", ax: 28 * T, ay: (top(A) + 21) * T, len: 3.5 * T, amp: 1, speed: 2 });
  add({ id: "ring1", type: "ring", ...cen(22, 6), r: 1.7 * T, speed: 1, pin: cen(22, 9) });
  add({ id: "ring2", type: "ring", ...cen(28, 6), r: 1.7 * T, speed: -1.4, pin: cen(28, 9) });
  add({ id: "ring3", type: "ring", ...cen(34, 6), r: 1.7 * T, speed: 1.9, pin: cen(34, 9) });
  add({ id: "core10", type: "core", ...cen(39, 8) });
  add({ id: "gate10", type: "gate", anim: "clock_gate", ...rect(6, 0, 9, 3), opensWith: "gears" });
  shaft("gate10", 6, 8);
  add({ id: "boss10", type: "boss", boss: "golem", ...foot(30, 9), arena: rect(16, 4, 40, 9) });
  add({ id: "seedA10", type: "seed", ...cen(46, 31) });
  add({ id: "featherA10", type: "feather", ...cen(14, 9) });
  add({ id: "e32", type: "enemy", kind: "springBot", ...foot(12, 31) });
  add({ id: "e33", type: "enemy", kind: "gearMouse", ...foot(26, 31) });
  add({ id: "e34", type: "enemy", kind: "gearMouse", ...foot(7, 15) });
  A = 10;
  frame(38, 6);
  fill(16, 29, 19, 29, O);
  fill(21, 26, 24, 26, O);
  fill(15, 23, 18, 23, O);
  fill(9, 20, 12, 20, O);
  fill(2, 20, 7, 21, S);
  fill(13, 17, 16, 17, O);
  fill(2, 17, 4, 17, O);
  fill(19, 14, 22, 14, O);
  fill(24, 15, 36, 16, S);
  fill(39, 14, 46, 15, S);
  fill(29, 12, 31, 12, O);
  fill(34, 9, 46, 10, S);
  fill(40, 29, 42, 29, O);
  fill(43, 26, 45, 26, O);
  add({ id: "cp11a", type: "checkpoint", ...foot(3, 31) });
  add({ id: "cp11b", type: "checkpoint", ...foot(5, 19) });
  add({ id: "cp11c", type: "checkpoint", ...foot(36, 8) });
  add({ id: "nest11", type: "nest", ...foot(14, 31) });
  add({ id: "guntur", type: "npc", npc: "guntur", ...foot(12, 31) });
  add({ id: "totem1", type: "enemy", kind: "totem", ...foot(30, 31) });
  add({ id: "totem2", type: "enemy", kind: "totem", ...foot(4, 19) });
  add({ id: "totem3", type: "enemy", kind: "totem", ...foot(43, 13) });
  add({ id: "gate11", type: "gate", anim: "thunder_seal", ...rect(38, 0, 41, 3), opensWith: "storm" });
  shaft("gate11", 38, 9);
  add({ id: "boss11", type: "boss", boss: "dragon", ...cen(34, 8), arena: rect(24, 3, 46, 14) });
  add({ id: "seedA11", type: "seed", ...cen(3, 15) });
  add({ id: "featherA11", type: "feather", ...cen(44, 24) });
  add({ id: "e35", type: "enemy", kind: "stormHawk", ...cen(20, 10) });
  add({ id: "e36", type: "enemy", kind: "thunderCloud", ...foot(16, 22) });
  add({ id: "e37", type: "enemy", kind: "stormHawk", ...cen(40, 24) });
  A = 11;
  frame(6, 38);
  fill(24, 25, 28, 25, O);
  fill(18, 19, 22, 19, O);
  fill(24, 13, 32, 13, O);
  fill(3, 8, 30, 9, S);
  add({ id: "cp12a", type: "checkpoint", ...foot(34, 31) });
  add({ id: "cp12b", type: "checkpoint", ...foot(28, 12) });
  add({ id: "cp12c", type: "checkpoint", ...foot(12, 7) });
  add({ id: "nest12", type: "nest", ...foot(3, 31) });
  add({ id: "mush12a", type: "mushroom", always: true, ...foot(30, 31) });
  add({ id: "mush12b", type: "mushroom", always: true, ...foot(26, 24) });
  add({ id: "mush12c", type: "mushroom", always: true, ...foot(21, 18) });
  add({ id: "mush12d", type: "mushroom", always: true, ...foot(31, 12) });
  add({ id: "chest12a", type: "chest", item: "feather", ...foot(19, 18) });
  add({ id: "chest12b", type: "chest", item: "seed", ...foot(45, 31) });
  add({ id: "chest12c", type: "chest", item: "seed", ...foot(27, 7) });
  add({ id: "chest12d", type: "chest", item: "seed", needs: "spore", ...foot(37, 31) });
  [
    [12, 28, 2],
    [18, 22, 4],
    [34, 20, 1],
    [42, 26, 3]
  ].forEach(([x, y, order], i) => add({ id: `lamp${i + 1}`, type: "sporeLamp", seq: "spore", order, ...cen(x, y) }));
  shaft(null, 6, 8);
  add({ id: "e38", type: "enemy", kind: "sporePuff", ...foot(12, 31) });
  add({ id: "e39", type: "enemy", kind: "mushroomKnight", ...foot(20, 31) });
  add({ id: "e40", type: "enemy", kind: "mushroomKnight", ...foot(20, 7) });
  A = 12;
  frame(null, 6, 1);
  fill(12, 29, 15, 29, O);
  fill(16, 26, 19, 26, O);
  fill(22, 23, 25, 23, O);
  fill(26, 20, 29, 20, O);
  fill(20, 17, 23, 17, O);
  fill(22, 14, 25, 14, O);
  fill(15, 2, 15, 10, S);
  fill(32, 2, 32, 10, S);
  fill(15, 11, 32, 12, S);
  clear(22, 11, 25, 12);
  fill(34, 17, 37, 17, O);
  fill(42, 15, 46, 15, S);
  add({ id: "cp13a", type: "checkpoint", ...foot(3, 31) });
  add({ id: "cp13b", type: "checkpoint", ...foot(24, 13) });
  add({ id: "cp13c", type: "checkpoint", ...foot(18, 10) });
  add({ id: "nest13", type: "nest", ...foot(40, 31) });
  add({ id: "spirit", type: "npc", npc: "spirit", ...foot(12, 31) });
  [
    ["star1", 5, 22, 2],
    ["star2", 17, 30, 3],
    ["star3", 33, 27, 2],
    ["star4", 41, 20, 2],
    ["star5", 30, 15, 3],
    ["star6", 11, 14, 2]
  ].forEach(([id, x, y, need]) => add({ id, type: "starNode", need, ...cen(x, y) }));
  add({ id: "gate13", type: "gate", anim: "heart_shell", ...rect(22, 9, 25, 12), opensWith: "stars" });
  add({ id: "boss13", type: "boss", boss: "crown", ...cen(24, 5), arena: rect(16, 2, 31, 10), final: true });
  add({ id: "seedA13", type: "seed", ...cen(44, 14) });
  add({ id: "featherA13", type: "feather", ...cen(24, 21) });
  add({ id: "e41", type: "enemy", kind: "starKnight", ...foot(30, 31) });
  add({ id: "e42", type: "enemy", kind: "starWisp", ...cen(36, 22) });
  add({ id: "e43", type: "enemy", kind: "starKnight", ...foot(20, 31) });
  var STAR_EDGES = [
    ["star1", "star2"],
    ["star2", "star3"],
    ["star3", "star4"],
    ["star4", "star5"],
    ["star5", "star6"],
    ["star6", "star1"],
    ["star2", "star5"],
    ["star1", "star5"],
    ["star3", "star5"],
    ["star2", "star6"]
  ];
  var STAR_BLOCKED = [
    ["star1", "star3"],
    ["star4", "star6"]
  ];
  var WATER_TARGET = { L: 1, M: 2, U: 1 };
  var byId = Object.fromEntries(defs.map((d) => [d.id, d]));
  var ofType = (type) => defs.filter((d) => d.type === type);
  var block = new Uint8Array(COLS * ROWS);
  function markRect(r) {
    const x0 = Math.round(r.x / T);
    const y0 = Math.round(r.y / T);
    for (let y = y0; y < y0 + Math.round(r.h / T); y++) for (let x = x0; x < x0 + Math.round(r.w / T); x++) block[y * COLS + x] = 1;
  }
  function setBlocks(pr) {
    block.fill(0);
    for (const g of ofType("gate")) if (!pr.gates[g.id]) markRect(g);
    for (const b2 of ofType("bramble")) if (!pr.burned?.[b2.id]) markRect(b2);
  }
  var side = 0;
  var setSide = (v) => {
    side = v ? 1 : 0;
  };
  var getSide = () => side;
  function tileAt(tx, ty) {
    if (tx < 0 || tx >= COLS || ty >= ROWS) return TILE.SOLID;
    if (ty < 0) return TILE.EMPTY;
    return tiles[ty * COLS + tx];
  }
  function isOneWayTile(t) {
    return t === TILE.ONEWAY || t === TILE.REAL && side === 0 || t === TILE.MOON && side === 1;
  }
  function isSolid(tx, ty) {
    if (tx < 0 || tx >= COLS || ty >= ROWS) return true;
    if (ty < 0) return false;
    const t = tiles[ty * COLS + tx];
    return t === TILE.SOLID || t === TILE.FERTILE || block[ty * COLS + tx] === 1;
  }
  var isSolidAt = (x, y) => isSolid(Math.floor(x / T), Math.floor(y / T));

  // ../.dart_tool/skybound_source/game/sprites.js
  var CORE_KEYS = [
    "PROPS_A",
    "PROPS_B",
    "PROPS_C",
    "PROPS_D",
    "PROPS_E",
    "FX_A",
    "FX_B",
    "FX_C",
    "MECHANISMS",
    "GATES_B",
    "GATES_C",
    "NPCS",
    "NPCS_B",
    "NPCS_C",
    ...SKIN_PARTS.map((p) => `AERA_${p}`)
  ];
  var AREA_BOSS = { 0: ["BOSS_MOSS"], 1: ["BOSS_EAGLE"], 2: ["BOSS_CRAB"], 3: ["BOSS_MIRROR"], 6: ["BOSS_STAG"], 9: ["BOSS_GOLEM"], 10: ["BOSS_DRAGON"], 12: ["BOSS_CROWN"] };
  function areaKeys(a) {
    if (a < 0 || a >= AREA_COUNT) return [];
    const n = a + 1;
    const keys = [`BG_A${n}`, `TEX_A${n}`, `ENEMIES_A${n}`, ...AREA_BOSS[a] || []];
    if (a === 8) keys.push(...SKIN_PARTS.map((p) => `SKIN_BAYANGAN_${p}`));
    return keys;
  }
  var skinKeys = (id) => {
    const s = SKINS.find((k) => k.id === id) || SKINS[0];
    return SKIN_PARTS.map((p) => `${s.prefix}_${p}`);
  };
  function createSpriteStore() {
    return globalThis.__bridge.spriteStore;
  }
  function drawFrame(ctx, img, frame2, x, y, scale, flip = false) {
    if (!img || !frame2) return;
    const c = frame2.full || frame2.content || frame2.source;
    const sx = Math.max(0, c.x);
    const sy = Math.max(0, c.y);
    const sw = Math.min(img.width - sx, c.w - (sx - c.x));
    const sh = Math.min(img.height - sy, c.h - (sy - c.y));
    if (sw <= 0 || sh <= 0) return;
    const ax = (frame2.anchor?.x ?? c.x + c.w / 2) - sx;
    const ay = (frame2.anchor?.y ?? c.y + c.h) - sy;
    if (flip) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, sw, sh, -ax * scale, -ay * scale, sw * scale, sh * scale);
      ctx.restore();
    } else {
      ctx.drawImage(img, sx, sy, sw, sh, x - ax * scale, y - ay * scale, sw * scale, sh * scale);
    }
  }
  function drawContained(ctx, img, frame2, cx, bottom, boxW, boxH, flip = false) {
    if (!img || !frame2) return;
    const c = frame2.content || frame2.source;
    const s = Math.min(boxW / c.w, boxH / c.h);
    const w = c.w * s;
    const h = c.h * s;
    if (flip) {
      ctx.save();
      ctx.translate(cx, bottom);
      ctx.scale(-1, 1);
      ctx.drawImage(img, c.x, c.y, c.w, c.h, -w / 2, -h, w, h);
      ctx.restore();
    } else ctx.drawImage(img, c.x, c.y, c.w, c.h, cx - w / 2, bottom - h, w, h);
  }
  function drawCentered(ctx, img, frame2, cx, cy, h, rot = 0, flip = false) {
    if (!img || !frame2) return;
    const c = frame2.content || frame2.source;
    const s = h / c.h;
    ctx.save();
    ctx.translate(cx, cy);
    if (rot) ctx.rotate(rot);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, c.x, c.y, c.w, c.h, -c.w * s / 2, -c.h * s / 2, c.w * s, c.h * s);
    ctx.restore();
  }

  // ../.dart_tool/skybound_source/adapters.js
  function createInput() {
    const i = { keys: {}, stickX: 0, stickY: 0, jumpHeld: false, aim: { active: false, source: null, dx: 0, dy: 0, mx: 0, my: 0 }, actions: [], touchUsed: true };
    i.axisX = () => (i.keys.right ? 1 : 0) - (i.keys.left ? 1 : 0) || i.stickX;
    i.axisY = () => (i.keys.down ? 1 : 0) - (i.keys.up ? 1 : 0) || i.stickY;
    i.consume = () => {
      for (const k of ["jumpPressed", "dashPressed", "interactPressed", "cyclePressed", "pausePressed", "advancePressed", "fireReleased"]) i[k] = false;
    };
    i.destroy = () => {
    };
    i.consume();
    globalThis.__bridge.input = i;
    return i;
  }
  function createAudio() {
    const b2 = globalThis.__bridge;
    return { init() {
    }, unlock() {
    }, destroy() {
    }, play(name) {
      if (!b2.sounds.includes(name)) b2.sounds.push(name);
    }, setTrack(i) {
      b2.track = i;
    }, setPaused(v) {
      b2.audioPaused = v;
    }, setLocal(v) {
      b2.settings = v;
    } };
  }
  function element() {
    const cache = {}, events = {}, classes = /* @__PURE__ */ new Set();
    return {
      style: { setProperty() {
      } },
      dataset: {},
      textContent: "",
      innerHTML: "",
      children: [],
      hidden: false,
      classList: { add: (k) => classes.add(k), remove: (k) => classes.delete(k), contains: (k) => classes.has(k), toggle(k, v) {
        if (v) classes.add(k);
        else classes.delete(k);
      } },
      querySelector(s) {
        return cache[s] ?? (cache[s] = element());
      },
      querySelectorAll() {
        return [];
      },
      addEventListener(k, f) {
        events[k] = f;
      },
      removeEventListener() {
      },
      dispatch(k) {
        events[k]?.({ currentTarget: this, preventDefault() {
        } });
      },
      appendChild(e) {
        this.children.push(e);
      },
      replaceChildren() {
        this.children = [];
      },
      getBoundingClientRect() {
        const b2 = globalThis.__bridge;
        return { left: 0, top: 0, width: b2.width, height: b2.height, right: b2.width, bottom: b2.height };
      },
      getContext() {
        return globalThis.__bridge.context;
      }
    };
  }
  function createHud() {
    const b2 = globalThis.__bridge, root = element();
    const el = new Proxy({ root }, { get(t, k) {
      return t[k] ?? (t[k] = element());
    } });
    let menu;
    const hud = { root, el, setLoading() {
    }, drawMap() {
      return true;
    }, sync(s, info) {
      b2.info = info;
      if (menu !== s.ui.menu) {
        menu = s.ui.menu;
        if (menu === "pause") info.onPauseOpen();
        if (menu === "travel") info.onTravelOpen();
        if (menu === "ending") info.onEndingOpen();
      }
    } };
    b2.hud = hud;
    return hud;
  }

  // ../.dart_tool/skybound_source/game/physics.js
  var EPS = 0.01;
  function overlapsSolid(x, y, w, h) {
    const x0 = Math.floor((x - w / 2) / T);
    const x1 = Math.floor((x + w / 2 - EPS) / T);
    const y0 = Math.floor((y - h) / T);
    const y1 = Math.floor((y - EPS) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isSolid(tx, ty)) return true;
    return false;
  }
  function touchesTile(x, y, w, h, code) {
    const x0 = Math.floor((x - w / 2) / T);
    const x1 = Math.floor((x + w / 2 - EPS) / T);
    const y0 = Math.floor((y - h) / T);
    const y1 = Math.floor((y - EPS) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tileAt(tx, ty) === code) return true;
    return false;
  }
  function moveBody(b2, dx, dy, plats = [], dropThrough = false) {
    const res = { ground: false, ceiling: false, wallL: false, wallR: false, plat: null };
    const stepsX = Math.max(1, Math.ceil(Math.abs(dx) / (T / 2)));
    for (let i = 0; i < stepsX; i++) {
      const nx = b2.x + dx / stepsX;
      if (overlapsSolid(nx, b2.y, b2.w, b2.h)) {
        if (dx > 0) {
          const edge = Math.floor((nx + b2.w / 2 - EPS) / T) * T;
          b2.x = edge - b2.w / 2 - EPS;
          res.wallR = true;
        } else {
          const edge = (Math.floor((nx - b2.w / 2) / T) + 1) * T;
          b2.x = edge + b2.w / 2 + EPS;
          res.wallL = true;
        }
        b2.vx = 0;
        break;
      }
      b2.x = nx;
    }
    const prevBottom = b2.y;
    const stepsY = Math.max(1, Math.ceil(Math.abs(dy) / (T / 2)));
    for (let i = 0; i < stepsY; i++) {
      const ny = b2.y + dy / stepsY;
      if (dy > 0) {
        if (overlapsSolid(b2.x, ny, b2.w, b2.h)) {
          b2.y = Math.floor((ny - EPS) / T) * T;
          b2.vy = 0;
          res.ground = true;
          break;
        }
        if (!dropThrough) {
          const row = Math.floor((ny - EPS) / T);
          const surf = row * T;
          if (prevBottom <= surf + 1 && ny >= surf) {
            const x0 = Math.floor((b2.x - b2.w / 2) / T);
            const x1 = Math.floor((b2.x + b2.w / 2 - EPS) / T);
            let hit = false;
            for (let tx = x0; tx <= x1; tx++) if (isOneWayTile(tileAt(tx, row))) hit = true;
            if (hit) {
              b2.y = surf;
              b2.vy = 0;
              res.ground = true;
              break;
            }
          }
          let landed = null;
          for (const p of plats) {
            if (b2.x + b2.w / 2 <= p.x || b2.x - b2.w / 2 >= p.x + p.w) continue;
            if (prevBottom <= p.top + 2 && ny >= p.top) {
              if (!landed || p.top < landed.top) landed = p;
            }
          }
          if (landed) {
            b2.y = landed.top;
            b2.vy = 0;
            res.ground = true;
            res.plat = landed.id;
            break;
          }
        }
        b2.y = ny;
      } else {
        if (overlapsSolid(b2.x, ny, b2.w, b2.h)) {
          b2.y = (Math.floor((ny - b2.h) / T) + 1) * T + b2.h + EPS;
          b2.vy = 0;
          res.ceiling = true;
          break;
        }
        b2.y = ny;
      }
    }
    return res;
  }
  function groundProbe(b2, plats = []) {
    if (overlapsSolid(b2.x, b2.y + 1, b2.w, b2.h)) return { ground: true, plat: null };
    const row = Math.floor((b2.y + 0.5) / T);
    if (Math.abs(b2.y - row * T) < 1.5) {
      const x0 = Math.floor((b2.x - b2.w / 2) / T);
      const x1 = Math.floor((b2.x + b2.w / 2 - EPS) / T);
      for (let tx = x0; tx <= x1; tx++) if (isOneWayTile(tileAt(tx, row))) return { ground: true, plat: null };
    }
    for (const p of plats) {
      if (b2.x + b2.w / 2 <= p.x || b2.x - b2.w / 2 >= p.x + p.w) continue;
      if (Math.abs(b2.y - p.top) < 2) return { ground: true, plat: p.id };
    }
    return { ground: false, plat: null };
  }

  // ../.dart_tool/skybound_source/game/combat.js
  var ARROW_G = 320;
  var ARROW_TRAIL = 13;
  var hop = (sheet, o = {}) => ({ sheet, move: "slime", attack: "slime_attack", ai: "slime", w: 26, h: 22, hp: 2, vis: 30, ...o });
  var walk = (sheet, o = {}) => ({ sheet, move: "beetle", attack: "beetle_attack", ai: "beetle", w: 30, h: 22, hp: 3, vis: 28, ...o });
  var dive = (sheet, o = {}) => ({ sheet, move: "swooper", attack: "swooper_dive", ai: "swooper", w: 30, h: 24, hp: 2, vis: 42, fly: true, ...o });
  var turret = (sheet, o = {}) => ({ sheet, move: "sentry", attack: "sentry_shoot", ai: "sentry", w: 28, h: 40, hp: 3, vis: 48, ...o });
  var shield = (sheet, o = {}) => ({ sheet, move: "crab", attack: "crab_attack", ai: "crab", w: 36, h: 26, hp: 3, vis: 38, ...o });
  var floater = (sheet, o = {}) => ({ sheet, move: "bubbler", attack: "bubbler_shoot", ai: "bubbler", w: 28, h: 26, hp: 2, vis: 36, fly: true, shot: "orb", ...o });
  var ENEMY = {
    slime: { sheet: "ENEMIES_A1", move: "slime", attack: "slime_attack", w: 26, h: 22, hp: 2, vis: 30 },
    slimeSmall: { sheet: "ENEMIES_A1", move: "slime", attack: "slime_attack", w: 16, h: 14, hp: 1, vis: 19 },
    beetle: { sheet: "ENEMIES_A1", move: "beetle", attack: "beetle_attack", w: 30, h: 20, hp: 3, vis: 26 },
    swooper: { sheet: "ENEMIES_A2", move: "swooper", attack: "swooper_dive", w: 28, h: 24, hp: 2, vis: 40, fly: true },
    sentry: { sheet: "ENEMIES_A2", move: "sentry", attack: "sentry_shoot", w: 26, h: 40, hp: 3, vis: 50 },
    crab: { sheet: "ENEMIES_A3", move: "crab", attack: "crab_attack", w: 36, h: 26, hp: 3, vis: 38 },
    bubbler: { sheet: "ENEMIES_A3", move: "bubbler", attack: "bubbler_shoot", w: 28, h: 24, hp: 2, vis: 34 },
    mirrorBeetle: shield("ENEMIES_A4", { hp: 4, vis: 40 }),
    prismWisp: floater("ENEMIES_A4"),
    inkBlob: hop("ENEMIES_A5"),
    echoHunter: walk("ENEMIES_A5", { hp: 3, vis: 32, fast: 1.3 }),
    cloudRay: dive("ENEMIES_A6", { vis: 46 }),
    windShooter: turret("ENEMIES_A6", { shot: "orb", vis: 44 }),
    emberImp: hop("ENEMIES_A7", { hp: 2 }),
    ashBeetle: walk("ENEMIES_A7", { hp: 4, vis: 32 }),
    crystalCrab: shield("ENEMIES_A8", { hp: 4 }),
    shardFloater: floater("ENEMIES_A8"),
    moonMoth: dive("ENEMIES_A9"),
    shadowArcher: turret("ENEMIES_A9", { shot: "darrow" }),
    springBot: hop("ENEMIES_A10", { hp: 3 }),
    gearMouse: walk("ENEMIES_A10", { hp: 2, fast: 1.6, vis: 26 }),
    stormHawk: dive("ENEMIES_A11", { hp: 3 }),
    thunderCloud: turret("ENEMIES_A11", { shot: "spark", vis: 44 }),
    sporePuff: hop("ENEMIES_A12"),
    mushroomKnight: walk("ENEMIES_A12", { hp: 4, vis: 34 }),
    starKnight: shield("ENEMIES_A13", { hp: 5, vis: 42 }),
    starWisp: floater("ENEMIES_A13", { hp: 3 }),
    // Storm totems (Area 11) are scenery that fights back; destroyed ones stay down.
    totem: { sheet: "PROPS_E", ai: "totem", w: 30, h: 70, hp: 4, vis: 78, still: true }
  };
  var BOSS = {
    moss: { sheet: "BOSS_MOSS", name: "Induk Lumut", w: 96, h: 66, hp: 14, vis: 100 },
    eagle: { sheet: "BOSS_EAGLE", name: "Elang Ranting", w: 70, h: 54, hp: 14, vis: 112, fly: true },
    crab: { sheet: "BOSS_CRAB", name: "Penjaga Kanal", w: 104, h: 70, hp: 18, vis: 112 },
    mirror: { sheet: "BOSS_MIRROR", name: "Raja Kumbang Cermin", w: 104, h: 72, hp: 20, vis: 114, ai: "crab" },
    stag: { sheet: "BOSS_STAG", name: "Rusa Bara", w: 92, h: 76, hp: 22, vis: 116, ai: "stag" },
    shadow: { sheet: "SKIN_BAYANGAN", name: "Bayangan Aera", w: 22, h: 44, hp: 16, vis: 60, ai: "shadow" },
    golem: { sheet: "BOSS_GOLEM", name: "Golem Jam", w: 100, h: 84, hp: 24, vis: 124, ai: "crab" },
    dragon: { sheet: "BOSS_DRAGON", name: "Naga Awan", w: 84, h: 60, hp: 22, vis: 124, fly: true, ai: "eagle" },
    crown: { sheet: "BOSS_CROWN", name: "Penjaga Mahkota", w: 84, h: 66, hp: 36, vis: 134, fly: true, ai: "final" }
  };
  var bossAi = (kind) => BOSS[kind].ai || kind;
  function makeEnemy(G, kind, x, y, id) {
    const k = ENEMY[kind];
    return {
      id,
      kind,
      x,
      y: k.fly ? y + k.h / 2 : y,
      vx: 0,
      vy: 0,
      w: k.w,
      h: k.h,
      hp: k.hp,
      face: -1,
      state: "idle",
      t: 0.5 + G.rand() * 1.2,
      alive: true,
      hx: x,
      hy: k.fly ? y + k.h / 2 : y,
      flash: 0,
      animT: G.rand() * 2,
      ph: G.rand() * 6,
      onGround: false,
      jumps: 0
    };
  }
  function spawnEnemies(G) {
    const s = G.s;
    s.enemies = ofType("enemy").filter((d) => !(d.kind === "totem" && s.pr.got[d.id])).map((d) => makeEnemy(G, d.kind, d.x, d.y, d.id));
    s.bosses = {};
    for (const d of ofType("boss")) {
      if (s.pr.bosses[d.id]) continue;
      const k = BOSS[d.boss];
      s.bosses[d.id] = {
        id: d.id,
        kind: d.boss,
        x: d.x,
        y: k.fly ? d.y + k.h / 2 : d.y,
        vx: 0,
        vy: 0,
        w: k.w,
        h: k.h,
        hp: k.hp,
        max: k.hp,
        face: -1,
        state: "idle",
        t: 1.2,
        active: false,
        flash: 0,
        animT: 0,
        cycle: 0,
        onGround: !k.fly
      };
    }
  }
  function updateAim(G, dt) {
    const { s, inp } = G;
    const p = s.player;
    const canAim = (p.mode === "normal" || p.mode === "rope") && !G.inputLocked();
    const wants = inp.aim.active && canAim;
    if (wants) {
      if (p.carry) G.dropCarry();
      if (!p.aiming) {
        p.aiming = true;
        p.drawT = 0;
        p.animT = 0;
      }
      p.drawT += dt;
      const d = aimDir(G);
      p.aimX = d.x;
      p.aimY = d.y;
      if (Math.abs(d.x) > 0.15) p.face = d.x > 0 ? 1 : -1;
    } else if (p.aiming) {
      fireArrow(G);
      p.aiming = false;
    } else if (inp.fireReleased && canAim) {
      const d = aimDir(G);
      p.aimX = d.x;
      p.aimY = d.y;
      p.drawT = 0.1;
      fireArrow(G);
    }
    const wasFocused = s.slowmo;
    s.slowmo = p.aiming && !p.onGround && p.mode === "normal" && p.focus > 0;
    if (s.slowmo && !wasFocused) G.sfx("focus");
    if (s.slowmo) p.focus = Math.max(0, p.focus - dt);
    else if (p.onGround) p.focus = Math.min(p.focusMax, p.focus + dt * 0.7);
    p.energy = Math.min(100, p.energy + G.tw.energyRegen * dt);
    if (!G.inputLocked() && inp.cyclePressed) cycleArrow(G);
  }
  function cycleArrow(G) {
    const p = G.s.player;
    const types = ARROW_TYPES.filter((t) => t === "normal" || G.s.pr.abilities[t]);
    if (types.length === 1) {
      G.toast("Busurmu baru punya panah biasa.");
      G.sfx("deny");
      return;
    }
    p.arrowType = types[(types.indexOf(p.arrowType) + 1) % types.length];
    G.toast(ARROW_NAME[p.arrowType]);
    G.sfx("click");
  }
  function bowOrigin(p) {
    return { x: p.x + p.face * 12, y: p.y - (p.onGround ? 34 : 32) };
  }
  function aimDir(G) {
    const { s, inp } = G;
    const p = s.player;
    const o = bowOrigin(p);
    let dx;
    let dy;
    const a = inp.aim;
    if (a.source === "mouse") {
      const w = G.screenToWorld(a.mx, a.my);
      dx = w.x - o.x;
      dy = w.y - o.y;
    } else if (a.source === "button") {
      dx = a.dx;
      dy = a.dy;
      if (Math.hypot(dx, dy) < 18) {
        dx = p.face;
        dy = 0;
      }
    } else {
      dx = inp.axisX();
      dy = inp.axisY();
      if (!dx && !dy) dx = p.face;
    }
    let len = Math.hypot(dx, dy) || 1;
    let x = dx / len;
    let y = dy / len;
    let best = null;
    let bestD = Infinity;
    if (G.tw.aimAssist > 0) {
      for (const t of G.aimTargets()) {
        const d = Math.hypot(t.x - o.x, t.y - o.y);
        if (d < 30 || d > 620 || d >= bestD) continue;
        bestD = d;
        best = t;
      }
    }
    if (best) {
      const d = Math.hypot(best.x - o.x, best.y - o.y);
      const tt = d / G.tw.arrowSpeed;
      const tx = best.x - o.x;
      const ty = best.y - o.y - 0.5 * ARROW_G * tt * tt;
      len = Math.hypot(tx, ty) || 1;
      x = tx / len;
      y = ty / len;
    }
    return { x, y };
  }
  function fireArrow(G) {
    const { s } = G;
    const p = s.player;
    let type = p.arrowType;
    const cost = ARROW_COST[type];
    if (cost > 0) {
      if (p.energy < cost) {
        G.toast("Energi panah kurang \u2014 panah biasa dilepas.");
        type = "normal";
      } else p.energy -= cost;
    }
    const pow = 0.72 + 0.28 * Math.min(1, p.drawT / 0.3);
    const sp = G.tw.arrowSpeed * pow;
    const o = bowOrigin(p);
    s.arrows.push({
      id: G.uid("a"),
      type,
      x: o.x,
      y: o.y,
      vx: p.aimX * sp,
      vy: p.aimY * sp,
      stuck: false,
      life: 2.4,
      t: 0,
      emit: 0,
      seed: G.rand() * 6.283,
      trail: [{ x: o.x, y: o.y }]
    });
    p.releaseT = 0.24;
    p.animT = 0;
    s.lastShot = { x: p.aimX, y: p.aimY, t: s.time };
    s.release = { x: o.x, y: o.y, ang: Math.atan2(p.aimY, p.aimX), type, pow, t: 0, dur: 0.22 };
    releaseBurst(G, type, o, p.aimX, p.aimY, pow);
    G.sfx("bow");
  }
  function releaseBurst(G, type, o, dx, dy, pow) {
    const col = ARROW_COLOR[type];
    const n = type === "normal" ? 4 : 7;
    for (let i = 0; i < n; i++) {
      const a = (G.rand() - 0.5) * 1.6;
      const sp = 70 + G.rand() * 170 * pow;
      const cs = Math.cos(a);
      const sn = Math.sin(a);
      G.particle(o.x, o.y, (dx * cs - dy * sn) * sp, (dx * sn + dy * cs) * sp, i % 3 ? col : "#fffbe6", 1.4 + G.rand() * 1.8, 0.18 + G.rand() * 0.24);
    }
    if (type === "ember") G.shake(2);
    else if (type === "echo") G.fx("FX_C", FXC.spark, o.x, o.y, 0.3, 32);
    else if (type === "wind") G.fx("FX_C", FXC.wind, o.x, o.y, 0.3, 34);
  }
  var IMPACT = {
    sprout: ["FX_A", "sprout_grow", 0.45, 36],
    thread: ["FX_B", "thread_attach", 0.36, 34],
    echo: ["FX_C", FXC.spark, 0.4, 44],
    wind: ["FX_C", FXC.wind, 0.4, 46],
    ember: ["FX_C", FXC.fire, 0.45, 48]
  };
  function arrowImpact(G, type, x, y) {
    const shape = IMPACT[type];
    if (shape) G.fx(shape[0], shape[1], x, y, shape[2], shape[3]);
    const col = ARROW_COLOR[type];
    const n = type === "normal" ? 5 : 10;
    for (let i = 0; i < n; i++) {
      const a = G.rand() * Math.PI * 2;
      const sp = 40 + G.rand() * (type === "ember" ? 220 : 150);
      G.particle(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 40, i % 4 ? col : "#fffdf0", 1.3 + G.rand() * 2, 0.2 + G.rand() * 0.3);
    }
    if (type === "ember") G.shake(3);
    else if (type === "echo") G.shake(1.5);
  }
  function emitTrail(G, a) {
    const col = ARROW_COLOR[a.type];
    const sp = Math.hypot(a.vx, a.vy) || 1;
    const nx = -a.vy / sp;
    const ny = a.vx / sp;
    const side2 = (G.rand() - 0.5) * 2;
    switch (a.type) {
      case "sprout":
        G.particle(a.x, a.y, nx * 40 * side2 - a.vx * 0.08, ny * 40 * side2 - a.vy * 0.08, col, 1.6, 0.34);
        break;
      case "ember":
        for (let i = 0; i < 2; i++) G.particle(a.x, a.y, nx * 30 * side2 - a.vx * 0.1, -40 - G.rand() * 60, i ? "#ffd27a" : col, 1.5 + G.rand(), 0.3);
        break;
      case "wind":
        G.particle(a.x, a.y, nx * 70 * side2, ny * 70 * side2, col, 1.4, 0.26);
        break;
      case "thread":
        G.particle(a.x, a.y, nx * 20 * side2, ny * 20 * side2, "#ffffff", 1.1, 0.28);
        break;
      case "echo":
        G.particle(a.x, a.y, -a.vx * 0.1, -a.vy * 0.1, col, 1.8, 0.3);
        break;
      default:
        if (G.rand() < 0.5) G.particle(a.x, a.y, nx * 18 * side2, ny * 18 * side2, col, 1, 0.18);
    }
  }
  function updateArrows(G, dt) {
    const { s } = G;
    for (const a of s.arrows) {
      if (a.stuck) {
        a.life -= dt;
        if (a.life <= 0) a.dead = true;
        continue;
      }
      const steps = 3;
      for (let i = 0; i < steps; i++) {
        a.vy += ARROW_G * dt / steps;
        a.x += a.vx * dt / steps;
        a.y += a.vy * dt / steps;
        const sp = Math.hypot(a.vx, a.vy) || 1;
        const tx = a.x + a.vx / sp * 16;
        const ty = a.y + a.vy / sp * 16;
        if (hitCreatures(G, a, tx, ty)) {
          a.dead = true;
          break;
        }
        if (G.puzzleArrowHit(a, tx, ty)) {
          a.dead = true;
          break;
        }
        if (isSolidAt(tx, ty)) {
          onTerrain(G, a, tx, ty);
          break;
        }
      }
      a.life -= dt;
      a.t += dt;
      a.trail.push({ x: a.x, y: a.y });
      if (a.trail.length > ARROW_TRAIL) a.trail.shift();
      a.emit -= dt;
      if (a.emit <= 0) {
        a.emit = 0.05;
        emitTrail(G, a);
      }
      if (a.life <= 0 || a.y > WORLD_H || a.x < 0 || a.x > WORLD_W) a.dead = true;
    }
    s.arrows = s.arrows.filter((a) => !a.dead);
  }
  function onTerrain(G, a, tx, ty) {
    const ctx = Math.floor(tx / T);
    const cty = Math.floor(ty / T);
    const tile = tileAt(ctx, cty);
    if (a.type === "sprout" && tile === TILE.FERTILE) {
      if (G.growSprout(ctx, cty, a)) {
        a.dead = true;
        return;
      }
    }
    a.stuck = true;
    a.life = 1.4;
    G.fx("FX_A", "arrow_hit", tx, ty + 10, 0.3, 26);
    arrowImpact(G, a.type, tx, ty);
    G.sfx("hit");
    if (a.type === "sprout" && tile !== TILE.FERTILE) G.toast("Panah Tunas hanya tumbuh di akar subur yang hijau.", 1.6);
  }
  function inRect(x, y, e) {
    return x > e.x - e.w / 2 && x < e.x + e.w / 2 && y > e.y - e.h && y < e.y;
  }
  function hitCreatures(G, a, x, y) {
    const { s } = G;
    for (const e of s.enemies) {
      if (!e.alive || !inRect(x, y, e)) continue;
      if ((ENEMY[e.kind].ai || e.kind) === "crab" && Math.sign(a.vx) === -e.face && a.vy < 260) {
        G.sfx("block");
        G.fx("FX_A", "arrow_hit", x, y + 8, 0.25, 20);
        return true;
      }
      damageEnemy(G, e, 1, a.vx);
      arrowImpact(G, a.type, x, y);
      return true;
    }
    for (const b2 of Object.values(s.bosses)) {
      if (b2.state === "defeat" || !inRect(x, y, b2)) continue;
      if (b2.state === "vanish") continue;
      if (bossAi(b2.kind) === "crab" && b2.state !== "stuck") {
        G.sfx("block");
        G.fx("FX_A", "arrow_hit", x, y + 8, 0.25, 24);
        return true;
      }
      damageBoss(G, b2, 1);
      arrowImpact(G, a.type, x, y);
      return true;
    }
    return false;
  }
  function damageEnemy(G, e, n, dirX = 0) {
    e.hp -= n;
    e.flash = 0.18;
    e.vx += Math.sign(dirX) * 60;
    G.sfx("hit");
    G.fx("FX_A", "arrow_hit", e.x, e.y - e.h / 2 + 10, 0.25, 26);
    if (e.hp <= 0) {
      e.alive = false;
      if (e.kind === "totem") {
        G.s.pr.got[e.id] = true;
        G.toast("Totem badai runtuh!");
        G.save();
      }
      G.fx("FX_B", "poof", e.x, e.y + 6, 0.5, Math.max(40, e.h * 1.8));
      G.sfx("poof");
      G.s.player.energy = Math.min(100, G.s.player.energy + 15);
      if (e.kind !== "slimeSmall" || G.rand() < 0.5) G.s.pr.coins = (G.s.pr.coins || 0) + COIN_ENEMY;
      if (e.kind === "slime")
        for (const dx of [-14, 14]) {
          const k = makeEnemy(G, "slimeSmall", e.x + dx, e.y, G.uid("e"));
          k.vy = -260;
          k.vx = dx * 8;
          k.t = 0.6;
          G.s.enemies.push(k);
        }
    }
  }
  function damageBoss(G, b2, n) {
    b2.hp -= n;
    b2.flash = 0.2;
    G.sfx("hit");
    G.fx("FX_A", "arrow_hit", b2.x, b2.y - b2.h / 2, 0.3, 40);
    if (b2.hp <= 0 && b2.state !== "defeat") {
      b2.state = "defeat";
      b2.t = 1.4;
      b2.animT = 0;
      G.sfx("boss");
      G.shake(8);
    }
  }
  function updateShots(G, dt) {
    const { s } = G;
    const p = s.player;
    for (const sh of s.shots) {
      sh.life -= dt;
      if (sh.kind === "wave" || sh.kind === "fire") {
        sh.x += sh.vx * dt;
        if (isSolidAt(sh.x + Math.sign(sh.vx) * 10, sh.y - 8)) sh.life = 0;
      } else {
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        if (sh.kind === "bubble") sh.vy = Math.sin(sh.life * 5) * 20;
        if (isSolidAt(sh.x, sh.y)) {
          sh.life = 0;
          if (sh.kind === "bubble") G.sfx("bubble");
        }
      }
      const hit = sh.kind === "wave" || sh.kind === "fire" ? Math.abs(p.x - sh.x) < (sh.kind === "fire" ? 16 : 22) && p.y > sh.y - 30 && p.y <= sh.y + 2 : Math.abs(p.x - sh.x) < p.w / 2 + 6 && sh.y > p.y - p.h - 4 && sh.y < p.y + 4;
      if (hit && p.mode !== "dead" && p.iFrames <= 0) {
        if (sh.kind === "bubble") {
          if (p.mode === "normal") {
            p.mode = "trapped";
            p.modeT = 1.1;
            p.aiming = false;
            G.sfx("bubble");
            G.toast("Terjebak gelembung! Tekan lompat berulang.", 1.4);
          }
        } else G.hurt(1, { fromX: sh.x });
        sh.life = 0;
      }
    }
    s.shots = s.shots.filter((sh) => sh.life > 0);
  }
  function shoot(G, kind, x, y, tx, ty, speed, life = 3) {
    const d = Math.hypot(tx - x, ty - y) || 1;
    G.s.shots.push({ id: G.uid("s"), kind, x, y, vx: (tx - x) / d * speed, vy: (ty - y) / d * speed, life });
  }
  function updateEnemies(G, dt) {
    const { s } = G;
    const p = s.player;
    const spd = G.tw.enemySpeed;
    for (const e of s.enemies) {
      if (!e.alive) continue;
      if (Math.abs(e.x - p.x) > 900 || Math.abs(e.y - p.y) > 700) continue;
      e.t -= dt;
      e.flash -= dt;
      e.animT += dt;
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const k = ENEMY[e.kind];
      const fast = k.fast || 1;
      switch (k.ai || e.kind) {
        case "slime":
        case "slimeSmall": {
          if (e.onGround) {
            e.vx *= 0.8;
            if (e.state === "air") {
              e.state = "idle";
              e.t = 0.8 + G.rand() * 0.6;
            }
            if (e.state === "idle" && e.t <= 0 && Math.abs(dx) < 280 && Math.abs(dy) < 140) {
              e.state = "windup";
              e.t = 0.35;
              e.animT = 0;
              e.face = Math.sign(dx) || -1;
            } else if (e.state === "windup" && e.t <= 0) {
              e.state = "air";
              e.vy = e.kind === "slime" ? -400 : -320;
              e.vx = e.face * (e.kind === "slime" ? 130 : 110) * spd;
              e.animT = 0;
            }
          }
          gravityMove(G, e, dt);
          break;
        }
        case "beetle": {
          if (e.state === "charge") {
            e.vx = e.face * 200 * spd * fast;
            if (e.t <= 0) {
              e.state = "idle";
              e.t = 1.2;
            }
          } else {
            e.vx = e.face * 55 * spd * fast;
            if (e.t <= 0 && Math.abs(dx) < 180 && Math.abs(dy) < 30 && Math.sign(dx) === e.face) {
              e.state = "charge";
              e.t = 0.8;
              e.animT = 0;
            }
          }
          const r = gravityMove(G, e, dt);
          const aheadX = e.x + e.face * (e.w / 2 + 4);
          if (r.wallL || r.wallR || e.onGround && !isSolidAt(aheadX, e.y + 6) && !isOneWayTile(tileAt(Math.floor(aheadX / T), Math.floor((e.y + 6) / T)))) {
            e.face *= -1;
            if (e.state === "charge") e.state = "idle";
          }
          break;
        }
        case "swooper": {
          e.ph += dt;
          if (e.state === "idle") {
            e.x += (e.hx + Math.sin(e.ph * 1.3) * 46 - e.x) * Math.min(1, dt * 3);
            e.y += (e.hy + Math.sin(e.ph * 2.2) * 12 - e.y) * Math.min(1, dt * 3);
            e.face = Math.sign(dx) || e.face;
            if (e.t <= 0 && Math.abs(dx) < 240 && dy > -40 && dy < 260) {
              e.state = "warn";
              e.t = 0.5;
              e.animT = 0;
              G.sfx("swish");
            }
          } else if (e.state === "warn") {
            if (e.t <= 0) {
              e.state = "dive";
              e.t = 1;
              const d = Math.hypot(dx, dy - 20) || 1;
              e.vx = dx / d * 340 * spd;
              e.vy = (dy - 20) / d * 340 * spd;
              e.animT = 0;
            }
          } else if (e.state === "dive") {
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            if (e.t <= 0 || isSolidAt(e.x, e.y)) {
              e.state = "return";
              e.y -= 4;
            }
          } else if (e.state === "return") {
            const hx = e.hx - e.x;
            const hy = e.hy - e.y;
            const d = Math.hypot(hx, hy);
            if (d < 8) {
              e.state = "idle";
              e.t = 1.6;
            } else {
              e.x += hx / d * 150 * dt;
              e.y += hy / d * 150 * dt;
            }
          }
          break;
        }
        case "sentry": {
          e.face = Math.sign(dx) || e.face;
          if (e.state === "idle" && e.t <= 0 && Math.hypot(dx, dy) < 400) {
            e.state = "shoot";
            e.t = 0.55;
            e.animT = 0;
          } else if (e.state === "shoot" && e.t <= 0) {
            shoot(G, k.shot || "thorn", e.x + e.face * 14, e.y - 28, p.x, p.y - 24, 260 * spd);
            e.state = "idle";
            e.t = 2.2;
          }
          gravityMove(G, e, dt);
          break;
        }
        case "crab": {
          if (e.state === "attack") {
            e.vx = 0;
            if (e.t <= 0.2 && !e.hitDone) {
              e.hitDone = true;
              G.shake(3);
              if (Math.abs(dx) < 58 && Math.abs(dy) < 34 && Math.sign(dx) === e.face) G.hurt(1, { fromX: e.x });
            }
            if (e.t <= 0) {
              e.state = "idle";
              e.t = 1;
            }
          } else {
            if (e.t <= 0) {
              e.face = Math.sign(dx) || e.face;
              e.t = 1.8;
            }
            const lim = 3 * T;
            if (e.x > e.hx + lim) e.face = -1;
            if (e.x < e.hx - lim) e.face = 1;
            e.vx = e.face * 40 * spd;
            if (Math.abs(dx) < 60 && Math.abs(dy) < 30) {
              e.state = "attack";
              e.t = 0.55;
              e.animT = 0;
              e.hitDone = false;
              e.face = Math.sign(dx) || e.face;
            }
          }
          const r = gravityMove(G, e, dt);
          if (r.wallL || r.wallR) e.face *= -1;
          break;
        }
        case "bubbler": {
          e.face = Math.sign(dx) || e.face;
          if (e.state === "idle" && e.t <= 0 && Math.hypot(dx, dy) < 380) {
            e.state = "shoot";
            e.t = 0.5;
            e.animT = 0;
          } else if (e.state === "shoot" && e.t <= 0) {
            const kind = k.shot || "bubble";
            shoot(G, kind, e.x + e.face * 16, e.y - 16, p.x, p.y - 24, (kind === "bubble" ? 110 : 190) * spd, 4.5);
            e.state = "idle";
            e.t = 2.6;
          }
          if (k.fly) {
            e.ph += dt;
            e.y = e.hy + Math.sin(e.ph * 2) * 8;
          } else gravityMove(G, e, dt);
          break;
        }
        case "totem": {
          e.face = -1;
          if (e.t <= 0 && Math.hypot(dx, dy) < 460) {
            shoot(G, "spark", e.x, e.y - 62, p.x, p.y - 24, 230 * spd, 3);
            G.fx("FX_C", "lightning", e.x, e.y - 50, 0.35, 50);
            e.t = 2.4;
          }
          break;
        }
        default:
          break;
      }
      const ai = k.ai || e.kind;
      if (ai !== "swooper" && ai !== "sentry" && ai !== "bubbler" && ai !== "totem" && Math.abs(e.vx) > 5) e.face = Math.sign(e.vx);
      if (p.mode !== "dead" && Math.abs(p.x - e.x) < (p.w + k.w) / 2 - 4 && p.y > e.y - e.h + 4 && p.y - p.h < e.y - 4) G.hurt(1, { fromX: e.x });
    }
    s.enemies = s.enemies.filter((e) => e.alive);
  }
  function gravityMove(G, e, dt) {
    e.vy = Math.min(e.vy + 1400 * dt, 700);
    const r = moveBody(e, e.vx * dt, e.vy * dt, G.plats);
    e.onGround = r.ground;
    return r;
  }
  function updateBosses(G, dt) {
    const { s } = G;
    const p = s.player;
    for (const b2 of Object.values(s.bosses)) {
      const d = byId[b2.id];
      const ar = d.arena;
      const inArena = p.x > ar.x && p.x < ar.x + ar.w && p.y > ar.y && p.y - 10 < ar.y + ar.h;
      if (!b2.active && inArena && p.mode !== "dead") {
        b2.active = true;
        G.bossIntro(b2);
      }
      if (b2.active && G.areaOfPlayer() !== d.area) {
        const k = BOSS[b2.kind];
        Object.assign(b2, { active: false, hp: b2.max, x: d.x, y: k.fly ? d.y + k.h / 2 : d.y, vx: 0, vy: 0, state: "idle", t: 1.2, onGround: !k.fly });
        if (s.ui.boss === b2.id) s.ui.boss = null;
      }
      if (!b2.active) continue;
      b2.flash -= dt;
      b2.animT += dt;
      b2.t -= dt;
      const dx = p.x - b2.x;
      if (b2.state === "defeat") {
        b2.vx = 0;
        if (!b2.onGround) {
          b2.vy = Math.min((b2.vy || 0) + 900 * dt, 500);
          b2.onGround = moveBody(b2, 0, b2.vy * dt, []).ground;
        }
        if (b2.t <= 0) G.bossDefeated(b2);
        continue;
      }
      const ai = bossAi(b2.kind);
      if (ai === "moss") updateMoss(G, b2, dt, dx, ar);
      else if (ai === "eagle") updateEagle(G, b2, dt, dx, ar);
      else if (ai === "stag") updateStag(G, b2, dt, dx, ar);
      else if (ai === "shadow") updateShadow(G, b2, dt, dx, ar);
      else if (ai === "final") updateFinal(G, b2, dt, dx, ar);
      else updateCrabBoss(G, b2, dt, dx, ar);
      if (b2.state !== "vanish" && p.mode !== "dead" && Math.abs(p.x - b2.x) < (p.w + b2.w) / 2 - 8 && p.y > b2.y - b2.h + 8 && p.y - p.h < b2.y - 6) G.hurt(1, { fromX: b2.x });
    }
    for (const id of Object.keys(s.bosses)) if (s.bosses[id].gone) delete s.bosses[id];
  }
  function clampArena(b2, ar) {
    b2.x = Math.max(ar.x + b2.w / 2, Math.min(ar.x + ar.w - b2.w / 2, b2.x));
  }
  function updateMoss(G, b2, dt, dx, ar) {
    const spd = G.tw.enemySpeed;
    if (b2.state === "idle") {
      b2.face = Math.sign(dx) || b2.face;
      if (b2.t <= 0) {
        b2.state = "windup";
        b2.t = 0.5;
        b2.animT = 0;
      }
    } else if (b2.state === "windup") {
      if (b2.t <= 0) {
        b2.state = "leap";
        b2.vy = -640;
        b2.vx = Math.max(-260, Math.min(260, dx * 1.1)) * spd;
        b2.animT = 0;
        b2.onGround = false;
      }
    }
    b2.vy = Math.min(b2.vy + 1500 * dt, 800);
    const r = moveBody(b2, b2.vx * dt, b2.vy * dt, []);
    clampArena(b2, ar);
    if (r.ground && b2.state === "leap") {
      b2.state = "idle";
      b2.t = 0.9 + G.rand() * 0.5;
      b2.vx = 0;
      b2.cycle++;
      G.shake(7);
      G.sfx("boss");
      G.fx("FX_A", "dust", b2.x - 30, b2.y, 0.45, 60);
      G.fx("FX_A", "dust", b2.x + 30, b2.y, 0.45, 60, true);
      if (b2.cycle % 2 === 0) {
        const small = G.s.enemies.filter((e) => e.alive && e.kind === "slimeSmall").length;
        if (small < 2) {
          const e = makeEnemy(G, "slimeSmall", b2.x + b2.face * 40, b2.y - 10, G.uid("e"));
          e.vy = -300;
          e.vx = b2.face * 120;
          G.s.enemies.push(e);
        }
      }
    }
  }
  function updateEagle(G, b2, dt, dx, ar) {
    const p = G.s.player;
    const spd = G.tw.enemySpeed;
    const hoverY = ar.y + Math.max(70, ar.h * 0.45);
    if (b2.state === "idle" || b2.state === "hover") {
      b2.state = "hover";
      b2.ph = (b2.ph || 0) + dt;
      const tx = ar.x + ar.w / 2 + Math.sin(b2.ph * 0.9) * (ar.w / 2 - 50);
      b2.x += (tx - b2.x) * Math.min(1, dt * 2.5);
      b2.y += (hoverY + Math.sin(b2.ph * 2.4) * 10 - b2.y) * Math.min(1, dt * 3);
      b2.face = Math.sign(dx) || b2.face;
      if (b2.t <= 0) {
        b2.cycle++;
        if (b2.cycle % 3 === 0) {
          b2.state = "volley";
          b2.t = 0.7;
          b2.animT = 0;
        } else {
          b2.state = "warn";
          b2.t = 0.55;
          b2.animT = 0;
          G.sfx("swish");
        }
      }
    } else if (b2.state === "volley") {
      if (b2.t <= 0) {
        for (const off of [-50, 0, 50]) shoot(G, "feather", b2.x, b2.y - b2.h / 2, p.x + off, p.y - 20, 250 * spd);
        b2.state = "hover";
        b2.t = 1.4;
      }
    } else if (b2.state === "warn") {
      if (b2.t <= 0) {
        const tx = p.x - b2.x;
        const ty = p.y - 10 - b2.y;
        const d = Math.hypot(tx, ty) || 1;
        b2.vx = tx / d * 430 * spd;
        b2.vy = ty / d * 430 * spd;
        b2.state = "dive";
        b2.t = 1.1;
        b2.animT = 0;
      }
    } else if (b2.state === "dive") {
      b2.x += b2.vx * dt;
      b2.y += b2.vy * dt;
      if (b2.t <= 0 || b2.y >= ar.y + ar.h - 4 || isSolidAt(b2.x, b2.y)) {
        b2.y = Math.min(b2.y, ar.y + ar.h - 4);
        b2.state = "rise";
        G.shake(3);
      }
    } else if (b2.state === "rise") {
      b2.y -= 260 * dt;
      if (b2.y <= hoverY) {
        b2.state = "hover";
        b2.t = 1.5 + G.rand() * 0.6;
      }
    }
    clampArena(b2, ar);
    b2.y = Math.max(ar.y + b2.h, Math.min(ar.y + ar.h, b2.y));
  }
  function updateCrabBoss(G, b2, dt, dx, ar) {
    const p = G.s.player;
    const spd = G.tw.enemySpeed;
    if (b2.state === "idle" || b2.state === "walk") {
      b2.state = "walk";
      b2.face = Math.sign(dx) || b2.face;
      b2.vx = b2.face * 70 * spd;
      if (Math.abs(dx) < 40) b2.vx = 0;
      if (b2.t <= 0) {
        b2.cycle++;
        b2.state = b2.cycle % 3 === 0 ? "spray" : "raise";
        b2.t = b2.state === "spray" ? 0.6 : 0.7;
        b2.animT = 0;
        b2.vx = 0;
      }
    } else if (b2.state === "raise") {
      if (b2.t <= 0) {
        b2.state = "slam";
        b2.t = 0.25;
        b2.animT = 0;
        G.shake(9);
        G.sfx("boss");
        G.s.shots.push({ id: G.uid("s"), kind: "wave", x: b2.x - b2.w / 2, y: b2.y, vx: -280 * spd, vy: 0, life: 1.6 });
        G.s.shots.push({ id: G.uid("s"), kind: "wave", x: b2.x + b2.w / 2, y: b2.y, vx: 280 * spd, vy: 0, life: 1.6 });
        G.fx("FX_A", "splash", b2.x, b2.y, 0.5, 70);
      }
    } else if (b2.state === "slam") {
      if (b2.t <= 0) {
        b2.state = "stuck";
        b2.t = 1.6;
        b2.animT = 0;
      }
    } else if (b2.state === "stuck") {
      if (b2.t <= 0) {
        b2.state = "walk";
        b2.t = 1.6 + G.rand();
      }
    } else if (b2.state === "spray") {
      if (b2.t <= 0) {
        for (const off of [-80, 0, 80]) shoot(G, "bubble", b2.x, b2.y - b2.h * 0.7, p.x + off, p.y - 30, 120 * spd, 4);
        b2.state = "walk";
        b2.t = 1.4;
      }
    }
    b2.vy = Math.min(b2.vy + 1500 * dt, 800);
    moveBody(b2, b2.vx * dt, b2.vy * dt, []);
    clampArena(b2, ar);
  }
  function updateStag(G, b2, dt, dx, ar) {
    const spd = G.tw.enemySpeed;
    if (b2.state === "idle") {
      b2.face = Math.sign(dx) || b2.face;
      b2.vx = 0;
      if (b2.t <= 0) {
        b2.cycle++;
        b2.state = b2.cycle % 3 === 0 ? "windup" : "aim";
        b2.t = 0.55;
        b2.animT = 0;
        G.sfx("swish");
      }
    } else if (b2.state === "aim") {
      if (b2.t <= 0) {
        b2.state = "charge";
        b2.vx = b2.face * 360 * spd;
        b2.animT = 0;
      }
    } else if (b2.state === "charge") {
      if (G.rand() < 0.25) G.s.shots.push({ id: G.uid("s"), kind: "fire", x: b2.x - b2.face * 30, y: b2.y, vx: 0, vy: 0, life: 1.6 });
      const atWall = b2.face > 0 && b2.x >= ar.x + ar.w - b2.w / 2 - 2 || b2.face < 0 && b2.x <= ar.x + b2.w / 2 + 2;
      if (atWall) {
        b2.state = "stuck";
        b2.t = 1.3;
        b2.vx = 0;
        G.shake(7);
        G.sfx("boss");
      }
    } else if (b2.state === "windup") {
      if (b2.t <= 0) {
        b2.state = "leap";
        b2.vy = -660;
        b2.vx = Math.max(-280, Math.min(280, dx * 1.1)) * spd;
        b2.onGround = false;
        b2.animT = 0;
      }
    } else if (b2.state === "stuck") {
      if (b2.t <= 0) {
        b2.state = "idle";
        b2.t = 0.6;
        b2.face *= -1;
      }
    }
    b2.vy = Math.min(b2.vy + 1500 * dt, 800);
    const r = moveBody(b2, b2.vx * dt, b2.vy * dt, []);
    clampArena(b2, ar);
    if (r.ground && b2.state === "leap") {
      b2.state = "idle";
      b2.t = 0.8;
      b2.vx = 0;
      G.shake(7);
      G.sfx("boss");
      for (const v of [-260, 260]) G.s.shots.push({ id: G.uid("s"), kind: "wave", x: b2.x, y: b2.y, vx: v * spd, vy: 0, life: 1.5 });
    }
  }
  function updateShadow(G, b2, dt, dx, ar) {
    const p = G.s.player;
    const spd = G.tw.enemySpeed;
    const spots = [ar.x + 50, ar.x + ar.w / 2, ar.x + ar.w - 50];
    b2.face = Math.sign(dx) || b2.face;
    if (b2.state === "idle" || b2.state === "aim") {
      if (b2.state === "idle") {
        b2.state = "aim";
        b2.t = 0.7;
        b2.animT = 0;
      } else if (b2.t <= 0) {
        for (const off of [-30, 0, 30]) shoot(G, "darrow", b2.x + b2.face * 10, b2.y - 34, p.x + off, p.y - 26, 300 * spd, 2.4);
        G.sfx("bow");
        b2.state = "rest";
        b2.t = 0.9;
        b2.cycle++;
      }
    } else if (b2.state === "rest") {
      if (b2.t <= 0) {
        b2.state = "vanish";
        b2.t = 0.45;
        G.fx("FX_B", "poof", b2.x, b2.y, 0.4, 60);
      }
    } else if (b2.state === "vanish") {
      if (b2.t <= 0) {
        b2.x = spots[(b2.cycle + Math.floor(G.rand() * 2)) % 3];
        b2.state = "idle";
        G.fx("FX_B", "poof", b2.x, b2.y, 0.4, 60);
      }
    }
    const ls = G.s.lastShot;
    if (ls && ls.t > (b2.echoT || 0) && G.s.time - ls.t > 0.8 && b2.state !== "vanish") {
      b2.echoT = ls.t;
      G.s.shots.push({ id: G.uid("s"), kind: "darrow", x: b2.x, y: b2.y - 34, vx: ls.x * 320 * spd, vy: ls.y * 320 * spd, life: 2 });
    }
    b2.vy = Math.min(b2.vy + 1500 * dt, 800);
    moveBody(b2, 0, b2.vy * dt, []);
  }
  function updateFinal(G, b2, dt, dx, ar) {
    const frac = b2.hp / b2.max;
    const scaled = { ...G, tw: { ...G.tw, enemySpeed: G.tw.enemySpeed * (frac < 0.35 ? 1.35 : frac < 0.7 ? 1.15 : 1) } };
    updateEagle(scaled, b2, dt, dx, ar);
    if (b2.state === "volley" && b2.t <= dt && frac < 0.7) {
      const p = G.s.player;
      for (const off of [-120, 120]) shoot(G, "orb", b2.x, b2.y - b2.h / 2, p.x + off, p.y - 20, 220, 3);
    }
    if (frac < 0.5 && !b2.summoned) {
      b2.summoned = true;
      G.banner("Penjaga memanggil roh bintang!", 2);
      for (const ox of [-140, 140]) {
        const e = makeEnemy(G, "starWisp", b2.x + ox, b2.y - 40, G.uid("e"));
        e.hx = e.x;
        e.hy = e.y;
        G.s.enemies.push(e);
      }
    }
  }

  // ../.dart_tool/skybound_source/game/puzzles2.js
  var near = (ax, ay, bx, by, r) => Math.hypot(ax - bx, ay - by) < r;
  var edgeKey = (a, b2) => a < b2 ? `${a}|${b2}` : `${b2}|${a}`;
  var FAN_DIRS = ["up", "right", "left"];
  var fanDir = (pr, d) => pr.fans[d.id] ?? d.dir0;
  var mirrorState = (pr, d) => pr.mirrors[d.id] ?? d.s0;
  var statuePhase = (pr, d) => pr.statues[d.id] ?? d.p0;
  var ventOpen = (pr, d) => pr.vents[d.id] ?? d.open0;
  function roomTemp(pr, room) {
    if (!pr.furnace) return 0;
    return ofType("vent").filter((v) => ventOpen(pr, v) && v.rooms.includes(room.id)).length;
  }
  function starDegree(pr, id) {
    return Object.keys(pr.links).filter((k) => pr.links[k] && k.split("|").includes(id)).length;
  }
  function initPuzzles2(G) {
    const { s } = G;
    const pr = s.pr;
    setSide(pr.side);
    s.echo = {};
    s.rings = {};
    for (const d of ofType("ring")) s.rings[d.id] = { ang: d.speed > 0 ? 2.2 : 4.1, held: false };
    s.mechT = 0;
    s.starSel = null;
    s.shardRun = { active: false, t: 0, got: {} };
    const way = byId.way0;
    s.pod = pr.podDone ? { x: byId.house6.x, y: byId.house6.y - 12, vx: 0, vy: 0, way: "way0", rest: 0, done: true } : { x: way.x, y: way.y - 12, vx: 0, vy: 0, way: "way0", rest: 0, done: false };
    s.light = { segs: [], eyes: {}, bridges: {} };
    traceLight(s);
  }
  function traceLight(s) {
    const pr = s.pr;
    const out = { segs: [], eyes: {}, cells: /* @__PURE__ */ new Set(), bridges: {} };
    const lens = byId.lens4;
    if (pr.latches.lens4) {
      const mirrors = {};
      for (const m of ofType("mirror")) mirrors[`${m.tx},${m.ty}`] = m;
      const eyes = {};
      for (const e of ofType("eye")) eyes[`${e.tx},${e.ty}`] = e;
      const prism = byId.prism4;
      const queue = [[lens.tx, lens.ty, lens.dx, lens.dy, 0]];
      let guard = 0;
      while (queue.length && guard++ < 12) {
        const [sx, sy, dx0, dy0, depth] = queue.shift();
        let x = sx;
        let y = sy;
        let dx = dx0;
        let dy = dy0;
        let x0 = sx;
        let y0 = sy;
        for (let i = 0; i < 80; i++) {
          x += dx;
          y += dy;
          if (isSolid(x, y)) {
            out.segs.push([x0, y0, x - dx * 0.5, y - dy * 0.5]);
            break;
          }
          out.cells.add(`${x},${y}`);
          const key = `${x},${y}`;
          if (eyes[key]) {
            out.eyes[eyes[key].id] = true;
            out.segs.push([x0, y0, x, y]);
            break;
          }
          const m = mirrors[key];
          if (m) {
            out.segs.push([x0, y0, x, y]);
            const st = mirrorState(pr, m);
            const ndx = st === "/" ? -dy : dy;
            const ndy = st === "/" ? -dx : dx;
            dx = ndx;
            dy = ndy;
            x0 = x;
            y0 = y;
            continue;
          }
          if (prism && x === prism.tx && y === prism.ty && depth < 2) {
            out.segs.push([x0, y0, x, y]);
            queue.push([x, y, dx, dy, depth + 1], [x, y, dy, dx, depth + 1], [x, y, -dy, -dx, depth + 1]);
            break;
          }
        }
      }
    }
    for (const b2 of ofType("lightbridge")) {
      let lit = false;
      for (let x = b2.x0; x <= b2.x1; x++) if (out.cells.has(`${x},${b2.row}`)) lit = true;
      out.bridges[b2.id] = lit;
    }
    s.light = { segs: out.segs, eyes: out.eyes, bridges: out.bridges };
  }
  function plats2(G, out) {
    const { s } = G;
    for (const b2 of ofType("lightbridge")) if (s.light.bridges[b2.id]) out.push({ id: b2.id, x: b2.x, w: b2.w, top: b2.y, prevTop: b2.y });
    for (const b2 of ofType("echoBridge")) if ((s.echo[b2.id] || 0) > 0) out.push({ id: b2.id, x: b2.x, w: b2.w, top: b2.y, prevTop: b2.y });
    for (const d of ofType("rotplat")) {
      const p = rotPos(d, s.mechT);
      const q = rotPos(d, s.mechT - (s.mechDt || 0));
      out.push({ id: d.id, x: p.x - d.w / 2, w: d.w, top: p.y, prevTop: q.y, prevX: q.x - d.w / 2 });
    }
  }
  function rotPos(d, t) {
    const a = t * d.speed;
    return { x: d.cx + Math.cos(a) * d.r, y: d.cy + Math.sin(a) * d.r };
  }
  function pendulumPos(d, t) {
    const a = Math.sin(t * d.speed) * d.amp;
    return { x: d.ax + Math.sin(a) * d.len, y: d.ay + Math.cos(a) * d.len, a };
  }
  function windZones(pr) {
    const zones = [];
    for (const d of ofType("fan")) {
      const dir = fanDir(pr, d);
      let len = 0;
      if (dir === "up") {
        for (let i = 0; i < d.len; i++) {
          if (isSolid(d.tx, d.ty - i) && i > 0) break;
          len = i + 1;
        }
        zones.push({ id: d.id, dir, x: d.tx * T, y: (d.ty - len + 1) * T, w: 3 * T, h: len * T });
      } else {
        const sx = dir === "right" ? d.tx + 2 : d.tx - 1;
        const step = dir === "right" ? 1 : -1;
        for (let i = 0; i < d.len; i++) {
          if (isSolid(sx + i * step, d.ty)) break;
          len = i + 1;
        }
        const x = dir === "right" ? sx * T : (sx - len + 1) * T;
        zones.push({ id: d.id, dir, x, y: (d.ty - 1) * T, w: len * T, h: 2 * T });
      }
    }
    return zones;
  }
  var inZone = (z, x, y) => x > z.x && x < z.x + z.w && y > z.y && y < z.y + z.h;
  function updatePuzzles2(G, dt) {
    const { s } = G;
    const pr = s.pr;
    const p = s.player;
    const area = G.areaOfPlayer();
    s.mechDt = dt;
    s.mechT += dt;
    for (const k of Object.keys(s.echo)) s.echo[k] = Math.max(0, s.echo[k] - dt);
    if (area === 3) traceLight(s);
    if (!pr.gates.gate4 && ofType("eye").every((e) => s.light.eyes[e.id])) G.openGate("gate4");
    if (!pr.gates.gate7 && pr.furnace && ofType("room").every((r) => roomTemp(pr, r) === 1)) G.openGate("gate7");
    if (!pr.gates.gate11 && pr.bosses.boss11 && ofType("enemy").filter((d) => d.kind === "totem").every((d) => pr.got[d.id])) G.openGate("gate11");
    for (const d of ofType("ring")) {
      const r = s.rings[d.id];
      if (!r.held && !pr.gates.gate10) r.ang = (r.ang + d.speed * dt + Math.PI * 2) % (Math.PI * 2);
    }
    if (area === 9)
      for (const d of ofType("pendulum")) {
        const b2 = pendulumPos(d, s.mechT);
        if (near(p.x, p.y - p.h / 2, b2.x, b2.y, 24)) G.hurt(1, { fromX: b2.x });
      }
    if (area === 5 && (p.mode === "normal" || p.mode === "dash")) {
      for (const z of windZones(pr))
        if (z.dir === "up" && inZone(z, p.x, p.y - p.h / 2)) {
          p.vy = Math.max(p.vy - 2700 * dt, -340);
          p.onGround = false;
          if (Math.random() < 0.4) G.particle(p.x + (Math.random() - 0.5) * 30, p.y, 0, -140, "#e8fbff", 2.5, 0.5);
        }
    }
    if (area === 5) updatePod(G, dt);
    const run = s.shardRun;
    if (run.active) {
      run.t -= dt;
      for (const d of ofType("shard")) {
        if (run.got[d.id]) continue;
        if (Math.abs(p.x - d.x) < 22 && p.y > d.y - 10 && p.y - p.h < d.y + 14) {
          run.got[d.id] = true;
          G.sfx("pickup");
          G.fx("FX_B", "sparkle", d.x, d.y + 12, 0.5, 40);
        }
      }
      const n = Object.keys(run.got).length;
      const total = ofType("shard").length;
      s.ui.toast = { text: `Kristal ${n}/${total} \xB7 ${Math.ceil(run.t)} dtk`, t: 0.3 };
      if (n >= total) {
        run.active = false;
        pr.seqs.shards = true;
        G.sfx("ability");
        G.banner("Tantangan kristal selesai!", 2.4);
        G.toast("Peti di aula atas terbuka untukmu.", 3);
        G.save();
      } else if (run.t <= 0) {
        run.active = false;
        G.sfx("deny");
        G.toast("Waktu habis \u2014 sentuh kristal awal untuk mencoba lagi.", 3);
      }
    }
  }
  function updatePod(G, dt) {
    const { s } = G;
    const pr = s.pr;
    const pod = s.pod;
    if (pod.done) return;
    const zones = windZones(pr);
    let inWind = false;
    for (const z of zones) {
      if (!inZone(z, pod.x, pod.y)) continue;
      inWind = true;
      if (z.dir === "up") {
        pod.vy = Math.max(pod.vy - 2e3 * dt, -280);
        pod.vx *= 1 - Math.min(1, 6 * dt);
      } else {
        pod.vx += (z.dir === "right" ? 1 : -1) * 600 * dt;
        pod.vy -= 380 * dt;
        pod.vy *= 1 - Math.min(1, 4 * dt);
      }
    }
    pod.vx = Math.max(-170, Math.min(170, pod.vx));
    pod.vy = Math.min(pod.vy + 380 * dt, 360);
    const body = { x: pod.x, y: pod.y + 12, w: 22, h: 24, vx: pod.vx, vy: pod.vy };
    const r = moveBody(body, pod.vx * dt, pod.vy * dt, G.plats);
    pod.x = body.x;
    pod.y = body.y - 12;
    pod.vx = body.vx;
    pod.vy = body.vy;
    if (r.ground) pod.vx *= 1 - Math.min(1, 3 * dt);
    for (const w of ofType("waystation"))
      if (near(pod.x, pod.y, w.x, w.y - 12, 26) && pod.way !== w.id) {
        pod.way = w.id;
        G.fx("FX_B", "sparkle", w.x, w.y - 10, 0.5, 34);
        G.toast("Benih singgah di sarang angin.", 1.6);
      }
    const goal = byId.house6.goal;
    if (pod.x > goal.x && pod.x < goal.x + goal.w && pod.y > goal.y && pod.y < goal.y + goal.h) {
      pod.done = true;
      pr.podDone = true;
      G.sfx("ability");
      G.fx("FX_A", "sprout_grow", pod.x, pod.y + 14, 0.8, 70);
      G.openGate("gate6");
      return;
    }
    const speed = Math.hypot(pod.vx, pod.vy);
    pod.rest = !inWind && speed < 10 ? pod.rest + dt : 0;
    const hitThorn = tileAt(Math.floor(pod.x / T), Math.floor((pod.y + 12) / T)) === TILE.THORN;
    const atWay = ofType("waystation").some((w) => near(pod.x, pod.y, w.x, w.y - 12, 30));
    if (hitThorn || pod.rest > 6 && !atWay) resetPod(G, hitThorn);
  }
  function resetPod(G, thorn) {
    const pod = G.s.pod;
    const w = byId[pod.way] || byId.way0;
    pod.x = w.x;
    pod.y = w.y - 12;
    pod.vx = 0;
    pod.vy = 0;
    pod.rest = 0;
    G.fx("FX_B", "sparkle", pod.x, pod.y + 10, 0.5, 40);
    G.toast(thorn ? "Benihnya kena duri \u2014 kembali ke sarang singgah." : "Benih kembali ke sarang singgah terakhir.", 2);
  }
  function aimTargets2(G, out) {
    const { s } = G;
    const pr = s.pr;
    const area = G.areaOfPlayer();
    const type = s.player.arrowType;
    const P = (x, y) => out.push({ x, y, puzzle: true });
    if (area === 3) {
      if (!pr.latches.lens4) P(byId.lens4.x, byId.lens4.y);
      for (const d of ofType("mirror")) if (!d.lock || pr.unlocked[d.lock]) P(d.x, d.y);
      if (!pr.unlocked.pin4) P(byId.pin4.x, byId.pin4.y);
    }
    if (area === 4 && type === "echo") {
      for (const d of ofType("bell")) P(d.x, d.y);
      for (const d of ofType("echoCrystal")) P(d.x, d.y - 24);
    }
    if (area === 5) {
      if (type === "wind") for (const d of ofType("fan")) P((d.tx + 1) * T, d.ty * T + T / 2);
      if (!s.pod.done) P(s.pod.x, s.pod.y);
    }
    if (area === 6) {
      if (type === "ember" && !pr.furnace) P(byId.furnace7.x, byId.furnace7.y - 20);
      if (type === "ember") {
        for (const d of ofType("bramble")) if (!pr.burned[d.id]) P(d.x + d.w / 2, d.y + d.h / 2);
      }
      for (const d of ofType("vent")) P(d.x, d.y - 16);
    }
    if (area === 8 && !pr.gates.gate9) for (const d of ofType("statue")) P(d.x, d.y - 40);
    if (area === 9) {
      for (const d of ofType("ring")) P(d.pin.x, d.pin.y);
      P(byId.core10.x, byId.core10.y);
    }
    if (area === 11 && !pr.seqs.spore) {
      for (const d of ofType("sporeLamp")) if (!s.seq.spore?.popped[d.id]) P(d.x, d.y);
    }
    if (area === 12 && type === "thread" && !pr.gates.gate13) for (const d of ofType("starNode")) P(d.x, d.y);
  }
  function arrowHit2(G, a, x, y) {
    const { s } = G;
    const pr = s.pr;
    const area = G.areaOfPlayer();
    const hit = (d, r = 18) => near(x, y, d.x, d.y, r);
    if (area === 3) {
      const lens = byId.lens4;
      if (!pr.latches.lens4 && hit(lens, 22)) {
        pr.latches.lens4 = true;
        G.sfx("hit");
        G.fx("FX_C", "light_spark", lens.x, lens.y + 20, 0.5, 60);
        G.toast("Penutup terbuka \u2014 cahaya matahari masuk!");
        G.save();
        return true;
      }
      if (!pr.unlocked.pin4 && hit(byId.pin4)) {
        pr.unlocked.pin4 = true;
        G.sfx("lock");
        G.toast("Pengunci cermin terakhir lepas.");
        G.save();
        return true;
      }
      for (const d of ofType("mirror")) {
        if (!hit(d, 18)) continue;
        if (d.lock && !pr.unlocked[d.lock]) {
          G.sfx("block");
          G.toast("Cermin ini terkunci dari belakang.", 1.6);
          return true;
        }
        pr.mirrors[d.id] = mirrorState(pr, d) === "/" ? "\\" : "/";
        G.sfx("click");
        G.fx("FX_C", "light_spark", d.x, d.y + 14, 0.3, 30);
        G.save();
        return true;
      }
    }
    if (area === 4) {
      for (const d of ofType("bell")) {
        if (!hit(d, 20)) continue;
        if (a.type !== "echo") {
          G.sfx("block");
          G.toast(pr.abilities.echo ? "Lonceng hanya bergema dengan Panah Gema." : "Lonceng ini diam\u2026 mungkin butuh panah khusus.", 1.8);
          return true;
        }
        return G.seqHit("bell", d);
      }
      for (const d of ofType("echoCrystal")) {
        if (!near(x, y, d.x, d.y - 24, 22)) continue;
        if (a.type !== "echo") {
          G.sfx("block");
          return true;
        }
        s.echo[d.bridge] = 6;
        G.sfx("bell");
        G.toast("Gema membentuk jembatan sesaat!", 1.6);
        return true;
      }
    }
    if (area === 5) {
      for (const d of ofType("fan")) {
        if (!near(x, y, (d.tx + 1) * T, d.ty * T + T / 2, 26)) continue;
        if (a.type !== "wind") {
          G.sfx("block");
          G.toast(pr.abilities.wind ? "Kipas hanya berputar dengan Panah Angin." : "Kipas ini butuh tiupan angin.", 1.6);
          return true;
        }
        const cur = fanDir(pr, d);
        pr.fans[d.id] = FAN_DIRS[(FAN_DIRS.indexOf(cur) + 1) % FAN_DIRS.length];
        G.sfx("swish");
        G.fx("FX_C", "wind_gust", (d.tx + 1) * T, d.ty * T + T, 0.4, 40);
        G.save();
        return true;
      }
      const pod = s.pod;
      if (!pod.done && near(x, y, pod.x, pod.y, 20)) {
        const sp = Math.hypot(a.vx, a.vy) || 1;
        pod.vx += a.vx / sp * 170;
        pod.vy += a.vy / sp * 170 - 110;
        pod.rest = 0;
        G.sfx("hit");
        return true;
      }
    }
    if (area === 6) {
      const f = byId.furnace7;
      if (near(x, y, f.x, f.y - 20, 26)) {
        if (a.type === "ember" && !pr.furnace) {
          pr.furnace = true;
          G.sfx("gate");
          G.fx("FX_C", "fire_burst", f.x, f.y, 0.6, 70);
          G.toast("Tungku menyala \u2014 panas mengalir ke rumah kaca!");
          G.save();
        } else if (!pr.furnace) G.toast("Tungku dingin. Butuh api\u2026", 1.6);
        return true;
      }
      for (const d of ofType("bramble")) {
        if (pr.burned[d.id] || x < d.x - 4 || x > d.x + d.w + 4 || y < d.y - 4 || y > d.y + d.h + 4) continue;
        if (a.type === "ember") {
          pr.burned[d.id] = true;
          setBlocks(pr);
          G.sfx("poof");
          G.fx("FX_C", "fire_burst", d.x + d.w / 2, d.y + d.h, 0.6, 70);
          G.save();
        } else {
          G.sfx("hit");
          G.toast("Semak kering\u2026 mudah terbakar.", 1.4);
        }
        return true;
      }
      for (const d of ofType("vent")) {
        if (!near(x, y, d.x, d.y - 16, 20)) continue;
        pr.vents[d.id] = !ventOpen(pr, d);
        G.sfx("lock");
        G.toast(pr.vents[d.id] ? "Ventilasi dibuka." : "Ventilasi ditutup.", 1.2);
        G.save();
        return true;
      }
    }
    if (area === 8) {
      for (const d of ofType("statue")) {
        if (!near(x, y, d.x, d.y - 40, 24)) continue;
        pr.statues[d.id] = (statuePhase(pr, d) + 1) % 3;
        G.sfx("click");
        G.fx("FX_C", "light_spark", d.x, d.y - 24, 0.3, 34);
        if (!pr.gates.gate9 && ofType("statue").every((q) => statuePhase(pr, q) === q.target)) G.openGate("gate9");
        G.save();
        return true;
      }
    }
    if (area === 9) {
      for (const d of ofType("ring")) {
        if (!near(x, y, d.pin.x, d.pin.y, 18)) continue;
        const r = s.rings[d.id];
        r.held = !r.held;
        G.sfx("lock");
        return true;
      }
      const core = byId.core10;
      if (near(x, y, core.x, core.y, 22)) {
        if (pr.gates.gate10) return true;
        const ok = ofType("ring").every((d) => s.rings[d.id].held && ringAligned(s.rings[d.id].ang));
        if (ok) G.openGate("gate10");
        else {
          G.sfx("block");
          G.toast("Ketiga simbol akar harus ditahan tepat di atas.", 1.8);
        }
        return true;
      }
    }
    if (area === 11 && !pr.seqs.spore) {
      for (const d of ofType("sporeLamp")) if (!s.seq.spore?.popped[d.id] && hit(d, 20)) return G.seqHit("spore", d);
    }
    if (area === 12 && !pr.gates.gate13)
      for (const d of ofType("starNode")) {
        if (!hit(d, 22)) continue;
        if (a.type !== "thread") {
          G.sfx("block");
          G.toast("Simpul bintang hanya terhubung dengan Panah Benang.", 1.6);
          return true;
        }
        linkStar(G, d.id);
        return true;
      }
    return false;
  }
  var ringAligned = (ang) => {
    const a = (ang % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    return a < 0.3 || a > Math.PI * 2 - 0.3;
  };
  function linkStar(G, id) {
    const { s } = G;
    const pr = s.pr;
    if (!s.starSel) {
      s.starSel = id;
      G.sfx("click");
      return;
    }
    if (s.starSel === id) {
      s.starSel = null;
      return;
    }
    const a = s.starSel;
    s.starSel = null;
    const key = edgeKey(a, id);
    if (STAR_BLOCKED.some(([p, q]) => edgeKey(p, q) === key)) {
      G.sfx("deny");
      G.toast("Akar hitam menghalangi benang ini.", 1.6);
      return;
    }
    if (!STAR_EDGES.some(([p, q]) => edgeKey(p, q) === key)) {
      G.sfx("deny");
      G.toast("Dua bintang ini terlalu jauh untuk dihubungkan.", 1.6);
      return;
    }
    pr.links[key] = !pr.links[key];
    G.sfx(pr.links[key] ? "rope" : "swish");
    G.save();
    const nodes = ofType("starNode");
    if (nodes.every((n) => starDegree(pr, n.id) === n.need) && starsConnected(pr, nodes)) {
      G.sfx("ability");
      G.openGate("gate13");
    }
  }
  function starsConnected(pr, nodes) {
    const seen = /* @__PURE__ */ new Set([nodes[0].id]);
    const stack = [nodes[0].id];
    while (stack.length) {
      const n = stack.pop();
      for (const k of Object.keys(pr.links)) {
        if (!pr.links[k]) continue;
        const [a, b2] = k.split("|");
        const o = a === n ? b2 : b2 === n ? a : null;
        if (o && !seen.has(o)) {
          seen.add(o);
          stack.push(o);
        }
      }
    }
    return seen.size === nodes.length;
  }
  function findInteract2(G, close) {
    const { s } = G;
    const pr = s.pr;
    for (const d of ofType("bellMural")) if (close(d, 44)) return { kind: "bellMural", id: d.id, label: "Baca" };
    for (const d of ofType("altar")) if (close(d, 40)) return { kind: "altar", id: d.id, label: "Sentuh" };
    for (const d of ofType("chest")) if (close(d, 40) && !pr.chests[d.id]) return { kind: "chest", id: d.id, label: "Buka" };
    for (const d of ofType("shardStart")) if (close(d, 40) && !pr.seqs.shards && !s.shardRun.active) return { kind: "shardStart", id: d.id, label: "Mulai" };
    return null;
  }
  function doInteract2(G, it) {
    const { s } = G;
    const pr = s.pr;
    const p = s.player;
    if (it.kind === "bellMural") {
      const d = byId[it.id];
      pr.murals[it.id] = true;
      const names = ["pertama", "kedua", "ketiga", "keempat", "kelima"];
      const bells = ofType("bell");
      const lines = d.reveals.map((o) => {
        const b2 = bells.find((q) => q.order === o);
        return `Nada ${names[o - 1]}: lonceng ke-${bells.indexOf(b2) + 1} dari kiri.`;
      });
      G.say("Mural Lagu", [...lines, "Simbolnya kini menyala di atas lonceng."], null);
      G.save();
    } else if (it.kind === "altar") {
      pr.side = pr.side ? 0 : 1;
      setSide(pr.side);
      p.mode = "interact";
      p.modeT = 0.4;
      p.animT = 0;
      G.sfx("bell");
      G.fx("FX_C", "light_spark", p.x, p.y - 20, 0.5, 70);
      G.toast(pr.side ? "Sisi Pantulan \u2014 jalan bulan terlihat." : "Sisi Nyata kembali.", 1.8);
      G.save();
    } else if (it.kind === "chest") {
      const d = byId[it.id];
      if (d.needs && !pr.seqs[d.needs]) {
        G.sfx("deny");
        G.toast(d.needs === "shards" ? "Terkunci \u2014 selesaikan tantangan kristal dulu." : "Terkunci \u2014 nyalakan lampu spora sesuai urutan.", 2);
        return;
      }
      pr.chests[it.id] = true;
      G.fx("FX_B", "sparkle", d.x, d.y - 10, 0.6, 50);
      G.giveItem(d.item);
      G.save();
    } else if (it.kind === "shardStart") {
      s.shardRun = { active: true, t: 40, got: {} };
      G.sfx("ability");
      G.banner("Kumpulkan 8 kristal!", 2);
    }
  }

  // ../.dart_tool/skybound_source/game/render2.js
  var TEMP_COL = ["#6fc3ff", "#8fe36a", "#ff6a3c"];
  function drawLight(ctx, s, t) {
    if (!s.light?.segs.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (const [x0, y0, x1, y1] of s.light.segs) {
      const ax = (x0 + 0.5) * T;
      const ay = (y0 + 0.5) * T;
      const bx = (x1 + 0.5) * T;
      const by = (y1 + 0.5) * T;
      ctx.strokeStyle = `rgba(255, 210, 90, ${0.28 + 0.06 * Math.sin(t * 5)})`;
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 250, 210, 0.85)";
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.restore();
  }
  function phaseDisc(ctx, x, y, r, phase) {
    ctx.fillStyle = "#1f2a4a";
    ctx.strokeStyle = "#2a170b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4f1d8";
    ctx.beginPath();
    if (phase === 2) ctx.arc(x, y, r - 1.5, 0, Math.PI * 2);
    else if (phase === 1) ctx.arc(x, y, r - 1.5, -Math.PI / 2, Math.PI / 2);
    if (phase > 0) ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  function drawWorld2(ctx, s, R) {
    const { img, fr, inView, t, drawCentered: drawCentered2, drawContained: drawContained2, roundRect, pips } = R;
    const pr = s.pr;
    const C = img("PROPS_C");
    const D = img("PROPS_D");
    const E = img("PROPS_E");
    const plankGlow = (x, y, w, rgb, on) => {
      if (on) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(${rgb}, 0.55)`;
        roundRect(x, y - 2, w, 12, 6);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = `rgba(${rgb}, 1)`;
        ctx.lineWidth = 2;
        roundRect(x, y - 2, w, 12, 6);
        ctx.stroke();
      } else {
        ctx.strokeStyle = `rgba(${rgb}, 0.35)`;
        ctx.setLineDash([5, 6]);
        ctx.lineWidth = 2;
        roundRect(x, y - 2, w, 12, 6);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };
    const lens = byId.lens4;
    if (inView(lens.x, lens.y, 900)) {
      drawCentered2(ctx, C, fr("PROPS_C", "sun_lens"), lens.x, lens.y - 2, 40);
      if (!pr.latches.lens4) drawCentered2(ctx, C, fr("PROPS_C", "shutter"), lens.x, lens.y + 6, 40);
      for (const d of ofType("mirror")) {
        const st = mirrorState(pr, d);
        drawCentered2(ctx, C, fr("PROPS_C", "mirror"), d.x, d.y, 30, st === "/" ? -Math.PI / 4 : Math.PI / 4);
        if (d.lock && !pr.unlocked[d.lock]) {
          ctx.strokeStyle = "#5a3b22";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(d.x - 16, d.y + 16);
          ctx.lineTo(d.x + 16, d.y - 16);
          ctx.stroke();
        }
      }
      const pin = byId.pin4;
      if (!pr.unlocked.pin4) drawCentered2(ctx, E, fr("PROPS_E", "lock_pin"), pin.x, pin.y, 28);
      const pz = byId.prism4;
      drawCentered2(ctx, C, fr("PROPS_C", "prism"), pz.x, pz.y, 34);
      for (const d of ofType("eye")) drawCentered2(ctx, C, fr("PROPS_C", s.light.eyes[d.id] ? "eye_on" : "eye_off"), d.x, d.y, 32);
      for (const b2 of ofType("lightbridge")) plankGlow(b2.x, b2.y, b2.w, "255, 215, 110", s.light.bridges[b2.id]);
    }
    for (const d of ofType("bell")) {
      if (!inView(d.x, d.y)) continue;
      const swing = Math.sin(t * 1.8 + d.x) * 0.08;
      ctx.strokeStyle = "#5a3b22";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - 60);
      ctx.lineTo(d.x, d.y - 16);
      ctx.stroke();
      drawCentered2(ctx, C, fr("PROPS_C", "bell"), d.x, d.y, 34, swing);
      const revealed = ofType("bellMural").some((m) => pr.murals[m.id] && m.reveals.includes(d.order));
      if (revealed && !pr.seqs.bell) pips(d.x, d.y + 28, d.order, s.seq.bell.popped[d.id]);
    }
    for (const d of ofType("bellMural")) if (inView(d.x, d.y)) drawContained2(ctx, C, fr("PROPS_C", "music_mural"), d.x, d.y + 2, 46, 44);
    for (const d of ofType("echoCrystal")) if (inView(d.x, d.y)) drawContained2(ctx, C, fr("PROPS_C", "echo_crystal"), d.x, d.y + 2, 34, 40);
    for (const b2 of ofType("echoBridge")) {
      if (!inView(b2.x, b2.y, 300)) continue;
      const left = s.echo[b2.id] || 0;
      plankGlow(b2.x, b2.y, b2.w, "190, 140, 255", left > 0 && (left > 1.2 || Math.floor(left * 8) % 2 === 0));
    }
    if (G6InView(inView)) {
      for (const z of windZones(pr)) {
        ctx.strokeStyle = "rgba(235, 250, 255, 0.5)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const k = (t * 0.9 + i / 5) % 1;
          ctx.beginPath();
          if (z.dir === "up") {
            const x = z.x + 8 + i * 13 % (z.w - 12);
            const y = z.y + z.h - k * z.h;
            ctx.moveTo(x, y);
            ctx.lineTo(x, y - 18);
          } else {
            const y = z.y + 8 + i * 11 % (z.h - 12);
            const x = z.dir === "right" ? z.x + k * z.w : z.x + z.w - k * z.w;
            ctx.moveTo(x, y);
            ctx.lineTo(x + (z.dir === "right" ? 18 : -18), y);
          }
          ctx.stroke();
        }
      }
      for (const d of ofType("fan")) {
        const cx = (d.tx + 1) * T;
        const cy = d.ty * T + T / 2;
        drawCentered2(ctx, C, fr("PROPS_C", "fan"), cx, cy, 44, t * 6);
        const dir = fanDir(pr, d);
        const ang = dir === "up" ? -Math.PI / 2 : dir === "right" ? 0 : Math.PI;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        ctx.fillStyle = "#9fe6ff";
        ctx.strokeStyle = "#2a170b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(18, -8);
        ctx.lineTo(18, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      for (const d of ofType("waystation")) drawContained2(ctx, C, fr("PROPS_C", "waystation"), d.x, d.y + 2, 30, 34);
      const h = byId.house6;
      drawContained2(ctx, C, fr("PROPS_C", "seed_house"), h.x, h.y + 2, 54, 52);
      const pod = s.pod;
      if (pod) drawCentered2(ctx, C, fr("PROPS_C", "seed_pod"), pod.x, pod.y, 30, Math.sin(t * 3) * 0.15);
    }
    const fur = byId.furnace7;
    if (inView(fur.x, fur.y, 900)) {
      ctx.strokeStyle = pr.furnace ? "#d77a2c" : "#7a5634";
      ctx.lineWidth = 5;
      ctx.lineJoin = "round";
      for (const v of ofType("vent")) {
        ctx.beginPath();
        ctx.moveTo(fur.x, fur.y - 30);
        ctx.lineTo(fur.x, fur.y - 30 - Math.max(0, Math.min(200, fur.y - v.y)) * 0.2);
        ctx.lineTo(v.x, fur.y - 30 - Math.max(0, Math.min(200, fur.y - v.y)) * 0.2);
        ctx.lineTo(v.x, v.y - 10);
        ctx.stroke();
      }
      drawContained2(ctx, D, fr("PROPS_D", pr.furnace ? "furnace_on" : "furnace_off"), fur.x, fur.y + 2, 60, 58);
      for (const r of ofType("room")) {
        const temp = Math.min(2, roomTemp(pr, r));
        ctx.fillStyle = `rgba(${temp === 0 ? "120,190,255" : temp === 1 ? "160,240,140" : "255,120,80"}, 0.12)`;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = "rgba(230, 245, 255, 0.55)";
        ctx.lineWidth = 2;
        ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
        for (let x = r.x + 32; x < r.x + r.w; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, r.y + 2);
          ctx.lineTo(x, r.y + r.h - 2);
          ctx.stroke();
        }
        const f = r.flower;
        drawContained2(ctx, D, fr("PROPS_D", "heat_flower"), f.x, f.y + 2, 26, 50);
        ctx.fillStyle = TEMP_COL[temp];
        ctx.strokeStyle = "#2a170b";
        ctx.beginPath();
        ctx.arc(f.x, f.y - 42, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        pips(f.x, f.y - 60, 3, false, false);
        ctx.fillStyle = TEMP_COL[temp];
        ctx.fillRect(f.x - 13 + temp * 9 - 3, f.y - 63, 6, 6);
      }
      for (const v of ofType("vent")) drawContained2(ctx, D, fr("PROPS_D", ventOpen(pr, v) ? "vent_open" : "vent_closed"), v.x, v.y + 2, 26, 32);
      for (const b2 of ofType("bramble")) if (!pr.burned[b2.id]) drawContained2(ctx, D, fr("PROPS_D", "bramble"), b2.x + b2.w / 2, b2.y + b2.h + 2, b2.w + 10, b2.h + 8);
    }
    for (const d of ofType("chest")) {
      if (!inView(d.x, d.y)) continue;
      const open = pr.chests[d.id];
      const locked = d.needs && !pr.seqs[d.needs];
      drawContained2(ctx, D, fr("PROPS_D", open ? "chest_open" : "chest_closed"), d.x, d.y + 2, 40, 34);
      if (locked) {
        ctx.fillStyle = "#2a170b";
        ctx.fillRect(d.x - 4, d.y - 22, 8, 10);
      }
    }
    for (const d of ofType("shardStart")) if (inView(d.x, d.y)) drawContained2(ctx, D, fr("PROPS_D", "crystal_cluster"), d.x, d.y + 2, 40, 46);
    if (s.shardRun?.active) {
      for (const d of ofType("shard")) if (!s.shardRun.got[d.id]) drawCentered2(ctx, D, fr("PROPS_D", "star_shard"), d.x, d.y + Math.sin(t * 4 + d.x) * 3, 24);
    }
    const tint = getSide() === 1;
    for (const d of ofType("altar")) if (inView(d.x, d.y)) drawContained2(ctx, D, fr("PROPS_D", "moon_altar"), d.x, d.y + 2, 54, 30);
    for (const d of ofType("statue")) {
      if (!inView(d.x, d.y)) continue;
      drawContained2(ctx, D, fr("PROPS_D", "moon_statue"), d.x, d.y + 2, 40, 50);
      phaseDisc(ctx, d.x, d.y - 40, 10, statuePhase(pr, d));
    }
    const g9 = byId.gate9;
    if (tint && !pr.gates.gate9 && inView(g9.x, g9.y, 300)) {
      ofType("statue").forEach((d, i) => phaseDisc(ctx, g9.x + 20 + i * 44, g9.y + g9.h + 20, 12, d.target));
    }
    if (tint && inView(T * 24, byId.statue1.y - 300, 900)) {
      ctx.fillStyle = "rgba(80, 110, 230, 0.13)";
      const top2 = byId.statue1.y - 32 * T;
      ctx.fillRect(0, top2, 48 * T, 33 * T);
    }
    for (const d of ofType("rotplat")) {
      const p = rotPos(d, s.mechT);
      if (!inView(p.x, p.y)) continue;
      ctx.strokeStyle = "rgba(90, 60, 30, 0.5)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(d.cx, d.cy);
      ctx.lineTo(p.x, p.y + 8);
      ctx.stroke();
      drawContained2(ctx, E, fr("PROPS_E", "gear_platform"), p.x, p.y + 20, d.w + 10, 26);
    }
    for (const d of ofType("pendulum")) {
      const b2 = pendulumPos(d, s.mechT);
      if (!inView(b2.x, b2.y)) continue;
      ctx.strokeStyle = "#7a5634";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(d.ax, d.ay);
      ctx.lineTo(b2.x, b2.y);
      ctx.stroke();
      drawCentered2(ctx, E, fr("PROPS_E", "pendulum"), b2.x, b2.y, 44, -b2.a);
    }
    const allAligned = ofType("ring").every((d) => s.rings?.[d.id]?.held && ringAligned(s.rings[d.id].ang));
    for (const d of ofType("ring")) {
      if (!inView(d.x, d.y)) continue;
      const r = s.rings[d.id];
      drawCentered2(ctx, E, fr("PROPS_E", "gear_ring"), d.x, d.y, d.r * 2, r.ang);
      ctx.fillStyle = ringAligned(r.ang) ? "#ffd84a" : "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - d.r - 14);
      ctx.lineTo(d.x - 6, d.y - d.r - 24);
      ctx.lineTo(d.x + 6, d.y - d.r - 24);
      ctx.closePath();
      ctx.fill();
      drawCentered2(ctx, E, fr("PROPS_E", "lock_pin"), d.pin.x, d.pin.y, 26, r.held ? Math.PI / 2 : 0);
    }
    const core = byId.core10;
    if (inView(core.x, core.y)) {
      if (allAligned && !pr.gates.gate10) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(120, 255, 230, ${0.4 + 0.3 * Math.sin(t * 10)})`;
        ctx.beginPath();
        ctx.arc(core.x, core.y, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      drawCentered2(ctx, E, fr("PROPS_E", "gear_core"), core.x, core.y, 34);
    }
    for (const d of ofType("enemy")) if (d.kind === "totem" && pr.got[d.id] && inView(d.x, d.y)) drawContained2(ctx, E, fr("PROPS_E", "totem_broken"), d.x, d.y + 2, 44, 70);
    for (const d of ofType("sporeLamp")) {
      if (!inView(d.x, d.y)) continue;
      const lit = pr.seqs.spore || s.seq.spore?.popped[d.id];
      if (lit) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(100, 255, 220, 0.35)";
        ctx.beginPath();
        ctx.arc(d.x, d.y, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      drawCentered2(ctx, E, fr("PROPS_E", "spore_lamp"), d.x, d.y + Math.sin(t * 2 + d.x) * 3, 30);
      if (!pr.seqs.spore) pips(d.x, d.y - 26, d.order, lit);
    }
    const nodes = ofType("starNode");
    if (inView(nodes[0].x, nodes[0].y, 1200)) {
      const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));
      ctx.lineCap = "round";
      for (const [a, b2] of STAR_BLOCKED) {
        ctx.strokeStyle = "#1a1220";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(pos[a].x, pos[a].y);
        ctx.quadraticCurveTo((pos[a].x + pos[b2].x) / 2, (pos[a].y + pos[b2].y) / 2 + 30, pos[b2].x, pos[b2].y);
        ctx.stroke();
      }
      for (const [a, b2] of STAR_EDGES) {
        const key = a < b2 ? `${a}|${b2}` : `${b2}|${a}`;
        const on = pr.links[key];
        ctx.strokeStyle = on ? "rgba(255, 225, 120, 0.95)" : "rgba(255, 255, 255, 0.18)";
        ctx.lineWidth = on ? 3.5 : 1.5;
        ctx.setLineDash(on ? [] : [4, 8]);
        ctx.beginPath();
        ctx.moveTo(pos[a].x, pos[a].y);
        ctx.lineTo(pos[b2].x, pos[b2].y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      for (const n of nodes) {
        const deg = starDegree(pr, n.id);
        drawCentered2(ctx, E, fr("PROPS_E", deg === n.need ? "star_node_lit" : "star_node"), n.x, n.y, 34);
        pips(n.x, n.y + 26, n.need, deg === n.need);
        if (s.starSel === n.id) {
          ctx.strokeStyle = `rgba(255, 240, 160, ${0.6 + 0.3 * Math.sin(t * 10)})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 24, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }
  function G6InView(inView) {
    const h = byId.house6;
    return inView(h.x, h.y, 1100);
  }

  // ../.dart_tool/skybound_source/game/player.js
  var approach = (v, t, d) => v < t ? Math.min(t, v + d) : Math.max(t, v - d);
  function newPlayer(x, y, maxHp, focusMax) {
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      w: PLAYER_W,
      h: PLAYER_H,
      face: 1,
      mode: "getup",
      modeT: 0.6,
      animT: 0,
      hp: maxHp,
      maxHp,
      energy: 100,
      focus: focusMax,
      focusMax,
      coyote: 0,
      airJumps: 1,
      jumpBuf: 0,
      dashCd: 0,
      airDash: true,
      iFrames: 0.8,
      onGround: false,
      plat: null,
      dropT: 0,
      ledgeCd: 0,
      ledge: null,
      rope: null,
      carry: null,
      aiming: false,
      drawT: 0,
      aimX: 1,
      aimY: 0,
      releaseT: 0,
      arrowType: "normal",
      landT: 0,
      jumpT: 0,
      turnT: 0,
      fallV: 0,
      safe: { x, y },
      safeT: 0
    };
  }
  function vineAt(x, y) {
    return tileAt(Math.floor(x / T), Math.floor(y / T)) === TILE.VINE;
  }
  function updatePlayer(G, dt) {
    const { s, inp } = G;
    const p = s.player;
    const locked = G.inputLocked();
    const ax = locked ? 0 : inp.axisX();
    const ay = locked ? 0 : inp.axisY();
    const jumpPressed = !locked && inp.jumpPressed;
    const jumpHeld = !locked && inp.jumpHeld;
    const run = G.tw.runSpeed;
    const jumpV = G.tw.jumpPower;
    p.iFrames -= dt;
    p.coyote -= dt;
    p.jumpBuf -= dt;
    p.dashCd -= dt;
    p.dropT -= dt;
    p.ledgeCd -= dt;
    p.landT -= dt;
    p.jumpT -= dt;
    p.turnT -= dt;
    p.releaseT -= dt;
    p.animT += dt;
    p.soundT = Math.max(0, (p.soundT || 0) - dt);
    const movingSound = p.mode === "normal" && p.onGround && Math.abs(p.vx) > 35 && ax !== 0 ? "step" : p.mode === "vine" && ay !== 0 ? "climb" : p.mode === "swim" && (ax !== 0 || ay !== 0) ? "water" : null;
    if (movingSound && p.soundT <= 0) {
      G.sfx(movingSound);
      p.soundT = movingSound === "water" ? 0.65 : 0.32;
    }
    if (jumpPressed) p.jumpBuf = 0.13;
    if (p.plat) {
      const pl = G.plats.find((q) => q.id === p.plat);
      if (pl && p.mode === "normal") {
        const ny = p.y + (pl.top - pl.prevTop);
        const nx = p.x + (pl.prevX !== void 0 ? pl.x - pl.prevX : 0);
        if (!overlapsSolid(nx, ny, p.w, p.h)) {
          p.x = nx;
          p.y = ny;
        } else if (!overlapsSolid(p.x, ny, p.w, p.h)) p.y = ny;
      } else if (!pl) p.plat = null;
    }
    switch (p.mode) {
      case "dead":
        p.modeT -= dt;
        p.vx *= 0.9;
        p.vy = Math.min(p.vy + 1500 * dt, 700);
        moveBody(p, p.vx * dt, p.vy * dt, G.plats);
        if (p.modeT <= 0) G.respawn();
        return;
      case "getup":
      case "ability":
      case "interact":
        p.modeT -= dt;
        p.vx = 0;
        p.vy = Math.min(p.vy + 1500 * dt, 700);
        landAndProbe(G, moveBody(p, 0, p.vy * dt, G.plats));
        if (p.modeT <= 0) setMode(p, "normal");
        return;
      case "trapped":
        p.modeT -= dt * (jumpPressed ? 6 : 1);
        p.vx = 0;
        p.vy = -20;
        moveBody(p, 0, p.vy * dt, G.plats);
        if (p.modeT <= 0) {
          setMode(p, "normal");
          G.sfx("bubble");
        }
        return;
      case "hurt":
        p.modeT -= dt;
        p.vx = approach(p.vx, 0, 600 * dt);
        p.vy = Math.min(p.vy + 1500 * dt, 760);
        landAndProbe(G, moveBody(p, p.vx * dt, p.vy * dt, G.plats));
        if (p.modeT <= 0) setMode(p, "normal");
        hazards(G);
        return;
      case "dash": {
        p.modeT -= dt;
        const r2 = moveBody(p, p.vx * dt, 0, G.plats);
        if (r2.wallL || r2.wallR) p.modeT = 0;
        if (Math.random() < 0.6) G.particle(p.x - p.face * 10, p.y - 20 + Math.random() * 16, -p.face * 60, -10, "#fff6d8", 3, 0.25);
        if (p.modeT <= 0) {
          setMode(p, "normal");
          p.vx = p.face * run * 0.9;
          p.vy = 0;
        }
        hazards(G);
        return;
      }
      case "ledge": {
        p.vx = 0;
        p.vy = 0;
        const L = p.ledge;
        if (!L || !isSolid(L.tx, L.ty)) {
          setMode(p, "normal");
          return;
        }
        if (jumpPressed || ay < 0) {
          setMode(p, "climb", 0.32);
          G.sfx("climb");
        } else if (ay > 0 || ax !== 0 && Math.sign(ax) === -L.dir) {
          setMode(p, "normal");
          p.ledgeCd = 0.35;
        }
        return;
      }
      case "climb": {
        p.modeT -= dt;
        if (p.modeT <= 0) {
          const L = p.ledge;
          p.x = L.dir > 0 ? L.tx * T + p.w / 2 + 3 : (L.tx + 1) * T - p.w / 2 - 3;
          p.y = L.ty * T;
          p.vy = 0;
          p.onGround = true;
          setMode(p, "normal");
        }
        return;
      }
      case "vine": {
        p.vx = 0;
        p.vy = ay * 125;
        const midY = p.y - p.h / 2;
        if (!vineAt(p.x, midY + Math.sign(p.vy) * 8) && p.vy < 0) {
          setMode(p, "normal");
          p.vy = -330;
          return;
        }
        const r2 = moveBody(p, 0, p.vy * dt, G.plats);
        if (p.vy === 0) p.animT -= dt;
        if (jumpPressed) {
          setMode(p, "normal");
          p.vy = -jumpV * 0.82;
          p.vx = ax * run;
          p.jumpT = 0.15;
          G.sfx("jump");
          return;
        }
        if (ax !== 0 && ay === 0) {
          setMode(p, "normal");
          p.face = Math.sign(ax);
          p.vx = ax * run * 0.7;
          return;
        }
        if (r2.ground && ay > 0) setMode(p, "normal");
        if (!vineAt(p.x, p.y - p.h / 2)) setMode(p, "normal");
        return;
      }
      case "rope": {
        const R = p.rope;
        const g2 = 1500;
        R.angV += (-(g2 / R.len) * Math.sin(R.ang) + ax * 4.2) * dt;
        R.angV *= 1 - 0.25 * dt;
        if (ay !== 0) R.len = Math.max(50, Math.min(260, R.len + ay * 110 * dt));
        const prevAng = R.ang;
        R.ang += R.angV * dt;
        const hx = R.ax + Math.sin(R.ang) * R.len;
        const hy = R.ay + Math.cos(R.ang) * R.len;
        const nx = hx;
        const ny = hy + p.h + 6;
        if (overlapsSolid(nx, ny, p.w, p.h)) {
          R.ang = prevAng;
          R.angV *= -0.35;
        } else {
          p.x = nx;
          p.y = ny;
        }
        if (Math.abs(R.angV) > 0.2) p.face = R.angV > 0 ? 1 : -1;
        if (jumpPressed || G.ropeBroken()) {
          const tvx = Math.cos(R.ang) * R.len * R.angV;
          const tvy = -Math.sin(R.ang) * R.len * R.angV;
          p.vx = tvx;
          p.vy = Math.min(tvy, 0) - 280;
          p.rope = null;
          setMode(p, "normal");
          p.jumpT = 0.15;
          G.sfx("rope");
        }
        return;
      }
      case "swim": {
        const surf = G.waterSurfaceAt(p.x, p.y - p.h / 2);
        if (surf === null) {
          setMode(p, "normal");
          return;
        }
        p.vx = approach(p.vx, ax * 135, 600 * dt);
        const target2 = ay !== 0 ? ay * 125 : -40;
        p.vy = approach(p.vy, target2, 500 * dt);
        if (ax !== 0) p.face = Math.sign(ax);
        const nearSurface = p.y - p.h * 0.75 < surf;
        if (nearSurface && p.vy < 0) p.vy = Math.max(p.vy, (surf - (p.y - p.h * 0.6)) * 4);
        if (nearSurface && jumpPressed) {
          setMode(p, "normal");
          p.vy = -jumpV * 0.95;
          p.jumpT = 0.15;
          G.splash(p.x, surf);
          return;
        }
        landAndProbe(G, moveBody(p, p.vx * dt, p.vy * dt, G.plats));
        p.airDash = true;
        hazards(G);
        return;
      }
      default:
        break;
    }
    const speed = run * (p.carry ? 0.85 : 1);
    let target = ax * speed;
    if (p.aiming && p.onGround) target = 0;
    p.vx = approach(p.vx, target, (p.onGround ? 1900 : 1200) * dt);
    if (ax !== 0 && !p.aiming) {
      const nf = Math.sign(ax);
      if (nf !== p.face && p.onGround && Math.abs(p.vx) > 80) p.turnT = 0.16;
      p.face = nf;
    }
    if (p.jumpBuf > 0 && (p.onGround || p.coyote > 0)) {
      if (ay > 0 && p.onGround && standingOnOneWay(G, p)) {
        p.dropT = 0.22;
        p.jumpBuf = 0;
      } else {
        p.vy = -jumpV;
        p.onGround = false;
        p.coyote = 0;
        p.jumpBuf = 0;
        p.jumpT = 0.15;
        p.plat = null;
        G.sfx("jump");
        G.fx("FX_A", "dust", p.x, p.y, 0.35, 34);
      }
    } else if (p.jumpBuf > 0 && p.airJumps > 0 && !p.onGround) {
      p.vy = -jumpV * 0.9;
      p.airJumps -= 1;
      p.jumpBuf = 0;
      p.jumpT = 0.15;
      G.sfx("jump");
      G.fx("FX_A", "dust", p.x, p.y, 0.35, 34);
    }
    const g = 1500 * (p.vy < 0 && !jumpHeld ? 2.3 : 1);
    p.vy = Math.min(p.vy + g * dt, 760);
    if (!locked && inp.dashPressed && p.dashCd <= 0 && (p.onGround || p.airDash) && !p.carry) {
      setMode(p, "dash", 0.17);
      p.vx = p.face * G.tw.dashSpeed;
      p.vy = 0;
      if (!p.onGround) p.airDash = false;
      p.dashCd = 0.42;
      p.iFrames = Math.max(p.iFrames, 0.17);
      p.aiming = false;
      G.sfx("dash");
      G.fx("FX_A", "dust", p.x, p.y, 0.3, 30, p.face < 0);
      return;
    }
    p.fallV = Math.max(p.fallV, p.vy);
    const r = moveBody(p, p.vx * dt, p.vy * dt, G.plats, p.dropT > 0);
    landAndProbe(G, r);
    if (!p.onGround && p.vy > -60 && p.ledgeCd <= 0 && !p.aiming) {
      const pushing = ax !== 0 && Math.sign(ax) === p.face;
      if (pushing || r.wallL || r.wallR) tryLedge(G, p);
    }
    if (p.mode === "normal" && ay < 0 && vineAt(p.x, p.y - p.h / 2) && !p.aiming) {
      setMode(p, "vine");
      p.x = Math.floor(p.x / T) * T + T / 2;
      p.vx = 0;
      p.plat = null;
    } else if (p.mode === "normal" && ay > 0 && !p.onGround && vineAt(p.x, p.y - p.h / 2)) {
      setMode(p, "vine");
      p.x = Math.floor(p.x / T) * T + T / 2;
    }
    if (p.mode === "normal" && G.waterSurfaceAt(p.x, p.y - p.h * 0.4) !== null) {
      setMode(p, "swim");
      G.splash(p.x, G.waterSurfaceAt(p.x, p.y - p.h * 0.4));
      p.vy *= 0.3;
    }
    hazards(G);
    p.safeT -= dt;
    if (p.onGround && !p.plat && p.safeT <= 0) {
      const tl = isSolid(Math.floor((p.x - p.w / 2) / T), Math.floor((p.y + 2) / T));
      const tr = isSolid(Math.floor((p.x + p.w / 2) / T), Math.floor((p.y + 2) / T));
      if (tl && tr && !touchesTile(p.x, p.y + 4, p.w + 40, p.h + 8, TILE.THORN)) {
        p.safe = { x: p.x, y: p.y };
        p.safeT = 0.25;
      }
    }
  }
  function setMode(p, mode, t = 0) {
    p.mode = mode;
    p.modeT = t;
    p.animT = 0;
    if (mode !== "normal") p.aiming = false;
    if (mode === "ledge" || mode === "vine") p.airJumps = 1;
  }
  function landAndProbe(G, r) {
    const p = G.s.player;
    if (r.ground) {
      if (!p.onGround && p.fallV > 380) {
        p.landT = 0.18;
        G.sfx("land");
        G.fx("FX_A", "dust", p.x, p.y, 0.35, 36);
      }
      p.onGround = true;
      p.plat = r.plat;
      p.airDash = true;
      p.airJumps = 1;
      p.coyote = 0.1;
      p.fallV = 0;
    } else {
      const probe = groundProbe(p, G.plats);
      if (probe.ground && p.vy >= 0) {
        p.onGround = true;
        p.plat = probe.plat;
        p.coyote = 0.1;
      } else {
        if (p.onGround) p.coyote = 0.1;
        p.onGround = false;
        p.plat = null;
      }
    }
  }
  function standingOnOneWay(G, p) {
    if (p.plat) return true;
    const row = Math.floor((p.y + 1) / T);
    return isOneWayTile(tileAt(Math.floor(p.x / T), row));
  }
  function tryLedge(G, p) {
    const dir = p.face;
    const wallX = dir > 0 ? p.x + p.w / 2 + 3 : p.x - p.w / 2 - 3;
    const tx = Math.floor(wallX / T);
    const headY = p.y - p.h;
    for (const off of [0, 1]) {
      const ty = Math.floor(headY / T) + off;
      if (!isSolid(tx, ty) || isSolid(tx, ty - 1) || isSolid(tx, ty - 2)) continue;
      const myCol = Math.floor(p.x / T);
      if (isSolid(myCol, ty - 1)) continue;
      const ledgeTop = ty * T;
      if (headY > ledgeTop - 14 && headY < ledgeTop + 22) {
        p.ledge = { tx, ty, dir };
        p.x = dir > 0 ? tx * T - p.w / 2 - 0.5 : (tx + 1) * T + p.w / 2 + 0.5;
        p.y = ledgeTop + p.h + 4;
        p.vx = 0;
        p.vy = 0;
        p.mode = "ledge";
        p.modeT = 0;
        p.animT = 0;
        p.plat = null;
        G.sfx("land");
        return true;
      }
    }
    return false;
  }
  function hazards(G) {
    const p = G.s.player;
    if (p.mode === "dead") return;
    if (touchesTile(p.x, p.y, p.w - 6, p.h - 6, TILE.THORN)) G.hurt(1, { fall: true });
  }
  function attachRope(G, ax, ay) {
    const p = G.s.player;
    const hx = p.x;
    const hy = p.y - p.h - 6;
    const dx = hx - ax;
    const dy = hy - ay;
    const len = Math.max(50, Math.hypot(dx, dy));
    const ang = Math.atan2(dx, dy);
    const angV = (p.vx * Math.cos(ang) - p.vy * Math.sin(ang)) / len;
    p.rope = { ax, ay, len, ang, angV };
    setMode(p, "rope");
    p.plat = null;
    p.onGround = false;
  }

  // ../.dart_tool/skybound_source/game/story.js
  var NPC_NAMES = {
    bird: "Burung Pemandu",
    lumi: "Tetua Lumi",
    simpul: "Pak Simpul",
    nira: "Nira",
    sora: "Penjaga Kuil Sora",
    librarian: "Pustakawan Gema",
    bayu: "Bayu",
    rara: "Rara",
    hermit: "Pertapa Bulan",
    tiko: "Tiko",
    guntur: "Guntur",
    spirit: "Roh Pohon"
  };
  function npcLines(npc, pr) {
    switch (npc) {
      case "bird":
        if (!pr.bosses.boss1)
          return [
            "Cip! Aera, pohonnya menutup diri semalam!",
            "Tetua Lumi ada di taman kanan bawah. Lompati duri ungu itu, ya.",
            "Dinding yang terlalu tinggi? Lompat ke arahnya \u2014 kamu bisa berpegangan di tepi."
          ];
        if (!pr.abilities.sprout) return ["Induk Lumut sudah tenang! Bicaralah dengan Tetua Lumi."];
        return [
          "Akar yang dialiri embun berwarna biru. Kuncup hijau berarti siap ditumbuhkan!",
          "Tembak pengait batu untuk membuka saluran. Sambungan akar bisa diputar dengan panah."
        ];
      case "lumi":
        if (!pr.bosses.boss1) return ["Aera! Induk Lumut mengamuk di tamanku\u2026 hati-hati!"];
        if (!pr.abilities.sprout)
          return [
            "Terima kasih, Nak. Taman ini hampir mati, tapi busurmu bisa menolongnya.",
            "Ambil Panah Tunas ini. Tembakkan ke akar subur yang bercahaya hijau, dan pijakan akan tumbuh.",
            "Embun di tengah lembah harus mengalir ke tiga kebun. Kalau ketiganya mekar, akar mati di atas akan menjadi tangga."
          ];
        return ["Tiga kebun, tiga cahaya. Akar mati di puncak lembah akan mengingat jalan pulang."];
      case "simpul":
        if (!pr.abilities.thread)
          return [
            "Hah! Pemanah dari bawah? Jembatan kami putus semua sejak pohon menutup.",
            "Bawa Panah Benang ini. Ia menempel pada cincin jangkar \u2014 tembak, lalu berayunlah!",
            "Benangnya juga bisa menarik benda ringan, seperti buah batu, langsung ke tanganmu.",
            "Pintu kayu di atas butuh tiga lift sejajar dengan tanda di tiangnya. Bentuk buah = bobotnya."
          ];
        return [
          "Bulat itu satu, segitiga dua, kotak tiga. Lift makin tinggi kalau keranjangnya makin berat.",
          "Kalau sudah pas, panah pasak merahnya supaya terkunci. Tuas di dek kiri mengosongkan keranjang."
        ];
      case "nira":
        if (pr.gates.dome) return ["Kubahnya sudah jadi arus! Naiklah dari ruang Penjaga Kanal."];
        return [
          "Selamat datang di Kota Air Terbalik. Airnya mengalir ke atas, tapi tekanannya kacau.",
          "Mural di sebelahku menunjukkan ketinggian yang benar untuk tiga waduk.",
          "Katup Sumber mengisi waduk bawah. Katup Hubung ada di tepian kiri \u2014 rakit bisa membawamu ke sana.",
          "Kalau kacau, tarik tuas di sebelah mural untuk mengosongkan semuanya."
        ];
      case "sora":
        if (pr.gates.gate4) return ["Mata Sang Penjaga terbuka. Matahari kembali menyinari kuil."];
        return [
          "Kuil ini dulu memantulkan matahari ke seluruh pohon.",
          "Panah penutup lensa di langit-langit, lalu putar cermin dengan panahmu.",
          "Cermin terakhir terkunci dari belakang \u2014 jembatan cahaya bisa membawamu ke sana.",
          "Prisma akan membagi cahaya ke tiga mata patung."
        ];
      case "librarian":
        if (!pr.abilities.echo)
          return [
            "Sst\u2026 menara ini kehilangan lagunya.",
            "Ambil Panah Gema. Lonceng dan kristal resonansi hanya menjawab gema.",
            "Tiga mural menyimpan potongan lagu. Baca semuanya, lalu bunyikan lima lonceng di aula atas sesuai urutan."
          ];
        return ["Kristal ungu di dek tengah memunculkan jembatan sesaat. Mural ketiga ada di seberangnya."];
      case "bayu":
        if (!pr.abilities.wind)
          return [
            "Angin di sini liar sekali! Benih besar itu harus sampai ke rumah benih di atas.",
            "Bawa Panah Angin ini. Tembak kipas untuk memutar arahnya: atas, kanan, kiri.",
            "Benihnya mengikuti angin. Kalau jatuh ke duri, ia kembali ke sarang singgah terakhir."
          ];
        return ["Kipas yang mengarah ke atas juga bisa mengangkatmu, lho!"];
      case "rara":
        if (!pr.abilities.ember)
          return [
            "Bunga raksasa di atas membeku karena kebun ini kehilangan kehangatannya.",
            "Ini Panah Bara. Nyalakan tungku di tengah, dan bakar semak kering yang menutup rumah kaca.",
            "Setiap rumah kaca harus HANGAT \u2014 bunga hijau. Biru terlalu dingin, merah terlalu panas.",
            "Panah ventilasi untuk membuka atau menutupnya. Satu ventilasi bisa menghangatkan dua ruang!"
          ];
        return ["Hitung dari pipanya: tiap ventilasi terbuka menambah panas ke ruang yang disambungnya."];
      case "hermit":
        if (pr.gates.gate9) return ["Pantulan dan kenyataan kini selaras."];
        return [
          "Danau ini menyimpan dua dunia. Sentuh altar untuk berpindah ke Sisi Pantulan.",
          "Di Sisi Pantulan, jalan bulan muncul dan pintu menunjukkan fase bulan yang dicarinya.",
          "Panah patung bulan untuk mengubah fasenya sampai cocok dengan pintu."
        ];
      case "tiko":
        if (pr.gates.gate10) return ["Detaknya kembali selaras! Mantap!"];
        return [
          "Tiga roda akar di ruang kontrol berputar tidak seirama.",
          "Panah pasak di bawah roda untuk menahannya. Tahan tiap roda saat daun akarnya tepat di atas.",
          "Kalau ketiganya tertahan sejajar, panah inti biru di ujung ruangan.",
          "Hati-hati dengan bandul dan Golem Jam yang menjaga ruang itu!"
        ];
      case "guntur":
        if (pr.gates.gate11) return ["Badai sudah jinak. Naiklah, Pemanah."];
        return [
          "Tak ada teka-teki di sini \u2014 hanya badai.",
          "Hancurkan tiga totem petir dan kalahkan Naga Awan, maka segel petir padam."
        ];
      case "spirit":
        if (pr.gates.gate13) return ["Jantung pohon menunggumu di dalam cangkang. Bebaskan penjaganya."];
        return [
          "Kau sampai di mahkota, Aera. Jantung pohon terkunci di cangkang bintang.",
          "Hubungkan simpul bintang dengan Panah Benang: tembak satu simpul, lalu simpul lain.",
          "Angka titik di bawah tiap bintang adalah jumlah benangnya. Akar hitam tak bisa dilewati benang.",
          "Semua bintang harus tersambung menjadi satu rasi."
        ];
      default:
        return ["\u2026"];
    }
  }
  var MURAL_LINES = [
    `Mural Tiga Waduk: bawah ${"\u25CF".repeat(WATER_TARGET.L)}, tengah ${"\u25CF".repeat(WATER_TARGET.M)}, atas ${"\u25CF".repeat(WATER_TARGET.U)}.`,
    "Air hanya bisa berpindah ke atas: sumber \u2192 bawah \u2192 tengah \u2192 atas."
  ];
  function objective(pr, area) {
    if (area === 0) {
      if (!pr.bosses.boss1)
        return ["Temui Tetua Lumi di taman kanan bawah.", "Induk Lumut menjaga taman itu. Panah dia saat mendarat.", "Lompati duri ungu, naiki balok tinggi dengan berpegangan di tepinya, lalu terus ke kanan."];
      if (!pr.abilities.sprout) return ["Bicara dengan Tetua Lumi.", "Ia berdiri di ujung kanan taman.", "Dekati dia lalu tekan tombol tangan."];
      if (!pr.gates.gate1) {
        const missing = [];
        if (!pr.latches.latchL) missing.push(["Pengait di gua kiri masih tertutup.", "Panjat sulur di ujung kiri bawah, masuk gua, lalu panah pengait batu."]);
        else if (!pr.gardens.gardenL) missing.push(["Kebun di gua kiri sudah basah tapi belum tumbuh.", "Ganti ke Panah Tunas (slot panah), lalu tembak kebun di gua."]);
        if (!pr.latches.latchR) missing.push(["Pengait kanan di tiang akar masih tertutup.", "Dari dek tengah, panah pengait di sisi kanan tiang akar."]);
        else if (pr.switches.switchR !== 1) missing.push(["Sambungan akar di kanopi kanan mengarah ke ujung buntu.", "Naik ke kanopi kanan dan panah roda sambungan sekali."]);
        else if (!pr.gardens.gardenR) missing.push(["Kebun di kanopi kanan sudah basah.", "Tembak kebun kanopi dengan Panah Tunas."]);
        if (!pr.latches.latchU) missing.push(["Pengait atas di sisi kiri tiang akar masih tertutup.", "Dari dek tengah, bidik ke kanan atas ke pengait di tiang."]);
        else if (!pr.gardens.gardenU) missing.push(["Kebun di landasan gerbang sudah basah.", "Tumbuhkan pijakan di dinding hijau kiri dek tengah, naik, lalu tembak kebunnya."]);
        const m = missing[0] ?? ["Semua kebun hampir siap.", "Periksa kebun yang belum mekar."];
        return ["Alirkan embun ke tiga kebun, lalu tumbuhkan dengan Panah Tunas.", m[0], m[1]];
      }
      return ["Naiki tangga akar di atas landasan gerbang.", "Landasan gerbang ada di atas dek tengah.", "Tumbuhkan pijakan di dinding hijau, atau lewat tiang akar dari kanopi kanan."];
    }
    if (area === 1) {
      if (!pr.abilities.thread) return ["Temui Pak Simpul di sarang kiri bawah.", "Ia tinggal di ujung kiri lantai kanopi.", "Jalan ke kiri dari tangga akar."];
      if (!pr.gates.door2) {
        const w = pr.basketW || { A: 0, B: 0, C: 0 };
        const need = { A: 1, B: 2, C: 3 };
        const names = { A: "pertama", B: "kedua", C: "ketiga" };
        for (const k of ["A", "B", "C"]) {
          if (pr.locked[k]) continue;
          if (w[k] !== need[k])
            return [
              "Sejajarkan ketiga lift dengan tanda di tiang, lalu panah pasaknya.",
              w[k] < need[k] ? `Lift ${names[k]} masih terlalu rendah.` : `Lift ${names[k]} terlalu tinggi.`,
              "Bentuk buah = bobot: bulat 1, segitiga 2, kotak 3. Tarik buah dengan Panah Benang, bawa ke keranjang dan tekan tombol tangan."
            ];
          return ["Sejajarkan ketiga lift, lalu panah pasaknya.", `Lift ${names[k]} sudah sejajar.`, "Tembak pasak merah di tiangnya agar terkunci."];
        }
        return ["Pintu kayu sedang terbuka.", "Naik lewat lift yang terkunci.", "Lompat dari lift ketiga ke landasan."];
      }
      return ["Naik melalui pintu kayu yang terbuka.", "Landasan pintu ada di atas lift ketiga.", "Gunakan lift terkunci sebagai tangga."];
    }
    if (area >= 3) return objective2(pr, area);
    if (!pr.gates.dome) {
      const w = pr.water;
      const t = WATER_TARGET;
      let tip;
      if (w.L > t.L && w.M >= t.M) tip = ["Waduk bawah terlalu penuh.", "Putar Katup Buang di lantai bawah."];
      else if (w.U < t.U && w.M === 0) tip = ["Waduk tengah kosong, jadi waduk atas tak bisa diisi.", "Isi waduk bawah, lalu pakai Katup Hubung di tepian kiri."];
      else if (w.U < t.U) tip = ["Waduk atas belum cukup.", "Naik rakit tengah ke kanal kanan, kalahkan penjaganya, lalu putar Katup Kanal."];
      else if (w.U > t.U) tip = ["Waduk atas terlalu penuh.", "Tarik tuas reset di sebelah mural lalu ulangi lebih hati-hati."];
      else if (w.M < t.M) tip = ["Waduk tengah masih kurang.", "Pindahkan air dari waduk bawah lewat Katup Hubung."];
      else if (w.M > t.M) tip = ["Waduk tengah terlalu penuh.", "Pindahkan air tengah ke atas lewat Katup Kanal, atau reset."];
      else if (w.L < t.L) tip = ["Waduk bawah masih kurang.", "Putar Katup Sumber sekali."];
      else tip = ["Tekanannya hampir seimbang.", "Periksa mural."];
      return ["Samakan ketinggian tiga waduk dengan mural.", tip[0], tip[1]];
    }
    return ["Naiki arus air di ruang Penjaga Kanal.", "Ruangnya di ujung kanal kanan atas.", "Masuk ke kolom air yang naik di langit-langit."];
  }
  function objective2(pr, area) {
    const up = "Naik melalui segel yang terbuka.";
    switch (area) {
      case 3:
        if (pr.gates.gate4) return [up, "Tangga ada di atas landasan kiri.", "Naiki teras barat, lalu landasan."];
        if (!pr.latches.lens4) return ["Nyalakan Mata Sang Penjaga.", "Lensa matahari di langit-langit masih tertutup.", "Panah penutup lensa tepat di atas teras barat."];
        if (!pr.unlocked.pin4) return ["Nyalakan Mata Sang Penjaga.", "Cermin kanan terkunci dari belakang.", "Arahkan cermin kiri agar cahaya ke kanan, lalu seberangi jembatan cahaya ke tepian timur dan panah pengunci."];
        return ["Nyalakan tiga mata patung.", "Cahaya harus turun ke prisma.", "Putar cermin kanan agar cahaya memantul ke bawah."];
      case 4:
        if (!pr.abilities.echo) return ["Temui Pustakawan Gema.", "Ia di lantai bawah dekat pintu masuk.", "Tekan tombol tangan di dekatnya."];
        if (pr.gates.gate5) return [up, "Landasan ada di kanan aula lonceng.", "Lompat dari ujung kanan aula."];
        return ["Bunyikan lima lonceng sesuai lagu.", "Baca tiga mural: lantai bawah, tepian kanan, dan tepian barat.", "Mural barat hanya bisa dicapai lewat jembatan gema dari kristal ungu."];
      case 5:
        if (!pr.abilities.wind) return ["Temui Bayu.", "Ia di lantai kanan dekat pintu masuk.", "Tekan tombol tangan di dekatnya."];
        if (pr.gates.gate6) return [up, "Landasan ada di kiri atas.", "Naiki pijakan kanan sampai jembatan atas."];
        return ["Antar benih besar ke rumah benih.", "Arahkan kipas: kiri bawah ke kanan, kipas tanah ke atas, kipas dek ke kanan, kipas ujung dek ke atas, kipas atas ke kiri.", "Panah benihnya untuk mendorongnya kalau tersangkut."];
      case 6:
        if (!pr.abilities.ember) return ["Temui Rara.", "Ia di lantai bawah dekat pintu masuk.", "Tekan tombol tangan di dekatnya."];
        if (pr.gates.gate7) return [up, "Landasan ada di kanan atas.", "Naiki atap rumah kaca kanan."];
        if (!pr.furnace) return ["Hangatkan tiga rumah kaca.", "Tungku di tengah masih dingin.", "Tembak tungku dengan Panah Bara."];
        return ["Buat ketiga rumah kaca hangat (hijau).", "Merah = dua ventilasi terbuka; biru = tak ada.", "Coba hanya buka ventilasi kiri atas dan kanan, atau hanya tengah dan dekat tungku."];
      case 7:
        return ["Area bonus! Jelajahi gua kristal.", "Buka peti harta dan sentuh kristal di dekat pintu masuk untuk tantangan.", "Kumpulkan 8 kristal dalam 40 detik untuk membuka peti di aula atas. Jalan naik ada di kiri atas."];
      case 8:
        if (pr.gates.gate9) return [up, "Landasan di kanan atas.", "Dari teras bulan, gunakan jalan bulan di Sisi Pantulan."];
        return ["Cocokkan tiga patung bulan dengan pintu.", "Fase yang dicari hanya terlihat di Sisi Pantulan.", "Sentuh altar, lihat pintu, lalu panah patung sampai fasenya sama."];
      case 9:
        if (pr.gates.gate10) return [up, "Landasan ada di kiri atas.", "Lompat dari ujung kiri ruang kontrol."];
        return ["Selaraskan tiga roda akar.", "Tahan tiap roda saat penanda daunnya di atas.", "Panah pasak di bawah roda, lalu panah inti biru di kanan."];
      case 10:
        if (pr.gates.gate11) return [up, "Landasan di kanan atas.", "Naik dari panggung badai."];
        return ["Padamkan segel petir.", "Hancurkan tiga totem petir dan kalahkan Naga Awan.", "Totem ada di lantai, tepian kiri, dan tepian kanan atas."];
      case 11:
        return ["Area bonus! Taman jamur yang memantul.", "Lompat ke jamur untuk melambung tinggi.", "Nyalakan empat lampu spora sesuai titiknya untuk membuka peti bawah. Jalan naik ada di kiri atas."];
      default:
        if (!pr.gates.gate13) return ["Bentuk Rasi Kehidupan.", "Hubungkan bintang dengan Panah Benang sesuai jumlah titiknya.", "Tembak satu simpul lalu simpul lain untuk memasang atau melepas benang."];
        return ["Bebaskan Penjaga Mahkota.", "Masuk ke cangkang jantung lewat lubang di atas pijakan tengah.", "Hindari serangannya dan panah saat ia menukik."];
    }
  }

  // ../.dart_tool/skybound_source/game/puzzles.js
  var dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  function gardenWet(pr, id) {
    const ch = ofType("channel").find((c) => c.garden === id);
    if (!ch || !pr.latches[ch.latch]) return false;
    if (ch.switchId && pr.switches[ch.switchId] !== 1) return false;
    return true;
  }
  function basketWeight(s, key) {
    return (s.pr.baskets[key] || []).reduce((sum, id) => sum + (byId[id]?.weight ?? 0), 0);
  }
  function liftTargetTop(d, w) {
    return (d.baseRow - 2 * w) * T;
  }
  function reservoirSurface(s, d) {
    return d.bottom - (s.waterVis[d.key] ?? 0) * d.step;
  }
  function initPuzzles(G) {
    const { s } = G;
    const pr = s.pr;
    s.sprouts = [];
    s.fruits = ofType("fruit").map((d) => {
      const inBasket = Object.keys(pr.baskets).find((k) => pr.baskets[k].includes(d.id));
      return { id: d.id, w: d.weight, x: d.x, y: d.y, vx: 0, vy: 0, mode: inBasket ? "basket" : "hang", basket: inBasket || null, t: 0 };
    });
    s.leaves = {};
    for (const d of ofType("leaf")) s.leaves[d.id] = { fold: 0, standT: 0, foldT: 0 };
    s.lifts = {};
    for (const d of ofType("lift")) {
      const w = pr.locked[d.basket] ? d.target : basketWeight(s, d.basket);
      const top2 = liftTargetTop(d, w);
      s.lifts[d.id] = { top: top2, prevTop: top2 };
    }
    s.waterVis = { ...pr.water };
    const hn = byId.hangnest;
    s.hangnest = pr.got.hangnest ? { state: "down", y: hn.dropY, vy: 0 } : { state: "hang", y: hn.y, vy: 0 };
    s.seq = {};
    for (const k of ["mush", "bub", "bell", "spore"]) s.seq[k] = { next: 1, t: 0, popped: {} };
    s.gateAnim = {};
    for (const g of ofType("gate")) s.gateAnim[g.id] = pr.gates[g.id] ? 1 : 0;
    s.gardenAnim = {};
    for (const g of ofType("garden")) s.gardenAnim[g.id] = pr.gardens[g.id] ? 1 : 0;
    initPuzzles2(G);
  }
  function buildPlats(G) {
    const { s } = G;
    const out = [];
    for (const sp of s.sprouts) if (sp.t > 0.12) out.push({ id: sp.id, x: sp.x, w: sp.w, top: sp.top, prevTop: sp.top });
    for (const d of ofType("lift")) {
      const L = s.lifts[d.id];
      out.push({ id: d.id, x: d.x, w: d.w, top: L.top, prevTop: L.prevTop });
    }
    for (const d of ofType("reservoir")) {
      if (!d.raft) continue;
      const surf = reservoirSurface(s, d);
      const top2 = Math.min(surf, d.bottom - 2) - 6;
      const prev = s.raftPrev?.[d.id] ?? top2;
      out.push({ id: `raft_${d.key}`, x: d.raft.x, w: d.raft.w, top: top2, prevTop: prev });
    }
    for (const d of ofType("leaf")) if (s.leaves[d.id].fold < 0.5) out.push({ id: d.id, x: d.x, w: d.w, top: d.y, prevTop: d.y });
    for (const d of ofType("step")) if (!d.gate || (s.gateAnim[d.gate] ?? 0) >= 0.7) out.push({ id: d.id, x: d.x, w: d.w, top: d.y, prevTop: d.y });
    plats2(G, out);
    return out;
  }
  function updatePuzzles(G, dt) {
    const { s } = G;
    const pr = s.pr;
    const p = s.player;
    for (const sp of s.sprouts) sp.t += dt;
    pr.basketW = {};
    for (const d of ofType("lift")) {
      const w = basketWeight(s, d.basket);
      pr.basketW[d.basket] = w;
      const L = s.lifts[d.id];
      L.prevTop = L.top;
      const target = liftTargetTop(d, pr.locked[d.basket] ? d.target : Math.min(w, 4));
      const step = 70 * dt;
      L.top = Math.abs(target - L.top) <= step ? target : L.top + Math.sign(target - L.top) * step;
    }
    s.raftPrev = {};
    for (const d of ofType("reservoir")) {
      if (d.raft) s.raftPrev[d.id] = Math.min(reservoirSurface(s, d), d.bottom - 2) - 6;
      const tgt = pr.water[d.key];
      const v = s.waterVis[d.key];
      const k = 0.9 * dt;
      s.waterVis[d.key] = Math.abs(tgt - v) <= k ? tgt : v + Math.sign(tgt - v) * k;
    }
    for (const d of ofType("leaf")) {
      const L = s.leaves[d.id];
      if (L.foldT > 0) {
        L.foldT -= dt;
        L.fold = Math.min(1, L.fold + dt * 5);
        if (L.foldT <= 0) L.standT = 0;
      } else {
        L.fold = Math.max(0, L.fold - dt * 3);
        if (p.plat === d.id && p.onGround) {
          L.standT += dt;
          if (L.standT > 0.6) {
            L.foldT = 2.2;
            G.sfx("swish");
          }
        } else L.standT = Math.max(0, L.standT - dt);
      }
    }
    for (const g of ofType("gate")) if (pr.gates[g.id] && s.gateAnim[g.id] < 1) s.gateAnim[g.id] = Math.min(1, s.gateAnim[g.id] + dt / 1.6);
    for (const g of ofType("garden")) if (pr.gardens[g.id] && s.gardenAnim[g.id] < 1) s.gardenAnim[g.id] = Math.min(1, s.gardenAnim[g.id] + dt / 1.2);
    for (const f of s.fruits) updateFruit(G, f, dt);
    const hn = s.hangnest;
    if (hn.state === "fall") {
      hn.vy += 1200 * dt;
      hn.y += hn.vy * dt;
      if (hn.y >= byId.hangnest.dropY - 14) {
        hn.y = byId.hangnest.dropY - 14;
        hn.state = "down";
        pr.got.hangnest = true;
        G.sfx("land");
        G.fx("FX_A", "dust", byId.hangnest.x, byId.hangnest.dropY, 0.4, 50);
        G.fx("FX_B", "sparkle", byId.hangnest.x, byId.hangnest.dropY - 10, 0.6, 40);
        G.toast("Sarang jatuh \u2014 ada sesuatu yang berkilau!");
      }
    }
    const bq = s.seq.bub;
    if (bq.next > 1 && !pr.seqs.bub) {
      bq.t -= dt;
      if (bq.t <= 0) resetSeq(G, "bub");
    }
    for (const d of ofType("mushroom")) {
      if (!d.always && !pr.bosses.boss1) continue;
      {
        if (p.vy > 0 && Math.abs(p.x - d.x) < 24 && p.y > d.y - 44 && p.y < d.y - 26 && p.mode === "normal") {
          p.vy = -760;
          p.y = d.y - 44;
          p.onGround = false;
          p.airDash = true;
          G.sfx("jump");
          G.fx("FX_A", "dust", d.x, d.y - 40, 0.3, 30);
          s.bounce = { id: d.id, t: 0.25 };
        }
      }
    }
    if (s.bounce) {
      s.bounce.t -= dt;
      if (s.bounce.t <= 0) s.bounce = null;
    }
    const dome = byId.dome;
    if (pr.gates.dome && s.gateAnim.dome >= 0.7) {
      const c = dome.current;
      if (p.x > c.x && p.x < c.x + c.w && p.y - p.h < c.y + c.h && p.y > c.y - 40 && p.mode !== "dead") {
        if (p.mode !== "normal") {
          p.mode = "normal";
          p.rope = null;
        }
        p.vy = Math.max(p.vy - 2600 * dt, -380);
        p.onGround = false;
        if (Math.random() < 0.5) G.particle(p.x + (Math.random() - 0.5) * 40, p.y, 0, -160, "#bdf6ff", 3, 0.6);
      }
    }
    updatePuzzles2(G, dt);
    touchables(G);
  }
  function updateFruit(G, f, dt) {
    const { s } = G;
    const p = s.player;
    const d = byId[f.id];
    if (f.mode === "hang") {
      f.x = d.x;
      f.y = d.y;
      return;
    }
    if (f.mode === "basket") {
      const b2 = ofType("basket").find((q) => q.basket === f.basket);
      const idx = s.pr.baskets[f.basket].indexOf(f.id);
      f.x = b2.x - 8 + idx * 10;
      f.y = b2.y - 30 - idx * 4;
      return;
    }
    if (f.mode === "carried") {
      f.x = p.x;
      f.y = p.y - PLAYER_H - 12;
      return;
    }
    if (f.mode === "pull") {
      const dx = p.x - f.x;
      const dy = p.y - 30 - f.y;
      const dd = Math.hypot(dx, dy) || 1;
      f.x += dx / dd * 560 * dt;
      f.y += dy / dd * 560 * dt;
      if (dd < 28) {
        if (!p.carry && p.mode !== "dead") {
          f.mode = "carried";
          p.carry = f.id;
          G.sfx("pickup");
          G.toast(`Buah batu bobot ${f.w} \u2014 bawa ke keranjang.`, 1.8);
        } else {
          f.mode = "free";
          f.vx = 0;
          f.vy = -100;
        }
      }
      return;
    }
    if (f.mode === "respawn") {
      f.t -= dt;
      if (f.t <= 0) {
        f.mode = "hang";
        G.fx("FX_B", "sparkle", d.x, d.y + 10, 0.5, 34);
      }
      return;
    }
    f.vy = Math.min(f.vy + 1300 * dt, 700);
    f.vx *= 1 - 2 * dt;
    const body = { x: f.x, y: f.y + 12, w: 20, h: 22, vx: f.vx, vy: f.vy };
    const r = moveBody(body, f.vx * dt, f.vy * dt, G.plats);
    f.x = body.x;
    f.y = body.y - 12;
    f.vx = body.vx;
    f.vy = body.vy;
    if (r.ground && Math.abs(f.vy) < 1 && f.landed !== true) {
      f.landed = true;
      G.sfx("hit");
    }
    if (!r.ground) f.landed = false;
    const tile = G.tileAtWorld(f.x, f.y + 14);
    if (tile === 5 || f.y > G.worldH) {
      f.mode = "respawn";
      f.t = 0.8;
      G.toast("Buahnya jatuh \u2014 tumbuh lagi di pohon asalnya.", 1.6);
    }
  }
  function growSprout(G, tx, ty, arrow) {
    const { s } = G;
    const sides = arrow.vx > 0 ? [-1, 1] : [1, -1];
    for (const side2 of sides) {
      const x0 = side2 < 0 ? tx - 2 : tx + 1;
      if (isSolid(x0, ty) || isSolid(x0 + 1, ty)) continue;
      const x = x0 * T;
      const top2 = ty * T + 4;
      s.sprouts = s.sprouts.filter((sp) => !(Math.abs(sp.x - x) < T && Math.abs(sp.top - top2) < T));
      if (s.sprouts.length >= 3) s.sprouts.shift();
      s.sprouts.push({ id: G.uid("sp"), x, top: top2, w: 2 * T, t: 0, side: side2 });
      G.sfx("sprout");
      G.fx("FX_A", "sprout_grow", side2 < 0 ? x + 2 * T - 10 : x + 10, top2 + 14, 0.45, 40, side2 < 0);
      return true;
    }
    return false;
  }
  var near2 = (a, x, y, r) => dist(a.x, a.y, x, y) < r;
  function aimTargets(G) {
    const { s } = G;
    const pr = s.pr;
    const p = s.player;
    const out = [];
    const type = p.arrowType;
    const area = G.areaOfPlayer();
    for (const d of ofType("latch")) if (!pr.latches[d.id] && d.area === area) out.push({ x: d.x, y: d.y, puzzle: true });
    for (const d of ofType("switch")) if (d.area === area && !pr.gates.gate1) out.push({ x: d.x, y: d.y, puzzle: true });
    if (type === "sprout") {
      for (const d of ofType("garden")) if (!pr.gardens[d.id] && gardenWet(pr, d.id)) out.push({ x: d.x + d.w / 2, y: d.y + d.h / 2, puzzle: true });
    }
    for (const d of ofType("lift")) {
      if (pr.locked[d.basket]) continue;
      out.push({ ...pegPos(d), puzzle: true });
    }
    for (const f of s.fruits) {
      if (f.mode === "hang") out.push({ x: f.x, y: f.y - 30, puzzle: true });
      if (type === "thread" && (f.mode === "free" || f.mode === "hang")) out.push({ x: f.x, y: f.y, puzzle: true });
    }
    if (type === "thread") {
      for (const d of ofType("anchor")) if (d.area === area) out.push({ x: d.x, y: d.y, puzzle: true });
      if (s.hangnest.state === "hang") out.push({ x: byId.hangnest.x, y: s.hangnest.y, puzzle: true });
    }
    if (pr.bosses.boss1 && !pr.seqs.mush) {
      for (const d of ofType("mushroom")) if (d.seq) out.push({ x: d.x, y: d.y - 34, puzzle: true });
    }
    aimTargets2(G, out);
    if (!pr.seqs.bub) {
      for (const d of ofType("bubbleT")) if (!s.seq.bub.popped[d.id]) out.push({ x: d.x, y: d.y, puzzle: true });
    }
    for (const e of s.enemies) if (e.alive) out.push({ x: e.x, y: e.y - e.h / 2, id: e.id, creature: true });
    for (const b2 of Object.values(s.bosses)) if (b2.active && b2.state !== "defeat") out.push({ x: b2.x, y: b2.y - b2.h / 2, id: b2.id, creature: true });
    return out;
  }
  function pegPos(d) {
    return { x: d.post * T + T / 2, y: liftTargetTop(d, d.target) - 14 };
  }
  function puzzleArrowHit(G, a, x, y) {
    const { s } = G;
    const pr = s.pr;
    const tip = { x, y };
    for (const d of ofType("latch")) {
      if (pr.latches[d.id] || !near2(tip, d.x, d.y, 18)) continue;
      pr.latches[d.id] = true;
      G.sfx("hit");
      G.sfx("water");
      G.fx("FX_A", "arrow_hit", d.x, d.y + 10, 0.3, 30);
      G.toast("Pengait terbuka \u2014 embun mengalir!");
      G.save();
      return true;
    }
    for (const d of ofType("switch")) {
      if (!near2(tip, d.x, d.y, 20) || pr.gates.gate1) continue;
      pr.switches[d.id] = pr.switches[d.id] === 1 ? 0 : 1;
      G.sfx("click");
      G.sfx("hit");
      if (pr.latches.latchR) G.sfx("water");
      G.toast(pr.switches[d.id] === 1 ? "Sambungan berputar ke arah kebun." : "Sambungan berputar ke ujung buntu.", 1.6);
      G.save();
      return true;
    }
    for (const d of ofType("garden")) {
      if (x < d.x || x > d.x + d.w || y < d.y - 6 || y > d.y + d.h) continue;
      if (pr.gardens[d.id]) return false;
      if (a.type !== "sprout") {
        G.toast(gardenWet(pr, d.id) ? "Kebunnya basah \u2014 tumbuhkan dengan Panah Tunas!" : "Kebun ini kering. Alirkan embun ke sini dulu.", 1.8);
        return false;
      }
      if (!gardenWet(pr, d.id)) {
        G.toast("Kebun ini masih kering \u2014 buka salurannya dulu.", 1.8);
        G.sfx("deny");
        return true;
      }
      pr.gardens[d.id] = true;
      s.gardenAnim[d.id] = 0;
      G.sfx("sprout");
      G.sfx("pickup");
      G.fx("FX_A", "sprout_grow", d.x + d.w / 2, d.y + d.h, 0.6, 64);
      const left = ofType("garden").filter((g) => !pr.gardens[g.id]).length;
      G.toast(left ? `Kebun mekar! ${left} lagi.` : "Ketiga kebun mekar!");
      if (!left) G.openGate("gate1");
      G.save();
      return true;
    }
    for (const d of ofType("lift")) {
      if (pr.locked[d.basket]) continue;
      const pg = pegPos(d);
      if (!near2(tip, pg.x, pg.y, 18)) continue;
      const aligned = basketWeight(s, d.basket) === d.target && Math.abs(s.lifts[d.id].top - liftTargetTop(d, d.target)) < 3;
      if (aligned) {
        pr.locked[d.basket] = true;
        G.sfx("lock");
        G.fx("FX_B", "thread_attach", pg.x, pg.y + 16, 0.4, 36);
        const left = ofType("lift").filter((q) => !pr.locked[q.basket]).length;
        G.toast(left ? `Lift terkunci! ${left} lagi.` : "Ketiga lift terkunci!");
        if (!left) G.openGate("door2");
        G.save();
      } else {
        G.sfx("block");
        G.toast("Lift belum sejajar dengan tandanya.", 1.6);
      }
      return true;
    }
    for (const f of s.fruits) {
      if (f.mode === "hang") {
        const d = byId[f.id];
        if (Math.abs(x - f.x) < 9 && y > d.stemTop && y < f.y - 12) {
          f.mode = "free";
          f.vx = 0;
          f.vy = 0;
          G.sfx("hit");
          G.fx("FX_A", "arrow_hit", x, y + 8, 0.25, 22);
          return true;
        }
      }
      if ((f.mode === "hang" || f.mode === "free") && near2(tip, f.x, f.y, 20)) {
        if (a.type === "thread") {
          f.mode = "pull";
          G.sfx("rope");
          G.fx("FX_B", "thread_attach", f.x, f.y + 14, 0.35, 34);
        } else if (f.mode === "hang") {
          f.mode = "free";
          G.sfx("hit");
        } else return false;
        return true;
      }
    }
    if (a.type === "thread") {
      for (const d of ofType("anchor")) {
        if (!near2(tip, d.x, d.y, 22)) continue;
        const p = s.player;
        const dd = dist(p.x, p.y - p.h, d.x, d.y);
        G.fx("FX_B", "thread_attach", d.x, d.y + 16, 0.35, 36);
        G.sfx("rope");
        if (dd < 360 && (p.mode === "normal" || p.mode === "rope")) attachRope(G, d.x, d.y);
        else G.toast("Terlalu jauh untuk berayun.", 1.4);
        return true;
      }
      if (s.hangnest.state === "hang" && near2(tip, byId.hangnest.x, s.hangnest.y, 24)) {
        s.hangnest.state = "fall";
        s.hangnest.vy = 0;
        G.sfx("rope");
        return true;
      }
    } else if (s.hangnest.state === "hang" && near2(tip, byId.hangnest.x, s.hangnest.y, 24)) {
      G.toast("Sarangnya terlalu kuat terikat. Mungkin bisa ditarik\u2026", 1.8);
      G.sfx("block");
      return true;
    }
    if (pr.bosses.boss1 && !pr.seqs.mush) {
      for (const d of ofType("mushroom")) if (d.seq && near2(tip, d.x, d.y - 32, 22)) return seqHit(G, "mush", d);
    }
    if (arrowHit2(G, a, x, y)) return true;
    if (!pr.seqs.bub) {
      for (const d of ofType("bubbleT")) if (!s.seq.bub.popped[d.id] && near2(tip, d.x, d.y, 18)) return seqHit(G, "bub", d);
    }
    for (const sh of s.shots)
      if (sh.kind === "bubble" && near2(tip, sh.x, sh.y, 16)) {
        sh.life = 0;
        G.sfx("bubble");
        return true;
      }
    return false;
  }
  function seqHit(G, key, d) {
    const { s } = G;
    const q = s.seq[key];
    const total = G.defsWithSeq(key).length;
    if (d.order === q.next) {
      q.next++;
      q.popped[d.id] = true;
      q.t = 6;
      G.sfx(key === "bub" ? "bubble" : key === "bell" ? "bell" : "click");
      G.fx("FX_B", "sparkle", d.x, key === "mush" ? d.y - 30 : d.y + 10, 0.5, 34);
      if (q.next > total) {
        s.pr.seqs[key] = true;
        G.sfx("pickup");
        if (key === "bell") G.openGate("gate5");
        else G.toast(key === "spore" ? "Lampu spora menyala semua \u2014 peti di bawah terbuka!" : "Urutannya benar! Sesuatu muncul\u2026");
        G.save();
      }
    } else {
      G.sfx("deny");
      G.toast("Urutannya salah. Lihat titik-titik penandanya.", 1.6);
      resetSeq(G, key);
    }
    return true;
  }
  function resetSeq(G, key) {
    const q = G.s.seq[key];
    q.next = 1;
    q.popped = {};
    q.t = 0;
  }
  function touchables(G) {
    const { s } = G;
    const pr = s.pr;
    const p = s.player;
    if (p.mode === "dead") return;
    for (const d of ofType("checkpoint")) {
      if (Math.abs(p.x - d.x) > 22 || Math.abs(p.y - d.y) > 20) continue;
      if (pr.cp !== d.id || !pr.cps[d.id]) {
        const fresh = !pr.cps[d.id];
        pr.cps[d.id] = true;
        pr.cp = d.id;
        p.hp = p.maxHp;
        if (fresh) {
          G.fx("FX_B", "checkpoint", d.x, d.y, 0.8, 70);
          G.sfx("checkpoint");
          G.toast("Altar menyala \u2014 tersimpan.");
        }
        G.save();
      }
    }
    for (const d of ofType("nest")) {
      if (pr.nests[d.id] || Math.abs(p.x - d.x) > 26 || Math.abs(p.y - d.y) > 24) continue;
      pr.nests[d.id] = true;
      G.sfx("checkpoint");
      G.fx("FX_B", "sparkle", d.x, d.y - 10, 0.6, 40);
      const n = Object.keys(pr.nests).length;
      G.toast(n >= 2 ? "Sarang perjalanan aktif \u2014 tekan tombol tangan di sarang untuk terbang." : "Sarang perjalanan aktif.");
      G.save();
    }
    for (const d of pickupList(G)) {
      if (Math.abs(p.x - d.x) > 22 || p.y < d.y - 10 || p.y - p.h > d.y + 14) continue;
      pr.got[d.id] = true;
      G.fx("FX_B", "sparkle", d.x, d.y + 12, 0.6, 46);
      G.giveItem(d.type);
      G.save();
    }
  }
  function pickupList(G) {
    const pr = G.s.pr;
    return [...ofType("seed"), ...ofType("feather")].filter(
      (d) => !pr.got[d.id] && (!d.seqReward || pr.seqs[d.seqReward]) && (!d.hidden || pr.got[d.hidden])
    );
  }
  function findInteract(G) {
    const { s } = G;
    const p = s.player;
    const pr = s.pr;
    if (p.mode !== "normal" || !p.onGround) return null;
    const close = (d, r = 46) => Math.abs(p.x - d.x) < r && Math.abs(p.y - d.y) < 40;
    if (!p.carry) {
      const it2 = findInteract2(G, close);
      if (it2) return it2;
    }
    if (p.carry) {
      for (const d of ofType("basket"))
        if (close(d, 40)) {
          const lift = ofType("lift").find((l) => l.basket === d.basket);
          if (pr.locked[d.basket]) return { kind: "dropCarry", label: "Letakkan" };
          return { kind: "basket", id: d.id, key: d.basket, label: "Masukkan", lift: lift.id };
        }
      return { kind: "dropCarry", label: "Letakkan" };
    }
    for (const d of ofType("npc")) if (close(d, 54)) return { kind: "npc", id: d.id, npc: d.npc, label: "Bicara" };
    for (const d of ofType("mural")) if (close(d)) return { kind: "mural", id: d.id, label: "Baca" };
    for (const d of ofType("lever")) if (close(d, 36)) return { kind: "lever", id: d.id, action: d.action, label: "Tarik" };
    for (const d of ofType("valve")) if (close(d, 36)) return { kind: "valve", id: d.id, action: d.action, label: "Putar" };
    for (const d of ofType("nest")) if (close(d, 36) && pr.nests[d.id]) return { kind: "nest", id: d.id, label: "Terbang" };
    for (const f of s.fruits) if (f.mode === "free" && Math.abs(p.x - f.x) < 34 && Math.abs(p.y - 12 - f.y) < 36) return { kind: "pickFruit", id: f.id, label: "Angkat" };
    return null;
  }
  function doInteract(G, it) {
    const { s } = G;
    const pr = s.pr;
    const p = s.player;
    if (!it) return;
    switch (it.kind) {
      case "npc": {
        p.face = byId[it.id].x > p.x ? 1 : -1;
        const lines = npcLines(it.npc, pr);
        let after = null;
        if (it.npc === "lumi" && pr.bosses.boss1 && !pr.abilities.sprout) after = "giveSprout";
        if (it.npc === "simpul" && !pr.abilities.thread) after = "giveThread";
        const gifts = { librarian: "echo", bayu: "wind", rara: "ember" };
        if (gifts[it.npc] && !pr.abilities[gifts[it.npc]]) after = `give:${gifts[it.npc]}`;
        G.say(NPC_NAMES[it.npc], lines, after);
        pr.talked[it.id] = true;
        break;
      }
      case "mural":
        G.say("Mural Tua", MURAL_LINES, null);
        p.mode = "interact";
        p.modeT = 0.4;
        break;
      case "lever":
        p.mode = "interact";
        p.modeT = 0.35;
        p.animT = 0;
        if (it.action === "emptyBaskets") {
          let n = 0;
          for (const k of Object.keys(pr.baskets)) {
            if (pr.locked[k]) continue;
            for (const id of pr.baskets[k]) {
              const f = s.fruits.find((q) => q.id === id);
              if (f) {
                f.mode = "respawn";
                f.t = 0.4;
                f.basket = null;
              }
              n++;
            }
            pr.baskets[k] = [];
          }
          G.sfx("swish");
          G.toast(n ? "Keranjang dikosongkan \u2014 buah kembali ke pohonnya." : "Keranjangnya sudah kosong.");
        } else if (it.action === "resetWater") {
          pr.water = { L: 0, M: 0, U: 0 };
          G.sfx("water");
          G.toast("Semua waduk dikosongkan.");
        }
        G.save();
        break;
      case "valve":
        p.mode = "interact";
        p.modeT = 0.35;
        p.animT = 0;
        turnValve(G, it.action, it.id);
        break;
      case "nest":
        G.openTravel(it.id);
        break;
      case "pickFruit": {
        const f = s.fruits.find((q) => q.id === it.id);
        f.mode = "carried";
        p.carry = f.id;
        G.sfx("click");
        G.toast(`Buah batu bobot ${f.w}`, 1.2);
        break;
      }
      case "basket": {
        const f = s.fruits.find((q) => q.id === p.carry);
        if (f) {
          f.mode = "basket";
          f.basket = it.key;
          pr.baskets[it.key].push(f.id);
          p.carry = null;
          G.sfx("hit");
          G.sfx("rope");
          G.toast(`Keranjang ${"ABC".indexOf(it.key) + 1}: bobot ${basketWeight(s, it.key)}`, 1.6);
          G.save();
        }
        break;
      }
      case "dropCarry":
        G.dropCarry();
        break;
      default:
        doInteract2(G, it);
        break;
    }
  }
  function turnValve(G, action, id) {
    const { s } = G;
    const pr = s.pr;
    const w = pr.water;
    let ok = false;
    let msg = "";
    if (action === "fillLower" && w.L < 3) {
      w.L++;
      ok = true;
      msg = "Waduk bawah terisi.";
    } else if (action === "drainLower" && w.L > 0) {
      w.L--;
      ok = true;
      msg = "Waduk bawah dikuras sedikit.";
    } else if (action === "lowerToMiddle" && w.L > 0 && w.M < 3) {
      w.L--;
      w.M++;
      ok = true;
      msg = "Air mengalir dari waduk bawah ke tengah.";
    } else if (action === "middleToUpper" && w.M > 0 && w.U < 3) {
      w.M--;
      w.U++;
      ok = true;
      msg = "Air naik dari waduk tengah ke atas.";
    }
    s.valveSpin = { id, t: 0.6 };
    if (!ok) {
      G.sfx("deny");
      G.toast("Katupnya berputar, tapi tak ada air yang bisa berpindah.", 1.8);
      return;
    }
    G.sfx("water");
    G.toast(msg, 1.6);
    if (!pr.gates.dome && w.L === WATER_TARGET.L && w.M === WATER_TARGET.M && w.U === WATER_TARGET.U) {
      G.openGate("dome");
      s.player.focusMax += 0.5;
    }
    G.save();
  }
  function waterSurfaceAt(G, x, y) {
    const { s } = G;
    for (const d of ofType("reservoir")) {
      if (!d.raft) continue;
      if (x < d.x || x > d.x + d.w) continue;
      const surf = reservoirSurface(s, d);
      if (surf >= d.bottom - 4) continue;
      if (y > surf && y < d.bottom) return surf;
    }
    return null;
  }

  // ../.dart_tool/skybound_source/game/render.js
  var look = (moss, mossDark, base) => ({ moss, mossDark, line: "#2a170b", base });
  var AREA_LOOK = [
    look("#79b83a", "#3f7a1c", "#6b4528"),
    look("#9ccf45", "#5c8f1f", "#b9853e"),
    look("#43c0ad", "#1f7f76", "#d8c6a0"),
    look("#e8c34a", "#a77f1c", "#c9a24a"),
    look("#b58cdc", "#6b4a9a", "#6e6380"),
    look("#e8f6ff", "#9cc4dc", "#8fa3b3"),
    look("#ff9a4a", "#b3461e", "#5a2a1c"),
    look("#f2a8ff", "#9a5ac9", "#3d3466"),
    look("#d8e6ff", "#7f93c9", "#8094b8"),
    look("#d9a54a", "#8a5a1c", "#5a3b22"),
    look("#ffe46b", "#7a8aa0", "#3f4a5a"),
    look("#ff7ad9", "#9a2f8a", "#5a3550"),
    look("#fff6c8", "#d9b45a", "#e8dcc0")
  ];
  var GATE_ANIM = {
    root_gate: ["MECHANISMS", "root_gate"],
    canopy_door: ["MECHANISMS", "canopy_door"],
    water_dome: ["MECHANISMS", "water_dome"],
    sun_door: ["GATES_B", "root_gate"],
    resonance: ["GATES_B", "garden"],
    storm: ["GATES_B", "canopy_door"],
    ember_flower: ["GATES_B", "water_dome"],
    moon_door: ["GATES_C", "root_gate"],
    clock_gate: ["GATES_C", "garden"],
    thunder_seal: ["GATES_C", "canopy_door"],
    heart_shell: ["GATES_C", "water_dome"]
  };
  var NPC_SHEET = {
    bird: ["NPCS", "guide_bird"],
    lumi: ["NPCS", "lumi"],
    simpul: ["NPCS", "simpul"],
    nira: ["NPCS", "nira"],
    sora: ["NPCS_B", "guide_bird"],
    librarian: ["NPCS_B", "lumi"],
    bayu: ["NPCS_B", "simpul"],
    rara: ["NPCS_B", "nira"],
    hermit: ["NPCS_C", "guide_bird"],
    tiko: ["NPCS_C", "lumi"],
    guntur: ["NPCS_C", "simpul"],
    spirit: ["NPCS_C", "nira"]
  };
  function createRenderer(canvas, sprites) {
    const ctx = canvas.getContext("2d");
    const view = { w: 1, h: 1, dpr: 1, zoom: 1 };
    const patterns = [];
    function resize() {
      const rect2 = canvas.getBoundingClientRect();
      if (!rect2.width || !rect2.height) return;
      const dpr = Math.min(globalThis.__skyWindow.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect2.width * dpr);
      canvas.height = Math.round(rect2.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      view.w = rect2.width;
      view.h = rect2.height;
      view.dpr = dpr;
    }
    function fillFor(area) {
      if (patterns[area]) return patterns[area];
      const im = sprites.img[`TEX_A${area + 1}`];
      if (!im) return AREA_LOOK[area].base;
      const pat = ctx.createPattern(im, "repeat");
      const sc = T * 5 / im.width;
      pat.setTransform?.(new globalThis.__skyDOMMatrix([sc, 0, 0, sc, 0, 0]));
      patterns[area] = pat;
      return pat;
    }
    const img = (k) => sprites.img[k];
    const fr = (k, name) => sprites.frames[k]?.[name];
    const anim = (k, name) => sprites.anims[k]?.[name];
    const loopFrame = (k, name, t, fps) => {
      const a = anim(k, name);
      if (!a) return null;
      return a[Math.floor(t * fps) % a.length];
    };
    const onceFrame = (k, name, u) => {
      const a = anim(k, name);
      if (!a) return null;
      return a[Math.max(0, Math.min(a.length - 1, Math.floor(u * a.length)))];
    };
    let prefix = "AERA";
    function draw(s, opts) {
      prefix = opts.prefix || "AERA";
      const { w, h, dpr } = view;
      const zoom = opts.zoom;
      view.zoom = zoom;
      const cx = s.cam.x + (s.shakeX || 0);
      const cy = s.cam.y + (s.shakeY || 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      drawBackdrop(s, cx, cy, w, h, zoom);
      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * (w / 2 - cx * zoom), dpr * (h / 2 - cy * zoom));
      const vx0 = cx - w / 2 / zoom - T;
      const vx1 = cx + w / 2 / zoom + T;
      const vy0 = cy - h / 2 / zoom - T;
      const vy1 = cy + h / 2 / zoom + T;
      const inView = (x, y, r = 120) => x > vx0 - r && x < vx1 + r && y > vy0 - r && y < vy1 + r;
      const t = s.time;
      drawChannels(s, t, inView);
      drawWaterBack(s, inView);
      drawTerrain(s, vx0, vy0, vx1, vy1);
      drawBeams(s, t);
      drawLight(ctx, s, t);
      drawGates(s, inView);
      drawProps(s, t, inView);
      drawWorld2(ctx, s, { img, fr, anim, loopFrame, onceFrame, inView, t, roundRect, pips, drawFrame, drawContained, drawCentered });
      drawNPCs(s, t, inView);
      drawPickups(s, t, inView);
      drawFruits(s, inView);
      drawEnemies(s, inView);
      drawBosses(s, inView);
      drawRope(s, t);
      drawPlayer(s, t);
      drawArrows(s, inView, t);
      drawRelease(s, inView);
      drawShots(s, t, inView);
      drawWaterFront(s, t, inView);
      drawFx(s, inView);
      drawParticles(s);
      if (s.player.aiming) drawAim(s, opts);
      if (opts.prompt) drawPrompt(s, opts.prompt);
      if (opts.hitboxes) drawHitboxes(s, opts.plats);
    }
    function drawBackdrop(s, cx, cy, w, h) {
      const row = cy / T;
      const areaF = AREA_COUNT - row / AREA_ROWS;
      const base = Math.max(0, Math.min(AREA_COUNT - 1, Math.floor(areaF)));
      const frac = areaF - base;
      const layers = [{ a: base, alpha: 1 }];
      if (base < AREA_COUNT - 1 && frac > 0.82) layers.push({ a: base + 1, alpha: (frac - 0.82) / 0.18 });
      ctx.fillStyle = AREA_LOOK[base].base;
      ctx.fillRect(0, 0, w, h);
      for (const L of layers) {
        const im = img(`BG_A${L.a + 1}`);
        if (!im) continue;
        const sc = Math.max(w / im.width, h / im.height) * 1.18;
        const dw = im.width * sc;
        const dh = im.height * sc;
        const px = (cx / WORLD_W - 0.5) * (dw - w);
        const top2 = areaTopRow(L.a) * T;
        const prog = Math.max(0, Math.min(1, (cy - top2) / (AREA_ROWS * T)));
        const py = (prog - 0.5) * (dh - h);
        ctx.globalAlpha = L.alpha;
        ctx.drawImage(im, (w - dw) / 2 - px, (h - dh) / 2 - py, dw, dh);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255, 248, 225, 0.12)";
      ctx.fillRect(0, 0, w, h);
    }
    function drawTerrain(s, vx0, vy0, vx1, vy1) {
      const tx0 = Math.max(0, Math.floor(vx0 / T));
      const tx1 = Math.min(COLS - 1, Math.floor(vx1 / T));
      const ty0 = Math.max(0, Math.floor(vy0 / T));
      const ty1 = Math.min(ROWS - 1, Math.floor(vy1 / T));
      const solid = (x, y) => {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
        const v = tiles[y * COLS + x];
        return v === TILE.SOLID || v === TILE.FERTILE;
      };
      for (let ty = ty0; ty <= ty1; ty++) {
        const area = areaOfRow(ty);
        ctx.fillStyle = fillFor(area);
        let run = -1;
        for (let tx = tx0; tx <= tx1 + 1; tx++) {
          const sol = tx <= tx1 && solid(tx, ty);
          if (sol && run < 0) run = tx;
          if (!sol && run >= 0) {
            ctx.fillRect(run * T, ty * T - 0.5, (tx - run) * T, T + 1);
            run = -1;
          }
        }
      }
      for (let ty = ty0; ty <= ty1; ty++)
        for (let tx = tx0; tx <= tx1; tx++) {
          if (tiles[ty * COLS + tx] !== TILE.FERTILE) continue;
          ctx.fillStyle = "rgba(118, 205, 70, 0.38)";
          ctx.fillRect(tx * T, ty * T - 0.5, T, T + 1);
          ctx.strokeStyle = "rgba(196, 255, 120, 0.7)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tx * T + 8 + ty * 7 % 12, ty * T);
          ctx.quadraticCurveTo(tx * T + 20, ty * T + 16, tx * T + 10 + ty * 5 % 14, ty * T + T);
          ctx.stroke();
          if (ty % 2 === 0) {
            const b2 = fr("PROPS_A", "bud");
            if (!solid(tx + 1, ty)) drawCentered(ctx, img("PROPS_A"), b2, tx * T + T - 2, ty * T + T / 2, 18, Math.PI / 2);
            if (!solid(tx - 1, ty)) drawCentered(ctx, img("PROPS_A"), b2, tx * T + 2, ty * T + T / 2, 18, -Math.PI / 2);
          }
        }
      for (let ty = ty0; ty <= ty1; ty++) {
        const look2 = AREA_LOOK[areaOfRow(ty)];
        for (let tx = tx0; tx <= tx1; tx++) {
          if (!solid(tx, ty) || solid(tx, ty - 1)) continue;
          const x = tx * T;
          const y = ty * T;
          ctx.fillStyle = look2.mossDark;
          ctx.beginPath();
          ctx.rect(x, y - 1, T, 8);
          ctx.arc(x + 7, y + 7, 4.5, 0, Math.PI);
          ctx.arc(x + 21, y + 8, 5.5, 0, Math.PI);
          ctx.fill();
          ctx.fillStyle = look2.moss;
          ctx.fillRect(x, y - 1, T, 5);
        }
      }
      ctx.strokeStyle = AREA_LOOK[0].line;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let ty = ty0; ty <= ty1; ty++)
        for (let tx = tx0; tx <= tx1; tx++) {
          if (!solid(tx, ty)) continue;
          const x = tx * T;
          const y = ty * T;
          if (!solid(tx, ty - 1)) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + T, y);
          }
          if (!solid(tx, ty + 1)) {
            ctx.moveTo(x, y + T);
            ctx.lineTo(x + T, y + T);
          }
          if (!solid(tx - 1, ty)) {
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + T);
          }
          if (!solid(tx + 1, ty)) {
            ctx.moveTo(x + T, y);
            ctx.lineTo(x + T, y + T);
          }
        }
      ctx.stroke();
      for (let ty = ty0; ty <= ty1; ty++) {
        const area = areaOfRow(ty);
        let run = -1;
        let runKind = -1;
        for (let tx = tx0; tx <= tx1 + 1; tx++) {
          const v = tx <= tx1 ? tiles[ty * COLS + tx] : -1;
          const kind = v === TILE.ONEWAY || v === TILE.REAL || v === TILE.MOON ? v : -1;
          if (run >= 0 && kind !== runKind) {
            if (runKind === TILE.ONEWAY) plank(run * T, ty * T, (tx - run) * T, area);
            else sidePlank(run * T, ty * T, (tx - run) * T, runKind === TILE.REAL ? 0 : 1);
            run = -1;
          }
          if (kind >= 0 && run < 0) {
            run = tx;
            runKind = kind;
          }
          if (v === TILE.THORN) drawContained(ctx, img("PROPS_A"), fr("PROPS_A", "thorns"), tx * T + T / 2, ty * T + T + 2, T * 1.35, T * 0.9);
        }
      }
      const vine = fr("PROPS_A", "vine");
      for (let tx = tx0; tx <= tx1; tx++) {
        let start = -1;
        for (let ty = ty0; ty <= ty1 + 1; ty++) {
          const isV = ty <= ty1 && tiles[ty * COLS + tx] === TILE.VINE;
          if (isV && start < 0) start = ty;
          if (!isV && start >= 0) {
            drawVine(tx * T + T / 2, start * T, ty * T, vine);
            start = -1;
          }
        }
      }
    }
    function plank(x, y, w, area) {
      const look2 = AREA_LOOK[area];
      ctx.fillStyle = fillFor(area);
      roundRect(x + 1, y, w - 2, 13, 5);
      ctx.fill();
      ctx.fillStyle = look2.moss;
      ctx.fillRect(x + 3, y - 1, w - 6, 4);
      ctx.strokeStyle = look2.line;
      ctx.lineWidth = 2.5;
      roundRect(x + 1, y, w - 2, 13, 5);
      ctx.stroke();
    }
    function sidePlank(x, y, w, sideOf) {
      const active = getSide() === sideOf;
      const col = sideOf === 0 ? "#c9d6f0" : "#9ec4ff";
      if (active) {
        ctx.fillStyle = sideOf === 0 ? "#8a9bc0" : "#5d7fd6";
        roundRect(x + 1, y, w - 2, 13, 5);
        ctx.fill();
        ctx.fillStyle = col;
        ctx.fillRect(x + 3, y - 1, w - 6, 4);
        ctx.strokeStyle = "#2a170b";
        ctx.lineWidth = 2.5;
        roundRect(x + 1, y, w - 2, 13, 5);
        ctx.stroke();
      } else {
        ctx.strokeStyle = sideOf === 0 ? "rgba(220, 230, 255, 0.45)" : "rgba(150, 190, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        roundRect(x + 1, y, w - 2, 13, 5);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    function drawVine(cx, y0, y1, frame2) {
      const im = img("PROPS_A");
      if (!frame2) return;
      const c = frame2.content;
      const segW = 22;
      const s = segW / c.w;
      const segH = c.h * s;
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - 30, y0 - 2, 60, y1 - y0 + 4);
      ctx.clip();
      for (let y = y0 - 2; y < y1; y += segH - 2) ctx.drawImage(im, c.x, c.y, c.w, c.h, cx - segW / 2, y, segW, segH);
      ctx.restore();
    }
    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    function poly(pts) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    }
    function rootLine(pts, wet, t) {
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      poly(pts);
      ctx.strokeStyle = "rgba(255, 236, 190, 0.5)";
      ctx.lineWidth = 17;
      ctx.stroke();
      ctx.strokeStyle = "#2a170b";
      ctx.lineWidth = 13;
      ctx.stroke();
      ctx.strokeStyle = wet ? "#4f7f9a" : "#7a5634";
      ctx.lineWidth = 8;
      ctx.stroke();
      if (wet) {
        ctx.strokeStyle = "#7fe0ff";
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 8]);
        ctx.lineDashOffset = -t * 50;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    function drawChannels(s, t, inView) {
      const pr = s.pr;
      for (const c of ofType("channel")) {
        if (!inView(c.before[0].x, c.before[0].y, 700)) continue;
        const open = pr.latches[c.latch];
        rootLine(c.before, true, t);
        if (c.after) rootLine(c.after, open, t);
        if (c.mid) {
          rootLine(c.mid, open, t);
          rootLine(c.wrong, open && pr.switches[c.switchId] !== 1, t);
          rootLine(c.right, open && pr.switches[c.switchId] === 1, t);
        }
      }
      for (const d of ofType("stump")) {
        ctx.fillStyle = "#5a3a1f";
        ctx.strokeStyle = "#2a170b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, 12, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    function drawBeams(s, t) {
      const pr = s.pr;
      const gate = byId.gate1;
      if (s.gateAnim.gate1 >= 1) return;
      const gx = gate.x + gate.w / 2;
      const gy = gate.y + gate.h - 8;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const g of ofType("garden")) {
        if (!pr.gardens[g.id]) continue;
        const a = 0.25 + 0.12 * Math.sin(t * 3 + g.x);
        ctx.strokeStyle = `rgba(255, 220, 110, ${a})`;
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(g.x + g.w / 2, g.y);
        ctx.lineTo(gx, gy);
        ctx.stroke();
        ctx.strokeStyle = `rgba(255, 250, 200, ${a + 0.2})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();
    }
    function drawGates(s, inView) {
      for (const g of ofType("gate")) {
        if (!inView(g.x + g.w / 2, g.y + g.h / 2, 200)) continue;
        const a = s.gateAnim[g.id];
        const [sheet, row] = GATE_ANIM[g.anim];
        const frame2 = onceFrame(sheet, row, s.pr.gates[g.id] ? Math.max(a, 0.21) : 0);
        const size = Math.max(g.w, g.h);
        drawContained(ctx, img(sheet), frame2, g.x + g.w / 2, g.y + g.h + 4, size + 8, size + 8);
      }
      for (const d of ofType("step")) {
        const a = d.gate ? s.gateAnim[d.gate] ?? 0 : 1;
        if (a < 0.7) continue;
        const k = Math.min(1, (a - 0.7) / 0.3);
        ctx.globalAlpha = k;
        drawContained(ctx, img("PROPS_A"), fr("PROPS_A", "root_step"), d.x + d.w / 2, d.y + 18, d.w + 10, 30 * k + 1);
        ctx.globalAlpha = 1;
      }
    }
    function drawProps(s, t, inView) {
      const pr = s.pr;
      const A2 = img("PROPS_A");
      const B = img("PROPS_B");
      for (const d of ofType("spring")) if (inView(d.x, d.y)) drawContained(ctx, A2, fr("PROPS_A", "dew_spring"), d.x + 16, d.y + 2, 70, 56);
      for (const d of ofType("latch")) {
        if (!inView(d.x, d.y)) continue;
        drawContained(ctx, A2, fr("PROPS_A", pr.latches[d.id] ? "latch_open" : "latch_closed"), d.x, d.y + 20, 40, 40);
      }
      for (const d of ofType("switch")) {
        if (!inView(d.x, d.y)) continue;
        drawCentered(ctx, A2, fr("PROPS_A", "root_switch"), d.x, d.y, 40, pr.switches[d.id] === 1 ? Math.PI / 2 : 0);
      }
      for (const d of ofType("garden")) {
        if (!inView(d.x, d.y)) continue;
        let u = 0;
        if (pr.gardens[d.id]) u = 0.4 + 0.6 * s.gardenAnim[d.id];
        else if (gardenWet(pr, d.id)) u = 0.21;
        drawContained(ctx, img("MECHANISMS"), onceFrame("MECHANISMS", "garden", u), d.x + d.w / 2, d.y + d.h + 2, d.w + 6, d.h + 6);
        if (!pr.gardens[d.id] && gardenWet(pr, d.id)) {
          ctx.fillStyle = `rgba(160, 255, 110, ${0.25 + 0.2 * Math.sin(t * 4)})`;
          ctx.beginPath();
          ctx.arc(d.x + d.w / 2, d.y + d.h / 2, 26, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      for (const d of ofType("checkpoint")) {
        if (!inView(d.x, d.y)) continue;
        const on = pr.cps[d.id];
        drawContained(ctx, A2, fr("PROPS_A", on ? "altar_on" : "altar_off"), d.x, d.y + 2, 40, 40);
        if (pr.cp === d.id) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          const g = ctx.createRadialGradient(d.x, d.y - 20, 2, d.x, d.y - 20, 34);
          g.addColorStop(0, `rgba(255, 230, 120, ${0.35 + 0.1 * Math.sin(t * 3)})`);
          g.addColorStop(1, "rgba(255, 230, 120, 0)");
          ctx.fillStyle = g;
          ctx.fillRect(d.x - 40, d.y - 60, 80, 70);
          ctx.restore();
        }
      }
      for (const d of ofType("nest")) {
        if (!inView(d.x, d.y)) continue;
        drawContained(ctx, A2, fr("PROPS_A", "nest"), d.x, d.y + 4, 46, 40);
        if (pr.nests[d.id]) {
          ctx.fillStyle = `rgba(140, 220, 255, ${0.3 + 0.15 * Math.sin(t * 2.5)})`;
          ctx.beginPath();
          ctx.arc(d.x, d.y - 46, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      for (const d of ofType("mushroom")) {
        if (!inView(d.x, d.y)) continue;
        const squash = s.bounce?.id === d.id ? 1 - s.bounce.t * 1.2 : 1;
        drawContained(ctx, A2, fr("PROPS_A", "mushroom"), d.x, d.y + 2, 54, 48 * Math.max(0.7, squash));
        if (d.seq && pr.bosses.boss1 && !pr.seqs.mush) pips(d.x, d.y - 52, d.order, s.seq.mush.popped[d.id]);
      }
      for (const d of ofType("bubbleT")) {
        if (pr.seqs.bub || s.seq.bub.popped[d.id] || !inView(d.x, d.y)) continue;
        drawCentered(ctx, B, fr("PROPS_B", "bubble"), d.x, d.y + Math.sin(t * 2 + d.x) * 4, 34);
        pips(d.x, d.y + Math.sin(t * 2 + d.x) * 4, d.order, false);
      }
      for (const d of ofType("lever")) {
        if (!inView(d.x, d.y)) continue;
        drawContained(ctx, A2, fr("PROPS_A", "lever"), d.x, d.y + 2, 34, 36);
      }
      for (const d of ofType("valve")) {
        if (!inView(d.x, d.y)) continue;
        ctx.fillStyle = "#6b5236";
        ctx.strokeStyle = "#2a170b";
        ctx.lineWidth = 2.5;
        ctx.fillRect(d.x - 4, d.y - 22, 8, 22);
        ctx.strokeRect(d.x - 4, d.y - 22, 8, 22);
        const spin = s.valveSpin?.id === d.id ? (0.6 - s.valveSpin.t) * 9 : 0;
        drawCentered(ctx, B, fr("PROPS_B", "valve"), d.x, d.y - 28, 30, spin);
      }
      for (const d of ofType("mural")) {
        if (!inView(d.x, d.y)) continue;
        drawContained(ctx, B, fr("PROPS_B", "mural"), d.x, d.y + 2, 54, 62);
        gauge(s, d.x, d.y - 74);
      }
      for (const d of ofType("anchor")) {
        if (!inView(d.x, d.y)) continue;
        ctx.strokeStyle = "#5b3b1e";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(d.x - 26, d.y - 16);
        ctx.quadraticCurveTo(d.x, d.y - 24, d.x + 26, d.y - 14);
        ctx.stroke();
        drawCentered(ctx, A2, fr("PROPS_A", "anchor"), d.x, d.y, 30);
        if (s.player.arrowType === "thread") {
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + 0.3 * Math.sin(t * 5)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(d.x, d.y, 22, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      const hn = s.hangnest;
      const hd = byId.hangnest;
      if (inView(hd.x, hn.y)) {
        if (hn.state === "hang") {
          ctx.strokeStyle = "#6b4a2b";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(hd.x, hd.stemTop);
          ctx.lineTo(hd.x, hn.y - 14);
          ctx.stroke();
          ctx.save();
          ctx.translate(hd.x, hn.y);
          ctx.scale(1, -1);
          drawCentered(ctx, A2, fr("PROPS_A", "nest"), 0, 0, 34);
          ctx.restore();
        } else drawCentered(ctx, A2, fr("PROPS_A", "nest"), hd.x, hn.y, 30);
      }
      for (const d of ofType("lift")) {
        const L = s.lifts[d.id];
        if (!inView(d.x, L.top, 300)) continue;
        const pulleyY = (areaTopRow(1) + 4) * T + 10;
        const cx = d.x + d.w / 2;
        ctx.strokeStyle = "#c9a35c";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 30, L.top);
        ctx.lineTo(cx - 4, pulleyY);
        ctx.moveTo(cx + 30, L.top);
        ctx.lineTo(cx + 4, pulleyY);
        ctx.stroke();
        ctx.fillStyle = "#8a6a3a";
        ctx.strokeStyle = "#2a170b";
        ctx.beginPath();
        ctx.arc(cx, pulleyY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        drawContained(ctx, B, fr("PROPS_B", "lift"), cx, L.top + 22, d.w + 10, 28);
        const px = d.post * T + T / 2;
        const tTop = liftTargetTop(d, d.target);
        ctx.fillStyle = "#7a5634";
        ctx.fillRect(px - 4, tTop - 50, 8, d.baseRow * T - tTop + 70);
        ctx.strokeStyle = "#2a170b";
        ctx.lineWidth = 2;
        ctx.strokeRect(px - 4, tTop - 50, 8, d.baseRow * T - tTop + 70);
        const aligned = basketWeight(s, d.basket) === d.target && Math.abs(L.top - tTop) < 3;
        ctx.fillStyle = s.pr.locked[d.basket] ? "#7ed957" : aligned ? "#ffd84a" : "#f3e2b0";
        ctx.fillRect(px - 12, tTop - 2, 24, 5);
        ctx.strokeRect(px - 12, tTop - 2, 24, 5);
        const pg = pegPos(d);
        drawContained(ctx, B, fr("PROPS_B", "peg"), pg.x + (s.pr.locked[d.basket] ? -6 : 0), pg.y + 12, 18, 24);
        if (aligned && !s.pr.locked[d.basket]) {
          ctx.strokeStyle = `rgba(255, 220, 80, ${0.5 + 0.4 * Math.sin(t * 8)})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(pg.x, pg.y, 16, 0, Math.PI * 2);
          ctx.stroke();
        }
        pips(px, tTop - 60, d.target, false);
      }
      for (const d of ofType("basket")) {
        if (!inView(d.x, d.y)) continue;
        drawContained(ctx, B, fr("PROPS_B", "basket"), d.x, d.y + 2, 40, 46);
        pips(d.x, d.y - 58, basketWeight(s, d.basket), false, true);
      }
      for (const d of ofType("leaf")) {
        if (!inView(d.x, d.y)) continue;
        const L = s.leaves[d.id];
        if (L.fold < 0.5) drawContained(ctx, B, fr("PROPS_B", "leaf_open"), d.x + d.w / 2 + (L.standT > 0.3 ? Math.sin(t * 40) * 1.5 : 0), d.y + 18, d.w + 14, 30);
        else drawContained(ctx, B, fr("PROPS_B", "leaf_folded"), d.x + d.w / 2, d.y + 44, 20, 48);
      }
      s.sprouts.forEach((sp, i) => {
        const grow = Math.min(1, sp.t / 0.2);
        let alpha = 1;
        if (s.sprouts.length >= 3 && i === 0) alpha = 0.55 + 0.45 * Math.sin(t * 12);
        ctx.globalAlpha = alpha;
        drawContained(ctx, A2, fr("PROPS_A", "sprout_platform"), sp.x + sp.w / 2, sp.top + 22, (sp.w + 12) * grow, 34 * grow, sp.side < 0);
        ctx.globalAlpha = 1;
      });
      for (const d of ofType("reservoir")) {
        if (!d.raft) continue;
        const surf = Math.min(reservoirSurface(s, d), d.bottom - 2) - 6;
        if (!inView(d.raft.x, surf)) continue;
        drawContained(ctx, B, fr("PROPS_B", "raft"), d.raft.x + d.raft.w / 2, surf + 22, d.raft.w + 8, 30);
      }
    }
    function pips(x, y, n, done, square = false) {
      if (n <= 0) return;
      const w = n * 9 + 8;
      ctx.fillStyle = done ? "rgba(60, 120, 40, 0.85)" : "rgba(40, 24, 12, 0.78)";
      roundRect(x - w / 2, y - 7, w, 14, 7);
      ctx.fill();
      ctx.fillStyle = done ? "#c8ff9a" : "#fff3c4";
      for (let i = 0; i < n; i++) {
        const px = x - w / 2 + 8 + i * 9;
        ctx.beginPath();
        if (square) ctx.rect(px - 3, y - 3, 6, 6);
        else ctx.arc(px, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    function gauge(s, x, y) {
      const keys = ["L", "M", "U"];
      const w = 66;
      ctx.fillStyle = "rgba(40, 30, 20, 0.75)";
      roundRect(x - w / 2, y - 26, w, 34, 6);
      ctx.fill();
      keys.forEach((k, i) => {
        const cx = x - 20 + i * 20;
        ctx.strokeStyle = "#f3e2b0";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - 6, y - 22, 12, 26);
        const lv = s.pr.water[k];
        ctx.fillStyle = "#5fd3ff";
        ctx.fillRect(cx - 5, y + 3 - lv * 8, 10, lv * 8);
        const tg = WATER_TARGET[k];
        ctx.fillStyle = lv === tg ? "#7ed957" : "#ffb347";
        ctx.fillRect(cx - 9, y + 3 - tg * 8 - 1, 18, 2.5);
      });
    }
    function drawNPCs(s, t, inView) {
      for (const d of ofType("npc")) {
        if (!inView(d.x, d.y)) continue;
        const [sheet, k] = NPC_SHEET[d.npc];
        const N = img(sheet);
        const frame2 = loopFrame(sheet, k, t + d.x * 0.01, d.npc === "bird" ? 8 : 5);
        const vis = d.npc === "bird" ? 26 : 56;
        const c = frame2?.content;
        const sc = c ? vis / sprites.anims[sheet][k][0].content.h : 0.2;
        drawFrame(ctx, N, frame2, d.x, d.y + 1, sc, s.player.x > d.x);
        if (!s.pr.talked[d.id]) {
          const by = d.y - vis - 18 + Math.sin(t * 4) * 3;
          ctx.fillStyle = "#fff3c4";
          ctx.strokeStyle = "#2a170b";
          ctx.lineWidth = 2;
          roundRect(d.x - 9, by - 9, 18, 18, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#2a170b";
          ctx.fillRect(d.x - 1.5, by - 5, 3, 7);
          ctx.fillRect(d.x - 1.5, by + 4, 3, 3);
        }
      }
    }
    function drawPickups(s, t, inView) {
      for (const d of pickupList({ s })) {
        if (!inView(d.x, d.y)) continue;
        const bob = Math.sin(t * 3 + d.x) * 4;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(d.x, d.y + bob, 1, d.x, d.y + bob, 26);
        g.addColorStop(0, d.type === "seed" ? "rgba(255, 220, 90, 0.5)" : "rgba(120, 220, 255, 0.5)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(d.x - 30, d.y + bob - 30, 60, 60);
        ctx.restore();
        if (d.type === "seed") drawCentered(ctx, img("PROPS_A"), fr("PROPS_A", "seed"), d.x, d.y + bob, 26);
        else drawCentered(ctx, img("PROPS_B"), fr("PROPS_B", "feather"), d.x, d.y + bob, 30, Math.sin(t * 2) * 0.2);
      }
    }
    function drawFruits(s, inView) {
      const B = img("PROPS_B");
      for (const f of s.fruits) {
        if (f.mode === "respawn" || !inView(f.x, f.y)) continue;
        const d = byId[f.id];
        if (f.mode === "hang") {
          ctx.strokeStyle = "#6b4a2b";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(f.x, d.stemTop);
          ctx.lineTo(f.x, f.y - 10);
          ctx.stroke();
        }
        const size = 16 + f.w * 4;
        drawCentered(ctx, B, fr("PROPS_B", `fruit_${f.w}`), f.x, f.y, size);
      }
    }
    function enemyScale(sheet, name, vis) {
      const a = sprites.anims[sheet]?.[name];
      return a ? vis / a[0].content.h : 0.1;
    }
    function flashDraw(im, frame2, x, y, sc, flip, flash) {
      drawFrame(ctx, im, frame2, x, y, sc, flip);
      if (flash > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.55;
        drawFrame(ctx, im, frame2, x, y, sc, flip);
        ctx.restore();
      }
    }
    function drawEnemies(s, inView) {
      for (const e of s.enemies) {
        if (!e.alive || !inView(e.x, e.y)) continue;
        const k = ENEMY[e.kind];
        if (k.ai === "totem") {
          drawContained(ctx, img("PROPS_E"), fr("PROPS_E", "storm_totem"), e.x, e.y + 2, 44, k.vis);
          if (e.flash > 0) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = 0.5;
            drawContained(ctx, img("PROPS_E"), fr("PROPS_E", "storm_totem"), e.x, e.y + 2, 44, k.vis);
            ctx.restore();
          }
          continue;
        }
        const attacking = ["windup", "charge", "warn", "dive", "shoot", "attack"].includes(e.state);
        const name = attacking ? k.attack : k.move;
        let frame2;
        if ((k.ai === "slime" || e.kind.startsWith("slime")) && e.state === "air") frame2 = anim(k.sheet, k.move)?.[e.vy < 0 ? 2 : 3];
        else if (attacking && e.state !== "dive" && e.state !== "charge") frame2 = onceFrame(k.sheet, name, e.animT / 0.55);
        else frame2 = loopFrame(k.sheet, name, e.animT, (k.ai || e.kind) === "swooper" ? 12 : 8);
        const sc = enemyScale(k.sheet, k.move, k.vis);
        const warnShake = e.state === "warn" ? Math.sin(s.time * 60) * 2 : 0;
        flashDraw(img(k.sheet), frame2, e.x + warnShake, e.y + 1, sc, e.face > 0, e.flash);
        if (e.state === "warn") {
          ctx.fillStyle = "#ff5a3c";
          ctx.font = "bold 18px 'Baloo 2', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("!", e.x, e.y - e.h - 16);
        }
      }
    }
    function drawBosses(s, inView) {
      for (const b2 of Object.values(s.bosses)) {
        if (!inView(b2.x, b2.y, 200)) continue;
        const k = BOSS[b2.kind];
        const ai = bossAi(b2.kind);
        if (ai === "shadow") {
          drawShadowBoss(s, b2);
          continue;
        }
        let frame2;
        if (b2.state === "defeat") frame2 = onceFrame(k.sheet, "defeat", 1 - b2.t / 1.4);
        else if (ai === "moss" || ai === "stag") {
          if (b2.state === "windup") frame2 = anim(k.sheet, "attack")[Math.min(1, Math.floor(b2.animT * 5))];
          else if (b2.state === "leap") frame2 = anim(k.sheet, "attack")[b2.vy < 0 ? 2 : b2.vy < 300 ? 3 : 4];
          else if (b2.state === "aim" || b2.state === "charge") frame2 = anim(k.sheet, "attack")[b2.state === "aim" ? 1 : 3];
          else if (b2.state === "stuck") frame2 = loopFrame(k.sheet, "hurt", b2.animT, 5);
          else frame2 = loopFrame(k.sheet, b2.flash > 0 ? "hurt" : "idle", b2.animT, 6);
        } else if (ai === "eagle" || ai === "final") {
          if (b2.state === "warn" || b2.state === "dive") frame2 = onceFrame(k.sheet, "attack", b2.state === "warn" ? b2.animT / 1.1 : 0.6 + b2.animT);
          else frame2 = loopFrame(k.sheet, b2.flash > 0 ? "hurt" : "idle", b2.animT, 9);
        } else {
          if (b2.state === "raise") frame2 = onceFrame(k.sheet, "attack", b2.animT / 0.7 * 0.6);
          else if (b2.state === "slam") frame2 = anim(k.sheet, "attack")[4];
          else if (b2.state === "stuck") frame2 = loopFrame(k.sheet, "hurt", b2.animT, 4);
          else frame2 = loopFrame(k.sheet, "idle", b2.animT, 7);
        }
        const sc = enemyScale(k.sheet, "idle", k.vis);
        flashDraw(img(k.sheet), frame2, b2.x, b2.y + 2, sc, b2.face > 0, b2.flash);
        if (ai === "crab" && b2.state === "stuck") {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = `rgba(120, 255, 240, ${0.35 + 0.25 * Math.sin(s.time * 10)})`;
          ctx.beginPath();
          ctx.arc(b2.x, b2.y - b2.h * 0.75, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }
    function drawShadowBoss(s, b2) {
      const P = "SKIN_BAYANGAN";
      if (b2.state === "vanish") return;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(b2.x, b2.y - 30, 4, b2.x, b2.y - 30, 48);
      g.addColorStop(0, `rgba(150, 90, 255, ${0.35 + 0.15 * Math.sin(s.time * 6)})`);
      g.addColorStop(1, "rgba(150, 90, 255, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(b2.x - 50, b2.y - 80, 100, 90);
      ctx.restore();
      let sheet = `${P}_BASIC`;
      let frame2;
      if (b2.state === "defeat") {
        sheet = `${P}_ACTION`;
        frame2 = onceFrame(sheet, "defeat", 1 - b2.t / 1.4);
      } else if (b2.state === "aim") {
        sheet = `${P}_BOW`;
        frame2 = onceFrame(sheet, "draw_ground", 1 - b2.t / 0.7);
      } else if (b2.state === "rest") {
        sheet = `${P}_BOW`;
        frame2 = onceFrame(sheet, "release_ground", 1 - b2.t / 0.9);
      } else if (b2.flash > 0) {
        sheet = `${P}_ACTION`;
        frame2 = onceFrame(sheet, "hurt", 1 - b2.flash / 0.2);
      } else frame2 = loopFrame(sheet, "idle", b2.animT, 6);
      flashDraw(img(sheet), frame2, b2.x, b2.y + 1, PLAYER_VIS_H / 330, b2.face < 0, b2.flash);
    }
    function playerPose(p) {
      const B = `${prefix}_BASIC`;
      const one = (k, n, u) => [k.replace(/^AERA/, prefix), onceFrame(k.replace(/^AERA/, prefix), n, u)];
      const loop = (k, n, fps) => [k.replace(/^AERA/, prefix), loopFrame(k.replace(/^AERA/, prefix), n, p.animT, fps)];
      switch (p.mode) {
        case "dead":
          return one("AERA_ACTION", "defeat", p.animT / 0.7);
        case "getup":
          return one("AERA_MISC", "get_up", 1 - p.modeT / 0.6);
        case "ability":
          return loop("AERA_MISC", "ability_get", 8);
        case "interact":
          return one("AERA_MISC", "interact", p.animT / 0.35);
        case "trapped":
          return loop("AERA_AIR", "apex", 6);
        case "hurt":
          return one("AERA_ACTION", "hurt", p.animT / 0.35);
        case "dash":
          return one("AERA_ACTION", "dash", p.animT / 0.17);
        case "ledge":
          return loop("AERA_CLIMB", "ledge_hang", 5);
        case "climb":
          return one("AERA_CLIMB", "ledge_climb", 1 - p.modeT / 0.32);
        case "vine":
          return loop("AERA_CLIMB", "vine_climb", 9);
        case "rope": {
          const a = anim(`${prefix}_CLIMB`, "rope_swing");
          const i = Math.max(0, Math.min(4, Math.round(2 + p.rope.ang * 2.4 * p.face)));
          return [`${prefix}_CLIMB`, a?.[i]];
        }
        case "swim":
          return loop("AERA_MISC", "swim", 7);
        default:
          break;
      }
      const air = !p.onGround;
      if (p.aiming) return one("AERA_BOW", air ? "draw_air" : "draw_ground", p.drawT / 0.3);
      if (p.releaseT > 0) return one("AERA_BOW", air ? "release_air" : "release_ground", 1 - p.releaseT / 0.24);
      if (air) {
        if (p.jumpT > 0) return [`${prefix}_AIR`, anim(`${prefix}_AIR`, "jump_start")?.[3 + (p.jumpT < 0.08 ? 1 : 0)]];
        if (p.vy < -160) return loop("AERA_AIR", "rise", 10);
        if (p.vy < 160) return loop("AERA_AIR", "apex", 8);
        return loop("AERA_AIR", "fall", 10);
      }
      if (p.landT > 0) return one("AERA_ACTION", "land", 1 - p.landT / 0.18);
      if (p.turnT > 0) return one(B, "turn", 1 - p.turnT / 0.16);
      const sp = Math.abs(p.vx);
      if (sp > 140) return loop(B, "run", 14);
      if (sp > 20) return loop(B, "walk", 11);
      return loop(B, "idle", 6);
    }
    function drawPlayer(s) {
      const p = s.player;
      if (p.iFrames > 0 && p.mode !== "dead" && p.mode !== "getup" && Math.floor(p.iFrames * 20) % 2 === 0) return;
      const [sheet, frame2] = playerPose(p);
      const sc = PLAYER_VIS_H / 330;
      let y = p.y + 1;
      if (p.mode === "ledge") y += 10;
      if (p.mode === "rope") y += 14;
      if (p.mode === "swim") y -= 8;
      drawFrame(ctx, img(sheet), frame2, p.x, y, sc, p.face < 0);
      if (p.carry) {
        const f = s.fruits.find((q) => q.id === p.carry);
        if (f) drawCentered(ctx, img("PROPS_B"), fr("PROPS_B", `fruit_${f.w}`), p.x, p.y - p.h - 14, 16 + f.w * 4);
      }
      if (p.mode === "trapped") drawCentered(ctx, img("PROPS_B"), fr("PROPS_B", "bubble"), p.x, p.y - p.h / 2, 64);
    }
    function drawRope(s, t) {
      const p = s.player;
      if (p.mode !== "rope" || !p.rope) return;
      const R = p.rope;
      const hx = p.x;
      const hy = p.y - p.h - 6;
      const dx = hx - R.ax;
      const dy = hy - R.ay;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const sag = Math.max(0, 11 - Math.abs(R.angV) * 9) * (R.angV >= 0 ? 1 : -1);
      const mx = (R.ax + hx) / 2 + nx * sag;
      const my = (R.ay + hy) / 2 + ny * sag;
      const at = (u) => ({
        x: (1 - u) * (1 - u) * R.ax + 2 * (1 - u) * u * mx + u * u * hx,
        y: (1 - u) * (1 - u) * R.ay + 2 * (1 - u) * u * my + u * u * hy
      });
      const line = () => {
        ctx.beginPath();
        ctx.moveTo(R.ax, R.ay);
        ctx.quadraticCurveTo(mx, my, hx, hy);
        ctx.stroke();
      };
      ctx.save();
      ctx.lineCap = "round";
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(140, 205, 255, 0.3)";
      ctx.lineWidth = 7;
      line();
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#dfeaff";
      ctx.lineWidth = 2.6;
      line();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1.1;
      for (const dir of [1, -1]) {
        ctx.beginPath();
        for (let i = 0; i <= 12; i++) {
          const u = i / 12;
          const b2 = at(u);
          const w = Math.sin(u * 9 + t * 6) * 2.2 * dir * Math.sin(u * Math.PI);
          if (i) ctx.lineTo(b2.x + nx * w, b2.y + ny * w);
          else ctx.moveTo(b2.x + nx * w, b2.y + ny * w);
        }
        ctx.stroke();
      }
      const bead = at(t * 0.85 % 1);
      halo(bead.x, bead.y, 9, "#bfe4ff", 0.55);
      halo(R.ax, R.ay, 15, "#cfe6ff", 0.45);
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#f4f7ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(R.ax, R.ay, 5 + Math.sin(t * 7) * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(hx, hy, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const ARROW_LOOK = {
      normal: { core: "#fff7dc", glow: "#e8c877", w: 3.2, halo: 12 },
      sprout: { core: "#e2ffbe", glow: "#5cc23a", w: 4.2, halo: 17 },
      thread: { core: "#ffffff", glow: "#9fc6ff", w: 3.6, halo: 15 },
      echo: { core: "#f2e0ff", glow: "#a65cff", w: 4, halo: 18 },
      wind: { core: "#eafcff", glow: "#5fcdf5", w: 4.2, halo: 17 },
      ember: { core: "#ffe59a", glow: "#ff6a1c", w: 4.6, halo: 20 }
    };
    const ARROW_SIZE = { thread: 14, normal: 9, sprout: 9 };
    const tint = (hex, a) => {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255}, ${a})`;
    };
    function halo(x, y, r, color, alpha) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, tint(color, alpha));
      g.addColorStop(1, tint(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    function streak(tr, look2, strength) {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = look2.glow;
      for (let i = 2; i < tr.length; i += 2) {
        const u = i / (tr.length - 1);
        ctx.globalAlpha = (0.1 + 0.5 * u * u) * strength;
        ctx.lineWidth = look2.w * (0.45 + 1.25 * u) * strength;
        ctx.beginPath();
        ctx.moveTo(tr[i - 2].x, tr[i - 2].y);
        ctx.lineTo(tr[i].x, tr[i].y);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = look2.core;
      for (let i = 1; i < tr.length; i++) {
        const u = i / (tr.length - 1);
        ctx.globalAlpha = (0.07 + 0.42 * u) * strength;
        ctx.lineWidth = look2.w * (0.2 + 0.7 * u) * strength;
        ctx.beginPath();
        ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
        ctx.lineTo(tr[i].x, tr[i].y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    function sideways(tr, i) {
      const a = tr[Math.max(0, i - 1)];
      const b2 = tr[Math.min(tr.length - 1, i + 1)];
      const dx = b2.x - a.x;
      const dy = b2.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      return { x: -dy / len, y: dx / len };
    }
    function weave(tr, phase, amp) {
      ctx.beginPath();
      for (let i = 0; i < tr.length; i++) {
        const u = i / (tr.length - 1);
        const n = sideways(tr, i);
        const w = Math.sin(phase + i * 1.1) * amp(u);
        if (i) ctx.lineTo(tr[i].x + n.x * w, tr[i].y + n.y * w);
        else ctx.moveTo(tr[i].x + n.x * w, tr[i].y + n.y * w);
      }
      ctx.stroke();
    }
    function drawTrail(a, look2, t, sheet, name, size, ang) {
      const tr = a.trail;
      if (!tr || tr.length < 2) return;
      if (a.type === "sprout") {
        streak(tr, look2, 1);
        ctx.globalCompositeOperation = "source-over";
        for (let i = 1; i < tr.length; i += 2) {
          const u = i / (tr.length - 1);
          const n = sideways(tr, i);
          const swing = Math.sin(a.seed + i * 1.1 + t * 14) * (4 + 3 * u);
          ctx.globalAlpha = 0.3 + 0.55 * u;
          ctx.fillStyle = i % 4 ? look2.glow : look2.core;
          ctx.beginPath();
          ctx.ellipse(tr[i].x + n.x * swing, tr[i].y + n.y * swing, 3.4 * u + 1, 1.7 * u + 0.8, Math.atan2(n.y, n.x), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 1;
        return;
      }
      if (a.type === "thread") {
        streak(tr, look2, 0.8);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = look2.glow;
        weave(tr, a.seed - t * 18, (u) => 1.5 + 5 * (1 - u));
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = look2.core;
        weave(tr, a.seed - t * 18, (u) => 1.5 + 5 * (1 - u));
        for (let i = 2; i < tr.length; i += 3) {
          ctx.globalAlpha = 0.5 * (i / tr.length);
          ctx.fillStyle = look2.core;
          ctx.beginPath();
          ctx.arc(tr[i].x, tr[i].y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        return;
      }
      if (a.type === "echo") {
        streak(tr, look2, 0.7);
        ctx.globalCompositeOperation = "source-over";
        for (let i = tr.length - 3; i > 0; i -= 3) {
          ctx.globalAlpha = 0.1 + 0.34 * (i / tr.length);
          drawCentered(ctx, img(sheet), fr(sheet, name), tr[i].x, tr[i].y, size, ang);
        }
        ctx.globalCompositeOperation = "lighter";
        const pulse = a.t * 3 % 1;
        ctx.globalAlpha = (1 - pulse) * 0.5;
        ctx.strokeStyle = look2.glow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(a.x, a.y, 6 + pulse * 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        return;
      }
      if (a.type === "wind") {
        streak(tr, look2, 0.75);
        for (const lit of [false, true]) {
          ctx.globalCompositeOperation = lit ? "lighter" : "source-over";
          ctx.globalAlpha = lit ? 0.5 : 0.45;
          ctx.lineWidth = lit ? 1.6 : 2.4;
          ctx.strokeStyle = lit ? look2.core : look2.glow;
          for (const dir of [1, -1]) weave(tr, a.seed - t * 26 + (dir > 0 ? 0 : Math.PI), (u) => dir * (2 + 7 * u));
        }
        ctx.globalAlpha = 1;
        return;
      }
      if (a.type === "ember") {
        for (let i = 2; i < tr.length; i += 3) {
          const u = i / (tr.length - 1);
          halo(tr[i].x, tr[i].y, 6 + 11 * u, i % 2 ? look2.glow : "#ff5a2a", 0.16 + 0.32 * u);
        }
        streak(tr, look2, 0.6);
        for (let i = 0; i < 3; i++) {
          const f = (t * 9 + a.seed + i * 2.1) % 1;
          const j = Math.max(0, tr.length - 1 - Math.floor(f * (tr.length - 1)));
          const n = sideways(tr, j);
          ctx.globalAlpha = 1 - f;
          ctx.fillStyle = i % 2 ? "#ffd27a" : look2.glow;
          ctx.beginPath();
          ctx.arc(tr[j].x + n.x * (f * 14 - 7), tr[j].y + n.y * (f * 14 - 7) - f * 10, 2.2 * (1 - f) + 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        return;
      }
      streak(tr, look2, 0.65);
      for (let i = 0; i < 2; i++) {
        const f = (t * 7 + a.seed + i * 0.5) % 1;
        const j = Math.max(1, Math.round((1 - f) * (tr.length - 1)));
        ctx.globalAlpha = (1 - f) * 0.8;
        ctx.fillStyle = look2.core;
        ctx.beginPath();
        ctx.arc(tr[j].x, tr[j].y, 1.5 * (1 - f) + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function drawArrows(s, inView, t) {
      for (const a of s.arrows) {
        if (!inView(a.x, a.y, 160)) continue;
        const look2 = ARROW_LOOK[a.type] || ARROW_LOOK.normal;
        const ang = Math.atan2(a.vy, a.vx);
        const [sheet, name] = ARROW_SPRITE[a.type] || ARROW_SPRITE.normal;
        const size = ARROW_SIZE[a.type] || 11;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (a.stuck) halo(a.x, a.y, look2.halo * 0.8, look2.glow, 0.3 * Math.min(1, a.life * 1.6));
        else {
          drawTrail(a, look2, t, sheet, name, size, ang);
          halo(a.x, a.y, look2.halo, look2.glow, 0.5);
        }
        ctx.restore();
        if (a.stuck) ctx.globalAlpha = Math.min(1, a.life * 2);
        drawCentered(ctx, img(sheet), fr(sheet, name), a.x, a.y, size, ang);
        ctx.globalAlpha = 1;
      }
    }
    function drawRelease(s, inView) {
      const r = s.release;
      if (!r || !inView(r.x, r.y, 80)) return;
      const u = Math.min(1, r.t / r.dur);
      const look2 = ARROW_LOOK[r.type] || ARROW_LOOK.normal;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      halo(r.x, r.y, (11 + 26 * u) * r.pow, look2.glow, 0.5 * (1 - u));
      const rays = () => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const ang = r.ang + (i - 2.5) * 0.42;
          const inner = 6 + 10 * u;
          const outer = inner + (18 - 11 * u) * (i % 2 ? 0.55 : 1);
          ctx.moveTo(r.x + Math.cos(ang) * inner, r.y + Math.sin(ang) * inner);
          ctx.lineTo(r.x + Math.cos(ang) * outer, r.y + Math.sin(ang) * outer);
        }
        ctx.stroke();
      };
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = (1 - u) * 0.8;
      ctx.strokeStyle = look2.glow;
      ctx.lineWidth = 3.6 * (1 - u) + 1;
      rays();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = (1 - u) * 0.9;
      ctx.strokeStyle = look2.core;
      ctx.lineWidth = 2.4 * (1 - u) + 0.6;
      rays();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    function drawShots(s, t, inView) {
      const B = img("PROPS_B");
      for (const sh of s.shots) {
        if (!inView(sh.x, sh.y)) continue;
        if (sh.kind === "bubble") drawCentered(ctx, B, fr("PROPS_B", "bubble"), sh.x, sh.y, 22);
        else if (sh.kind === "wave") {
          const a = anim("FX_A", "splash");
          const frame2 = a?.[2 + Math.floor(t * 12) % 2];
          drawFrame(ctx, img("FX_A"), frame2, sh.x, sh.y + 2, 46 / 276, sh.vx < 0);
        } else if (sh.kind === "fire") {
          const a = anim("FX_C", FXC.fire);
          const frame2 = a?.[1 + Math.floor(t * 10 + sh.x) % 3];
          if (frame2) drawFrame(ctx, img("FX_C"), frame2, sh.x, sh.y + 2, 30 / frame2.content.h, false);
        } else if (sh.kind === "orb" || sh.kind === "spark") {
          const col = sh.kind === "orb" ? "255, 220, 120" : "255, 245, 120";
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          const g = ctx.createRadialGradient(sh.x, sh.y, 1, sh.x, sh.y, 14);
          g.addColorStop(0, `rgba(${col}, 0.95)`);
          g.addColorStop(1, `rgba(${col}, 0)`);
          ctx.fillStyle = g;
          ctx.fillRect(sh.x - 14, sh.y - 14, 28, 28);
          ctx.restore();
          ctx.fillStyle = sh.kind === "orb" ? "#fff2b0" : "#fffbd0";
          ctx.strokeStyle = "#2a170b";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          if (sh.kind === "spark") {
            ctx.moveTo(sh.x - 6, sh.y - 7);
            ctx.lineTo(sh.x + 2, sh.y - 1);
            ctx.lineTo(sh.x - 2, sh.y + 1);
            ctx.lineTo(sh.x + 6, sh.y + 7);
            ctx.lineTo(sh.x - 1, sh.y + 2);
            ctx.lineTo(sh.x + 1, sh.y);
            ctx.closePath();
          } else ctx.arc(sh.x, sh.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (sh.kind === "darrow") {
          ctx.save();
          drawCentered(ctx, img("PROPS_B"), fr("PROPS_B", "arrow_normal"), sh.x, sh.y, 9, Math.atan2(sh.vy, sh.vx));
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = "rgba(150, 90, 255, 0.5)";
          ctx.beginPath();
          ctx.arc(sh.x, sh.y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else drawCentered(ctx, B, fr("PROPS_B", "thorn_shot"), sh.x, sh.y, 10, Math.atan2(sh.vy, sh.vx));
      }
    }
    function drawWaterBack(s, inView) {
      for (const d of ofType("reservoir")) {
        if (!inView(d.x + d.w / 2, d.bottom, 400)) continue;
        const surf = reservoirSurface(s, d);
        if (surf >= d.bottom - 1) continue;
        ctx.fillStyle = "rgba(40, 140, 170, 0.35)";
        ctx.fillRect(d.x, surf, d.w, d.bottom - surf);
      }
    }
    function drawWaterFront(s, t, inView) {
      for (const d of ofType("reservoir")) {
        if (!inView(d.x + d.w / 2, d.bottom, 400)) continue;
        const surf = reservoirSurface(s, d);
        if (surf >= d.bottom - 1) continue;
        ctx.fillStyle = "rgba(70, 200, 220, 0.38)";
        ctx.beginPath();
        ctx.moveTo(d.x, d.bottom);
        for (let x = 0; x <= d.w; x += 8) ctx.lineTo(d.x + x, surf + Math.sin(t * 2.5 + x * 0.08) * 2.5);
        ctx.lineTo(d.x + d.w, d.bottom);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(230, 255, 255, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = 0; x <= d.w; x += 8) ctx[x ? "lineTo" : "moveTo"](d.x + x, surf + Math.sin(t * 2.5 + x * 0.08) * 2.5);
        ctx.stroke();
      }
      const dome = byId.dome;
      if (s.pr.gates.dome && s.gateAnim.dome >= 0.7 && inView(dome.x, dome.y + 200, 300)) {
        const c = dome.current;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createLinearGradient(c.x, 0, c.x + c.w, 0);
        g.addColorStop(0, "rgba(90, 220, 255, 0)");
        g.addColorStop(0.5, "rgba(140, 240, 255, 0.28)");
        g.addColorStop(1, "rgba(90, 220, 255, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = "rgba(220, 255, 255, 0.5)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const yy = c.y + c.h - ((t * 160 + i * 80) % c.h + 0);
          ctx.beginPath();
          ctx.moveTo(c.x + 14 + i * 22, yy);
          ctx.lineTo(c.x + 14 + i * 22, yy - 30);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    function drawFx(s, inView) {
      for (const f of s.fx) {
        if (!inView(f.x, f.y)) continue;
        const a = anim(f.sheet, f.anim);
        if (!a) continue;
        const frame2 = a[Math.min(a.length - 1, Math.floor(f.t / f.dur * a.length))];
        const sc = f.size / a[Math.floor(a.length / 2)].content.h;
        drawFrame(ctx, img(f.sheet), frame2, f.x, f.y, sc, f.flip);
      }
    }
    function drawParticles(s) {
      for (const q of s.parts) {
        ctx.globalAlpha = Math.max(0, q.life / q.max);
        ctx.fillStyle = q.color;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function drawAim(s, opts) {
      const p = s.player;
      const o = bowOrigin(p);
      const look2 = ARROW_LOOK[p.arrowType] || ARROW_LOOK.normal;
      const charge = Math.min(1, p.drawT / 0.3);
      const sp = (opts.tw?.arrowSpeed ?? 620) * (0.72 + 0.28 * charge);
      const step = 1 / 40;
      let x = o.x;
      let y = o.y;
      let vx = p.aimX * sp;
      let vy = p.aimY * sp;
      const dots = [];
      for (let i = 0; i < 44; i++) {
        vy += ARROW_G * step;
        x += vx * step;
        y += vy * step;
        if (isSolidAt(x, y)) break;
        if (i % 2 === 0) dots.push({ x, y });
      }
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (const lit of [false, true]) {
        ctx.globalCompositeOperation = lit ? "lighter" : "source-over";
        for (let i = 0; i < dots.length; i++) {
          const u = 1 - i / dots.length;
          ctx.globalAlpha = lit ? 0.12 + 0.4 * u * u : 0.25 + 0.55 * u * u;
          ctx.fillStyle = lit ? look2.core : look2.glow;
          ctx.beginPath();
          ctx.arc(dots[i].x, dots[i].y, (lit ? 0.7 : 1.4) + 2.1 * u, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "lighter";
      const end = dots[dots.length - 1];
      if (end) {
        const spin = s.time * 2.2;
        ctx.globalAlpha = 0.75;
        ctx.strokeStyle = look2.core;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const ang = spin + i * Math.PI / 2;
          ctx.moveTo(end.x + Math.cos(ang) * 5, end.y + Math.sin(ang) * 5);
          ctx.lineTo(end.x + Math.cos(ang) * 10, end.y + Math.sin(ang) * 10);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      halo(o.x, o.y, 7 + 10 * charge, look2.glow, 0.28 + 0.3 * charge);
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = look2.core;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(o.x, o.y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * charge);
      ctx.stroke();
      ctx.restore();
      if (s.slowmo) {
        ctx.strokeStyle = "rgba(160, 230, 255, 0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(o.x, o.y, 34, 0, Math.PI * 2 * (p.focus / p.focusMax));
        ctx.stroke();
      }
    }
    function drawPrompt(s, label) {
      const p = s.player;
      const text = `E \xB7 ${label}`;
      ctx.font = "800 13px 'Baloo 2', sans-serif";
      const w = ctx.measureText(text).width + 14;
      const x = p.x - w / 2;
      const y = p.y - 92;
      ctx.fillStyle = "rgba(255, 243, 196, 0.95)";
      ctx.strokeStyle = "#2a170b";
      ctx.lineWidth = 2;
      roundRect(x, y, w, 20, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#2a170b";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, p.x, y + 11);
      ctx.textBaseline = "alphabetic";
    }
    function drawHitboxes(s, plats = []) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#00ffaa";
      const p = s.player;
      ctx.strokeRect(p.x - p.w / 2, p.y - p.h, p.w, p.h);
      ctx.strokeStyle = "#ff3b3b";
      for (const e of s.enemies) if (e.alive) ctx.strokeRect(e.x - e.w / 2, e.y - e.h, e.w, e.h);
      for (const b2 of Object.values(s.bosses)) ctx.strokeRect(b2.x - b2.w / 2, b2.y - b2.h, b2.w, b2.h);
      ctx.strokeStyle = "#ffd84a";
      for (const pl of plats) ctx.strokeRect(pl.x, pl.top, pl.w, 4);
    }
    return { canvas, ctx, view, resize, draw };
  }

  // ../.dart_tool/skybound_source/game/game.js
  var CHUNK_COLS = Math.ceil(COLS / 4);
  var CHUNK_COUNT = CHUNK_COLS * Math.ceil(ROWS / 4);
  var SAVE_VERSION = 1;
  var STUCK_HINT_SECONDS = 120;
  function freshProgress() {
    return {
      abilities: { sprout: false, thread: false },
      got: {},
      cps: {},
      cp: null,
      nests: {},
      bosses: {},
      talked: {},
      latches: {},
      switches: { switchR: 0 },
      gardens: {},
      gates: {},
      baskets: { A: [], B: [], C: [] },
      locked: {},
      water: { L: 0, M: 0, U: 0 },
      seqs: {},
      seeds: 0,
      mirrors: {},
      unlocked: {},
      murals: {},
      fans: {},
      vents: {},
      furnace: false,
      burned: {},
      statues: {},
      side: 0,
      links: {},
      podDone: false,
      chests: {},
      skin: "aera",
      coins: 0,
      owned: { aera: true },
      maxArea: 0,
      explored: "0".repeat(CHUNK_COUNT),
      time: 0,
      finished: false,
      settings: { music: 1, sfx: 1, mute: false }
    };
  }
  function restoreProgress(raw) {
    const base = freshProgress();
    if (!raw || typeof raw !== "object") return base;
    for (const k of Object.keys(base)) {
      if (raw[k] === void 0) continue;
      if (base[k] && typeof base[k] === "object" && !Array.isArray(base[k])) base[k] = { ...base[k], ...raw[k] };
      else base[k] = raw[k];
    }
    if (typeof base.explored !== "string" || base.explored.length !== CHUNK_COUNT) base.explored = "0".repeat(CHUNK_COUNT);
    for (const k of ["A", "B", "C"]) if (!Array.isArray(base.baskets[k])) base.baskets[k] = [];
    for (const id of Object.keys(base.cps)) if (byId[id]) base.maxArea = Math.max(base.maxArea, byId[id].area);
    if (!base.owned[base.skin]) base.skin = "aera";
    return base;
  }
  function createGame({ mount, sdk, tweaks, assets, saved, cheat }) {
    const state = { cheat: !!cheat };
    const hud = createHud(mount);
    const inp = createInput(hud.root);
    inp.actions = [];
    const audio = createAudio(sdk, tweaks);
    audio.init();
    let run = null;
    let sprites = null;
    let renderer = null;
    let loadFailed = false;
    let uidN = 0;
    let saveDirty = false;
    let saveTimer = 0;
    let lastInteract = null;
    let mapDirty = false;
    let snapshot = saved && saved.version === SAVE_VERSION ? saved : null;
    const coarse = typeof globalThis.__skyMatchMedia === "function" && (0, globalThis.__skyMatchMedia)("(pointer: coarse)").matches;
    const tw = {};
    const TW_KEYS = ["runSpeed", "jumpPower", "dashSpeed", "arrowSpeed", "aimAssist", "focusSlow", "energyRegen", "zoomTiles", "enemySpeed", "screenShake", "showHitboxes"];
    const readTweaks = () => {
      for (const k of TW_KEYS) tw[k] = tweaks.get(k);
    };
    readTweaks();
    const store = createSpriteStore(assets);
    let loadedArea = -1;
    function startLoad() {
      loadFailed = false;
      hud.setLoading(0.02, "Menumbuhkan Pohon Langit\u2026");
      const a = areaOfY((byId[snapshot?.pr?.cp]?.y ?? byId.start.y) - 10);
      const keys = [...CORE_KEYS, ...skinKeys(snapshot?.pr?.skin || "aera"), ...areaKeys(a), ...areaKeys(a - 1), ...areaKeys(a + 1)];
      store.load([...new Set(keys)], (f) => hud.setLoading(f)).then(() => {
        sprites = store;
        renderer = createRenderer(hud.el.canvas, store);
        renderer.resize();
      }).catch(() => {
        loadFailed = true;
        hud.setLoading(0, "Gagal memuat gambar. Ketuk untuk mencoba lagi.");
      });
    }
    function prefetchAround(a) {
      if (a === loadedArea) return;
      loadedArea = a;
      store.prefetch([...areaKeys(a), ...areaKeys(a + 1), ...areaKeys(a - 1)]);
    }
    hud.el.loading.addEventListener("pointerdown", () => {
      if (loadFailed) startLoad();
    });
    startLoad();
    const ro = new globalThis.__skyResizeObserver(() => renderer?.resize());
    ro.observe(hud.el.canvas);
    const zoomFor = (w, h) => {
      const z = Math.min(w, h) / (tw.zoomTiles * T);
      return Math.max(z, w / (26 * T), h / (30 * T));
    };
    function screenToWorld(clientX, clientY) {
      const r = hud.el.canvas.getBoundingClientRect();
      const z = zoomFor(r.width, r.height);
      return { x: (clientX - r.left - r.width / 2) / z + state.cam.x, y: (clientY - r.top - r.height / 2) / z + state.cam.y };
    }
    function worldRectToClient(x, y, w, h) {
      const r = hud.el.canvas.getBoundingClientRect();
      const z = zoomFor(r.width, r.height);
      return { x: r.left + r.width / 2 + (x - state.cam.x) * z, y: r.top + r.height / 2 + (y - state.cam.y) * z, w: w * z, h: h * z };
    }
    const G = {
      get s() {
        return state;
      },
      inp,
      tw,
      plats: [],
      worldH: WORLD_H,
      rand: () => Math.random(),
      uid: (p) => `${p}_${++uidN}`,
      sfx: (n) => audio.play(n),
      fx(sheet, anim, x, y, dur, size, flip = false) {
        state.fx.push({ id: G.uid("fx"), sheet, anim, x, y, t: 0, dur, size, flip });
      },
      particle(x, y, vx, vy, color, size, life) {
        if (state.parts.length > 160) return;
        state.parts.push({ x, y, vx, vy, color, size, life, max: life });
      },
      splash(x, y) {
        G.fx("FX_A", "splash", x, y + 6, 0.4, 40);
        G.sfx("bubble");
      },
      toast(text, dur = 2.4) {
        state.ui.toast = { text, t: dur };
      },
      banner(text, dur = 2.6) {
        state.ui.banner = { text, t: dur };
      },
      shake(a) {
        state.shakeA = Math.max(state.shakeA || 0, a * tw.screenShake);
      },
      inputLocked: () => Boolean(state.cut || state.ui.dialog || state.ui.menu),
      screenToWorld,
      aimTargets: () => aimTargets(G),
      puzzleArrowHit: (a, x, y) => puzzleArrowHit(G, a, x, y),
      growSprout: (tx, ty, a) => growSprout(G, tx, ty, a),
      waterSurfaceAt: (x, y) => waterSurfaceAt(G, x, y),
      tileAtWorld: (x, y) => tileAt(Math.floor(x / T), Math.floor(y / T)),
      areaOfPlayer: () => areaOfY(state.player.y - 10),
      ropeBroken: () => false,
      defsWithSeq: (key) => defs.filter((d) => d.seq === key),
      seqHit: (key, d) => seqHit(G, key, d),
      giveItem,
      save() {
        saveDirty = true;
      },
      hurt,
      respawn,
      say,
      openGate,
      openTravel(id) {
        state.ui.menu = "travel";
        state.ui.travelFrom = id;
      },
      dropCarry() {
        const p = state.player;
        const f = state.fruits.find((q) => q.id === p.carry);
        p.carry = null;
        if (!f) return;
        f.mode = "free";
        f.x = p.x + p.face * 14;
        f.y = p.y - 30;
        f.vx = p.face * 90;
        f.vy = -160;
      },
      bossIntro(b2) {
        state.ui.boss = b2.id;
        G.banner(BOSS[b2.kind].name, 2.2);
        G.sfx("boss");
        G.shake(5);
      },
      bossDefeated,
      reachTop
    };
    const SEED_TOTAL = ofType("seed").length + ofType("chest").reduce((n, c) => n + (c.item === "seed" || c.item === "both" ? 1 : 0), 0);
    const FEATHER_TOTAL = ofType("feather").length + ofType("chest").reduce((n, c) => n + (c.item === "feather" || c.item === "both" ? 1 : 0), 0);
    function giveItem(item) {
      const pr = state.pr;
      const p = state.player;
      G.sfx("pickup");
      if (item === "seed" || item === "both") {
        pr.seeds = (pr.seeds || 0) + 1;
        if (pr.seeds % 3 === 0) {
          p.maxHp += 1;
          p.hp = p.maxHp;
          G.toast("Tiga Benih Langit! Daun nyawa bertambah.");
        } else G.toast(`Benih Langit ${pr.seeds % 3}/3`);
      }
      if (item === "feather" || item === "both") {
        pr.feathers = (pr.feathers || 0) + 1;
        p.focusMax += 0.5;
        p.focus = p.focusMax;
        if (item === "feather") G.toast("Bulu Fokus! Sky Focus lebih lama.");
      }
    }
    function hurt(n, { fall = false, fromX = null } = {}) {
      const p = state.player;
      if (p.mode === "dead" || state.cut || state.ui.menu === "ending") return;
      if (!fall && p.iFrames > 0) return;
      p.hp -= n;
      G.sfx("hit");
      G.shake(5);
      try {
        if (sdk.device?.haptics?.isSupported?.()) sdk.device.haptics.vibrate(40);
      } catch {
      }
      if (p.carry) G.dropCarry();
      p.rope = null;
      p.aiming = false;
      if (p.hp <= 0) {
        p.hp = 0;
        p.mode = "dead";
        G.sfx("death");
        p.modeT = 1.3;
        p.animT = 0;
        p.vx = 0;
        return;
      }
      if (fall) {
        p.x = p.safe.x;
        p.y = p.safe.y;
        p.vx = 0;
        p.vy = 0;
        p.mode = "getup";
        p.modeT = 0.6;
        p.animT = 0;
        p.iFrames = 1.2;
        G.toast("Aduh! Kembali ke pijakan aman.", 1.6);
        return;
      }
      p.mode = "hurt";
      p.modeT = 0.35;
      p.animT = 0;
      p.iFrames = 1.1;
      p.vx = (fromX !== null ? Math.sign(p.x - fromX) || -p.face : -p.face) * 230;
      p.vy = -300;
      p.onGround = false;
      p.plat = null;
    }
    function respawn() {
      G.sfx("respawn");
      const pr = state.pr;
      const cp = byId[pr.cp] || byId.start;
      const old = state.player;
      state.player = newPlayer(cp.x, cp.y, old.maxHp, old.focusMax);
      state.player.arrowType = old.arrowType;
      for (const f of state.fruits) if (f.mode === "carried" || f.mode === "pull") f.mode = "hang";
      state.arrows = [];
      state.shots = [];
      state.sprouts = [];
      state.ui.boss = null;
      spawnEnemies(G);
      state.cam.x = state.player.x;
      state.cam.y = state.player.y - 40;
      G.toast("Bangkit di altar terakhir.", 1.8);
    }
    function say(name, lines, after) {
      state.ui.dialog = { name, lines, i: 0, after };
      state.player.aiming = false;
      G.sfx("click");
    }
    function advanceDialog() {
      const d = state.ui.dialog;
      d.i++;
      G.sfx("click");
      if (d.i < d.lines.length) return;
      state.ui.dialog = null;
      const p = state.player;
      const pr = state.pr;
      if (d.after === "giveSprout" && !pr.abilities.sprout) {
        pr.abilities.sprout = true;
        p.arrowType = "sprout";
        p.mode = "ability";
        p.modeT = 2;
        p.animT = 0;
        G.sfx("ability");
        G.banner("Panah Tunas didapat!", 3);
        G.toast("Ketuk slot panah (kanan atas) atau Q untuk berganti panah.", 4);
        G.fx("FX_A", "sprout_grow", p.x, p.y, 0.8, 70);
        G.save();
      } else if (d.after?.startsWith("give:")) {
        const ab = d.after.slice(5);
        if (pr.abilities[ab]) return;
        pr.abilities[ab] = true;
        p.arrowType = ab;
        p.mode = "ability";
        p.modeT = 2;
        p.animT = 0;
        G.sfx("ability");
        G.banner(`${ARROW_NAME[ab]} didapat!`, 3);
        G.toast(
          { echo: "Panah Gema membunyikan lonceng dan kristal resonansi.", wind: "Panah Angin memutar arah kipas.", ember: "Panah Bara menyalakan tungku dan membakar semak kering." }[ab],
          4
        );
        G.fx("FX_C", ab === "ember" ? FXC.fire : ab === "wind" ? FXC.wind : FXC.spark, p.x, p.y, 0.6, 70);
        G.save();
      } else if (d.after === "giveThread" && !pr.abilities.thread) {
        pr.abilities.thread = true;
        p.arrowType = "thread";
        p.mode = "ability";
        p.modeT = 2;
        p.animT = 0;
        G.sfx("ability");
        G.banner("Panah Benang didapat!", 3);
        G.toast("Tembak cincin jangkar untuk berayun. Lompat untuk melepas.", 4);
        G.fx("FX_B", "thread_attach", p.x, p.y - 20, 0.6, 60);
        G.save();
      }
    }
    function openGate(id) {
      const pr = state.pr;
      if (pr.gates[id]) return;
      pr.gates[id] = true;
      setBlocks(pr);
      state.gateAnim[id] = 0;
      const g = byId[id];
      state.cut = { x: g.x + g.w / 2, y: g.y + g.h + 60, t: 2.8 };
      G.sfx("gate");
      G.shake(6);
      G.banner(
        {
          gate1: "Akar mati menjadi tangga!",
          door2: "Pintu kayu terangkat!",
          dome: "Kubah air menjadi arus!",
          gate4: "Pintu matahari mekar terbuka!",
          gate5: "Lagu yang hilang terdengar lagi!",
          gate6: "Bunga angin menenangkan badai!",
          gate7: "Bunga bara mekar!",
          gate9: "Pintu bulan menjadi nyata!",
          gate10: "Satu detik yang tepat!",
          gate11: "Segel petir padam!",
          gate13: "Rasi kehidupan tersambung!"
        }[id] || "Segel terbuka!",
        3
      );
      G.save();
    }
    function bossDefeated(b2) {
      const pr = state.pr;
      pr.bosses[b2.id] = true;
      pr.coins = (pr.coins || 0) + COIN_BOSS;
      b2.gone = true;
      state.ui.boss = null;
      G.fx("FX_B", "poof", b2.x, b2.y, 0.7, 120);
      G.sfx("poof");
      G.sfx("pickup");
      if (b2.id === "boss1") {
        G.banner("Induk Lumut tenang kembali", 2.6);
        say("Tetua Lumi", ["Aera! Kamu berhasil menenangkannya\u2026", "Datanglah ke sini, Nak. Aku punya sesuatu untukmu."], null);
      } else if (byId[b2.id].final) {
        G.banner("Penjaga Mahkota terbebas", 3);
        reachTop();
      } else G.banner(`${BOSS[b2.kind].name} kalah!`, 2.6);
      G.save();
    }
    function reachTop() {
      if (state.ui.menu === "ending") return;
      state.pr.finished = true;
      state.ui.menu = "ending";
      G.sfx("ability");
      G.save();
    }
    const el = hud.el;
    const queue = (a) => inp.actions.push(a);
    el.root.querySelector(".resume-btn").addEventListener("click", () => queue({ type: "resume" }));
    el.root.querySelector(".restart-btn").addEventListener("click", (e) => {
      const b2 = e.currentTarget;
      if (!b2.classList.contains("confirm")) {
        b2.classList.add("confirm");
        b2.querySelector(".control-label").textContent = "Yakin? Ketuk lagi";
        return;
      }
      b2.classList.remove("confirm");
      b2.querySelector(".control-label").textContent = "Mulai dari awal";
      newGame();
    });
    el.hintBtn.addEventListener("click", () => queue({ type: "hint" }));
    el.root.querySelector(".travel-close").addEventListener("click", () => queue({ type: "closeMenu" }));
    el.root.querySelector(".ending-btn").addEventListener("click", () => queue({ type: "afterEnding" }));
    el.dialog.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      inp.advancePressed = true;
    });
    for (const tab of el.root.querySelectorAll(".tab"))
      tab.addEventListener("click", () => {
        el.root.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t === tab));
        el.root.querySelectorAll(".tab-body").forEach((b2) => b2.classList.toggle("on", b2.classList.contains(`tab-${tab.dataset.tab}`)));
        if (tab.dataset.tab === "map") hud.drawMap(state);
      });
    const volMusic = el.root.querySelector(".vol-music");
    const volSfx = el.root.querySelector(".vol-sfx");
    const volMute = el.root.querySelector(".vol-mute");
    const pushSettings = () => queue({ type: "settings", music: Number(volMusic.value), sfx: Number(volSfx.value), mute: volMute.checked });
    volMusic.addEventListener("input", pushSettings);
    volSfx.addEventListener("input", pushSettings);
    volMute.addEventListener("change", pushSettings);
    function onPauseOpen() {
      const st = state.pr.settings;
      volMusic.value = st.music;
      volSfx.value = st.sfx;
      volMute.checked = st.mute;
      el.root.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === "map"));
      el.root.querySelectorAll(".tab-body").forEach((b2) => b2.classList.toggle("on", b2.classList.contains("tab-map")));
      mapDirty = true;
      fillHint();
    }
    function fillHint() {
      const o = objective(state.pr, G.areaOfPlayer());
      el.hintGoal.textContent = o[0];
      const tier = state.ui.hintTier || 0;
      el.hintMore.textContent = tier >= 1 ? o[Math.min(tier, 2)] : "";
      el.hintBtn.hidden = tier >= 2;
    }
    function onTravelOpen() {
      const pr = state.pr;
      const list = ofType("nest").filter((d) => pr.nests[d.id] && d.id !== state.ui.travelFrom);
      el.travelList.innerHTML = "";
      if (!list.length) {
        el.travelList.innerHTML = `<p class="muted">Aktifkan sarang lain untuk bisa terbang ke sana.</p>`;
        return;
      }
      for (const d of list) {
        const b2 = globalThis.__skyDocument.createElement("button");
        b2.className = "menu-btn";
        b2.innerHTML = `<span class="control-label">${AREA_NAMES[d.area]}</span>`;
        b2.addEventListener("click", () => queue({ type: "travel", id: d.id }));
        el.travelList.appendChild(b2);
      }
    }
    function onEndingOpen() {
      const pr = state.pr;
      const mins = Math.floor(pr.time / 60);
      const secs = Math.floor(pr.time % 60);
      el.endingText.textContent = "Jantung Pohon berdetak lagi. Akar bercahaya menyambungkan tiga belas lapisan, dari Lembah Akar Embun hingga Mahkota Bintang \u2014 dan dunia tetap terbuka untuk rahasia yang tertinggal.";
      el.endingStats.innerHTML = `<span>Waktu ${mins}:${String(secs).padStart(2, "0")}</span><span>Benih ${pr.seeds || 0}/${SEED_TOTAL}</span><span>Bulu ${pr.feathers || 0}/${FEATHER_TOTAL}</span>`;
    }
    function processActions() {
      const acts = inp.actions.splice(0);
      for (const a of acts) {
        if (["resume", "closeMenu", "hint", "afterEnding"].includes(a.type)) G.sfx("click");
        if (a.type === "resume" || a.type === "closeMenu") state.ui.menu = null;
        else if (a.type === "hint") {
          state.ui.hintTier = Math.min(2, (state.ui.hintTier || 0) + 1);
          fillHint();
        } else if (a.type === "settings") {
          state.pr.settings = { music: a.music, sfx: a.sfx, mute: a.mute };
          audio.setLocal(state.pr.settings);
          G.save();
        } else if (a.type === "warp") {
          if (!state.cheat && a.area > state.pr.maxArea) {
            G.toast("Area terkunci \u2014 selesaikan area sebelumnya dulu.");
            G.sfx("deny");
            continue;
          }
          if (state.cheat && a.area > state.pr.maxArea) {
            for (const k of ["sprout", "thread", "echo", "wind", "ember"]) state.pr.abilities[k] = true;
            state.pr.maxArea = a.area;
          }
          state.ui.menu = null;
          if (!state.ui.boss && state.player) {
            if (state.player.carry) G.dropCarry();
            warpToArea(a.area);
            G.sfx("swish");
          }
        } else if (a.type === "travel") {
          const d = byId[a.id];
          const p = state.player;
          state.ui.menu = null;
          if (p.carry) G.dropCarry();
          p.x = d.x;
          p.y = d.y;
          p.vx = 0;
          p.vy = 0;
          p.mode = "getup";
          p.modeT = 0.5;
          state.cam.x = p.x;
          state.cam.y = p.y - 40;
          state.sprouts = [];
          G.fx("FX_B", "sparkle", p.x, p.y - 10, 0.6, 60);
          G.sfx("swish");
        } else if (a.type === "skin") {
          const pr = state.pr;
          const k = skinById(a.id);
          if (!state.cheat && !pr.owned[k.id]) {
            if ((pr.coins || 0) < k.price) {
              G.toast(`Koin kurang \u2014 butuh ${k.price} koin.`);
              G.sfx("deny");
              continue;
            }
            pr.coins -= k.price;
            pr.owned[k.id] = true;
            G.toast(`Jubah ${k.name} dibeli!`);
            G.sfx("pickup");
          } else G.sfx("click");
          pr.skin = k.id;
          store.prefetch(skinKeys(k.id));
          G.save();
        } else if (a.type === "afterEnding") {
          state.ui.menu = null;
          const cp = byId.cp13c;
          const p = state.player;
          p.x = cp.x;
          p.y = cp.y;
          p.vy = 0;
          p.mode = "getup";
          p.modeT = 0.5;
          G.toast("Dunia tetap terbuka \u2014 cari rahasia yang tertinggal.", 3);
        }
      }
    }
    async function newGame() {
      snapshot = null;
      try {
        await sdk.gameState.clear();
      } catch {
      }
      if (run) run.restart();
      else hooks.init(state);
    }
    function writeSave() {
      saveDirty = false;
      const p = state.player;
      snapshot = JSON.parse(JSON.stringify({ version: SAVE_VERSION, pr: state.pr, maxHp: p.maxHp, focusMax: p.focusMax }));
      sdk.gameState.save(snapshot).catch(() => {
      });
    }
    const hooks = {
      init(s) {
        for (const k of Object.keys(s)) delete s[k];
        s.cheat = !!cheat;
        const snap = snapshot;
        s.pr = restoreProgress(snap?.pr);
        setBlocks(s.pr);
        const cp = byId[s.pr.cp] || byId.start;
        s.player = newPlayer(cp.x, cp.y, snap?.maxHp ?? Number(tweaks.get("startHp")), snap?.focusMax ?? 1.5);
        s.arrows = [];
        s.shots = [];
        s.fx = [];
        s.parts = [];
        s.release = null;
        s.enemies = [];
        s.cam = { x: s.player.x, y: s.player.y - 40 };
        s.time = 0;
        s.cut = null;
        s.slowmo = false;
        s.shakeA = 0;
        s.shakeX = 0;
        s.shakeY = 0;
        s.area = areaOfY(s.player.y - 10);
        s.ui = { dialog: null, toast: null, banner: { text: AREA_NAMES[s.area], t: 3 }, menu: null, boss: null, hintTier: 0 };
        initPuzzles(G);
        spawnEnemies(G);
        audio.setLocal(s.pr.settings);
        if (!snap)
          G.toast("Geser joystick untuk bergerak. Tahan busur lalu geser untuk membidik.", 6);
      },
      update(s, dt) {
        if (!sprites) return;
        readTweaks();
        if (inp.firstGesture) {
          inp.firstGesture = false;
          audio.unlock();
        }
        processActions();
        s.time += dt;
        if (inp.pausePressed && !s.ui.dialog && s.ui.menu !== "ending") {
          s.ui.menu = s.ui.menu ? null : "pause";
          G.sfx("click");
          if (s.ui.menu === "pause") s.ui.hintTier = 0;
        }
        tickUi(s, dt);
        if (s.ui.menu) {
          inp.consume();
          return;
        }
        if (s.ui.dialog) {
          if (inp.advancePressed) advanceDialog();
          inp.consume();
          return;
        }
        s.pr.time += dt;
        const wdt = dt * (s.slowmo ? tw.focusSlow : 1);
        updateAim(G, dt);
        updatePuzzles(G, wdt);
        G.plats = buildPlats(G);
        updatePlayer(G, wdt);
        updateArrows(G, wdt);
        updateShots(G, wdt);
        updateEnemies(G, wdt);
        updateBosses(G, wdt);
        lastInteract = G.inputLocked() ? null : findInteract(G);
        if (inp.interactPressed && !G.inputLocked()) {
          if (lastInteract) doInteract(G, lastInteract);
        }
        if (s.cut) {
          s.cut.t -= dt;
          if (s.cut.t <= 0) s.cut = null;
        }
        updateCamera(s, dt);
        updateFx(s, wdt);
        markExplored(s);
        const area = areaOfY(s.player.y - 10);
        if (area !== s.area) {
          s.area = area;
          if (area > s.pr.maxArea) s.pr.maxArea = area;
          const tag = AREA_TAG[AREA_KIND[area]];
          G.banner(tag ? `${AREA_NAMES[area]} \xB7 ${tag}` : AREA_NAMES[area], 2.8);
        }
        tickStuckHint(s, dt);
        prefetchAround(area);
        saveTimer -= dt;
        if (saveDirty && saveTimer <= 0) {
          saveTimer = 1;
          writeSave();
        }
        inp.consume();
      },
      render(s) {
        if (!s.player) return;
        const loading = !sprites || !renderer;
        if (!loading) {
          const z = zoomFor(renderer.view.w, renderer.view.h);
          const touch = coarse || inp.touchUsed;
          const prompt = !touch && lastInteract && !s.ui.dialog && !s.ui.menu ? lastInteract.label : null;
          const skin = skinById(s.pr.skin);
          const ready = SKIN_PARTS.every((p) => store.has(`${skin.prefix}_${p}`));
          const prefix = ready ? skin.prefix : "AERA";
          renderer.draw(s, { zoom: z, tw, plats: G.plats, hitboxes: Boolean(tw.showHitboxes), prompt, prefix });
        }
        const boss = s.ui.boss ? s.bosses[s.ui.boss] : null;
        hud.sync(s, {
          touch: coarse || inp.touchUsed,
          interact: lastInteract,
          bossName: boss ? BOSS[boss.kind].name : "",
          loading,
          onPauseOpen,
          onTravelOpen,
          onEndingOpen,
          seedTotal: SEED_TOTAL,
          featherTotal: FEATHER_TOTAL,
          skins: SKINS,
          store,
          onSkin: (id) => queue({ type: "skin", id })
        });
        if (mapDirty && s.ui.menu === "pause") mapDirty = !hud.drawMap(s);
        audio.setTrack(loading ? -1 : s.ui.boss ? 4 : s.ui.menu === "ending" ? 3 : s.area < 4 ? 1 : s.area < 9 ? 2 : 3);
        audio.setPaused(Boolean(run?.frozen) || s.ui.menu === "pause" || globalThis.__skyDocument.hidden);
      }
    };
    function tickStuckHint(s, dt) {
      if (s.ui.boss) return;
      const o = objective(s.pr, s.area);
      const key = o.join("|");
      const st = s.ui.stuck;
      if (!st || st.key !== key) {
        s.ui.stuck = { key, t: 0, tier: 0 };
        return;
      }
      if (st.tier >= 2) return;
      st.t += dt;
      if (st.t < STUCK_HINT_SECONDS) return;
      st.t = 0;
      st.tier += 1;
      s.ui.hintTier = st.tier;
      G.toast(`Petunjuk: ${o[st.tier]}`, 8);
    }
    function tickUi(s, dt) {
      if (s.ui.toast) {
        s.ui.toast.t -= dt;
        if (s.ui.toast.t <= 0) s.ui.toast = null;
      }
      if (s.ui.banner) {
        s.ui.banner.t -= dt;
        if (s.ui.banner.t <= 0) s.ui.banner = null;
      }
      if (s.valveSpin) {
        s.valveSpin.t -= dt;
        if (s.valveSpin.t <= 0) s.valveSpin = null;
      }
    }
    function updateCamera(s, dt) {
      const p = s.player;
      const view = renderer.view;
      const z = zoomFor(view.w, view.h);
      const hw = view.w / 2 / z;
      const hh = view.h / 2 / z;
      let tx = p.x + p.face * 36;
      let ty = p.y - 44;
      if (p.aiming) {
        tx += p.aimX * 90;
        ty += p.aimY * 90;
        tx = Math.max(p.x - hw * 0.5, Math.min(p.x + hw * 0.5, tx));
        ty = Math.max(p.y - hh * 0.4, Math.min(p.y + hh * 0.4, ty));
      }
      const boss = s.ui.boss ? s.bosses[s.ui.boss] : null;
      if (boss && boss.state !== "defeat") {
        tx = tx * 0.65 + boss.x * 0.35;
        ty = ty * 0.6 + (boss.y - boss.h / 2) * 0.4;
      }
      if (s.cut) {
        tx = s.cut.x;
        ty = s.cut.y;
      }
      const k = Math.min(1, dt * (s.cut ? 3 : 6));
      s.cam.x += (tx - s.cam.x) * k;
      s.cam.y += (ty - s.cam.y) * Math.min(1, dt * (s.cut ? 3 : 5));
      if (!s.cut) {
        s.cam.x = Math.max(p.x - hw * 0.8, Math.min(p.x + hw * 0.8, s.cam.x));
        s.cam.y = Math.max(p.y - hh * 0.8, Math.min(p.y + hh * 0.8, s.cam.y));
      }
      s.cam.x = hw * 2 >= WORLD_W ? WORLD_W / 2 : Math.max(hw, Math.min(WORLD_W - hw, s.cam.x));
      s.cam.y = Math.max(hh, Math.min(WORLD_H - hh, s.cam.y));
      s.shakeA = Math.max(0, (s.shakeA || 0) - dt * 30);
      s.shakeX = s.shakeA ? (Math.random() - 0.5) * s.shakeA : 0;
      s.shakeY = s.shakeA ? (Math.random() - 0.5) * s.shakeA : 0;
    }
    function updateFx(s, dt) {
      if (s.release) {
        s.release.t += dt;
        if (s.release.t >= s.release.dur) s.release = null;
      }
      for (const f of s.fx) f.t += dt;
      s.fx = s.fx.filter((f) => f.t < f.dur);
      for (const q of s.parts) {
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vy += 120 * dt;
        q.life -= dt;
      }
      s.parts = s.parts.filter((q) => q.life > 0);
    }
    function markExplored(s) {
      const p = s.player;
      const cx = Math.floor(p.x / T / 4);
      const cy = Math.floor(p.y / T / 4);
      let ex = s.pr.explored;
      let changed = false;
      for (let y = cy - 2; y <= cy + 2; y++)
        for (let x = cx - 3; x <= cx + 3; x++) {
          if (x < 0 || x >= CHUNK_COLS || y < 0 || y >= Math.ceil(ROWS / 4)) continue;
          const i = y * CHUNK_COLS + x;
          if (ex[i] !== "1") {
            ex = ex.slice(0, i) + "1" + ex.slice(i + 1);
            changed = true;
          }
        }
      if (changed) s.pr.explored = ex;
    }
    function sceneNodes() {
      const s = state;
      if (!s.player || !renderer) return [];
      const nodes = [];
      const r = hud.el.canvas.getBoundingClientRect();
      nodes.push({ id: "backdrop", defId: "def:backdrop", kind: "backdrop", label: "Latar", rect: { x: r.left, y: r.top, w: r.width, h: r.height }, instance: { area: AREA_NAMES[s.area] } });
      nodes.push({ id: "terrain", defId: "def:terrain", kind: "terrain", label: "Medan", rect: { x: r.left, y: r.top, w: r.width, h: r.height }, instance: {} });
      const within = (rc) => rc.x + rc.w > r.left && rc.x < r.right && rc.y + rc.h > r.top && rc.y < r.bottom;
      const add2 = (id, defId, kind, label, x, y, w, h, instance = {}) => {
        const rc = worldRectToClient(x, y, w, h);
        if (within(rc)) nodes.push({ id, defId, kind, label, rect: rc, instance });
      };
      const p = s.player;
      add2("aera", "def:aera", "aera", "Aera", p.x - 16, p.y - 60, 32, 60, { hp: p.hp, mode: p.mode, panah: ARROW_NAME[p.arrowType] });
      for (const a of s.arrows) add2(a.id, "def:bow", "arrow", "Panah", a.x - 10, a.y - 4, 20, 8, { type: a.type });
      for (const e of s.enemies) if (e.alive) add2(e.id, "def:enemy", e.kind, e.kind, e.x - e.w / 2, e.y - e.h, e.w, e.h, { hp: e.hp });
      for (const b2 of Object.values(s.bosses))
        add2(b2.id, `def:${b2.kind}-boss`, `${b2.kind}-boss`, BOSS[b2.kind].name, b2.x - b2.w / 2, b2.y - b2.h, b2.w, b2.h, { hp: b2.hp });
      for (const d of ofType("npc")) add2(d.id, "def:npc", "npc", d.npc, d.x - 16, d.y - 56, 32, 56);
      for (const d of ofType("checkpoint")) add2(d.id, "def:checkpoint", "checkpoint", "Altar", d.x - 18, d.y - 36, 36, 36, { aktif: Boolean(s.pr.cps[d.id]) });
      for (const d of ofType("nest")) add2(d.id, "def:nest", "nest", "Sarang perjalanan", d.x - 20, d.y - 34, 40, 34);
      for (const d of ofType("gate")) add2(d.id, "def:seal-gate", "gate", "Segel", d.x, d.y, d.w, d.h, { terbuka: Boolean(s.pr.gates[d.id]) });
      for (const d of ofType("garden")) add2(d.id, "def:garden", "garden", "Kebun", d.x, d.y, d.w, d.h, { mekar: Boolean(s.pr.gardens[d.id]) });
      for (const t of ["latch", "switch", "valve", "lever", "anchor", "mural", "basket", "mushroom", "spring", "mirror", "eye", "bell", "vent", "furnace", "chest", "statue", "altar", "ring", "core", "starNode", "sporeLamp"])
        for (const d of ofType(t)) add2(d.id, "def:puzzle-prop", t, t, d.x - 18, d.y - 36, 36, 36);
      for (const d of ofType("lift")) add2(d.id, "def:puzzle-prop", "lift", "Lift", d.x, s.lifts[d.id].top, d.w, 14);
      for (const f of s.fruits) add2(f.id, "def:puzzle-prop", "fruit", `Buah ${f.w}`, f.x - 12, f.y - 12, 24, 24, { bobot: f.w, mode: f.mode });
      for (const sp of s.sprouts) add2(sp.id, "def:puzzle-prop", "sprout", "Pijakan tunas", sp.x, sp.top, sp.w, 16);
      for (const d of [...ofType("seed"), ...ofType("feather")]) if (!s.pr.got[d.id]) add2(d.id, "def:pickup", d.type, d.type === "seed" ? "Benih Langit" : "Bulu Fokus", d.x - 12, d.y - 12, 24, 24);
      for (const f of s.fx) add2(f.id, "def:effects", "fx", f.anim, f.x - f.size / 2, f.y - f.size, f.size, f.size);
      for (const d of ofType("reservoir")) add2(d.id, "def:water", "water", "Waduk", d.x, d.bottom - 3 * d.step, d.w, 3 * d.step, { level: s.pr.water[d.key] });
      for (const c of ofType("channel")) add2(c.id, "def:channel", "channel", "Saluran akar", c.before[0].x - 20, c.before[0].y - 20, 40, 40);
      const dom = (sel, id, defId, kind, label) => {
        const n = hud.root.querySelector(sel);
        if (!n || n.offsetParent === null) return;
        const b2 = n.getBoundingClientRect();
        if (b2.width) nodes.push({ id, defId, kind, label, rect: { x: b2.left, y: b2.top, w: b2.width, h: b2.height }, instance: {} });
      };
      dom(".hud-tl", "hud-status", "def:hud", "hud", "Nyawa & meter");
      dom(".hud-tr", "hud-buttons", "def:hud", "hud", "Slot panah & jeda");
      dom(".stick", "ctl-stick", "def:controls", "controls", "Joystick");
      dom(".actions", "ctl-actions", "def:controls", "controls", "Tombol aksi");
      return nodes;
    }
    function warpToArea(a) {
      const cp = ofType("checkpoint").find((d) => d.area === a);
      if (!cp || !state.player) return;
      const p = state.player;
      p.x = cp.x;
      p.y = cp.y;
      p.vx = 0;
      p.vy = 0;
      p.rope = null;
      p.mode = "getup";
      p.modeT = 0.4;
      state.cam.x = p.x;
      state.cam.y = p.y - 40;
      state.sprouts = [];
      store.prefetch([...areaKeys(a), ...areaKeys(a + 1), ...areaKeys(a - 1)]);
    }
    return {
      state,
      hooks,
      warpToArea,
      areaIndex: () => state.player ? areaOfY(state.player.y - 10) : 0,
      setRun(r) {
        run = r;
      },
      sceneNodes,
      openGate,
      respawn,
      say,
      getState: () => ({ started: Boolean(state.player), score: state.pr?.seeds ?? 0 }),
      destroy() {
        inp.destroy();
        ro.disconnect();
        audio.destroy();
        mount.replaceChildren();
      }
    };
  }

  // ../.dart_tool/skybound_source/entry.js
  var b = globalThis.__bridge = { width: 960, height: 540, commands: [], sounds: [], track: -1, settings: {}, pendingSave: null };
  var props = { fillStyle: "#000000", strokeStyle: "#000000", lineWidth: 1, globalAlpha: 1, globalCompositeOperation: "source-over", lineCap: "butt", lineJoin: "miter", lineDashOffset: 0, font: "10px sans-serif", textAlign: "start", textBaseline: "alphabetic" };
  var states = [];
  var methods = {
    measureText(t) {
      const size = Number((props.font.match(/([\d.]+)px/) || [])[1] || 10);
      return { width: Array.from(String(t)).reduce((n, c) => n + (b.metrics?.[c] ?? 0.56) * size, 0) };
    },
    createPattern(im, repeat) {
      return { kind: "pattern", image: im.key, repeat, matrix: [1, 0, 0, 1, 0, 0], setTransform(m) {
        this.matrix = m.values;
      } };
    },
    createLinearGradient(...args) {
      return { kind: "linear", args, stops: [], addColorStop(p, c) {
        this.stops.push([p, c]);
      } };
    },
    createRadialGradient(...args) {
      return { kind: "radial", args, stops: [], addColorStop(p, c) {
        this.stops.push([p, c]);
      } };
    },
    drawImage(im, ...args) {
      b.commands.push(["drawImage", im.key, ...args]);
    },
    save() {
      states.push({ ...props });
      b.commands.push(["save"]);
    },
    restore() {
      if (states.length) Object.assign(props, states.pop());
      b.commands.push(["restore"]);
    }
  };
  for (const name of ["setTransform", "translate", "rotate", "scale", "beginPath", "closePath", "moveTo", "lineTo", "quadraticCurveTo", "bezierCurveTo", "rect", "arc", "arcTo", "ellipse", "fill", "stroke", "clip", "fillRect", "strokeRect", "clearRect", "fillText", "strokeText", "setLineDash"]) methods[name] = (...args) => b.commands.push([name, ...args]);
  b.context = new Proxy(methods, { get(t, k) {
    return k in t ? t[k] : props[k];
  }, set(t, k, v) {
    if (props[k] === v) return true;
    props[k] = v;
    if (!k.startsWith("imageSmoothing")) b.commands.push(["=", k, v]);
    return true;
  } });
  globalThis.__skyWindow = { devicePixelRatio: 1 };
  globalThis.__skyDocument = { hidden: false, createElement: element };
  globalThis.__skyResizeObserver = class {
    constructor(cb) {
      b.resize = cb;
    }
    observe() {
    }
    disconnect() {
    }
  };
  globalThis.__skyDOMMatrix = class {
    constructor(v) {
      this.values = v;
    }
  };
  globalThis.__skyMatchMedia = () => ({ matches: true });
  var game;
  globalThis.skyboundInit = (config) => {
    b.width = config.width;
    b.height = config.height;
    b.metrics = config.metrics;
    const store = { img: {}, frames: {}, anims: {}, version: 1, has(k) {
      return !!this.img[k];
    }, load(keys) {
      for (const k of keys) b.required.add(k);
      return Promise.resolve();
    }, prefetch(keys) {
      for (const k of keys) b.required.add(k);
    } };
    b.required = /* @__PURE__ */ new Set();
    for (const [k, v] of Object.entries(config.catalog)) {
      store.img[k] = { key: k, width: v.width, height: v.height };
      if (v.frames) {
        const frames = Object.fromEntries(v.frames.map((f) => [f.name, f]));
        store.frames[k] = frames;
        store.anims[k] = Object.fromEntries(v.animations.map((a) => [a.name, a.frames.map((f) => frames[f.name] ?? f)]));
      }
    }
    b.spriteStore = store;
    const sdk = { gameState: { save(v) {
      b.pendingSave = v;
      return Promise.resolve();
    }, clear() {
      b.pendingSave = { clear: true };
      return Promise.resolve();
    } }, device: { haptics: { isSupported: () => true, vibrate() {
      b.haptic = true;
    } } } };
    game = createGame({ mount: element(), sdk, tweaks: { get: (k) => config.tweaks[k]?.value ?? config.tweaks[k] }, saved: config.saved, cheat: !!config.cheat });
    game.hooks.init(game.state);
    game.setRun({ restart: () => game.hooks.init(game.state), frozen: false });
    return true;
  };
  function hudState() {
    const s = game.state, p = s.player, pr = s.pr, u = s.ui, info = b.info || {}, boss = u.boss ? s.bosses[u.boss] : null;
    return { hp: p.hp, maxHp: p.maxHp, energy: p.energy, focus: p.focus, focusMax: p.focusMax, arrow: p.arrowType, arrowName: ARROW_NAME[p.arrowType], arrowColor: ARROW_COLOR[p.arrowType], area: s.area, areaName: AREA_NAMES[s.area], banner: u.banner?.text ?? "", toast: u.toast?.text ?? "", dialog: u.dialog, menu: u.menu, boss: boss ? { name: info.bossName, hp: boss.hp, max: boss.max } : null, interact: info.interact?.label ?? "", skin: pr.skin, coins: pr.coins || 0, owned: pr.owned, maxArea: pr.maxArea || 0, cheat: !!s.cheat, settings: pr.settings, slowmo: s.slowmo, seeds: pr.seeds, feathers: pr.feathers || 0, seedTotal: info.seedTotal, featherTotal: info.featherTotal, time: pr.time, hintTier: u.hintTier, hints: objective(pr, s.area), skins: SKINS, areas: AREA_NAMES, travel: defs.filter((d) => d.type === "nest" && pr.nests[d.id] && d.id !== u.travelFrom).map((d) => ({ id: d.id, name: AREA_NAMES[d.area] })), map: u.menu === "pause" ? { explored: pr.explored, player: { x: p.x, y: p.y }, cps: pr.cps, nests: pr.nests, gates: pr.gates } : null };
  }
  globalThis.skyboundFrame = (input, dt, width, height) => {
    if (width !== b.width || height !== b.height) {
      b.width = width;
      b.height = height;
      b.resize?.();
    }
    const i = b.input;
    i.keys = input.keys || {};
    i.stickX = input.stickX || 0;
    i.stickY = input.stickY || 0;
    i.jumpHeld = !!input.jumpHeld;
    i.touchUsed = input.touch !== false;
    if (input.aim) Object.assign(i.aim, input.aim);
    for (const flag of input.pressed || []) i[flag] = true;
    i.actions.push(...input.actions || []);
    if (input.restart) {
      b.hud.el.root.querySelector(".restart-btn").dispatch("click");
      b.hud.el.root.querySelector(".restart-btn").dispatch("click");
    }
    b.commands = Object.entries(props).map(([k, v]) => ["=", k, v]);
    b.sounds = [];
    let left = Math.min(Math.max(dt, 0), 0.1);
    if (left === 0) game.hooks.update(game.state, 0);
    while (left > 0) {
      const step = Math.min(left, 1 / 60);
      game.hooks.update(game.state, step);
      left -= step;
    }
    game.hooks.render(game.state);
    const out = { commands: b.commands, hud: hudState(), required: [...b.required], sounds: b.sounds, track: b.track, audioPaused: b.audioPaused, save: b.pendingSave, haptic: b.haptic };
    b.required.clear();
    b.pendingSave = null;
    b.haptic = false;
    return JSON.stringify(out);
  };
  globalThis.skyboundSnapshot = () => JSON.stringify({ version: 1, pr: game.state.pr, maxHp: game.state.player.maxHp, focusMax: game.state.player.focusMax });
  globalThis.skyboundWorld = () => JSON.stringify({ tiles: Array.from(tiles), defs: defs.filter((d) => ["checkpoint", "nest", "gate"].includes(d.type)), areas: AREA_NAMES });
  globalThis.skyboundDebug = { get game() {
    return game;
  }, get input() {
    return b.input;
  } };
})();
