import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const json=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const catalog=await json('assets/json/catalog.json');
assert.equal(Object.keys(catalog).length,127);
for(const v of Object.values(catalog)) if(v.sidecar)Object.assign(v,await json('assets/json/'+v.sidecar));
const context=vm.createContext({console});
vm.runInContext(await fs.readFile(path.join(root,'assets/runtime/skybound.js'),'utf8'),context);
context.skyboundInit({catalog,tweaks:await json('assets/json/tweaks.json'),width:960,height:540});
await new Promise(resolve=>setImmediate(resolve));
const frame=(input={},dt=1/60,w=960,h=540)=>JSON.parse(context.skyboundFrame(input,dt,w,h));
const s=context.skyboundDebug.game.state;
for(let i=0;i<60;i++)frame();
assert.equal(s.player.onGround,true,'Player stands on original world floor');
const x=s.player.x;
for(let i=0;i<20;i++)frame({keys:{right:true}});
assert(s.player.x>x+40,'Movement input reaches original player controller');
const y=s.player.y;
assert(frame({jumpHeld:true,pressed:['jumpPressed']}).sounds.includes('jump'));
for(let i=0;i<8;i++)frame({jumpHeld:true});
assert(s.player.y<y-20,'Jump uses original physics');
frame({pressed:['pausePressed']});
const paused={x:s.player.x,y:s.player.y,time:s.pr.time};
for(let i=0;i<60;i++)frame({keys:{right:true}});
assert.equal(s.pr.time,paused.time,'Pause freezes gameplay');
assert.equal(s.player.x,paused.x);
frame({actions:[{type:'resume'}]});
assert.equal(s.ui.menu,null);
for(let area=0;area<13;area++){
  context.skyboundDebug.game.warpToArea(area);
  for(let i=0;i<15;i++)frame();
  const f=frame();assert.equal(f.hud.area,area);assert.equal(f.track,s.ui.boss?4:area<4?1:area<9?2:3);assert(f.commands.length>100);
  for(const c of f.commands){if(c[0]==='drawImage')assert(catalog[c[1]],`Missing image ${c[1]}`);for(const n of c)if(typeof n==='number')assert(Number.isFinite(n));}
}
assert.equal(frame({actions:[{type:'skin',id:'rimba'}]}).hud.skin,'aera','locked skin without coins');
context.skyboundDebug.game.state.pr.coins=1000;
for(const id of ['aera','rimba','salju','senja','bara','samudra','sakura','bintang','mentari','peri','bayangan']){
  const f=frame({actions:[{type:'skin',id}]});assert.equal(f.hud.skin,id);
}
// Every operation the renderer emits must be one the Flutter canvas replays;
// the arrow effects are the newest source of exotic ones.
const CANVAS_OPS=new Set(['=','save','restore','setTransform','translate','scale','rotate','beginPath','closePath','moveTo','lineTo','quadraticCurveTo','bezierCurveTo','rect','arc','ellipse','arcTo','clip','fill','stroke','fillRect','strokeRect','clearRect','setLineDash','drawImage','fillText','strokeText']);
const checkFrame=(f,label)=>{
  for(const c of f.commands){
    assert(CANVAS_OPS.has(c[0]),`${label}: unsupported canvas op ${c[0]}`);
    for(const n of c)if(typeof n==='number')assert(Number.isFinite(n),`${label}: ${c[0]} got ${n}`);
  }
  return f;
};
// Six arrow types, each with its own flight effect and impact flourish.
context.skyboundDebug.game.warpToArea(0);
for(let i=0;i<90&&s.player.mode!=='normal';i++)frame();
assert.equal(s.player.mode,'normal','Aera is back on her feet before drawing the bow');
Object.assign(s.pr.abilities,{sprout:true,thread:true,echo:true,wind:true,ember:true});
for(const type of ['normal','sprout','thread','echo','wind','ember']){
  s.player.arrowType=type;s.player.energy=100;
  checkFrame(frame({aim:{active:true,source:'button',dx:40,dy:-10}}),`aiming ${type}`);
  for(let i=0;i<4;i++)checkFrame(frame({aim:{active:true,source:'button',dx:40,dy:-10}}),`drawing ${type}`);
  frame({aim:{active:false},pressed:['fireReleased']});
  const shot=s.arrows.at(-1);
  assert.equal(shot.type,type,`${type} arrow leaves the bow`);
  assert(s.release&&s.release.type===type,`${type} loose flashes at the bow`);
  for(let i=0;i<10;i++)checkFrame(frame(),`${type} in flight`);
  assert(shot.trail.length>1,`${type} arrow keeps a flight trail`);
  assert(shot.trail.length<=15,`${type} trail stays bounded`);
}
// Panah Benang in use: the swing renders its silk line.
s.player.rope={ax:s.player.x-40,ay:s.player.y-140,len:120,ang:0.3,angV:1.4};
s.player.mode='rope';
checkFrame(frame({keys:{right:true}}),'rope swing');
assert.equal(s.player.mode,'rope');
s.player.rope=null;s.player.mode='normal';
const portrait=checkFrame(frame({},1/60,390,844),'portrait');assert(portrait.commands.length>100);
const saved=JSON.parse(context.skyboundSnapshot());assert.equal(saved.version,1);
frame({restart:true});await new Promise(resolve=>setImmediate(resolve));frame();
assert.equal(s.pr.skin,'aera');assert.equal(s.pr.seeds,0);
await fs.mkdir(path.join(root,'test/fixtures'),{recursive:true});
await fs.writeFile(path.join(root,'test/fixtures/first_frame.json'),JSON.stringify(frame()));
console.log('PASS: 127 images / 101 sidecars; original movement, jump, pause, all 13 area renderers, 11 skins, six arrow effects, rope swing, portrait, save and restart.');
