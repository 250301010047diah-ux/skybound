// Tile collision for feet-centred bodies { x, y (feet), w, h, vx, vy }.
// Solid tiles block on both axes; one-way tiles and dynamic platforms
// (sprouts, lifts, rafts, leaves, gate steps) only catch a body falling onto
// their top surface.
import { T } from "./constants.js";
import { isSolid, tileAt, isOneWayTile } from "./world.js";

const EPS = 0.01;

export function overlapsSolid(x, y, w, h) {
  const x0 = Math.floor((x - w / 2) / T);
  const x1 = Math.floor((x + w / 2 - EPS) / T);
  const y0 = Math.floor((y - h) / T);
  const y1 = Math.floor((y - EPS) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isSolid(tx, ty)) return true;
  return false;
}

export function touchesTile(x, y, w, h, code) {
  const x0 = Math.floor((x - w / 2) / T);
  const x1 = Math.floor((x + w / 2 - EPS) / T);
  const y0 = Math.floor((y - h) / T);
  const y1 = Math.floor((y - EPS) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tileAt(tx, ty) === code) return true;
  return false;
}

// Moves the body by (dx, dy). Returns { ground, ceiling, wallL, wallR, plat }.
// plats: [{ id, x, w, top }] one-way surfaces; dropThrough ignores them.
export function moveBody(b, dx, dy, plats = [], dropThrough = false) {
  const res = { ground: false, ceiling: false, wallL: false, wallR: false, plat: null };
  // Horizontal, in steps no longer than half a tile so fast dashes never tunnel.
  const stepsX = Math.max(1, Math.ceil(Math.abs(dx) / (T / 2)));
  for (let i = 0; i < stepsX; i++) {
    const nx = b.x + dx / stepsX;
    if (overlapsSolid(nx, b.y, b.w, b.h)) {
      if (dx > 0) {
        const edge = Math.floor((nx + b.w / 2 - EPS) / T) * T;
        b.x = edge - b.w / 2 - EPS;
        res.wallR = true;
      } else {
        const edge = (Math.floor((nx - b.w / 2) / T) + 1) * T;
        b.x = edge + b.w / 2 + EPS;
        res.wallL = true;
      }
      b.vx = 0;
      break;
    }
    b.x = nx;
  }
  // Vertical.
  const prevBottom = b.y;
  const stepsY = Math.max(1, Math.ceil(Math.abs(dy) / (T / 2)));
  for (let i = 0; i < stepsY; i++) {
    const ny = b.y + dy / stepsY;
    if (dy > 0) {
      if (overlapsSolid(b.x, ny, b.w, b.h)) {
        b.y = Math.floor((ny - EPS) / T) * T;
        b.vy = 0;
        res.ground = true;
        break;
      }
      if (!dropThrough) {
        // One-way tiles: land if our feet crossed the tile's top this step.
        const row = Math.floor((ny - EPS) / T);
        const surf = row * T;
        if (prevBottom <= surf + 1 && ny >= surf) {
          const x0 = Math.floor((b.x - b.w / 2) / T);
          const x1 = Math.floor((b.x + b.w / 2 - EPS) / T);
          let hit = false;
          for (let tx = x0; tx <= x1; tx++) if (isOneWayTile(tileAt(tx, row))) hit = true;
          if (hit) {
            b.y = surf;
            b.vy = 0;
            res.ground = true;
            break;
          }
        }
        let landed = null;
        for (const p of plats) {
          if (b.x + b.w / 2 <= p.x || b.x - b.w / 2 >= p.x + p.w) continue;
          if (prevBottom <= p.top + 2 && ny >= p.top) {
            if (!landed || p.top < landed.top) landed = p;
          }
        }
        if (landed) {
          b.y = landed.top;
          b.vy = 0;
          res.ground = true;
          res.plat = landed.id;
          break;
        }
      }
      b.y = ny;
    } else {
      if (overlapsSolid(b.x, ny, b.w, b.h)) {
        b.y = (Math.floor((ny - b.h) / T) + 1) * T + b.h + EPS;
        b.vy = 0;
        res.ceiling = true;
        break;
      }
      b.y = ny;
    }
  }
  return res;
}

// Is the body standing on something right now (without moving it)?
export function groundProbe(b, plats = []) {
  if (overlapsSolid(b.x, b.y + 1, b.w, b.h)) return { ground: true, plat: null };
  const row = Math.floor((b.y + 0.5) / T);
  if (Math.abs(b.y - row * T) < 1.5) {
    const x0 = Math.floor((b.x - b.w / 2) / T);
    const x1 = Math.floor((b.x + b.w / 2 - EPS) / T);
    for (let tx = x0; tx <= x1; tx++) if (isOneWayTile(tileAt(tx, row))) return { ground: true, plat: null };
  }
  for (const p of plats) {
    if (b.x + b.w / 2 <= p.x || b.x - b.w / 2 >= p.x + p.w) continue;
    if (Math.abs(b.y - p.top) < 2) return { ground: true, plat: p.id };
  }
  return { ground: false, plat: null };
}
