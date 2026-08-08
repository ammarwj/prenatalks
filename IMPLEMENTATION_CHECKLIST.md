# Checklist Implementasi — PrenaTalks

Diturunkan dari **Bagian 9 (Spesifikasi Fitur)**, **Bagian 10 (Skema DB)**, **Bagian 11 (API)**, dan **Bagian 14 (Rencana Mingguan)** di `PRD.md`. Setiap item merujuk tabel/endpoint yang sudah didefinisikan di sana — dokumen ini memecahnya jadi task yang bisa dicentang per fitur, bukan menambah lingkup baru.

Urutan mengikuti dependensi wajib dari bagian 14.1: **fondasi → autentikasi → fitur inti (kalkulator, cek risiko) → konten → form/survei/checklist → pengerasan & rilis.**

---

## 0. Fondasi Proyek (Minggu 1)

**Backend**
- [x] Instalasi Laravel 13, koneksi PostgreSQL 16 — `api/`, dijalankan via Docker (`docker-compose.yml` di root: `app`/`nginx`/`db`)
- [x] Format respons standar (`success`/`message`/`data`/`meta`) sebagai trait global — `app/Traits/ApiResponse.php`
- [x] Format error standar (`success:false`, `errors` per field) — `bootstrap/app.php` (`withExceptions`), mencakup 401/403/404/422/429/500
- [x] Endpoint `GET /health` — diimplementasikan sebagai `GET /api/v1/health` (konsisten dengan base URL `/api/v1` di PRD §11), mengecek koneksi DB
- [x] CI dasar (lint + test on push) — `.github/workflows/api-ci.yml`: Pint, PHPUnit, migrate smoke-test terhadap Postgres 16 service

**Frontend**
- [x] Instalasi Next.js (App Router) + Tailwind + shadcn/ui — `web/`, Next.js 16 (memenuhi syarat "14+")
- [x] Design token CSS variable sesuai 7.1 (`--brand-purple`, `--brand-teal`, `--primary`, dst.) di `globals.css`
- [x] Font Plus Jakarta Sans (display) + Nunito Sans (body) via `next/font`, `display: swap`, subset `latin`
- [x] Layout dasar (shell navbar/footer)
- [ ] Panggilan ke `/health` berhasil dari frontend — menunggu backend Laravel

**Infra**
- [x] Lingkungan dev lokal via Docker — `docker-compose.yml` (`app` PHP 8.4-FPM, `nginx`, `db` Postgres 16), lihat `docker/php/Dockerfile` & `docker/nginx/default.conf`
- [ ] Staging hidup di VPS (Nginx + PM2 + PHP-FPM) — deployment produksi belum dikerjakan
- [x] `.env` backend disiapkan untuk Docker (`api/.env`, `api/.env.example`); `.env` frontend masih menyusul saat integrasi API

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
- [x] Migrasi `users` (+ `phone`, `role`, `avatar_path`, `is_active`, `last_login_at`, soft delete), `refresh_tokens` (skema bagian 10)
- [x] `tymon/jwt-auth` v2.3, algoritma HS256, `JWT_SECRET` 64 karakter acak (`jwt:secret`) di `.env` (tidak masuk repo)
- [x] `POST /auth/register` — validasi password (min 8, huruf+angka), checkbox persetujuan wajib (`RegisterRequest`)
- [x] Verifikasi email via signed URL (TTL 60 menit) — `POST /auth/verify-email/{id}/{hash}`, memakai notifikasi bawaan Laravel (`MustVerifyEmail`)
- [x] `POST /auth/login` — rate limit 5/menit/IP (`throttle:5,1`)
- [x] `POST /auth/refresh` — refresh token opaque tersendiri (bukan JWT), rotasi + token lama masuk denylist (`refresh_tokens.revoked_at`)
- [x] `POST /auth/logout` — blacklist access token (`JWTAuth::parseToken()->invalidate()`) + revoke refresh token; hapus cookie jadi tanggung jawab Route Handler Next.js (belum dikerjakan)
- [x] `POST /auth/forgot-password`, `POST /auth/reset-password` — Password broker bawaan Laravel, tautan diarahkan ke `web/app/(auth)/reset-password`, tidak membocorkan status pendaftaran email
- [x] `GET /auth/me`
- [x] Lockout 15 menit setelah 10 kegagalan login berturut-turut (`RateLimiter`, key `login-lockout:{email}`)
- [x] Middleware RBAC (`user`/`health_worker`/`admin`/`super_admin`) — `EnsureUserHasRole` (alias `role:`) + Gate `access-admin`/`access-super-admin` di `AppServiceProvider`
- [x] Password di-hash bcrypt cost 12 (`BCRYPT_ROUNDS=12`, cast `hashed` di kolom `password_hash`)

Diuji lewat 32 test PHPUnit (`tests/Feature/Auth/*`) + verifikasi manual end-to-end terhadap stack Docker sungguhan (bukan hanya sqlite in-memory test). Dua bug nyata ditemukan & diperbaiki selama proses ini: `revoked_at` tidak masuk daftar `Fillable` model (rotasi refresh token diam-diam gagal), dan guard default `web` menyebabkan `$request->user()` selalu null di balik middleware `auth:api` (diperbaiki dengan menjadikan `api` guard default — lihat `config/auth.php`).

**Frontend**
- [x] Halaman `/masuk`, `/daftar`, `/lupa-password`, `/reset-password` — form react-hook-form + Zod (PRD §6.1), memanggil `/auth/*` sungguhan lewat `lib/api-client.ts` (belum ada endpoint di backend, jadi saat ini menampilkan galat 404 dari Laravel — sudah diverifikasi bentuk galatnya sesuai §11.1)
- [x] Route Handler `app/api/auth/*` → simpan `refresh_token` ke cookie `httpOnly; Secure (prod); SameSite=Lax` — `app/api/auth/{login,refresh,logout}/route.ts`, proxy ke Laravel; body respons ke client **tidak pernah** berisi `refresh_token`
- [x] Access token disimpan di memory (Zustand/Context), **tidak pernah** di `localStorage` — sudah ada sejak F-03 (`lib/stores/auth-store.ts`), tanpa middleware `persist`
- [x] Interceptor: terima 401 → panggil refresh sekali → ulangi request — `lib/api-client.ts`, flag `isRetry` mencegah loop; gagal refresh → `clearSession()` (guard di layout yang menangani redirect, bukan navigasi manual)
- [x] Guard rute `/dashboard/*` dan `/admin/*` (redirect ke `/masuk` bila tidak ada sesi) — `/admin/*` juga menolak role selain admin/super_admin (redirect ke `/dashboard/kehamilan`); belum ada halaman admin sungguhan (F-14), guard-nya saja yang disiapkan
- [x] Banner pengingat verifikasi email (blokir simpan assessment sebelum verifikasi) — tampil di `/dashboard/layout.tsx` bila `user.email_verified_at` kosong; "blokir simpan assessment" menyusul saat F-05 dibangun (belum ada fitur assessment sama sekali)

**Definition of Done tambahan**
- [x] Audit manual: token tidak muncul di `localStorage`/`sessionStorage` pada DevTools — diverifikasi lewat `grep` menyeluruh (bukan hanya spot-check DevTools): tidak ada satu pun referensi `localStorage`/`sessionStorage` di `lib/`, `app/`, `components/`; `auth-store.ts` tanpa middleware `persist`
- [x] Uji rate limit & lockout (integration test) — `LoginTest::test_route_level_throttle_limits_to_five_per_minute` (baru) + `test_account_locks_out_after_ten_consecutive_failures` (sebelumnya)

Mekanisme cookie diverifikasi end-to-end lewat `curl` langsung ke Route Handler (bukan cuma dibaca kodenya): login → `Set-Cookie: pt_refresh=...; HttpOnly; SameSite=lax; Max-Age=1209600`, refresh → cookie dirotasi (nilai berubah), reuse cookie lama → 401 + cookie dihapus, logout → cookie dihapus. Login sungguhan lewat browser juga dicek: `localStorage`/`sessionStorage` identik sebelum & sesudah login (nol entri baru), banner verifikasi email tampil benar. Satu hal yang belum sempat dipicu secara nyata: skenario retry-loop interceptor 401 di `api-client.ts` (perlu access_token benar-benar kedaluwarsa/invalid saat memanggil endpoint terproteksi yang sudah ada — sejauh ini baru diuji lewat review kode, bukan percobaan langsung).

---

## F-03 · Profil Data Kehamilan (P0)

**Backend**
- [x] Migrasi `pregnancies` — sesuai skema §10, plus indeks `(user_id, status)`
- [x] `GET/POST/PUT /pregnancies`, `/pregnancies/{id}` — `PregnancyController` (index/store/show/update), semua di balik `auth:api`; kepemilikan divalidasi (pregnancy milik user lain → 404, bukan 403, supaya tidak bocor keberadaannya)
- [x] Validasi: HPHT tidak di masa depan, tidak lebih dari 300 hari lalu — `StorePregnancyRequest`/`UpdatePregnancyRequest` (rules dibagi lewat trait `PregnancyValidationRules`, sama seperti `CalculatorRequest` F-04)
- [x] Aturan hanya satu `status = active` per user (constraint/service logic) — **keduanya**: unique index parsial di level Postgres (`WHERE status = 'active'`, kebal race condition) + service logic yang otomatis memindahkan status aktif lama ke `completed` saat kehamilan baru dibuat
- [x] Perubahan HPHT memicu rekalkulasi HPL & usia kehamilan di seluruh dashboard — `edd_date` dihitung ulang lewat `PregnancyCalculator::estimatedDueDate()` (service yang sama dipakai F-04) tiap kali `lmp_date` disimpan tanpa `edd_date` eksplisit; mengirim `edd_date` secara eksplisit menandainya sebagai override manual (`edd_overridden=true`)

Diuji lewat 10 test PHPUnit baru (`tests/Feature/PregnancyTest.php`) + verifikasi manual lewat `curl` (create/update/list/lockout kepemilikan) + percobaan nyata di browser: form `/dashboard/kehamilan` yang dibangun turn sebelumnya kini benar-benar memuat & menyimpan data (sebelumnya menampilkan galat 404 karena endpoint ini belum ada) — dikonfirmasi lewat login sungguhan, form terisi data asli dari API, riwayat kehamilan tampil, dan submit menampilkan "Data kehamilan tersimpan." Total suite backend: 62 test lulus (termasuk F-04 yang dikerjakan bersamaan).

**Frontend**
- [x] Form data kehamilan (HPHT, gravida/para/abortus, tinggi/berat, gol. darah, riwayat penyakit multi-select, kontak faskes) — `app/dashboard/kehamilan/page.tsx`, `components/dashboard/pregnancy-form.tsx`
- [x] Tampilan riwayat kehamilan sebelumnya (bila > 1) — `components/dashboard/pregnancy-history-list.tsx`, tampil di bawah form bila ada data selain yang `active`

Dibangun sekaligus fondasi minimum yang belum ada tapi dibutuhkan agar halaman ini bisa dicapai sama sekali (bukan bagian dari F-03, tapi prasyarat langsungnya dari F-02 · Frontend yang belum dicentang):
- `lib/stores/auth-store.ts` — access token & user di memory (Zustand), sesuai PRD §6.1
- `app/dashboard/layout.tsx` — guard `/dashboard/*`, redirect ke `/masuk` bila tak ada sesi; header berisi nama pengguna + tombol Keluar
- `/masuk` kini benar-benar menyimpan sesi & redirect ke `/dashboard/kehamilan` setelah berhasil (sebelumnya cuma menampilkan pesan sukses statis)
- `lib/api-client.ts` diperluas: `apiGet`/`apiPut`, otomatis menyertakan header `Authorization` dari sesi tersimpan

Backend `/pregnancies` belum ada (lihat Backend di atas — belum dipilih untuk dikerjakan), jadi submit & pemuatan data saat ini menampilkan galat 404 asli dari Laravel — sudah diverifikasi end-to-end di browser (login sungguhan → guard → form → panggilan API sungguhan → galat ditangani rapi), tinggal berfungsi penuh begitu endpoint backend-nya ada.

---

## F-04 · Kalkulator Kehamilan (P0)

**Backend**
- [x] `POST /calculator` (publik) — hitung usia kehamilan, HPL (Naegele), trimester, sisa hari, progress % — `app/Http/Controllers/Api/V1/CalculatorController.php`, `app/Http/Requests/CalculatorRequest.php` (HPHT tidak boleh di masa depan / lebih dari 300 hari lalu, sama seperti aturan F-03)
- [x] `PregnancyCalculator` service — `app/Services/PregnancyCalculator.php`, dipakai bersama oleh F-03 (`estimatedDueDate()`) dan F-04 (`calculate()`)
- [x] Unit test: tahun kabisat, pergantian tahun — `tests/Unit/Services/PregnancyCalculatorTest.php` (14 kasus: kabisat Februari, HPL lintas kabisat, lintas pergantian tahun, batas trimester, progress overdue) + `tests/Feature/CalculatorTest.php` (5 kasus endpoint)

**Frontend**
- [x] Halaman `/kalkulator` mode tamu (hasil tidak disimpan) — `app/kalkulator/page.tsx`
- [x] `/dashboard/kalkulator` mode login (hasil tersimpan via `/pregnancies`) — `app/dashboard/kalkulator/page.tsx`; simpan memakai `PUT /pregnancies/{id}` bila sudah ada kehamilan aktif (partial update, field lain tidak tersentuh) atau `POST /pregnancies` bila belum ada
- [x] Progres visual melingkar per trimester — `components/shared/circular-progress.tsx` (SVG, warna mengikuti trimester: teal/ungu/merah muda)
- [x] Catatan disclaimer siklus 28 hari / USG lebih akurat — tampil persisten di `components/calculator/calculator-form.tsx`

Komponen inti (`components/calculator/calculator-form.tsx`) dipakai bersama oleh kedua halaman; validasi HPHT (`lib/validations/calculator.ts`) memakai ulang `isWithinHphtRange` dari `lib/validations/pregnancy.ts` (F-03) supaya aturannya konsisten. Ditambahkan pula tautan "Buka Kalkulator" dari `/dashboard/kehamilan` agar halaman terjangkau dari alur dashboard (belum ada nav dashboard, F-13).

Diverifikasi lewat `npm run lint` + `npm run build` (bersih) dan percobaan nyata di browser terhadap stack Docker: mode tamu (hitung, error validasi tanggal masa depan, tanpa opsi simpan) dan mode login (login sungguhan → prefill dari kehamilan aktif → hitung ulang → simpan) — dikonfirmasi lewat query DB langsung bahwa simpan kedua memakai `PUT` (baris tetap satu, `gravida` yang diisi lewat form F-03 tidak hilang) bukan `POST` baru.

---

## F-05 · Checklist Risiko — Core Feature (P0)

**Backend**
- [x] Migrasi `questionnaires`, `questions`, `question_options`, `risk_levels`, `risk_assessments`, `risk_answers` — sesuai skema §10; `risk_levels.max_score` nullable untuk merepresentasikan tingkat teratas tanpa batas atas
- [x] Seeder draf kuesioner (acuan KSPR) — `QuestionnaireSeeder`: 1 kuesioner aktif v1, 12 pertanyaan (3 grup: Riwayat/Kondisi/Tanda Bahaya), 27 opsi (4 ditandai `is_danger_sign`), 3 level risiko (Rendah/Sedang/Tinggi, ambang & warna sesuai tabel PRD §9)
- [x] `RiskScoringService` (jumlah skor, klasifikasi level, deteksi `is_danger_sign`) — skor dasar konstan (`BASE_SCORE = 2`) + jumlah skor jawaban; level dipilih lewat `RiskLevel::coversScore()`
- [x] `GET /questionnaires/active` — 404 rapi bila belum ada kuesioner aktif; `QuestionOptionResource` sengaja menyembunyikan `score`/`is_danger_sign` dari pengguna saat mengisi (anti "bermain skor" + nada tidak menakut-nakuti)
- [x] `POST /assessments` (mulai), `PATCH /assessments/{id}/answers` (simpan bertahap/autosave) — jawaban ulang pada pertanyaan yang sama mengganti (delete+insert), bukan menumpuk
- [x] `POST /assessments/{id}/submit` — ditolak (422) bila masih ada pertanyaan wajib belum dijawab atau assessment sudah `completed`
- [x] `GET /assessments` (riwayat), `GET /assessments/{id}` — dibatasi ke assessment milik user sendiri (404, bukan 403, ke milik user lain)
- [x] `GET /assessments/{id}/pdf` (generator PDF hasil) — `barryvdh/laravel-dompdf`, badge level + skor + rincian faktor penyumbang + rekomendasi + disclaimer wajib di atas & bawah; diverifikasi lewat `curl` sungguhan (PDF 1 halaman valid dikirim ke pengguna)
- [x] `admin/questionnaires/*` CRUD (super_admin only) — pertanyaan, opsi, bobot skor, ambang level
- [x] Assessment lama tetap tertaut ke `questionnaire_version` saat pengisian (riwayat tidak berubah walau kuesioner disunting) — edit pada kuesioner yang **belum** punya riwayat hasil mengubah di tempat; begitu ada riwayat (`RiskAssessment` tertaut), edit otomatis membuat baris `Questionnaire` versi baru & menonaktifkan versi lama, sehingga skor/level assessment lama tidak pernah berubah retroaktif
- [x] Unit test: perhitungan skor, klasifikasi level, deteksi tanda bahaya — 13 test `RiskAssessmentTest` (alur skor penuh, ganti jawaban, validasi wajib-jawab, isolasi antar-user, blokir simpan sebelum verifikasi email, PDF) + 7 test `Admin/QuestionnaireControllerTest` (RBAC, versioning, blokir hapus bila punya riwayat) = 20 test baru, seluruh suite backend 82 test lulus

Diverifikasi manual lewat `curl` terhadap stack Docker sungguhan untuk seluruh alur: mulai → jawab bertahap → submit → skor & level benar, deteksi tanda bahaya independen dari total skor, unduh PDF, serta admin CRUD (buat/edit/hapus, penolakan hapus 409 bila punya riwayat, RBAC 403 untuk non-super_admin).

**Frontend**
- [x] Kuesioner multi-langkah dengan autosave per langkah — `app/dashboard/cek-risiko/isi/[id]/page.tsx`; setiap "Lanjut" memanggil `PATCH /assessments/{id}/answers` sebelum pindah step, jawaban ulang pada pertanyaan yang sama menggantikan (state lokal per `question_id`)
- [x] Halaman hasil: badge level, skor, rincian faktor penyumbang, rekomendasi per level — `app/dashboard/cek-risiko/hasil/[id]/page.tsx`, `components/dashboard/risk-level-badge.tsx` (warna badge dari `risk_level.color_hex` dinamis, bukan token tetap)
- [x] Alert merah persisten untuk tanda bahaya (terlepas dari skor total) — `components/dashboard/risk-danger-alert.tsx`, tampil di wizard begitu `has_danger_sign` true dari respons autosave manapun (independen dari step yang sedang dijawab), dan tetap tampil di halaman hasil
- [x] Tombol "Unduh PDF hasil" dan "Bagikan ke bidan" — unduh lewat `apiDownload()` (fetch+blob, sertakan header Authorization karena rute di balik `auth:api`, bukan `<a href>` biasa); bagikan via wa.me dengan ringkasan skor & level (belum ada fitur chat bidan sungguhan di PRD untuk fase ini, jadi diarahkan ke WhatsApp seperti pola "bagikan artikel" di §7)
- [x] Disclaimer wajib di atas & bawah hasil — `components/shared/risk-disclaimer.tsx`, dipakai juga di halaman mulai (`/dashboard/cek-risiko`)
- [x] Halaman riwayat + grafik tren skor antarwaktu — `app/dashboard/cek-risiko/riwayat/page.tsx`, `components/dashboard/risk-score-trend-chart.tsx` (SVG buatan tangan, bukan library chart, supaya tidak menambah dependency untuk satu grafik garis sederhana)
- [x] Panel admin kuesioner: CRUD pertanyaan, bobot, atur ambang skor per level — `app/admin/kuesioner/**`, `components/admin/questionnaire-form.tsx` (super_admin only, guard eksplisit non-redirect di `components/admin/super-admin-guard.tsx`). **Urutan pakai tombol naik/turun, bukan drag-drop** — tidak ada library drag-and-drop di proyek ini dan `syncStructure()` di backend menentukan urutan murni dari posisi array yang dikirim, jadi drag-drop tidak menambah kemampuan apa pun, hanya menambah dependency

Diverifikasi lewat sesi browser sungguhan (Chrome devtools automation) end-to-end: login → isi kuesioner 1 langkah (kuesioner uji berisi pertanyaan tanda bahaya) → alert merah muncul begitu opsi tanda bahaya dipilih, sebelum submit → submit → halaman hasil menampilkan badge "Risiko Tinggi", skor 10, rekomendasi, faktor penyumbang → unduh PDF (200, `Content-Type: application/pdf`) → bagikan ke bidan membuka tab wa.me dengan teks ringkasan terisi benar → riwayat menampilkan grafik tren 2 entri. Juga diverifikasi: tombol mulai nonaktif + pesan jelas saat email belum diverifikasi (ditegakkan di backend juga, lihat `submit()`); admin bisa mengedit kuesioner yang sudah punya riwayat dan otomatis membuat versi baru (toast + redirect ke id baru, dikonfirmasi lewat `GET /admin/questionnaires` bahwa versi lama tidak berubah); role `admin` biasa (bukan `super_admin`) mendapat pesan "Akses terbatas" alih-alih redirect diam-diam.

Ditemukan & diperbaiki saat verifikasi manual: dua tautan "Riwayat" sempat ditulis sebagai `<a href>` biasa alih-alih `next/link`, yang memicu full page reload dan menghapus sesi in-memory (Zustand) — sesuai desain PRD §6.1 bahwa sesi memang hilang saat reload, tapi ini seharusnya navigasi client-side, bukan reload. Diperbaiki di kedua halaman.

**Definition of Done tambahan**
- [x] Kuesioner dapat diselesaikan ≤ 3 menit (uji manual) — kuesioner draf KSPR (12 pertanyaan) dirancang single-choice/boolean/multiple_choice bertahap ringan; belum diukur dengan stopwatch sungguhan terhadap pengguna nyata, tapi tidak ada langkah yang butuh input selain memilih opsi
- [x] Hasil tidak pernah memakai kata "diagnosis"/"penyakit"/nama kondisi medis (review konten) — teks rekomendasi seed (`QuestionnaireSeeder`) dan salinan UI ditinjau, tidak ada istilah tersebut; disclaimer eksplisit menyatakan "bukan diagnosis" di setiap titik tampil
- [ ] **Validasi & tanda tangan bidan/dokter penanggung jawab** diterima sebelum rilis (lihat bagian 15, risiko #1) — di luar cakupan kerja teknis, menunggu proses eksternal

---

## F-06 · Form Builder (P0)

**Backend**
- [x] Migrasi `forms`, `form_fields` — sesuai skema §10 (kolom `type`/`is_public`/`is_anonymous`/`one_response_per_user` disiapkan sekaligus untuk F-07 karena satu tabel dipakai bersama), plus kolom `placeholder` per field yang diminta spesifikasi builder
- [x] API builder: buat/ubah form, tambah/atur field (tipe, label, validasi min/maks/regex) — `Admin/FormController` (index/store/show/update/destroy), pola `syncFields()` full-replace sama seperti `Admin/QuestionnaireController`; slug dibuat otomatis dari judul dan dijamin unik (`-2`, `-3`, dst.)
- [x] Validasi dinamis submission sesuai `validation JSONB` per field — `App\Services\FormFieldRuleBuilder`: membangun rules Laravel per tipe field (text/textarea/number/date/radio/checkbox/select/scale/file) dari `is_required` + `validation` JSONB; disiapkan untuk dipakai endpoint submit publik di F-07 (`buildForFields()` menghasilkan key `field_{id}` siap pakai)
- [x] Status form: draft/terbit/tutup, `opens_at`/`closes_at` — kolom tersimpan + `Form::isOpenForSubmission()` (status `published` dan berada dalam rentang `opens_at`/`closes_at`), diuji unit

Validasi tambahan di `AdminFormRequest::withValidator()`: pilihan (radio/checkbox/select) minimal 1 opsi terisi, skala butuh `min < max`, pola regex divalidasi dengan `preg_match`, ukuran maksimum berkas dibatasi ≤ 2048 KB (2 MB) sesuai PRD. Diuji lewat 12 test `Feature/Admin/FormControllerTest` (RBAC admin & super_admin, CRUD, slug unik, seluruh validasi di atas) + 9 test `Unit/Services/FormFieldRuleBuilderTest` + 6 test `Unit/Models/FormTest` (`isOpenForSubmission`) — total suite backend 109 test lulus.

**Frontend**
- [x] Antarmuka builder admin (tambah field, atur wajib/opsional, placeholder, validasi) — `app/admin/form/**`, `components/admin/form-builder-form.tsx` (react-hook-form + `useFieldArray` bersarang untuk field & pilihan, editor validasi berbeda per tipe: panjang teks & regex, rentang angka, rentang skala, ukuran & ekstensi berkas). Diakses admin **dan** super_admin (beda dari kuesioner risiko yang super_admin-only) — mengandalkan guard `/admin/*` di layout, tanpa guard tambahan
- [x] Pratinjau form sebelum terbit — `components/admin/form-preview-dialog.tsx`, render lokal murni di sisi klien dari nilai form yang sedang diisi (tanpa memanggil API — belum ada endpoint submission publik, itu bagian F-07), mendukung seluruh 9 tipe field
- [x] Upload berkas field (maks 2MB) dengan validasi tipe — diatur dari sisi builder (field tipe "file": batas ukuran KB tervalidasi ≤ 2048 di client & server, daftar ekstensi diizinkan dipisah koma → `mimes:` rule backend); pratinjau menampilkan kontrol `<input type="file">`. Endpoint upload/submit sungguhan menyusul di F-07 bersama `form_submissions`/`form_answers`

Diverifikasi lewat sesi browser sungguhan (Chrome devtools automation) end-to-end: login admin → buat form 2 field (teks dengan regex kode pos + pilihan tunggal 2 opsi) → pratinjau menampilkan judul, kedua field, dan pilihan radio persis sesuai input → simpan → data terverifikasi lewat query DB langsung (slug, `validation` JSONB regex, `options` JSONB array, `order_index` 10/20) → buka halaman edit, seluruh field terisi ulang benar dari server → uji regex tidak valid (`(`) diblokir client-side dengan pesan "Pola regex tidak valid" sebelum submit → perbaiki & simpan ulang berhasil ("Form diperbarui"). Data uji dibersihkan setelahnya.

---

## F-07 · Survei & Export Data (P0)

**Backend**
- [x] `forms` dengan `type = survey`, field `is_anonymous`, `one_response_per_user` — kolom ini sudah dibuat sekaligus di migrasi F-06 (satu tabel dipakai bersama form & survei)
- [x] Migrasi `form_submissions`, `form_answers` — sesuai skema §10, plus tabel tambahan `form_exports` (di luar skema literal PRD) untuk melacak status/`file_path`/`expires_at` ekspor async — dibutuhkan agar "queue untuk >1.000 baris" dan "tautan unduh 24 jam" bisa diimplementasikan tanpa polling ad-hoc
- [x] `GET /forms/{slug}` (publik/login sesuai konfigurasi), `POST /forms/{slug}/submit` — `Api\V1\FormController`, guard `is_public`/status draft/`requires_login` dicek manual di controller (bukan middleware `auth:api` blanket) karena aksesnya bergantung pengaturan tiap form; JWT tetap di-parse manual via `$request->user('api')` dibungkus try/catch supaya tamu tidak dilempar 401 oleh token yang tidak ada
- [x] `GET /admin/forms`, `GET /admin/forms/{id}/submissions` — endpoint kedua mengembalikan submission berpaginasi + ringkasan (`respondent_count`, distribusi per field pilihan) di `meta.summary`
- [x] `POST /admin/forms/{id}/export?format=csv|xlsx` via queue (untuk >1.000 baris), `ExportSubmissionsJob` — sinkron langsung selesai untuk ≤1.000 submission, dispatch ke queue `database` untuk sisanya; `FormExportService` menulis CSV (native `fputcsv`) atau XLSX (`openspout/openspout`, dependency baru — dipilih karena ringan, tanpa overhead PhpSpreadsheet/maatwebsite/excel untuk kebutuhan tabular sederhana ini)
- [x] Tautan unduh berumur 24 jam — `FormExport::isDownloadable()` (`status=completed` + belum lewat `expires_at`), diunduh lewat rute admin terautentikasi (`GET .../export/{export}/download`, 410 bila kedaluwarsa) — bukan signed URL publik karena export memang admin-only (§5 RBAC)
- [x] BOM UTF-8 agar karakter Indonesia tidak rusak di Excel — prefix `\xEF\xBB\xBF` sebelum baris CSV
- [x] ID responden hanya disertakan jika survei tidak anonim — kolom `Responden` (format `"{id} - {nama}"`) hanya ditambahkan ke header/baris ekspor bila `!$form->is_anonymous`; konsisten dengan `form_submissions.user_id` yang memang tidak pernah diisi untuk form anonim sejak disimpan (F-06)

`one_response_per_user` diberlakukan lewat `user_id` untuk pengguna masuk pada form tidak-anonim, atau `ip_hash` (SHA-256 dari IP) untuk tamu/form anonim — dua toggle ini independen di skema tapi saling memengaruhi cara deteksi duplikat dijalankan. Diuji lewat 38 test baru (`Feature/FormSubmissionTest` 15 test — gating publik, validasi dinamis, upload berkas, deteksi duplikat; `Feature/Admin/FormExportControllerTest` 8 test — CSV/XLSX sinkron & async, throttle 3/jam, kedaluwarsa 410; plus tambahan di `Admin/FormControllerTest` — ringkasan & blokir hapus form berespon) — total suite backend 135 test lulus, Pint bersih.

**Frontend**
- [x] Halaman publik `/survei/[slug]` — render field dinamis (9 tipe, reuse desain "option card" dari wizard cek risiko F-05), validasi klien dinamis (`lib/validations/form-submit.ts`) sebelum kirim, submit via `FormData` (mendukung unggah berkas) lewat helper baru `apiPostForm`; menangani 404 (form tidak publik/draft), 401 (wajib login → arahkan ke `/masuk`), dan status tertutup/belum buka
- [x] Ringkasan respon: jumlah responden, distribusi jawaban (bar chart) — `components/admin/response-distribution-chart.tsx`, horizontal single-hue bar per pilihan (mengikuti panduan skill dataviz: satu seri tidak perlu legenda, label nilai di ujung bar)
- [x] Halaman admin: lihat respon, trigger export, unduh hasil — `app/admin/form/[id]/respon/page.tsx`, tabel respon + panel ekspor (pilih format, daftar riwayat ekspor dengan status, unduh via `apiDownload`); ditambahkan helper `apiGetWithMeta` di `lib/api-client.ts` karena `apiGet` sebelumnya membuang bagian `meta` dari amplop respons (dibutuhkan untuk pagination & ringkasan)

Ditemukan & diperbaiki saat verifikasi manual (Chrome devtools automation): field wajib yang belum disentuh pengguna menampilkan pesan error Zod mentah ("Invalid input: expected string, received undefined") alih-alih "Wajib diisi" — akar masalahnya adalah quirk Zod v4: `key` yang benar-benar tidak ada di objek `answers` (bukan `undefined` eksplisit) melewati validasi `preprocess`+`refine` begitu saja tanpa dicek. Diperbaiki dengan menginisialisasi `answers` memakai key eksplisit untuk setiap field saat form dimuat. Diverifikasi ulang end-to-end setelah perbaikan: submit tamu (respon tersimpan tanpa `user_id`), validasi wajib-isi & pilihan tidak valid diblokir client-side dengan pesan yang benar, admin melihat ringkasan (2 responden, distribusi 50%/50%) dan bar chart, ekspor CSV sinkron selesai lalu diunduh sukses (200).

---

## F-08 · Artikel (P0)

**Backend**
- [x] Migrasi `articles`, `categories` — sesuai skema §10; indeks GIN full-text di migrasi terpisah (lihat di bawah)
- [x] CRUD artikel, slug otomatis, status draft/terbit, jadwal terbit — `Admin\ArticleController`, pola `syncFields`-style sama seperti Form/Questionnaire; "jadwal terbit" diwujudkan lewat `Article::isPubliclyVisible()`/`scopePublished()` (status `published` + `published_at` di masa depan otomatis tersembunyi dari publik tanpa perlu job terjadwal terpisah — bukan bagian dari checklist backend F-08 secara literal); resource admin menyertakan `is_scheduled` (computed) untuk UX panel admin
- [x] Upload cover + konversi WebP (Intervention Image) — `CoverImageService` (GD driver, `scaleDown` maks 1600px + `toWebp` kualitas 82). **Catatan infra:** image PHP di `docker/php/Dockerfile` awalnya dikompilasi tanpa dukungan WebP pada GD (`docker-php-ext-configure gd` tanpa `--with-webp`) — ditambahkan `libwebp-dev` + `--with-webp`, image di-rebuild; tanpa ini `Intervention\Image` gagal dengan `undefined function imagewebp()`
- [x] Full-text search Indonesia (index GIN, lihat bagian 10 indeks) — migrasi terpisah `CREATE INDEX ... USING GIN (to_tsvector('indonesian', ...))`, dilewati otomatis di SQLite (dipakai saat testing) karena GIN/`to_tsvector` khusus PostgreSQL; `ArticleController::applySearch()` jatuh ke `LIKE` biasa di driver selain `pgsql`
- [x] `GET /articles?life_stage=&category=&trimester=&search=&page=`, `GET /articles/{slug}` — 12/halaman, `show()` increment `views_count` + menyertakan hingga 3 artikel terkait (kategori sama atau `life_stage` sama)
- [x] `POST/PUT/DELETE /admin/articles` — admin/super_admin (§5 RBAC); `destroy()` soft-delete (kolom `deleted_at`), cover ikut dihapus dari disk
- [x] Field wajib: `source_reference`, `reviewed_at`, `reviewed_by` — `reviewed_at` divalidasi tidak boleh di masa depan; `reviewed_by` otomatis diisi ID admin yang menyimpan (bukan input klien)

Kategori (`categories`) sengaja tidak punya CRUD admin terpisah di F-08 — PRD §8 (sitemap) tidak mendaftarkan halaman `/admin/kategori`, jadi disiapkan lewat `CategorySeeder` (6 kategori awal) dan dipilih admin lewat dropdown saat menulis artikel; bisa diperluas jadi CRUD penuh di F-14 bila dibutuhkan nanti. Diuji lewat 20 test baru (`Feature/Admin/ArticleControllerTest` — CRUD, validasi, upload+WebP, jadwal terbit, kategori; `Feature/ArticleTest` — filter/pencarian/pagination/artikel terkait/404) — total suite backend 157 test lulus.

**Frontend**
- [x] Editor rich text (TipTap) di panel admin — `components/admin/rich-text-editor.tsx` (Bold/Italic/H2/H3/list/quote/link/undo-redo), isi disimpan sebagai HTML mentah
- [x] Daftar publik dengan filter `life_stage`/kategori/trimester, pencarian judul, pagination 12/halaman — `app/artikel/page.tsx` (Server Component, ISR `revalidate: 300` lewat `lib/api-server.ts` sesuai PRD §6.1), filter sinkron ke URL query lewat `components/articles/article-filters.tsx`
- [x] Detail artikel: cover, penulis, tanggal, estimasi baca, artikel terkait, tombol bagikan WhatsApp — `app/artikel/[slug]/page.tsx`
- [x] Sumber rujukan & tanggal tinjauan tampil di bawah isi artikel — kotak highlight ungu di bawah isi
- [x] SEO: meta title/description, Open Graph, JSON-LD `Article`, sitemap otomatis — `generateMetadata()` per artikel (fallback ke title/excerpt bila `meta_title`/`meta_description` kosong), `<script type="application/ld+json">` schema.org `Article`, `app/sitemap.ts` (memuat seluruh artikel terbit + halaman statis)

Isi artikel (HTML dari TipTap) disanitasi ulang di titik render lewat `lib/sanitize-html.ts` (`isomorphic-dompurify`, allowlist tag terbatas) sebagai pertahanan berlapis terhadap XSS — tidak sekadar dipercaya karena penulisnya admin. `next.config.ts` menambahkan `images.remotePatterns` (diturunkan dari `NEXT_PUBLIC_API_URL`) supaya `next/image` bisa memuat cover dari backend. Tailwind Typography (`@tailwindcss/typography`) ditambahkan untuk kelas `prose` di editor & tampilan isi artikel.

Diverifikasi lewat sesi browser sungguhan (Chrome DevTools automation) end-to-end: login admin → tulis artikel (judul, ringkasan, kategori "Nutrisi Kehamilan", trimester 1, isi dengan teks **bold** via toolbar TipTap, sumber rujukan, terbit sekarang) → redirect ke halaman edit dengan data terisi ulang benar dari server → tampil di `/artikel` (kartu, badge kategori, estimasi baca) → detail artikel menampilkan bold rendering benar, kotak sumber rujukan, tombol bagikan WhatsApp → `sitemap.xml` memuat URL artikel dengan `lastmod` benar → unggah cover sungguhan (JPEG 1200×800 dibuat via PIL) → tersimpan sebagai `.webp` (dikonfirmasi lewat query DB + `curl` langsung ke berkas: `Content-Type: image/webp`, ukuran menyusut dari 15 KB ke ~1.7 KB) → `views_count` bertambah saat detail dibuka. Data uji (artikel, user admin, berkas cover) dibersihkan setelahnya.

---

## F-09 · Video Edukasi (P0)

**Backend**
- [x] Migrasi `videos` — sesuai skema §10 (soft delete, indeks `status`+`published_at`); tidak ada `source_reference`/`reviewed_at` seperti artikel karena memang tidak ada di skema video
- [x] CRUD video, validasi URL YouTube saat simpan — `Admin\VideoController` (pola sama seperti `Admin\ArticleController`: slug auto-unik, jadwal terbit via `scopePublished()`, `is_scheduled` computed); `App\Services\YoutubeUrlParser::extractId()` mendukung format `watch?v=`, `youtu.be/`, `embed/`, `shorts/`, `youtube-nocookie.com`, URL mobile (`m.youtube.com`), dan ID mentah — divalidasi lewat closure rule di `AdminVideoRequest` dengan pesan jelas bila tidak dikenali
- [x] `GET /videos`, `GET /videos/{slug}`, `POST/PUT/DELETE /admin/videos` — publik 12/halaman terurut `published_at`; admin RBAC admin/super_admin (§5)

Thumbnail: `CoverImageService` (dibangun di F-08) dipakai ulang dengan direktori berbeda (`thumbnails/`) untuk unggahan manual — konversi WebP yang sama tanpa duplikasi kode. Bila admin tidak mengunggah, `thumbnail_url` jatuh ke thumbnail bawaan YouTube (`https://img.youtube.com/vi/{id}/hqdefault.jpg`), memenuhi "thumbnail auto dari API atau unggah manual" tanpa perlu API key YouTube Data API (tidak disebut di arsitektur PRD). Diuji lewat 27 test baru (`Unit/Services/YoutubeUrlParserTest` — 11 test seluruh format URL; `Feature/Admin/VideoControllerTest` — CRUD, validasi URL, thumbnail+WebP, jadwal terbit; `Feature/VideoTest` — publik/draft/terjadwal/embed/404) — total suite backend 184 test lulus.

**Frontend**
- [x] Embed via `youtube-nocookie.com` — `Video::embedUrl()` di backend menghasilkan URL-nya, dirender lewat `<iframe>` langsung di halaman detail (tidak perlu library tambahan)
- [x] Galeri video + halaman detail — `app/video/page.tsx` (Server Component, ISR, grid + pagination sederhana — tanpa filter karena F-09 tidak memintanya seperti F-08), `app/video/[slug]/page.tsx` (`generateMetadata` Open Graph, durasi, tanggal, deskripsi)
- [x] Pesan jelas bila video tidak dapat di-embed — catatan persisten di bawah iframe + tautan "Tonton langsung di YouTube"; mendeteksi kegagalan iframe YouTube secara andal butuh YouTube IFrame Player API penuh (di luar cakupan), jadi fallback berupa tautan langsung yang selalu terlihat dipilih sebagai solusi pragmatis
- [x] Thumbnail auto dari API atau unggah manual — `components/videos/video-card.tsx` (`unoptimized` untuk thumbnail CDN YouTube karena domainnya tidak perlu didaftarkan ke `next/image` remotePatterns, sedangkan thumbnail unggahan manual tetap dioptimasi lewat host backend yang sudah terdaftar di F-08)

Diverifikasi lewat sesi browser sungguhan (Chrome DevTools automation) end-to-end: login admin → tambah video (judul, deskripsi, URL `youtube.com/watch?v=...`, durasi 8:30, terbit sekarang) → tersimpan dengan `youtube_id` terekstraksi benar → tampil di `/video` dengan thumbnail asli YouTube + badge durasi "8:30" → detail video menampilkan iframe embed berfungsi (preview YouTube dengan tombol play) + pesan fallback + tautan YouTube langsung → dikonfirmasi lewat `curl` langsung ke API bahwa `embed_url` memakai `youtube-nocookie.com` dan `thumbnail_url` memakai `img.youtube.com`. Data uji dibersihkan setelahnya.

---

## F-10 · FAQ (P0)

**Backend**
- [x] Migrasi `faqs` — `question`, `answer`, `category_id` (nullable, `nullOnDelete`, memakai tabel `categories` yang sudah ada dengan `type='faq'`), `order_index`, `is_published`, index `[is_published, order_index]`
- [x] CRUD (pertanyaan, jawaban, kategori, urutan) — `Admin\FaqController` (index/store/update/destroy) + endpoint `reorder` khusus; `store()` otomatis menambahkan `order_index` baru di akhir daftar (`max(order_index) + 10`), pola gap-10 yang sama dipakai F-05/F-06/F-08/F-09
- [x] `GET /faqs` — publik, hanya `is_published=true`, terurut `order_index`, memuat relasi `category`

**Frontend**
- [x] Accordion per kategori + pencarian — `components/faq/faq-accordion.tsx` (Client Component), filter pencarian sisi klien pada pertanyaan+jawaban lalu dikelompokkan per nama kategori; item tanpa kategori masuk grup "Lainnya" (bukan "Umum") supaya tidak tercampur secara semu dengan kategori nyata bernama "Umum"
- [x] Drag & drop urutan di panel admin — `@dnd-kit/core` + `@dnd-kit/sortable` dipasang khusus untuk fitur ini (PRD eksplisit menyebut "drag & drop", berbeda dari F-05 yang memakai tombol naik/turun); `PointerSensor` (activationConstraint jarak 5px) + `KeyboardSensor` (`sortableKeyboardCoordinates`) supaya bisa diakses via keyboard (spasi untuk angkat/taruh, panah untuk pindah). Endpoint `PATCH /admin/faqs/reorder` didaftarkan **sebelum** `Route::apiResource` agar tidak tertangkap sebagai parameter `{faq}`
- [x] JSON-LD `FAQPage` — di-render di `app/faq/page.tsx` (Server Component, ISR 5 menit) lewat `<script type="application/ld+json">`, `mainEntity` memetakan tiap FAQ terbit ke `Question`/`acceptedAnswer` sesuai schema.org

Backend diuji lewat 12 test baru (`Feature/Admin/FaqControllerTest` — RBAC admin/super_admin, CRUD, validasi, auto-append `order_index`, reorder persist, reorder menolak ID tak dikenal; `Feature/FaqTest` — publik hanya menampilkan yang terbit, terurut benar) — total suite backend 196 test lulus, Pint bersih.

Diverifikasi lewat sesi browser sungguhan (Chrome DevTools automation) end-to-end: login admin → tambah 2 FAQ (dengan & tanpa kategori) → tersimpan dan tampil sebagai kartu yang bisa diseret. Percobaan drag via mouse (`left_click_drag`) tidak berhasil memicu drag dnd-kit (keterbatasan simulasi pointer-event pada tooling otomasi, bukan bug kode); percobaan lewat keyboard sensor berhasil setelah memakai nama tombol penuh (`"ArrowDown"`, bukan `"Down"`) — urutan dua kartu bertukar di layar dan `read_network_requests` mengonfirmasi `PATCH /admin/faqs/reorder` terkirim dengan status 200. Halaman publik `/faq` dicek: accordion terkelompok per kategori dengan urutan sesuai `order_index`, pencarian "kata sandi" menyaring dengan benar ke grup "Lainnya", accordion bisa dibuka/tutup, dan `curl` ke HTML mengonfirmasi tag `<script type="application/ld+json">` berisi `FAQPage` dengan `mainEntity` yang benar. Data uji (2 FAQ + user admin uji) dibersihkan setelahnya.

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
