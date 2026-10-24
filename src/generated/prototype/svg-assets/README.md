# Treecord SVG Assets

21 aset SVG untuk landing page, semuanya dibuat dari kode, dan masing-masing punya animasi scroll sendiri. Pasangan dari [../three-assets](../three-assets/README.md). Konsep panggungnya ada di [../foundation.md](../foundation.md).

## Jalankan

```sh
# dari folder treecord (bukan svg-assets): modul ini meng-import palet dan helper dari ../three-assets
python -m http.server 5178
# buka http://127.0.0.1:5178/svg-assets/      (3D: http://127.0.0.1:5178/three-assets/)

node check.mjs   # markup well-formed, deterministik, jadwal tumbuh, data milestone
node build.mjs   # ekspor tiap aset (state akhir) ke dist/*.svg, untuk Figma atau review
```

Lompat langsung ke satu beat lewat URL, misalnya `?at=pipeline,0.5` atau `?at=sheet,0`.

## Kenapa koheren dengan 3D

| Aturan                                                                                                                                                                                 | Di mana                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **Satu palet.** 3D dan SVG sama-sama membaca `three-assets/src/palette.js`                                                                                                             | `src/lowpoly.js`             |
| **Gaya low-poly yang sama.** Bentuk dipecah jadi segitiga dengan satu warna per sisi. `blob()` adalah kembaran 2D icosahedron ber-jitter                                               | `blob`, `fan`, `shadeFaces`  |
| **Arah cahaya sama.** Matahari dari kanan atas, sisi yang menghadapnya lebih terang, seperti DirectionalLight di 3D                                                                    | `lit()`                      |
| **Gradasi daun sama.** `crown()` = `crownColor()` di 3D                                                                                                                                | `src/lowpoly.js`             |
| **Pohon kembar.** Koordinat bagian (1 unit = 100 px), urutan tajuk, dan jadwal tumbuh sama dengan `hero-tree.js`, jadi satu angka progress menumbuhkan pohon 2D dan 3D secara serempak | `src/tree.js`                |
| **Koin karbon** adalah pasangan koin partikel di `carbon.js` 3D                                                                                                                        | `coinSVG({ tone: "green" })` |

## API: setiap aset = markup + timeline 0..1

```js
import { treeSVG, treeGrowth } from './src/tree.js';
el.innerHTML = treeSVG(); // markup string (jalan juga di Node)
const tl = treeGrowth(el.querySelector('svg'), gsap); // paused timeline, durasi 1
master.add(tl.paused(false).duration(0.8), 'b5'); // masukkan ke master timeline yang di-scrub
```

| File              | Aset → timeline                                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/tree.js`     | `treeSVG` → `treeGrowth` (bibit ke pohon), `treeWilt` (bibit layu). `SEEDLING_VIEWBOX` / `TREE_VIEWBOX` untuk zoom                                                                                            |
| `src/objects.js`  | `logoSVG`, `coinSVG` (gold insentif / green karbon), `blindFundingSVG`, `certificateSVG` (retak), `phoneSVG` (+ `PHONE_SCREEN_VIEWBOX`), `gpsSVG`, `shieldSVG`, `serialSVG`, masing-masing dengan `…Timeline` |
| `src/icons.js`    | 4 node pipeline (`video`, `ai`, `donor`, `chain`) + 5 role (`donorRole`, `planter`, `developer`, `verifier`, `buyer`) → `iconTimeline`                                                                        |
| `src/story.js`    | Naskah landing page per beat (hook, kalimat pendukung, CTA). Hanya kata, tanpa timing. Preview menampilkan kata-kata ini dengan SplitText yang sinkron dengan aset                                            |
| `src/diagrams.js` | `pipelineSVG` → `pipelineTimeline` (jalur tergambar, token berjalan, node menyala). `milestonesSVG` → `milestonesTimeline` (bulan 0..36 pada skala waktu asli, ukuran koin = porsi pembayaran)                |

Plugin GSAP yang dipakai: ScrollTrigger, DrawSVG, MotionPath, ScrambleText (semua ada di `gsap@3.15.0`).

## Catatan

- Nilai GPS, waktu, signature, dan serial registry di HP dan label adalah **contoh ilustrasi**, bukan data nyata.
- Teks penting (judul, kalimat) tetap HTML di halaman. SVG hanya memuat teks yang merupakan bagian dari ilustrasi (hash, serial, label bulan), dan semua SVG diberi `aria-hidden`.
- `phoneSVG` memakai `id="tc-screen"` untuk clipPath. Kalau ada dua HP di satu halaman, id-nya perlu dibuat unik.
- `nest()` membungkus `<svg>` bersarang dengan `<g>`, karena browser mengabaikan `transform` pada `<svg>` bersarang.
