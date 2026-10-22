// Puzzles and world objects of the upper layers (Areas 4–13): sunlight and
// mirrors, bells and echo bridges, wind fans and the seed pod, greenhouse heat,
// treasure chests and the crystal run, the mirror world, clockwork rings,
// storm totems, spore lamps and the constellation of the crown.
import { T, TILE } from "./constants.js";
import { ofType, byId, isSolid, tileAt, setBlocks, setSide, STAR_EDGES, STAR_BLOCKED } from "./world.js";
import { moveBody } from "./physics.js";

const near = (ax, ay, bx, by, r) => Math.hypot(ax - bx, ay - by) < r;
const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const FAN_DIRS = ["up", "right", "left"];

export const fanDir = (pr, d) => pr.fans[d.id] ?? d.dir0;
export const mirrorState = (pr, d) => pr.mirrors[d.id] ?? d.s0;
export const statuePhase = (pr, d) => pr.statues[d.id] ?? d.p0;
export const ventOpen = (pr, d) => pr.vents[d.id] ?? d.open0;
export function roomTemp(pr, room) {
  if (!pr.furnace) return 0;
  return ofType("vent").filter((v) => ventOpen(pr, v) && v.rooms.includes(room.id)).length;
}
export function starDegree(pr, id) {
  return Object.keys(pr.links).filter((k) => pr.links[k] && k.split("|").includes(id)).length;
}

// ---------------------------------------------------------------- init
export function initPuzzles2(G) {
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
  s.pod = pr.podDone
    ? { x: byId.house6.x, y: byId.house6.y - 12, vx: 0, vy: 0, way: "way0", rest: 0, done: true }
    : { x: way.x, y: way.y - 12, vx: 0, vy: 0, way: "way0", rest: 0, done: false };
  s.light = { segs: [], eyes: {}, bridges: {} };
  traceLight(s);
}

// ---------------------------------------------------------------- light (Area 4)
function traceLight(s) {
  const pr = s.pr;
  const out = { segs: [], eyes: {}, cells: new Set(), bridges: {} };
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
  for (const b of ofType("lightbridge")) {
    let lit = false;
    for (let x = b.x0; x <= b.x1; x++) if (out.cells.has(`${x},${b.row}`)) lit = true;
    out.bridges[b.id] = lit;
  }
  s.light = { segs: out.segs, eyes: out.eyes, bridges: out.bridges };
}

// ---------------------------------------------------------------- platforms
export function plats2(G, out) {
  const { s } = G;
  for (const b of ofType("lightbridge")) if (s.light.bridges[b.id]) out.push({ id: b.id, x: b.x, w: b.w, top: b.y, prevTop: b.y });
  for (const b of ofType("echoBridge")) if ((s.echo[b.id] || 0) > 0) out.push({ id: b.id, x: b.x, w: b.w, top: b.y, prevTop: b.y });
  for (const d of ofType("rotplat")) {
    const p = rotPos(d, s.mechT);
    const q = rotPos(d, s.mechT - (s.mechDt || 0));
    out.push({ id: d.id, x: p.x - d.w / 2, w: d.w, top: p.y, prevTop: q.y, prevX: q.x - d.w / 2 });
  }
}
export function rotPos(d, t) {
  const a = t * d.speed;
  return { x: d.cx + Math.cos(a) * d.r, y: d.cy + Math.sin(a) * d.r };
}
export function pendulumPos(d, t) {
  const a = Math.sin(t * d.speed) * d.amp;
  return { x: d.ax + Math.sin(a) * d.len, y: d.ay + Math.cos(a) * d.len, a };
}

// Wind zones from fans: rect in world units plus a direction.
export function windZones(pr) {
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
const inZone = (z, x, y) => x > z.x && x < z.x + z.w && y > z.y && y < z.y + z.h;

// ---------------------------------------------------------------- update
export function updatePuzzles2(G, dt) {
  const { s } = G;
  const pr = s.pr;
  const p = s.player;
  const area = G.areaOfPlayer();
  s.mechDt = dt;
  s.mechT += dt;
  for (const k of Object.keys(s.echo)) s.echo[k] = Math.max(0, s.echo[k] - dt);
  if (area === 3) traceLight(s);
  // Gate conditions that several actions can complete.
  if (!pr.gates.gate4 && ofType("eye").every((e) => s.light.eyes[e.id])) G.openGate("gate4");
  if (!pr.gates.gate7 && pr.furnace && ofType("room").every((r) => roomTemp(pr, r) === 1)) G.openGate("gate7");
  if (!pr.gates.gate11 && pr.bosses.boss11 && ofType("enemy").filter((d) => d.kind === "totem").every((d) => pr.got[d.id])) G.openGate("gate11");

  // Rings.
  for (const d of ofType("ring")) {
    const r = s.rings[d.id];
    if (!r.held && !pr.gates.gate10) r.ang = (r.ang + d.speed * dt + Math.PI * 2) % (Math.PI * 2);
  }
  // Pendulums hurt on contact.
  if (area === 9)
    for (const d of ofType("pendulum")) {
      const b = pendulumPos(d, s.mechT);
      if (near(p.x, p.y - p.h / 2, b.x, b.y, 24)) G.hurt(1, { fromX: b.x });
    }
  // Updrafts lift the player too.
  if (area === 5 && (p.mode === "normal" || p.mode === "dash")) {
    for (const z of windZones(pr))
      if (z.dir === "up" && inZone(z, p.x, p.y - p.h / 2)) {
        p.vy = Math.max(p.vy - 2700 * dt, -340);
        p.onGround = false;
        if (Math.random() < 0.4) G.particle(p.x + (Math.random() - 0.5) * 30, p.y, 0, -140, "#e8fbff", 2.5, 0.5);
      }
  }
  if (area === 5) updatePod(G, dt);
  // Crystal run (bonus Area 8).
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
    s.ui.toast = { text: `Kristal ${n}/${total} · ${Math.ceil(run.t)} dtk`, t: 0.3 };
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
      G.toast("Waktu habis — sentuh kristal awal untuk mencoba lagi.", 3);
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
    // Updrafts carry the seed straight up; side gusts carry it level.
    if (z.dir === "up") {
      pod.vy = Math.max(pod.vy - 2000 * dt, -280);
      pod.vx *= 1 - Math.min(1, 6 * dt);
    } else {
      pod.vx += (z.dir === "right" ? 1 : -1) * 600 * dt;
      pod.vy -= 380 * dt; // cancels gravity inside the gust
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
  if (hitThorn || (pod.rest > 6 && !atWay)) resetPod(G, hitThorn);
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
  G.toast(thorn ? "Benihnya kena duri — kembali ke sarang singgah." : "Benih kembali ke sarang singgah terakhir.", 2);
}

// ---------------------------------------------------------------- aim targets
export function aimTargets2(G, out) {
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
    if (type === "ember") for (const d of ofType("bramble")) if (!pr.burned[d.id]) P(d.x + d.w / 2, d.y + d.h / 2);
    for (const d of ofType("vent")) P(d.x, d.y - 16);
  }
  if (area === 8 && !pr.gates.gate9) for (const d of ofType("statue")) P(d.x, d.y - 40);
  if (area === 9) {
    for (const d of ofType("ring")) P(d.pin.x, d.pin.y);
    P(byId.core10.x, byId.core10.y);
  }
  if (area === 11 && !pr.seqs.spore) for (const d of ofType("sporeLamp")) if (!s.seq.spore?.popped[d.id]) P(d.x, d.y);
  if (area === 12 && type === "thread" && !pr.gates.gate13) for (const d of ofType("starNode")) P(d.x, d.y);
}

// ---------------------------------------------------------------- arrow hits
export function arrowHit2(G, a, x, y) {
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
      G.toast("Penutup terbuka — cahaya matahari masuk!");
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
        G.toast(pr.abilities.echo ? "Lonceng hanya bergema dengan Panah Gema." : "Lonceng ini diam… mungkin butuh panah khusus.", 1.8);
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
      pod.vx += (a.vx / sp) * 170;
      pod.vy += (a.vy / sp) * 170 - 110;
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
        G.toast("Tungku menyala — panas mengalir ke rumah kaca!");
        G.save();
      } else if (!pr.furnace) G.toast("Tungku dingin. Butuh api…", 1.6);
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
        G.toast("Semak kering… mudah terbakar.", 1.4);
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
  if (area === 11 && !pr.seqs.spore)
    for (const d of ofType("sporeLamp")) if (!s.seq.spore?.popped[d.id] && hit(d, 20)) return G.seqHit("spore", d);
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

export const ringAligned = (ang) => {
  const a = ((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
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
  const seen = new Set([nodes[0].id]);
  const stack = [nodes[0].id];
  while (stack.length) {
    const n = stack.pop();
    for (const k of Object.keys(pr.links)) {
      if (!pr.links[k]) continue;
      const [a, b] = k.split("|");
      const o = a === n ? b : b === n ? a : null;
      if (o && !seen.has(o)) {
        seen.add(o);
        stack.push(o);
      }
    }
  }
  return seen.size === nodes.length;
}

// ---------------------------------------------------------------- interaction
export function findInteract2(G, close) {
  const { s } = G;
  const pr = s.pr;
  for (const d of ofType("bellMural")) if (close(d, 44)) return { kind: "bellMural", id: d.id, label: "Baca" };
  for (const d of ofType("altar")) if (close(d, 40)) return { kind: "altar", id: d.id, label: "Sentuh" };
  for (const d of ofType("chest")) if (close(d, 40) && !pr.chests[d.id]) return { kind: "chest", id: d.id, label: "Buka" };
  for (const d of ofType("shardStart")) if (close(d, 40) && !pr.seqs.shards && !s.shardRun.active) return { kind: "shardStart", id: d.id, label: "Mulai" };
  return null;
}

export function doInteract2(G, it) {
  const { s } = G;
  const pr = s.pr;
  const p = s.player;
  if (it.kind === "bellMural") {
    const d = byId[it.id];
    pr.murals[it.id] = true;
    const names = ["pertama", "kedua", "ketiga", "keempat", "kelima"];
    const bells = ofType("bell");
    const lines = d.reveals.map((o) => {
      const b = bells.find((q) => q.order === o);
      return `Nada ${names[o - 1]}: lonceng ke-${bells.indexOf(b) + 1} dari kiri.`;
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
    G.toast(pr.side ? "Sisi Pantulan — jalan bulan terlihat." : "Sisi Nyata kembali.", 1.8);
    G.save();
  } else if (it.kind === "chest") {
    const d = byId[it.id];
    if (d.needs && !pr.seqs[d.needs]) {
      G.sfx("deny");
      G.toast(d.needs === "shards" ? "Terkunci — selesaikan tantangan kristal dulu." : "Terkunci — nyalakan lampu spora sesuai urutan.", 2);
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
