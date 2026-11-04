# Analisis Template — Heritage Aruna

Sumber: `public/templates/heritage-aruna/` (rendered.html 447 KB, 191 resource, manifest.json)

## Identitas
- URL asli: https://attarivitation.com/demo-heritage-series-aruna-v2/
- Page ID WordPress: 324548 (Elementor canvas, semua konten dalam 2 parent container `e-con`)
- Contoh(data demo): Ila & Fachrul — akad 08:00–10:00, resepsi 10:00–14:00, Graha Paramita II Bintaro

## Aset penting
| Aset | Peran |
|---|---|
| `images/Aruna-BACKGROUND-PARRALAX-1.webp` | background tetap (parallax) seluruh halaman |
| `images/Utary-Bride-Groom-03-*.webp` | foto sampul (kolom kiri desktop) |
| `images/Utary-Bride-Groom-CPW-1-*.webp` / `CPP-1-*.webp` | foto mempelai wanita/pria (di dalam frame) |
| `images/Aruna-Frame-Mempelai.webp` | frame foto mempelai |
| `images/Aruna-Amplop.webp` + `Aruna-WAX-SEAL-3-1.webp` | amplop + segel lilin (cover & hero) |
| `images/Aruna-Home-Fallback.webp` | gerbang Jawa + lanskap (bg hero, fallback video) |
| `images/Aruna-EVENT-2.webp` | bg section Akad/Resepsi (lanskap mint, bottom center) |
| `images/Aruna-Group-Floral-*.webp`, `Heritage-Tree.webp`, `Aruna-Bunga-*`, `Aruna-Rambat-1`, `Aruna-Janur-2`, `Aruna-Batik-2-1` | ornamen sudut/section (position absolute) |
| `images/Aruna-CLOSING-2.webp` | bg closing (overlay putih #FFFFFFA3) |
| `fonts/5403Angsana.woff2` | teks utama UI ("angsana") |
| `fonts/Edwardian-Script-ITC-Regular-Webfont.woff2` | judul script (nama mempelai, judul section) |
| `fonts/pinyonscript-*.woff2` | "the story begins..." |
| `fonts/lora-*.woff2` | label kecil (OPEN THE ENVELOPE) |
| `fonts/2690Perfect-Harmony.woff2` | judul dekoratif ("a Potrait of") |
| Poppins/Bitter/Cormorant | teks pembantu/gift card |

Token desain: emas-olive `#847D4A`, emas gelap `#46402A`, maroon `#A54141` (tombol), krem `#F0E5CC`, mint `#D4E0DC`, putih overlay `#FFFFFFA3`, gradasi koin `linear-gradient(210deg,#AC8841,#C4A15D)`.

## Struktur section (urutan atas → bawah)
1. **Cover** (overlay, tertutup): foto pengantin + ornament sudut; kartu: "THE WEDDING OF", nama pasangan (Edwardian 72 px putih), "Yth. Bapak/Ibu/Saudara/i", nama tamu `?to=`, amplop + segel, "BUKA UNDANGAN".
2. **Hero "home"**: bg gerbang Jawa; lace + segel + kutipan Qu'ran (default: "Dan segala sesuatu Kami ciptakan berpasang-pasangan…", Adz-Dzariyat : 49 → gunakan `event.quote`); "the story begins..." (Pinyon).
3. **Bride & Groom**: dua kartu foto berframe + ornamen bunga; nama Edwin-65 Edwardian 52 px gold; nama lengkap, "Putra/Putri Pertama dari" ortu; ikon IG.
4. **Journey of Love**: timeline vertikal (kartu putih transparan, teks goldmu); data dari `event.love_story`.
5. **Save the Date**: countdown 4 kotak (Hari/Jam/Menit/Detik) ring emas; tanggal singkat; tombol "Ingatkan Acara".
6. **Acara (Akad & Resepsi)**: bg `Aruna-EVENT-2`; dua kartu (jam, tempat, alamat, Lihat Lokasi).
7. **Dresscode**: kartu petunjuk busana (`event.dress_code`).
8. **Galeri "a Potrait of"**: grid strip foto 230 px + lightbox, dari `event.gallery` / `prewedding_photos`.
9. **RSVP & Wishes**: form RSVP (Hadir/Tidak Hadir, jumlah tamu) + buku tamu; simpan ke `event_rsvps` / `event_wishes`.
10. **Wedding Gift**: E-Amplop (bank via `gift_bank_name`, rekening `gift_account_number`, holder, tombol Salin), alamat kado + konfirmasi WA (`gift_wa`).
11. **Closing**: bg `Aruna-CLOSING-2`, "Salam hangat," + nama pasangan.
12. **Musik** mengambang: tombol putar di `event.music_url`.

## Fitur WordPress yang TIDAK diporting (tidak ada di model data)
- QR Check-in, gift registry produk (Debellin dll.), live streaming YouTube dedicated (dipetakan ke `event.video_url` bila ada), nav menu WordPress.

## Keputusan implementasi
- Komponen: `src/invitation-engine/templates/heritage/HeritageAruna.tsx`
- CSS terisolasi: `cr-heritage-aruna.css` dengan root `.cr-heritage-aruna` (tidak ada selektor global tanpa prefix; @font-face memakai nama font berprefiks `cr-`)
- Countdown/RSVP/wishes/musik/lightbox memakai hooks `invitation-engine/shared/*`
- Tidak ada iframe, tidak ada HTML mentah WordPress
- Layout: mobile satu kolom; desktop dua panel (kiri foto tetap, kanan konten)
