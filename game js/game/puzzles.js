// Area puzzles and world objects: root channels and gardens (Area 1), the
// canopy scales (Area 2), the three reservoirs (Area 3), plus sprout
// platforms, checkpoints, nests, pickups, NPC talk and context interaction.
import { T, PLAYER_H } from "./constants.js";
import { ofType, byId, isSolid, WATER_TARGET } from "./world.js";
import { attachRope } from "./player.js";
import { moveBody } from "./physics.js";
import { npcLines, NPC_NAMES, MURAL_LINES } from "./story.js";
import { initPuzzles2, plats2, updatePuzzles2, aimTargets2, arrowHit2, findInteract2, doInteract2 } from "./puzzles2.js";

const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

// ---------------------------------------------------------------- derived helpers
export function gardenWet(pr, id) {
  const ch = ofType("channel").find((c) => c.garden === id);
  if (!ch || !pr.latches[ch.latch]) return false;
  if (ch.switchId && pr.switches[ch.switchId] !== 1) return false;
  return true;
}
export function basketWeight(s, key) {
  return (s.pr.baskets[key] || []).reduce((sum, id) => sum + (byId[id]?.weight ?? 0), 0);
}
export function liftTargetTop(d, w) {
  return (d.baseRow - 2 * w) * T;
}
export function reservoirSurface(s, d) {
  return d.bottom - (s.waterVis[d.key] ?? 0) * d.step;
}

// ---------------------------------------------------------------- init
export function initPuzzles(G) {
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
    const top = liftTargetTop(d, w);
    s.lifts[d.id] = { top, prevTop: top };
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

// ---------------------------------------------------------------- platforms
export function buildPlats(G) {
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
    const top = Math.min(surf, d.bottom - 2) - 6;
    const prev = s.raftPrev?.[d.id] ?? top;
    out.push({ id: `raft_${d.key}`, x: d.raft.x, w: d.raft.w, top, prevTop: prev });
  }
  for (const d of ofType("leaf")) if (s.leaves[d.id].fold < 0.5) out.push({ id: d.id, x: d.x, w: d.w, top: d.y, prevTop: d.y });
  for (const d of ofType("step")) if (!d.gate || (s.gateAnim[d.gate] ?? 0) >= 0.7) out.push({ id: d.id, x: d.x, w: d.w, top: d.y, prevTop: d.y });
  plats2(G, out);
  return out;
}

// ---------------------------------------------------------------- update
export function updatePuzzles(G, dt) {
  const { s } = G;
  const pr = s.pr;
  const p = s.player;
  for (const sp of s.sprouts) sp.t += dt;
  // Lifts follow their basket weight; locked lifts hold their mark.
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
  // Water levels ease toward their values; rafts ride the surface.
  s.raftPrev = {};
  for (const d of ofType("reservoir")) {
    if (d.raft) s.raftPrev[d.id] = Math.min(reservoirSurface(s, d), d.bottom - 2) - 6;
    const tgt = pr.water[d.key];
    const v = s.waterVis[d.key];
    const k = 0.9 * dt;
    s.waterVis[d.key] = Math.abs(tgt - v) <= k ? tgt : v + Math.sign(tgt - v) * k;
  }
  // Folding leaves.
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
  // Gate animations.
  for (const g of ofType("gate")) if (pr.gates[g.id] && s.gateAnim[g.id] < 1) s.gateAnim[g.id] = Math.min(1, s.gateAnim[g.id] + dt / 1.6);
  for (const g of ofType("garden")) if (pr.gardens[g.id] && s.gardenAnim[g.id] < 1) s.gardenAnim[g.id] = Math.min(1, s.gardenAnim[g.id] + dt / 1.2);
  // Fruits.
  for (const f of s.fruits) updateFruit(G, f, dt);
  // Hanging nest.
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
      G.toast("Sarang jatuh — ada sesuatu yang berkilau!");
    }
  }
  // Sequence timers (bubble bells reset if too slow).
  const bq = s.seq.bub;
  if (bq.next > 1 && !pr.seqs.bub) {
    bq.t -= dt;
    if (bq.t <= 0) resetSeq(G, "bub");
  }
  // Mushroom bounce (Area 1 ones wake up after Induk Lumut; Area 12 ones always bounce).
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
  // The open dome is an upward current to the top of the tree.
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
  // Checkpoints, nests, pickups.
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
    const b = ofType("basket").find((q) => q.basket === f.basket);
    const idx = s.pr.baskets[f.basket].indexOf(f.id);
    f.x = b.x - 8 + idx * 10;
    f.y = b.y - 30 - idx * 4;
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
    f.x += (dx / dd) * 560 * dt;
    f.y += (dy / dd) * 560 * dt;
    if (dd < 28) {
      if (!p.carry && p.mode !== "dead") {
        f.mode = "carried";
        p.carry = f.id;
        G.sfx("pickup");
        G.toast(`Buah batu bobot ${f.w} — bawa ke keranjang.`, 1.8);
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
  // free
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
    G.toast("Buahnya jatuh — tumbuh lagi di pohon asalnya.", 1.6);
  }
}

// ---------------------------------------------------------------- sprouts
export function growSprout(G, tx, ty, arrow) {
  const { s } = G;
  const sides = arrow.vx > 0 ? [-1, 1] : [1, -1];
  for (const side of sides) {
    const x0 = side < 0 ? tx - 2 : tx + 1;
    if (isSolid(x0, ty) || isSolid(x0 + 1, ty)) continue;
    const x = x0 * T;
    const top = ty * T + 4;
    s.sprouts = s.sprouts.filter((sp) => !(Math.abs(sp.x - x) < T && Math.abs(sp.top - top) < T));
    if (s.sprouts.length >= 3) s.sprouts.shift();
    s.sprouts.push({ id: G.uid("sp"), x, top, w: 2 * T, t: 0, side });
    G.sfx("sprout");
    G.fx("FX_A", "sprout_grow", side < 0 ? x + 2 * T - 10 : x + 10, top + 14, 0.45, 40, side < 0);
    return true;
  }
  return false;
}

// ---------------------------------------------------------------- arrow targets
const near = (a, x, y, r) => dist(a.x, a.y, x, y) < r;

export function aimTargets(G) {
  const { s } = G;
  const pr = s.pr;
  const p = s.player;
  const out = [];
  const type = p.arrowType;
  const area = G.areaOfPlayer();
  for (const d of ofType("latch")) if (!pr.latches[d.id] && d.area === area) out.push({ x: d.x, y: d.y, puzzle: true });
  for (const d of ofType("switch")) if (d.area === area && !pr.gates.gate1) out.push({ x: d.x, y: d.y, puzzle: true });
  if (type === "sprout")
    for (const d of ofType("garden")) if (!pr.gardens[d.id] && gardenWet(pr, d.id)) out.push({ x: d.x + d.w / 2, y: d.y + d.h / 2, puzzle: true });
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
  if (pr.bosses.boss1 && !pr.seqs.mush) for (const d of ofType("mushroom")) if (d.seq) out.push({ x: d.x, y: d.y - 34, puzzle: true });
  aimTargets2(G, out);
  if (!pr.seqs.bub) for (const d of ofType("bubbleT")) if (!s.seq.bub.popped[d.id]) out.push({ x: d.x, y: d.y, puzzle: true });
  for (const e of s.enemies) if (e.alive) out.push({ x: e.x, y: e.y - e.h / 2, id: e.id, creature: true });
  for (const b of Object.values(s.bosses)) if (b.active && b.state !== "defeat") out.push({ x: b.x, y: b.y - b.h / 2, id: b.id, creature: true });
  return out;
}

export function pegPos(d) {
  return { x: d.post * T + T / 2, y: liftTargetTop(d, d.target) - 14 };
}

// Returns true when the arrow is consumed by a puzzle object.
export function puzzleArrowHit(G, a, x, y) {
  const { s } = G;
  const pr = s.pr;
  const tip = { x, y };
  // Latches.
  for (const d of ofType("latch")) {
    if (pr.latches[d.id] || !near(tip, d.x, d.y, 18)) continue;
    pr.latches[d.id] = true;
    G.sfx("hit");
    G.sfx("water");
    G.fx("FX_A", "arrow_hit", d.x, d.y + 10, 0.3, 30);
    G.toast("Pengait terbuka — embun mengalir!");
    G.save();
    return true;
  }
  for (const d of ofType("switch")) {
    if (!near(tip, d.x, d.y, 20) || pr.gates.gate1) continue;
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
      G.toast(gardenWet(pr, d.id) ? "Kebunnya basah — tumbuhkan dengan Panah Tunas!" : "Kebun ini kering. Alirkan embun ke sini dulu.", 1.8);
      return false;
    }
    if (!gardenWet(pr, d.id)) {
      G.toast("Kebun ini masih kering — buka salurannya dulu.", 1.8);
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
  // Pegs lock aligned lifts.
  for (const d of ofType("lift")) {
    if (pr.locked[d.basket]) continue;
    const pg = pegPos(d);
    if (!near(tip, pg.x, pg.y, 18)) continue;
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
  // Fruits: stems drop them, thread pulls them.
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
    if ((f.mode === "hang" || f.mode === "free") && near(tip, f.x, f.y, 20)) {
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
  // Anchors (thread).
  if (a.type === "thread") {
    for (const d of ofType("anchor")) {
      if (!near(tip, d.x, d.y, 22)) continue;
      const p = s.player;
      const dd = dist(p.x, p.y - p.h, d.x, d.y);
      G.fx("FX_B", "thread_attach", d.x, d.y + 16, 0.35, 36);
      G.sfx("rope");
      if (dd < 360 && (p.mode === "normal" || p.mode === "rope")) attachRope(G, d.x, d.y);
      else G.toast("Terlalu jauh untuk berayun.", 1.4);
      return true;
    }
    if (s.hangnest.state === "hang" && near(tip, byId.hangnest.x, s.hangnest.y, 24)) {
      s.hangnest.state = "fall";
      s.hangnest.vy = 0;
      G.sfx("rope");
      return true;
    }
  } else if (s.hangnest.state === "hang" && near(tip, byId.hangnest.x, s.hangnest.y, 24)) {
    G.toast("Sarangnya terlalu kuat terikat. Mungkin bisa ditarik…", 1.8);
    G.sfx("block");
    return true;
  }
  // Optional sequences.
  if (pr.bosses.boss1 && !pr.seqs.mush)
    for (const d of ofType("mushroom")) if (d.seq && near(tip, d.x, d.y - 32, 22)) return seqHit(G, "mush", d);
  if (arrowHit2(G, a, x, y)) return true;
  if (!pr.seqs.bub)
    for (const d of ofType("bubbleT")) if (!s.seq.bub.popped[d.id] && near(tip, d.x, d.y, 18)) return seqHit(G, "bub", d);
  // Enemy bubbles can be popped.
  for (const sh of s.shots)
    if (sh.kind === "bubble" && near(tip, sh.x, sh.y, 16)) {
      sh.life = 0;
      G.sfx("bubble");
      return true;
    }
  return false;
}

export function seqHit(G, key, d) {
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
      else G.toast(key === "spore" ? "Lampu spora menyala semua — peti di bawah terbuka!" : "Urutannya benar! Sesuatu muncul…");
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

// ---------------------------------------------------------------- touch: checkpoints, nests, pickups
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
        G.toast("Altar menyala — tersimpan.");
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
    G.toast(n >= 2 ? "Sarang perjalanan aktif — tekan tombol tangan di sarang untuk terbang." : "Sarang perjalanan aktif.");
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

export function pickupList(G) {
  const pr = G.s.pr;
  return [...ofType("seed"), ...ofType("feather")].filter(
    (d) => !pr.got[d.id] && (!d.seqReward || pr.seqs[d.seqReward]) && (!d.hidden || pr.got[d.hidden]),
  );
}

// ---------------------------------------------------------------- interaction
export function findInteract(G) {
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

export function doInteract(G, it) {
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
        G.toast(n ? "Keranjang dikosongkan — buah kembali ke pohonnya." : "Keranjangnya sudah kosong.");
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

// Water surface y at a point inside a reservoir, or null.
export function waterSurfaceAt(G, x, y) {
  const { s } = G;
  for (const d of ofType("reservoir")) {
    if (!d.raft) continue; // the sealed upper tank is not swimmable
    if (x < d.x || x > d.x + d.w) continue;
    const surf = reservoirSurface(s, d);
    if (surf >= d.bottom - 4) continue;
    if (y > surf && y < d.bottom) return surf;
  }
  return null;
}
