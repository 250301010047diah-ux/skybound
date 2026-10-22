// Loads image assets through the Playabl assets handle, plus the slicing
// sidecars (.frames.json) next to the generated sheets. Loading is lazy: the
// shared props, the active skin and the areas near the player load first, the
// rest streams in as Aera climbs. Drawing is anchored: each frame's anchor
// (feet / contact point) is pinned to the world position.
import assetsManifest from "../assets.json";
import { SKINS, SKIN_PARTS, AREA_COUNT } from "./constants.js";

export const CORE_KEYS = [
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
  ...SKIN_PARTS.map((p) => `AERA_${p}`),
];
const AREA_BOSS = { 0: ["BOSS_MOSS"], 1: ["BOSS_EAGLE"], 2: ["BOSS_CRAB"], 3: ["BOSS_MIRROR"], 6: ["BOSS_STAG"], 9: ["BOSS_GOLEM"], 10: ["BOSS_DRAGON"], 12: ["BOSS_CROWN"] };
export function areaKeys(a) {
  if (a < 0 || a >= AREA_COUNT) return [];
  const n = a + 1;
  const keys = [`BG_A${n}`, `TEX_A${n}`, `ENEMIES_A${n}`, ...(AREA_BOSS[a] || [])];
  // The shadow duel in Area 9 is Aera's dark mirror: it borrows the Bayangan skin.
  if (a === 8) keys.push(...SKIN_PARTS.map((p) => `SKIN_BAYANGAN_${p}`));
  return keys;
}
export const skinKeys = (id) => {
  const s = SKINS.find((k) => k.id === id) || SKINS[0];
  return SKIN_PARTS.map((p) => `${s.prefix}_${p}`);
};

// Creature sheets paint their art larger than the grid cell it sits in, so the
// bounds are measured here from the pixels: every frame is cropped and anchored
// to its own art rather than to the cell, which used to clip claws and wings.
const MEASURE = /^(ENEMIES_Ad+|BOSS_[A-Z]+|NPCS_[BC]|GATES_[BC]|FX_C)$/;

// Two arrow cells in PROPS_B were cut across their neighbours; these rects are
// measured on the sheet itself so the arrows draw whole.
const FRAME_FIX = {
  PROPS_B: {
    arrow_sprout: { x: 432, y: 1328, w: 342, h: 104 },
    arrow_thread: { x: 808, y: 1328, w: 356, h: 190 },
  },
};

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Gagal memuat ${url}`));
    img.src = url;
  });
}

// The quietest line between two neighbouring cells is the seam between their
// art: the middle of the widest transparent run, or the thinnest line of pixels
// when the two sprites touch.
function seam(profile, from, to) {
  let bestRun = -1;
  let bestMid = -1;
  let run = 0;
  for (let i = from; i <= to; i++) {
    if (profile[i] === 0) {
      run++;
      if (run > bestRun) {
        bestRun = run;
        bestMid = i - (run - 1) / 2;
      }
    } else run = 0;
  }
  if (bestRun > 0) return Math.round(bestMid);
  let min = Infinity;
  let at = Math.round((from + to) / 2);
  for (let i = from; i <= to; i++)
    if (profile[i] < min) {
      min = profile[i];
      at = i;
    }
  return at;
}

function cutLines(profile, starts, size, limit) {
  const out = [0];
  for (let i = 0; i < starts.length - 1; i++) {
    const a = starts[i] + size / 2;
    const b = starts[i + 1] + size / 2;
    const span = (b - a) / 2;
    out.push(seam(profile, Math.max(1, Math.round(a + span * 0.5)), Math.min(limit - 1, Math.round(b - span * 0.5))));
  }
  out.push(limit);
  return out;
}

// Cut the sheet along those seams, then bound each frame inside its own tile:
// the whole sprite, and never a neighbour's pixels.
function measure(img, frames) {
  const list = Object.values(frames).filter((f) => f.source);
  if (!list.length) return;
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const W = img.width;
  const H = img.height;
  const data = g.getImageData(0, 0, W, H).data;
  const solid = new Uint8Array(W * H);
  const colAlpha = new Int32Array(W);
  const rowAlpha = new Int32Array(H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] <= 60) continue;
      solid[y * W + x] = 1;
      colAlpha[x]++;
      rowAlpha[y]++;
    }
  const cols = [...new Set(list.map((f) => f.source.x))].sort((a, b) => a - b);
  const rows = [...new Set(list.map((f) => f.source.y))].sort((a, b) => a - b);
  const xCuts = cutLines(colAlpha, cols, list[0].source.w, W);
  const yCuts = cutLines(rowAlpha, rows, list[0].source.h, H);
  for (const f of list) {
    const ci = cols.indexOf(f.source.x);
    const ri = rows.indexOf(f.source.y);
    const x1 = xCuts[ci + 1];
    const y1 = yCuts[ri + 1];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -1;
    let maxY = -1;
    for (let y = yCuts[ri]; y < y1; y++) {
      const row = y * W;
      for (let x = xCuts[ci]; x < x1; x++) {
        if (!solid[row + x]) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) continue;
    f.content = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    f.anchor = { x: minX + (maxX - minX) / 2, y: maxY + 1 };
  }
}

export function createSpriteStore(assets) {
  const store = { img: {}, frames: {}, anims: {}, pending: {}, version: 0 };
  async function loadOne(key) {
    const entry = assetsManifest[key];
    if (!entry) return;
    const url = assets?.get(key) ?? entry.src;
    const img = await loadImage(url);
    if (!/^(BG|TEX)_/.test(key)) {
      // The sidecar belongs to the generated file (the manifest src), even when
      // a creator has swapped the picture itself.
      const src = entry.src.replace(/\.webp$/, ".frames.json");
      const json = await fetch(src).then((r) => r.json());
      const frames = {};
      for (const f of json.frames) frames[f.name] = { ...f };
      if (MEASURE.test(key)) measure(img, frames);
      const fix = FRAME_FIX[key];
      if (fix)
        for (const [name, r] of Object.entries(fix))
          if (frames[name]) frames[name] = { ...frames[name], content: r, anchor: { x: r.x + r.w / 2, y: r.y + r.h } };
      const anims = {};
      for (const a of json.animations ?? []) anims[a.name] = a.frames.map((f) => frames[f.name] ?? f);
      store.frames[key] = frames;
      store.anims[key] = anims;
    }
    store.img[key] = img;
    store.version++;
  }
  store.load = (keys, onProgress) => {
    let done = 0;
    return Promise.all(
      keys.map((k) => {
        if (!store.pending[k])
          store.pending[k] = loadOne(k).catch((e) => {
            delete store.pending[k];
            throw e;
          });
        return store.pending[k].then(() => onProgress?.(++done / keys.length));
      }),
    );
  };
  // Background prefetch: failures are retried on the next request.
  store.prefetch = (keys) => {
    store.load(keys).catch(() => {});
  };
  store.has = (k) => Boolean(store.img[k]);
  return store;
}

// Draw a frame anchored at (x, y) with uniform scale; flip mirrors around x.
export function drawFrame(ctx, img, frame, x, y, scale, flip = false) {
  if (!img || !frame) return;
  const c = frame.full || frame.content || frame.source;
  const sx = Math.max(0, c.x);
  const sy = Math.max(0, c.y);
  const sw = Math.min(img.width - sx, c.w - (sx - c.x));
  const sh = Math.min(img.height - sy, c.h - (sy - c.y));
  if (sw <= 0 || sh <= 0) return;
  const ax = (frame.anchor?.x ?? c.x + c.w / 2) - sx;
  const ay = (frame.anchor?.y ?? c.y + c.h) - sy;
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

// Draw a frame contained in a box (centre-bottom aligned), never stretched.
export function drawContained(ctx, img, frame, cx, bottom, boxW, boxH, flip = false) {
  if (!img || !frame) return;
  const c = frame.content || frame.source;
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

// Draw a frame centred at (cx, cy), scaled so its content height is h.
export function drawCentered(ctx, img, frame, cx, cy, h, rot = 0, flip = false) {
  if (!img || !frame) return;
  const c = frame.content || frame.source;
  const s = h / c.h;
  ctx.save();
  ctx.translate(cx, cy);
  if (rot) ctx.rotate(rot);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, c.x, c.y, c.w, c.h, (-c.w * s) / 2, (-c.h * s) / 2, c.w * s, c.h * s);
  ctx.restore();
}
