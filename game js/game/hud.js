// DOM layer over the canvas: HUD badges, touch controls, dialog box and the
// pause / travel / ending overlays. sync() only writes what changed.
import { ARROW_COLOR, ARROW_NAME, AREA_NAMES, AREA_COUNT, AREA_ROWS, COLS, ROWS, T, TILE, areaOfY, areaTopRow } from "./constants.js";
import { tiles, ofType } from "./world.js";

const svg = (body, extra = "") =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${body}</svg>`;
export const ICON = {
  leaf: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z" fill="currentColor" stroke="#2a170b" stroke-width="1.8" stroke-linejoin="round"/><path d="M6 18l9-9" stroke="#2a170b" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`,
  pause: svg(`<path d="M9 6v12M15 6v12"/>`),
  jump: svg(`<path d="M12 19V6M6 11l6-6 6 6"/>`),
  dash: svg(`<path d="M4 12h12M12 7l5 5-5 5M4 8h5M4 16h5"/>`),
  hand: svg(`<path d="M8 13V6.5a1.5 1.5 0 013 0V12M11 11V5a1.5 1.5 0 013 0v6M14 11V6.5a1.5 1.5 0 013 0V14c0 4-2.5 6-6 6-2.6 0-4-1.4-5.4-3.6L4 13.6a1.5 1.5 0 012.5-1.6L8 14"/>`),
  bow: svg(`<path d="M6 3c6 3 9 9 6 18"/><path d="M6 3l6 18"/><path d="M9 12h12M18 9l3 3-3 3"/>`),
  arrow: svg(`<path d="M4 20L18 6"/><path d="M13 5h6v6"/><path d="M4 16v4h4"/>`),
  next: svg(`<path d="M8 6l8 6-8 6z" fill="currentColor"/>`),
  close: svg(`<path d="M6 6l12 12M18 6L6 18"/>`),
};

export function createHud(mount) {
  const root = document.createElement("div");
  root.className = "aera-root";
  root.innerHTML = `
    <canvas class="game-surface"></canvas>
    <div class="hud">
      <div class="hud-tl">
        <div class="pip-row hp"></div>
        <div class="meters">
          <div class="meter energy" title="Energi panah"><i></i></div>
          <div class="meter focus" title="Sky Focus"><i></i></div>
        </div>
      </div>
      <div class="hud-tc">
        <div class="banner"></div>
        <div class="boss"><span class="boss-name"></span><div class="meter boss-meter"><i></i></div></div>
        <div class="toast"></div>
      </div>
      <div class="hud-tr">
        <button class="hud-btn slot-btn" aria-label="Ganti panah"><span class="slot-icon">${ICON.arrow}</span><span class="slot-cost"></span></button>
        <button class="hud-btn pause-btn" aria-label="Jeda">${ICON.pause}</button>
      </div>
    </div>
    <div class="controls">
      <div class="stick"><div class="stick-base"><div class="stick-knob"></div></div></div>
      <div class="actions">
        <button class="act act-interact" aria-label="Interaksi">${ICON.hand}<span class="act-label"></span></button>
        <button class="act act-dash" aria-label="Dash">${ICON.dash}</button>
        <button class="act act-jump" aria-label="Lompat">${ICON.jump}</button>
        <button class="act act-bow" aria-label="Busur">${ICON.bow}</button>
      </div>
    </div>
    <div class="dialog" hidden>
      <div class="dialog-name"></div>
      <div class="dialog-text"></div>
      <div class="dialog-next">${ICON.next}</div>
    </div>
    <div class="overlay pause-menu" hidden>
      <div class="panel">
        <div class="tabs">
          <button class="tab" data-tab="map">Peta</button>
          <button class="tab" data-tab="help">Bantuan</button>
          <button class="tab" data-tab="skin">Jubah</button>
          <button class="tab" data-tab="sound">Suara</button>
        </div>
        <div class="tab-body tab-map"><canvas class="map-canvas"></canvas><div class="map-legend"></div></div>
        <div class="tab-body tab-help">
          <p class="hint-goal"></p>
          <p class="hint-more"></p>
          <button class="menu-btn hint-btn"><span class="control-label">Petunjuk berikutnya</span></button>
        </div>
        <div class="tab-body tab-skin"><div class="skin-grid"></div></div>
        <div class="tab-body tab-sound">
          <label class="row"><span>Musik</span><input type="range" min="0" max="1" step="0.05" class="vol-music"></label>
          <label class="row"><span>Efek</span><input type="range" min="0" max="1" step="0.05" class="vol-sfx"></label>
          <label class="row"><span>Bisukan</span><input type="checkbox" class="vol-mute"></label>
        </div>
        <div class="menu-actions">
          <button class="menu-btn primary resume-btn"><span class="control-label">Lanjut</span></button>
          <button class="menu-btn restart-btn"><span class="control-label">Mulai dari awal</span></button>
        </div>
      </div>
    </div>
    <div class="overlay travel-menu" hidden>
      <div class="panel">
        <div class="panel-title">Terbang ke sarang</div>
        <div class="travel-list"></div>
        <button class="menu-btn travel-close"><span class="control-label">Batal</span></button>
      </div>
    </div>
    <div class="overlay ending" hidden>
      <div class="panel">
        <div class="ending-title">Tiga Langit Terbuka</div>
        <p class="ending-text"></p>
        <div class="ending-stats"></div>
        <button class="menu-btn primary ending-btn"><span class="control-label">Terus menjelajah</span></button>
      </div>
    </div>
    <div class="loading"><div class="loading-leaf">${ICON.leaf}</div><div class="loading-bar"><i></i></div><div class="loading-text">Menumbuhkan Pohon Langit…</div></div>
  `;
  mount.replaceChildren(root);
  const q = (sel) => root.querySelector(sel);
  const el = {
    root,
    canvas: q("canvas.game-surface"),
    hp: q(".hp"),
    energy: q(".energy i"),
    focus: q(".focus i"),
    banner: q(".banner"),
    boss: q(".boss"),
    bossName: q(".boss-name"),
    bossBar: q(".boss-meter i"),
    toast: q(".toast"),
    slot: q(".slot-btn"),
    slotIcon: q(".slot-icon"),
    slotCost: q(".slot-cost"),
    interact: q(".act-interact"),
    interactLabel: q(".act-label"),
    controls: q(".controls"),
    dialog: q(".dialog"),
    dialogName: q(".dialog-name"),
    dialogText: q(".dialog-text"),
    pause: q(".pause-menu"),
    mapCanvas: q(".map-canvas"),
    mapLegend: q(".map-legend"),
    hintGoal: q(".hint-goal"),
    hintMore: q(".hint-more"),
    hintBtn: q(".hint-btn"),
    travel: q(".travel-menu"),
    travelList: q(".travel-list"),
    ending: q(".ending"),
    endingText: q(".ending-text"),
    endingStats: q(".ending-stats"),
    loading: q(".loading"),
    loadingBar: q(".loading-bar i"),
    loadingText: q(".loading-text"),
  };
  const cache = {};
  const set = (key, value, fn) => {
    if (cache[key] === value) return;
    cache[key] = value;
    fn(value);
  };

  function sync(s, inf) {
    info = inf;
    const p = s.player;
    if (s.ui.menu === "pause") buildSkins(s, info);
    root.classList.toggle("touch", info.touch);
    // Hearts.
    set("maxHp", p.maxHp, (n) => {
      el.hp.innerHTML = Array.from({ length: n }, () => `<span class="pip leaf">${ICON.leaf}</span>`).join("");
    });
    set("hp", `${p.hp}/${p.maxHp}`, () => {
      [...el.hp.children].forEach((c, i) => c.classList.toggle("empty", i >= p.hp));
    });
    set("energy", Math.round(p.energy), (v) => (el.energy.style.width = `${v}%`));
    set("focus", Math.round((p.focus / p.focusMax) * 100), (v) => (el.focus.style.width = `${v}%`));
    el.root.classList.toggle("slowmo", Boolean(s.slowmo));
    // Arrow slot.
    set("arrow", p.arrowType, (t) => {
      el.slot.style.setProperty("--arrow-col", ARROW_COLOR[t]);
      el.slot.setAttribute("aria-label", `Ganti panah (${ARROW_NAME[t]})`);
      el.slotCost.textContent = t === "normal" ? "∞" : t === "sprout" ? "T" : "B";
    });
    set("slotLow", p.arrowType !== "normal" && p.energy < (p.arrowType === "sprout" ? 25 : 20), (v) => el.slot.classList.toggle("low", v));
    // Banner, toast, boss.
    set("banner", s.ui.banner?.t > 0 ? s.ui.banner.text : "", (v) => {
      el.banner.textContent = v;
      el.banner.classList.toggle("show", Boolean(v));
    });
    set("toast", s.ui.toast?.t > 0 ? s.ui.toast.text : "", (v) => {
      if (v) el.toast.textContent = v;
      el.toast.classList.toggle("show", Boolean(v));
    });
    const bossId = s.ui.boss;
    const b = bossId ? s.bosses[bossId] : null;
    set("boss", b ? info.bossName : "", (v) => {
      el.bossName.textContent = v;
      el.boss.classList.toggle("show", Boolean(v));
    });
    if (b) set("bossHp", Math.round((Math.max(0, b.hp) / b.max) * 100), (v) => (el.bossBar.style.width = `${v}%`));
    // Interact button.
    set("interact", info.interact?.label ?? "", (v) => {
      el.interactLabel.textContent = v;
      el.interact.classList.toggle("ready", Boolean(v));
    });
    // Dialog.
    const d = s.ui.dialog;
    set("dialog", d ? `${d.name}|${d.i}` : "", (v) => {
      el.dialog.hidden = !v;
      if (d) {
        el.dialogName.textContent = d.name;
        el.dialogText.textContent = d.lines[d.i];
      }
    });
    // Overlays.
    set("menu", s.ui.menu || "", (m) => {
      el.pause.hidden = m !== "pause";
      el.travel.hidden = m !== "travel";
      el.ending.hidden = m !== "ending";
      if (m === "pause") info.onPauseOpen?.();
      if (m === "travel") info.onTravelOpen?.();
      if (m === "ending") info.onEndingOpen?.();
    });
    set("loading", info.loading, (v) => el.loading.classList.toggle("hide", !v));
  }

  // Mini map of explored chunks with markers.
  let info = { seedTotal: 0, featherTotal: 0 };
  function drawMap(s) {
    const c = el.mapCanvas;
    const r = c.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
    const ctx = c.getContext("2d");
    // A window of three areas around Aera: the whole 13-layer tree would be too thin to read.
    const here = areaOfY(s.player.y - 10);
    const aTop = Math.min(AREA_COUNT - 1, here + 1);
    const aBot = Math.max(0, here - 1);
    const row0 = areaTopRow(aTop);
    const row1 = Math.min(ROWS, areaTopRow(aBot) + AREA_ROWS);
    const rowsShown = row1 - row0;
    const cell = Math.min(r.width / COLS, r.height / rowsShown);
    ctx.setTransform(dpr, 0, 0, dpr, ((r.width - cell * COLS) / 2) * dpr, ((r.height - cell * rowsShown) / 2 - row0 * cell) * dpr);
    ctx.fillStyle = "#1d140c";
    ctx.fillRect(0, row0 * cell, COLS * cell, rowsShown * cell);
    const ex = s.pr.explored || "";
    const AREA_COL = ["#7a5634", "#b9853e", "#c9b48a", "#c9a24a", "#7a6a90", "#9fb3c3", "#7a3a24", "#5a4a8a", "#8a9cc0", "#7a5a32", "#5a6a80", "#7a4a70", "#e8dcc0"];
    for (let y = row0; y < row1; y++)
      for (let x = 0; x < COLS; x++) {
        const ci = Math.floor(y / 4) * Math.ceil(COLS / 4) + Math.floor(x / 4);
        if (ex[ci] !== "1") continue;
        const t = tiles[y * COLS + x];
        const area = AREA_COUNT - 1 - Math.floor(y / AREA_ROWS);
        if (t === TILE.SOLID || t === TILE.FERTILE) ctx.fillStyle = t === TILE.FERTILE ? "#6fae2f" : AREA_COL[area];
        else ctx.fillStyle = "#3b5a52";
        ctx.fillRect(x * cell, y * cell, cell + 0.3, cell + 0.3);
      }
    const dot = (x, y, col, r = 2.4) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc((x / T) * cell, (y / T) * cell, r, 0, Math.PI * 2);
      ctx.fill();
    };
    const seen = (x, y) => ex[Math.floor(y / T / 4) * Math.ceil(COLS / 4) + Math.floor(x / T / 4)] === "1";
    for (const d of ofType("checkpoint")) if (seen(d.x, d.y)) dot(d.x, d.y - 10, s.pr.cps[d.id] ? "#ffd84a" : "#8a7a5a");
    for (const d of ofType("nest")) if (seen(d.x, d.y)) dot(d.x, d.y - 10, s.pr.nests[d.id] ? "#8fd8ff" : "#5a6a7a");
    for (const d of ofType("gate")) if (seen(d.x, d.y + d.h)) dot(d.x + d.w / 2, d.y + d.h / 2, s.pr.gates[d.id] ? "#7ed957" : "#ff6b4a", 3.2);
    for (const d of [...ofType("latch"), ...ofType("garden"), ...ofType("valve"), ...ofType("lift"), ...ofType("basket")])
      if (seen(d.x, d.y ?? d.baseRow * T)) dot(d.x + (d.w || 0) / 2, d.y ?? d.baseRow * T, "#e8c8ff", 1.8);
    dot(s.player.x, s.player.y - 20, "#ff7a3c", 3.4);
    el.mapLegend.textContent = `Lapisan ${here + 1}/13 · ${AREA_NAMES[here]} · Benih ${s.pr.seeds || 0}/${info.seedTotal} · Bulu ${s.pr.feathers || 0}/${info.featherTotal}`;
    return true;
  }

  // Wardrobe: one card per skin with a live idle-frame preview.
  function buildSkins(s, info) {
    const grid = root.querySelector(".skin-grid");
    if (!grid.childElementCount) {
      for (const k of info.skins) {
        const b = document.createElement("button");
        b.className = "skin-card";
        b.dataset.skin = k.id;
        b.style.setProperty("--skin-col", k.col);
        b.innerHTML = `<canvas width="96" height="96"></canvas><span class="control-label">${k.name}</span>`;
        b.addEventListener("click", () => info.onSkin(k.id));
        grid.appendChild(b);
      }
      info.store.prefetch(info.skins.map((k) => `${k.prefix}_BASIC`));
    }
    for (const b of grid.children) {
      const k = info.skins.find((q) => q.id === b.dataset.skin);
      b.classList.toggle("on", s.pr.skin === k.id);
      const key = `${k.prefix}_BASIC`;
      const im = info.store.img[key];
      const f = info.store.anims[key]?.idle?.[0];
      const cv = b.querySelector("canvas");
      if (!im || !f || cv.dataset.drawn) continue;
      const g = cv.getContext("2d");
      const c = f.content;
      const sc = Math.min(88 / c.w, 88 / c.h);
      g.clearRect(0, 0, 96, 96);
      g.drawImage(im, c.x, c.y, c.w, c.h, 48 - (c.w * sc) / 2, 92 - c.h * sc, c.w * sc, c.h * sc);
      cv.dataset.drawn = "1";
    }
  }

  function setLoading(frac, text) {
    el.loadingBar.style.width = `${Math.round(frac * 100)}%`;
    if (text) el.loadingText.textContent = text;
  }

  return { root, el, sync, drawMap, setLoading };
}
