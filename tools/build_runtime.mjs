import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
const root=path.resolve(import.meta.dirname,'..');
const stage=path.join(root,'.dart_tool/skybound_source');
await fs.mkdir(path.join(stage,'game'),{recursive:true});
for(const file of await fs.readdir(path.join(root,'game js/game'))) {
  if(!file.endsWith('.js'))continue;
  let src=await fs.readFile(path.join(root,'game js/game',file),'utf8');
  if(file==='sprites.js') {
    const start=src.indexOf('export function createSpriteStore');
    const end=src.indexOf('// Draw a frame anchored',start);
    src=src.slice(0,start)+`export function createSpriteStore() { return globalThis.__bridge.spriteStore; }\n\n`+src.slice(end);
  }
  if(file==='game.js') {
    src=src.replace('from "./hud.js"','from "../adapters.js"').replace('from "./input.js"','from "../adapters.js"').replace('from "./audio.js"','from "../adapters.js"');
  }
  await fs.writeFile(path.join(stage,'game',file),src);
}
await fs.copyFile(path.join(root,'game js/assets.json'),path.join(stage,'assets.json'));
for(const file of ['adapters.js','entry.js']) await fs.copyFile(path.join(root,'tools/runtime',file),path.join(stage,file));
await fs.mkdir(path.join(root,'assets/runtime'),{recursive:true});
await build({entryPoints:[path.join(stage,'entry.js')],bundle:true,format:'iife',target:'es2020',outfile:path.join(root,'assets/runtime/skybound.js'),legalComments:'none',define:{window:'globalThis.__skyWindow',document:'globalThis.__skyDocument',ResizeObserver:'globalThis.__skyResizeObserver',DOMMatrix:'globalThis.__skyDOMMatrix',matchMedia:'globalThis.__skyMatchMedia'}});
console.log('Bundled original game systems for Flame.');
