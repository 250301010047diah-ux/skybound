// Aera: Skybound Roots — the game spine. createGame() returns the run's state
// and the init / update / render hooks the Playabl loop drives. Each system
// lives in its own module; this file wires them through one context object
// (G) and owns the game-level actions (hurt, respawn, gates, dialog, saving).
import { T, COLS, ROWS, WORLD_W, WORLD_H, AREA_NAMES, AREA_KIND, AREA_TAG, areaOfY, ARROW_NAME, FXC, SKINS, SKIN_PARTS, skinById } from "./constants.js";
import { byId, ofType, defs, setBlocks, tileAt } from "./world.js";
import { createSpriteStore, CORE_KEYS, areaKeys, skinKeys } from "./sprites.js";
import { createInput } from "./input.js";
import { createRenderer } from "./render.js";
import { createHud } from "./hud.js";
import { createAudio } from "./audio.js";
import { newPlayer, updatePlayer } from "./player.js";
import { updateAim, updateArrows, updateShots, updateEnemies, updateBosses, spawnEnemies, BOSS } from "./combat.js";
import {
  initPuzzles,
  buildPlats,
  updatePuzzles,
  aimTargets,
  puzzleArrowHit,
  growSprout,
  waterSurfaceAt,
  findInteract,
  doInteract,
  seqHit,
} from "./puzzles.js";
import { objective } from "./story.js";

const CHUNK_COLS = Math.ceil(COLS / 4);
const CHUNK_COUNT = CHUNK_COLS * Math.ceil(ROWS / 4);
const SAVE_VERSION = 1;
// Seconds of play without the objective changing before the next hint appears.
const STUCK_HINT_SECONDS = 120;

function freshProgress() {
  return {
    abilities: { sprout: false, thread: false },
    got: {},
    cps: {},
    cp: null,
    nests: {},
    bosses: {},
    talked: {},
    latches: {},
    switches: { switchR: 0 },
    gardens: {},
    gates: {},
    baskets: { A: [], B: [], C: [] },
    locked: {},
    water: { L: 0, M: 0, U: 0 },
    seqs: {},
    seeds: 0,
    mirrors: {},
    unlocked: {},
    murals: {},
    fans: {},
    vents: {},
    furnace: false,
    burned: {},
    statues: {},
    side: 0,
    links: {},
    podDone: false,
    chests: {},
    skin: "aera",
    explored: "0".repeat(CHUNK_COUNT),
    time: 0,
    finished: false,
    settings: { music: 1, sfx: 1, mute: false },
  };
}

// Merge a loaded save over fresh defaults so older or partial saves still load.
function restoreProgress(raw) {
  const base = freshProgress();
  if (!raw || typeof raw !== "object") return base;
  for (const k of Object.keys(base)) {
    if (raw[k] === undefined) continue;
    if (base[k] && typeof base[k] === "object" && !Array.isArray(base[k])) base[k] = { ...base[k], ...raw[k] };
    else base[k] = raw[k];
  }
  if (typeof base.explored !== "string" || base.explored.length !== CHUNK_COUNT) base.explored = "0".repeat(CHUNK_COUNT);
  for (const k of ["A", "B", "C"]) if (!Array.isArray(base.baskets[k])) base.baskets[k] = [];
  return base;
}

export function createGame({ mount, sdk, tweaks, assets, saved }) {
  const state = {};
  const hud = createHud(mount);
  const inp = createInput(hud.root);
  inp.actions = [];
  const audio = createAudio(sdk, tweaks);
  audio.init();
  let run = null;
  let sprites = null;
  let renderer = null;
  let loadFailed = false;
  let uidN = 0;
  let saveDirty = false;
  let saveTimer = 0;
  let lastInteract = null;
  let mapDirty = false;
  let snapshot = saved && saved.version === SAVE_VERSION ? saved : null;
  const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;

  // Live tweak values, refreshed each update (cheap gets).
  const tw = {};
  const TW_KEYS = ["runSpeed", "jumpPower", "dashSpeed", "arrowSpeed", "aimAssist", "focusSlow", "energyRegen", "zoomTiles", "enemySpeed", "screenShake", "showHitboxes"];
  const readTweaks = () => {
    for (const k of TW_KEYS) tw[k] = tweaks.get(k);
  };
  readTweaks();

  // ---------------------------------------------------------------- loading
  // Shared art, the active skin and the areas around the player load before
  // play; everything else streams in as Aera climbs.
  const store = createSpriteStore(assets);
  let loadedArea = -1;
  function startLoad() {
    loadFailed = false;
    hud.setLoading(0.02, "Menumbuhkan Pohon Langit…");
    const a = areaOfY((byId[snapshot?.pr?.cp]?.y ?? byId.start.y) - 10);
    const keys = [...CORE_KEYS, ...skinKeys(snapshot?.pr?.skin || "aera"), ...areaKeys(a), ...areaKeys(a - 1), ...areaKeys(a + 1)];
    store
      .load([...new Set(keys)], (f) => hud.setLoading(f))
      .then(() => {
        sprites = store;
        renderer = createRenderer(hud.el.canvas, store);
        renderer.resize();
      })
      .catch(() => {
        loadFailed = true;
        hud.setLoading(0, "Gagal memuat gambar. Ketuk untuk mencoba lagi.");
      });
  }
  function prefetchAround(a) {
    if (a === loadedArea) return;
    loadedArea = a;
    store.prefetch([...areaKeys(a), ...areaKeys(a + 1), ...areaKeys(a - 1)]);
  }
  hud.el.loading.addEventListener("pointerdown", () => {
    if (loadFailed) startLoad();
  });
  startLoad();
  const ro = new ResizeObserver(() => renderer?.resize());
  ro.observe(hud.el.canvas);

  // ---------------------------------------------------------------- view helpers
  const zoomFor = (w, h) => {
    const z = Math.min(w, h) / (tw.zoomTiles * T);
    return Math.max(z, w / (26 * T), h / (30 * T));
  };
  function screenToWorld(clientX, clientY) {
    const r = hud.el.canvas.getBoundingClientRect();
    const z = zoomFor(r.width, r.height);
    return { x: (clientX - r.left - r.width / 2) / z + state.cam.x, y: (clientY - r.top - r.height / 2) / z + state.cam.y };
  }
  function worldRectToClient(x, y, w, h) {
    const r = hud.el.canvas.getBoundingClientRect();
    const z = zoomFor(r.width, r.height);
    return { x: r.left + r.width / 2 + (x - state.cam.x) * z, y: r.top + r.height / 2 + (y - state.cam.y) * z, w: w * z, h: h * z };
  }

  // ---------------------------------------------------------------- context
  const G = {
    get s() {
      return state;
    },
    inp,
    tw,
    plats: [],
    worldH: WORLD_H,
    rand: () => Math.random(),
    uid: (p) => `${p}_${++uidN}`,
    sfx: (n) => audio.play(n),
    fx(sheet, anim, x, y, dur, size, flip = false) {
      state.fx.push({ id: G.uid("fx"), sheet, anim, x, y, t: 0, dur, size, flip });
    },
    particle(x, y, vx, vy, color, size, life) {
      if (state.parts.length > 160) return;
      state.parts.push({ x, y, vx, vy, color, size, life, max: life });
    },
    splash(x, y) {
      G.fx("FX_A", "splash", x, y + 6, 0.4, 40);
      G.sfx("bubble");
    },
    toast(text, dur = 2.4) {
      state.ui.toast = { text, t: dur };
    },
    banner(text, dur = 2.6) {
      state.ui.banner = { text, t: dur };
    },
    shake(a) {
      state.shakeA = Math.max(state.shakeA || 0, a * tw.screenShake);
    },
    inputLocked: () => Boolean(state.cut || state.ui.dialog || state.ui.menu),
    screenToWorld,
    aimTargets: () => aimTargets(G),
    puzzleArrowHit: (a, x, y) => puzzleArrowHit(G, a, x, y),
    growSprout: (tx, ty, a) => growSprout(G, tx, ty, a),
    waterSurfaceAt: (x, y) => waterSurfaceAt(G, x, y),
    tileAtWorld: (x, y) => tileAt(Math.floor(x / T), Math.floor(y / T)),
    areaOfPlayer: () => areaOfY(state.player.y - 10),
    ropeBroken: () => false,
    defsWithSeq: (key) => defs.filter((d) => d.seq === key),
    seqHit: (key, d) => seqHit(G, key, d),
    giveItem,
    save() {
      saveDirty = true;
    },
    hurt,
    respawn,
    say,
    openGate,
    openTravel(id) {
      state.ui.menu = "travel";
      state.ui.travelFrom = id;
    },
    dropCarry() {
      const p = state.player;
      const f = state.fruits.find((q) => q.id === p.carry);
      p.carry = null;
      if (!f) return;
      f.mode = "free";
      f.x = p.x + p.face * 14;
      f.y = p.y - 30;
      f.vx = p.face * 90;
      f.vy = -160;
    },
    bossIntro(b) {
      state.ui.boss = b.id;
      G.banner(BOSS[b.kind].name, 2.2);
      G.sfx("boss");
      G.shake(5);
    },
    bossDefeated,
    reachTop,
  };

  // ---------------------------------------------------------------- game actions
  const SEED_TOTAL = ofType("seed").length + ofType("chest").reduce((n, c) => n + (c.item === "seed" || c.item === "both" ? 1 : 0), 0);
  const FEATHER_TOTAL = ofType("feather").length + ofType("chest").reduce((n, c) => n + (c.item === "feather" || c.item === "both" ? 1 : 0), 0);
  function giveItem(item) {
    const pr = state.pr;
    const p = state.player;
    G.sfx("pickup");
    if (item === "seed" || item === "both") {
      pr.seeds = (pr.seeds || 0) + 1;
      if (pr.seeds % 3 === 0) {
        p.maxHp += 1;
        p.hp = p.maxHp;
        G.toast("Tiga Benih Langit! Daun nyawa bertambah.");
      } else G.toast(`Benih Langit ${pr.seeds % 3}/3`);
    }
    if (item === "feather" || item === "both") {
      pr.feathers = (pr.feathers || 0) + 1;
      p.focusMax += 0.5;
      p.focus = p.focusMax;
      if (item === "feather") G.toast("Bulu Fokus! Sky Focus lebih lama.");
    }
  }
  function hurt(n, { fall = false, fromX = null } = {}) {
    const p = state.player;
    if (p.mode === "dead" || state.cut || state.ui.menu === "ending") return;
    if (!fall && p.iFrames > 0) return;
    p.hp -= n;
    G.sfx("hit");
    G.shake(5);
    try {
      if (sdk.device?.haptics?.isSupported?.()) sdk.device.haptics.vibrate(40);
    } catch {
      /* optional */
    }
    if (p.carry) G.dropCarry();
    p.rope = null;
    p.aiming = false;
    if (p.hp <= 0) {
      p.hp = 0;
      p.mode = "dead";
      G.sfx("death");
      p.modeT = 1.3;
      p.animT = 0;
      p.vx = 0;
      return;
    }
    if (fall) {
      p.x = p.safe.x;
      p.y = p.safe.y;
      p.vx = 0;
      p.vy = 0;
      p.mode = "getup";
      p.modeT = 0.6;
      p.animT = 0;
      p.iFrames = 1.2;
      G.toast("Aduh! Kembali ke pijakan aman.", 1.6);
      return;
    }
    p.mode = "hurt";
    p.modeT = 0.35;
    p.animT = 0;
    p.iFrames = 1.1;
    p.vx = (fromX !== null ? Math.sign(p.x - fromX) || -p.face : -p.face) * 230;
    p.vy = -300;
    p.onGround = false;
    p.plat = null;
  }

  function respawn() {
    G.sfx("respawn");
    const pr = state.pr;
    const cp = byId[pr.cp] || byId.start;
    const old = state.player;
    state.player = newPlayer(cp.x, cp.y, old.maxHp, old.focusMax);
    state.player.arrowType = old.arrowType;
    for (const f of state.fruits) if (f.mode === "carried" || f.mode === "pull") f.mode = "hang";
    state.arrows = [];
    state.shots = [];
    state.sprouts = [];
    state.ui.boss = null;
    spawnEnemies(G);
    state.cam.x = state.player.x;
    state.cam.y = state.player.y - 40;
    G.toast("Bangkit di altar terakhir.", 1.8);
  }

  function say(name, lines, after) {
    state.ui.dialog = { name, lines, i: 0, after };
    state.player.aiming = false;
    G.sfx("click");
  }
  function advanceDialog() {
    const d = state.ui.dialog;
    d.i++;
    G.sfx("click");
    if (d.i < d.lines.length) return;
    state.ui.dialog = null;
    const p = state.player;
    const pr = state.pr;
    if (d.after === "giveSprout" && !pr.abilities.sprout) {
      pr.abilities.sprout = true;
      p.arrowType = "sprout";
      p.mode = "ability";
      p.modeT = 2;
      p.animT = 0;
      G.sfx("ability");
      G.banner("Panah Tunas didapat!", 3);
      G.toast("Ketuk slot panah (kanan atas) atau Q untuk berganti panah.", 4);
      G.fx("FX_A", "sprout_grow", p.x, p.y, 0.8, 70);
      G.save();
    } else if (d.after?.startsWith("give:")) {
      const ab = d.after.slice(5);
      if (pr.abilities[ab]) return;
      pr.abilities[ab] = true;
      p.arrowType = ab;
      p.mode = "ability";
      p.modeT = 2;
      p.animT = 0;
      G.sfx("ability");
      G.banner(`${ARROW_NAME[ab]} didapat!`, 3);
      G.toast(
        { echo: "Panah Gema membunyikan lonceng dan kristal resonansi.", wind: "Panah Angin memutar arah kipas.", ember: "Panah Bara menyalakan tungku dan membakar semak kering." }[ab],
        4,
      );
      G.fx("FX_C", ab === "ember" ? FXC.fire : ab === "wind" ? FXC.wind : FXC.spark, p.x, p.y, 0.6, 70);
      G.save();
    } else if (d.after === "giveThread" && !pr.abilities.thread) {
      pr.abilities.thread = true;
      p.arrowType = "thread";
      p.mode = "ability";
      p.modeT = 2;
      p.animT = 0;
      G.sfx("ability");
      G.banner("Panah Benang didapat!", 3);
      G.toast("Tembak cincin jangkar untuk berayun. Lompat untuk melepas.", 4);
      G.fx("FX_B", "thread_attach", p.x, p.y - 20, 0.6, 60);
      G.save();
    }
  }

  function openGate(id) {
    const pr = state.pr;
    if (pr.gates[id]) return;
    pr.gates[id] = true;
    setBlocks(pr);
    state.gateAnim[id] = 0;
    const g = byId[id];
    state.cut = { x: g.x + g.w / 2, y: g.y + g.h + 60, t: 2.8 };
    G.sfx("gate");
    G.shake(6);
    G.banner(
      {
        gate1: "Akar mati menjadi tangga!",
        door2: "Pintu kayu terangkat!",
        dome: "Kubah air menjadi arus!",
        gate4: "Pintu matahari mekar terbuka!",
        gate5: "Lagu yang hilang terdengar lagi!",
        gate6: "Bunga angin menenangkan badai!",
        gate7: "Bunga bara mekar!",
        gate9: "Pintu bulan menjadi nyata!",
        gate10: "Satu detik yang tepat!",
        gate11: "Segel petir padam!",
        gate13: "Rasi kehidupan tersambung!",
      }[id] || "Segel terbuka!",
      3,
    );
    G.save();
  }

  function bossDefeated(b) {
    const pr = state.pr;
    pr.bosses[b.id] = true;
    b.gone = true;
    state.ui.boss = null;
    G.fx("FX_B", "poof", b.x, b.y, 0.7, 120);
    G.sfx("poof");
    G.sfx("pickup");
    if (b.id === "boss1") {
      G.banner("Induk Lumut tenang kembali", 2.6);
      say("Tetua Lumi", ["Aera! Kamu berhasil menenangkannya…", "Datanglah ke sini, Nak. Aku punya sesuatu untukmu."], null);
    } else if (byId[b.id].final) {
      G.banner("Penjaga Mahkota terbebas", 3);
      reachTop();
    } else G.banner(`${BOSS[b.kind].name} kalah!`, 2.6);
    G.save();
  }

  function reachTop() {
    if (state.ui.menu === "ending") return;
    state.pr.finished = true;
    state.ui.menu = "ending";
    G.sfx("ability");
    G.save();
  }

  // ---------------------------------------------------------------- menu actions (queued by DOM handlers)
  const el = hud.el;
  const queue = (a) => inp.actions.push(a);
  el.root.querySelector(".resume-btn").addEventListener("click", () => queue({ type: "resume" }));
  el.root.querySelector(".restart-btn").addEventListener("click", (e) => {
    const b = e.currentTarget;
    if (!b.classList.contains("confirm")) {
      b.classList.add("confirm");
      b.querySelector(".control-label").textContent = "Yakin? Ketuk lagi";
      return;
    }
    b.classList.remove("confirm");
    b.querySelector(".control-label").textContent = "Mulai dari awal";
    newGame();
  });
  el.hintBtn.addEventListener("click", () => queue({ type: "hint" }));
  el.root.querySelector(".travel-close").addEventListener("click", () => queue({ type: "closeMenu" }));
  el.root.querySelector(".ending-btn").addEventListener("click", () => queue({ type: "afterEnding" }));
  el.dialog.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    inp.advancePressed = true;
  });
  for (const tab of el.root.querySelectorAll(".tab"))
    tab.addEventListener("click", () => {
      el.root.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t === tab));
      el.root.querySelectorAll(".tab-body").forEach((b) => b.classList.toggle("on", b.classList.contains(`tab-${tab.dataset.tab}`)));
      if (tab.dataset.tab === "map") hud.drawMap(state);
    });
  const volMusic = el.root.querySelector(".vol-music");
  const volSfx = el.root.querySelector(".vol-sfx");
  const volMute = el.root.querySelector(".vol-mute");
  const pushSettings = () => queue({ type: "settings", music: Number(volMusic.value), sfx: Number(volSfx.value), mute: volMute.checked });
  volMusic.addEventListener("input", pushSettings);
  volSfx.addEventListener("input", pushSettings);
  volMute.addEventListener("change", pushSettings);

  function onPauseOpen() {
    const st = state.pr.settings;
    volMusic.value = st.music;
    volSfx.value = st.sfx;
    volMute.checked = st.mute;
    el.root.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === "map"));
    el.root.querySelectorAll(".tab-body").forEach((b) => b.classList.toggle("on", b.classList.contains("tab-map")));
    mapDirty = true; // drawn on the next render, once the panel has a measured size
    fillHint();
  }
  function fillHint() {
    const o = objective(state.pr, G.areaOfPlayer());
    el.hintGoal.textContent = o[0];
    const tier = state.ui.hintTier || 0;
    el.hintMore.textContent = tier >= 1 ? o[Math.min(tier, 2)] : "";
    el.hintBtn.hidden = tier >= 2;
  }
  function onTravelOpen() {
    const pr = state.pr;
    const list = ofType("nest").filter((d) => pr.nests[d.id] && d.id !== state.ui.travelFrom);
    el.travelList.innerHTML = "";
    if (!list.length) {
      el.travelList.innerHTML = `<p class="muted">Aktifkan sarang lain untuk bisa terbang ke sana.</p>`;
      return;
    }
    for (const d of list) {
      const b = document.createElement("button");
      b.className = "menu-btn";
      b.innerHTML = `<span class="control-label">${AREA_NAMES[d.area]}</span>`;
      b.addEventListener("click", () => queue({ type: "travel", id: d.id }));
      el.travelList.appendChild(b);
    }
  }
  function onEndingOpen() {
    const pr = state.pr;
    const mins = Math.floor(pr.time / 60);
    const secs = Math.floor(pr.time % 60);
    el.endingText.textContent =
      "Jantung Pohon berdetak lagi. Akar bercahaya menyambungkan tiga belas lapisan, dari Lembah Akar Embun hingga Mahkota Bintang — dan dunia tetap terbuka untuk rahasia yang tertinggal.";
    el.endingStats.innerHTML = `<span>Waktu ${mins}:${String(secs).padStart(2, "0")}</span><span>Benih ${pr.seeds || 0}/${SEED_TOTAL}</span><span>Bulu ${pr.feathers || 0}/${FEATHER_TOTAL}</span>`;
  }

  function processActions() {
    const acts = inp.actions.splice(0);
    for (const a of acts) {
      if (["resume", "closeMenu", "hint", "afterEnding"].includes(a.type)) G.sfx("click");
      if (a.type === "resume" || a.type === "closeMenu") state.ui.menu = null;
      else if (a.type === "hint") {
        state.ui.hintTier = Math.min(2, (state.ui.hintTier || 0) + 1);
        fillHint();
      } else if (a.type === "settings") {
        state.pr.settings = { music: a.music, sfx: a.sfx, mute: a.mute };
        audio.setLocal(state.pr.settings);
        G.save();
      } else if (a.type === "warp") {
        // Pick any lapisan from the map; its first altar is the entry point.
        state.ui.menu = null;
        if (!state.ui.boss && state.player) {
          if (state.player.carry) G.dropCarry();
          warpToArea(a.area);
          G.sfx("swish");
        }
      } else if (a.type === "travel") {
        const d = byId[a.id];
        const p = state.player;
        state.ui.menu = null;
        if (p.carry) G.dropCarry();
        p.x = d.x;
        p.y = d.y;
        p.vx = 0;
        p.vy = 0;
        p.mode = "getup";
        p.modeT = 0.5;
        state.cam.x = p.x;
        state.cam.y = p.y - 40;
        state.sprouts = [];
        G.fx("FX_B", "sparkle", p.x, p.y - 10, 0.6, 60);
        G.sfx("swish");
      } else if (a.type === "skin") {
        state.pr.skin = a.id;
        store.prefetch(skinKeys(a.id));
        G.sfx("click");
        G.save();
      } else if (a.type === "afterEnding") {
        state.ui.menu = null;
        const cp = byId.cp13c;
        const p = state.player;
        p.x = cp.x;
        p.y = cp.y;
        p.vy = 0;
        p.mode = "getup";
        p.modeT = 0.5;
        G.toast("Dunia tetap terbuka — cari rahasia yang tertinggal.", 3);
      }
    }
  }

  async function newGame() {
    snapshot = null;
    try {
      await sdk.gameState.clear();
    } catch {
      /* best effort */
    }
    if (run) run.restart();
    else hooks.init(state);
  }

  function writeSave() {
    saveDirty = false;
    const p = state.player;
    snapshot = JSON.parse(JSON.stringify({ version: SAVE_VERSION, pr: state.pr, maxHp: p.maxHp, focusMax: p.focusMax }));
    sdk.gameState.save(snapshot).catch(() => {});
  }

  // ---------------------------------------------------------------- hooks
  const hooks = {
    init(s) {
      for (const k of Object.keys(s)) delete s[k];
      const snap = snapshot;
      s.pr = restoreProgress(snap?.pr);
      setBlocks(s.pr);
      const cp = byId[s.pr.cp] || byId.start;
      s.player = newPlayer(cp.x, cp.y, snap?.maxHp ?? Number(tweaks.get("startHp")), snap?.focusMax ?? 1.5);
      s.arrows = [];
      s.shots = [];
      s.fx = [];
      s.parts = [];
      s.release = null;
      s.enemies = [];
      s.cam = { x: s.player.x, y: s.player.y - 40 };
      s.time = 0;
      s.cut = null;
      s.slowmo = false;
      s.shakeA = 0;
      s.shakeX = 0;
      s.shakeY = 0;
      s.area = areaOfY(s.player.y - 10);
      s.ui = { dialog: null, toast: null, banner: { text: AREA_NAMES[s.area], t: 3 }, menu: null, boss: null, hintTier: 0 };
      initPuzzles(G);
      spawnEnemies(G);
      audio.setLocal(s.pr.settings);
      if (!snap)
        G.toast(coarse ? "Geser joystick untuk bergerak. Tahan busur lalu geser untuk membidik." : "A/D bergerak · Spasi lompat · Shift dash · tahan klik untuk membidik", 6);
    },

    update(s, dt) {
      if (!sprites) return;
      readTweaks();
      if (inp.firstGesture) {
        inp.firstGesture = false; // one unlock request per player gesture
        audio.unlock();
      }
      processActions();
      s.time += dt;
      // Pause toggle.
      if (inp.pausePressed && !s.ui.dialog && s.ui.menu !== "ending") {
        s.ui.menu = s.ui.menu ? null : "pause";
        G.sfx("click");
        if (s.ui.menu === "pause") s.ui.hintTier = 0;
      }
      tickUi(s, dt);
      if (s.ui.menu) {
        inp.consume();
        return;
      }
      if (s.ui.dialog) {
        if (inp.advancePressed) advanceDialog();
        inp.consume();
        return;
      }
      s.pr.time += dt;
      const wdt = dt * (s.slowmo ? tw.focusSlow : 1);
      updateAim(G, dt);
      updatePuzzles(G, wdt);
      G.plats = buildPlats(G);
      updatePlayer(G, wdt);
      updateArrows(G, wdt);
      updateShots(G, wdt);
      updateEnemies(G, wdt);
      updateBosses(G, wdt);
      lastInteract = G.inputLocked() ? null : findInteract(G);
      if (inp.interactPressed && !G.inputLocked()) {
        if (lastInteract) doInteract(G, lastInteract);
      }
      if (s.cut) {
        s.cut.t -= dt;
        if (s.cut.t <= 0) s.cut = null;
      }
      updateCamera(s, dt);
      updateFx(s, wdt);
      markExplored(s);
      const area = areaOfY(s.player.y - 10);
      if (area !== s.area) {
        s.area = area;
        const tag = AREA_TAG[AREA_KIND[area]];
        G.banner(tag ? `${AREA_NAMES[area]} · ${tag}` : AREA_NAMES[area], 2.8);
      }
      tickStuckHint(s, dt);
      prefetchAround(area);
      saveTimer -= dt;
      if (saveDirty && saveTimer <= 0) {
        saveTimer = 1;
        writeSave();
      }
      inp.consume();
    },

    render(s) {
      if (!s.player) return;
      const loading = !sprites || !renderer;
      if (!loading) {
        const z = zoomFor(renderer.view.w, renderer.view.h);
        const touch = coarse || inp.touchUsed;
        const prompt = !touch && lastInteract && !s.ui.dialog && !s.ui.menu ? lastInteract.label : null;
        const skin = skinById(s.pr.skin);
        // Every part of the skin must be in before its sheets replace Aera's; a
        // half-loaded skin would leave jump, climb or action poses with no frame.
        const ready = SKIN_PARTS.every((p) => store.has(`${skin.prefix}_${p}`));
        const prefix = ready ? skin.prefix : "AERA";
        renderer.draw(s, { zoom: z, tw, plats: G.plats, hitboxes: Boolean(tw.showHitboxes), prompt, prefix });
      }
      const boss = s.ui.boss ? s.bosses[s.ui.boss] : null;
      hud.sync(s, {
        touch: coarse || inp.touchUsed,
        interact: lastInteract,
        bossName: boss ? BOSS[boss.kind].name : "",
        loading,
        onPauseOpen,
        onTravelOpen,
        onEndingOpen,
        seedTotal: SEED_TOTAL,
        featherTotal: FEATHER_TOTAL,
        skins: SKINS,
        store,
        onSkin: (id) => queue({ type: "skin", id }),
      });
      if (mapDirty && s.ui.menu === "pause") mapDirty = !hud.drawMap(s);
      audio.setTrack(loading ? -1 : s.ui.boss ? 4 : s.ui.menu === "ending" ? 3 : s.area < 4 ? 1 : s.area < 9 ? 2 : 3);
      audio.setPaused(Boolean(run?.frozen) || s.ui.menu === "pause" || document.hidden);
    },
  };

  // Reveals the objective's hints on their own when the player seems stuck: the
  // objective text has not changed for STUCK_HINT_SECONDS. Each stretch shows
  // the next tier, and any progress starts the count again.
  function tickStuckHint(s, dt) {
    if (s.ui.boss) return;
    const o = objective(s.pr, s.area);
    const key = o.join("|");
    const st = s.ui.stuck;
    if (!st || st.key !== key) {
      s.ui.stuck = { key, t: 0, tier: 0 };
      return;
    }
    if (st.tier >= 2) return;
    st.t += dt;
    if (st.t < STUCK_HINT_SECONDS) return;
    st.t = 0;
    st.tier += 1;
    s.ui.hintTier = st.tier;
    G.toast(`Petunjuk: ${o[st.tier]}`, 8);
  }

  function tickUi(s, dt) {
    if (s.ui.toast) {
      s.ui.toast.t -= dt;
      if (s.ui.toast.t <= 0) s.ui.toast = null;
    }
    if (s.ui.banner) {
      s.ui.banner.t -= dt;
      if (s.ui.banner.t <= 0) s.ui.banner = null;
    }
    if (s.valveSpin) {
      s.valveSpin.t -= dt;
      if (s.valveSpin.t <= 0) s.valveSpin = null;
    }
  }

  function updateCamera(s, dt) {
    const p = s.player;
    const view = renderer.view;
    const z = zoomFor(view.w, view.h);
    const hw = view.w / 2 / z;
    const hh = view.h / 2 / z;
    let tx = p.x + p.face * 36;
    let ty = p.y - 44;
    if (p.aiming) {
      // Lean toward the shot, but only as far as Aera stays well inside the view.
      tx += p.aimX * 90;
      ty += p.aimY * 90;
      tx = Math.max(p.x - hw * 0.5, Math.min(p.x + hw * 0.5, tx));
      ty = Math.max(p.y - hh * 0.4, Math.min(p.y + hh * 0.4, ty));
    }
    // During a boss fight, frame both Aera and the boss.
    const boss = s.ui.boss ? s.bosses[s.ui.boss] : null;
    if (boss && boss.state !== "defeat") {
      tx = tx * 0.65 + boss.x * 0.35;
      ty = ty * 0.6 + (boss.y - boss.h / 2) * 0.4;
    }
    if (s.cut) {
      tx = s.cut.x;
      ty = s.cut.y;
    }
    const k = Math.min(1, dt * (s.cut ? 3 : 6));
    s.cam.x += (tx - s.cam.x) * k;
    s.cam.y += (ty - s.cam.y) * Math.min(1, dt * (s.cut ? 3 : 5));
    if (!s.cut) {
      // Hard limit: Aera stays inside the view even while the camera catches up.
      s.cam.x = Math.max(p.x - hw * 0.8, Math.min(p.x + hw * 0.8, s.cam.x));
      s.cam.y = Math.max(p.y - hh * 0.8, Math.min(p.y + hh * 0.8, s.cam.y));
    }
    s.cam.x = hw * 2 >= WORLD_W ? WORLD_W / 2 : Math.max(hw, Math.min(WORLD_W - hw, s.cam.x));
    s.cam.y = Math.max(hh, Math.min(WORLD_H - hh, s.cam.y));
    s.shakeA = Math.max(0, (s.shakeA || 0) - dt * 30);
    s.shakeX = s.shakeA ? (Math.random() - 0.5) * s.shakeA : 0;
    s.shakeY = s.shakeA ? (Math.random() - 0.5) * s.shakeA : 0;
  }

  function updateFx(s, dt) {
    if (s.release) {
      s.release.t += dt;
      if (s.release.t >= s.release.dur) s.release = null;
    }
    for (const f of s.fx) f.t += dt;
    s.fx = s.fx.filter((f) => f.t < f.dur);
    for (const q of s.parts) {
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 120 * dt;
      q.life -= dt;
    }
    s.parts = s.parts.filter((q) => q.life > 0);
  }

  function markExplored(s) {
    const p = s.player;
    const cx = Math.floor(p.x / T / 4);
    const cy = Math.floor(p.y / T / 4);
    let ex = s.pr.explored;
    let changed = false;
    for (let y = cy - 2; y <= cy + 2; y++)
      for (let x = cx - 3; x <= cx + 3; x++) {
        if (x < 0 || x >= CHUNK_COLS || y < 0 || y >= Math.ceil(ROWS / 4)) continue;
        const i = y * CHUNK_COLS + x;
        if (ex[i] !== "1") {
          ex = ex.slice(0, i) + "1" + ex.slice(i + 1);
          changed = true;
        }
      }
    if (changed) s.pr.explored = ex;
  }

  // ---------------------------------------------------------------- Creator Tools helpers
  function sceneNodes() {
    const s = state;
    if (!s.player || !renderer) return [];
    const nodes = [];
    const r = hud.el.canvas.getBoundingClientRect();
    nodes.push({ id: "backdrop", defId: "def:backdrop", kind: "backdrop", label: "Latar", rect: { x: r.left, y: r.top, w: r.width, h: r.height }, instance: { area: AREA_NAMES[s.area] } });
    nodes.push({ id: "terrain", defId: "def:terrain", kind: "terrain", label: "Medan", rect: { x: r.left, y: r.top, w: r.width, h: r.height }, instance: {} });
    const within = (rc) => rc.x + rc.w > r.left && rc.x < r.right && rc.y + rc.h > r.top && rc.y < r.bottom;
    const add = (id, defId, kind, label, x, y, w, h, instance = {}) => {
      const rc = worldRectToClient(x, y, w, h);
      if (within(rc)) nodes.push({ id, defId, kind, label, rect: rc, instance });
    };
    const p = s.player;
    add("aera", "def:aera", "aera", "Aera", p.x - 16, p.y - 60, 32, 60, { hp: p.hp, mode: p.mode, panah: ARROW_NAME[p.arrowType] });
    for (const a of s.arrows) add(a.id, "def:bow", "arrow", "Panah", a.x - 10, a.y - 4, 20, 8, { type: a.type });
    for (const e of s.enemies) if (e.alive) add(e.id, "def:enemy", e.kind, e.kind, e.x - e.w / 2, e.y - e.h, e.w, e.h, { hp: e.hp });
    for (const b of Object.values(s.bosses))
      add(b.id, `def:${b.kind}-boss`, `${b.kind}-boss`, BOSS[b.kind].name, b.x - b.w / 2, b.y - b.h, b.w, b.h, { hp: b.hp });
    for (const d of ofType("npc")) add(d.id, "def:npc", "npc", d.npc, d.x - 16, d.y - 56, 32, 56);
    for (const d of ofType("checkpoint")) add(d.id, "def:checkpoint", "checkpoint", "Altar", d.x - 18, d.y - 36, 36, 36, { aktif: Boolean(s.pr.cps[d.id]) });
    for (const d of ofType("nest")) add(d.id, "def:nest", "nest", "Sarang perjalanan", d.x - 20, d.y - 34, 40, 34);
    for (const d of ofType("gate")) add(d.id, "def:seal-gate", "gate", "Segel", d.x, d.y, d.w, d.h, { terbuka: Boolean(s.pr.gates[d.id]) });
    for (const d of ofType("garden")) add(d.id, "def:garden", "garden", "Kebun", d.x, d.y, d.w, d.h, { mekar: Boolean(s.pr.gardens[d.id]) });
    for (const t of ["latch", "switch", "valve", "lever", "anchor", "mural", "basket", "mushroom", "spring", "mirror", "eye", "bell", "vent", "furnace", "chest", "statue", "altar", "ring", "core", "starNode", "sporeLamp"])
      for (const d of ofType(t)) add(d.id, "def:puzzle-prop", t, t, d.x - 18, d.y - 36, 36, 36);
    for (const d of ofType("lift")) add(d.id, "def:puzzle-prop", "lift", "Lift", d.x, s.lifts[d.id].top, d.w, 14);
    for (const f of s.fruits) add(f.id, "def:puzzle-prop", "fruit", `Buah ${f.w}`, f.x - 12, f.y - 12, 24, 24, { bobot: f.w, mode: f.mode });
    for (const sp of s.sprouts) add(sp.id, "def:puzzle-prop", "sprout", "Pijakan tunas", sp.x, sp.top, sp.w, 16);
    for (const d of [...ofType("seed"), ...ofType("feather")]) if (!s.pr.got[d.id]) add(d.id, "def:pickup", d.type, d.type === "seed" ? "Benih Langit" : "Bulu Fokus", d.x - 12, d.y - 12, 24, 24);
    for (const f of s.fx) add(f.id, "def:effects", "fx", f.anim, f.x - f.size / 2, f.y - f.size, f.size, f.size);
    for (const d of ofType("reservoir")) add(d.id, "def:water", "water", "Waduk", d.x, d.bottom - 3 * d.step, d.w, 3 * d.step, { level: s.pr.water[d.key] });
    for (const c of ofType("channel")) add(c.id, "def:channel", "channel", "Saluran akar", c.before[0].x - 20, c.before[0].y - 20, 40, 40);
    const dom = (sel, id, defId, kind, label) => {
      const n = hud.root.querySelector(sel);
      if (!n || n.offsetParent === null) return;
      const b = n.getBoundingClientRect();
      if (b.width) nodes.push({ id, defId, kind, label, rect: { x: b.left, y: b.top, w: b.width, h: b.height }, instance: {} });
    };
    dom(".hud-tl", "hud-status", "def:hud", "hud", "Nyawa & meter");
    dom(".hud-tr", "hud-buttons", "def:hud", "hud", "Slot panah & jeda");
    dom(".stick", "ctl-stick", "def:controls", "controls", "Joystick");
    dom(".actions", "ctl-actions", "def:controls", "controls", "Tombol aksi");
    return nodes;
  }

  // Creator / debug helper: move Aera to the first altar of an area.
  function warpToArea(a) {
    const cp = ofType("checkpoint").find((d) => d.area === a);
    if (!cp || !state.player) return;
    const p = state.player;
    p.x = cp.x;
    p.y = cp.y;
    p.vx = 0;
    p.vy = 0;
    p.rope = null;
    p.mode = "getup";
    p.modeT = 0.4;
    state.cam.x = p.x;
    state.cam.y = p.y - 40;
    state.sprouts = [];
    store.prefetch([...areaKeys(a), ...areaKeys(a + 1), ...areaKeys(a - 1)]);
  }

  return {
    state,
    hooks,
    warpToArea,
    areaIndex: () => (state.player ? areaOfY(state.player.y - 10) : 0),
    setRun(r) {
      run = r;
    },
    sceneNodes,
    openGate,
    respawn,
    say,
    getState: () => ({ started: Boolean(state.player), score: state.pr?.seeds ?? 0 }),
    destroy() {
      inp.destroy();
      ro.disconnect();
      audio.destroy();
      mount.replaceChildren();
    },
  };
}
