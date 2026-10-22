// The game's Creator Tools vocabulary: what exists (catalog), what is on
// screen (describeScene), and what the editor may drive. The SDK talks to
// the editor; this file only describes the game.
//
// The three areas are one hand-built continuous world (src/game/world.js), not
// a list of creator-editable levels, so no level document is declared here.

export function createDevtools({ game }) {
  return {
    game: "Aera: Skybound Roots",

    catalog({ definition, keysFor }) {
      const d = (id, name, opts) => definition(id, name, { tweakKeys: keysFor(id), ...opts });
      return {
        levels: [],
        screens: [],
        definitions: [
          d("def:aera", "Aera", { nodeKinds: ["aera"], sprite: "AERA_BASIC", spriteFrame: "idle", category: "characters" }),
          d("def:bow", "Busur & panah", { nodeKinds: ["arrow"], sprite: "PROPS_B", spriteFrame: "arrow_normal", singleton: false, category: "effects" }),
          d("def:enemy", "Musuh", {
            nodeKinds: [
              "slime",
              "slimeSmall",
              "beetle",
              "swooper",
              "sentry",
              "crab",
              "bubbler",
              "mirrorBeetle",
              "prismWisp",
              "inkBlob",
              "echoHunter",
              "cloudRay",
              "windShooter",
              "emberImp",
              "ashBeetle",
              "crystalCrab",
              "shardFloater",
              "moonMoth",
              "shadowArcher",
              "springBot",
              "gearMouse",
              "stormHawk",
              "thunderCloud",
              "sporePuff",
              "mushroomKnight",
              "starKnight",
              "starWisp",
              "totem",
            ],
            sprite: "ENEMIES_A1",
            spriteFrame: "slime",
            singleton: false,
            category: "hazards",
          }),
          d("def:moss-boss", "Induk Lumut", { nodeKinds: ["moss-boss"], sprite: "BOSS_MOSS", spriteFrame: "idle", category: "hazards" }),
          d("def:eagle-boss", "Elang Ranting", { nodeKinds: ["eagle-boss"], sprite: "BOSS_EAGLE", spriteFrame: "idle", category: "hazards" }),
          d("def:crab-boss", "Penjaga Kanal", { nodeKinds: ["crab-boss"], sprite: "BOSS_CRAB", spriteFrame: "idle", category: "hazards" }),
          d("def:mirror-boss", "Raja Kumbang Cermin", { nodeKinds: ["mirror-boss"], sprite: "BOSS_MIRROR", spriteFrame: "idle", category: "hazards" }),
          d("def:stag-boss", "Rusa Bara", { nodeKinds: ["stag-boss"], sprite: "BOSS_STAG", spriteFrame: "idle", category: "hazards" }),
          d("def:shadow-boss", "Bayangan Aera", { nodeKinds: ["shadow-boss"], sprite: "SKIN_BAYANGAN_BASIC", spriteFrame: "idle", category: "hazards" }),
          d("def:golem-boss", "Golem Jam", { nodeKinds: ["golem-boss"], sprite: "BOSS_GOLEM", spriteFrame: "idle", category: "hazards" }),
          d("def:dragon-boss", "Naga Awan", { nodeKinds: ["dragon-boss"], sprite: "BOSS_DRAGON", spriteFrame: "idle", category: "hazards" }),
          d("def:crown-boss", "Penjaga Mahkota", { nodeKinds: ["crown-boss"], sprite: "BOSS_CROWN", spriteFrame: "idle", category: "hazards" }),
          d("def:npc", "Penduduk pohon", { nodeKinds: ["npc"], sprite: "NPCS", spriteFrame: "lumi", singleton: false, category: "characters" }),
          d("def:checkpoint", "Altar checkpoint", { nodeKinds: ["checkpoint"], sprite: "PROPS_A", spriteFrame: "altar_on", singleton: false, category: "world" }),
          d("def:nest", "Sarang perjalanan", { nodeKinds: ["nest"], sprite: "PROPS_A", spriteFrame: "nest", singleton: false, category: "world" }),
          d("def:seal-gate", "Segel lapisan", { nodeKinds: ["gate"], sprite: "MECHANISMS", spriteFrame: "root_gate", singleton: false, category: "world" }),
          d("def:light", "Sinar matahari", { nodeKinds: ["light"], singleton: false, category: "effects" }),
          d("def:garden", "Kebun embun", { nodeKinds: ["garden"], sprite: "MECHANISMS", spriteFrame: "garden", singleton: false, category: "world" }),
          d("def:channel", "Saluran akar", { nodeKinds: ["channel"], singleton: false, category: "world" }),
          d("def:water", "Waduk air", { nodeKinds: ["water"], singleton: false, category: "world" }),
          d("def:puzzle-prop", "Mekanisme teka-teki", {
            nodeKinds: [
              "latch",
              "switch",
              "valve",
              "lever",
              "anchor",
              "mural",
              "basket",
              "mushroom",
              "spring",
              "lift",
              "fruit",
              "sprout",
              "mirror",
              "eye",
              "bell",
              "fan",
              "pod",
              "vent",
              "furnace",
              "chest",
              "statue",
              "altar",
              "ring",
              "core",
              "starNode",
              "sporeLamp",
            ],
            sprite: "PROPS_A",
            spriteFrame: "latch_closed",
            singleton: false,
            category: "world",
          }),
          d("def:pickup", "Rahasia", { nodeKinds: ["seed", "feather"], sprite: "PROPS_A", spriteFrame: "seed", singleton: false, category: "pickups" }),
          d("def:terrain", "Medan & kamera", { nodeKinds: ["terrain"], sprite: "TEX_A1", category: "world" }),
          d("def:backdrop", "Latar", { nodeKinds: ["backdrop"], sprite: "BG_A1", category: "world" }),
          d("def:effects", "Efek", { nodeKinds: ["fx"], sprite: "FX_A", spriteFrame: "arrow_hit", singleton: false, category: "effects" }),
          d("def:hud", "HUD", { nodeKinds: ["hud"], category: "interface" }),
          d("def:controls", "Kontrol sentuh", { nodeKinds: ["controls"], category: "interface" }),
        ],
      };
    },

    describeScene() {
      return { nodes: game.sceneNodes() };
    },

    getState: () => game.getState(),

    commands: {
      "open-gate-1": {
        label: "Buka segel Lembah",
        icon: "DoorOpen",
        description: "Buka anyaman akar mati menuju Kanopi",
        mutates: true,
        run: () => game.openGate("gate1"),
      },
      "open-door-2": {
        label: "Buka pintu Kanopi",
        icon: "DoorOpen",
        description: "Angkat pintu kayu menuju Kota Air",
        mutates: true,
        run: () => game.openGate("door2"),
      },
      "open-dome": {
        label: "Buka kubah air",
        icon: "Waves",
        description: "Ubah kubah air di puncak menjadi arus naik",
        mutates: true,
        run: () => game.openGate("dome"),
      },
      "next-area": {
        label: "Lompat ke lapisan berikutnya",
        icon: "ArrowUp",
        description: "Pindahkan Aera ke altar pertama lapisan di atasnya",
        mutates: true,
        run: () => game.warpToArea(Math.min(12, game.areaIndex() + 1)),
      },
      "prev-area": {
        label: "Turun satu lapisan",
        icon: "ArrowDown",
        description: "Pindahkan Aera ke altar pertama lapisan di bawahnya",
        mutates: true,
        run: () => game.warpToArea(Math.max(0, game.areaIndex() - 1)),
      },
      respawn: {
        label: "Kembali ke altar",
        icon: "RotateCcw",
        description: "Bangkitkan Aera di altar terakhir",
        mutates: true,
        run: () => game.respawn(),
      },
    },
  };
}
