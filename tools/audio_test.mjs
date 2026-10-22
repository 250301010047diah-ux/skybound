import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

// Exercise the browser audio engine with deterministic players, without a device.
const players = [];
globalThis.Audio = class {
  constructor() { this.playing = false; this.pauses = 0; players.push(this); }
  async play() { this.playing = true; }
  pause() { this.playing = false; this.pauses++; }
  removeAttribute() {}
};
globalThis.fetch = async () => ({ok: true, blob: async () => new Blob(['audio'])});
const source = (await fs.readFile(new URL('../game js/game/audio.js', import.meta.url), 'utf8'))
  .replace('import.meta.url', JSON.stringify(import.meta.url));
const {createAudio} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const audio = createAudio({}, {get: k => k === 'muted' ? false : 1, subscribe: () => () => {}});
audio.setTrack(1);
await new Promise(resolve => setImmediate(resolve));
const music = players[0];
assert(music.playing && music.loop);
const pauses = music.pauses;
await Promise.all(Array.from({length: 12}, () => audio.play('hit')));
assert.equal(players.length, 13);
assert(players.every(p => p.playing), 'All 12 overlapping effects and BGM keep playing');
assert.equal(music.pauses, pauses, 'Effects never pause BGM');
await Promise.all(Array.from({length: 30}, () => audio.play('jump')));
assert.equal(players.length, 33, 'Burst limit does not replace active players');
assert(players.every(p => p.playing));
players[1].onended();
await audio.play('win');
assert.equal(players.length, 34, 'Completed effects free capacity');
assert.equal(music.pauses, pauses);
audio.setPaused(true);
await new Promise(resolve => setImmediate(resolve));
assert(!music.playing);
audio.setPaused(false);
await new Promise(resolve => setImmediate(resolve));
assert(music.playing);
audio.destroy();
assert(!music.playing);
console.log('PASS: BGM + overlapping SFX, burst limit, completion, pause/resume and cleanup.');
