// Aera's movement: run, variable jump, dash, ledge grab and climb, vines,
// rope swing (Panah Benang), swimming, plus hurt / death / respawn states.
import { T, TILE, PLAYER_W, PLAYER_H } from "./constants.js";
import { isSolid, tileAt, isOneWayTile } from "./world.js";
import { moveBody, groundProbe, touchesTile, overlapsSolid } from "./physics.js";

const approach = (v, t, d) => (v < t ? Math.min(t, v + d) : Math.max(t, v - d));

export function newPlayer(x, y, maxHp, focusMax) {
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
    safeT: 0,
  };
}

function vineAt(x, y) {
  return tileAt(Math.floor(x / T), Math.floor(y / T)) === TILE.VINE;
}

export function updatePlayer(G, dt) {
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
  const movingSound = p.mode === "normal" && p.onGround && Math.abs(p.vx) > 35 && ax !== 0 ? "step"
    : p.mode === "vine" && ay !== 0 ? "climb"
    : p.mode === "swim" && (ax !== 0 || ay !== 0) ? "water" : null;
  if (movingSound && p.soundT <= 0) { G.sfx(movingSound); p.soundT = movingSound === "water" ? 0.65 : 0.32; }
  if (jumpPressed) p.jumpBuf = 0.13;

  // Ride whatever platform we stood on last frame.
  if (p.plat) {
    const pl = G.plats.find((q) => q.id === p.plat);
    if (pl && p.mode === "normal") {
      const ny = p.y + (pl.top - pl.prevTop);
      const nx = p.x + (pl.prevX !== undefined ? pl.x - pl.prevX : 0);
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
      const r = moveBody(p, p.vx * dt, 0, G.plats);
      if (r.wallL || r.wallR) p.modeT = 0;
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
      } else if (ay > 0 || (ax !== 0 && Math.sign(ax) === -L.dir)) {
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
        // Top of the vine: pop up so the player can step onto the ledge.
        setMode(p, "normal");
        p.vy = -330;
        return;
      }
      const r = moveBody(p, 0, p.vy * dt, G.plats);
      if (p.vy === 0) p.animT -= dt; // hold the climb pose while still
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
      if (r.ground && ay > 0) setMode(p, "normal");
      if (!vineAt(p.x, p.y - p.h / 2)) setMode(p, "normal");
      return;
    }
    case "rope": {
      const R = p.rope;
      const g = 1500;
      R.angV += (-(g / R.len) * Math.sin(R.ang) + ax * 4.2) * dt;
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
      const target = ay !== 0 ? ay * 125 : -40;
      p.vy = approach(p.vy, target, 500 * dt);
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

  // ---------------------------------------------------------------- normal
  const speed = run * (p.carry ? 0.85 : 1);
  let target = ax * speed;
  if (p.aiming && p.onGround) target = 0;
  p.vx = approach(p.vx, target, (p.onGround ? 1900 : 1200) * dt);
  if (ax !== 0 && !p.aiming) {
    const nf = Math.sign(ax);
    if (nf !== p.face && p.onGround && Math.abs(p.vx) > 80) p.turnT = 0.16;
    p.face = nf;
  }

  // Jump (down + jump drops through one-way platforms). One extra jump in the
  // air is allowed until the player lands or grabs a ledge or vine.
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

  // Dash.
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

  // Ledge grab: falling against a wall whose top is near our head.
  if (!p.onGround && p.vy > -60 && p.ledgeCd <= 0 && !p.aiming) {
    const pushing = ax !== 0 && Math.sign(ax) === p.face;
    if (pushing || r.wallL || r.wallR) tryLedge(G, p);
  }
  // Vines.
  if (p.mode === "normal" && ay < 0 && vineAt(p.x, p.y - p.h / 2) && !p.aiming) {
    setMode(p, "vine");
    p.x = Math.floor(p.x / T) * T + T / 2;
    p.vx = 0;
    p.plat = null;
  } else if (p.mode === "normal" && ay > 0 && !p.onGround && vineAt(p.x, p.y - p.h / 2)) {
    setMode(p, "vine");
    p.x = Math.floor(p.x / T) * T + T / 2;
  }
  // Water.
  if (p.mode === "normal" && G.waterSurfaceAt(p.x, p.y - p.h * 0.4) !== null) {
    setMode(p, "swim");
    G.splash(p.x, G.waterSurfaceAt(p.x, p.y - p.h * 0.4));
    p.vy *= 0.3;
  }
  hazards(G);

  // Remember safe ground (for thorn falls).
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

export function attachRope(G, ax, ay) {
  const p = G.s.player;
  const hx = p.x;
  const hy = p.y - p.h - 6;
  const dx = hx - ax;
  const dy = hy - ay;
  const len = Math.max(50, Math.hypot(dx, dy));
  const ang = Math.atan2(dx, dy);
  // Carry over the current velocity as angular velocity.
  const angV = (p.vx * Math.cos(ang) - p.vy * Math.sin(ang)) / len;
  p.rope = { ax, ay, len, ang, angV };
  setMode(p, "rope");
  p.plat = null;
  p.onGround = false;
}
