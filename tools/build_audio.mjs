// Create empty placeholders only; never overwrite manually supplied audio.
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const dir=path.join(root,'assets/audio');
const manifest=JSON.parse(await fs.readFile(path.join(dir,'manifest.json'),'utf8'));
for(const name of [...Object.keys(manifest.music),...Object.keys(manifest.effects)]) {
  try { await fs.writeFile(path.join(dir,name+'.mp3'),Buffer.alloc(0),{flag:'wx'}); }
  catch(e) { if(e.code!=='EEXIST') throw e; }
}
console.log('Audio placeholders ready (existing files preserved).');
