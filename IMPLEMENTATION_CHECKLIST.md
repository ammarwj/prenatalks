# Checklist Implementasi — PrenaTalks

Diturunkan dari **Bagian 9 (Spesifikasi Fitur)**, **Bagian 10 (Skema DB)**, **Bagian 11 (API)**, dan **Bagian 14 (Rencana Mingguan)** di `PRD.md`. Setiap item merujuk tabel/endpoint yang sudah didefinisikan di sana — dokumen ini memecahnya jadi task yang bisa dicentang per fitur, bukan menambah lingkup baru.

Urutan mengikuti dependensi wajib dari bagian 14.1: **fondasi → autentikasi → fitur inti (kalkulator, cek risiko) → konten → form/survei/checklist → pengerasan & rilis.**

---

## 0. Fondasi Proyek (Minggu 1)

**Backend**
- [ ] Instalasi Laravel 13, koneksi PostgreSQL 16
- [ ] Format respons standar (`success`/`message`/`data`/`meta`) sebagai middleware/trait global
- [ ] Format error standar (`success:false`, `errors` per field)
- [ ] Endpoint `GET /health`
- [ ] CI dasar (lint + test on push)

**Frontend**
- [x] Instalasi Next.js (App Router) + Tailwind + shadcn/ui — `web/`, Next.js 16 (memenuhi syarat "14+")
- [x] Design token CSS variable sesuai 7.1 (`--brand-purple`, `--brand-teal`, `--primary`, dst.) di `globals.css`
- [x] Font Plus Jakarta Sans (display) + Nunito Sans (body) via `next/font`, `display: swap`, subset `latin`
- [x] Layout dasar (shell navbar/footer)
- [ ] Panggilan ke `/health` berhasil dari frontend — menunggu backend Laravel

**Infra**
- [ ] Staging hidup di VPS (Nginx + PM2 + PHP-FPM)
- [ ] `.env` frontend & backend sesuai Lampiran B (belum masuk repo)

---

## F-01 · Landing Page (P0)

**Frontend** — dibangun mengikuti mockup landing page + bagian 7 (Design System)
- [x] Navbar: logo + wordmark + tagline, menu 7 item, underline aktif, scroll-spy antar seksi
- [x] Navbar mobile: hamburger + `Sheet` dengan daftar menu
- [x] Hero: H1 tiga baris dua warna, paragraf, 3 tombol (Mulai Sekarang / Cek Risiko / Belajar Gratis)
- [x] Hero: 3 floating card (Informasi Terpercaya, Untuk Ibu & Janin, Akses Kapan Saja) — susun absolut di desktop, susun vertikal di mobile
- [x] Bar statistik: 4 item, kartu putih mengambang tumpang-tindih batas hero
- [x] Grid 6 kartu fitur dengan warna sesuai tabel 7.1 (Belajar, Cek Risiko, Siap Lahiran, Tanda Bahaya, Tanya Bidan, Artikel)
- [x] Testimoni: carousel (Embla via shadcn) + dot indicator, 3 testimoni dari mockup
- [x] CTA banner: gradien merah muda + tombol putih
- [x] Footer: 4 kolom + ikon sosial + bar bawah ungu dengan tahun copyright dinamis
- [x] Fade-up saat scroll (Framer Motion, 16px/400ms) + `prefers-reduced-motion` dihormati
- [x] Layout 6 kartu fitur: 1 kolom mobile, 2 kolom tablet, 3 kolom desktop
- [ ] Angka statistik bersumber dari `GET /api/v1/stats` — saat ini hardcode mengikuti mockup, sambungkan begitu endpoint tersedia
- [ ] LCP < 2,5 detik pada koneksi 4G — belum diukur (butuh foto hero asli, lihat catatan di bawah)
- [ ] Foto hero asli ibu hamil — belum ada aset (Pertanyaan Terbuka PRD #5); saat ini pakai ilustrasi lingkaran bertema logo sebagai placeholder di `components/landing/hero.tsx`

---

## F-02 · Autentikasi & Akun (P0) — prasyarat semua fitur berikutnya

**Backend**
- [ ] Migrasi `users`, `refresh_tokens` (skema bagian 10)
- [ ] `tymon/jwt-auth`, algoritma HS256, `JWT_SECRET` 64+ karakter acak di `.env`
- [ ] `POST /auth/register` — validasi password (min 8, huruf+angka), checkbox persetujuan wajib
- [ ] Verifikasi email via signed URL (TTL 60 menit) — `POST /auth/verify-email/{id}/{hash}`
- [ ] `POST /auth/login` — rate limit 5/menit/IP
- [ ] `POST /auth/refresh` — rotasi token, token lama masuk denylist
- [ ] `POST /auth/logout` — blacklist access token, hapus cookie
- [ ] `POST /auth/forgot-password`, `POST /auth/reset-password`
- [ ] `GET /auth/me`
- [ ] Lockout 15 menit setelah 10 kegagalan login berturut-turut
- [ ] Middleware RBAC (`user`/`health_worker`/`admin`/`super_admin`) via Policy/Gate
- [ ] Password di-hash bcrypt cost 12

**Frontend**
- [ ] Halaman `/masuk`, `/daftar`, `/lupa-password`, `/reset-password`
- [ ] Route Handler `app/api/auth/*` → simpan `refresh_token` ke cookie `httpOnly; Secure; SameSite=Lax`
- [ ] Access token disimpan di memory (Zustand/Context), **tidak pernah** di `localStorage`
- [ ] Interceptor: terima 401 → panggil refresh sekali → ulangi request
- [ ] Guard rute `/dashboard/*` dan `/admin/*` (redirect ke `/masuk` bila tidak ada sesi)
- [ ] Banner pengingat verifikasi email (blokir simpan assessment sebelum verifikasi)

**Definition of Done tambahan**
- [ ] Audit manual: token tidak muncul di `localStorage`/`sessionStorage` pada DevTools
- [ ] Uji rate limit & lockout (integration test)

---

## F-03 · Profil Data Kehamilan (P0)

**Backend**
- [ ] Migrasi `pregnancies`
- [ ] `GET/POST/PUT /pregnancies`, `/pregnancies/{id}`
- [ ] Validasi: HPHT tidak di masa depan, tidak lebih dari 300 hari lalu
- [ ] Aturan hanya satu `status = active` per user (constraint/service logic)
- [ ] Perubahan HPHT memicu rekalkulasi HPL & usia kehamilan di seluruh dashboard

**Frontend**
- [ ] Form data kehamilan (HPHT, gravida/para/abortus, tinggi/berat, gol. darah, riwayat penyakit multi-select, kontak faskes)
- [ ] Tampilan riwayat kehamilan sebelumnya (bila > 1)

---

## F-04 · Kalkulator Kehamilan (P0)

**Backend**
- [ ] `POST /calculator` (publik) — hitung usia kehamilan, HPL (Naegele), trimester, sisa hari, progress %
- [ ] `PregnancyCalculator` service
- [ ] Unit test: tahun kabisat, pergantian tahun

**Frontend**
- [ ] Halaman `/kalkulator` mode tamu (hasil tidak disimpan)
- [ ] `/dashboard/kalkulator` mode login (hasil tersimpan via `/pregnancies`)
- [ ] Progres visual melingkar per trimester
- [ ] Catatan disclaimer siklus 28 hari / USG lebih akurat

---

## F-05 · Checklist Risiko — Core Feature (P0)

**Backend**
- [ ] Migrasi `questionnaires`, `questions`, `question_options`, `risk_levels`, `risk_assessments`, `risk_answers`
- [ ] Seeder draf kuesioner (acuan KSPR) — **wajib siap Minggu 6** untuk dikirim ke bidan (jalur kritis, bagian 14.1)
- [ ] `RiskScoringService` (jumlah skor, klasifikasi level, deteksi `is_danger_sign`)
- [ ] `GET /questionnaires/active`
- [ ] `POST /assessments` (mulai), `PATCH /assessments/{id}/answers` (simpan bertahap/autosave)
- [ ] `POST /assessments/{id}/submit`
- [ ] `GET /assessments` (riwayat), `GET /assessments/{id}`
- [ ] `GET /assessments/{id}/pdf` (generator PDF hasil)
- [ ] `admin/questionnaires/*` CRUD (super_admin only) — pertanyaan, opsi, bobot skor, ambang level
- [ ] Assessment lama tetap tertaut ke `questionnaire_version` saat pengisian (riwayat tidak berubah walau kuesioner disunting)
- [ ] Unit test: perhitungan skor, klasifikasi level, deteksi tanda bahaya

**Frontend**
- [ ] Kuesioner multi-langkah dengan autosave per langkah
- [ ] Halaman hasil: badge level, skor, rincian faktor penyumbang, rekomendasi per level
- [ ] Alert merah persisten untuk tanda bahaya (terlepas dari skor total)
- [ ] Tombol "Unduh PDF hasil" dan "Bagikan ke bidan"
- [ ] Disclaimer wajib di atas & bawah hasil
- [ ] Halaman riwayat + grafik tren skor antarwaktu
- [ ] Panel admin kuesioner: CRUD pertanyaan, bobot, drag-drop urutan, atur ambang skor per level

**Definition of Done tambahan**
- [ ] Kuesioner dapat diselesaikan ≤ 3 menit (uji manual)
- [ ] Hasil tidak pernah memakai kata "diagnosis"/"penyakit"/nama kondisi medis (review konten)
- [ ] **Validasi & tanda tangan bidan/dokter penanggung jawab** diterima sebelum rilis (lihat bagian 15, risiko #1)

---

## F-06 · Form Builder (P0)

**Backend**
- [ ] Migrasi `forms`, `form_fields`
- [ ] API builder: buat/ubah form, tambah/atur field (tipe, label, validasi min/maks/regex)
- [ ] Validasi dinamis submission sesuai `validation JSONB` per field
- [ ] Status form: draft/terbit/tutup, `opens_at`/`closes_at`

**Frontend**
- [ ] Antarmuka builder admin (tambah field, atur wajib/opsional, placeholder, validasi)
- [ ] Pratinjau form sebelum terbit
- [ ] Upload berkas field (maks 2MB) dengan validasi tipe

---

## F-07 · Survei & Export Data (P0)

**Backend**
- [ ] `forms` dengan `type = survey`, field `is_anonymous`, `one_response_per_user`
- [ ] Migrasi `form_submissions`, `form_answers`
- [ ] `GET /forms/{slug}` (publik/login sesuai konfigurasi), `POST /forms/{slug}/submit`
- [ ] `GET /admin/forms`, `GET /admin/forms/{id}/submissions`
- [ ] `POST /admin/forms/{id}/export?format=csv|xlsx` via queue (untuk >1.000 baris), `ExportSubmissions` job
- [ ] Tautan unduh berumur 24 jam
- [ ] BOM UTF-8 agar karakter Indonesia tidak rusak di Excel
- [ ] ID responden hanya disertakan jika survei tidak anonim

**Frontend**
- [ ] Halaman publik `/survei/[slug]`
- [ ] Ringkasan respon: jumlah responden, distribusi jawaban (bar chart)
- [ ] Halaman admin: lihat respon, trigger export, unduh hasil

---

## F-08 · Artikel (P0)

**Backend**
- [ ] Migrasi `articles`, `categories`
- [ ] CRUD artikel, slug otomatis, status draft/terbit, jadwal terbit
- [ ] Upload cover + konversi WebP (Intervention Image)
- [ ] Full-text search Indonesia (index GIN, lihat bagian 10 indeks)
- [ ] `GET /articles?life_stage=&category=&trimester=&search=&page=`, `GET /articles/{slug}`
- [ ] `POST/PUT/DELETE /admin/articles`
- [ ] Field wajib: `source_reference`, `reviewed_at`, `reviewed_by`

**Frontend**
- [ ] Editor rich text (TipTap) di panel admin
- [ ] Daftar publik dengan filter `life_stage`/kategori/trimester, pencarian judul, pagination 12/halaman
- [ ] Detail artikel: cover, penulis, tanggal, estimasi baca, artikel terkait, tombol bagikan WhatsApp
- [ ] Sumber rujukan & tanggal tinjauan tampil di bawah isi artikel
- [ ] SEO: meta title/description, Open Graph, JSON-LD `Article`, sitemap otomatis

---

## F-09 · Video Edukasi (P0)

**Backend**
- [ ] Migrasi `videos`
- [ ] CRUD video, validasi URL YouTube saat simpan
- [ ] `GET /videos`, `GET /videos/{slug}`, `POST/PUT/DELETE /admin/videos`

**Frontend**
- [ ] Embed via `youtube-nocookie.com`
- [ ] Galeri video + halaman detail
- [ ] Pesan jelas bila video tidak dapat di-embed
- [ ] Thumbnail auto dari API atau unggah manual

---

## F-10 · FAQ (P0)

**Backend**
- [ ] Migrasi `faqs`
- [ ] CRUD (pertanyaan, jawaban, kategori, urutan)
- [ ] `GET /faqs`

**Frontend**
- [ ] Accordion per kategori + pencarian
- [ ] Drag & drop urutan di panel admin
- [ ] JSON-LD `FAQPage`

---

## F-11 · Checklist Persiapan Melahirkan (P0)

**Backend**
- [ ] Migrasi `checklist_items`, `user_checklist_progress`
- [ ] `GET /checklist`, `PATCH /checklist/{itemId}`, `POST/DELETE /checklist/custom`
- [ ] Item baru dari admin otomatis tampil di checklist user tanpa menghapus progres lama

**Frontend**
- [ ] Kelompok: Dokumen, Perlengkapan Ibu, Perlengkapan Bayi, Transportasi & Donor Darah, Rencana Persalinan
- [ ] Progress bar per kategori + total
- [ ] Tambah item pribadi
- [ ] Panel admin: kelola template item

---

## F-12 · Komunitas (P1)

**Backend**
- [ ] Tautan WhatsApp/Telegram dikelola via `settings`

**Frontend**
- [ ] Halaman `/komunitas` — penjelasan, tombol tautan, aturan komunitas, catatan bukan kanal gawat darurat

---

## F-13 · Dashboard Pengguna (P0)

**Frontend**
- [ ] `/dashboard` — usia kehamilan & HPL, status risiko terakhir + tanggal, progres checklist, form belum diisi, 3 artikel rekomendasi sesuai trimester

---

## F-14 · Panel Admin & Statistik (P0)

**Backend**
- [ ] `GET /admin/dashboard` — total pengguna, assessment bulan ini, distribusi risiko, konten terbit, respon form
- [ ] `GET /admin/audit-logs` (super_admin)
- [ ] Migrasi `audit_logs`, pencatatan otomatis di setiap aksi CRUD admin

**Frontend**
- [ ] Kartu statistik admin
- [ ] Tabel data: pencarian, filter, sorting, pagination server-side
- [ ] Halaman audit log (super admin)

---

## F-15 · Akses Tenaga Kesehatan (P2 — pasca-rilis)

- [ ] Mekanisme consent eksplisit (dapat dicabut)
- [ ] Akses berbasis kode tautan
- [ ] Pencatatan di `audit_logs`
- [ ] Tampilan hasil assessment untuk tenaga kesehatan + catatan edukasi

---

## F-16 · Halaman Tentang (P0)

**Backend**
- [ ] Konten seksi 1–5 (filosofi nama, sejarah, komitmen, logo, warna) disimpan di `settings` (dapat disunting tanpa deploy ulang)
- [ ] CRUD profil tim (foto, nama, peran, deskripsi, urutan)

**Frontend**
- [ ] `/tentang` — 7 seksi sesuai urutan bagian 9 (F-16)
- [ ] Render statis (SSG)
- [ ] Metadata Open Graph dengan logo penuh warna

---

## Pengerasan, Non-Fungsional & Rilis (Minggu 13–14)

**Performa**
- [ ] TTFB < 600ms, LCP < 2,5s (4G), API p95 < 400ms
- [ ] Bundle JS awal < 200KB gzipped
- [ ] `next/image` + WebP untuk semua gambar

**Keamanan**
- [ ] HTTPS (Let's Encrypt auto-renew), HSTS aktif
- [ ] Header: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`
- [ ] CORS dibatasi ke domain frontend
- [ ] Validasi tipe MIME & ukuran upload; berkas di luar document root
- [ ] Backup harian (`pg_dump`), retensi 14 hari, terenkripsi di luar VPS — **uji restore**

**Privasi**
- [ ] Consent eksplisit saat registrasi (bahasa jelas, UU PDP)
- [ ] Alur hapus akun (data terhapus permanen dalam 30 hari)
- [ ] Anonimisasi data survei sebelum export bila ditandai anonim

**Aksesibilitas & kompatibilitas**
- [ ] Kontras teks ≥ 4.5:1 (pakai `--primary-text`/`--brand-teal-text` untuk teks < 18px)
- [ ] Semua kontrol terjangkau keyboard + focus ring terlihat
- [ ] Target sentuh ≥ 44×44px, alt text di semua gambar
- [ ] Uji lintas browser (Chrome/Firefox/Safari/Edge, 2 versi terakhir)
- [ ] Uji breakpoint 360/768/1024/1440px

**Dokumentasi & rilis**
- [ ] API docs (Scramble/Swagger)
- [ ] Panduan penggunaan admin + sesi pelatihan
- [ ] Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90
- [ ] Minimal 20 artikel terbit dengan sumber rujukan & tanggal tinjauan
- [ ] Jalankan seluruh **Lampiran C — Checklist Sebelum Rilis** di `PRD.md`

---

## Catatan Penggunaan

- Checklist ini **turunan** dari `PRD.md` — bila spesifikasi fitur berubah di PRD, perbarui bagian yang relevan di sini juga.
- Kolom "Backend"/"Frontend" mengikuti pembagian tim di bagian 14.1 (1 dev Laravel/API, 1 dev Next.js/UI).
- Untuk urutan pengerjaan lintas-minggu, tetap acu **Bagian 14.2** — dokumen ini tidak menggantikan jadwal, hanya memecah tiap fitur jadi task yang bisa dicentang.
