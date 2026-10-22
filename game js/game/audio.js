// Local MP3 playback for the original browser game. Empty dummy files are skipped.
const tracks = ['bgm', 'bgm_explore', 'bgm_mystery', 'bgm_sky', 'bgm_boss'];
export function createAudio(sdk, tweaks) {
  const cache = new Map(), effects = new Set();
  const music = new Audio();
  music.loop = true;
  let wanted = -1, loaded = -1, paused = false, destroyed = false, generation = 0;
  let local = {music: 1, sfx: 1, mute: false};
  const volume = kind => local.mute || tweaks.get('muted') ? 0 : Math.max(0, Math.min(1, Number(tweaks.get(kind === 'music' ? 'musicVolume' : 'sfxVolume') ?? 0.7) * local[kind]));
  async function asset(name) {
    if (!cache.has(name)) cache.set(name, (async () => {
      try {
        const response = await fetch(new URL(`../../assets/audio/${name}.mp3`, import.meta.url));
        if (!response.ok) return null;
        const blob = await response.blob();
        return blob.size && !destroyed ? URL.createObjectURL(blob) : null;
      } catch { return null; }
    })());
    return cache.get(name);
  }
  async function syncMusic() {
    const version = ++generation;
    music.volume = volume('music');
    if (paused || wanted < 0 || destroyed) { music.pause(); return; }
    const target = wanted;
    const url = await asset(tracks[target]);
    if (version !== generation || destroyed) return;
    if (loaded !== target) { music.pause(); music.removeAttribute('src'); loaded = target; if (url) music.src = url; }
    if (url) await music.play().catch(() => {});
  }
  function applyVolumes() { music.volume = volume('music'); for (const p of effects) p.volume = volume('sfx'); }
  const unsub = ['muted','musicVolume','sfxVolume'].map(k => tweaks.subscribe(k, applyVolumes));
  return {
    init() {}, unlock() { void syncMusic(); },
    async play(name) {
      if (destroyed || volume('sfx') <= 0 || (paused && name !== 'click')) return;
      const url = await asset(name);
      if (!url || destroyed || (paused && name !== 'click')) return;
      if (effects.size >= 32) return; // Keep existing effects and BGM playing.
      const p = new Audio(url); p.volume = volume('sfx'); effects.add(p);
      const done = () => effects.delete(p); p.onended = done; p.onerror = done;
      await p.play().catch(done);
    },
    setTrack(i) { if (wanted !== i) { wanted = i; void syncMusic(); } },
    setPaused(v) { if (paused !== v) { paused = v; void syncMusic(); } },
    setLocal(v) { local = {...local, ...v}; applyVolumes(); },
    destroy() { destroyed = true; generation++; music.pause(); for (const p of effects) p.pause(); effects.clear(); for (const u of unsub) u(); for (const p of cache.values()) void p.then(url => { if (url) URL.revokeObjectURL(url); }); }
  };
}
