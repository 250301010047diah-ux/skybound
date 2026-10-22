# Aera Skybound Roots

Game Flutter + Flame berdasarkan game asli di `game js/`. Semua aset game tersedia lokal dan terdaftar di `pubspec.yaml`.

## Menjalankan

```powershell
flutter pub get
flutter run -d emulator-5554
```

APK Android untuk dipasang langsung:

```powershell
powershell -ExecutionPolicy Bypass -File tools/build_android.ps1
```

Hasil: `build/app/outputs/flutter-apk/app-release.apk`. Salinan siap kirim tersedia di `dist/Aera-Skybound-Roots.apk`. Salin APK ke HP Android, buka, dan izinkan instalasi dari aplikasi pengirim bila diminta. APK ini untuk sideload/pengujian dan masih memakai signing debug bawaan proyek, bukan signing distribusi Play Store. iOS memerlukan build dan signing melalui Xcode di macOS.

Script memeriksa library utama untuk ARM 32-bit, ARM 64-bit, dan x86_64 sebelum menyalin APK dan memperbarui checksum di `dist`. Gunakan APK di `dist` untuk dikirim: `flutter run --release` pada emulator dapat menimpa APK di folder build dengan versi khusus x86_64 yang tidak lengkap untuk HP ARM.

## Fitur

- Main menu dengan logo, latar asli, animasi partikel, lanjutkan permainan, bantuan, dan reset progres dengan konfirmasi.
- Tutorial empat langkah setiap masuk permainan; dapat dilewati dan dibuka kembali lewat tombol `?`. Dunia berhenti selama tutorial.
- Tombol speaker untuk mute/unmute; slider musik/efek tersedia di Jeda > Suara.
- Autosave progres/checkpoint saat progres berubah, setiap 15 detik, ketika masuk background, dan saat kembali ke main menu. Save disimpan lokal pada key `skybound.save.v1`; melanjutkan permainan memakai checkpoint terakhir.
- SafeArea untuk notch, status bar, dan area navigasi; layout portrait saja (orientasi dikunci vertikal).
- 13 area asli, puzzle, musuh/boss, enam jenis panah, 11 kostum, dialog, peta, perjalanan antarsarang, dan ending dari sumber.
- Tiap jenis panah punya efek sendiri: kilat lepas busur bernuansa warna panahnya, jejak terbang khas (Tunas menebar daun, Benang memintal sutra, Gema meninggalkan bayangan panah, Angin melingkar, Bara membara), dan ledakan berbeda saat mengenai sasaran. Membidik menampilkan lengkung lintasan panah, titik jatuh, dan cincin tarikan busur; tali Panah Benang digambar sebagai sutra berpilin yang mengendur dan menegang mengikuti ayunan.
- UI di luar dunia permainan memakai satu sistem desain: latar bergerak, panel kaca dan perkamen, tombol dengan tekanan dan kilau, tab geser, bilah bos bersegmen, serta panel dialog dengan papan nama.
- `assets/images/logo.png` menjadi launcher icon Android/iOS/web/desktop dan native splash Android/iOS/web.

## Struktur dan kesetaraan sumber

- `assets/images/`: 127 gambar sumber tanpa perubahan piksel + logo pengguna.
- `assets/json/`: 101 sidecar animasi, katalog/checksum, manifest, dan parameter game. Kotak gambar tiap frame musuh dan bos diukur dari piksel sheet-nya (lihat `tools/frame_measure.mjs`), bukan dari sel grid, supaya capit, sayap, dan pose melompat tidak terpotong. Folder `dummy/dummy/json` sebelumnya berisi duplikat WEBP; sidecar yang benar diambil dari URL aset sumber saat persiapan.
- `assets/audio/`: 5 BGM dan 27 SFX MP3, terhubung ke menu dan gameplay. Daftar fungsi ada di `assets/audio/manifest.json`.
- `assets/runtime/skybound.js`: bundle lokal dari sistem asli.
- `lib/game/`: loop Flame, replay gambar ke Canvas Flutter, cache gambar, input, audio, dan save.
- `lib/ui/`: main menu, tutorial, HUD, kontrol, dialog, dan menu Flutter. `lib/ui/theme.dart` memegang palet, panel, tombol, dan tab yang dipakai seluruh layar.

Logika dunia, fisika, combat, puzzle, cerita, serta urutan gambar tetap JavaScript asli agar mekanik dan level tidak berubah. Android/Windows/Linux menjalankannya melalui QuickJS; iOS/macOS melalui JavaScriptCore; Flutter Web memakai JS browser. Frame digambar oleh Flame/Canvas Flutter, bukan WebView. UI dibuat ulang dengan widget Flutter. Rasterisasi teks, beberapa efek Canvas, dan audio platform dapat berbeda sedikit dari browser; kesamaan piksel penuh belum dijamin. Main menu, tutorial, dan kontrol volume adalah tambahan pada sumber.

Di APK, kode game dan aset hanya dimuat dari bundle aplikasi, tanpa download skrip atau aset saat bermain. Parameter mengikuti `game js/tweaks.json`; file override Creator Tools `.values.json` tidak tersedia di sumber lokal.

## Memperbarui sumber

Node hanya digunakan saat pengembangan, tidak diperlukan untuk memainkan APK.

```powershell
npm.cmd ci --prefix tools
node tools/prepare_assets.mjs
node tools/remeasure_frames.mjs
node tools/build_runtime.mjs
node tools/build_audio.mjs
node tools/verify_assets.mjs
node tools/runtime_test.mjs
dart run flutter_launcher_icons
dart run flutter_native_splash:create
```

`prepare_assets.mjs` memindahkan gambar utama dari `dummy/dummy` bila belum tersedia di assets, mengambil sidecar yang belum ada, dan menerapkan pengukuran crop/fix frame yang sama dengan `sprites.js`. Duplikat gambar di folder `dummy/dummy/json` tidak dipakai. `remeasure_frames.mjs` mengukur ulang kotak frame musuh/bos di `assets/json` tanpa menyentuh gambar, jadi checksum di `catalog.json` tetap sah; `verify_assets.mjs` membandingkan hasilnya kembali dengan piksel sheet.

## Verifikasi

```powershell
flutter analyze
flutter test
node tools/verify_assets.mjs
node tools/runtime_test.mjs
flutter build web --no-wasm-dry-run
node tools/browser_smoke.mjs
```

Tes mencakup input/gerak/lompat/pause, renderer 13 area, kostum, restart/save, checksum aset, kotak frame musuh/bos, enam efek panah dan ayunan tali (termasuk pemeriksaan bahwa setiap perintah Canvas yang dipakai renderer didukung sisi Flutter), render Canvas Flutter, layout HUD, tutorial, dan reset terkonfirmasi. Screenshot pengecekan disimpan di `.dart_tool/skybound_checks/`.

## Mengganti audio dummy

Generator membuat `.mp3` kosong hanya jika file belum ada. File audio proyek saat ini sudah berisi data. Timpa file di `assets/audio/` dengan MP3 asli memakai nama yang sama, lalu restart/build ulang aplikasi. Volume, mute, pause, dan loop BGM sudah terhubung. `node tools/build_audio.mjs` hanya membuat file yang belum ada, tidak menimpa audio pengganti.

BGM: `bgm.mp3` (menu), `bgm_explore.mp3` (area 1–4), `bgm_mystery.mp3` (area 5–9), `bgm_sky.mp3` (area 10–13/ending), `bgm_boss.mp3` (semua boss). Hit pemain/musuh/boss/objek memakai `hit.mp3`; menang boss dan ending memakai `win.mp3`. SFX gerakan berulang diberi jeda, efek identik per frame digabung.

Menu utama memakai `bgm.mp3` dengan loop, mengikuti pengaturan volume/mute tersimpan, dan melanjutkan musik ketika aplikasi kembali aktif. Menu dapat di-scroll dalam SafeArea; orientasi HP dikunci portrait sejak native splash. APK universal terbaru ada di `dist/Aera-Skybound-Roots.apk` (build 3), mendukung ARM 32-bit, ARM 64-bit, dan x86_64. Kirim APK melalui USB/Drive/aplikasi pengirim file lalu buka di HP Android; file lokal ini belum merupakan URL unduhan publik.
