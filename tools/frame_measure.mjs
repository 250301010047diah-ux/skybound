// Measures the real art box of every frame on a sprite sheet.
//
// The generated sheets place each creature inside a grid cell, but the art is
// often painted larger than the cell: a crab claw or a boss wing spills into
// the gutter. Cropping to the sidecar's own `content` rect (or to the grid
// cell) chops that art off. Measuring with a fixed margin instead drags in the
// neighbour's pixels, which is why the first pass skipped these sheets.
//
// So the cut lines come from the picture: between two neighbouring cells the
// quietest column (or row) of pixels is the seam. Every pixel on the sheet then
// belongs to exactly one frame, and each frame's box is the alpha bounds inside
// its own tile — whole art, no neighbours.
const ALPHA = 60;

// The quietest line between two cell centres, preferring the middle of the
// widest fully transparent run when the sprites do not touch.
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

// Cut lines for one axis: 0, one seam per cell boundary, then the sheet edge.
function cuts(profile, starts, size, limit) {
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

/**
 * Rewrites `content` and `anchor` on every frame that has a `source` rect.
 * `pixels` is RGBA, row-major, `channels` wide per pixel.
 */
export function measureFrames(pixels, width, height, channels, frames) {
  const list = frames.filter((f) => f.source);
  if (!list.length) return 0;
  const cols = [...new Set(list.map((f) => f.source.x))].sort((a, b) => a - b);
  const rows = [...new Set(list.map((f) => f.source.y))].sort((a, b) => a - b);
  const cellW = list[0].source.w;
  const cellH = list[0].source.h;
  const colProfile = new Int32Array(width);
  const rowProfile = new Int32Array(height);
  const solid = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * channels + 3] <= ALPHA) continue;
      solid[y * width + x] = 1;
      colProfile[x]++;
      rowProfile[y]++;
    }
  }
  const xCuts = cuts(colProfile, cols, cellW, width);
  const yCuts = cuts(rowProfile, rows, cellH, height);
  let fixed = 0;
  const empty = [];
  for (const f of list) {
    const ci = cols.indexOf(f.source.x);
    const ri = rows.indexOf(f.source.y);
    const x0 = xCuts[ci];
    const x1 = xCuts[ci + 1];
    const y0 = yCuts[ri];
    const y1 = yCuts[ri + 1];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -1;
    let maxY = -1;
    for (let y = y0; y < y1; y++) {
      const row = y * width;
      for (let x = x0; x < x1; x++) {
        if (!solid[row + x]) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) {
      empty.push(f);
      continue;
    }
    f.content = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    f.anchor = { x: minX + (maxX - minX) / 2, y: maxY + 1 };
    fixed++;
  }
  // A couple of sheets were generated with the last cell of a row left blank.
  // Such a frame holds its row's nearest painted pose instead of showing the
  // bare grid cell, which would drag in a neighbour's edge.
  for (const f of empty) {
    let best = null;
    let near = Infinity;
    for (const o of list) {
      if (o === f || o.source.y !== f.source.y || !o.content) continue;
      const d = Math.abs(o.source.x - f.source.x);
      if (d >= near) continue;
      near = d;
      best = o;
    }
    if (!best) continue;
    f.content = { ...best.content };
    f.anchor = { ...best.anchor };
    fixed++;
  }
  return fixed;
}



// Enemy and boss cells (every area) plus the repainted sheets the first pass
// already measured. Player skins, props and the shared FX sheets keep the
// slicing they shipped with.
export const MEASURED = /^(ENEMIES_A\d+|BOSS_[A-Z]+|NPCS_[BC]|GATES_[BC]|FX_C)$/;
