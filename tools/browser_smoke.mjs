// Build first: flutter build web --no-wasm-dry-run
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const root=path.resolve(import.meta.dirname,'..'),web=path.join(root,'build/web');
const types={'.js':'text/javascript','.html':'text/html','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{try{const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/,''),file=path.resolve(web,relative||'index.html');if(!file.startsWith(web+path.sep)&&file!==web){res.writeHead(403).end();return;}const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 // Flutter paints CanvasKit; semantics are enabled for automation.
 await page.locator('flutter-view').waitFor({timeout:60000});
 await page.evaluate(()=>document.querySelector('flt-semantics-placeholder')?.click());
 await page.getByRole('button',{name:'Mulai petualangan'}).waitFor({timeout:60000});
 await fs.mkdir(path.join(root,'.dart_tool/skybound_checks'),{recursive:true});
 await page.screenshot({path:path.join(root,'.dart_tool/skybound_checks/main-menu.png')});
 await page.getByRole('button',{name:'Mulai petualangan'}).click();
 await page.getByRole('button',{name:'Lewati'}).waitFor();
 await page.screenshot({path:path.join(root,'.dart_tool/skybound_checks/tutorial.png')});
 await page.getByRole('button',{name:'Lewati'}).click();
 await page.waitForFunction(()=>globalThis.skyboundDebug?.game.state.player?.mode==='normal',{},{timeout:60000});
 // Browser objects must not be replaced by game compatibility shims.
 assert(await page.evaluate(()=>typeof document.querySelector==='function'&&window===globalThis));
 const before=await page.evaluate(()=>skyboundDebug.game.state.player.x);
 await page.keyboard.down('d');await page.waitForTimeout(300);await page.keyboard.up('d');
 assert((await page.evaluate(()=>skyboundDebug.game.state.player.x))>before+5);
 await page.getByRole('button',{name:'Tutorial',exact:true}).click();
 await page.getByRole('button',{name:'Lewati'}).waitFor();
 const y=await page.evaluate(()=>skyboundDebug.game.state.player.y);
 await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>skyboundDebug.game.state.player.y),y);
 await page.getByRole('button',{name:'Lewati'}).click();
 await page.getByRole('button',{name:'Bisukan suara'}).click();
 await page.waitForFunction(()=>skyboundDebug.game.state.pr.settings.mute===true);
 await page.screenshot({path:path.join(root,'.dart_tool/skybound_checks/web-game.png')});
 assert.deepEqual(errors,[]);console.log('PASS: browser menu, tutorial skip/reopen/freeze, gameplay input, volume, and isolated JS runtime.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
