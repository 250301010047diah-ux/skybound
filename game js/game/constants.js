// World grid shared by every module. One tile = T world units; the camera
// zooms world units to CSS pixels, so nothing here depends on the frame size.
export const T = 32;
export const COLS = 48;
export const AREA_ROWS = 36;
export const AREA_COUNT = 13;
export const ROWS = AREA_ROWS * AREA_COUNT;
export const WORLD_W = COLS * T;
export const WORLD_H = ROWS * T;

// REAL / MOON tiles are solid only on one side of the mirror world (Area 9).
export const TILE = { EMPTY: 0, SOLID: 1, FERTILE: 2, ONEWAY: 3, VINE: 4, THORN: 5, REAL: 6, MOON: 7 };

// Area 0 is the bottom layer (Lembah), area 12 the crown at the top.
export const AREA_NAMES = [
  "Lembah Akar Embun",
  "Kanopi Jembatan Putus",
  "Kota Air Terbalik",
  "Reruntuhan Matahari Pecah",
  "Menara Lonceng Sunyi",
  "Kepulauan Angin Pengembara",
  "Kebun Bara Senja",
  "Gua Kristal Gemerlap",
  "Danau Cermin Bulan",
  "Mesin Waktu Akar",
  "Sarang Awan Petir",
  "Taman Jamur Senja",
  "Mahkota Bintang",
];
// puzzle: a seal opened by the area's puzzle; bonus: open passage + treasure;
// combat: the seal opens by fighting; final: the crown and the last guardian.
export const AREA_KIND = ["puzzle", "puzzle", "puzzle", "puzzle", "puzzle", "puzzle", "puzzle", "bonus", "puzzle", "puzzle", "combat", "bonus", "final"];
export const AREA_TAG = { puzzle: "", bonus: "Area Bonus", combat: "Area Tempur", final: "Lapisan Terakhir" };

export const areaTopRow = (a) => (AREA_COUNT - 1 - a) * AREA_ROWS;
export const areaOfRow = (row) => Math.max(0, Math.min(AREA_COUNT - 1, AREA_COUNT - 1 - Math.floor(row / AREA_ROWS)));
export const areaOfY = (y) => areaOfRow(Math.floor(y / T));

// Player body (feet-centred). Visual height is larger than the hitbox on purpose:
// the chibi head and hood overhang without making ledges feel unfair.
export const PLAYER_W = 20;
export const PLAYER_H = 44;
export const PLAYER_VIS_H = 60;

export const ARROW_TYPES = ["normal", "sprout", "thread", "echo", "wind", "ember"];
export const ARROW_COST = { normal: 0, sprout: 25, thread: 20, echo: 15, wind: 15, ember: 20 };
export const ARROW_COLOR = { normal: "#f3e2b0", sprout: "#7ed957", thread: "#e8f1ff", echo: "#c08cff", wind: "#9fe6ff", ember: "#ff8a3c" };
export const ARROW_NAME = {
  normal: "Panah biasa",
  sprout: "Panah Tunas",
  thread: "Panah Benang",
  echo: "Panah Gema",
  wind: "Panah Angin",
  ember: "Panah Bara",
};
// FX_C is a repaint of FX_A: the four rows hold new effects but kept the old
// sheet's row names, so reach them through this map rather than by what they
// look like.
export const FXC = { spark: "arrow_hit", fire: "sprout_grow", wind: "splash", bolt: "dust" };

export const ARROW_SPRITE = {
  normal: ["PROPS_B", "arrow_normal"],
  sprout: ["PROPS_B", "arrow_sprout"],
  thread: ["PROPS_B", "arrow_thread"],
  echo: ["PROPS_C", "arrow_echo"],
  wind: ["PROPS_C", "arrow_wind"],
  ember: ["PROPS_C", "arrow_ember"],
};

// Ten outfits plus Aera's own; every skin has the same six sheets and frame layout.
export const SKINS = [
  { id: "aera", name: "Aera", prefix: "AERA", col: "#d9542b" },
  { id: "rimba", name: "Rimba", prefix: "SKIN_RIMBA", col: "#3f7a1c" },
  { id: "salju", name: "Salju", prefix: "SKIN_SALJU", col: "#bfe4ff" },
  { id: "senja", name: "Senja", prefix: "SKIN_SENJA", col: "#7a4bb3" },
  { id: "bara", name: "Bara", prefix: "SKIN_BARA", col: "#b3261e" },
  { id: "samudra", name: "Samudra", prefix: "SKIN_SAMUDRA", col: "#1f9aa0" },
  { id: "sakura", name: "Sakura", prefix: "SKIN_SAKURA", col: "#f2a2c0" },
  { id: "bintang", name: "Malam Bintang", prefix: "SKIN_BINTANG", col: "#1f2f6b" },
  { id: "mentari", name: "Mentari", prefix: "SKIN_MENTARI", col: "#f2c230" },
  { id: "peri", name: "Peri Jamur", prefix: "SKIN_PERI", col: "#d33b2c" },
  { id: "bayangan", name: "Bayangan", prefix: "SKIN_BAYANGAN", col: "#2b3440" },
];
export const SKIN_PARTS = ["BASIC", "AIR", "ACTION", "CLIMB", "BOW", "MISC"];
export const skinById = (id) => SKINS.find((k) => k.id === id) || SKINS[0];
