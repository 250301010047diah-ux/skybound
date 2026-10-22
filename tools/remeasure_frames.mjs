// Re-measures the frame boxes of the enemy and boss sheets in place:
//   node tools/remeasure_frames.mjs
// Only assets/json/*.frames.json changes; the images are untouched, so the
// checksums in catalog.json stay valid.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { measureFrames, MEASURED } from './frame_measure.mjs';

const root = path.resolve(import.meta.dirname, '..');
const catalog = JSON.parse(await fs.readFile(path.join(root, 'assets/json/catalog.json'), 'utf8'));
let sheets = 0;
let frames = 0;
for (const [key, entry] of Object.entries(catalog)) {
  if (!entry.sidecar || !MEASURED.test(key)) continue;
  const dest = path.join(root, 'assets/json', entry.sidecar);
  const data = JSON.parse(await fs.readFile(dest, 'utf8'));
  const { data: pixels, info } = await sharp(path.join(root, 'assets/images', entry.file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const n = measureFrames(pixels, info.width, info.height, info.channels, data.frames);
  data.animations ??= [];
  for (const a of data.animations) a.frames = a.frames.map((f) => data.frames.find((d) => d.name === f.name) ?? f);
  await fs.writeFile(dest, JSON.stringify(data, null, 2) + '\n');
  sheets++;
  frames += n;
  console.log(`${key}: ${n} frames`);
}
console.log(`Re-measured ${frames} frames on ${sheets} sheets.`);
