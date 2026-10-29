# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pengguna individu (profesional, pekerja mandiri, tim internal) yang membutuhkan alur kerja terstruktur untuk mencatat to-do harian, logbook/catatan harian, serta merancang dan meninjau jadwal mingguan yang dapat diekspor menjadi spreadsheet.

## Product Purpose

Menghadirkan sistem pencatatan dan penjadwalan terpadu yang memadukan to-do list harian berbasis time-blocking, jurnal/catatan harian per tanggal, kalender penjadwalan mingguan/bulanan, serta konverter/ekspor ke format spreadsheet untuk pelaporan dan arsip kerja.

## Positioning

Bukan sekadar to-do list terpisah atau aplikasi kalender biasa, melainkan satu kanvas terintegrasi: pekerjaan yang direncanakan di kalender langsung sinkron dengan to-do hari bersangkutan, catatan harian langsung melekat pada tanggal kerja, dan seluruh rekap aktivitas dapat diekspor langsung ke spreadsheet dalam satu klik.

## Operating Context

- Digunakan setiap hari saat merencanakan aktivitas pagi hari, mencatat log kerja/meeting di siang hari, dan mengevaluasi pencapaian di sore/malam hari.
- Digunakan di akhir pekan/awal pekan untuk menyusun jadwal mingguan (weekly schedule) dan mengekspor rekap jam kerja ke spreadsheet.
- Lingkungan: Web browser (desktop & responsive mobile).

## Capabilities and Constraints

- **To-Do List Harian:** Pembuatan to-do dengan target tanggal, jam mulai & selesai, tingkat prioritas, kategori, checklist subtask, serta rollover tugas tertunda.
- **Catatan Harian (Daily Log):** Editor rich-text terintegrasi yang terikat langsung dengan tanggal to-do list hari tersebut.
- **Kalender Mingguan & Bulanan:** Tampilan bulanan untuk ikhtisar dan tampilan mingguan (*week timetable*) dengan visual time-blocking (07:00–21:00) serta deteksi bentrok jadwal.
- **Konversi Spreadsheet:** Export data to-do, durasi waktu, dan log catatan ke file CSV / Excel (.xlsx) serta tampilan tabel dinamis internal.
- **Teknologi:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Prisma, LocalStorage client sync.

## Brand Commitments

- Mengadopsi palet warna dan visual hierarchy sesuai inspirasi referensi:
  - Sidebar bernuansa Soft Periwinkle Blue (`#6C7EC2` / `#7B8BC7`) dengan tipografi putih minimalis.
  - Kanvas utama bersih (clean white/soft mint background) dengan aksen pastel cerah: Pastel Yellow/Warm Butter (`#FFE28A`), Coral Rose (`#F5A8B8`), Mint Green (`#8CE5D0`), dan Royal Periwinkle (`#6C7EC2`).
  - Indikator tanggal berbentuk segmented ring arcs multi-warna yang menunjukkan kategori aktivitas pada tanggal tersebut.
  - Card jadwal mingguan bertipe time-blocking dengan warna pastel lembut dan teks kontras tinggi yang nyaman dibaca (*user-friendly & clean*).

## Evidence on Hand

- Desain referensi [Image #1]: Tampilan kalender modern bernuansa Periwinkle Blue, ring indikator tanggal multi-warna, toggle WEEK/MONTH, panel jadwal harian berwarna pastel (Kuning, Coral, Mint), dan bar visual "Events Distribution".
- Kode eksisting di modul `app/(workspace)/milt/` (`todos`, `notes`, `calendar`, `sheets`) dan `lib/store/task-store.tsx`.

## Product Principles

1. **Clarity Over Clutter:** Tampilan bernapas lega, tipografi terbaca jelas, elemen navigasi tenang tanpa distraksi.
2. **Seamless Flow:** Dari jadwal mingguan $\rightarrow$ to-do harian $\rightarrow$ catatan kerja $\rightarrow$ ekspor sheet tanpa jeda atau perpindahan aplikasi yang rumit.
3. **Warm & Delightful Aesthetics:** Memakai kombinasi warna pastel fungsional yang menyenangkan untuk digunakan seharian.
