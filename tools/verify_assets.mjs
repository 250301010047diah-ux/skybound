import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {measureFrames, MEASURED} from './frame_measure.mjs';
const root=path.resolve(import.meta.dirname,'..');
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const catalog=await read('assets/json/catalog.json'),manifest=await read('game js/assets.json');
assert.deepEqual(Object.keys(catalog),Object.keys(manifest));
for(const [key,v] of Object.entries(catalog)){
  const data=await fs.readFile(path.join(root,'assets/images',v.file));
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'),v.sha256,key);
  assert.equal(data.toString('ascii',0,4),'RIFF',key);
  assert.equal(data.toString('ascii',8,12),'WEBP',key);
  if(v.sidecar){const frames=await read('assets/json/'+v.sidecar);const names=new Set(frames.frames.map(f=>f.name));for(const a of frames.animations)for(const f of a.frames)assert(names.has(f.name),`${key}/${a.name}/${f.name}`);
    // Creature frames must still bound their own art: a stale box clips claws,
    // wings and leaping poses in game.
    if(MEASURED.test(key)){
      const {data:pixels,info}=await sharp(path.join(root,'assets/images',v.file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      const fresh=frames.frames.map(f=>({name:f.name,source:f.source}));
      measureFrames(pixels,info.width,info.height,info.channels,fresh);
      for(const f of fresh){
        const stored=frames.frames.find(d=>d.name===f.name);
        assert.deepEqual(stored.content,f.content,`${key}/${f.name} content box`);
        assert.deepEqual(stored.anchor,f.anchor,`${key}/${f.name} anchor`);
      }
    }}
}
const audio=await read('assets/audio/manifest.json');
assert.equal(Object.keys(audio.music).length,5);
for(const name of [...Object.keys(audio.music),...Object.keys(audio.effects)]) await fs.access(path.join(root,'assets/audio',name+'.mp3'));
for(const file of await fs.readdir(path.join(root,'game js/game'))) {
  if(!file.endsWith('.js'))continue;
  const source=await fs.readFile(path.join(root,'game js/game',file),'utf8');
  for(const match of source.matchAll(/G\.sfx\("([^" ]+)"\)/g)) assert(audio.effects[match[1]],'Unregistered effect: '+match[1]);
}
console.log('PASS: image checksums, measured creature frame boxes, frame references, 5 BGM and all registered MP3 effects (empty placeholders allowed).');
