# Treecord Landing (prototype)

> **Superseded** by the React + Vite + TypeScript app in [`../landing-app`](../landing-app), which clones this prototype's functionality and look and is tested against it. Its plan and status are in [`../landing-app/phases.md`](../landing-app/phases.md). This folder stays as the reference the app is compared with, and the preview that `svg-assets` and `three-assets` serve.

Semua bagian digabung jadi satu panggung sesuai [../foundation.md](../foundation.md): hutan 3D di belakang, aset SVG di tengah, headline di depan. Ketiganya digerakkan oleh satu timeline yang di-scrub scroll.

## Jalankan

```sh
# dari folder treecord (landing meng-import ../three-assets dan ../svg-assets)
python -m http.server 5178
# buka http://127.0.0.1:5178/landing/
```

`?at=<beat>,<progress>` melompat ke satu titik untuk review, misalnya `?at=survival,0.5`. Progress negatif berarti di tengah transisi menuju beat itu, contohnya `?at=carbon,-0.2`.

## Isi folder

| File         | Isi                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `index.html` | Layout panggung, token warna, import map (three 0.186.1, gsap 3.15.0)                                                    |
| `stage3d.js` | Scene 3D. Satu objek `rig` (kamera, kabut, pertumbuhan, cluster, karbon) yang di-tween timeline, lalu dibaca saat render |
| `main.js`    | Delapan beat, transisi kamera di antaranya, dan satu master timeline + ScrollTrigger                                     |

Tidak ada aset yang disalin. Semuanya di-import dari `three-assets/src`, `svg-assets/src`, dan naskah `svg-assets/src/story.js`.

## Perjalanan kamera

| Beat        | Masuk lewat | 3D                                                  | 2D                                              |
| ----------- | ----------- | --------------------------------------------------- | ----------------------------------------------- |
| B0 hero     | (load)      | Hutan tumbuh mengelilingi bibit                     | Hook, logo terbentuk                            |
| B1 seedling | zoom in     | Kamera turun ke bibit 3D, cincin fokus menyala      | Headline                                        |
| B2 problems | pan kanan   | Kamera naik di atas kanopi, kabut jadi latar kertas | Strip 3 panel SVG                               |
| B3 proof    | zoom in     | (latar kertas)                                      | HP, GPS, tameng                                 |
| B4 pipeline | pan kanan   | (latar kertas, kamera ikut bergeser)                | Jalur bukti                                     |
| B5 survival | pan kiri    | Kembali ke pohon 3D, yang tumbuh selama 36 bulan    | Track milestone SVG, satu progress dengan pohon |
| B6 carbon   | zoom out    | Kamera tinggi, cluster berwarna, partikel jadi koin | Serial registry                                 |
| B7 roles    | zoom out    | Wide shot, pohon sudah dewasa                       | Ikon role, CTA                                  |

## Catatan

- **Tanpa kata hantu.** Kata latar raksasa (ALIVE, TRUST, dan seterusnya) hanya ada di preview SVG. Di landing, kata itu bertabrakan dengan hutan 3D dan teks, sedangkan kedalamannya sudah diberikan oleh 3D.
- **Layar pendek (tablet landscape):** sudah dicek di 1000×560. Diagram pipeline dibatasi tingginya, headline selalu berada di atas panel kaca, dan beat survival menaruh kata di kiri dengan pohon 3D di kanan.
- **Reduced motion:** tanpa pin dan tanpa scrub. Semua beat tampil sebagai artikel dalam state akhirnya (coretan sudah tergambar), dengan 3D sebagai latar diam.
- **Resize:** posisi coretan dan mask baris diukur sekali, jadi lebar jendela yang berubah akan me-reload halaman (`ponytail:` di `main.js`). Di versi `apps/web`, ganti dengan pengukuran ulang lewat `autoSplit` milik SplitText.
- **Konten dibuat JavaScript.** Tanpa JS, halaman kosong selain footer. Saat dipindah ke `apps/web`, render markup beat di server (Next.js) dan biarkan JS hanya menganimasikan.
- **Belum diuji di perangkat nyata.** Screenshot diambil dengan Chrome headless (render CPU). Performa GPU di laptop dan HP perlu dicek langsung.
