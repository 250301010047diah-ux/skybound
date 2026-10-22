// Drawing for the upper layers' puzzle objects (Areas 4–13). Reads state only.
import { T } from "./constants.js";
import { ofType, byId, getSide, STAR_EDGES, STAR_BLOCKED } from "./world.js";
import { fanDir, mirrorState, statuePhase, ventOpen, roomTemp, starDegree, rotPos, pendulumPos, windZones, ringAligned } from "./puzzles2.js";

const TEMP_COL = ["#6fc3ff", "#8fe36a", "#ff6a3c"];

// Sunbeams are drawn right after the terrain so props and characters sit on top.
export function drawLight(ctx, s, t) {
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

export function drawWorld2(ctx, s, R) {
  const { img, fr, inView, t, drawCentered, drawContained, roundRect, pips } = R;
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

  // ---- Area 4: sunlight.
  const lens = byId.lens4;
  if (inView(lens.x, lens.y, 900)) {
    drawCentered(ctx, C, fr("PROPS_C", "sun_lens"), lens.x, lens.y - 2, 40);
    if (!pr.latches.lens4) drawCentered(ctx, C, fr("PROPS_C", "shutter"), lens.x, lens.y + 6, 40);
    for (const d of ofType("mirror")) {
      const st = mirrorState(pr, d);
      drawCentered(ctx, C, fr("PROPS_C", "mirror"), d.x, d.y, 30, st === "/" ? -Math.PI / 4 : Math.PI / 4);
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
    if (!pr.unlocked.pin4) drawCentered(ctx, E, fr("PROPS_E", "lock_pin"), pin.x, pin.y, 28);
    const pz = byId.prism4;
    drawCentered(ctx, C, fr("PROPS_C", "prism"), pz.x, pz.y, 34);
    for (const d of ofType("eye")) drawCentered(ctx, C, fr("PROPS_C", s.light.eyes[d.id] ? "eye_on" : "eye_off"), d.x, d.y, 32);
    for (const b of ofType("lightbridge")) plankGlow(b.x, b.y, b.w, "255, 215, 110", s.light.bridges[b.id]);
  }

  // ---- Area 5: bells and echo bridges.
  for (const d of ofType("bell")) {
    if (!inView(d.x, d.y)) continue;
    const swing = Math.sin(t * 1.8 + d.x) * 0.08;
    ctx.strokeStyle = "#5a3b22";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y - 60);
    ctx.lineTo(d.x, d.y - 16);
    ctx.stroke();
    drawCentered(ctx, C, fr("PROPS_C", "bell"), d.x, d.y, 34, swing);
    const revealed = ofType("bellMural").some((m) => pr.murals[m.id] && m.reveals.includes(d.order));
    if (revealed && !pr.seqs.bell) pips(d.x, d.y + 28, d.order, s.seq.bell.popped[d.id]);
  }
  for (const d of ofType("bellMural")) if (inView(d.x, d.y)) drawContained(ctx, C, fr("PROPS_C", "music_mural"), d.x, d.y + 2, 46, 44);
  for (const d of ofType("echoCrystal")) if (inView(d.x, d.y)) drawContained(ctx, C, fr("PROPS_C", "echo_crystal"), d.x, d.y + 2, 34, 40);
  for (const b of ofType("echoBridge")) {
    if (!inView(b.x, b.y, 300)) continue;
    const left = s.echo[b.id] || 0;
    plankGlow(b.x, b.y, b.w, "190, 140, 255", left > 0 && (left > 1.2 || Math.floor(left * 8) % 2 === 0));
  }

  // ---- Area 6: wind.
  if (G6InView(inView)) {
    for (const z of windZones(pr)) {
      ctx.strokeStyle = "rgba(235, 250, 255, 0.5)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const k = ((t * 0.9 + i / 5) % 1);
        ctx.beginPath();
        if (z.dir === "up") {
          const x = z.x + 8 + ((i * 13) % (z.w - 12));
          const y = z.y + z.h - k * z.h;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y - 18);
        } else {
          const y = z.y + 8 + ((i * 11) % (z.h - 12));
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
      drawCentered(ctx, C, fr("PROPS_C", "fan"), cx, cy, 44, t * 6);
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
    for (const d of ofType("waystation")) drawContained(ctx, C, fr("PROPS_C", "waystation"), d.x, d.y + 2, 30, 34);
    const h = byId.house6;
    drawContained(ctx, C, fr("PROPS_C", "seed_house"), h.x, h.y + 2, 54, 52);
    const pod = s.pod;
    if (pod) drawCentered(ctx, C, fr("PROPS_C", "seed_pod"), pod.x, pod.y, 30, Math.sin(t * 3) * 0.15);
  }

  // ---- Area 7: heat.
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
    drawContained(ctx, D, fr("PROPS_D", pr.furnace ? "furnace_on" : "furnace_off"), fur.x, fur.y + 2, 60, 58);
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
      drawContained(ctx, D, fr("PROPS_D", "heat_flower"), f.x, f.y + 2, 26, 50);
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
    for (const v of ofType("vent")) drawContained(ctx, D, fr("PROPS_D", ventOpen(pr, v) ? "vent_open" : "vent_closed"), v.x, v.y + 2, 26, 32);
    for (const b of ofType("bramble")) if (!pr.burned[b.id]) drawContained(ctx, D, fr("PROPS_D", "bramble"), b.x + b.w / 2, b.y + b.h + 2, b.w + 10, b.h + 8);
  }

  // ---- Bonus treasure.
  for (const d of ofType("chest")) {
    if (!inView(d.x, d.y)) continue;
    const open = pr.chests[d.id];
    const locked = d.needs && !pr.seqs[d.needs];
    drawContained(ctx, D, fr("PROPS_D", open ? "chest_open" : "chest_closed"), d.x, d.y + 2, 40, 34);
    if (locked) {
      ctx.fillStyle = "#2a170b";
      ctx.fillRect(d.x - 4, d.y - 22, 8, 10);
    }
  }
  for (const d of ofType("shardStart")) if (inView(d.x, d.y)) drawContained(ctx, D, fr("PROPS_D", "crystal_cluster"), d.x, d.y + 2, 40, 46);
  if (s.shardRun?.active)
    for (const d of ofType("shard")) if (!s.shardRun.got[d.id]) drawCentered(ctx, D, fr("PROPS_D", "star_shard"), d.x, d.y + Math.sin(t * 4 + d.x) * 3, 24);

  // ---- Area 9: the mirror lake.
  const tint = getSide() === 1;
  for (const d of ofType("altar")) if (inView(d.x, d.y)) drawContained(ctx, D, fr("PROPS_D", "moon_altar"), d.x, d.y + 2, 54, 30);
  for (const d of ofType("statue")) {
    if (!inView(d.x, d.y)) continue;
    drawContained(ctx, D, fr("PROPS_D", "moon_statue"), d.x, d.y + 2, 40, 50);
    phaseDisc(ctx, d.x, d.y - 40, 10, statuePhase(pr, d));
  }
  const g9 = byId.gate9;
  if (tint && !pr.gates.gate9 && inView(g9.x, g9.y, 300)) {
    ofType("statue").forEach((d, i) => phaseDisc(ctx, g9.x + 20 + i * 44, g9.y + g9.h + 20, 12, d.target));
  }
  if (tint && inView(T * 24, byId.statue1.y - 300, 900)) {
    ctx.fillStyle = "rgba(80, 110, 230, 0.13)";
    const top = byId.statue1.y - 32 * T;
    ctx.fillRect(0, top, 48 * T, 33 * T);
  }

  // ---- Area 10: clockwork.
  for (const d of ofType("rotplat")) {
    const p = rotPos(d, s.mechT);
    if (!inView(p.x, p.y)) continue;
    ctx.strokeStyle = "rgba(90, 60, 30, 0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(d.cx, d.cy);
    ctx.lineTo(p.x, p.y + 8);
    ctx.stroke();
    drawContained(ctx, E, fr("PROPS_E", "gear_platform"), p.x, p.y + 20, d.w + 10, 26);
  }
  for (const d of ofType("pendulum")) {
    const b = pendulumPos(d, s.mechT);
    if (!inView(b.x, b.y)) continue;
    ctx.strokeStyle = "#7a5634";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(d.ax, d.ay);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    drawCentered(ctx, E, fr("PROPS_E", "pendulum"), b.x, b.y, 44, -b.a);
  }
  const allAligned = ofType("ring").every((d) => s.rings?.[d.id]?.held && ringAligned(s.rings[d.id].ang));
  for (const d of ofType("ring")) {
    if (!inView(d.x, d.y)) continue;
    const r = s.rings[d.id];
    drawCentered(ctx, E, fr("PROPS_E", "gear_ring"), d.x, d.y, d.r * 2, r.ang);
    ctx.fillStyle = ringAligned(r.ang) ? "#ffd84a" : "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.moveTo(d.x, d.y - d.r - 14);
    ctx.lineTo(d.x - 6, d.y - d.r - 24);
    ctx.lineTo(d.x + 6, d.y - d.r - 24);
    ctx.closePath();
    ctx.fill();
    drawCentered(ctx, E, fr("PROPS_E", "lock_pin"), d.pin.x, d.pin.y, 26, r.held ? Math.PI / 2 : 0);
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
    drawCentered(ctx, E, fr("PROPS_E", "gear_core"), core.x, core.y, 34);
  }

  // ---- Area 11: broken totems stay as rubble.
  for (const d of ofType("enemy")) if (d.kind === "totem" && pr.got[d.id] && inView(d.x, d.y)) drawContained(ctx, E, fr("PROPS_E", "totem_broken"), d.x, d.y + 2, 44, 70);

  // ---- Area 12: spore lamps.
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
    drawCentered(ctx, E, fr("PROPS_E", "spore_lamp"), d.x, d.y + Math.sin(t * 2 + d.x) * 3, 30);
    if (!pr.seqs.spore) pips(d.x, d.y - 26, d.order, lit);
  }

  // ---- Area 13: the constellation.
  const nodes = ofType("starNode");
  if (inView(nodes[0].x, nodes[0].y, 1200)) {
    const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));
    ctx.lineCap = "round";
    for (const [a, b] of STAR_BLOCKED) {
      ctx.strokeStyle = "#1a1220";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(pos[a].x, pos[a].y);
      ctx.quadraticCurveTo((pos[a].x + pos[b].x) / 2, (pos[a].y + pos[b].y) / 2 + 30, pos[b].x, pos[b].y);
      ctx.stroke();
    }
    for (const [a, b] of STAR_EDGES) {
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      const on = pr.links[key];
      ctx.strokeStyle = on ? "rgba(255, 225, 120, 0.95)" : "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = on ? 3.5 : 1.5;
      ctx.setLineDash(on ? [] : [4, 8]);
      ctx.beginPath();
      ctx.moveTo(pos[a].x, pos[a].y);
      ctx.lineTo(pos[b].x, pos[b].y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (const n of nodes) {
      const deg = starDegree(pr, n.id);
      drawCentered(ctx, E, fr("PROPS_E", deg === n.need ? "star_node_lit" : "star_node"), n.x, n.y, 34);
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
