# Dewhaven — versi Unity

Rancangan awal disusun **14 Oktober 2026**; implementasi native diperluas **18 Oktober 2026** dan VO ditambahkan **19 Oktober 2026**. APK web tetap berada di `release/Dewhaven-debug.apk`, dan preview Unity sebelumnya tetap disimpan terpisah. Editor/MCP Dewhaven memakai proyek khusus di `unity/Dewhaven` dan port lokal 8094.

**Pengerjaan 18 Oktober:** fondasi farming kini terhubung ke 24 bab utama, 60 permintaan, 36 adegan kedekatan, 12 kegiatan tahunan dan empat pertemuan mingguan. Tiga dungeon mempunyai total 15 ruang dan sembilan puzzle tersimpan; ada lima lantai tambang, 38 lokasi pekerjaan, pemulihan ruang publik, dan pengambilan konvoi pada pagi berikutnya. Save lama dapat dipratinjau dan diimpor dengan arsip pengaman; SDK iklan Google memakai ID uji. [Catatan pengerjaan dan bukti](execution.md) membedakan implementasi dari hal yang belum diperiksa di perangkat.

[APK terbaru: Dewhaven 2.2 VO](../../release/Dewhaven-Unity-2.2-VO.apk) berhasil dibangun dan diperiksa pada **19 Oktober**, ukuran 77.208.840 byte. Intro empat halaman dan tujuan/pembukaan/penyelesaian seluruh 24 main quest memakai VO English: 76 bagian, 177 rekaman kalimat, 16 suara Deepgram Aura-2, durasi 550,88 detik. Audio dibundel untuk offline, dengan Replay dan volume terpisah melalui Settings → Audio → Voiceover & narration. [Catatan instalasi](../../release/Dewhaven-Unity-2.2-VO-README.md), [metadata pemeriksaan](../../release/Dewhaven-Unity-2.2-VO-info.json), [checksum](../../release/Dewhaven-Unity-2.2-VO.sha256), [cakupan dan rancangan VO](voiceover-plan.md), serta [bukti sumber/paket tidak membawa kredensial](voiceover-security-audit.json) tersedia.

[APK campaign 2.1](../../release/Dewhaven-Unity-2.1.apk) dan [preview Unity 15 Oktober](../../release/Dewhaven-Unity-preview.apk) tetap disimpan terpisah. HUD memakai 14 ilustrasi transparan; halaman tas, toko dan menu memakai sandstone/champagne terang dengan teks espresso dan aksen bronze. [Jalan kota](captures/campaign-town-street.png), [pelabuhan](captures/campaign-quay-street.png), [dialog kedekatan](captures/campaign-bond.png), [diagram dengan teks 135%](captures/campaign-puzzle-three-large-short.png), dan [art beserta prompt](hud-icon-generation.json).

## Lihat dulu dunianya

Atlas interaktif (`atlas.html`, atau [pratinjau lokal](http://localhost:5192/atlas.html)) menyimpan sprite berlisensi dan font di dalam berkas agar bisa dibuka offline. Berkas itu tetap lokal pada ekspor GitHub publik; pulihkan dari salinan berlisensi atau buat ulang dengan alat atlas setelah [aset dipulihkan](../RESTORING-LICENSED-ASSETS.md). Screenshot komposisi dunia tetap tersedia di `captures/`.

- **Valley**: hubungan 13 kawasan luar dan jalan menuju dungeon.
- **Towns**: empat kota, distrik, 44 bangunan kota, denah interior, dan rute dari gerbang.
- **Dungeons**: lima ruang untuk tiap kompleks, tujuan puzzle dan jalur kembali.
- **Daily life**: 25 warga, sprite berbeda, lokasi kerja, rumah, dan jadwal harian.
- **Story**: 24 bab dalam empat bagian, pemberi misi, tujuan dan perubahan ceritanya.

## Skala yang dirancang

| Bagian | Target konten |
| --- | ---: |
| Kota utama | 4 |
| Kawasan luar, termasuk empat jalur petualangan | 13 |
| Interior: 44 di kota, 4 di farm/hutan/danau | 48 |
| Kompleks dungeon | 3 × 5 ruang |
| Lantai tambang | 5 |
| Jumlah kawasan/ruang yang dapat dimainkan | **81** |
| Warga bernama, masing-masing memakai sprite berbeda | 25 |
| Penampilan pemain yang berbeda, tanpa pewarnaan ulang | 4 |
| Toko/layanan perdagangan | 16 |
| Bab utama / quest sampingan | 24 / 60 |
| Event tahunan / pertemuan mingguan | 12 / 4 |
| Kandidat romance dewasa / adegan kedekatan | 6 / 36 |

Angka kawasan tidak sama dengan jumlah scene yang dimuat bersamaan. Satu Bootstrap native menyusun kawasan aktif; permukaan dibagi menjadi mesh chunk dan kawasan sebelumnya dilepas. Ini bukan streaming jarak per chunk. Interior/dungeon dibangun saat masuk. Audit membangun seluruh 81 kawasan dan memeriksa rute interaksinya; pemolesan artistik dan pengukuran kinerja Android masih terbuka.

## Keputusan utama

Belanja, upgrade, memasak, pengiriman, tidur dan merawat ternak dilakukan di tempatnya. Menu pribadi berisi peta, jurnal, tas, warga, kalender, panduan, simpan dan pengaturan. Semua bangunan rumah yang terlihat mempunyai interior dan pintu kembali yang tepat.

Setiap kota punya kegiatan dan susunan sendiri: **Dewhaven** untuk kebun dan kerajinan, **Aster Quay** untuk kanal dan pelabuhan, **Sunridge** untuk kebun bertingkat, **Briar Hollow** untuk arsip dan jalur pegunungan. Jalan membentuk putaran dan jalur pintas; papan penunjuk dibatasi tiga yang penting per kota.

NPC berjalan ke pekerjaan, melakukan tugas, berkunjung dan pulang. Dialog memakai panel percakapan ringkas, speaker yang jelas, teks besar dan pilihan respons. Profil warga dipisahkan dari percakapan. Dungeon dicapai lewat tebing, bekas tambang batu atau pendakian, dengan pintu masuk dan penjelasan singkat sebelum masuk.

English tetap bahasa bawaan. Tema UI sandstone/champagne–espresso–bronze, terang dan tidak putih. Kontrol portrait memakai joystick fleksibel, shortcut alat di sisi aksi dan pengaturan lengkap. Wajah pixel sprite boleh tampil; lukisan generated berisi lanskap atau benda mati. Audio berupa VO, ambience alam dan SFX fisik, tanpa musik atau alat musik. Provenance foley tercatat di [foley-sources.json](foley-sources.json), dan sumber VO di [voiceover-generation.json](voiceover-generation.json).

## Dokumen untuk pengerjaan

- [Spesifikasi lengkap](../superpowers/specs/2026-10-14-dewhaven-unity-design.md)
- [Rencana implementasi bertahap](../superpowers/plans/2026-10-14-dewhaven-unity.md)
- [Arahan visual dan contoh dialog](presentation.md)
- [Pemetaan aset dan migrasi](migration.md)
- [Katalog dunia](data/world.json), [kota](data/towns.json), [interior](data/interiors.json)
- [Warga](data/residents.json), [toko](data/shops.json), [quest dan event](data/quests.json), [36 adegan kedekatan](data/bonds.json), [dungeon](data/dungeons.json)
- [Audit aset lokal](data/asset-audit.json)

Loop farming dan integrasi 15 ruang dungeon sudah diperiksa di player Unity. Pemeriksaan domain terakhir pada 19 Oktober: 25 lulus, termasuk tiga kasus narasi serta pergantian musim dan batas greenhouse; audit konten tidak menemukan masalah pada 325 anchor. Pemeriksaan bab memakai prasyarat yang sengaja dipenuhi, dan navigasi dungeon memakai rute/penempatan pada anchor, sehingga bukan bukti seluruh kampanye sudah dimainkan alami. Pemutaran VO, pergantian halaman, mute dan jeda/resume latar diperiksa di player native. Belum ada ponsel terhubung: performa, kontrol sentuh nyata, rute audio/interupsi, tampilan iklan dan pemilih file Android masih perlu penerimaan perangkat. Kualitas AAA penuh dan kesiapan Play Store belum dinyatakan selesai.

Untuk membuat ulang katalog rancangan: `node tools/design-unity.mjs`, lalu `node tools/render-unity-atlas.mjs`. Keduanya hanya menghasilkan dokumen dan pratinjau lokal, tidak terhubung ke editor Unity.
