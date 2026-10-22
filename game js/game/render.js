// Canvas renderer. Reads state, never changes it. One transform (the camera)
// owns where everything draws; hitboxes and aim lines derive from the same
// world coordinates the simulation uses.
import { T, COLS, ROWS, TILE, AREA_ROWS, AREA_COUNT, WORLD_W, PLAYER_VIS_H, ARROW_SPRITE, FXC, areaTopRow, areaOfRow } from "./constants.js";
import { tiles, ofType, byId, isSolidAt, WATER_TARGET, getSide } from "./world.js";
import { drawFrame, drawContained, drawCentered } from "./sprites.js";
import { ENEMY, BOSS, ARROW_G, bossAi, bowOrigin } from "./combat.js";
import { drawWorld2, drawLight } from "./render2.js";
import { gardenWet, pegPos, liftTargetTop, reservoirSurface, basketWeight, pickupList } from "./puzzles.js";

const look = (moss, mossDark, base) => ({ moss, mossDark, line: "#2a170b", base });
const AREA_LOOK = [
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
  look("#fff6c8", "#d9b45a", "#e8dcc0"),
];
// Gate animations live on three sheets; repainted sheets keep their source row names.
const GATE_ANIM = {
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
  heart_shell: ["GATES_C", "water_dome"],
};
export const NPC_SHEET = {
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
  spirit: ["NPCS_C", "nira"],
};

export function createRenderer(canvas, sprites) {
  const ctx = canvas.getContext("2d");
  const view = { w: 1, h: 1, dpr: 1, zoom: 1 };
  const patterns = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    view.w = rect.width;
    view.h = rect.height;
    view.dpr = dpr;
  }

  // Terrain fill per area: the area texture once it has streamed in, a flat colour until then.
  function fillFor(area) {
    if (patterns[area]) return patterns[area];
    const im = sprites.img[`TEX_A${area + 1}`];
    if (!im) return AREA_LOOK[area].base;
    const pat = ctx.createPattern(im, "repeat");
    const sc = (T * 5) / im.width;
    pat.setTransform?.(new DOMMatrix([sc, 0, 0, sc, 0, 0]));
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

  // ---------------------------------------------------------------- main
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

  // ---------------------------------------------------------------- backdrop
  function drawBackdrop(s, cx, cy, w, h) {
    const row = cy / T;
    const areaF = AREA_COUNT - row / AREA_ROWS; // continuous: 0 bottom .. AREA_COUNT top
    const base = Math.max(0, Math.min(AREA_COUNT - 1, Math.floor(areaF)));
    const frac = areaF - base;
    const layers = [{ a: base, alpha: 1 }];
    // Crossfade near the boundary with the area above.
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
      const top = areaTopRow(L.a) * T;
      const prog = Math.max(0, Math.min(1, (cy - top) / (AREA_ROWS * T)));
      const py = (prog - 0.5) * (dh - h);
      ctx.globalAlpha = L.alpha;
      ctx.drawImage(im, (w - dw) / 2 - px, (h - dh) / 2 - py, dw, dh);
    }
    ctx.globalAlpha = 1;
    // Soft wash so foreground ledges read over the painted backdrop.
    ctx.fillStyle = "rgba(255, 248, 225, 0.12)";
    ctx.fillRect(0, 0, w, h);
  }

  // ---------------------------------------------------------------- terrain
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
    // Fills.
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
    // Fertile roots: green tint, veins and buds on exposed faces.
    for (let ty = ty0; ty <= ty1; ty++)
      for (let tx = tx0; tx <= tx1; tx++) {
        if (tiles[ty * COLS + tx] !== TILE.FERTILE) continue;
        ctx.fillStyle = "rgba(118, 205, 70, 0.38)";
        ctx.fillRect(tx * T, ty * T - 0.5, T, T + 1);
        ctx.strokeStyle = "rgba(196, 255, 120, 0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx * T + 8 + ((ty * 7) % 12), ty * T);
        ctx.quadraticCurveTo(tx * T + 20, ty * T + 16, tx * T + 10 + ((ty * 5) % 14), ty * T + T);
        ctx.stroke();
        if (ty % 2 === 0) {
          const b = fr("PROPS_A", "bud");
          if (!solid(tx + 1, ty)) drawCentered(ctx, img("PROPS_A"), b, tx * T + T - 2, ty * T + T / 2, 18, Math.PI / 2);
          if (!solid(tx - 1, ty)) drawCentered(ctx, img("PROPS_A"), b, tx * T + 2, ty * T + T / 2, 18, -Math.PI / 2);
        }
      }
    // Moss caps on exposed tops.
    for (let ty = ty0; ty <= ty1; ty++) {
      const look = AREA_LOOK[areaOfRow(ty)];
      for (let tx = tx0; tx <= tx1; tx++) {
        if (!solid(tx, ty) || solid(tx, ty - 1)) continue;
        const x = tx * T;
        const y = ty * T;
        ctx.fillStyle = look.mossDark;
        ctx.beginPath();
        ctx.rect(x, y - 1, T, 8);
        ctx.arc(x + 7, y + 7, 4.5, 0, Math.PI);
        ctx.arc(x + 21, y + 8, 5.5, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = look.moss;
        ctx.fillRect(x, y - 1, T, 5);
      }
    }
    // Dark outline along every solid/empty boundary.
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
    // One-way planks, vines, thorns.
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
    const look = AREA_LOOK[area];
    ctx.fillStyle = fillFor(area);
    roundRect(x + 1, y, w - 2, 13, 5);
    ctx.fill();
    ctx.fillStyle = look.moss;
    ctx.fillRect(x + 3, y - 1, w - 6, 4);
    ctx.strokeStyle = look.line;
    ctx.lineWidth = 2.5;
    roundRect(x + 1, y, w - 2, 13, 5);
    ctx.stroke();
  }

  // Mirror-world ledges: solid-looking on their own side, a dashed ghost on the other.
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

  function drawVine(cx, y0, y1, frame) {
    const im = img("PROPS_A");
    if (!frame) return;
    const c = frame.content;
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

  // ---------------------------------------------------------------- channels and beams
  function poly(pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  }
  function rootLine(pts, wet, t) {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    poly(pts);
    // A pale rim keeps the root readable on dark themes (caves, night lakes).
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
    // Dead-end stump.
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

  // ---------------------------------------------------------------- gates, props
  function drawGates(s, inView) {
    for (const g of ofType("gate")) {
      if (!inView(g.x + g.w / 2, g.y + g.h / 2, 200)) continue;
      const a = s.gateAnim[g.id];
      const [sheet, row] = GATE_ANIM[g.anim];
      const frame = onceFrame(sheet, row, s.pr.gates[g.id] ? Math.max(a, 0.21) : 0);
      const size = Math.max(g.w, g.h);
      drawContained(ctx, img(sheet), frame, g.x + g.w / 2, g.y + g.h + 4, size + 8, size + 8);
    }
    for (const d of ofType("step")) {
      const a = d.gate ? (s.gateAnim[d.gate] ?? 0) : 1;
      if (a < 0.7) continue;
      const k = Math.min(1, (a - 0.7) / 0.3);
      ctx.globalAlpha = k;
      drawContained(ctx, img("PROPS_A"), fr("PROPS_A", "root_step"), d.x + d.w / 2, d.y + 18, d.w + 10, 30 * k + 1);
      ctx.globalAlpha = 1;
    }
  }

  function drawProps(s, t, inView) {
    const pr = s.pr;
    const A = img("PROPS_A");
    const B = img("PROPS_B");
    for (const d of ofType("spring")) if (inView(d.x, d.y)) drawContained(ctx, A, fr("PROPS_A", "dew_spring"), d.x + 16, d.y + 2, 70, 56);
    for (const d of ofType("latch")) {
      if (!inView(d.x, d.y)) continue;
      drawContained(ctx, A, fr("PROPS_A", pr.latches[d.id] ? "latch_open" : "latch_closed"), d.x, d.y + 20, 40, 40);
    }
    for (const d of ofType("switch")) {
      if (!inView(d.x, d.y)) continue;
      drawCentered(ctx, A, fr("PROPS_A", "root_switch"), d.x, d.y, 40, pr.switches[d.id] === 1 ? Math.PI / 2 : 0);
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
      drawContained(ctx, A, fr("PROPS_A", on ? "altar_on" : "altar_off"), d.x, d.y + 2, 40, 40);
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
      drawContained(ctx, A, fr("PROPS_A", "nest"), d.x, d.y + 4, 46, 40);
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
      drawContained(ctx, A, fr("PROPS_A", "mushroom"), d.x, d.y + 2, 54, 48 * Math.max(0.7, squash));
      if (d.seq && pr.bosses.boss1 && !pr.seqs.mush) pips(d.x, d.y - 52, d.order, s.seq.mush.popped[d.id]);
    }
    for (const d of ofType("bubbleT")) {
      if (pr.seqs.bub || s.seq.bub.popped[d.id] || !inView(d.x, d.y)) continue;
      drawCentered(ctx, B, fr("PROPS_B", "bubble"), d.x, d.y + Math.sin(t * 2 + d.x) * 4, 34);
      pips(d.x, d.y + Math.sin(t * 2 + d.x) * 4, d.order, false);
    }
    for (const d of ofType("lever")) {
      if (!inView(d.x, d.y)) continue;
      drawContained(ctx, A, fr("PROPS_A", "lever"), d.x, d.y + 2, 34, 36);
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
      drawCentered(ctx, A, fr("PROPS_A", "anchor"), d.x, d.y, 30);
      if (s.player.arrowType === "thread") {
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + 0.3 * Math.sin(t * 5)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 22, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // Hanging nest (secret).
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
        drawCentered(ctx, A, fr("PROPS_A", "nest"), 0, 0, 34);
        ctx.restore();
      } else drawCentered(ctx, A, fr("PROPS_A", "nest"), hd.x, hn.y, 30);
    }
    // Lifts: rope to a pulley, the platform, its post with target mark and peg.
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
      // Post with target band.
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
    // Sprout platforms (the oldest blinks when a fourth would replace it).
    s.sprouts.forEach((sp, i) => {
      const grow = Math.min(1, sp.t / 0.2);
      let alpha = 1;
      if (s.sprouts.length >= 3 && i === 0) alpha = 0.55 + 0.45 * Math.sin(t * 12);
      ctx.globalAlpha = alpha;
      drawContained(ctx, A, fr("PROPS_A", "sprout_platform"), sp.x + sp.w / 2, sp.top + 22, (sp.w + 12) * grow, 34 * grow, sp.side < 0);
      ctx.globalAlpha = 1;
    });
    // Rafts.
    for (const d of ofType("reservoir")) {
      if (!d.raft) continue;
      const surf = Math.min(reservoirSurface(s, d), d.bottom - 2) - 6;
      if (!inView(d.raft.x, surf)) continue;
      drawContained(ctx, B, fr("PROPS_B", "raft"), d.raft.x + d.raft.w / 2, surf + 22, d.raft.w + 8, 30);
    }
  }

  // Small row of dots (order / weight markers) on a dark capsule.
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

  // Mural gauge: three columns, current level vs. target mark.
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

  // ---------------------------------------------------------------- characters
  function drawNPCs(s, t, inView) {
    for (const d of ofType("npc")) {
      if (!inView(d.x, d.y)) continue;
      const [sheet, k] = NPC_SHEET[d.npc];
      const N = img(sheet);
      const frame = loopFrame(sheet, k, t + d.x * 0.01, d.npc === "bird" ? 8 : 5);
      const vis = d.npc === "bird" ? 26 : 56;
      const c = frame?.content;
      const sc = c ? vis / sprites.anims[sheet][k][0].content.h : 0.2;
      drawFrame(ctx, N, frame, d.x, d.y + 1, sc, s.player.x > d.x);
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

  function flashDraw(im, frame, x, y, sc, flip, flash) {
    drawFrame(ctx, im, frame, x, y, sc, flip);
    if (flash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.55;
      drawFrame(ctx, im, frame, x, y, sc, flip);
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
      let frame;
      if ((k.ai === "slime" || e.kind.startsWith("slime")) && e.state === "air") frame = anim(k.sheet, k.move)?.[e.vy < 0 ? 2 : 3];
      else if (attacking && e.state !== "dive" && e.state !== "charge") frame = onceFrame(k.sheet, name, e.animT / 0.55);
      else frame = loopFrame(k.sheet, name, e.animT, (k.ai || e.kind) === "swooper" ? 12 : 8);
      const sc = enemyScale(k.sheet, k.move, k.vis);
      const warnShake = e.state === "warn" ? Math.sin(s.time * 60) * 2 : 0;
      flashDraw(img(k.sheet), frame, e.x + warnShake, e.y + 1, sc, e.face > 0, e.flash);
      if (e.state === "warn") {
        ctx.fillStyle = "#ff5a3c";
        ctx.font = "bold 18px 'Baloo 2', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("!", e.x, e.y - e.h - 16);
      }
    }
  }

  function drawBosses(s, inView) {
    for (const b of Object.values(s.bosses)) {
      if (!inView(b.x, b.y, 200)) continue;
      const k = BOSS[b.kind];
      const ai = bossAi(b.kind);
      if (ai === "shadow") {
        drawShadowBoss(s, b);
        continue;
      }
      let frame;
      if (b.state === "defeat") frame = onceFrame(k.sheet, "defeat", 1 - b.t / 1.4);
      else if (ai === "moss" || ai === "stag") {
        if (b.state === "windup") frame = anim(k.sheet, "attack")[Math.min(1, Math.floor(b.animT * 5))];
        else if (b.state === "leap") frame = anim(k.sheet, "attack")[b.vy < 0 ? 2 : b.vy < 300 ? 3 : 4];
        else if (b.state === "aim" || b.state === "charge") frame = anim(k.sheet, "attack")[b.state === "aim" ? 1 : 3];
        else if (b.state === "stuck") frame = loopFrame(k.sheet, "hurt", b.animT, 5);
        else frame = loopFrame(k.sheet, b.flash > 0 ? "hurt" : "idle", b.animT, 6);
      } else if (ai === "eagle" || ai === "final") {
        if (b.state === "warn" || b.state === "dive") frame = onceFrame(k.sheet, "attack", b.state === "warn" ? b.animT / 1.1 : 0.6 + b.animT);
        else frame = loopFrame(k.sheet, b.flash > 0 ? "hurt" : "idle", b.animT, 9);
      } else {
        if (b.state === "raise") frame = onceFrame(k.sheet, "attack", (b.animT / 0.7) * 0.6);
        else if (b.state === "slam") frame = anim(k.sheet, "attack")[4];
        else if (b.state === "stuck") frame = loopFrame(k.sheet, "hurt", b.animT, 4);
        else frame = loopFrame(k.sheet, "idle", b.animT, 7);
      }
      const sc = enemyScale(k.sheet, "idle", k.vis);
      flashDraw(img(k.sheet), frame, b.x, b.y + 2, sc, b.face > 0, b.flash);
      if (ai === "crab" && b.state === "stuck") {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(120, 255, 240, ${0.35 + 0.25 * Math.sin(s.time * 10)})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y - b.h * 0.75, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // Bayangan Aera fights with the Bayangan skin's own sheets and a violet aura.
  function drawShadowBoss(s, b) {
    const P = "SKIN_BAYANGAN";
    if (b.state === "vanish") return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(b.x, b.y - 30, 4, b.x, b.y - 30, 48);
    g.addColorStop(0, `rgba(150, 90, 255, ${0.35 + 0.15 * Math.sin(s.time * 6)})`);
    g.addColorStop(1, "rgba(150, 90, 255, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(b.x - 50, b.y - 80, 100, 90);
    ctx.restore();
    let sheet = `${P}_BASIC`;
    let frame;
    if (b.state === "defeat") {
      sheet = `${P}_ACTION`;
      frame = onceFrame(sheet, "defeat", 1 - b.t / 1.4);
    } else if (b.state === "aim") {
      sheet = `${P}_BOW`;
      frame = onceFrame(sheet, "draw_ground", 1 - b.t / 0.7);
    } else if (b.state === "rest") {
      sheet = `${P}_BOW`;
      frame = onceFrame(sheet, "release_ground", 1 - b.t / 0.9);
    } else if (b.flash > 0) {
      sheet = `${P}_ACTION`;
      frame = onceFrame(sheet, "hurt", 1 - b.flash / 0.2);
    } else frame = loopFrame(sheet, "idle", b.animT, 6);
    flashDraw(img(sheet), frame, b.x, b.y + 1, PLAYER_VIS_H / 330, b.face < 0, b.flash);
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
    const [sheet, frame] = playerPose(p);
    const sc = PLAYER_VIS_H / 330;
    let y = p.y + 1;
    if (p.mode === "ledge") y += 10;
    if (p.mode === "rope") y += 14;
    if (p.mode === "swim") y -= 8;
    drawFrame(ctx, img(sheet), frame, p.x, y, sc, p.face < 0);
    if (p.carry) {
      const f = s.fruits.find((q) => q.id === p.carry);
      if (f) drawCentered(ctx, img("PROPS_B"), fr("PROPS_B", `fruit_${f.w}`), p.x, p.y - p.h - 14, 16 + f.w * 4);
    }
    if (p.mode === "trapped") drawCentered(ctx, img("PROPS_B"), fr("PROPS_B", "bubble"), p.x, p.y - p.h / 2, 64);
  }

  // Panah Benang in use: silk under load. The line bows away from the swing
  // while it is slow and pulls straight as speed builds, two strands braid
  // around the core, and a bead of light runs down it.
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
      y: (1 - u) * (1 - u) * R.ay + 2 * (1 - u) * u * my + u * u * hy,
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
        const b = at(u);
        const w = Math.sin(u * 9 + t * 6) * 2.2 * dir * Math.sin(u * Math.PI);
        if (i) ctx.lineTo(b.x + nx * w, b.y + ny * w);
        else ctx.moveTo(b.x + nx * w, b.y + ny * w);
      }
      ctx.stroke();
    }
    const bead = at((t * 0.85) % 1);
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

  // Each arrow reads at a glance in flight: Tunas trails leaves, Benang spins
  // out silk, Gema leaves after-images, Angin curls, Bara burns.
  const ARROW_LOOK = {
    normal: { core: "#fff7dc", glow: "#e8c877", w: 3.2, halo: 12 },
    sprout: { core: "#e2ffbe", glow: "#5cc23a", w: 4.2, halo: 17 },
    thread: { core: "#ffffff", glow: "#9fc6ff", w: 3.6, halo: 15 },
    echo: { core: "#f2e0ff", glow: "#a65cff", w: 4.0, halo: 18 },
    wind: { core: "#eafcff", glow: "#5fcdf5", w: 4.2, halo: 17 },
    ember: { core: "#ffe59a", glow: "#ff6a1c", w: 4.6, halo: 20 },
  };
  const ARROW_SIZE = { thread: 14, normal: 9, sprout: 9 };

  // The sheet colours are hex; glows need an alpha, so widen them here.
  const tint = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  };

  function halo(x, y, r, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, tint(color, alpha));
    g.addColorStop(1, tint(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // A tapered streak through the arrow's own past positions, so the trail bends
  // with the arc instead of pointing wherever the arrow faces. Laid down twice:
  // a solid colour pass that survives a sunlit canopy, then an additive core
  // that glows in the caves.
  function streak(tr, look, strength) {
    // The colour pass steps two points at a time: it only has to carry the hue
    // over a bright background, and every stroke here crosses the bridge to
    // Flutter as its own command.
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = look.glow;
    for (let i = 2; i < tr.length; i += 2) {
      const u = i / (tr.length - 1);
      ctx.globalAlpha = (0.1 + 0.5 * u * u) * strength;
      ctx.lineWidth = look.w * (0.45 + 1.25 * u) * strength;
      ctx.beginPath();
      ctx.moveTo(tr[i - 2].x, tr[i - 2].y);
      ctx.lineTo(tr[i].x, tr[i].y);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = look.core;
    for (let i = 1; i < tr.length; i++) {
      const u = i / (tr.length - 1);
      ctx.globalAlpha = (0.07 + 0.42 * u) * strength;
      ctx.lineWidth = look.w * (0.2 + 0.7 * u) * strength;
      ctx.beginPath();
      ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
      ctx.lineTo(tr[i].x, tr[i].y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Unit vector across the flight path at trail point i: the axis the strands,
  // leaves and curls swing on.
  function sideways(tr, i) {
    const a = tr[Math.max(0, i - 1)];
    const b = tr[Math.min(tr.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: -dy / len, y: dx / len };
  }

  // Runs a wavy strand along the trail; amp(u) sets how far it swings.
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

  function drawTrail(a, look, t, sheet, name, size, ang) {
    const tr = a.trail;
    if (!tr || tr.length < 2) return;
    if (a.type === "sprout") {
      streak(tr, look, 1);
      ctx.globalCompositeOperation = "source-over";
      for (let i = 1; i < tr.length; i += 2) {
        const u = i / (tr.length - 1);
        const n = sideways(tr, i);
        const swing = Math.sin(a.seed + i * 1.1 + t * 14) * (4 + 3 * u);
        ctx.globalAlpha = 0.3 + 0.55 * u;
        ctx.fillStyle = i % 4 ? look.glow : look.core;
        ctx.beginPath();
        ctx.ellipse(tr[i].x + n.x * swing, tr[i].y + n.y * swing, 3.4 * u + 1, 1.7 * u + 0.8, Math.atan2(n.y, n.x), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 1;
      return;
    }
    if (a.type === "thread") {
      streak(tr, look, 0.8);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = look.glow;
      weave(tr, a.seed - t * 18, (u) => 1.5 + 5 * (1 - u));
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = look.core;
      weave(tr, a.seed - t * 18, (u) => 1.5 + 5 * (1 - u));
      for (let i = 2; i < tr.length; i += 3) {
        ctx.globalAlpha = 0.5 * (i / tr.length);
        ctx.fillStyle = look.core;
        ctx.beginPath();
        ctx.arc(tr[i].x, tr[i].y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return;
    }
    if (a.type === "echo") {
      streak(tr, look, 0.7);
      ctx.globalCompositeOperation = "source-over";
      for (let i = tr.length - 3; i > 0; i -= 3) {
        ctx.globalAlpha = 0.1 + 0.34 * (i / tr.length);
        drawCentered(ctx, img(sheet), fr(sheet, name), tr[i].x, tr[i].y, size, ang);
      }
      ctx.globalCompositeOperation = "lighter";
      const pulse = (a.t * 3) % 1;
      ctx.globalAlpha = (1 - pulse) * 0.5;
      ctx.strokeStyle = look.glow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 6 + pulse * 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }
    if (a.type === "wind") {
      streak(tr, look, 0.75);
      for (const lit of [false, true]) {
        ctx.globalCompositeOperation = lit ? "lighter" : "source-over";
        ctx.globalAlpha = lit ? 0.5 : 0.45;
        ctx.lineWidth = lit ? 1.6 : 2.4;
        ctx.strokeStyle = lit ? look.core : look.glow;
        for (const dir of [1, -1]) weave(tr, a.seed - t * 26 + (dir > 0 ? 0 : Math.PI), (u) => dir * (2 + 7 * u));
      }
      ctx.globalAlpha = 1;
      return;
    }
    if (a.type === "ember") {
      // Each halo is a gradient the bridge has to serialise, so the fire is
      // built from a few wide ones rather than one per trail point.
      for (let i = 2; i < tr.length; i += 3) {
        const u = i / (tr.length - 1);
        halo(tr[i].x, tr[i].y, 6 + 11 * u, i % 2 ? look.glow : "#ff5a2a", 0.16 + 0.32 * u);
      }
      streak(tr, look, 0.6);
      for (let i = 0; i < 3; i++) {
        const f = (t * 9 + a.seed + i * 2.1) % 1;
        const j = Math.max(0, tr.length - 1 - Math.floor(f * (tr.length - 1)));
        const n = sideways(tr, j);
        ctx.globalAlpha = 1 - f;
        ctx.fillStyle = i % 2 ? "#ffd27a" : look.glow;
        ctx.beginPath();
        ctx.arc(tr[j].x + n.x * (f * 14 - 7), tr[j].y + n.y * (f * 14 - 7) - f * 10, 2.2 * (1 - f) + 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return;
    }
    streak(tr, look, 0.65);
    for (let i = 0; i < 2; i++) {
      const f = (t * 7 + a.seed + i * 0.5) % 1;
      const j = Math.max(1, Math.round((1 - f) * (tr.length - 1)));
      ctx.globalAlpha = (1 - f) * 0.8;
      ctx.fillStyle = look.core;
      ctx.beginPath();
      ctx.arc(tr[j].x, tr[j].y, 1.5 * (1 - f) + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawArrows(s, inView, t) {
    for (const a of s.arrows) {
      if (!inView(a.x, a.y, 160)) continue;
      const look = ARROW_LOOK[a.type] || ARROW_LOOK.normal;
      const ang = Math.atan2(a.vy, a.vx);
      const [sheet, name] = ARROW_SPRITE[a.type] || ARROW_SPRITE.normal;
      const size = ARROW_SIZE[a.type] || 11;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (a.stuck) halo(a.x, a.y, look.halo * 0.8, look.glow, 0.3 * Math.min(1, a.life * 1.6));
      else {
        drawTrail(a, look, t, sheet, name, size, ang);
        halo(a.x, a.y, look.halo, look.glow, 0.5);
      }
      ctx.restore();
      if (a.stuck) ctx.globalAlpha = Math.min(1, a.life * 2);
      drawCentered(ctx, img(sheet), fr(sheet, name), a.x, a.y, size, ang);
      ctx.globalAlpha = 1;
    }
  }

  // The loose: a star at the bow in the arrow's colour, fading in a fifth of a
  // second. Rays spread along the shot so the release reads directional.
  function drawRelease(s, inView) {
    const r = s.release;
    if (!r || !inView(r.x, r.y, 80)) return;
    const u = Math.min(1, r.t / r.dur);
    const look = ARROW_LOOK[r.type] || ARROW_LOOK.normal;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    halo(r.x, r.y, (11 + 26 * u) * r.pow, look.glow, 0.5 * (1 - u));
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
    ctx.strokeStyle = look.glow;
    ctx.lineWidth = 3.6 * (1 - u) + 1;
    rays();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = (1 - u) * 0.9;
    ctx.strokeStyle = look.core;
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
        const frame = a?.[2 + (Math.floor(t * 12) % 2)];
        drawFrame(ctx, img("FX_A"), frame, sh.x, sh.y + 2, 46 / 276, sh.vx < 0);
      } else if (sh.kind === "fire") {
        const a = anim("FX_C", FXC.fire);
        const frame = a?.[1 + (Math.floor(t * 10 + sh.x) % 3)];
        if (frame) drawFrame(ctx, img("FX_C"), frame, sh.x, sh.y + 2, 30 / frame.content.h, false);
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

  // ---------------------------------------------------------------- water
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
    // Dome current.
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
        const yy = c.y + c.h - (((t * 160 + i * 80) % c.h) + 0);
        ctx.beginPath();
        ctx.moveTo(c.x + 14 + i * 22, yy);
        ctx.lineTo(c.x + 14 + i * 22, yy - 30);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- fx
  function drawFx(s, inView) {
    for (const f of s.fx) {
      if (!inView(f.x, f.y)) continue;
      const a = anim(f.sheet, f.anim);
      if (!a) continue;
      const frame = a[Math.min(a.length - 1, Math.floor((f.t / f.dur) * a.length))];
      const sc = f.size / a[Math.floor(a.length / 2)].content.h;
      drawFrame(ctx, img(f.sheet), frame, f.x, f.y, sc, f.flip);
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

  // Aim preview: the arc the shot will actually take, stepped with the same
  // gravity and speed the simulation uses, a reticle where it lands, and the
  // draw ring (plus the Sky Focus ring while time is slowed).
  function drawAim(s, opts) {
    const p = s.player;
    const o = bowOrigin(p);
    const look = ARROW_LOOK[p.arrowType] || ARROW_LOOK.normal;
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
        ctx.fillStyle = lit ? look.core : look.glow;
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
      ctx.strokeStyle = look.core;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const ang = spin + (i * Math.PI) / 2;
        ctx.moveTo(end.x + Math.cos(ang) * 5, end.y + Math.sin(ang) * 5);
        ctx.lineTo(end.x + Math.cos(ang) * 10, end.y + Math.sin(ang) * 10);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    halo(o.x, o.y, 7 + 10 * charge, look.glow, 0.28 + 0.3 * charge);
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = look.core;
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

  // Desktop players have no on-screen hand button: show the key above Aera.
  function drawPrompt(s, label) {
    const p = s.player;
    const text = `E · ${label}`;
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
    for (const b of Object.values(s.bosses)) ctx.strokeRect(b.x - b.w / 2, b.y - b.h, b.w, b.h);
    ctx.strokeStyle = "#ffd84a";
    for (const pl of plats) ctx.strokeRect(pl.x, pl.top, pl.w, 4);
  }

  return { canvas, ctx, view, resize, draw };
}
