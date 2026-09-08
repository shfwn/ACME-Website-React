# Acme Task Flow — Sistem Manajemen Tugas Kolaboratif & Personal

Aplikasi manajemen tugas modern berbasis Next.js 16 (App Router), React 19, Tailwind CSS v4, Prisma ORM, dan Neon Tech (Serverless PostgreSQL). Sistem ini menggabungkan fokus kerja individu harian dengan visibilitas koordinasi proyek kelompok secara *real-time*.

---

 1. Fitur Utama Sistem

1. Dual-Layer Workspace:
   - Tugas Saya (*Individual Space*): Dasbor fokus pribadi dengan filter waktu (*Hari Ini*, *Mendatang*, *Lewat Tenggat*, *Semua*), checklist langkah kerja, dan tombol pencatat waktu cepat `+30m`.
   - Proyek Tim (*Team Collaboration*): Papan Kanban interaktif, *List View*, pencarian tugas, filter prioritas, dan metrik agregasi progres tim (*Roll-Up Progress*).

2. Hak Kelola Berbasis Pembuat (*Creator Ownership*):
   - Pembuat Tugas (*Creator*) / Owner: Memiliki wewenang penuh untuk mengubah nama tugas, tujuan (*goal*), deskripsi, estimasi jam, tenggat waktu, prioritas, penanggung jawab, serta menghapus tugas.
   - Penerima Tugas (*Assignee*): Berada dalam *Mode Eksekusi* untuk mencentang langkah pengerjaan (*subtasks*), mengubah status alur kerja, mencatat jam kerja, dan berkomunikasi via komentar tanpa popup error yang mengganggu.

3. Mesin Estafet & Anti-Siklus (*DAG Cycle Detection*):
   - Menghubungkan tugas prasyarat dengan algoritma *Depth-First Search (DFS)* guna mencegah ketergantungan melingkar (*infinite loop*).
   - Mengirim notifikasi otomatis saat tugas prasyarat yang ditunggu telah diselesaikan oleh rekan tim.

4. Peta Beban Waktu Tim (*Workload View*):
   - Visualisasi kapasitas jam kerja seluruh anggota tim per minggu.
   - Indikator status otomatis: *Kapasitas Luang*, *Beban Optimal*, dan *Kelebihan Beban (Overload)*.

5. Manajemen Pengguna Khusus Owner (`/users`):
   - Pengguna dengan peran OWNER dapat mendaftarkan akun baru, memilih peran (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`), menyesuaikan kapasitas jam kerja, serta menghapus anggota tim.
   - Akun baru yang didaftarkan langsung aktif dan dapat digunakan untuk masuk di halaman `/login`.

6. Fitur Hapus Menyeluruh (*Comprehensive Delete*):
   - Dukungan penghapusan aman dengan dialog konfirmasi untuk: Tugas, Langkah Kerja (*Subtask*), Komentar Diskusi, Catatan Waktu (*Time Log*), Prasyarat (*Dependency*), Dokumen Panduan (*Doc/Wiki*), Pengguna Tim, dan Notifikasi.

7. Desain Visual Bersih (*Clean Light Theme*):
   - Mengusung tema terang bebas warna gelap dan bebas emoji pada judul/lencana untuk tampilan yang rapi, profesional, dan nyaman di mata.

---

 2. Struktur Akun Standar Sistem

Sistem telah menyediakan akun standar awal untuk pengujian alur kerja:

| Peran (*Role*) | Nama Pengguna | Alamat Email | Kata Sandi | Wewenang Utama |
| :--- | :--- | :--- | :---: | :--- |
| OWNER | Budi Santoso | `owner@company.com` *(atau budi@company.com)* | Bebas / Standar | Akses penuh, kelola anggota tim, buat & hapus proyek/tugas. |
| ADMIN | Siti Rahma | `siti@company.com` | Bebas / Standar | Manajemen proyek, buat tugas tim, pantau beban kerja. |
| MEMBER | Andi Pratama | `andi@company.com` | Bebas / Standar | Pelaksana tugas, centang checklist, catat waktu kerja. |

> [!TIP]
> Masuklah sebagai Owner (`owner@company.com`) untuk mencoba menu Kelola Pengguna dan menambahkan akun baru sesuai kebutuhan Anda.

---

 3. Prasyarat Sistem (*Prerequisites*)

Pastikan perangkat Anda telah terpasang:
- Node.js: Versi `18.18.0` atau yang lebih baru (disarankan Node.js LTS).
- Package Manager: `npm` (bawaan Node.js), `pnpm`, atau `yarn`.

---

 4. Panduan Instalasi & Menjalankan Aplikasi

# Langkah 1: Buka Direktori Proyek
Buka terminal dan arahkan ke folder proyek:
```bash
cd to-do-list/my-app
```

# Langkah 2: Instalasi Dependensi
Jalankan perintah berikut untuk mengunduh seluruh paket yang diperlukan:
```bash
npm install
```

# Langkah 3: Konfigurasi Basis Data (Prisma ORM)
Generate client Prisma ORM:
```bash
npx prisma generate
```

*(Opsional jika ingin menghubungkan ke database PostgreSQL / Neon Tech secara langsung)*:
Salin variabel lingkungan ke file `.env`:
```env
DATABASE_URL="postgresql://user:password@ep-sample-pooler.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-sample.neon.tech/neondb?sslmode=require"
```
Lalu jalankan migrasi & seed:
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

# Langkah 4: Menjalankan Server Pengembangan (*Development*)
Jalankan server lokal:
```bash
npm run dev
```
Buka peramban (*browser*) dan akses rute:
👉 [http://localhost:3000](http://localhost:3000)

---

 5. Menjalankan Build Produksi (*Production Build*)

Untuk memverifikasi kompilasi dan menjalankan aplikasi dalam mode produksi:

```bash
# 1. Kompilasi build Next.js (Turbopack + TypeScript check)
npm run build

# 2. Jalankan server produksi
npm run start
```

---

 6. Panduan Alur Penggunaan Berdasarkan Peran

# 1. Alur Pemilik Proyek (*Owner Flow*):
1. Buka `http://localhost:3000/login` $\rightarrow$ Masukkan email `owner@company.com` $\rightarrow$ Klik Masuk.
2. Klik menu Kelola Pengguna di sidebar kiri.
3. Daftarkan anggota tim baru dengan mengisi nama, email, kapasitas jam, dan perannya.
4. Buka halaman Peluncuran Aplikasi Mobile 2.0 $\rightarrow$ Buat tugas baru dan tentukan penanggung jawabnya.

# 2. Alur Anggota Pelaksana (*Member Flow*):
1. Masuk menggunakan akun anggota (misal: `andi@company.com`).
2. Buka halaman Tugas Saya untuk melihat tugas yang ditugaskan kepada Anda.
3. Centang langkah-langkah kerja (*subtasks*) yang telah selesai $\rightarrow$ perhatikan persentase progres proyek tim langsung ter-update.
4. Klik tombol `+30m` pada kartu tugas untuk mencatat waktu kerja secara cepat.

# 3. Alur Estafet Tugas & Notifikasi:
1. Ketika tugas prasyarat (misal: *Desain Wireframe*) diselesaikan dan dipindahkan ke status *Approved*, sistem secara otomatis memicu notifikasi estafet.
2. Buka menu Pemberitahuan di sidebar kiri untuk melihat pesan bahwa tugas lanjutan sudah siap untuk dikerjakan.

---

 7. Struktur Direktori Proyek

```
my-app/
├── app/
│   ├── (workspace)/
│   │   ├── layout.tsx              # Shell layout (Sidebar, Navbar, Guard Autentikasi)
│   │   ├── my-tasks/page.tsx       # Dasbor Tugas Individu & Pencatat Waktu
│   │   ├── notifications/page.tsx  # Pusat Pemberitahuan Estafet Tugas
│   │   ├── users/page.tsx          # Halaman Manajemen Pengguna (Khusus Owner)
│   │   └── projects/[id]/
│   │       ├── page.tsx            # Papan Kanban & List View Proyek
│   │       ├── workload/page.tsx   # Peta Beban Waktu Tim (Workload Heatmap)
│   │       └── docs/page.tsx       # Catatan & Panduan Bersama (Markdown Wiki)
│   ├── components/
│   │   ├── Sidebar.tsx             # Sidebar Navigasi Bersih Berbasis Peran
│   │   ├── Navbar.tsx              # Navbar Profil Pengguna Aktif & Logout
│   │   ├── TaskCard.tsx            # Kartu Tugas dengan Indikator Tujuan & Waktu
│   │   ├── TaskDetailModal.tsx     # Modal Detail Tugas Multi-Tab & Mode Eksekusi
│   │   └── CreateTaskModal.tsx     # Formulir Pembuatan Tugas Baru
│   ├── login/page.tsx              # Halaman Masuk Akun Standar
│   ├── layout.tsx                  # Root Layout & TaskProvider
│   └── page.tsx                    # Rute Root (Redirect otomatis ke /login)
├── lib/
│   ├── db/prisma.ts                # Singleton Prisma Client
│   ├── services/
│   │   ├── bridging.service.ts     # Logika Roll-up, DAG Cycle Detector & Workload
│   │   ├── audit.service.ts        # Pencatatan Jejak Aktivitas
│   │   └── auth.guard.ts           # Validator Hak Akses RBAC Server-Side
│   ├── store/task-store.tsx        # State Management Terpusat & Persistensi
│   └── utils/
│       ├── progress.ts             # Kalkulasi Progres Aman (Anti Division-by-Zero)
│       └── timezone.ts             # Penanganan Batas Hari Lokal ISO
├── prisma/
│   ├── schema.prisma               # Skema Relasional PostgreSQL Lengkap
│   └── seed.ts                     # Script Seeding Data Awal
└── public/
    └── assets/images/              # Aset Tema Terang (Foto Profil, Banner, SVG)
```

---

 8. Lisensi & Hak Cipta
Dikembangkan untuk sistem manajemen tugas tim kolaboratif dan fokus individu berkinerja tinggi.

