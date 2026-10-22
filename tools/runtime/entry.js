import {createGame} from './game/game.js';
import {element} from './adapters.js';
import {AREA_NAMES,SKINS,ARROW_COLOR,ARROW_NAME} from './game/constants.js';
import {tiles,defs} from './game/world.js';
import {objective} from './game/story.js';

const b=globalThis.__bridge={width:960,height:540,commands:[],sounds:[],track:-1,settings:{},pendingSave:null};
const props={fillStyle:'#000000',strokeStyle:'#000000',lineWidth:1,globalAlpha:1,globalCompositeOperation:'source-over',lineCap:'butt',lineJoin:'miter',lineDashOffset:0,font:'10px sans-serif',textAlign:'start',textBaseline:'alphabetic'};
const states=[];
const methods={
  measureText(t){const size=Number((props.font.match(/([\d.]+)px/)||[])[1]||10);return {width:Array.from(String(t)).reduce((n,c)=>n+(b.metrics?.[c]??0.56)*size,0)};},
  createPattern(im,repeat){return {kind:'pattern',image:im.key,repeat,matrix:[1,0,0,1,0,0],setTransform(m){this.matrix=m.values;}};},
  createLinearGradient(...args){return {kind:'linear',args,stops:[],addColorStop(p,c){this.stops.push([p,c]);}};},
  createRadialGradient(...args){return {kind:'radial',args,stops:[],addColorStop(p,c){this.stops.push([p,c]);}};},
  drawImage(im,...args){b.commands.push(['drawImage',im.key,...args]);},
  save(){states.push({...props});b.commands.push(['save']);},
  restore(){if(states.length)Object.assign(props,states.pop());b.commands.push(['restore']);},
};
for(const name of ['setTransform','translate','rotate','scale','beginPath','closePath','moveTo','lineTo','quadraticCurveTo','bezierCurveTo','rect','arc','arcTo','ellipse','fill','stroke','clip','fillRect','strokeRect','clearRect','fillText','strokeText','setLineDash']) methods[name]=(...args)=>b.commands.push([name,...args]);
b.context=new Proxy(methods,{get(t,k){return k in t?t[k]:props[k];},set(t,k,v){if(props[k]===v)return true;props[k]=v;if(!k.startsWith('imageSmoothing'))b.commands.push(['=',k,v]);return true;}});
globalThis.__skyWindow={devicePixelRatio:1};
globalThis.__skyDocument={hidden:false,createElement:element};
globalThis.__skyResizeObserver=class{constructor(cb){b.resize=cb;}observe(){}disconnect(){}};
globalThis.__skyDOMMatrix=class{constructor(v){this.values=v;}};
globalThis.__skyMatchMedia=()=>({matches:true});
let game;
globalThis.skyboundInit=(config)=>{
  b.width=config.width;b.height=config.height;b.metrics=config.metrics;
  const store={img:{},frames:{},anims:{},version:1,has(k){return !!this.img[k];},load(keys){for(const k of keys) b.required.add(k);return Promise.resolve();},prefetch(keys){for(const k of keys)b.required.add(k);}};
  b.required=new Set();
  for(const [k,v] of Object.entries(config.catalog)) {
    store.img[k]={key:k,width:v.width,height:v.height};
    // Frames crop to their measured art box: the sidecars carry the real bounds,
    // so padding the crop out to the grid cell would clip whatever spills past it.
    if(v.frames){const frames=Object.fromEntries(v.frames.map(f=>[f.name,f]));store.frames[k]=frames;store.anims[k]=Object.fromEntries(v.animations.map(a=>[a.name,a.frames.map(f=>frames[f.name]??f)]));}
  }
  b.spriteStore=store;
  const sdk={gameState:{save(v){b.pendingSave=v;return Promise.resolve();},clear(){b.pendingSave={clear:true};return Promise.resolve();}},device:{haptics:{isSupported:()=>true,vibrate(){b.haptic=true;}}}};
  game=createGame({mount:element(),sdk,tweaks:{get:k=>config.tweaks[k]?.value??config.tweaks[k]},saved:config.saved});
  game.hooks.init(game.state);
  game.setRun({restart:()=>game.hooks.init(game.state),frozen:false});
  return true;
};
function hudState(){
  const s=game.state,p=s.player,pr=s.pr,u=s.ui,info=b.info||{},boss=u.boss?s.bosses[u.boss]:null;
  return {hp:p.hp,maxHp:p.maxHp,energy:p.energy,focus:p.focus,focusMax:p.focusMax,arrow:p.arrowType,arrowName:ARROW_NAME[p.arrowType],arrowColor:ARROW_COLOR[p.arrowType],area:s.area,areaName:AREA_NAMES[s.area],banner:u.banner?.text??'',toast:u.toast?.text??'',dialog:u.dialog,menu:u.menu,boss:boss?{name:info.bossName,hp:boss.hp,max:boss.max}:null,interact:info.interact?.label??'',skin:pr.skin,settings:pr.settings,slowmo:s.slowmo,seeds:pr.seeds,feathers:pr.feathers||0,seedTotal:info.seedTotal,featherTotal:info.featherTotal,time:pr.time,hintTier:u.hintTier,hints:objective(pr,s.area),skins:SKINS,areas:AREA_NAMES,travel:defs.filter(d=>d.type==='nest'&&pr.nests[d.id]&&d.id!==u.travelFrom).map(d=>({id:d.id,name:AREA_NAMES[d.area]})),map:u.menu==='pause'?{explored:pr.explored,player:{x:p.x,y:p.y},cps:pr.cps,nests:pr.nests,gates:pr.gates}:null};
}
globalThis.skyboundFrame=(input,dt,width,height)=>{
  if(width!==b.width||height!==b.height){b.width=width;b.height=height;b.resize?.();}
  const i=b.input;
  i.keys=input.keys||{};i.stickX=input.stickX||0;i.stickY=input.stickY||0;i.jumpHeld=!!input.jumpHeld;
  i.touchUsed=input.touch!==false;
  if(input.aim)Object.assign(i.aim,input.aim);
  for(const flag of input.pressed||[])i[flag]=true;
  i.actions.push(...input.actions||[]);
  if(input.restart){b.hud.el.root.querySelector('.restart-btn').dispatch('click');b.hud.el.root.querySelector('.restart-btn').dispatch('click');}
  b.commands=Object.entries(props).map(([k,v])=>['=',k,v]);b.sounds=[];
  // Fixed maximum substep keeps fast dashes and projectile collision stable.
  let left=Math.min(Math.max(dt,0),0.1);
  if(left===0)game.hooks.update(game.state,0);
  while(left>0){const step=Math.min(left,1/60);game.hooks.update(game.state,step);left-=step;}
  game.hooks.render(game.state);
  // Requests are handed over once; the Dart side keeps its own load queue.
  const out={commands:b.commands,hud:hudState(),required:[...b.required],sounds:b.sounds,track:b.track,audioPaused:b.audioPaused,save:b.pendingSave,haptic:b.haptic};
  b.required.clear();
  b.pendingSave=null;b.haptic=false;return JSON.stringify(out);
};
globalThis.skyboundSnapshot=()=>JSON.stringify({version:1,pr:game.state.pr,maxHp:game.state.player.maxHp,focusMax:game.state.player.focusMax});
globalThis.skyboundWorld=()=>JSON.stringify({tiles:Array.from(tiles),defs:defs.filter(d=>['checkpoint','nest','gate'].includes(d.type)),areas:AREA_NAMES});
// Used only by the deterministic source-parity tests, not by the game UI.
globalThis.skyboundDebug={get game(){return game;},get input(){return b.input;}};
