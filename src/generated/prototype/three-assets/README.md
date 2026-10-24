# Treecord 3D Assets

Aset Three.js (r186) untuk landing page, berdiri sendiri, dan semuanya dibuat dari kode. Tidak ada file model atau tekstur. Konsep panggungnya ada di [../foundation.md](../foundation.md).

## Jalankan preview

```sh
cd three-assets
python -m http.server 5178        # atau: npx serve
# buka http://127.0.0.1:5178
node check.mjs                    # self-check helper (seed, scatter, hash)
```

Panel kanan berisi view solo per aset, preset kamera B0/B1/B2/B6, slider, dan tombol ▶ untuk memutar animasinya. Bisa juga lewat URL, contohnya `?view=Lineup&preset=Lineup` atau `?preset=B6%20carbon%20high&clusters=1&carbon=0.6`.

## Aset

| File               | Aset                                                                                                                                                                                                                                                                         | Kontrol (tween dari GSAP nanti)                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/tree.js`      | Geometry 2 spesies (broadleaf tropis, conifer bertingkat) + material angin                                                                                                                                                                                                   | `treeUniforms.uWind`, `uTime`                                                            |
| `src/forest.js`    | Hutan sekitar 4.000 pohon dalam **4 draw call** (InstancedMesh). Tumbuh dari pohon utama ke luar, warna per cluster proyek                                                                                                                                                   | `treeUniforms.uGrow` 0..1, `treeUniforms.uCluster` 0..1, `forest.tops` (sumber partikel) |
| `src/hero-tree.js` | Pohon utama: bibit → muda → dewasa dalam satu mesh, gundukan tanah, cincin fokus berdenyut                                                                                                                                                                                   | `hero.growth` 0..1, `hero.focus` 0..1, `hero.update(t)`                                  |
| `src/ground.js`    | Tanah low-poly berbukit, datar di sekitar pohon utama                                                                                                                                                                                                                        | `heightAt(x, z)`                                                                         |
| `src/sky.js`       | Kehidupan langit: **awan** low-poly yang melayang (tanpa kabut, opacity bisa diatur), **pegunungan dan gunung berapi** berlapis di cakrawala yang kakinya memudar ke kabut, **kawanan burung** (kepak sayap di shader), dan **daun berjatuhan** yang selalu mengikuti kamera | `clouds.opacity`, `leaves.update(t, cameraPosition)`, `update(t)`                        |
| `src/palette.js`   | Satu sumber warna untuk 3D dan SVG                                                                                                                                                                                                                                           |                                                                                          |
| `src/carbon.js`    | 2.400 partikel naik dari pucuk pohon lalu membentuk koin (1 credit = 1 pemilik)                                                                                                                                                                                              | `carbon.uniforms.uProgress` 0..1, `carbon.resize(h, fov, dpr)`                           |

Pertumbuhan, angin, warna cluster, dan gerak partikel semuanya dihitung di vertex shader. CPU cukup mengubah satu angka uniform per frame.

## Angka (desktop, view Scene)

- 8 draw call, sekitar 537k segitiga, 4.000 pohon. Di HP otomatis 1.200 pohon dan DPR dibatasi 1.5.
- Pohon hutan memakai crown detail 0 (sekitar 4x lebih ringan). Detail 1 hanya untuk pohon utama dan close-up.

## Pindah ke `apps/web` nanti

Modul `src/*` adalah ES module murni yang hanya meng-import `three` dan `three/addons`, jadi bisa di-copy ke `apps/web/app/_landing/` dan diganti ke `.ts`. Bagian `preview.js` (GUI, OrbitControls, tween mini) tidak ikut dipindah: perannya digantikan master timeline GSAP dan `rig` di foundation.md §4.
