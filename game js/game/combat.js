// The bow (aiming, aim assist, Sky Focus, arrow flight), enemy shots,
// regular enemies and the three bosses.
import { T, TILE, ARROW_COLOR, ARROW_COST, ARROW_NAME, ARROW_TYPES, FXC, WORLD_W, WORLD_H } from "./constants.js";
import { isSolidAt, tileAt, ofType, byId, isOneWayTile } from "./world.js";
import { moveBody } from "./physics.js";

export const ARROW_G = 320;
// How many past positions an arrow remembers. The renderer draws the trail
// through them, so the streak follows the real arc instead of the heading.
export const ARROW_TRAIL = 13;

// ai picks the behaviour; repainted sheets keep their source sheet's row names.
const hop = (sheet, o = {}) => ({ sheet, move: "slime", attack: "slime_attack", ai: "slime", w: 26, h: 22, hp: 2, vis: 30, ...o });
const walk = (sheet, o = {}) => ({ sheet, move: "beetle", attack: "beetle_attack", ai: "beetle", w: 30, h: 22, hp: 3, vis: 28, ...o });
const dive = (sheet, o = {}) => ({ sheet, move: "swooper", attack: "swooper_dive", ai: "swooper", w: 30, h: 24, hp: 2, vis: 42, fly: true, ...o });
const turret = (sheet, o = {}) => ({ sheet, move: "sentry", attack: "sentry_shoot", ai: "sentry", w: 28, h: 40, hp: 3, vis: 48, ...o });
const shield = (sheet, o = {}) => ({ sheet, move: "crab", attack: "crab_attack", ai: "crab", w: 36, h: 26, hp: 3, vis: 38, ...o });
const floater = (sheet, o = {}) => ({ sheet, move: "bubbler", attack: "bubbler_shoot", ai: "bubbler", w: 28, h: 26, hp: 2, vis: 36, fly: true, shot: "orb", ...o });
export const ENEMY = {
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
  totem: { sheet: "PROPS_E", ai: "totem", w: 30, h: 70, hp: 4, vis: 78, still: true },
};
export const BOSS = {
  moss: { sheet: "BOSS_MOSS", name: "Induk Lumut", w: 96, h: 66, hp: 14, vis: 100 },
  eagle: { sheet: "BOSS_EAGLE", name: "Elang Ranting", w: 70, h: 54, hp: 14, vis: 112, fly: true },
  crab: { sheet: "BOSS_CRAB", name: "Penjaga Kanal", w: 104, h: 70, hp: 18, vis: 112 },
  mirror: { sheet: "BOSS_MIRROR", name: "Raja Kumbang Cermin", w: 104, h: 72, hp: 20, vis: 114, ai: "crab" },
  stag: { sheet: "BOSS_STAG", name: "Rusa Bara", w: 92, h: 76, hp: 22, vis: 116, ai: "stag" },
  shadow: { sheet: "SKIN_BAYANGAN", name: "Bayangan Aera", w: 22, h: 44, hp: 16, vis: 60, ai: "shadow" },
  golem: { sheet: "BOSS_GOLEM", name: "Golem Jam", w: 100, h: 84, hp: 24, vis: 124, ai: "crab" },
  dragon: { sheet: "BOSS_DRAGON", name: "Naga Awan", w: 84, h: 60, hp: 22, vis: 124, fly: true, ai: "eagle" },
  crown: { sheet: "BOSS_CROWN", name: "Penjaga Mahkota", w: 84, h: 66, hp: 36, vis: 134, fly: true, ai: "final" },
};
export const bossAi = (kind) => BOSS[kind].ai || kind;

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
    jumps: 0,
  };
}

export function spawnEnemies(G) {
  const s = G.s;
  s.enemies = ofType("enemy")
    .filter((d) => !(d.kind === "totem" && s.pr.got[d.id]))
    .map((d) => makeEnemy(G, d.kind, d.x, d.y, d.id));
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
      onGround: !k.fly,
    };
  }
}

// ---------------------------------------------------------------- aiming
export function updateAim(G, dt) {
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
    // A tap shorter than one frame: loose a quick shot straight ahead.
    const d = aimDir(G);
    p.aimX = d.x;
    p.aimY = d.y;
    p.drawT = 0.1;
    fireArrow(G);
  }
  // Sky Focus: aiming in the air slows the world while the meter lasts.
  const wasFocused = s.slowmo;
  s.slowmo = p.aiming && !p.onGround && p.mode === "normal" && p.focus > 0;
  if (s.slowmo && !wasFocused) G.sfx("focus");
  if (s.slowmo) p.focus = Math.max(0, p.focus - dt);
  else if (p.onGround) p.focus = Math.min(p.focusMax, p.focus + dt * 0.7);
  p.energy = Math.min(100, p.energy + G.tw.energyRegen * dt);
  if (!G.inputLocked() && inp.cyclePressed) cycleArrow(G);
}

export function cycleArrow(G) {
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

export function bowOrigin(p) {
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
  // Lock: the bow always points at the nearest target in range (an enemy, a boss,
  // or a puzzle object that needs an arrow). Free aim only when none is in range.
  // aimAssist 0 turns the lock off.
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
      G.toast("Energi panah kurang — panah biasa dilepas.");
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
    trail: [{ x: o.x, y: o.y }],
  });
  p.releaseT = 0.24;
  p.animT = 0;
  s.lastShot = { x: p.aimX, y: p.aimY, t: s.time };
  // The loose itself: a flash at the bow, tinted and shaped per arrow, which
  // the renderer draws for a fifth of a second.
  s.release = { x: o.x, y: o.y, ang: Math.atan2(p.aimY, p.aimX), type, pow, t: 0, dur: 0.22 };
  releaseBurst(G, type, o, p.aimX, p.aimY, pow);
  G.sfx("bow");
}

// Sparks thrown off the string as the arrow leaves, in the arrow's own colour.
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

// The flourish an arrow leaves where it lands. Every type reads differently so
// a hit tells you which arrow did it without reading the HUD.
const IMPACT = {
  sprout: ["FX_A", "sprout_grow", 0.45, 36],
  thread: ["FX_B", "thread_attach", 0.36, 34],
  echo: ["FX_C", FXC.spark, 0.4, 44],
  wind: ["FX_C", FXC.wind, 0.4, 46],
  ember: ["FX_C", FXC.fire, 0.45, 48],
};
export function arrowImpact(G, type, x, y) {
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

// Smoke, leaves or embers shed along the flight path.
function emitTrail(G, a) {
  const col = ARROW_COLOR[a.type];
  const sp = Math.hypot(a.vx, a.vy) || 1;
  const nx = -a.vy / sp;
  const ny = a.vx / sp;
  const side = (G.rand() - 0.5) * 2;
  switch (a.type) {
    case "sprout":
      G.particle(a.x, a.y, nx * 40 * side - a.vx * 0.08, ny * 40 * side - a.vy * 0.08, col, 1.6, 0.34);
      break;
    case "ember":
      for (let i = 0; i < 2; i++) G.particle(a.x, a.y, nx * 30 * side - a.vx * 0.1, -40 - G.rand() * 60, i ? "#ffd27a" : col, 1.5 + G.rand(), 0.3);
      break;
    case "wind":
      G.particle(a.x, a.y, nx * 70 * side, ny * 70 * side, col, 1.4, 0.26);
      break;
    case "thread":
      G.particle(a.x, a.y, nx * 20 * side, ny * 20 * side, "#ffffff", 1.1, 0.28);
      break;
    case "echo":
      G.particle(a.x, a.y, -a.vx * 0.1, -a.vy * 0.1, col, 1.8, 0.3);
      break;
    default:
      if (G.rand() < 0.5) G.particle(a.x, a.y, nx * 18 * side, ny * 18 * side, col, 1, 0.18);
  }
}

// ---------------------------------------------------------------- arrows
export function updateArrows(G, dt) {
  const { s } = G;
  for (const a of s.arrows) {
    if (a.stuck) {
      a.life -= dt;
      if (a.life <= 0) a.dead = true;
      continue;
    }
    const steps = 3;
    for (let i = 0; i < steps; i++) {
      a.vy += (ARROW_G * dt) / steps;
      a.x += (a.vx * dt) / steps;
      a.y += (a.vy * dt) / steps;
      const sp = Math.hypot(a.vx, a.vy) || 1;
      const tx = a.x + (a.vx / sp) * 16;
      const ty = a.y + (a.vy / sp) * 16;
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
  for (const b of Object.values(s.bosses)) {
    if (b.state === "defeat" || !inRect(x, y, b)) continue;
    if (b.state === "vanish") continue;
    if (bossAi(b.kind) === "crab" && b.state !== "stuck") {
      G.sfx("block");
      G.fx("FX_A", "arrow_hit", x, y + 8, 0.25, 24);
      return true;
    }
    damageBoss(G, b, 1);
    arrowImpact(G, a.type, x, y);
    return true;
  }
  return false;
}

export function damageEnemy(G, e, n, dirX = 0) {
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

function damageBoss(G, b, n) {
  b.hp -= n;
  b.flash = 0.2;
  G.sfx("hit");
  G.fx("FX_A", "arrow_hit", b.x, b.y - b.h / 2, 0.3, 40);
  if (b.hp <= 0 && b.state !== "defeat") {
    b.state = "defeat";
    b.t = 1.4;
    b.animT = 0;
    G.sfx("boss");
    G.shake(8);
  }
}

// ---------------------------------------------------------------- enemy shots
export function updateShots(G, dt) {
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
    const hit =
      sh.kind === "wave" || sh.kind === "fire"
        ? Math.abs(p.x - sh.x) < (sh.kind === "fire" ? 16 : 22) && p.y > sh.y - 30 && p.y <= sh.y + 2
        : Math.abs(p.x - sh.x) < p.w / 2 + 6 && sh.y > p.y - p.h - 4 && sh.y < p.y + 4;
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

export function shoot(G, kind, x, y, tx, ty, speed, life = 3) {
  const d = Math.hypot(tx - x, ty - y) || 1;
  G.s.shots.push({ id: G.uid("s"), kind, x, y, vx: ((tx - x) / d) * speed, vy: ((ty - y) / d) * speed, life });
}

// ---------------------------------------------------------------- enemies
export function updateEnemies(G, dt) {
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
        if (r.wallL || r.wallR || (e.onGround && !isSolidAt(aheadX, e.y + 6) && !isOneWayTile(tileAt(Math.floor(aheadX / T), Math.floor((e.y + 6) / T))))) {
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
            e.t = 1.0;
            const d = Math.hypot(dx, dy - 20) || 1;
            e.vx = (dx / d) * 340 * spd;
            e.vy = ((dy - 20) / d) * 340 * spd;
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
            e.x += (hx / d) * 150 * dt;
            e.y += (hy / d) * 150 * dt;
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
            e.t = 1.0;
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
    // Contact damage.
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

// ---------------------------------------------------------------- bosses
export function updateBosses(G, dt) {
  const { s } = G;
  const p = s.player;
  for (const b of Object.values(s.bosses)) {
    const d = byId[b.id];
    const ar = d.arena;
    const inArena = p.x > ar.x && p.x < ar.x + ar.w && p.y > ar.y && p.y - 10 < ar.y + ar.h;
    if (!b.active && inArena && p.mode !== "dead") {
      b.active = true;
      G.bossIntro(b);
    }
    // Leaving the boss's layer calls the fight off; it starts fresh next time.
    if (b.active && G.areaOfPlayer() !== d.area) {
      const k = BOSS[b.kind];
      Object.assign(b, { active: false, hp: b.max, x: d.x, y: k.fly ? d.y + k.h / 2 : d.y, vx: 0, vy: 0, state: "idle", t: 1.2, onGround: !k.fly });
      if (s.ui.boss === b.id) s.ui.boss = null;
    }
    if (!b.active) continue;
    b.flash -= dt;
    b.animT += dt;
    b.t -= dt;
    const dx = p.x - b.x;
    if (b.state === "defeat") {
      // Fall to the floor (fliers drop out of the air) while the defeat plays.
      b.vx = 0;
      if (!b.onGround) {
        b.vy = Math.min((b.vy || 0) + 900 * dt, 500);
        b.onGround = moveBody(b, 0, b.vy * dt, []).ground;
      }
      if (b.t <= 0) G.bossDefeated(b);
      continue;
    }
    const ai = bossAi(b.kind);
    if (ai === "moss") updateMoss(G, b, dt, dx, ar);
    else if (ai === "eagle") updateEagle(G, b, dt, dx, ar);
    else if (ai === "stag") updateStag(G, b, dt, dx, ar);
    else if (ai === "shadow") updateShadow(G, b, dt, dx, ar);
    else if (ai === "final") updateFinal(G, b, dt, dx, ar);
    else updateCrabBoss(G, b, dt, dx, ar);
    // Contact.
    if (b.state !== "vanish" && p.mode !== "dead" && Math.abs(p.x - b.x) < (p.w + b.w) / 2 - 8 && p.y > b.y - b.h + 8 && p.y - p.h < b.y - 6) G.hurt(1, { fromX: b.x });
  }
  for (const id of Object.keys(s.bosses)) if (s.bosses[id].gone) delete s.bosses[id];
}

function clampArena(b, ar) {
  b.x = Math.max(ar.x + b.w / 2, Math.min(ar.x + ar.w - b.w / 2, b.x));
}

function updateMoss(G, b, dt, dx, ar) {
  const spd = G.tw.enemySpeed;
  if (b.state === "idle") {
    b.face = Math.sign(dx) || b.face;
    if (b.t <= 0) {
      b.state = "windup";
      b.t = 0.5;
      b.animT = 0;
    }
  } else if (b.state === "windup") {
    if (b.t <= 0) {
      b.state = "leap";
      b.vy = -640;
      b.vx = Math.max(-260, Math.min(260, dx * 1.1)) * spd;
      b.animT = 0;
      b.onGround = false;
    }
  }
  b.vy = Math.min(b.vy + 1500 * dt, 800);
  const r = moveBody(b, b.vx * dt, b.vy * dt, []);
  clampArena(b, ar);
  if (r.ground && b.state === "leap") {
    b.state = "idle";
    b.t = 0.9 + G.rand() * 0.5;
    b.vx = 0;
    b.cycle++;
    G.shake(7);
    G.sfx("boss");
    G.fx("FX_A", "dust", b.x - 30, b.y, 0.45, 60);
    G.fx("FX_A", "dust", b.x + 30, b.y, 0.45, 60, true);
    if (b.cycle % 2 === 0) {
      const small = G.s.enemies.filter((e) => e.alive && e.kind === "slimeSmall").length;
      if (small < 2) {
        const e = makeEnemy(G, "slimeSmall", b.x + b.face * 40, b.y - 10, G.uid("e"));
        e.vy = -300;
        e.vx = b.face * 120;
        G.s.enemies.push(e);
      }
    }
  }
}

function updateEagle(G, b, dt, dx, ar) {
  const p = G.s.player;
  const spd = G.tw.enemySpeed;
  const hoverY = ar.y + Math.max(70, ar.h * 0.45);
  if (b.state === "idle" || b.state === "hover") {
    b.state = "hover";
    b.ph = (b.ph || 0) + dt;
    const tx = ar.x + ar.w / 2 + Math.sin(b.ph * 0.9) * (ar.w / 2 - 50);
    b.x += (tx - b.x) * Math.min(1, dt * 2.5);
    b.y += (hoverY + Math.sin(b.ph * 2.4) * 10 - b.y) * Math.min(1, dt * 3);
    b.face = Math.sign(dx) || b.face;
    if (b.t <= 0) {
      b.cycle++;
      if (b.cycle % 3 === 0) {
        b.state = "volley";
        b.t = 0.7;
        b.animT = 0;
      } else {
        b.state = "warn";
        b.t = 0.55;
        b.animT = 0;
        G.sfx("swish");
      }
    }
  } else if (b.state === "volley") {
    if (b.t <= 0) {
      for (const off of [-50, 0, 50]) shoot(G, "feather", b.x, b.y - b.h / 2, p.x + off, p.y - 20, 250 * spd);
      b.state = "hover";
      b.t = 1.4;
    }
  } else if (b.state === "warn") {
    if (b.t <= 0) {
      const tx = p.x - b.x;
      const ty = p.y - 10 - b.y;
      const d = Math.hypot(tx, ty) || 1;
      b.vx = (tx / d) * 430 * spd;
      b.vy = (ty / d) * 430 * spd;
      b.state = "dive";
      b.t = 1.1;
      b.animT = 0;
    }
  } else if (b.state === "dive") {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.t <= 0 || b.y >= ar.y + ar.h - 4 || isSolidAt(b.x, b.y)) {
      b.y = Math.min(b.y, ar.y + ar.h - 4);
      b.state = "rise";
      G.shake(3);
    }
  } else if (b.state === "rise") {
    b.y -= 260 * dt;
    if (b.y <= hoverY) {
      b.state = "hover";
      b.t = 1.5 + G.rand() * 0.6;
    }
  }
  clampArena(b, ar);
  b.y = Math.max(ar.y + b.h, Math.min(ar.y + ar.h, b.y));
}

function updateCrabBoss(G, b, dt, dx, ar) {
  const p = G.s.player;
  const spd = G.tw.enemySpeed;
  if (b.state === "idle" || b.state === "walk") {
    b.state = "walk";
    b.face = Math.sign(dx) || b.face;
    b.vx = b.face * 70 * spd;
    if (Math.abs(dx) < 40) b.vx = 0;
    if (b.t <= 0) {
      b.cycle++;
      b.state = b.cycle % 3 === 0 ? "spray" : "raise";
      b.t = b.state === "spray" ? 0.6 : 0.7;
      b.animT = 0;
      b.vx = 0;
    }
  } else if (b.state === "raise") {
    if (b.t <= 0) {
      b.state = "slam";
      b.t = 0.25;
      b.animT = 0;
      G.shake(9);
      G.sfx("boss");
      G.s.shots.push({ id: G.uid("s"), kind: "wave", x: b.x - b.w / 2, y: b.y, vx: -280 * spd, vy: 0, life: 1.6 });
      G.s.shots.push({ id: G.uid("s"), kind: "wave", x: b.x + b.w / 2, y: b.y, vx: 280 * spd, vy: 0, life: 1.6 });
      G.fx("FX_A", "splash", b.x, b.y, 0.5, 70);
    }
  } else if (b.state === "slam") {
    if (b.t <= 0) {
      b.state = "stuck";
      b.t = 1.6;
      b.animT = 0;
    }
  } else if (b.state === "stuck") {
    if (b.t <= 0) {
      b.state = "walk";
      b.t = 1.6 + G.rand();
    }
  } else if (b.state === "spray") {
    if (b.t <= 0) {
      for (const off of [-80, 0, 80]) shoot(G, "bubble", b.x, b.y - b.h * 0.7, p.x + off, p.y - 30, 120 * spd, 4);
      b.state = "walk";
      b.t = 1.4;
    }
  }
  b.vy = Math.min(b.vy + 1500 * dt, 800);
  moveBody(b, b.vx * dt, b.vy * dt, []);
  clampArena(b, ar);
}

// Rusa Bara: charges wall to wall leaving fire, every third cycle leaps; dizzy after a charge.
function updateStag(G, b, dt, dx, ar) {
  const spd = G.tw.enemySpeed;
  if (b.state === "idle") {
    b.face = Math.sign(dx) || b.face;
    b.vx = 0;
    if (b.t <= 0) {
      b.cycle++;
      b.state = b.cycle % 3 === 0 ? "windup" : "aim";
      b.t = 0.55;
      b.animT = 0;
      G.sfx("swish");
    }
  } else if (b.state === "aim") {
    if (b.t <= 0) {
      b.state = "charge";
      b.vx = b.face * 360 * spd;
      b.animT = 0;
    }
  } else if (b.state === "charge") {
    if (G.rand() < 0.25) G.s.shots.push({ id: G.uid("s"), kind: "fire", x: b.x - b.face * 30, y: b.y, vx: 0, vy: 0, life: 1.6 });
    const atWall = (b.face > 0 && b.x >= ar.x + ar.w - b.w / 2 - 2) || (b.face < 0 && b.x <= ar.x + b.w / 2 + 2);
    if (atWall) {
      b.state = "stuck";
      b.t = 1.3;
      b.vx = 0;
      G.shake(7);
      G.sfx("boss");
    }
  } else if (b.state === "windup") {
    if (b.t <= 0) {
      b.state = "leap";
      b.vy = -660;
      b.vx = Math.max(-280, Math.min(280, dx * 1.1)) * spd;
      b.onGround = false;
      b.animT = 0;
    }
  } else if (b.state === "stuck") {
    if (b.t <= 0) {
      b.state = "idle";
      b.t = 0.6;
      b.face *= -1;
    }
  }
  b.vy = Math.min(b.vy + 1500 * dt, 800);
  const r = moveBody(b, b.vx * dt, b.vy * dt, []);
  clampArena(b, ar);
  if (r.ground && b.state === "leap") {
    b.state = "idle";
    b.t = 0.8;
    b.vx = 0;
    G.shake(7);
    G.sfx("boss");
    for (const v of [-260, 260]) G.s.shots.push({ id: G.uid("s"), kind: "wave", x: b.x, y: b.y, vx: v * spd, vy: 0, life: 1.5 });
  }
}

// Bayangan Aera: blinks between three spots, looses volleys, and answers the
// player's last shot by firing back along the same line.
function updateShadow(G, b, dt, dx, ar) {
  const p = G.s.player;
  const spd = G.tw.enemySpeed;
  const spots = [ar.x + 50, ar.x + ar.w / 2, ar.x + ar.w - 50];
  b.face = Math.sign(dx) || b.face;
  if (b.state === "idle" || b.state === "aim") {
    if (b.state === "idle") {
      b.state = "aim";
      b.t = 0.7;
      b.animT = 0;
    } else if (b.t <= 0) {
      for (const off of [-30, 0, 30]) shoot(G, "darrow", b.x + b.face * 10, b.y - 34, p.x + off, p.y - 26, 300 * spd, 2.4);
      G.sfx("bow");
      b.state = "rest";
      b.t = 0.9;
      b.cycle++;
    }
  } else if (b.state === "rest") {
    if (b.t <= 0) {
      b.state = "vanish";
      b.t = 0.45;
      G.fx("FX_B", "poof", b.x, b.y, 0.4, 60);
    }
  } else if (b.state === "vanish") {
    if (b.t <= 0) {
      b.x = spots[(b.cycle + Math.floor(G.rand() * 2)) % 3];
      b.state = "idle";
      G.fx("FX_B", "poof", b.x, b.y, 0.4, 60);
    }
  }
  const ls = G.s.lastShot;
  if (ls && ls.t > (b.echoT || 0) && G.s.time - ls.t > 0.8 && b.state !== "vanish") {
    b.echoT = ls.t;
    G.s.shots.push({ id: G.uid("s"), kind: "darrow", x: b.x, y: b.y - 34, vx: ls.x * 320 * spd, vy: ls.y * 320 * spd, life: 2 });
  }
  b.vy = Math.min(b.vy + 1500 * dt, 800);
  moveBody(b, 0, b.vy * dt, []);
}

// Penjaga Mahkota: an aerial guardian that grows fiercer as it weakens and
// calls star wisps once at half health.
function updateFinal(G, b, dt, dx, ar) {
  const frac = b.hp / b.max;
  const scaled = { ...G, tw: { ...G.tw, enemySpeed: G.tw.enemySpeed * (frac < 0.35 ? 1.35 : frac < 0.7 ? 1.15 : 1) } };
  updateEagle(scaled, b, dt, dx, ar);
  if (b.state === "volley" && b.t <= dt && frac < 0.7) {
    const p = G.s.player;
    for (const off of [-120, 120]) shoot(G, "orb", b.x, b.y - b.h / 2, p.x + off, p.y - 20, 220, 3);
  }
  if (frac < 0.5 && !b.summoned) {
    b.summoned = true;
    G.banner("Penjaga memanggil roh bintang!", 2);
    for (const ox of [-140, 140]) {
      const e = makeEnemy(G, "starWisp", b.x + ox, b.y - 40, G.uid("e"));
      e.hx = e.x;
      e.hy = e.y;
      G.s.enemies.push(e);
    }
  }
}
