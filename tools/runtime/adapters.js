// Platform boundaries only. Movement, combat, puzzles, story and renderer
// remain the original source modules, bundled by build_runtime.mjs.
export function createInput() {
  const i={keys:{},stickX:0,stickY:0,jumpHeld:false,aim:{active:false,source:null,dx:0,dy:0,mx:0,my:0},actions:[],touchUsed:true};
  i.axisX=()=>((i.keys.right?1:0)-(i.keys.left?1:0))||i.stickX;
  i.axisY=()=>((i.keys.down?1:0)-(i.keys.up?1:0))||i.stickY;
  i.consume=()=>{for(const k of ['jumpPressed','dashPressed','interactPressed','cyclePressed','pausePressed','advancePressed','fireReleased'])i[k]=false;};
  i.destroy=()=>{};i.consume();globalThis.__bridge.input=i;return i;
}
export function createAudio() {
  const b=globalThis.__bridge;
  return {init(){},unlock(){},destroy(){},play(name){if(!b.sounds.includes(name))b.sounds.push(name);},setTrack(i){b.track=i;},setPaused(v){b.audioPaused=v;},setLocal(v){b.settings=v;}};
}
export function element() {
  const cache={}, events={},classes=new Set();
  return {style:{setProperty(){}},dataset:{},textContent:'',innerHTML:'',children:[],hidden:false,
    classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle(k,v){if(v)classes.add(k);else classes.delete(k);}},
    querySelector(s){return cache[s]??=element();},querySelectorAll(){return [];},
    addEventListener(k,f){events[k]=f;},removeEventListener(){},
    dispatch(k){events[k]?.({currentTarget:this,preventDefault(){}});},
    appendChild(e){this.children.push(e);},replaceChildren(){this.children=[];},
    getBoundingClientRect(){const b=globalThis.__bridge;return {left:0,top:0,width:b.width,height:b.height,right:b.width,bottom:b.height};},
    getContext(){return globalThis.__bridge.context;},
  };
}
export function createHud() {
  const b=globalThis.__bridge,root=element();
  const el=new Proxy({root},{get(t,k){return t[k]??=element();}});
  let menu;
  const hud={root,el,setLoading(){},drawMap(){return true;},sync(s,info){
    b.info=info;
    if(menu!==s.ui.menu){menu=s.ui.menu;if(menu==='pause')info.onPauseOpen();if(menu==='travel')info.onTravelOpen();if(menu==='ending')info.onEndingOpen();}
  }};
  b.hud=hud;return hud;
}
