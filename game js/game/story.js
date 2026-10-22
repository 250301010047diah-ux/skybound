// Every line of player-facing copy for characters, prompts and hints.
// Kept here so the rest of the code reads as mechanics.
import { WATER_TARGET } from "./world.js";

export const NPC_NAMES = {
  bird: "Burung Pemandu",
  lumi: "Tetua Lumi",
  simpul: "Pak Simpul",
  nira: "Nira",
  sora: "Penjaga Kuil Sora",
  librarian: "Pustakawan Gema",
  bayu: "Bayu",
  rara: "Rara",
  hermit: "Pertapa Bulan",
  tiko: "Tiko",
  guntur: "Guntur",
  spirit: "Roh Pohon",
};

export function npcLines(npc, pr) {
  switch (npc) {
    case "bird":
      if (!pr.bosses.boss1)
        return [
          "Cip! Aera, pohonnya menutup diri semalam!",
          "Tetua Lumi ada di taman kanan bawah. Lompati duri ungu itu, ya.",
          "Dinding yang terlalu tinggi? Lompat ke arahnya — kamu bisa berpegangan di tepi.",
        ];
      if (!pr.abilities.sprout) return ["Induk Lumut sudah tenang! Bicaralah dengan Tetua Lumi."];
      return [
        "Akar yang dialiri embun berwarna biru. Kuncup hijau berarti siap ditumbuhkan!",
        "Tembak pengait batu untuk membuka saluran. Sambungan akar bisa diputar dengan panah.",
      ];
    case "lumi":
      if (!pr.bosses.boss1) return ["Aera! Induk Lumut mengamuk di tamanku… hati-hati!"];
      if (!pr.abilities.sprout)
        return [
          "Terima kasih, Nak. Taman ini hampir mati, tapi busurmu bisa menolongnya.",
          "Ambil Panah Tunas ini. Tembakkan ke akar subur yang bercahaya hijau, dan pijakan akan tumbuh.",
          "Embun di tengah lembah harus mengalir ke tiga kebun. Kalau ketiganya mekar, akar mati di atas akan menjadi tangga.",
        ];
      return ["Tiga kebun, tiga cahaya. Akar mati di puncak lembah akan mengingat jalan pulang."];
    case "simpul":
      if (!pr.abilities.thread)
        return [
          "Hah! Pemanah dari bawah? Jembatan kami putus semua sejak pohon menutup.",
          "Bawa Panah Benang ini. Ia menempel pada cincin jangkar — tembak, lalu berayunlah!",
          "Benangnya juga bisa menarik benda ringan, seperti buah batu, langsung ke tanganmu.",
          "Pintu kayu di atas butuh tiga lift sejajar dengan tanda di tiangnya. Bentuk buah = bobotnya.",
        ];
      return [
        "Bulat itu satu, segitiga dua, kotak tiga. Lift makin tinggi kalau keranjangnya makin berat.",
        "Kalau sudah pas, panah pasak merahnya supaya terkunci. Tuas di dek kiri mengosongkan keranjang.",
      ];
    case "nira":
      if (pr.gates.dome) return ["Kubahnya sudah jadi arus! Naiklah dari ruang Penjaga Kanal."];
      return [
        "Selamat datang di Kota Air Terbalik. Airnya mengalir ke atas, tapi tekanannya kacau.",
        "Mural di sebelahku menunjukkan ketinggian yang benar untuk tiga waduk.",
        "Katup Sumber mengisi waduk bawah. Katup Hubung ada di tepian kiri — rakit bisa membawamu ke sana.",
        "Kalau kacau, tarik tuas di sebelah mural untuk mengosongkan semuanya.",
      ];
    case "sora":
      if (pr.gates.gate4) return ["Mata Sang Penjaga terbuka. Matahari kembali menyinari kuil."];
      return [
        "Kuil ini dulu memantulkan matahari ke seluruh pohon.",
        "Panah penutup lensa di langit-langit, lalu putar cermin dengan panahmu.",
        "Cermin terakhir terkunci dari belakang — jembatan cahaya bisa membawamu ke sana.",
        "Prisma akan membagi cahaya ke tiga mata patung.",
      ];
    case "librarian":
      if (!pr.abilities.echo)
        return [
          "Sst… menara ini kehilangan lagunya.",
          "Ambil Panah Gema. Lonceng dan kristal resonansi hanya menjawab gema.",
          "Tiga mural menyimpan potongan lagu. Baca semuanya, lalu bunyikan lima lonceng di aula atas sesuai urutan.",
        ];
      return ["Kristal ungu di dek tengah memunculkan jembatan sesaat. Mural ketiga ada di seberangnya."];
    case "bayu":
      if (!pr.abilities.wind)
        return [
          "Angin di sini liar sekali! Benih besar itu harus sampai ke rumah benih di atas.",
          "Bawa Panah Angin ini. Tembak kipas untuk memutar arahnya: atas, kanan, kiri.",
          "Benihnya mengikuti angin. Kalau jatuh ke duri, ia kembali ke sarang singgah terakhir.",
        ];
      return ["Kipas yang mengarah ke atas juga bisa mengangkatmu, lho!"];
    case "rara":
      if (!pr.abilities.ember)
        return [
          "Bunga raksasa di atas membeku karena kebun ini kehilangan kehangatannya.",
          "Ini Panah Bara. Nyalakan tungku di tengah, dan bakar semak kering yang menutup rumah kaca.",
          "Setiap rumah kaca harus HANGAT — bunga hijau. Biru terlalu dingin, merah terlalu panas.",
          "Panah ventilasi untuk membuka atau menutupnya. Satu ventilasi bisa menghangatkan dua ruang!",
        ];
      return ["Hitung dari pipanya: tiap ventilasi terbuka menambah panas ke ruang yang disambungnya."];
    case "hermit":
      if (pr.gates.gate9) return ["Pantulan dan kenyataan kini selaras."];
      return [
        "Danau ini menyimpan dua dunia. Sentuh altar untuk berpindah ke Sisi Pantulan.",
        "Di Sisi Pantulan, jalan bulan muncul dan pintu menunjukkan fase bulan yang dicarinya.",
        "Panah patung bulan untuk mengubah fasenya sampai cocok dengan pintu.",
      ];
    case "tiko":
      if (pr.gates.gate10) return ["Detaknya kembali selaras! Mantap!"];
      return [
        "Tiga roda akar di ruang kontrol berputar tidak seirama.",
        "Panah pasak di bawah roda untuk menahannya. Tahan tiap roda saat daun akarnya tepat di atas.",
        "Kalau ketiganya tertahan sejajar, panah inti biru di ujung ruangan.",
        "Hati-hati dengan bandul dan Golem Jam yang menjaga ruang itu!",
      ];
    case "guntur":
      if (pr.gates.gate11) return ["Badai sudah jinak. Naiklah, Pemanah."];
      return [
        "Tak ada teka-teki di sini — hanya badai.",
        "Hancurkan tiga totem petir dan kalahkan Naga Awan, maka segel petir padam.",
      ];
    case "spirit":
      if (pr.gates.gate13) return ["Jantung pohon menunggumu di dalam cangkang. Bebaskan penjaganya."];
      return [
        "Kau sampai di mahkota, Aera. Jantung pohon terkunci di cangkang bintang.",
        "Hubungkan simpul bintang dengan Panah Benang: tembak satu simpul, lalu simpul lain.",
        "Angka titik di bawah tiap bintang adalah jumlah benangnya. Akar hitam tak bisa dilewati benang.",
        "Semua bintang harus tersambung menjadi satu rasi.",
      ];
    default:
      return ["…"];
  }
}

export const MURAL_LINES = [
  `Mural Tiga Waduk: bawah ${"●".repeat(WATER_TARGET.L)}, tengah ${"●".repeat(WATER_TARGET.M)}, atas ${"●".repeat(WATER_TARGET.U)}.`,
  "Air hanya bisa berpindah ke atas: sumber → bawah → tengah → atas.",
];

// Current objective for the player's area, with three hint tiers.
export function objective(pr, area) {
  if (area === 0) {
    if (!pr.bosses.boss1)
      return ["Temui Tetua Lumi di taman kanan bawah.", "Induk Lumut menjaga taman itu. Panah dia saat mendarat.", "Lompati duri ungu, naiki balok tinggi dengan berpegangan di tepinya, lalu terus ke kanan."];
    if (!pr.abilities.sprout) return ["Bicara dengan Tetua Lumi.", "Ia berdiri di ujung kanan taman.", "Dekati dia lalu tekan tombol tangan."];
    if (!pr.gates.gate1) {
      const missing = [];
      if (!pr.latches.latchL) missing.push(["Pengait di gua kiri masih tertutup.", "Panjat sulur di ujung kiri bawah, masuk gua, lalu panah pengait batu."]);
      else if (!pr.gardens.gardenL) missing.push(["Kebun di gua kiri sudah basah tapi belum tumbuh.", "Ganti ke Panah Tunas (slot panah), lalu tembak kebun di gua."]);
      if (!pr.latches.latchR) missing.push(["Pengait kanan di tiang akar masih tertutup.", "Dari dek tengah, panah pengait di sisi kanan tiang akar."]);
      else if (pr.switches.switchR !== 1) missing.push(["Sambungan akar di kanopi kanan mengarah ke ujung buntu.", "Naik ke kanopi kanan dan panah roda sambungan sekali."]);
      else if (!pr.gardens.gardenR) missing.push(["Kebun di kanopi kanan sudah basah.", "Tembak kebun kanopi dengan Panah Tunas."]);
      if (!pr.latches.latchU) missing.push(["Pengait atas di sisi kiri tiang akar masih tertutup.", "Dari dek tengah, bidik ke kanan atas ke pengait di tiang."]);
      else if (!pr.gardens.gardenU) missing.push(["Kebun di landasan gerbang sudah basah.", "Tumbuhkan pijakan di dinding hijau kiri dek tengah, naik, lalu tembak kebunnya."]);
      const m = missing[0] ?? ["Semua kebun hampir siap.", "Periksa kebun yang belum mekar."];
      return ["Alirkan embun ke tiga kebun, lalu tumbuhkan dengan Panah Tunas.", m[0], m[1]];
    }
    return ["Naiki tangga akar di atas landasan gerbang.", "Landasan gerbang ada di atas dek tengah.", "Tumbuhkan pijakan di dinding hijau, atau lewat tiang akar dari kanopi kanan."];
  }
  if (area === 1) {
    if (!pr.abilities.thread) return ["Temui Pak Simpul di sarang kiri bawah.", "Ia tinggal di ujung kiri lantai kanopi.", "Jalan ke kiri dari tangga akar."];
    if (!pr.gates.door2) {
      const w = pr.basketW || { A: 0, B: 0, C: 0 };
      const need = { A: 1, B: 2, C: 3 };
      const names = { A: "pertama", B: "kedua", C: "ketiga" };
      for (const k of ["A", "B", "C"]) {
        if (pr.locked[k]) continue;
        if (w[k] !== need[k])
          return [
            "Sejajarkan ketiga lift dengan tanda di tiang, lalu panah pasaknya.",
            w[k] < need[k] ? `Lift ${names[k]} masih terlalu rendah.` : `Lift ${names[k]} terlalu tinggi.`,
            "Bentuk buah = bobot: bulat 1, segitiga 2, kotak 3. Tarik buah dengan Panah Benang, bawa ke keranjang dan tekan tombol tangan.",
          ];
        return ["Sejajarkan ketiga lift, lalu panah pasaknya.", `Lift ${names[k]} sudah sejajar.`, "Tembak pasak merah di tiangnya agar terkunci."];
      }
      return ["Pintu kayu sedang terbuka.", "Naik lewat lift yang terkunci.", "Lompat dari lift ketiga ke landasan."];
    }
    return ["Naik melalui pintu kayu yang terbuka.", "Landasan pintu ada di atas lift ketiga.", "Gunakan lift terkunci sebagai tangga."];
  }
  if (area >= 3) return objective2(pr, area);
  if (!pr.gates.dome) {
    const w = pr.water;
    const t = WATER_TARGET;
    let tip;
    if (w.L > t.L && w.M >= t.M) tip = ["Waduk bawah terlalu penuh.", "Putar Katup Buang di lantai bawah."];
    else if (w.U < t.U && w.M === 0) tip = ["Waduk tengah kosong, jadi waduk atas tak bisa diisi.", "Isi waduk bawah, lalu pakai Katup Hubung di tepian kiri."];
    else if (w.U < t.U) tip = ["Waduk atas belum cukup.", "Naik rakit tengah ke kanal kanan, kalahkan penjaganya, lalu putar Katup Kanal."];
    else if (w.U > t.U) tip = ["Waduk atas terlalu penuh.", "Tarik tuas reset di sebelah mural lalu ulangi lebih hati-hati."];
    else if (w.M < t.M) tip = ["Waduk tengah masih kurang.", "Pindahkan air dari waduk bawah lewat Katup Hubung."];
    else if (w.M > t.M) tip = ["Waduk tengah terlalu penuh.", "Pindahkan air tengah ke atas lewat Katup Kanal, atau reset."];
    else if (w.L < t.L) tip = ["Waduk bawah masih kurang.", "Putar Katup Sumber sekali."];
    else tip = ["Tekanannya hampir seimbang.", "Periksa mural."];
    return ["Samakan ketinggian tiga waduk dengan mural.", tip[0], tip[1]];
  }
  return ["Naiki arus air di ruang Penjaga Kanal.", "Ruangnya di ujung kanal kanan atas.", "Masuk ke kolom air yang naik di langit-langit."];
}

function objective2(pr, area) {
  const up = "Naik melalui segel yang terbuka.";
  switch (area) {
    case 3:
      if (pr.gates.gate4) return [up, "Tangga ada di atas landasan kiri.", "Naiki teras barat, lalu landasan."];
      if (!pr.latches.lens4) return ["Nyalakan Mata Sang Penjaga.", "Lensa matahari di langit-langit masih tertutup.", "Panah penutup lensa tepat di atas teras barat."];
      if (!pr.unlocked.pin4) return ["Nyalakan Mata Sang Penjaga.", "Cermin kanan terkunci dari belakang.", "Arahkan cermin kiri agar cahaya ke kanan, lalu seberangi jembatan cahaya ke tepian timur dan panah pengunci."];
      return ["Nyalakan tiga mata patung.", "Cahaya harus turun ke prisma.", "Putar cermin kanan agar cahaya memantul ke bawah."];
    case 4:
      if (!pr.abilities.echo) return ["Temui Pustakawan Gema.", "Ia di lantai bawah dekat pintu masuk.", "Tekan tombol tangan di dekatnya."];
      if (pr.gates.gate5) return [up, "Landasan ada di kanan aula lonceng.", "Lompat dari ujung kanan aula."];
      return ["Bunyikan lima lonceng sesuai lagu.", "Baca tiga mural: lantai bawah, tepian kanan, dan tepian barat.", "Mural barat hanya bisa dicapai lewat jembatan gema dari kristal ungu."];
    case 5:
      if (!pr.abilities.wind) return ["Temui Bayu.", "Ia di lantai kanan dekat pintu masuk.", "Tekan tombol tangan di dekatnya."];
      if (pr.gates.gate6) return [up, "Landasan ada di kiri atas.", "Naiki pijakan kanan sampai jembatan atas."];
      return ["Antar benih besar ke rumah benih.", "Arahkan kipas: kiri bawah ke kanan, kipas tanah ke atas, kipas dek ke kanan, kipas ujung dek ke atas, kipas atas ke kiri.", "Panah benihnya untuk mendorongnya kalau tersangkut."];
    case 6:
      if (!pr.abilities.ember) return ["Temui Rara.", "Ia di lantai bawah dekat pintu masuk.", "Tekan tombol tangan di dekatnya."];
      if (pr.gates.gate7) return [up, "Landasan ada di kanan atas.", "Naiki atap rumah kaca kanan."];
      if (!pr.furnace) return ["Hangatkan tiga rumah kaca.", "Tungku di tengah masih dingin.", "Tembak tungku dengan Panah Bara."];
      return ["Buat ketiga rumah kaca hangat (hijau).", "Merah = dua ventilasi terbuka; biru = tak ada.", "Coba hanya buka ventilasi kiri atas dan kanan, atau hanya tengah dan dekat tungku."];
    case 7:
      return ["Area bonus! Jelajahi gua kristal.", "Buka peti harta dan sentuh kristal di dekat pintu masuk untuk tantangan.", "Kumpulkan 8 kristal dalam 40 detik untuk membuka peti di aula atas. Jalan naik ada di kiri atas."];
    case 8:
      if (pr.gates.gate9) return [up, "Landasan di kanan atas.", "Dari teras bulan, gunakan jalan bulan di Sisi Pantulan."];
      return ["Cocokkan tiga patung bulan dengan pintu.", "Fase yang dicari hanya terlihat di Sisi Pantulan.", "Sentuh altar, lihat pintu, lalu panah patung sampai fasenya sama."];
    case 9:
      if (pr.gates.gate10) return [up, "Landasan ada di kiri atas.", "Lompat dari ujung kiri ruang kontrol."];
      return ["Selaraskan tiga roda akar.", "Tahan tiap roda saat penanda daunnya di atas.", "Panah pasak di bawah roda, lalu panah inti biru di kanan."];
    case 10:
      if (pr.gates.gate11) return [up, "Landasan di kanan atas.", "Naik dari panggung badai."];
      return ["Padamkan segel petir.", "Hancurkan tiga totem petir dan kalahkan Naga Awan.", "Totem ada di lantai, tepian kiri, dan tepian kanan atas."];
    case 11:
      return ["Area bonus! Taman jamur yang memantul.", "Lompat ke jamur untuk melambung tinggi.", "Nyalakan empat lampu spora sesuai titiknya untuk membuka peti bawah. Jalan naik ada di kiri atas."];
    default:
      if (!pr.gates.gate13) return ["Bentuk Rasi Kehidupan.", "Hubungkan bintang dengan Panah Benang sesuai jumlah titiknya.", "Tembak satu simpul lalu simpul lain untuk memasang atau melepas benang."];
      return ["Bebaskan Penjaga Mahkota.", "Masuk ke cangkang jantung lewat lubang di atas pijakan tengah.", "Hindari serangannya dan panah saat ia menukik."];
  }
}
