# PRD — PrenaTalks

**Teman Ibu Hamil untuk Persalinan Aman**

| | |
|---|---|
| **Nama Produk** | PrenaTalks |
| **Tagline** | Empowerment Women's Health |
| **Versi Dokumen** | 1.1 (penyesuaian identitas merek) |
| **Tanggal** | 3 Agustus 2026 |
| **Status** | Draft untuk review |
| **Stack** | Next.js 14+ (App Router) · shadcn/ui · Laravel 13 (REST API, JWT) · PostgreSQL 16 |
| **Deployment** | VPS (1 tahun), Nginx + PM2 + PHP-FPM |

---

## 1. Identitas Merek

Bagian ini adalah sumber kebenaran untuk seluruh keputusan desain, penulisan konten, dan penamaan di dalam sistem. Bila ada pertentangan antara mockup visual dan bagian ini, **identitas merek yang menang**.

### 1.1 Filosofi Nama

**Prena · Talks** — dari *pre* (sebelum), *natal* (kelahiran atau kehidupan baru), dan *talks* (percakapan). Nama ini menempatkan PrenaTalks sebagai **ruang komunikasi dan edukasi**, bukan sekadar pustaka artikel. Implikasi produk: nada bicara antarmuka bersifat percakapan ("Yuk, cek kondisi kehamilan Anda"), bukan instruksional dingin ("Isi formulir penilaian risiko").

Penulisan resmi: **PrenaTalks** (satu kata, huruf T kapital). Bukan "Prenatalks", "Prena Talks", atau "PRENATALKS". Dalam kode gunakan `prenatalks`.

### 1.2 Sejarah & Posisi

Didirikan **28 Agustus 2020**, berawal dari kepedulian terhadap keterbatasan akses perempuan dan ibu pada informasi kesehatan yang akurat di tengah derasnya arus informasi. PrenaTalks hadir sebagai ruang belajar dan berbagi yang mengedepankan **edukasi berbasis bukti ilmiah**, agar setiap perempuan punya kesempatan yang sama untuk memahami, menjaga, dan mengambil keputusan terbaik bagi kesehatan dirinya, anak, dan keluarganya.

Komitmen merek: **"Empowerment Women's Health"** — memberdayakan perempuan melalui edukasi kesehatan berbasis bukti, demi keluarga yang lebih sehat dan berkualitas.

**Implikasi terhadap ruang lingkup produk.** Merek mendampingi seluruh tahap: persiapan kehidupan → kehamilan → persalinan → pengasuhan. Website v1 fokus pada kehamilan dan persalinan, namun **taksonomi konten harus sudah menampung lima tahap** sejak awal agar ekspansi tidak memerlukan migrasi data:

| `life_stage` | Label tampilan | Status v1 |
|---|---|---|
| `preconception` | Prakonsepsi | struktur siap, konten menyusul |
| `pregnancy` | Kehamilan | aktif |
| `birth` | Persalinan | aktif |
| `postpartum` | Nifas & Menyusui | struktur siap |
| `parenting` | Pengasuhan | struktur siap |

Konsekuensinya, komunikasi di situs menyebut **"perempuan dan keluarga"**, bukan hanya "ibu hamil", dan peran ayah/pendamping diakui secara eksplisit dalam konten dan checklist persiapan.

### 1.3 Filosofi Logo & Aturan Pemakaian

Logo menampilkan siluet **ibu, ayah, dan anak yang menyatu dalam satu lingkaran** — ibu sebagai pusat pengasuhan, ayah sebagai pendamping dan pelindung, anak sebagai harapan masa depan. Lingkaran merepresentasikan pendekatan *family-centered care* dan keberlanjutan setiap tahap kehidupan.

Aturan teknis:

| Aspek | Ketentuan |
|---|---|
| Format aset | SVG (utama), PNG @2x, favicon 32/180/512px, `og-image` 1200×630 |
| Varian | Penuh warna · monokrom ungu · monokrom putih (untuk latar gelap/foto) |
| Ukuran minimum | Lebar 120px (desktop), 100px (mobile) — di bawah itu siluet tidak terbaca |
| Clear space | Minimal 0,5× diameter lingkaran di semua sisi |
| Larangan | Mengubah warna, merenggangkan rasio, memiringkan, menambah bayangan, menaruh di atas foto ramai tanpa varian monokrom |
| Lockup | Logo + wordmark "PrenaTalks" + tagline "Teman Ibu Hamil untuk Persalinan Aman" (navbar & footer); logo saja untuk favicon dan avatar sosial |

Lingkaran logo juga menjadi **motif turunan** di seluruh antarmuka: wadah ikon berbentuk lingkaran, avatar testimoni, tombol panah bundar pada kartu fitur, dan indikator progres melingkar pada kalkulator kehamilan.

### 1.4 Filosofi Warna

PrenaTalks memakai **dua lapis warna** yang punya tugas berbeda dan tidak saling menggantikan.

**Lapis 1 — Warna Merek (identitas logo).** Ini warna resmi yang melekat pada logo dan tidak boleh diubah.

| Warna | Makna | Peran |
|---|---|---|
| **Ungu** `#7C3AED` | Kepedulian, kebijaksanaan, empati, profesionalisme | Logo, wordmark, penanda kredibilitas (badge "berbasis bukti", ikon keamanan & privasi) |
| **Hijau Toska** `#14B8A6` | Kehidupan, pertumbuhan, keseimbangan, keharmonisan | Logo, indikator sehat/aman, ilustrasi, aksi pendukung |

**Lapis 2 — Warna Antarmuka (merah muda).** Sesuai mockup landing page, **merah muda `#F472B6` adalah warna aksi utama di website**: tombol primer, judul aksen, dan latar lembut. Merah muda dipilih karena hangat dan mengundang bagi audiens ibu hamil, sekaligus membuat elemen ungu–toska tetap menonjol sebagai penanda identitas.

Pembagian tugas ini disengaja: **merah muda mengajak, ungu meyakinkan, toska menenangkan.** Ketiganya bersama-sama menghasilkan kesan hangat, terpercaya, dan profesional — dan itulah patokan menilai setiap keputusan visual.

Aturan yang mengikat:
- Logo **tidak pernah** diwarnai ulang menjadi merah muda. Bila latar berwarna, gunakan varian monokrom putih.
- Elemen yang berbicara tentang kepercayaan dan keamanan data (badge sumber ilmiah, ikon privasi, profil tenaga kesehatan) memakai **ungu**, bukan merah muda — supaya kredibilitas terbaca terpisah dari ajakan bertindak.
- Indikator kondisi sehat/aman dan status "selesai" memakai **toska**, bukan hijau generik.
- Merah muda tidak dipakai untuk menyampaikan peringatan atau bahaya; itu tugas warna semantik merah `#E11D48`.

### 1.5 Nada Bicara

| Lakukan | Hindari |
|---|---|
| "Yuk, kita cek bersama" | "Silakan lakukan penilaian mandiri" |
| "Hasil ini bukan diagnosis" | "Anda terdeteksi berisiko" |
| "Segera hubungi bidan Anda" | "Segera cari pertolongan medis darurat!!!" (menakut-nakuti) |
| Kalimat pendek, sapaan "Anda" | Istilah medis tanpa penjelasan |
| Menyebut sumber (Kemenkes, WHO, Buku KIA) | Klaim tanpa rujukan |

Setiap artikel kesehatan wajib mencantumkan **sumber rujukan** dan **tanggal tinjauan terakhir** — ini adalah janji "berbasis bukti ilmiah" yang diwujudkan di tingkat antarmuka, bukan sekadar slogan.

---

## 2. Ringkasan Eksekutif

PrenaTalks adalah platform web edukasi kehamilan yang menyederhanakan informasi Buku KIA menjadi konten digital yang mudah dipahami, dilengkapi **self-assessment risiko kehamilan berbasis skor**, kalkulator usia kehamilan, checklist persiapan persalinan, serta form & survei yang dapat dikelola admin untuk kebutuhan penelitian.

Sistem dibangun sebagai **decoupled architecture**: Next.js sebagai frontend (SSR/SSG untuk konten publik, CSR untuk dashboard), Laravel sebagai REST API dengan autentikasi JWT, dan PostgreSQL sebagai basis data.

### Masalah yang diselesaikan

| Masalah | Solusi di PrenaTalks |
|---|---|
| Buku KIA panjang dan sulit dipahami | Artikel & video edukasi tersegmentasi per trimester |
| Informasi tidak sesuai kondisi masing-masing ibu | Checklist risiko personal + hasil rekomendasi |
| Akses terbatas ke tenaga kesehatan | Konten berbasis bukti + tautan komunitas + rujukan ke faskes |
| Data penelitian sulit dikumpulkan | Form Builder & Survei dengan export CSV/XLSX |

### Non-goals (di luar lingkup v1)

- Bukan alat diagnosis. Sistem **tidak** memberikan diagnosis medis, resep, atau dosis obat.
- Tidak ada telekonsultasi real-time (chat/video call dengan bidan) di v1 — hanya tautan komunitas.
- Tidak ada mobile app native (web responsif saja).
- Tidak ada integrasi Satu Sehat / SIMRS di v1.
- Tidak ada pembayaran / monetisasi.

---

## 3. Tujuan & Metrik Keberhasilan

### 3.1 Tujuan Produk

1. Menyediakan informasi kehamilan yang mudah dipahami untuk ibu hamil.
2. Memungkinkan ibu hamil melakukan self-assessment risiko secara mandiri dan berkala.
3. Menjadi media edukasi digital yang dapat dikelola mandiri oleh admin (tanpa developer).
4. Mendukung tenaga kesehatan dan peneliti dalam pengumpulan data serta pemberian edukasi.

### 3.2 Metrik Keberhasilan (6 bulan pasca-launch)

| Metrik | Target |
|---|---|
| Pengguna terdaftar | 1.000 ibu hamil |
| Penyelesaian checklist risiko (completion rate) | ≥ 70% dari yang memulai |
| Artikel & video terpublikasi | ≥ 200 konten |
| Pengguna aktif bulanan (MAU) | ≥ 40% dari total terdaftar |
| Rata-rata sesi baca artikel | ≥ 2 menit |
| Skor SUS (System Usability Scale) | ≥ 68 |
| Lighthouse Performance (mobile) | ≥ 85 |

---

## 4. Persona Pengguna

### P1 — Ibu Hamil (pengguna utama)
Usia 20–35 tahun, mayoritas mengakses via smartphone dengan koneksi 4G tidak stabil, literasi digital menengah. Butuh jawaban cepat, bahasa sederhana, teks berukuran cukup besar, dan rasa aman bahwa datanya privat.

**Kebutuhan:** "Usia kehamilan saya berapa minggu?", "Apakah kondisi saya berisiko?", "Apa saja yang harus saya siapkan sebelum melahirkan?"

### P2 — Admin / Pengelola Konten
Bidan atau staf program yang mengelola artikel, video, FAQ, form, dan survei. Bukan orang teknis — semua pengelolaan harus melalui antarmuka, tanpa menyentuh kode.

### P3 — Super Admin
Penanggung jawab sistem. Mengelola akun admin, konfigurasi kuesioner risiko & ambang skor, serta memantau audit log.

### P4 — Tenaga Kesehatan (opsional, fase 2)
Melihat hasil assessment pengguna yang memberi persetujuan, dan memberikan catatan edukasi.

---

## 5. Peran & Hak Akses (RBAC)

| Kapabilitas | Ibu Hamil | Tenaga Kesehatan | Admin | Super Admin |
|---|:---:|:---:|:---:|:---:|
| Registrasi & login | ✅ | ✅ | ✅ | ✅ |
| Mengisi data kehamilan | ✅ | — | — | — |
| Kalkulator kehamilan | ✅ | ✅ | ✅ | ✅ |
| Mengisi checklist risiko | ✅ | — | — | — |
| Melihat riwayat hasil sendiri | ✅ | — | — | — |
| Melihat hasil user (yang consent) | — | ✅ | — | ✅ |
| Mengisi form & survei | ✅ | — | — | — |
| Checklist persiapan melahirkan | ✅ | — | — | — |
| CRUD artikel & video | — | — | ✅ | ✅ |
| CRUD FAQ | — | — | ✅ | ✅ |
| Form & Survey Builder | — | — | ✅ | ✅ |
| Export data (CSV/XLSX) | — | — | ✅ | ✅ |
| Kelola kuesioner risiko & skor | — | — | — | ✅ |
| Kelola akun admin & role | — | — | — | ✅ |
| Lihat audit log & monitoring | — | — | — | ✅ |

**Aturan:** akses publik (tanpa login) hanya untuk Beranda, Tentang, Artikel, Video, FAQ, Komunitas, dan Survei publik. Fitur yang menyimpan data personal wajib login.

---

## 6. Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────────┐
│  Browser (Desktop / Tablet / Smartphone)                      │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼──────────────────────────────────┐
│  Next.js 14 (App Router) — port 3000                          │
│  • SSG/ISR: landing, artikel, video, FAQ  (SEO)               │
│  • CSR + React Query: dashboard user & panel admin            │
│  • Route Handler /api/auth/* → proxy JWT ke httpOnly cookie   │
│  • UI: shadcn/ui + Tailwind CSS                               │
└───────────────────────────┬──────────────────────────────────┘
                            │ REST + Bearer JWT
┌───────────────────────────▼──────────────────────────────────┐
│  Laravel 13 API — /api/v1  (port 8000, php-fpm)               │
│  • tymon/jwt-auth  • Form Request validation                  │
│  • Policy/Gate RBAC  • Resource (JSON transform)              │
│  • Queue (database driver) untuk email & export               │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│  PostgreSQL 16    +    Storage lokal VPS (uploads/)           │
└──────────────────────────────────────────────────────────────┘
```

### 6.1 Keputusan Teknis

| Area | Keputusan | Alasan |
|---|---|---|
| Rendering | ISR untuk konten publik (revalidate 300 detik) | SEO + hemat beban API |
| State server | TanStack Query v5 | caching, retry, optimistic update |
| Form | React Hook Form + Zod | validasi konsisten dengan aturan backend |
| Auth storage | Access token di memory, refresh token di **httpOnly cookie** | mencegah pencurian token via XSS |
| Video | Embed YouTube unlisted (`youtube-nocookie.com`) | hemat bandwidth VPS |
| Upload gambar | Storage lokal + konversi WebP (Intervention Image) | biaya rendah |
| Timezone | Simpan UTC di DB, tampilkan Asia/Jakarta | konsistensi |

---

## 7. Design System

Diturunkan langsung dari mockup landing page terlampir. Semua token didefinisikan di `globals.css` sebagai CSS variable dan dipetakan ke konfigurasi shadcn/ui.

### 7.1 Palet Warna

Mengikuti pembagian dua lapis di bagian 1.4: **merah muda menggerakkan antarmuka, ungu–toska menjaga identitas.**

**Warna merek (dari logo — tidak boleh diubah)**

| Token | Hex | Penggunaan |
|---|---|---|
| `--brand-purple` | `#7C3AED` | Logo, wordmark "Talks", badge kredibilitas, ikon privasi & keamanan, tombol sekunder |
| `--brand-purple-soft` | `#F5F3FF` | Latar wadah ikon ungu, badge |
| `--brand-teal` | `#14B8A6` | Logo, ilustrasi, indikator sehat/aman |
| `--brand-teal-soft` | `#F0FDFA` | Latar wadah ikon toska |
| `--brand-teal-text` | `#0F766E` | **Teks** toska (versi `#14B8A6` gagal kontras di bawah 18px) |

**Warna antarmuka (sesuai mockup)**

| Token | Hex | Penggunaan |
|---|---|---|
| `--primary` — Merah muda | `#F472B6` → hover `#EC4899` | Tombol utama, wordmark "Prena", garis menu aktif, tombol panah kartu |
| `--primary-text` | `#DB2777` | **Teks** merah muda berukuran < 18px |
| `--primary-soft` — Blush | `#FDF2F8` | Latar hero, seksi selang-seling, wadah ikon merah muda |
| `--background` | `#FFFFFF` | Latar utama |
| `--foreground` | `#1F2937` | Teks utama |
| `--muted-foreground` | `#6B7280` | Teks pendukung |
| `--border` | `#F5E4EE` | Garis kartu |

**Warna semantik (membawa arti — tidak boleh diganti demi estetika)**

| Token | Hex | Arti |
|---|---|---|
| `--success` | `#0D9488` (toska) | Risiko rendah, tersimpan, tercentang |
| `--warning` | `#D97706` | Risiko sedang, perlu perhatian |
| `--danger` | `#E11D48` | Risiko tinggi, tanda bahaya, galat |
| `--star` | `#F59E0B` | Bintang rating testimoni |

**Gradien**
- Hero: `linear-gradient(135deg, #FFF1F6 0%, #FDF2F8 55%, #F5F3FF 100%)` — blush mengalir ke ungu muda, menghubungkan warna antarmuka dengan warna merek.
- CTA banner: `linear-gradient(90deg, #F9A8D4 0%, #F472B6 100%)` dengan teks putih.
- Wordmark: "Prena" `#EC4899` · "Talks" `#7C3AED`.

**Warna kartu fitur** (mengikuti mockup, dengan hijau dan ungu diselaraskan ke warna logo)

| Kartu | Judul | Latar ilustrasi |
|---|---|---|
| Belajar | `#DB2777` merah muda | `#FDF2F8` |
| Cek Risiko | `#0F766E` toska merek | `#F0FDFA` |
| Siap Lahiran | `#7C3AED` ungu merek | `#F5F3FF` |
| Tanda Bahaya | `#E11D48` merah semantik | `#FFF1F2` |
| Tanya Bidan | `#D97706` amber | `#FFFBEB` |
| Artikel | `#2563EB` biru | `#EFF6FF` |

**Proporsi yang disarankan** agar identitas tidak tenggelam: sekitar 60% netral (putih & abu teks), 25% merah muda, 15% ungu–toska. Jika sebuah halaman sama sekali tidak memuat ungu atau toska selain logo, halaman itu belum terasa sebagai PrenaTalks.

### 7.2 Tipografi

Pasangan huruf dipilih untuk menyeimbangkan dua sisi merek: **profesional** (ungu) dan **hangat** (toska).

- **Display — Plus Jakarta Sans** (weight 700/800). Karakternya tegas dan modern sehingga menjaga kesan profesional pada judul; dirancang oleh tipografer Indonesia, selaras dengan merek yang melayani perempuan Indonesia.
- **Body — Nunito Sans** (weight 400/600). Bentuk terminal yang lebih lembut menjaga kehangatan pada teks panjang, dan tinggi-x-nya besar sehingga tetap nyaman dibaca di layar ponsel.
- **Angka statistik & skor:** Plus Jakarta Sans 800, `font-variant-numeric: tabular-nums`.
- Keduanya tersedia di Google Fonts; muat lewat `next/font` dengan `display: swap` dan subset `latin`.

| Peran | Ukuran (desktop / mobile) |
|---|---|
| H1 Hero | 52px / 32px, weight 800, line-height 1.2 |
| H2 Seksi | 34px / 24px, weight 800, rata tengah |
| H3 Kartu | 20px / 18px, weight 700 |
| Body | 16px / 15px, line-height 1.7 |
| Caption | 13px |

### 7.3 Komponen & Aturan Visual

- **Radius:** kartu `24px` (`rounded-3xl`), tombol `999px` (pill), input `12px`.
- **Shadow:** `0 4px 20px rgba(244, 114, 182, 0.12)` — lembut, tidak keras.
- **Ikon:** `lucide-react`, ukuran 20–24px, ditaruh dalam lingkaran berlatar pastel (`w-12 h-12 rounded-full`).
- **Floating info card:** kartu putih kecil di atas foto hero, shadow lembut, radius 16px.
- **Hover kartu fitur:** `translateY(-4px)` + shadow menguat, transisi 200ms.
- **Motion:** fade-up saat scroll (Framer Motion, jarak 16px, durasi 400ms). Hormati `prefers-reduced-motion`.

### 7.4 Komponen shadcn/ui yang Dipakai

`button` · `card` · `input` · `label` · `form` · `select` · `radio-group` · `checkbox` · `textarea` · `dialog` · `sheet` · `dropdown-menu` · `tabs` · `accordion` (FAQ) · `progress` (checklist) · `badge` (level risiko) · `alert` (disclaimer) · `table` (panel admin) · `toast` (sonner) · `skeleton` · `carousel` (testimoni) · `pagination` · `avatar` · `separator` · `calendar` + `popover` (input HPHT)

### 7.5 Aturan Aksesibilitas

- Kontras teks minimal 4.5:1. **Dua jebakan yang harus dihindari:** merah muda `#F472B6` di atas putih hanya ±2,3:1 dan toska `#14B8A6` hanya ±2,4:1 — keduanya boleh dipakai sebagai latar tombol dengan teks putih, tetapi untuk **teks berwarna** di bawah 18px gunakan `#DB2777` dan `#0F766E`. Ungu `#7C3AED` aman untuk semua ukuran.
- Warna tidak pernah menjadi satu-satunya penanda makna: level risiko selalu disertai label teks dan ikon, bukan hanya badge berwarna.
- Semua kontrol dapat dijangkau keyboard dengan focus ring terlihat (`ring-2 ring-primary ring-offset-2`).
- Target sentuh minimal 44×44px.
- Alt text wajib pada semua gambar konten.

---

## 8. Struktur Menu & Sitemap

### Publik
```
/                     Beranda (landing sesuai mockup)
/tentang              Filosofi nama & logo, sejarah, komitmen, profil tim
/artikel              Daftar artikel + filter kategori & trimester
/artikel/[slug]       Detail artikel
/video                Galeri video edukasi
/video/[slug]         Detail video (embed)
/faq                  Accordion pertanyaan umum
/komunitas            Ajakan gabung WhatsApp/Telegram
/survei/[slug]        Survei publik (opsional tanpa login)
/kalkulator           Kalkulator kehamilan (mode tamu, hasil tidak tersimpan)
/masuk  /daftar  /lupa-password  /reset-password
```

### Area Pengguna (`/dashboard/*`, wajib login)
```
/dashboard                      Ringkasan: usia kehamilan, HPL, status risiko terakhir, progres checklist
/dashboard/kehamilan            Data kehamilan (HPHT, tinggi/berat, riwayat)
/dashboard/kalkulator           Kalkulator + simpan hasil
/dashboard/cek-risiko           Kuesioner risiko
/dashboard/cek-risiko/hasil/[id] Hasil & rekomendasi
/dashboard/riwayat              Riwayat assessment (grafik tren skor)
/dashboard/form                 Daftar form yang perlu diisi
/dashboard/persiapan            Checklist persiapan melahirkan
/dashboard/profil               Profil & keamanan akun
```

### Panel Admin (`/admin/*`)
```
/admin                  Statistik ringkas
/admin/artikel          CRUD artikel
/admin/video            CRUD video
/admin/faq              CRUD FAQ
/admin/form             Form & Survey Builder
/admin/form/[id]/respon Lihat & export respon
/admin/kuesioner        Kelola pertanyaan risiko & bobot skor (Super Admin)
/admin/checklist        Kelola template checklist persiapan
/admin/pengguna         Kelola pengguna & role (Super Admin)
/admin/pengaturan       Pengaturan situs, tautan komunitas, audit log
```

---

## 9. Spesifikasi Fitur

Prioritas: **P0** = wajib MVP, **P1** = rilis kedua, **P2** = opsional.

---

### F-01 · Landing Page (P0)

Halaman beranda mengikuti mockup terlampir, terdiri dari seksi berurutan:

1. **Navbar** — logo + tagline, menu (Beranda, Belajar, Cek Risiko, Siap Lahiran, Tanda Bahaya, Tanya Bidan, Artikel), indikator halaman aktif berupa garis bawah merah muda. Di mobile berubah menjadi hamburger + `sheet`.
2. **Hero** — H1 tiga baris dengan "Prena" merah muda dan "Talks" ungu, paragraf pendukung, tiga tombol (Mulai Sekarang / Cek Risiko / Belajar Gratis), foto ibu hamil, dan tiga floating card (Informasi Terpercaya, Untuk Ibu & Janin, Akses Kapan Saja).
3. **Bar statistik** — kartu putih mengambang di batas seksi, 4 item dengan ikon lingkaran: jumlah ibu terbantu, jumlah konten, keamanan data, pendampingan ahli. Angka diambil dari endpoint statistik, bukan hardcode.
4. **Grid fitur** — 6 kartu (Belajar, Cek Risiko, Siap Lahiran, Tanda Bahaya, Tanya Bidan, Artikel), masing-masing dengan ilustrasi berlatar pastel, judul berwarna sesuai aksen kartu, deskripsi 2 baris, dan tombol panah bundar.
5. **Testimoni** — carousel 3 kartu berisi avatar, kutipan, rating bintang, nama + usia kehamilan. Dot indicator di bawah.
6. **CTA banner** — gradien merah muda dengan ilustrasi dan tombol putih "Mulai Sekarang".
7. **Footer** — 4 kolom (Menu, Tentang Kami, Bantuan, Kontak), ikon sosial, bar bawah ungu dengan copyright dan keterangan "Sejak 2020".

**Kriteria terima**
- Layout 6 kartu fitur menjadi 2 kolom di tablet dan 1 kolom di mobile.
- LCP < 2,5 detik pada koneksi 4G (`next/image` dengan `priority` untuk foto hero).
- Semua angka statistik berasal dari `GET /api/v1/stats` dengan ISR 1 jam.

---

### F-02 · Autentikasi & Akun (P0)

- Registrasi: nama, email, no. HP (opsional), password (min. 8 karakter, mengandung huruf dan angka), persetujuan syarat & kebijakan privasi (checkbox wajib).
- Verifikasi email via tautan bertanda tangan (berlaku 60 menit).
- Login, lupa password, reset password.
- Rate limit: 5 percobaan login per menit per IP; lockout 15 menit setelah 10 kegagalan berturut-turut.

**Alur JWT**
1. `POST /auth/login` → mengembalikan `access_token` (TTL 60 menit) dan `refresh_token` (TTL 14 hari).
2. Next.js Route Handler menyimpan `refresh_token` ke cookie `httpOnly; Secure; SameSite=Lax`.
3. Access token disimpan di memory (Zustand/React Context), dikirim sebagai header `Authorization: Bearer`.
4. Saat menerima 401, interceptor memanggil `POST /auth/refresh` sekali, lalu mengulang request. Refresh token dirotasi setiap kali dipakai; token lama masuk denylist.
5. `POST /auth/logout` mem-blacklist token dan menghapus cookie.

**Kriteria terima**
- Password di-hash dengan bcrypt (cost 12).
- Token tidak pernah tersimpan di `localStorage`.
- Pengguna yang belum verifikasi email tetap dapat login namun tidak dapat menyimpan hasil assessment (banner pengingat ditampilkan).

---

### F-03 · Profil Data Kehamilan (P0)

Field: HPHT, HPL (otomatis, dapat ditimpa manual), jumlah kehamilan (gravida), jumlah persalinan (para), jumlah keguguran (abortus), tinggi badan, berat sebelum hamil, berat saat ini, golongan darah, riwayat penyakit (multi-select: hipertensi, diabetes, anemia, asma, jantung, lainnya), nama & kontak faskes.

**Kriteria terima**
- HPHT tidak boleh di masa depan dan tidak lebih dari 300 hari lalu.
- Satu pengguna dapat memiliki beberapa data kehamilan; hanya satu berstatus `active`.
- Perubahan HPHT memperbarui HPL dan usia kehamilan di seluruh dashboard.

---

### F-04 · Kalkulator Kehamilan (P0)

**Input:** HPHT (date picker).
**Output:** usia kehamilan (minggu + hari), HPL (rumus Naegele: HPHT + 7 hari − 3 bulan + 1 tahun), trimester berjalan, sisa hari menuju HPL, dan progres visual per trimester.

- Mode tamu: hasil hanya ditampilkan, tidak disimpan.
- Mode login: hasil tersimpan dan menjadi acuan personalisasi konten.
- Ditampilkan catatan: perhitungan berbasis siklus 28 hari; untuk siklus tidak teratur, USG lebih akurat.

**Kriteria terima**
- Perhitungan dilakukan di backend agar konsisten; frontend menampilkan hasil dari API.
- Uji unit mencakup kasus tahun kabisat dan pergantian tahun.

---

### F-05 · Checklist Risiko — *Core Feature* (P0)

Kuesioner berbasis skor yang dikelola dari panel admin (tidak di-hardcode). Basis acuan yang direkomendasikan: **Kartu Skor Poedji Rochjati (KSPR)** yang lazim digunakan di layanan KIA Indonesia, dengan susunan akhir divalidasi oleh bidan/dokter penanggung jawab program sebelum rilis.

**Struktur data kuesioner**
```
Questionnaire (versi) → Question (teks, tipe, urutan, wajib)
                      → Option (label, skor)
```
- Tipe pertanyaan: `single_choice`, `multiple_choice`, `boolean`, `number` (dengan aturan rentang → skor).
- Setiap kuesioner **berversi**. Assessment lama tetap tertaut ke versi kuesioner saat pengisian, sehingga riwayat tidak berubah ketika admin menyunting pertanyaan.

**Perhitungan & klasifikasi**
- Skor total = penjumlahan skor jawaban terpilih.
- Ambang batas dikonfigurasi Super Admin, contoh awal (mengacu KSPR):

| Level | Rentang skor | Warna badge | Rekomendasi tampilan |
|---|---|---|---|
| Risiko Rendah | 2–6 | Toska `#0D9488` | Lanjutkan ANC rutin minimal 6 kali |
| Risiko Sedang (Tinggi) | 7–11 | Amber `#D97706` | Periksa ke bidan/dokter, rencanakan persalinan di faskes |
| Risiko Tinggi (Sangat Tinggi) | ≥ 12 | Merah `#E11D48` | Segera rujuk ke dokter spesialis / RS dengan fasilitas lengkap |

**Tampilan hasil**
- Badge level + skor + tanggal.
- Rincian faktor penyumbang skor tertinggi.
- Rekomendasi tindak lanjut (teks yang dapat diedit admin per level).
- Tombol "Unduh PDF hasil" dan "Bagikan ke bidan".
- **Disclaimer wajib** ditampilkan di atas dan di bawah hasil.

**Deteksi tanda bahaya**
Bila pengguna memilih opsi yang ditandai `is_danger_sign` (mis. perdarahan, kejang, air ketuban keluar sebelum waktunya, gerakan janin berkurang), sistem langsung menampilkan **alert merah persisten** berisi anjuran segera menuju fasilitas kesehatan terdekat, terlepas dari total skor.

**Kriteria terima**
- Kuesioner dapat diselesaikan dalam ≤ 3 menit; progres tersimpan otomatis per langkah.
- Pengguna dapat mengulang assessment kapan saja; setiap hasil tersimpan sebagai entri riwayat.
- Grafik tren skor antarwaktu tersedia di halaman riwayat.
- Hasil tidak pernah menggunakan kata "diagnosis", "penyakit", atau nama kondisi medis sebagai kesimpulan.

---

### F-06 · Form Builder (P0)

Admin membuat form dinamis tanpa menulis kode.

- Tipe field: teks singkat, paragraf, angka, tanggal, pilihan tunggal, pilihan ganda, dropdown, skala 1–5, unggah berkas (opsional, maks 2 MB).
- Pengaturan per field: label, deskripsi, wajib/tidak, placeholder, validasi (min/maks, regex sederhana).
- Pengaturan form: judul, deskripsi, status (draft/terbit/tutup), periode aktif, wajib login atau tidak, batas 1 respon per pengguna.
- Pratinjau sebelum terbit.

---

### F-07 · Survei & Export Data (P0)

Survei menggunakan mesin yang sama dengan Form Builder (`type = survey`), dengan tambahan:
- Opsi **anonim** (identitas pengguna tidak disimpan bersama jawaban).
- Halaman publik `/survei/[slug]` yang dapat dibagikan.
- Ringkasan respon: jumlah responden, distribusi jawaban per pertanyaan (bar chart).
- **Export CSV & XLSX**, diproses via queue untuk data > 1.000 baris, hasil dikirim sebagai tautan unduh berumur 24 jam.

**Kriteria terima**
- Export mencakup timestamp, dan ID responden hanya jika survei tidak anonim.
- Karakter Unicode (nama Indonesia, tanda baca) tidak rusak di Excel (BOM UTF-8).

---

### F-08 · Artikel (P0)

- CRUD dengan editor rich text (TipTap), unggah cover, kategori, tag trimester, ringkasan, slug otomatis, status draft/terbit, jadwal terbit.
- Halaman publik: daftar dengan filter tahap kehidupan (`life_stage`), kategori, dan trimester; pencarian judul; pagination 12 per halaman.
- Setiap artikel kesehatan wajib mengisi **sumber rujukan** dan **tanggal tinjauan terakhir**; keduanya ditampilkan di bawah isi artikel.
- Detail: cover, penulis, tanggal, estimasi waktu baca, isi, artikel terkait, tombol bagikan WhatsApp.
- SEO: meta title/description, Open Graph, JSON-LD `Article`, sitemap otomatis.

---

### F-09 · Video Edukasi (P0)

- Embed YouTube unlisted/private melalui `youtube-nocookie.com`.
- Field: judul, deskripsi, URL YouTube, thumbnail (auto dari API atau unggah manual), kategori, durasi.
- Validasi URL YouTube saat penyimpanan; tampilkan pesan jelas bila video tidak dapat di-embed.

---

### F-10 · FAQ (P0)

- Accordion dikelompokkan per kategori, dengan pencarian.
- Admin mengelola pertanyaan, jawaban, kategori, dan urutan (drag & drop).
- JSON-LD `FAQPage` untuk SEO.

---

### F-11 · Checklist Persiapan Melahirkan (P0)

- Template item dikelola admin, dikelompokkan: Dokumen, Perlengkapan Ibu, Perlengkapan Bayi, Persiapan Transportasi & Donor Darah, Rencana Persalinan.
- Pengguna mencentang item; progres tersimpan per pengguna dengan progress bar per kategori dan total.
- Pengguna dapat menambahkan item pribadi.
- Item baru dari admin otomatis muncul pada checklist pengguna tanpa menghapus progres yang ada.

---

### F-12 · Komunitas (P1)

Halaman berisi penjelasan komunitas dan tombol tautan WhatsApp/Telegram yang dikelola dari pengaturan admin. Disertai aturan komunitas singkat dan catatan bahwa komunitas bukan kanal layanan gawat darurat.

---

### F-13 · Dashboard Pengguna (P0)

Kartu ringkas: usia kehamilan & HPL, status risiko terakhir + tanggal, progres checklist persiapan, form yang belum diisi, dan 3 artikel rekomendasi sesuai trimester berjalan.

---

### F-14 · Panel Admin & Statistik (P0)

- Kartu statistik: total pengguna, assessment bulan ini, distribusi level risiko, konten terpublikasi, respon form.
- Tabel data dengan pencarian, filter, sorting, dan pagination server-side.
- Audit log: siapa mengubah apa dan kapan (khusus Super Admin).

---

### F-15 · Akses Tenaga Kesehatan (P2)

Pengguna dapat memberikan izin (consent eksplisit, dapat dicabut) agar tenaga kesehatan terverifikasi melihat hasil assessment-nya dan menuliskan catatan edukasi. Akses berbasis kode tautan, tercatat di audit log.

---

---

### F-16 · Halaman Tentang (P0)

Halaman ini adalah tempat merek berbicara langsung, dan menjadi salah satu penopang kepercayaan pengguna terhadap konten kesehatan.

Susunan seksi:
1. **Filosofi nama** — pemecahan *pre · natal · talks* ditampilkan sebagai tiga kartu berurutan.
2. **Sejarah** — timeline sejak 28 Agustus 2020 hingga sekarang, dengan tonggak yang bisa ditambah admin dari pengaturan.
3. **Komitmen** — "Empowerment Women's Health" ditampilkan besar, disertai penjelasan pendekatan berbasis bukti ilmiah.
4. **Filosofi logo** — logo besar disertai keterangan makna siluet ibu, ayah, anak, dan lingkaran.
5. **Filosofi warna** — dua blok warna ungu dan toska dengan maknanya.
6. **Profil tim** — foto, nama, peran, kualifikasi (khusus tenaga kesehatan: nama profesi dan STR bila relevan, karena ini yang membuat klaim "berbasis bukti" dapat diverifikasi).
7. **CTA** — ajakan bergabung ke komunitas dan mendaftar.

**Kriteria terima**
- Konten seksi 1–5 disimpan di tabel `settings` sehingga dapat disunting admin tanpa deploy ulang.
- Profil tim dikelola lewat panel admin (CRUD sederhana: foto, nama, peran, deskripsi, urutan).
- Halaman ini di-render statis (SSG) dan memiliki metadata Open Graph dengan logo penuh warna.

---

## 10. Skema Basis Data (PostgreSQL)

Konvensi: `snake_case`, primary key `id BIGSERIAL`, `created_at`/`updated_at`, soft delete (`deleted_at`) pada tabel konten.

```sql
-- ============ IDENTITAS & AKSES ============
users(
  id, name, email UNIQUE, phone, password_hash,
  role ENUM('user','health_worker','admin','super_admin') DEFAULT 'user',
  email_verified_at, avatar_path, is_active BOOLEAN DEFAULT true,
  last_login_at, created_at, updated_at, deleted_at
)

refresh_tokens(id, user_id FK, token_hash, expires_at, revoked_at, user_agent, ip)

-- ============ DATA KEHAMILAN ============
pregnancies(
  id, user_id FK, lmp_date DATE,            -- HPHT
  edd_date DATE,                            -- HPL
  edd_overridden BOOLEAN DEFAULT false,
  gravida SMALLINT, para SMALLINT, abortus SMALLINT,
  height_cm NUMERIC(5,1), weight_prepregnancy_kg NUMERIC(5,1), weight_current_kg NUMERIC(5,1),
  blood_type VARCHAR(5), medical_history JSONB,
  facility_name VARCHAR(150), facility_contact VARCHAR(50),
  status ENUM('active','completed','archived') DEFAULT 'active',
  created_at, updated_at
)

-- ============ CHECKLIST RISIKO ============
questionnaires(id, title, description, version INT, is_active BOOLEAN, published_at, created_by FK)

questions(
  id, questionnaire_id FK, text, help_text,
  type ENUM('single_choice','multiple_choice','boolean','number'),
  is_required BOOLEAN, order_index INT, group_label
)

question_options(
  id, question_id FK, label, score INT DEFAULT 0,
  is_danger_sign BOOLEAN DEFAULT false, order_index INT
)

risk_levels(
  id, questionnaire_id FK, name, min_score INT, max_score INT,
  color_hex VARCHAR(7), recommendation TEXT, order_index INT
)

risk_assessments(
  id, user_id FK, pregnancy_id FK NULL, questionnaire_id FK,
  questionnaire_version INT, total_score INT,
  risk_level_id FK, has_danger_sign BOOLEAN DEFAULT false,
  status ENUM('in_progress','completed'), completed_at, created_at
)

risk_answers(
  id, assessment_id FK, question_id FK,
  option_id FK NULL, value_number NUMERIC NULL, value_text TEXT NULL, score INT
)

-- ============ FORM & SURVEI ============
forms(
  id, title, slug UNIQUE, description,
  type ENUM('form','survey'),
  is_public BOOLEAN, requires_login BOOLEAN, is_anonymous BOOLEAN,
  one_response_per_user BOOLEAN,
  status ENUM('draft','published','closed'),
  opens_at, closes_at, created_by FK, created_at, updated_at
)

form_fields(
  id, form_id FK, label, description,
  type ENUM('text','textarea','number','date','radio','checkbox','select','scale','file'),
  options JSONB, validation JSONB, is_required BOOLEAN, order_index INT
)

form_submissions(id, form_id FK, user_id FK NULL, submitted_at, ip_hash, user_agent)
form_answers(id, submission_id FK, field_id FK, value TEXT, value_json JSONB)

-- ============ KONTEN ============
categories(id, name, slug UNIQUE, type ENUM('article','video','faq'), order_index)
-- catatan: life_stage disimpan sebagai kolom terpisah, bukan kategori,
-- agar satu artikel bisa punya kategori topik + tahap kehidupan sekaligus

articles(
  id, title, slug UNIQUE, excerpt, content TEXT, cover_path,
  category_id FK, trimester SMALLINT NULL, author_id FK,
  life_stage ENUM('preconception','pregnancy','birth','postpartum','parenting') DEFAULT 'pregnancy',
  source_reference TEXT,            -- rujukan ilmiah (janji "berbasis bukti")
  reviewed_at DATE, reviewed_by FK NULL,   -- tanggal tinjauan terakhir
  status ENUM('draft','published'), published_at,
  views_count INT DEFAULT 0, reading_minutes SMALLINT,
  meta_title, meta_description, created_at, updated_at, deleted_at
)

videos(
  id, title, slug UNIQUE, description, youtube_id VARCHAR(20),
  thumbnail_path, category_id FK, duration_seconds INT,
  life_stage ENUM('preconception','pregnancy','birth','postpartum','parenting') DEFAULT 'pregnancy',
  status ENUM('draft','published'), published_at, created_at, updated_at, deleted_at
)

faqs(id, question, answer TEXT, category_id FK, order_index, is_published BOOLEAN)

-- ============ CHECKLIST PERSIAPAN ============
checklist_items(id, group_name, title, description, order_index, is_active BOOLEAN)

user_checklist_progress(
  id, user_id FK, checklist_item_id FK NULL,
  custom_title VARCHAR(200) NULL,   -- untuk item tambahan pengguna
  is_checked BOOLEAN DEFAULT false, checked_at,
  UNIQUE(user_id, checklist_item_id)
)

-- ============ SISTEM ============
settings(id, key UNIQUE, value JSONB, group_name)   -- tautan komunitas, kontak, teks disclaimer
audit_logs(id, user_id FK, action, model_type, model_id, changes JSONB, ip, created_at)
```

**Indeks penting**
```sql
CREATE INDEX idx_articles_status_published ON articles(status, published_at DESC);
CREATE INDEX idx_assessments_user_created  ON risk_assessments(user_id, created_at DESC);
CREATE INDEX idx_answers_assessment        ON risk_answers(assessment_id);
CREATE INDEX idx_submissions_form          ON form_submissions(form_id, submitted_at DESC);
CREATE INDEX idx_articles_search           ON articles USING GIN (to_tsvector('indonesian', title || ' ' || excerpt));
```

---

## 11. Spesifikasi API (Laravel)

**Base URL:** `https://api.prenatalks.id/api/v1`
**Auth:** `Authorization: Bearer <access_token>` (JWT, algoritma HS256)

### 11.1 Format Respons Standar

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": { },
  "meta": { "current_page": 1, "per_page": 12, "total": 48 }
}
```

Error:
```json
{
  "success": false,
  "message": "Data yang diberikan tidak valid",
  "errors": { "lmp_date": ["HPHT tidak boleh melebihi tanggal hari ini"] }
}
```

Kode status: `200` OK · `201` Created · `401` token tidak valid · `403` tanpa hak akses · `422` validasi gagal · `429` rate limit · `500` galat server.

### 11.2 Daftar Endpoint

**Auth**
| Method | Endpoint | Akses |
|---|---|---|
| POST | `/auth/register` | publik |
| POST | `/auth/login` | publik |
| POST | `/auth/refresh` | refresh token |
| POST | `/auth/logout` | login |
| GET | `/auth/me` | login |
| POST | `/auth/forgot-password` | publik |
| POST | `/auth/reset-password` | publik |
| POST | `/auth/verify-email/{id}/{hash}` | publik (signed) |

**Kehamilan & Kalkulator**
| Method | Endpoint | Akses |
|---|---|---|
| GET/POST/PUT | `/pregnancies` `/pregnancies/{id}` | user |
| POST | `/calculator` — body `{ "lmp_date": "2026-01-15" }` | publik |

Respons kalkulator:
```json
{ "data": { "gestational_age": { "weeks": 28, "days": 3, "text": "28 minggu 3 hari" },
            "edd_date": "2026-10-22", "trimester": 3, "days_remaining": 80, "progress_percent": 71 } }
```

**Checklist Risiko**
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/questionnaires/active` | user |
| POST | `/assessments` (mulai) | user |
| PATCH | `/assessments/{id}/answers` (simpan bertahap) | user |
| POST | `/assessments/{id}/submit` | user |
| GET | `/assessments` (riwayat) · `/assessments/{id}` | user |
| GET | `/assessments/{id}/pdf` | user |
| GET/POST/PUT/DELETE | `/admin/questionnaires/*` | super_admin |

**Konten**
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/articles` `?life_stage=&category=&trimester=&search=&page=` | publik |
| GET | `/articles/{slug}` | publik |
| GET | `/videos` `/videos/{slug}` `/faqs` `/categories` | publik |
| GET | `/stats` (angka landing page) | publik |
| POST/PUT/DELETE | `/admin/articles` `/admin/videos` `/admin/faqs` | admin |

**Form & Survei**
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/forms/{slug}` | publik/login sesuai konfigurasi |
| POST | `/forms/{slug}/submit` | sesuai konfigurasi |
| GET | `/admin/forms` · `/admin/forms/{id}/submissions` | admin |
| POST | `/admin/forms/{id}/export?format=csv\|xlsx` | admin |

**Checklist Persiapan**
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/checklist` | user |
| PATCH | `/checklist/{itemId}` `{ "is_checked": true }` | user |
| POST/DELETE | `/checklist/custom` | user |

**Admin & Sistem**
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/admin/dashboard` | admin |
| GET/PUT | `/admin/users` `/admin/users/{id}` | super_admin |
| GET/PUT | `/admin/settings` | admin |
| GET | `/admin/audit-logs` | super_admin |

### 11.3 Rate Limit

| Grup | Batas |
|---|---|
| `/auth/login`, `/auth/register`, `/auth/forgot-password` | 5 / menit / IP |
| API pengguna terautentikasi | 60 / menit |
| API publik (konten) | 120 / menit / IP |
| Export data | 3 / jam / admin |

---

## 12. Kebutuhan Non-Fungsional

### 12.1 Performa
- TTFB < 600 ms; LCP < 2,5 s (4G); response API p95 < 400 ms.
- Halaman konten publik menggunakan ISR; gambar dikonversi WebP dan disajikan responsif.
- Bundle JS awal < 200 KB gzipped.

### 12.2 Keamanan
- HTTPS wajib (Let's Encrypt, auto-renew), HSTS aktif.
- JWT secret minimal 64 karakter acak, disimpan di `.env`, tidak masuk repositori.
- Refresh token disimpan sebagai hash di basis data dan dirotasi setiap pemakaian.
- Validasi seluruh input di backend (Form Request); query lewat Eloquent/prepared statement.
- Header keamanan: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- CORS dibatasi ke domain frontend.
- Upload dibatasi tipe MIME dan ukuran; berkas disimpan di luar document root dan disajikan lewat route terkontrol.
- Backup basis data harian otomatis (`pg_dump`), retensi 14 hari, disimpan terenkripsi di luar VPS.

### 12.3 Privasi Data Kesehatan
- Data kehamilan dan hasil assessment tergolong data pribadi spesifik menurut UU PDP No. 27/2022 — memerlukan **persetujuan eksplisit** saat registrasi, dengan bahasa yang jelas.
- Prinsip minimalisasi data: hanya kumpulkan yang dipakai fitur.
- Pengguna dapat mengunduh dan menghapus akun beserta datanya (hapus permanen dalam 30 hari).
- Data survei untuk penelitian dianonimkan sebelum export bila survei ditandai anonim.
- Akses tenaga kesehatan ke data pengguna hanya dengan consent dan tercatat di audit log.

### 12.4 Disclaimer Medis (wajib)
Ditampilkan di halaman hasil risiko, kalkulator, artikel kesehatan, dan footer:

> Informasi di PrenaTalks bersifat edukatif dan bukan pengganti pemeriksaan, diagnosis, atau nasihat tenaga kesehatan. Hasil cek risiko adalah penilaian mandiri berbasis skor, bukan diagnosis. Bila Anda mengalami tanda bahaya seperti perdarahan, nyeri hebat, demam tinggi, atau berkurangnya gerakan janin, segera hubungi bidan, dokter, atau fasilitas kesehatan terdekat.

Nomor darurat dan tautan pencarian faskes terdekat ditampilkan pada alert tanda bahaya.

### 12.5 Kompatibilitas
- Browser: Chrome, Firefox, Safari, Edge — 2 versi terakhir.
- Breakpoint: 360px, 768px, 1024px, 1440px. Desain diprioritaskan mobile-first.

### 12.6 Bahasa & Konten
- Bahasa Indonesia sebagai bahasa tunggal v1 (struktur i18n disiapkan untuk penambahan bahasa daerah di masa depan).
- Gaya bahasa: hangat, jelas, kalimat pendek, hindari istilah medis tanpa penjelasan.

---

## 13. Struktur Proyek

Monorepo satu repository Git dengan dua folder utama di root: `web/` (Next.js) dan `api/` (Laravel).

**Frontend (Next.js)**
```
web/
├─ app/
│  ├─ (public)/          page.tsx, tentang, artikel, video, faq, komunitas, survei
│  ├─ (auth)/            masuk, daftar, lupa-password
│  ├─ dashboard/         layout.tsx + subhalaman pengguna
│  ├─ admin/             layout.tsx + panel admin
│  └─ api/auth/          route handler proxy cookie
├─ components/
│  ├─ ui/                shadcn/ui
│  ├─ landing/           hero, stats-bar, feature-grid, testimonials, cta-banner
│  └─ shared/            navbar, footer, disclaimer-alert, risk-badge
├─ lib/                  api-client.ts, auth.ts, validations/ (Zod), utils.ts
├─ hooks/                use-auth.ts, use-pregnancy.ts, use-assessment.ts
└─ types/
```

**Backend (Laravel)**
```
api/
├─ app/
│  ├─ Http/Controllers/Api/V1/   Auth, Pregnancy, Assessment, Form, Article, Admin
│  ├─ Http/Requests/             validasi per endpoint
│  ├─ Http/Resources/            transformasi JSON
│  ├─ Models/
│  ├─ Services/                  PregnancyCalculator, RiskScoringService, ExportService
│  ├─ Policies/
│  └─ Jobs/                      ExportSubmissions, SendVerificationEmail
├─ database/migrations|seeders/
└─ routes/api.php
```

---

## 14. Rencana Implementasi Mingguan

### 14.1 Asumsi Perencanaan

| Aspek | Asumsi |
|---|---|
| Tim | 2 pengembang (1 fokus Laravel/API, 1 fokus Next.js/UI) + 1 bidan sebagai reviewer klinis paruh waktu |
| Kapasitas | 5 hari kerja per minggu, ±30 jam efektif per orang |
| Durasi | **14 minggu** dari kick-off sampai rilis produksi |
| Jika dikerjakan sendirian | Kalikan ±1,6 → sekitar **22 minggu**. Jangan memampatkan jadwal; potong lingkup ke fitur P0 saja |
| Buffer | Minggu 13 sengaja dijaga ringan sebagai penyangga keterlambatan |

**Aturan urutan yang tidak boleh dilanggar:** autentikasi selesai sebelum fitur apa pun yang menyimpan data pengguna, dan **seed kuesioner risiko harus sudah ada di tangan bidan pada Minggu 6** — validasi klinis adalah jalur kritis terpanjang di proyek ini karena bergantung pada orang di luar tim pengembang.

### 14.2 Jadwal per Minggu

| Minggu | Fokus | Backend (Laravel) | Frontend (Next.js) | Keluaran akhir minggu |
|---|---|---|---|---|
| **1** | Fondasi proyek | Instalasi Laravel 13, koneksi PostgreSQL, struktur folder, format respons standar, health check, CI | Instalasi Next.js + Tailwind + shadcn/ui, design token ungu–toska, font, layout dasar | Staging hidup di VPS, frontend memanggil `/health` dan berhasil |
| **2** | Autentikasi & akses | Migrasi `users`+`refresh_tokens`, JWT (register, login, refresh rotasi, logout, verifikasi email, reset password), middleware RBAC | Halaman Masuk, Daftar, Lupa Password; interceptor token; route handler cookie; guard rute | Pengguna dapat mendaftar, verifikasi email, login, dan mengakses halaman terlindung |
| **3** | Kerangka & landing bagian atas | Endpoint `/stats`, seeder data awal, `settings` | Navbar (+menu mobile), Hero, floating card, bar statistik, grid 6 kartu fitur | Separuh atas landing page selesai dan responsif |
| **4** | Landing selesai & Tentang | CRUD profil tim, konten `settings` untuk halaman Tentang | Testimoni carousel, CTA banner, Footer, halaman Tentang (F-16), SEO dasar, sitemap | **M1 — Landing page & Tentang siap dipamerkan ke stakeholder** |
| **5** | Data kehamilan & kalkulator | Migrasi `pregnancies`, CRUD, `PregnancyCalculator` service + uji unit (kabisat, lintas tahun) | Form data kehamilan, halaman kalkulator (mode tamu & login), progres melingkar | Kalkulator akurat dan dapat dipakai publik |
| **6** | Mesin skor risiko | Migrasi `questionnaires`/`questions`/`options`/`risk_levels`, `RiskScoringService` + uji unit, seeder draf KSPR, API admin kuesioner | Kerangka dashboard pengguna, panel admin kuesioner (CRUD pertanyaan, bobot, drag-urutan) | **Draf kuesioner dikirim ke bidan untuk validasi klinis** (jalur kritis) |
| **7** | Alur cek risiko | API mulai/simpan bertahap/submit, deteksi `is_danger_sign`, generator PDF hasil | Kuesioner multi-langkah dengan autosave, halaman hasil, badge level, alert tanda bahaya, unduh PDF | Alur cek risiko utuh dari mulai sampai hasil |
| **8** | Riwayat & dashboard | Endpoint riwayat, agregasi tren skor, audit log | Halaman riwayat + grafik tren, dashboard ringkas (usia kehamilan, status risiko, progres) | **M2 — Fitur inti selesai. Umpan balik bidan diterima dan bobot skor diperbaiki** |
| **9** | Artikel | Migrasi `articles`/`categories`, CRUD, unggah gambar + WebP, pencarian full-text Indonesia | Editor TipTap di panel admin, daftar & detail artikel publik, filter tahap kehidupan, JSON-LD | Admin dapat menerbitkan artikel tanpa bantuan developer |
| **10** | Video, FAQ & konten | CRUD video (validasi URL YouTube) dan FAQ, endpoint kategori | Galeri & detail video, accordion FAQ + pencarian, panel admin keduanya | **M3 — Seluruh modul konten dapat dikelola mandiri** |
| **11** | Form Builder | Migrasi `forms`/`form_fields`/`submissions`/`answers`, API builder, validasi dinamis | Antarmuka builder (tambah field, atur validasi, pratinjau), halaman pengisian form | Admin dapat membuat form baru dan menerima respon |
| **12** | Survei, export & checklist | Ringkasan respon, export CSV/XLSX via queue, `checklist_items` + progres pengguna | Halaman survei publik, tampilan ringkasan respon, checklist persiapan dengan progress bar, halaman komunitas | **M4 — Seluruh fitur P0 selesai (code freeze fitur)** |
| **13** | Pengerasan & dokumentasi | Header keamanan, rate limit, uji backup–restore, dokumentasi API, optimasi query lambat | Audit Lighthouse & aksesibilitas, uji lintas peramban, halaman galat & keadaan kosong, panduan admin | Skor Lighthouse mobile ≥ 85 dan restore basis data terbukti berhasil |
| **14** | UAT & rilis | Perbaikan temuan, konfigurasi produksi, SSL, cron backup, monitoring | Perbaikan temuan UAT, teks final, konten awal (min. 20 artikel) | **M5 — Rilis produksi + pelatihan admin** |

### 14.3 Ritme Kerja Mingguan

- **Senin:** perencanaan 30 menit — tentukan keluaran minggu ini dan siapa mengerjakan apa.
- **Harian:** sinkronisasi 10 menit, khususnya untuk menyepakati kontrak API sebelum frontend menunggu.
- **Kamis:** integrasi ke staging, apa pun kondisinya. Jangan menumpuk integrasi ke akhir minggu.
- **Jumat:** demo internal + `Definition of Done` dicentang + catat utang teknis.
- **Aturan kontrak API:** setiap endpoint disepakati bentuk responsnya di awal minggu, sehingga frontend bisa berjalan dengan data tiruan tanpa menunggu backend selesai.

### 14.4 Definition of Done per Fitur

Sebuah fitur baru boleh disebut selesai jika: kriteria terima pada bagian 9 terpenuhi · ada uji unit untuk logika skor dan kalkulator · tampil benar pada 360–1440px · dapat dioperasikan dengan keyboard dan punya focus ring · terdokumentasi di API docs (Scramble/Swagger) · sudah di-review pengembang lain · tidak menyisakan `console.log` atau data hardcode.

### 14.5 Pasca-Rilis

| Periode | Kegiatan |
|---|---|
| Minggu 15–16 | Pemantauan intensif, perbaikan bug prioritas, pendampingan admin |
| Bulan 2–3 | Akses tenaga kesehatan (F-15), notifikasi pengingat via WhatsApp, PWA agar dapat dibuka luring |
| Bulan 4–6 | Ekspansi konten ke tahap prakonsepsi, nifas & menyusui, dan pengasuhan; evaluasi metrik pada bagian 3 |
| Tiap 12 bulan | Tinjau ulang seluruh artikel kesehatan dan bobot kuesioner bersama tenaga kesehatan |

---

## 15. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Bobot skor kuesioner tidak tervalidasi klinis | Tinggi — hasil menyesatkan | Wajib review & tanda tangan bidan/dokter sebelum rilis; simpan versi kuesioner |
| Pengguna menganggap hasil sebagai diagnosis | Tinggi | Disclaimer di beberapa titik, bahasa hasil non-diagnostik, alert tanda bahaya |
| Kebocoran data kesehatan | Tinggi | Enkripsi transit, hash refresh token, backup terenkripsi, audit log, minimalisasi data |
| Sumber daya VPS terbatas saat lonjakan trafik | Sedang | ISR + cache, embed YouTube alih-alih hosting video, monitoring uptime |
| Admin non-teknis kesulitan memakai panel | Sedang | Panel berbahasa Indonesia, pratinjau, panduan penggunaan, sesi pelatihan |
| Konten kedaluwarsa secara medis | Sedang | Tanggal tinjauan terakhir & sumber rujukan per artikel + pengingat review tiap 12 bulan |
| Validasi bidan terlambat karena di luar kendali tim | Tinggi — menahan fitur inti | Draf kuesioner dikirim di Minggu 6, bukan menjelang rilis; sepakati tenggat umpan balik di awal proyek |
| Merah muda & toska dipakai untuk teks kecil sehingga gagal kontras | Rendah | Token teks terpisah (`--primary-text` `#DB2777`, `--brand-teal-text` `#0F766E`) disediakan sejak awal; diperiksa saat review desain |
| Identitas ungu–toska tenggelam karena antarmuka didominasi merah muda | Sedang | Aturan proporsi 60/25/15 pada bagian 7.1 dan penempatan ungu pada elemen kredibilitas |

---

## 16. Pertanyaan Terbuka

1. Siapa tenaga kesehatan penanggung jawab validasi isi kuesioner risiko dan rekomendasi per level?
2. Apakah survei penelitian memerlukan persetujuan etik (ethical clearance)? Jika ya, teks informed consent perlu disiapkan.
3. Apakah nomor kontak darurat yang ditampilkan bersifat nasional (119) atau puskesmas/RS mitra di Gresik?
4. Berapa perkiraan volume respon survei untuk menentukan strategi export (sinkron vs queue)?
5. Apakah foto pada landing page akan menggunakan aset berlisensi atau foto asli hasil pemotretan?
6. Apakah aset logo final (SVG penuh warna, monokrom ungu, monokrom putih) sudah tersedia? Ini dibutuhkan paling lambat **Minggu 3**.
7. Kode warna ungu, toska, dan merah muda pada berkas merek asli — apakah persis `#7C3AED`, `#14B8A6`, dan `#F472B6`, atau perlu diambil langsung dari berkas logo/mockup sumber?
8. Siapa yang menyiapkan 20 artikel awal sebelum rilis di Minggu 14, dan apakah ada arsip konten PrenaTalks sejak 2020 yang bisa dimigrasikan?

---

## Lampiran A — Contoh Konfigurasi Kuesioner Risiko

Contoh berikut mengacu pada kelompok faktor KSPR dan **harus divalidasi ulang** oleh tenaga kesehatan sebelum dipakai.

| Kelompok | Pertanyaan | Opsi | Skor |
|---|---|---|---|
| Skor awal | Setiap ibu hamil | — | 2 |
| Riwayat | Usia saat ini | < 16 tahun / 16–34 / ≥ 35 tahun | 4 / 0 / 4 |
| Riwayat | Jarak dari persalinan terakhir | < 2 tahun / ≥ 2 tahun / belum pernah | 4 / 0 / 0 |
| Riwayat | Jumlah anak | ≥ 4 / < 4 | 4 / 0 |
| Riwayat | Pernah keguguran | Ya / Tidak | 4 / 0 |
| Riwayat | Pernah operasi sesar | Ya / Tidak | 8 / 0 |
| Kondisi | Tinggi badan < 145 cm | Ya / Tidak | 4 / 0 |
| Kondisi | Anemia / hipertensi / diabetes | pilihan ganda | 4 per item |
| Kondisi | Posisi janin sungsang atau lintang | Ya / Tidak | 8 / 0 |
| Tanda bahaya | Perdarahan | Ya *(`is_danger_sign`)* / Tidak | 8 / 0 |
| Tanda bahaya | Kejang / pandangan kabur berat | Ya *(`is_danger_sign`)* / Tidak | 8 / 0 |

---

## Lampiran B — Variabel Lingkungan

**Frontend `.env.local`**
```
NEXT_PUBLIC_API_URL=https://api.prenatalks.id/api/v1
NEXT_PUBLIC_SITE_URL=https://prenatalks.id
AUTH_COOKIE_NAME=pt_refresh
```

**Backend `.env`**
```
APP_URL=https://api.prenatalks.id
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=prenatalks
JWT_SECRET=<64+ karakter acak>
JWT_TTL=60
JWT_REFRESH_TTL=20160
FRONTEND_URL=https://prenatalks.id
MAIL_MAILER=smtp
QUEUE_CONNECTION=database
```

---

## Lampiran C — Checklist Sebelum Rilis

- [ ] Kuesioner risiko & teks rekomendasi disetujui tenaga kesehatan
- [ ] Disclaimer tampil di seluruh halaman kesehatan
- [ ] Kebijakan privasi & syarat ketentuan terpublikasi
- [ ] Alur hapus akun berfungsi
- [ ] Backup otomatis terverifikasi (uji restore)
- [ ] SSL aktif, header keamanan lolos securityheaders.com
- [ ] Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90
- [ ] Uji pada perangkat Android kelas menengah dengan jaringan 4G
- [ ] Panduan penggunaan admin selesai + sesi pelatihan dilakukan
- [ ] Logo tampil benar di favicon, `og-image`, dan varian monokrom pada latar gelap
- [ ] Ungu dan toska tampil di setiap halaman utama, tidak hanya pada logo (uji proporsi 60/25/15)
- [ ] Minimal 20 artikel terbit, seluruhnya memuat sumber rujukan dan tanggal tinjauan