// The hand-built world: thirteen stacked areas on one tile grid, plus every
// static definition (checkpoints, puzzles, enemies, NPCs). Geometry is built
// with rect operations in each area's local tile coordinates, so a coordinate
// you read here is the coordinate you see in game. Nothing in this file
// changes at runtime; dynamic state lives in game state (progress flags).
import { T, COLS, ROWS, AREA_ROWS, AREA_COUNT, TILE } from "./constants.js";

const S = TILE.SOLID;
const F = TILE.FERTILE;
const O = TILE.ONEWAY;
const V = TILE.VINE;
const X = TILE.THORN;
const RL = TILE.REAL;
const MN = TILE.MOON;

export const tiles = new Uint8Array(COLS * ROWS);
export const defs = [];

let A = 0;
const top = (a) => (AREA_COUNT - 1 - a) * AREA_ROWS;
function fill(x0, y0, x1, y1, code) {
  const oy = top(A);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const gy = oy + y;
      if (x < 0 || x >= COLS || gy < 0 || gy >= ROWS) continue;
      tiles[gy * COLS + x] = code;
    }
}
const clear = (x0, y0, x1, y1) => fill(x0, y0, x1, y1, TILE.EMPTY);
// Foot point of an object standing in tile (tx, ty).
const foot = (tx, ty) => ({ x: (tx + 0.5) * T, y: (top(A) + ty + 1) * T });
// Centre of tile (tx, ty).
const cen = (tx, ty) => ({ x: (tx + 0.5) * T, y: (top(A) + ty + 0.5) * T });
// Rect covering tiles x0..x1, y0..y1.
const rect = (x0, y0, x1, y1) => ({ x: x0 * T, y: (top(A) + y0) * T, w: (x1 - x0 + 1) * T, h: (y1 - y0 + 1) * T });
// Raw grid point in float tile units (for channel polylines).
const pt = (tx, ty) => ({ x: tx * T, y: (top(A) + ty) * T });
const add = (d) => {
  d.area = A;
  defs.push(d);
  return d;
};
// Root steps up a shaft from the landing (local row) to the next area's floor.
// gate null = the passage is always open (bonus areas).
function shaft(gate, hx, landingRow) {
  let i = 0;
  for (let g = top(A) + landingRow - 3; g > top(A) - 4; g -= 3, i++)
    add({ id: `step_${A}_${i}`, type: "step", gate, x: (i % 2 ? hx + 2 : hx) * T, y: g * T, w: 2 * T });
}

// ---------------------------------------------------------------- AREA 1
A = 0;
fill(0, 0, 0, 35, S);
fill(47, 0, 47, 35, S);
fill(0, 0, 47, 3, S);
clear(22, 0, 25, 3);
fill(0, 34, 47, 35, S);
fill(16, 33, 18, 33, X);
fill(10, 32, 13, 33, S);
fill(20, 31, 23, 33, S);
fill(34, 24, 46, 25, S); // arena ceiling
fill(3, 20, 14, 21, S); // cave floor
fill(1, 12, 14, 13, S); // cave ceiling
fill(15, 9, 16, 21, F); // fertile column (sprout climb to the gate)
fill(2, 19, 2, 33, V);
fill(25, 28, 28, 28, O);
fill(29, 25, 32, 25, O);
fill(17, 22, 27, 23, S); // hub
fill(30, 10, 31, 20, S); // root column
fill(34, 22, 37, 22, O);
fill(39, 19, 42, 19, O);
fill(43, 16, 46, 16, O);
fill(33, 13, 41, 13, S); // canopy floor
fill(46, 8, 46, 12, F);
fill(41, 7, 43, 7, S); // feather ledge
fill(19, 8, 29, 9, S); // gate landing
fill(4, 9, 9, 9, S); // secret ledge

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
  after: [pt(11.5, 16.5), pt(6, 16.5), pt(6, 18)],
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
  wrong: [pt(35.5, 9.5), pt(35.5, 5.5), pt(39.5, 5.5)],
});
add({
  id: "chanU",
  type: "channel",
  garden: "gardenU",
  latch: "latchU",
  before: [pt(22.6, 21.5), pt(22.6, 18.5), pt(29.5, 18.5), pt(29.5, 13.5)],
  after: [pt(29.5, 13.5), pt(29.5, 10.5), pt(27, 10.5), pt(27, 8)],
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

// ---------------------------------------------------------------- AREA 2
A = 1;
fill(0, 0, 0, 35, S);
fill(47, 0, 47, 35, S);
fill(0, 0, 47, 3, S);
clear(34, 0, 37, 3);
fill(0, 32, 47, 35, S);
clear(22, 32, 25, 35);
fill(1, 5, 2, 20, F);
fill(5, 7, 9, 7, S); // feather ledge
fill(3, 22, 19, 23, S); // left deck
fill(20, 21, 20, 31, V);
fill(33, 12, 38, 13, S); // landing
fill(39, 12, 46, 12, S); // eagle arena ceiling
fill(39, 22, 46, 23, S); // right deck
fill(29, 31, 36, 31, X);
fill(38, 22, 38, 31, V);

add({ id: "cp4", type: "checkpoint", ...foot(19, 31) });
add({ id: "cp5", type: "checkpoint", ...foot(40, 31) });
add({ id: "cp6", type: "checkpoint", ...foot(35, 11) });
add({ id: "nest2", type: "nest", ...foot(27, 31) });
add({ id: "simpul", type: "npc", npc: "simpul", ...foot(5, 31) });
// Lifts: surface row = base - 2 * basket weight; target weights 1, 2, 3.
const liftRow = (w) => top(1) + 21 - 2 * w;
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

// ---------------------------------------------------------------- AREA 3
A = 2;
fill(0, 0, 0, 35, S);
fill(47, 0, 47, 35, S);
fill(0, 0, 47, 1, S);
clear(40, 0, 43, 1);
fill(0, 32, 47, 35, S);
clear(34, 32, 37, 35);
fill(1, 20, 6, 20, S); // valve ledge
fill(6, 21, 6, 31, S); // lower basin left wall
fill(17, 23, 17, 31, S); // lower basin right wall
fill(16, 24, 16, 31, V);
fill(19, 29, 21, 29, O);
fill(18, 26, 19, 26, O);
fill(9, 17, 11, 17, O);
fill(13, 14, 15, 14, O);
fill(19, 21, 32, 22, S); // middle basin floor
fill(19, 13, 19, 20, S);
fill(32, 13, 32, 20, S);
fill(20, 13, 20, 20, V);
fill(19, 10, 31, 10, S); // upper tank floor
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
  raft: { x: 7 * T, w: 3 * T },
});
add({
  id: "resM",
  type: "reservoir",
  key: "M",
  x: 20 * T,
  w: 12 * T,
  bottom: (top(2) + 21) * T,
  step: 2.5 * T,
  raft: { x: 28 * T, w: 3 * T },
});
add({ id: "resU", type: "reservoir", key: "U", x: 20 * T, w: 12 * T, bottom: (top(2) + 10) * T, step: 2 * T });
// The opened dome becomes an upward current that carries Aera into Area 4.
add({
  id: "dome",
  type: "gate",
  anim: "water_dome",
  ...rect(40, 0, 43, 3),
  opensWith: "water",
  current: { x: 40 * T, y: (top(3) + 26) * T, w: 4 * T, h: (top(2) + 13 - (top(3) + 26)) * T },
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

// ---------------------------------------------------------------- shared area frame
// Borders, a solid top band with the exit hole and a bottom band with the
// entry hole (lined up with the previous area's exit).
function frame(exitX, entryX, topRows = 3) {
  fill(0, 0, 0, 35, S);
  fill(47, 0, 47, 35, S);
  fill(0, 0, 47, topRows, S);
  if (exitX !== null) clear(exitX, 0, exitX + 3, topRows);
  fill(0, 32, 47, 35, S);
  clear(entryX, 32, entryX + 3, 35);
}

// ---------------------------------------------------------------- AREA 4 · Reruntuhan Matahari Pecah (light)
A = 3;
frame(6, 40);
fill(37, 28, 38, 28, O);
fill(45, 28, 46, 28, O);
fill(30, 29, 33, 29, O);
fill(25, 26, 28, 26, O);
fill(20, 23, 23, 23, O);
fill(16, 20, 19, 20, O);
fill(11, 17, 14, 17, O);
fill(15, 14, 23, 15, S); // west terrace
fill(16, 11, 18, 11, O);
fill(3, 8, 14, 9, S); // exit landing
fill(37, 13, 46, 13, S); // east ledge (behind the last mirror)
fill(35, 23, 37, 23, S); // eye pedestal
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

// ---------------------------------------------------------------- AREA 5 · Menara Lonceng Sunyi (bells)
A = 4;
frame(38, 6);
fill(14, 29, 18, 29, O);
fill(20, 26, 24, 26, O);
fill(26, 23, 31, 24, S);
fill(33, 20, 37, 20, O);
fill(40, 17, 45, 18, S);
fill(38, 15, 39, 15, O);
fill(8, 19, 14, 20, S); // west ledge (mural 3)
fill(10, 12, 37, 13, S); // bell hall
fill(38, 9, 44, 10, S); // exit landing
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
  [34, 4],
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

// ---------------------------------------------------------------- AREA 6 · Kepulauan Angin Pengembara (wind)
A = 5;
frame(6, 38);
fill(16, 31, 30, 31, X);
fill(15, 23, 15, 31, S); // wall: stops the seed inside the floor updraft
fill(4, 28, 11, 28, S); // W0 ledge
fill(2, 28, 3, 28, S);
fill(10, 22, 11, 22, S);
fill(16, 22, 23, 22, S); // W1 ledge
fill(12, 13, 17, 13, S); // seed-house ledge
fill(3, 8, 30, 9, S); // exit landing and bridge
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

// ---------------------------------------------------------------- AREA 7 · Kebun Bara Senja (heat)
A = 6;
frame(38, 6);
fill(14, 29, 17, 29, O);
fill(20, 27, 22, 27, O);
fill(2, 24, 19, 25, S); // greenhouse 1 floor + walkway
fill(19, 13, 19, 23, V);
fill(20, 14, 30, 15, S); // greenhouse 2 floor
fill(33, 22, 45, 23, S); // greenhouse 3 floor
fill(33, 16, 45, 16, S); // greenhouse 3 roof
fill(27, 29, 29, 29, O);
fill(29, 26, 31, 26, O);
fill(30, 23, 31, 23, O);
fill(29, 19, 31, 19, O);
fill(31, 13, 32, 13, O);
fill(33, 10, 34, 10, O);
fill(36, 8, 46, 9, S); // exit landing
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

// ---------------------------------------------------------------- AREA 8 · Gua Kristal Gemerlap (bonus)
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
fill(3, 8, 14, 9, S); // exit landing
fill(22, 8, 33, 9, S); // upper hall
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
  [41, 16],
].forEach(([x, y], i) => add({ id: `shard${i + 1}`, type: "shard", ...cen(x, y) }));
shaft(null, 6, 8);
add({ id: "e25", type: "enemy", kind: "crystalCrab", ...foot(20, 31) });
add({ id: "e26", type: "enemy", kind: "shardFloater", ...cen(10, 26) });
add({ id: "e27", type: "enemy", kind: "shardFloater", ...cen(38, 8) });
add({ id: "e28", type: "enemy", kind: "crystalCrab", ...foot(31, 7) });

// ---------------------------------------------------------------- AREA 9 · Danau Cermin Bulan (mirror world)
A = 8;
frame(38, 6);
fill(12, 29, 15, 29, MN);
fill(14, 26, 16, 26, MN);
fill(11, 23, 13, 23, MN);
fill(3, 20, 10, 20, S); // statue ledge
fill(2, 17, 4, 17, MN);
fill(12, 17, 14, 17, O);
fill(16, 14, 18, 14, O);
fill(21, 14, 23, 14, O);
fill(26, 14, 34, 15, S); // moon terrace
fill(35, 12, 36, 12, MN);
fill(37, 9, 46, 10, S); // exit landing
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

// ---------------------------------------------------------------- AREA 10 · Mesin Waktu Akar (gears)
A = 9;
frame(6, 38);
fill(30, 29, 33, 29, O);
fill(24, 26, 27, 26, O);
fill(18, 23, 21, 23, O);
fill(2, 16, 8, 17, S);
fill(16, 10, 40, 11, S); // control room floor
fill(3, 8, 12, 9, S); // exit landing
add({ id: "cp10a", type: "checkpoint", ...foot(34, 31) });
add({ id: "cp10b", type: "checkpoint", ...foot(4, 15) });
add({ id: "cp10c", type: "checkpoint", ...foot(18, 9) });
add({ id: "nest10", type: "nest", ...foot(2, 31) });
add({ id: "tiko", type: "npc", npc: "tiko", ...foot(44, 31) });
add({ id: "rot1", type: "rotplat", cx: 13 * T, cy: (top(A) + 21) * T, r: 3 * T, speed: 0.75, w: 2 * T });
add({ id: "rot2", type: "rotplat", cx: 14 * T, cy: (top(A) + 14) * T, r: 2.5 * T, speed: -0.7, w: 2 * T });
add({ id: "pend1", type: "pendulum", ax: 22 * T, ay: (top(A) + 16) * T, len: 5 * T, amp: 0.95, speed: 1.6 });
add({ id: "pend2", type: "pendulum", ax: 28 * T, ay: (top(A) + 21) * T, len: 3.5 * T, amp: 1.0, speed: 2.0 });
add({ id: "ring1", type: "ring", ...cen(22, 6), r: 1.7 * T, speed: 1.0, pin: cen(22, 9) });
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

// ---------------------------------------------------------------- AREA 11 · Sarang Awan Petir (combat)
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
fill(24, 15, 36, 16, S); // storm platform
fill(39, 14, 46, 15, S);
fill(29, 12, 31, 12, O);
fill(34, 9, 46, 10, S); // exit landing
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

// ---------------------------------------------------------------- AREA 12 · Taman Jamur Senja (bonus)
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
  [42, 26, 3],
].forEach(([x, y, order], i) => add({ id: `lamp${i + 1}`, type: "sporeLamp", seq: "spore", order, ...cen(x, y) }));
shaft(null, 6, 8);
add({ id: "e38", type: "enemy", kind: "sporePuff", ...foot(12, 31) });
add({ id: "e39", type: "enemy", kind: "mushroomKnight", ...foot(20, 31) });
add({ id: "e40", type: "enemy", kind: "mushroomKnight", ...foot(20, 7) });

// ---------------------------------------------------------------- AREA 13 · Mahkota Bintang (final)
A = 12;
frame(null, 6, 1);
fill(12, 29, 15, 29, O);
fill(16, 26, 19, 26, O);
fill(22, 23, 25, 23, O);
fill(26, 20, 29, 20, O);
fill(20, 17, 23, 17, O);
fill(22, 14, 25, 14, O);
fill(15, 2, 15, 10, S); // heart chamber walls
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
  ["star6", 11, 14, 2],
].forEach(([id, x, y, need]) => add({ id, type: "starNode", need, ...cen(x, y) }));
add({ id: "gate13", type: "gate", anim: "heart_shell", ...rect(22, 9, 25, 12), opensWith: "stars" });
add({ id: "boss13", type: "boss", boss: "crown", ...cen(24, 5), arena: rect(16, 2, 31, 10), final: true });
add({ id: "seedA13", type: "seed", ...cen(44, 14) });
add({ id: "featherA13", type: "feather", ...cen(24, 21) });
add({ id: "e41", type: "enemy", kind: "starKnight", ...foot(30, 31) });
add({ id: "e42", type: "enemy", kind: "starWisp", ...cen(36, 22) });
add({ id: "e43", type: "enemy", kind: "starKnight", ...foot(20, 31) });

// Constellation: links the player may thread, and black roots that block.
export const STAR_EDGES = [
  ["star1", "star2"],
  ["star2", "star3"],
  ["star3", "star4"],
  ["star4", "star5"],
  ["star5", "star6"],
  ["star6", "star1"],
  ["star2", "star5"],
  ["star1", "star5"],
  ["star3", "star5"],
  ["star2", "star6"],
];
export const STAR_BLOCKED = [
  ["star1", "star3"],
  ["star4", "star6"],
];

export const WATER_TARGET = { L: 1, M: 2, U: 1 };

// ---------------------------------------------------------------- queries
export const byId = Object.fromEntries(defs.map((d) => [d.id, d]));
export const ofType = (type) => defs.filter((d) => d.type === type);

// Closed gates and unburnt brambles block their tiles; the overlay is rebuilt
// from progress whenever one of them changes.
const block = new Uint8Array(COLS * ROWS);
function markRect(r) {
  const x0 = Math.round(r.x / T);
  const y0 = Math.round(r.y / T);
  for (let y = y0; y < y0 + Math.round(r.h / T); y++) for (let x = x0; x < x0 + Math.round(r.w / T); x++) block[y * COLS + x] = 1;
}
export function setBlocks(pr) {
  block.fill(0);
  for (const g of ofType("gate")) if (!pr.gates[g.id]) markRect(g);
  for (const b of ofType("bramble")) if (!pr.burned?.[b.id]) markRect(b);
}
export const setGateBlocks = (gates) => setBlocks({ gates, burned: {} });

// Mirror world side (Area 9): REAL tiles are platforms on side 0, MOON tiles on side 1.
let side = 0;
export const setSide = (v) => {
  side = v ? 1 : 0;
};
export const getSide = () => side;

export function tileAt(tx, ty) {
  if (tx < 0 || tx >= COLS || ty >= ROWS) return TILE.SOLID;
  if (ty < 0) return TILE.EMPTY;
  return tiles[ty * COLS + tx];
}
// One-way surfaces: plain one-way tiles plus the active mirror-world side.
export function isOneWayTile(t) {
  return t === TILE.ONEWAY || (t === TILE.REAL && side === 0) || (t === TILE.MOON && side === 1);
}
export function isSolid(tx, ty) {
  if (tx < 0 || tx >= COLS || ty >= ROWS) return true;
  if (ty < 0) return false;
  const t = tiles[ty * COLS + tx];
  return t === TILE.SOLID || t === TILE.FERTILE || block[ty * COLS + tx] === 1;
}
export const isSolidAt = (x, y) => isSolid(Math.floor(x / T), Math.floor(y / T));
