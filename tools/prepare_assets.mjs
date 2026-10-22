// Run from the project root: node tools/prepare_assets.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {measureFrames, MEASURED} from './frame_measure.mjs';
const root = path.resolve(import.meta.dirname, '..');
const read = async p => JSON.parse(await fs.readFile(path.join(root, p), 'utf8'));
const manifest = await read('game js/assets.json');
const links = await read('dummy/link.json');
const base = new URL(Object.values(links).find(v => v.startsWith('https://'))).origin;
for (const dir of ['images', 'json', 'runtime', 'audio']) await fs.mkdir(path.join(root, 'assets', dir), {recursive:true});
const catalog = {};
const entries = Object.entries(manifest);
let cursor = 0;
async function processAsset([key, entry]) {
  const file = path.basename(entry.src);
  const target = path.join(root, 'assets/images', file);
  try { await fs.access(target); } catch {
    await fs.rename(path.join(root, 'dummy/dummy', file), target);
  }
  const meta = await sharp(target).metadata();
  const record = {file, width:meta.width, height:meta.height};
  if (!/^(BG|TEX)_/.test(key)) {
    const jsonFile = file.replace(/\.webp$/, '.frames.json');
    const dest = path.join(root, 'assets/json', jsonFile);
    let data;
    try { data = JSON.parse(await fs.readFile(dest, 'utf8')); } catch {
      const url = base + entry.src.replace(/\.webp$/, '.frames.json');
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status}: ${url}`);
      data = await response.json();
    }
    if (!Array.isArray(data.frames)) throw new Error(`Invalid frame data: ${key}`);
    data.animations ??= [];
    if (MEASURED.test(key)) {
      const {data:pixels, info} = await sharp(target).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      measureFrames(pixels, info.width, info.height, info.channels, data.frames);
      for (const a of data.animations) a.frames = a.frames.map(f => data.frames.find(d => d.name === f.name) ?? f);
    }
    if(key==='PROPS_B') for(const [name,r] of Object.entries({arrow_sprout:{x:432,y:1328,w:342,h:104},arrow_thread:{x:808,y:1328,w:356,h:190}})) {
      const f=data.frames.find(f=>f.name===name);if(f) {f.content=r;f.anchor={x:r.x+r.w/2,y:r.y+r.h};}
    }
    await fs.writeFile(dest,JSON.stringify(data,null,2)+'\n');
    record.sidecar=jsonFile;
  }
  record.sha256=crypto.createHash('sha256').update(await fs.readFile(target)).digest('hex');
  catalog[key]=record;
}
await Promise.all(Array.from({length:6},async()=>{while(cursor<entries.length) await processAsset(entries[cursor++]);}));
const sorted=Object.fromEntries(entries.map(([k])=>[k,catalog[k]]));
await fs.writeFile(path.join(root,'assets/json/catalog.json'),JSON.stringify(sorted,null,2)+'\n');
for(const file of ['assets.json','tweaks.json','data.json']) await fs.copyFile(path.join(root,'game js',file),path.join(root,'assets/json',file));
console.log(`Prepared ${entries.length} original images and ${Object.values(catalog).filter(v=>v.sidecar).length} animation sidecars.`);
