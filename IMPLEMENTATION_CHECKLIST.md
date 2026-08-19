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
- [x] Pemulihan sesi saat halaman dimuat — `lib/hooks/use-session-rehydrate.ts` menukar cookie httpOnly `pt_refresh` jadi access_token baru, dipanggil dari `app/dashboard/layout.tsx` dan `app/admin/layout.tsx`. Sengaja **bukan** di root layout supaya halaman publik tidak ikut menembak `/api/auth/refresh`. Guard menunda keputusan redirect selama `isHydrating` — tanpa itu tiap refresh halaman terlempar ke `/masuk` padahal sesinya masih sah. Satu percobaan per pemuatan halaman, dideduplikasi lewat promise module-scope (aman terhadap mount ganda StrictMode)
- [x] Guard rute `/dashboard/*` dan `/admin/*` (redirect ke `/masuk` bila tidak ada sesi) — `/admin/*` menolak role selain admin/super_admin (ke `/dashboard`), dan `/dashboard/*` sebaliknya memantulkan role pengelola ke `/admin`. Tidak berisiko loop karena kedua himpunan role saling lepas (`lib/auth-routes.ts` jadi satu-satunya sumber kebenaran pemetaan role → area)
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
- [x] Panel admin kuesioner: CRUD pertanyaan, bobot, atur ambang skor per level — `app/admin/kuesioner/**`, `components/admin/questionnaire-form.tsx` (super_admin only, guard eksplisit non-redirect di `components/admin/super-admin-guard.tsx`). **Urutan pakai tombol naik/turun, bukan drag-drop** — tidak ada library drag-and-drop di proyek ini dan `syncStructure()` di backend menentukan urutan murni dari posisi array yang dikirim, jadi drag-drop tidak menambah kemampuan apa pun, hanya menambah dependency. **Warna badge tiap level dipilih lewat color picker**, bukan hanya diketik: swatch di sebelah kotak hex kini `<input type="color">` bawaan browser, tersinkron dua arah dengan kotak teksnya lewat satu `Controller` react-hook-form. Kotak teks tetap ada supaya hex bisa disalin-tempel dari panduan merek. Selagi hex masih setengah diketik, picker jatuh ke warna cadangan `#E11D48` alih-alih melompat ke hitam. Tanpa dependency baru — `react-colorful` dan sejenisnya tidak diperlukan untuk satu field ini

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
- [x] Migrasi `checklist_items`, `user_checklist_progress` — sesuai skema §10. `user_checklist_progress` menampung dua jenis baris dalam satu tabel: progres item template (`checklist_item_id` terisi) dan item pribadi (`custom_title` terisi, `checklist_item_id` NULL). `UNIQUE(user_id, checklist_item_id)` tetap dipakai persis seperti PRD — NULL dianggap saling berbeda di PostgreSQL maupun SQLite, jadi batasan itu mencegah duplikasi progres template tanpa membatasi jumlah item pribadi
- [x] `GET /checklist`, `PATCH /checklist/{itemId}`, `POST/DELETE /checklist/custom` — plus `PATCH /checklist/custom/{id}` yang tidak tertulis literal di §11.2. Item pribadi tidak punya `checklist_items.id`, jadi tidak bisa dialamatkan lewat `PATCH /checklist/{itemId}`; yang dialamatkan adalah baris progresnya sendiri. Alasan yang sama membuat `DELETE /checklist/custom` menjadi `/checklist/custom/{id}`. Rute `custom` didaftarkan sebelum `/checklist/{item}` agar segmen itu tidak diikat sebagai ID item template
- [x] Item baru dari admin otomatis tampil di checklist user tanpa menghapus progres lama — `App\Services\ChecklistService` menggabungkan template dengan progres saat baca, dan baris progres dibuat saat item pertama kali dicentang (`firstOrNew`), bukan di-backfill massal saat admin menambah item. Item tanpa baris progres cukup dianggap belum tercentang. `is_active = false` menyembunyikan item dari pengguna tanpa menghapus progres; menghapus item permanen ikut menghapus progresnya (`cascadeOnDelete`)

Kelompok dikunci ke lima nilai PRD lewat `ChecklistItem::GROUPS` (divalidasi `Rule::in`, bukan free text) supaya tidak lahir kelompok kembar akibat salah ketik; urutan array itu juga menentukan urutan tampil kelompok — diurutkan di PHP karena urutannya semantik, bukan alfabet. `ChecklistItemSeeder` mengisi 32 item awal mengacu anjuran Buku KIA, `firstOrCreate` per (kelompok, judul) agar aman dijalankan ulang. Persentase dihitung di backend (bukan di klien) supaya kartu progres checklist di dashboard F-13 bisa memakai angka yang sama.

Diuji lewat 27 test baru (`Feature/ChecklistTest` — 15 test: guard auth, lima kelompok selalu tampil, item nonaktif tersembunyi, centang/lepas centang beserta `checked_at`, invarian "item admin baru tidak me-reset progres", progres terisolasi antar-pengguna, CRUD item pribadi, item pengguna lain tidak terjangkau, baris progres template tidak bisa dihapus lewat jalur `custom`; `Feature/Admin/ChecklistItemControllerTest` — 12 test: RBAC, CRUD, penolakan `group_name` di luar daftar PRD, `order_index` per kelompok, pindah kelompok, nonaktif tanpa kehilangan progres, reorder, penolakan ID lintas kelompok) — total suite backend 223 test lulus, Pint bersih.

Catatan untuk test lintas-pengguna: guard `api` menyimpan user hasil resolusi dan singleton `tymon.jwt` menyimpan token yang sudah diurai, sehingga dua request dalam satu test dikenali sebagai pengguna yang sama. `ChecklistTest::authHeader()` memanggil `forgetGuards()` + `unsetToken()` lebih dulu. Bukan masalah produksi — di sana satu request HTTP berarti satu boot aplikasi.

**Frontend**
- [x] Kelompok: Dokumen, Perlengkapan Ibu, Perlengkapan Bayi, Persiapan Transportasi & Donor Darah, Rencana Persalinan — `app/dashboard/persiapan/page.tsx` + `components/dashboard/checklist-group-card.tsx`; kelompok kosong tetap dirender supaya pengguna melihat kelima kelompok yang dijanjikan PRD meski admin belum mengisi salah satunya
- [x] Progress bar per kategori + total — bar per kelompok, plus `CircularProgress` total memakai toska (`--success`), bukan merah muda: PRD §1.4 menetapkan toska sebagai warna status "selesai" dan merah muda tetap warna aksi
- [x] Tambah item pribadi — `components/dashboard/checklist-custom-form.tsx`, muncul di kelompok "Item Pribadi" yang ikut dihitung ke progres total. Centang diterapkan optimistis lewat `lib/checklist.ts` (rumus persentasenya sengaja disamakan dengan `ChecklistService`) lalu diselaraskan dengan respons server; gagal simpan mengembalikan state ke snapshot sebelum aksi
- [x] Panel admin: kelola template item — `app/admin/checklist/page.tsx`, satu `DndContext` per kelompok karena urutan hanya bermakna di dalam kelompok (`PATCH /admin/checklist-items/reorder` menyertakan `group_name`); memakai `@dnd-kit` yang sudah terpasang di F-10

Diverifikasi lewat sesi browser sungguhan (Chrome DevTools automation) end-to-end: login → `/dashboard/persiapan` menampilkan 5 kelompok + "Item Pribadi" dari data seeder → mencentang item memperbarui bar kelompok (1/7 → 2/7) dan cincin total (3% → 6%) seketika → tambah item pribadi ("Catatan dari bidan: bawa hasil USG terakhir") muncul dengan toast dan input ter-reset → hapus item pribadi berkurang menjadi 0/1 → panel `/admin/checklist` menampilkan tiap kelompok dengan pegangan seret → dialog edit terisi benar, dropdown memuat tepat lima kelompok PRD → memindahkan item ke "Perlengkapan Bayi" sambil menonaktifkannya tersimpan sebagai `order_index=80, is_active=false` (dikonfirmasi lewat query DB) dan item tampil dengan badge "Nonaktif" di posisi akhir kelompok tujuan → dialog konfirmasi hapus berfungsi. Seperti di F-10, drag lewat mouse maupun keyboard tidak berhasil memicu dnd-kit di bawah tooling otomasi (keterbatasan simulasi pointer-event, bukan bug kode); endpoint reorder-nya sendiri diverifikasi lewat test dan `curl` langsung (urutan tersimpan, ID lintas kelompok ditolak 422). Data uji (item uji, item pribadi, user admin uji) dibersihkan setelahnya.

---

## F-12 · Komunitas (P1)

**Backend**
- [x] Tautan WhatsApp/Telegram dikelola via `settings` — migrasi `settings` (`key` unik, `value` JSONB, `group_name` terindeks) sesuai skema §10; `GET/PUT /admin/settings` sesuai §11.2. Kunci komunitas: `community_heading`, `community_description`, `community_rules` (array), `community_whatsapp_url`, `community_telegram_url`

Yang tidak tertulis di PRD tapi dibutuhkan: **`GET /settings` publik**. §11.2 hanya mendaftarkan endpoint admin, sedangkan `/komunitas` adalah halaman publik yang harus membaca tautan itu tanpa login. Yang keluar dibatasi ke `Setting::PUBLIC_GROUPS` (saat ini hanya `community`) — kelompok baru tidak otomatis publik, jadi pengaturan yang ditambahkan F-14 nanti tidak ikut bocor.

Tiga keputusan yang menjaga tabel key-value tetap aman dikelola admin non-teknis:
- `Setting::KEYS` mendaftarkan kunci yang dikenal beserta kelompoknya. `putMany()` mengabaikan kunci di luar daftar dan **selalu** mengambil `group_name` dari registri, bukan dari input klien — panel admin tidak bisa dipakai menanam baris sembarangan
- `Setting::defaults()` jadi satu sumber kebenaran untuk nilai awal: `SettingSeeder` mengisi baris dari sana, dan pembacaan tetap jatuh ke nilai bawaan bila barisnya belum ada, jadi halaman publik tidak pernah kosong hanya karena seeder belum jalan
- `AdminSettingsRequest` memakai aturan eksplisit per kunci (bukan validasi generik atas JSON apa pun) supaya pesan galat menyebut "Tautan grup WhatsApp", bukan "settings.3.value tidak valid". Tautan tanpa skema (`chat.whatsapp.com/...`) dilengkapi jadi `https://` di `prepareForValidation()` alih-alih ditolak; string kosong disimpan sebagai null. Payload bersifat parsial (`sometimes`) sehingga form komunitas tidak mengosongkan pengaturan lain

Diuji lewat 19 test baru (`Feature/SettingTest` — 7 test: fallback ke default saat belum di-seed, nilai tersimpan, kelompok non-publik tidak bocor, array tersimpan sebagai list, kunci tak dikenal diabaikan, `group_name` dari registri, simpan dua kali tidak menggandakan baris; `Feature/Admin/SettingControllerTest` — 12 test: RBAC guest/user/admin/super_admin, baca dengan default, simpan, normalisasi URL, URL kosong jadi null, URL & judul & butir aturan tidak valid ditolak, payload parsial, kunci tak dikenal tidak persisted) — total suite backend 242 test lulus, Pint bersih.

**Frontend**
- [x] Halaman `/komunitas` — penjelasan, tombol tautan, aturan komunitas, catatan bukan kanal gawat darurat — `app/komunitas/page.tsx` (Server Component, ISR 5 menit seperti `/faq`). Tombol WhatsApp memakai merah muda (aksi utama) dan Telegram ungu bergaris (PRD §1.4); tombol yang tautannya belum diisi otomatis disembunyikan dan diganti keterangan. Ikon `WhatsappIcon`/`TelegramIcon` ditambahkan ke `components/shared/social-icons.tsx` dengan gaya gambar tangan yang sama seperti ikon sosial lain (lucide-react tidak lagi menyediakan ikon merek)
- [x] Panel admin `/admin/pengaturan` — `components/admin/community-settings-form.tsx`, form berlabel dengan `useFieldArray` untuk daftar aturan (tambah/hapus butir, maks 12), bukan editor key-value mentah. Setelah simpan, form di-`reset()` dengan nilai dari server sehingga tautan yang dinormalisasi backend langsung terlihat dan tombol simpan menonaktifkan diri lagi

**Catatan cakupan.** Catatan "komunitas bukan kanal layanan gawat darurat" sengaja **tidak** disimpan di `settings` — teks keselamatan itu sejenis disclaimer wajib PRD §12.4, jadi tetap di kode agar tidak bisa terhapus dari panel. Bunyinya mengikuti §12.4 ("segera hubungi bidan, dokter, atau fasilitas kesehatan terdekat") dan sengaja tidak menyebut nomor darurat spesifik karena pertanyaan terbuka §16 no. 3 (119 nasional vs faskes mitra Gresik) belum terjawab.

Diverifikasi lewat sesi browser sungguhan (Chrome DevTools automation) end-to-end: `/komunitas` tanpa tautan terisi menampilkan keadaan kosong yang benar + daftar aturan dari seeder + kotak peringatan gawat darurat → login admin → `/admin/pengaturan` memuat nilai berjalan → menambah butir aturan kosong ditolak validasi klien per butir → mengisi tautan tanpa skema (`chat.whatsapp.com/...`, `t.me/...`) lalu simpan → toast sukses dan kedua field berubah jadi `https://...` (bukti `reset()` dari respons server bekerja) → dikonfirmasi lewat `curl` ke `GET /settings` dan query DB bahwa nilainya tersimpan dengan `group_name='community'` dan aturan bertambah jadi 6 butir. Data uji (user admin uji, tautan uji) dibersihkan setelahnya.

**Konsekuensi ISR yang perlu diketahui:** perubahan admin baru tampil di `/komunitas` setelah cache 5 menit kedaluwarsa — sudah dijelaskan di teks panel admin. Bila nanti dirasa terlalu lambat, solusinya revalidasi on-demand (`revalidatePath('/komunitas')` lewat route handler yang dipanggil setelah simpan), bukan mengecilkan `revalidate`.

---

## F-13 · Dashboard Pengguna (P0)

**Backend** (tidak tercantum di checklist awal, tapi diperlukan — lihat catatan di bawah)
- [x] `GET /dashboard` — endpoint agregat berisi kelima kartu; `App\Services\DashboardService` + `DashboardController`
- [x] `Form::scopeOpenNow()` — versi kueri dari `isOpenForSubmission()` (F-06) untuk menyaring banyak form sekaligus tanpa memuat semuanya ke memori

**Frontend**
- [x] `/dashboard` — usia kehamilan & HPL, status risiko terakhir + tanggal, progres checklist, form belum diisi, 3 artikel rekomendasi sesuai trimester — `app/dashboard/page.tsx` + lima kartu di `components/dashboard/` (`summary-card` sebagai kerangka bersama, lalu `pregnancy-summary-card`, `risk-summary-card`, `checklist-summary-card`, `pending-forms-card`, `recommended-articles-card`)

**Kenapa ada endpoint agregat.** F-13 tidak menambah tabel, tapi datanya tersebar di lima sumber dan tiga di antaranya belum punya bentuk siap pakai: `PregnancyResource` tidak memuat usia kehamilan (hanya HPHT/HPL mentah), `GET /articles` mengembalikan 12 per halaman tanpa parameter limit, dan **tidak ada endpoint sama sekali** untuk "form yang belum diisi". Menyusunnya dari endpoint yang ada berarti 5 round-trip plus dua endpoint baru — padahal persona P1 memakai 4G tidak stabil (PRD §4) dan target respons p95 adalah 400 ms (§12.1). `GET /dashboard` tidak tertulis literal di §11.2; dibuat sebagai padanan sisi pengguna dari `GET /admin/dashboard` yang sudah ada di sana.

Keputusan isi tiap kartu:
- **Usia kehamilan** dihitung `PregnancyCalculator` dari HPHT, tapi **sisa hari dihitung terhadap `edd_date` yang tersimpan**, bukan HPL hasil rumus — supaya HPL yang ditimpa manual (F-03) tetap dihormati. Hanya kehamilan berstatus `active` yang tampil
- **Status risiko** hanya dari assessment `completed`; yang masih `in_progress` tidak boleh muncul sebagai "hasil terakhir"
- **Progres checklist** memakai ulang `ChecklistService::forUser()` (F-11), jadi rumus persentasenya persis sama dengan halaman `/dashboard/persiapan`
- **Form belum diisi**: terbit + sedang dibuka + `is_public`, dan yang sudah pernah dikirim pengguna disembunyikan. Batas 5 item. *Batasan yang disengaja:* form `is_anonymous` tidak menyimpan `user_id` bersama jawaban (F-07), jadi pengisiannya tidak bisa diatribusikan dan form itu tetap tampil — konsekuensi dari janji anonimitas, bukan kekeliruan penyaringan
- **Artikel rekomendasi**: 3 artikel trimester berjalan, ditambal artikel terbaru bila trimester itu belum punya tiga (tanpa menggandakan yang sudah terpilih). Tanpa data kehamilan, jatuh ke 3 artikel terbaru

Diuji lewat 14 test baru (`Feature/DashboardTest`): guard auth, pengguna baru dapat kartu kosong tanpa galat, usia kehamilan & trimester, HPL manual menang atas rumus, hanya kehamilan aktif, assessment terakhir + level risikonya (yang `in_progress` diabaikan), ringkasan checklist, form yang sudah diisi hilang, pengisian pengguna lain tidak ikut menyembunyikan, form draf/tutup/belum buka/internal dikecualikan, artikel mengutamakan trimester berjalan, fallback tanpa data kehamilan, artikel draf tidak pernah direkomendasikan, dan data terisolasi antar-pengguna — total suite backend 256 test lulus, Pint bersih.

**Perubahan navigasi.** `/dashboard` kini jadi titik masuk setelah login (sebelumnya `/dashboard/kehamilan`), sesuai sitemap §8 yang menempatkannya sebagai akar area pengguna; redirect non-admin di `app/admin/layout.tsx` ikut disesuaikan, dan header dashboard mendapat tautan "Dashboard". Ini melunasi catatan di F-04 ("belum ada nav dashboard, F-13"). *(Menyusul di F-14: `/dashboard` hanya untuk role non-pengelola, dan tombol "Panel Admin" di header dihapus karena admin tidak lagi bisa berada di area ini.)*

Diverifikasi lewat sesi browser sungguhan (Chrome DevTools automation) end-to-end dengan dua pengguna: (1) pengguna berisi — login mendarat di `/dashboard`, kartu kehamilan menampilkan "30 minggu 0 hari · Trimester 3 · 75% menuju HPL · HPL 17 Oktober 2026 · 70 hari lagi", badge "Risiko Rendah" skor 6, progres checklist 13% (4/32), satu survei di kartu "Belum Anda Isi" lengkap dengan tanggal tutup, dan tiga artikel dengan subjudul "Dipilih sesuai trimester 3" berurutan trimester-3 lebih dulu; (2) pengguna baru tanpa data — semua kartu menampilkan keadaan kosong dengan CTA yang benar dan subjudul artikel berubah jadi "Artikel terbaru dari PrenaTalks". Aturan "form hilang setelah diisi" dikonfirmasi lewat `curl`: submit survei → kartu jadi kosong untuk pengguna itu, sementara pengguna lain tetap melihatnya. Data uji (2 user, 3 artikel, 1 survei, progres checklist, assessment) dibersihkan setelahnya.

---

## F-14 · Panel Admin & Statistik (P0)

**Backend**
- [x] `GET /admin/dashboard` — `App\Services\AdminStatsService` + `Admin\DashboardController`. Selain lima angka yang diminta, tiap kartu membawa konteksnya sendiri (pengguna baru bulan ini & jumlah admin, total assessment & yang bertanda bahaya, pecahan konten per jenis, form yang sedang dibuka) supaya angka besarnya bisa ditafsirkan tanpa membuka modul lain
- [x] `GET /admin/audit-logs` (super_admin) — `Admin\AuditLogController`, paginasi 25, filter aksi/jenis data/rentang tanggal, terurut terbaru dulu. `meta` ikut membawa daftar label aksi & jenis data supaya dropdown filter di frontend tidak menduplikasi daftar itu
- [x] Migrasi `audit_logs`, pencatatan otomatis di setiap aksi CRUD admin — trait `App\Traits\Auditable` + `App\Services\AuditRecorder`, dipasang di `Article`, `Video`, `Faq`, `Form`, `Questionnaire`, `ChecklistItem`, `Setting`, `User`
- [x] `GET/PUT /admin/users` (super_admin) — `Admin\UserController`; ada di PRD §11.2 & sitemap §8 tapi tidak diklaim bagian checklist mana pun, jadi diambil F-14 sebagai penerapan konkret item "tabel data server-side"

Empat keputusan pada mekanisme audit:
- **Observer, bukan panggilan manual.** Tercatat lewat jalur mana pun, jadi tidak bisa bolong karena lupa dipanggil saat menambah endpoint. Audit log yang bolong lebih berbahaya daripada tidak ada sama sekali
- **Hanya saat ada pelaku yang login.** Perubahan dari seeder/migrasi/artisan tidak dicatat — kalau tidak, log dibanjiri baris yang tidak menjawab "siapa mengubah apa"
- **Model anak tidak diaudit.** `questions`/`question_options` dibuat massal bersama induknya; mengauditnya membuat satu penyuntingan kuesioner menghasilkan puluhan baris yang menenggelamkan kejadian pentingnya
- **Redaksi & abaikan.** `password_hash`/`remember_token` tidak pernah masuk `changes` (log ini dibaca manusia); `last_login_at` diabaikan lewat `User::auditIgnore()` supaya tiap login tidak jadi baris audit
- `audit_logs.user_id` memakai `nullOnDelete`, bukan cascade: menghapus akun admin tidak boleh ikut menghapus jejak apa yang pernah ia ubah — justru saat itulah audit log paling dibutuhkan

**Dua bug nyata ketahuan lewat test.** (1) `role` dan `is_active` sengaja tidak ada di `$fillable` model `User` (supaya registrasi tidak bisa menaikkan peran lewat mass assignment), sehingga `$user->update()` di controller diam-diam tidak melakukan apa pun — diganti `forceFill()->save()`. (2) Nilai kolom `jsonb` datang sebagai string JSON mentah, jadi `changes` pada perubahan `Setting` berisi `'"Judul baru"'` alih-alih `'Judul baru'`; `AuditRecorder::normalize()` kini men-decode-nya, tapi hanya untuk string yang diawali `{`, `[`, atau `"` supaya teks biasa tidak ikut berubah tipe (judul "123" tidak boleh jadi angka).

**Penjaga penguncian akun.** `UserController` menolak dua hal yang tidak bisa dibatalkan lewat antarmuka: super admin menurunkan peran/menonaktifkan **dirinya sendiri**, dan menurunkan **super admin aktif terakhir**. Tanpa keduanya, pengelolaan akun dan kuesioner risiko bisa terkunci permanen.

Diuji lewat 30 test baru (`Feature/Admin/AuditLogTest` — 11 test: perubahan tanpa pelaku tidak dicatat, create/update/delete tercatat, `changes` hanya memuat kolom yang berubah, nilai JSON terbaca, kolom sensitif tidak pernah masuk, login tidak diaudit, RBAC super_admin, filter, penolakan filter tak dikenal, urutan & paginasi; `Feature/Admin/DashboardStatsTest` — 7 test: RBAC, sistem kosong, hitungan peran & status, assessment bulan ini vs total vs belum selesai, level tak terpakai tetap muncul sebagai 0, konten hanya yang terbit, respon form; `Feature/Admin/UserControllerTest` — 12 test: RBAC bertingkat, paginasi, pencarian nama/email, filter peran & status, sorting terbatas whitelist, `password_hash` tidak pernah bocor, ubah peran, penolakan peran tak dikenal, larangan menurunkan/menonaktifkan diri sendiri, larangan menurunkan super admin aktif terakhir) — total suite backend 286 test lulus, Pint bersih.

**Frontend**
- [x] Kartu statistik admin — `components/admin/admin-stat-cards.tsx` di `/admin` (menggantikan halaman placeholder). Batang distribusi risiko memakai `color_hex` tiap level yang dikonfigurasi Super Admin, sama seperti `RiskLevelBadge`, bukan token Tailwind tetap. Pintasan modul di atasnya menyaring sendiri item khusus super_admin
- [x] Tabel data: pencarian, filter, sorting, pagination server-side — `/admin/pengguna`. Pencarian di-debounce 350 ms supaya tiap ketikan tidak jadi satu request; klik header kolom membalik arah urutan; `components/admin/table-pagination.tsx` dibuat terpisah dari `ArticlePagination` karena tabel admin memuat data lewat klien (callback) sedangkan halaman publik ber-ISR memakai `<Link>`
- [x] Halaman audit log (super admin) — `/admin/audit-log` + `components/admin/audit-change-list.tsx` yang merender dua bentuk `changes` (`{from,to}` untuk update, cuplikan atribut untuk create/delete) sebagai daftar ringkas dengan opsi "lihat semua" agar tinggi baris tabel tidak meledak

`SuperAdminRestricted` kini menerima prop `description` (teks bawaannya tetap soal kuesioner dari F-05) supaya halaman pengguna dan audit log bisa menjelaskan penolakannya sendiri.

**Catatan penempatan.** Sitemap §8 menaruh audit log di `/admin/pengaturan`; isinya dipisah ke halaman sendiri karena tabel berpaginasi dengan filternya sendiri berebut ruang dengan form pengaturan. Jalur navigasi sitemap tetap dijaga lewat tautan "Audit Log" di halaman pengaturan (hanya tampil untuk super_admin).

Diverifikasi lewat sesi browser sungguhan (Chrome DevTools automation) end-to-end sebagai super admin: `/admin` menampilkan 4 kartu statistik + distribusi level risiko, dan pintasan "Pengguna"/"Audit Log"/"Checklist Risiko" hanya muncul untuk super_admin → `/admin/pengguna` menampilkan 11 pengguna dengan penanda arah urut di kolom "Terdaftar" → mengetik "citra" menyaring server-side jadi 1 baris beserta ringkasan "Menampilkan 1–1 dari 1" → dialog ubah peran menampilkan penjelasan hak akses per peran dan tombol Simpan nonaktif selama belum ada perubahan → mengubah Admin → Tenaga Kesehatan tersimpan dan baris tabel langsung ikut berubah → mencoba menonaktifkan akun sendiri ditolak dengan pesan "Anda tidak dapat menonaktifkan akun Anda sendiri" → `/admin/audit-log` menampilkan tepat satu baris untuk perubahan tadi (pelaku, email, IP, badge "Diubah", "Pengguna #22", dan `role admin → health_worker` dengan nilai lama dicoret), sekaligus membuktikan dua kali login tidak menghasilkan baris audit. Data uji (4 pengguna + baris audit) dibersihkan setelahnya.

**Navigasi panel admin (menyusul, setelah F-16).** Dua keluhan nyata: login sebagai admin mendarat di dashboard ibu hamil, dan sekali masuk `/admin/artikel` tidak ada jalan ke modul lain selain tombol back browser (daftar modul dulu hidup sebagai deretan pill di dalam `app/admin/page.tsx`, jadi hanya ada di halaman indeks).

- **Redirect berbasis role** — `lib/auth-routes.ts` (`landingPathForRole`) dipakai `/masuk`; admin & super_admin mendarat di `/admin`. `/dashboard/*` sekaligus ditutup untuk role pengelola (memantulkan ke `/admin`) dan tombol "Panel Admin" di header dashboard dihapus: area itu berisi data kehamilan milik ibu hamil, bukan tempat kerja admin.
- **Sidebar persisten** — `components/admin/admin-sidebar.tsx` + `admin-nav-items.ts` (satu sumber kebenaran daftar menu, dikelompokkan Konten/Program/Situs/Sistem). Kelompok yang seluruh itemnya `superAdminOnly` ikut hilang untuk admin biasa, jadi tidak menyisakan judul kosong. Rute anak menyorot induknya (`/admin/artikel/baru` → "Artikel"), sementara `/admin` hanya cocok persis. Di bawah `lg` sidebar jadi drawer `Sheet` yang menutup diri saat item diklik. `app/admin/page.tsx` disederhanakan jadi murni statistik, dan lebar konten `max-w-5xl` → `max-w-6xl`.
- **Bukan blok `sidebar` shadcn**: butuh komponen `tooltip` + `skeleton` yang belum ada di proyek ini, plus state cookie yang tidak dipakai. Sidebar tulisan tangan di atas `sheet` (sudah terpasang) tidak menambah dependency apa pun.
- `Logo` mendapat prop `href` opsional — sebelumnya logo di panel admin menautkan ke `#beranda`, anchor yang tidak ada di halaman `/admin`.

Diverifikasi lewat sesi browser sungguhan (Chrome DevTools automation) dengan tiga akun uji: super_admin login → mendarat di `/admin` dengan sidebar lengkap → hard-load `/admin/artikel/baru` tetap masuk (sesi pulih dari cookie) dan "Artikel" tetap tersorot → `/dashboard` dipantulkan ke `/admin` tanpa kedipan konten ibu hamil → viewport 800px memunculkan hamburger, drawer terbuka, klik "Pengaturan" menutup drawer sambil bernavigasi; admin biasa → menu Checklist Risiko/Pengguna/Audit Log beserta kelompok "Sistem" hilang, akses langsung `/admin/pengguna` tetap menampilkan `SuperAdminRestricted`; role `user` → mendarat di `/dashboard` tanpa tombol "Panel Admin", `/admin` dipantulkan balik. Tiga akun uji beserta refresh token-nya dibersihkan setelahnya.

**Menu publik (menyusul).** `/video` tidak punya satu pun tautan masuk dari mana pun — admin bisa menerbitkan video tapi tidak ada pengguna yang bisa menemukannya tanpa mengetik URL. Akarnya: `lib/nav-items.ts` berisi anchor seksi landing (`#belajar`, `#cek-risiko`, `#siap-lahiran`, `#tanda-bahaya`, `#tanya-bidan`, `#artikel`) yang **seksinya tidak pernah dibuat** — hanya `#beranda` yang ada di `components/landing/hero.tsx`, jadi enam menu itu mati sejak awal, baik di navbar maupun di kolom "Menu" footer yang memakai daftar yang sama.

Diganti rute publik sungguhan sesuai sitemap §8: Beranda · Artikel · Video · FAQ · Kalkulator · Komunitas · Tentang (tetap 7 item, tata letak navbar tidak perlu berubah). `components/shared/public-nav.tsx` (baru) merender daftarnya dengan penanda halaman aktif — `varian "row"` untuk navbar & header halaman publik, `"stack"` untuk drawer mobile — dan dipakai bertiga bersama footer, jadi tidak ada daftar menu kembar. Halaman detail ikut menyorot induknya (`/video/[slug]` → "Video").

`IntersectionObserver` penanda seksi aktif di navbar ikut dihapus — tidak ada lagi seksi untuk diamati; penanda aktif kini dari `usePathname()`.

**Satu header untuk seluruh area publik.** Ternyata ada **tiga** header yang mengerjakan hal sama dengan tinggi, lebar, dan gaya logo berbeda tanpa alasan: `Navbar` (landing), `PublicPageHeader` (5 halaman publik), dan salinan tulisan tangan di dalam `app/kalkulator/page.tsx`. Alasan teknis memisahkannya — menyejajarkan logo dengan tepi konten — sudah tidak berlaku, karena header `max-w-6xl` meleset di 5 dari 7 halaman publik. Ketiganya diganti `components/shared/public-header.tsx` yang mengikuti gaya navbar landing (sticky, `h-18/sm:h-20`, logo bertagline, `max-w-7xl`).

Tautan "kembali" (`backHref`) kini hanya dikirim halaman detail dan hanya tampil di layar sempit: di sana menu bersembunyi di balik drawer, sementara di layar lebar ia redundan dengan menu ("Kembali ke Video" = menu "Video"). Logo di `app/(auth)/layout.tsx` ikut diarahkan ke `/` — `#beranda` bawaannya juga anchor mati di luar landing.

**Lebar konten dibakukan jadi dua tingkat**, tidak lebih, supaya tetap konsisten:

- `max-w-7xl` — halaman daftar bergrid (`/artikel`, `/video`), sejajar dengan header
- `max-w-4xl` — sisanya (`/faq`, `/komunitas`, `/kalkulator`, `/tentang`, `/artikel/[slug]`, `/video/[slug]`)

Tingkat sempitnya sengaja `4xl`, **menyamai `app/dashboard/layout.tsx`** yang sudah memakai `max-w-4xl` di header, banner verifikasi, dan `<main>`-nya. Jadi lebar konten seragam saat pengguna berpindah antara area publik dan area dashboard, bukan dua sistem yang kebetulan mirip.

Badan artikel tidak ikut ke `7xl`: di situ satu baris teks jadi ~1280px, jauh di atas 45–75 karakter yang nyaman dibaca. Pada `4xl` (~896px) masih di atas ukuran ideal — kalau kelak terasa terlalu lebar, perbaikannya melepas `max-w-none` pada `prose` di `app/artikel/[slug]/page.tsx:125`, bukan menambah tingkat lebar ketiga.

`/tentang` sempat dicoba di tingkat lebar karena punya grid `sm:grid-cols-3`, tapi dipindah ke tingkat sempit: halaman itu hibrida — grid kartunya ingin lebar, tapi empat paragrafnya (baris 68, 95, 149, 183) tidak berpembatas sendiri, sehingga di `7xl` paragraf "Sejarah" membentang ~1235px.

**Tombol sesi di header — dan kenapa ia TIDAK memanggil `/api/auth/refresh`.** `components/shared/auth-nav-button.tsx` menampilkan "Masuk" untuk tamu dan "Dashboard" untuk yang sudah punya sesi, memakai ulang `landingPathForRole()` sehingga admin diarahkan ke `/admin`.

Rancangan pertamanya memanggil `useSessionRehydrate()` supaya tahu ada sesi atau tidak. Itu **cacat**: `AuthController::refresh` mencabut refresh token lama setiap kali dipakai (rotasi, PRD §6.1 langkah 4), jadi menembaknya di tiap pemuatan halaman publik membuat dua tab yang dibuka bersamaan saling mencabut token — satu tab kebagian 401, cookienya dihapus, dan pengguna keluar sendiri tanpa sebab yang jelas. Jebakan ini mudah terulang; jangan panggil refresh dari halaman yang bisa dimuat berkali-kali secara paralel.

Gantinya cookie petunjuk `pt_role` (`lib/server/auth-cookie.ts`) yang **boleh dibaca JS dan hanya berisi peran, tanpa token apa pun** — disetel bersama `pt_refresh` di route login & refresh, dihapus bersamanya di route logout & saat refresh ditolak backend. Tanpa token, cookie ini tidak memberi akses apa pun; paling jauh ia basi dan tombol "Dashboard" berujung di `/masuk`, yang langsung diluruskan guard layout. Nilai di luar keempat peran yang dikenal diabaikan, jadi cookie yang diutak-atik tidak bisa menyetir tujuan tombol.

Pembacaannya lewat `useSyncExternalStore` dengan snapshot server `undefined`, bukan `useEffect` + `setState` yang ditolak rule lint proyek (`react-hooks/set-state-in-effect`). Snapshot `undefined` itu membuat render pertama menampilkan ruang kosong seukuran tombol — tanpa itu, pengguna yang sudah masuk melihat "Masuk" berkedip sesaat sebelum berubah jadi "Dashboard". Pengguna yang sesinya dibuat sebelum perubahan ini belum punya `pt_role`, jadi akan terlihat sebagai tamu sampai route refresh berjalan sekali (otomatis saat mereka membuka `/dashboard` atau `/admin`).

Diverifikasi lewat sesi browser sungguhan (Chrome DevTools automation): tamu → tombol "Masuk" ke `/masuk`; login role `user` → "Dashboard" ke `/dashboard`; akun yang sama dinaikkan jadi `admin` lalu login ulang → "Dashboard" ke `/admin`; logout → kembali "Masuk". Bukti cacat rotasi sudah hilang: memuat penuh `/artikel` menghasilkan 31 permintaan jaringan dan **nol** di antaranya ke `/api/`. Header seragam dan penanda halaman aktif dicek di `/`, `/artikel`, `/video`, `/faq`, `/kalkulator`, `/komunitas`, `/tentang`, termasuk rute anak (`/artikel/[slug]` tetap menyorot "Artikel"). Cabang mobile diperiksa lewat DOM (`hidden … md:flex` vs `md:hidden`) karena `resize_window` berkali-kali gagal diterapkan di sesi itu — tampilan mobilenya sendiri belum dilihat langsung. Akun uji dibersihkan setelahnya.

**Yang belum dikerjakan dari bunyi PRD.** Halaman admin lama (artikel, video, FAQ, form) masih memuat seluruh daftar sekaligus tanpa paginasi server-side. Untuk volume konten v1 (target ≥ 200 konten, §3.2) itu belum jadi masalah, tapi kalau daftar artikel tumbuh jauh lebih besar, pola tabel di `/admin/pengguna` sudah siap dipakai ulang.

---

## F-15 · Akses Tenaga Kesehatan (P2 — pasca-rilis)

**Backend**
- [x] Mekanisme consent eksplisit (dapat dicabut) — migrasi `health_worker_consents` + `ConsentController` (daftar, cari penerima, beri, buat ulang kode, cabut, baca catatan). Pencabutan menulis `revoked_at`, bukan menghapus baris
- [x] Akses berbasis kode tautan — `HealthWorkerConsentService` membuat kode acak 40 karakter, menyimpannya sebagai **hash SHA-256** persis seperti `refresh_tokens.token_hash`, dan menukarnya lewat `POST /health-worker/access`
- [x] Pencatatan di `audit_logs` — pemberian/pencabutan/pembuatan ulang tercatat lewat trait `Auditable` pada model, sedangkan **pembacaan** dicatat eksplisit sebagai aksi baru `accessed` (`AuditRecorder::record`) karena membaca tidak mengubah baris apa pun dan tidak akan tertangkap observer
- [x] Tampilan hasil assessment untuk tenaga kesehatan + catatan edukasi — `HealthWorkerAccessController` (tukar kode, daftar pasien, detail pasien, rincian satu hasil, tulis catatan) + migrasi `health_worker_notes`
- [x] Notifikasi email — tiga notifikasi ter-antre di `App\Notifications`: `HealthWorkerConsentGrantedNotification` (izin diberikan / kode dibuat ulang → tenaga kesehatan), `HealthWorkerConsentRevokedNotification` (izin dicabut → tenaga kesehatan), `HealthWorkerNoteReceivedNotification` (catatan baru → pengguna). Semuanya memakai `QueuedEmailNotification` yang sama dengan email auth, jadi ikut antrean `emails` dan pola backoff-nya

**Dua tabel di luar skema PRD.** §10 tidak memuat DDL untuk F-15 (fiturnya ditulis sebagai satu paragraf), jadi bentuk tabelnya diturunkan dari kalimat fiturnya: "consent eksplisit, dapat dicabut" → `revoked_at`, "akses berbasis kode tautan" → `access_code_hash`. Ditambah `expires_at` (kedaluwarsa opsional) dan `last_accessed_at` (supaya pemberi izin melihat kapan datanya terakhir dibuka).

**Kode tautan bukan kredensial pembawa (bearer).** Ini keputusan paling menentukan di fitur ini. Selain kode yang benar, pembukaan menuntut dua hal lain: peran `health_worker` (middleware rute) dan izin yang memang menunjuk akun itu (`guardConsent`). Konsekuensinya tautan yang diteruskan ke grup WhatsApp tidak membuka apa pun bagi penerimanya — padahal justru begitulah tautan berpindah tangan di dunia nyata. Ini juga yang membuat "terverifikasi" pada PRD §9 F-15 punya arti: verifikasinya adalah peran yang dinaikkan super admin lewat `/admin/pengguna`.

**Pencabutan berlaku seketika, dan itu ditegakkan oleh bentuk datanya.** `HealthWorkerConsent::isActive()` satu-satunya sumber kebenaran, dicek ulang di **tiap** permintaan tenaga kesehatan — bukan sekali saat kode ditukar lalu dipercaya sesudahnya. Tidak ada sesi atau token turunan yang bisa hidup lebih lama dari izinnya (BUSINESS_FLOWS §9: "bukan menunggu kode tautan kedaluwarsa").

**Kegagalan tidak dibedakan.** Kode salah, izin dicabut, izin kedaluwarsa, dan izin milik tenaga kesehatan lain semuanya menjawab 404 dengan pesan yang sama persis. Membedakannya akan memberi tahu penebak kode bahwa tebakannya mengenai izin yang benar-benar ada. `POST /health-worker/access` juga di-throttle 10/menit karena itulah satu-satunya endpoint yang menerima tebakan kode.

**Cakupan izin ditentukan satu tempat.** `HealthWorkerPatientService` menyusun apa yang boleh dilihat: nama pemberi izin, usia kehamilan, hasil cek risiko, catatan edukasi. Yang **tidak** ikut meski ada di `pregnancies`: berat badan, golongan darah, riwayat penyakit, nama & kontak fasilitas, serta email dan telepon pemberi izin. Usia kehamilan ikut karena skor risiko nyaris tidak bisa dibaca tanpanya; sisanya tidak dibutuhkan untuk membaca hasil (minimalisasi data, §12.3). Menambah kartu di frontend tidak akan memunculkan data baru tanpa keputusan sadar di sisi ini.

**Kode hanya bisa dilihat sekali.** Karena yang tersimpan hanya hash-nya, tidak ada endpoint yang bisa menampilkan ulang tautan yang hilang — pengguna membuat kode baru, dan kode lama langsung mati (satu hash per izin). Ini konsekuensi yang disengaja dari mengikuti pola `refresh_tokens`, bukan kekurangan yang terlewat.

**Kenapa kode tautan boleh masuk email — dan kenapa itu justru mempersempit akses.** Kode dikirim ke alamat email akun yang memang ditunjuk izin itu. Karena kode bukan kredensial pembawa (lihat dua paragraf di atas), email tidak melebarkan siapa yang bisa membuka apa pun; yang berubah hanyalah tautan tidak lagi harus melewati tangan pengguna dan aplikasi pesan. Alternatif sebelumnya — pengguna menyalin tautan lalu meneruskannya lewat WhatsApp — punya permukaan salah-alamat yang jauh lebih lebar, dan tetap tersedia bagi yang menginginkannya.

**Isi catatan edukasi sengaja tidak disalin ke email pengguna.** Catatan menanggapi hasil cek risiko, jadi kalimatnya nyaris selalu memuat kondisi kesehatan penerimanya. Emailnya hanya mengabarkan bahwa catatan ada dan menautkan ke `/dashboard/privasi` yang menuntut login. Email tenaga kesehatan pun tidak memuat skor, tingkat risiko, atau usia kehamilan — hanya nama pemberi izin, tanpa itu penerima tidak tahu tautannya milik siapa (PRD §12.3, §15 "kebocoran data kesehatan").

Email pencabutan tidak mengubah apa pun secara teknis — pencabutan sudah berlaku seketika tanpanya. Gunanya semata agar penerima tahu **sebabnya** saat tautan yang tadi berfungsi mendadak menolak, alih-alih mengiranya gangguan sistem. Email itu hanya dikirim pada pencabutan yang benar-benar terjadi, bukan tiap kali endpointnya dipanggil ulang.

**Pencarian penerima memakai email persis**, bukan pencocokan sebagian seperti tabel pengguna di panel admin. Pencocokan sebagian akan mengubah endpoint itu jadi direktori tenaga kesehatan yang bisa disisir siapa pun yang punya akun; dengan email persis, pemanggil harus sudah tahu siapa yang dicarinya — dan memang begitu alurnya, bidan memberi emailnya kepada pasien.

**Satu izin aktif per pasangan**, dijaga indeks unik parsial `(user_id, health_worker_id) WHERE revoked_at IS NULL` (SQL mentah karena Schema builder tidak punya API `where` untuk indeks; sintaksnya berlaku di PostgreSQL maupun SQLite pengujian). Indeks unik penuh akan salah menolak izin baru setelah yang lama dicabut, padahal riwayatnya sengaja disimpan.

`revoked_at` tidak masuk `$fillable` — pencabutan lewat `HealthWorkerConsent::revoke()` — supaya tidak ada payload permintaan yang bisa menghidupkan kembali izin dengan mengirim `revoked_at: null`. `access_code_hash` dan `last_accessed_at` masuk `auditIgnore()`: yang pertama kredensial (audit log dibaca super admin), yang kedua berubah tiap pembacaan dan akan melahirkan baris `updated` kembar di samping baris `accessed`.

Diuji lewat 18 test baru (`Feature/HealthWorkerConsentTest` — 9 test: kode hanya dikembalikan sekali & tersimpan sebagai hash, pemberian tercatat di audit tanpa membocorkan hash, penerima wajib `health_worker` aktif, izin aktif kedua ditolak tapi boleh setelah dicabut, kode lama mati setelah dibuat ulang, pencabutan langsung menutup akses, izin milik orang lain 404, pencarian email persis, izin kedaluwarsa berhenti bekerja tanpa dicabut; `Feature/HealthWorkerAccessTest` — 9 test: kode membuka hasil beserta usia kehamilan tapi tanpa data kehamilan lain, tautan bocor tak berguna bagi akun lain/pengguna biasa/admin, kode tak dikenal tak terbedakan dari yang dicabut, pembacaan tercatat sebagai `accessed` tanpa baris `updated` kembar, izin sah tidak membuka hasil pasien lain, catatan edukasi terbaca pemiliknya, catatan tidak bisa ditempelkan ke hasil orang lain, catatan bertahan setelah pencabutan, daftar pasien hanya berisi izin aktif; `Feature/HealthWorkerNotificationTest` — 6 test: pemberian mengirim tautan ke penerima dan tidak ke pemberi izin, pembuatan ulang mengirim kode baru sekaligus menyatakan yang lama mati, pencabutan mengirim tepat sekali walau tombolnya ditekan dua kali, email catatan menyebut penulisnya tanpa mengutip isi catatan, ketiganya ter-antre di antrean `emails`, izin yang sudah dicabut tidak mengabari siapa pun) — total suite backend 336 test lulus, Pint bersih.

**Frontend**
- [x] `/dashboard/privasi` — daftar izin (aktif & riwayat yang sudah dicabut), dialog beri izin dua langkah (cari email → konfirmasi nama), dialog tautan sekali-tampil, buat ulang tautan, cabut izin dengan konfirmasi, dan pembacaan catatan edukasi
- [x] `/nakes` — beranda tenaga kesehatan: kolom tempel kode tautan + daftar pasien dengan izin aktif
- [x] `/nakes/akses/[code]` — titik pendaratan tautan; menukar kode lalu `router.replace` ke halaman pasien
- [x] `/nakes/pasien/[consentId]` — konteks kehamilan, riwayat cek risiko dengan rincian faktor penyumbang skor, dan form catatan edukasi

Salinan antarmuka mengikuti kehadiran email: dialog tautan menyebut bahwa tautan yang sama sudah dikirim ke email penerima (jadi kehilangan salinan di layar tidak lagi fatal), dialog pemberian izin menyebutkannya sebelum pengguna menekan "Beri izin", dan kolom tempel kode di `/nakes` kini dijelaskan sebagai jalur cadangan, bukan jalur utama.

`landingPathForRole()` kini mengarahkan peran `health_worker` ke `/nakes`; guard `app/nakes/layout.tsx` mengembalikan peran lain ke "rumah"-nya masing-masing alih-alih menampilkan halaman galat — pengguna yang mengklik tautan akses milik orang lain sedang tersesat, bukan menyerang. Area `/dashboard` sengaja tetap terbuka untuk `health_worker`: seorang bidan bisa saja juga sedang hamil.

**Konfirmasi dua langkah, bukan satu form.** Pengguna mencari lewat email lalu mengonfirmasi nama yang muncul. Konfirmasi itu bagian dari "consent eksplisit" — memberi izin kepada id yang tak pernah dilihat namanya bukan persetujuan yang berarti. Dialognya juga menyebut apa yang **tidak** ikut terlihat, karena itu yang menentukan apakah persetujuannya diberikan dengan informasi utuh.

**Rincian tiap hasil diambil per baris saat dibuka**, bukan sekaligus bersama daftar: hanya pembukaan rincian yang tercatat sebagai akses ke satu hasil tertentu, jadi memuatnya di muka akan menulis jejak audit untuk hasil yang tidak pernah dilihat.

Tautan dari halaman hasil cek risiko (F-05) ke `/dashboard/privasi` ditambahkan tepat di bawah tombol "Bagikan ke Bidan": tombol itu hanya mengirim ringkasan lewat WhatsApp, sedangkan bidan yang perlu melihat rincian dan membalas dengan catatan butuh jalur F-15 — dan itu tidak akan ditemukan pengguna kecuali disebut di titik kebutuhannya muncul. Pintasan "Privasi" juga ada di header dashboard, bukan sebagai kartu di beranda, karena pengguna mencarinya saat ingin **mencabut** izin — momen yang tidak boleh menuntut menelusuri halaman lebih dulu.

Diverifikasi lewat sesi browser sungguhan (Chrome DevTools automation) end-to-end melawan PostgreSQL: pasien memberi izin → tautan tampil sekali dengan peringatannya → buat ulang tautan menghasilkan kode berbeda → login sebagai bidan mendarat langsung di `/nakes` → membuka tautan meneruskan ke halaman pasien berisi usia kehamilan 19 minggu 6 hari, hasil "Risiko Tinggi" skor 10 bertanda bahaya, rincian faktor penyumbang skor, dan rekomendasi → tombol "Tulis catatan" memilih hasil itu di form → catatan terkirim dan langsung terbaca pasien → pasien mencabut izin → halaman pasien yang sama seketika berubah jadi penolakan, tautan lama ikut mati, dan catatan edukasi tetap terbaca pemiliknya. Baris `audit_logs` diperiksa langsung di basis data: `created` (izin), `accessed` (`via: redeem` dan `via: assessment` beserta id hasilnya), `created` (catatan) — tanpa `access_code_hash` di kolom `changes` mana pun. Data uji (2 akun, izin, catatan, kehamilan, hasil cek risiko, baris audit) dibersihkan setelahnya.

Pengiriman email diverifikasi lewat antrean sungguhan (worker `prenatalks-queue-1` → Mailtrap): ketiga job terkirim, `failed_jobs` kosong. Satu di antaranya sempat `FAIL` karena DNS Docker lokal gagal menerjemahkan host `db` sesaat, lalu **berhasil pada percobaan kedua** setelah jeda 10 detik — persis kejadian yang membuat `backoff()` pada `QueuedEmailNotification` ada, dan konfirmasi tak sengaja bahwa aturan itu bekerja.

**Yang belum dikerjakan.** Notifikasi masih email saja; pengingat via WhatsApp baru dijadwalkan Bulan 2–3 pada peta jalan §14. Catatan edukasi juga belum bisa disunting atau dihapus penulisnya: catatan yang sudah dibaca pasien tidak boleh berubah diam-diam di belakangnya, dan koreksi dilakukan dengan menulis catatan baru. Pengguna belum bisa mematikan email-email ini per jenis — untuk tiga email yang semuanya menandai kejadian pada datanya sendiri, preferensi per-jenis baru masuk akal setelah ada notifikasi yang bersifat pemasaran.

---

## F-16 · Halaman Tentang (P0)

**Backend**
- [x] Konten seksi 1–5 disimpan di `settings` — 8 kunci baru di kelompok `about` (`about_name_philosophy`, `about_history_intro`, `about_milestones`, `about_commitment_heading`, `about_commitment_body`, `about_logo_philosophy`, `about_color_purple_meaning`, `about_color_teal_meaning`), memakai ulang mesin `Setting` dari F-12. Kelompok `about` didaftarkan ke `PUBLIC_GROUPS` supaya halaman publik bisa membacanya tanpa login
- [x] CRUD profil tim — migrasi `team_members` + `Admin\TeamMemberController` (CRUD + `reorder` drag & drop) dan `GET /team-members` publik. Foto memakai ulang `CoverImageService` (F-08) dengan direktori `team/`, jadi konversi WebP-nya sama tanpa duplikasi kode

**Tabel baru di luar skema PRD.** `team_members` tidak ada di §10, tapi diminta kriteria terima F-16 ("Profil tim dikelola lewat panel admin"). Selain field yang disebut checklist, ditambahkan `credential` — PRD §9 F-16 seksi 6 meminta "khusus tenaga kesehatan: nama profesi dan STR bila relevan, karena ini yang membuat klaim 'berbasis bukti' dapat diverifikasi". Ada juga `is_published` supaya profil bisa disembunyikan tanpa dihapus, sejalan dengan pola F-10/F-11.

**Warna merek dikunci di kode.** `Setting::BRAND_COLORS` menyimpan `#7C3AED` dan `#14B8A6` sebagai konstanta, bukan setting yang bisa disunting — PRD §1.4 menyatakan keduanya warna resmi logo yang "tidak boleh diubah". Yang bisa disunting admin hanya teks maknanya. Nilai hex tetap dikirim lewat `meta.brand_colors` agar halaman Tentang tidak menulis ulang kode warnanya sebagai literal kedua yang bisa menyimpang.

Nilai bawaan seksi 1–5 diambil dari PRD §1 (identitas merek) lewat `Setting::defaults()`, jadi halaman langsung berisi dan admin tinggal menyunting alih-alih mengarang dari nol.

Diuji lewat 18 test baru (`Feature/AboutPageTest` — 7 test: isi Tentang terbaca tanpa login, filosofi nama terpecah tiga bagian, tonggak sebagai list, warna merek dari kode bukan dari `settings`, profil tim hanya yang terbit & terurut, kualifikasi terekspos publik, foto kosong mengembalikan null; `Feature/Admin/TeamMemberControllerTest` — 11 test: RBAC, CRUD, wajib nama & peran, foto tersimpan sebagai WebP di `team/`, unggahan non-gambar ditolak, hapus foto lewat update, sembunyikan profil, hapus profil ikut menghapus berkas fotonya, reorder, penolakan ID tak dikenal) — total suite backend 304 test lulus, Pint bersih.

Dua test F-12 ikut disesuaikan: keduanya memaku daftar `PUBLIC_GROUPS` persis `['community']`. Ditulis ulang jadi pernyataan maksudnya ("kelompok `mail` tidak publik", "`community` termasuk publik") supaya menambah kelompok publik baru tidak memaksa test diubah tiap kali.

**Frontend**
- [x] `/tentang` — 7 seksi sesuai urutan PRD §9 F-16: filosofi nama (3 kartu), sejarah (pengantar + timeline), komitmen (blok ungu besar), filosofi logo (logo + keterangan), filosofi warna (dua blok warna), profil tim, dan CTA gradien ke `/daftar` & `/komunitas`
- [x] Render statis — PRD meminta "SSG" **sekaligus** "dapat disunting admin tanpa deploy ulang"; dua hal itu hanya bisa berjalan bersama lewat ISR, jadi halaman ini statis dengan revalidasi 5 menit seperti `/faq` dan `/komunitas`
- [x] Metadata Open Graph dengan logo penuh warna — `openGraph.images` menunjuk `/brand/logo.png`
- [x] Panel admin `/admin/tentang` — form seksi 1–5 (dengan `useFieldArray` untuk tonggak sejarah, maks 12) digabung dengan CRUD profil tim beserta unggah foto dan drag & drop urutan. Seksi 5 menampilkan swatch warna read-only beserta ikon gembok dan penjelasan kenapa hex-nya tidak bisa disunting

Tautan "Tentang PrenaTalks" dan "Tim Ahli" di footer yang sebelumnya `href="#tentang"` kini menunjuk `/tentang`.

**Bug Next.js 16 yang ditemukan (memengaruhi F-08 & F-09 juga).** Foto profil tampil sebagai gambar rusak di lokal meski berkasnya benar (dikonfirmasi `Content-Type: image/webp`, 17 KB JPEG → 4,4 KB WebP). Penyebabnya bukan `remotePatterns` — pola itu cocok saat diuji langsung — melainkan `images.dangerouslyAllowLocalIP` yang **baru ada di Next 16 dan bawaannya `false`**: optimizer menolak mengoptimalkan gambar dari IP lokal sebagai perlindungan SSRF, dengan pesan menyesatkan `"url" parameter is not allowed`. Ini bukan masalah produksi (API di host publik), tapi di lokal membuat cover artikel (F-08), thumbnail video (F-09), dan foto tim ikut rusak — F-08/F-09 sebelumnya hanya diverifikasi lewat `curl` langsung ke berkas, bukan lewat rendering `next/image`, sehingga luput. Diperbaiki di `next.config.ts` dengan mengaktifkan flag itu **hanya bila host API lokal dan bukan build produksi**.

Diverifikasi lewat sesi browser sungguhan (Chrome DevTools automation) end-to-end: `/tentang` menampilkan ketujuh seksi dengan isi dari seeder — tiga kartu Pre/Natal/Talks, timeline 2020→2022→2026, blok komitmen "Empowerment Women's Health", logo beserta keterangannya, dua blok warna dengan hex `#7C3AED`/`#14B8A6`, dan CTA → login admin → `/admin/tentang` memuat seluruh nilai berjalan, seksi 5 tampil terkunci dengan swatch read-only → tambah profil tim (nama, peran, kualifikasi "Bidan · STR 1234567890", deskripsi) beserta unggah foto JPEG sungguhan → tersimpan sebagai `.webp` di `storage/team/` dan tampil sebagai avatar bulat di panel admin maupun di `/tentang` lengkap dengan badge kualifikasi. Data uji (1 profil tim + fotonya, user admin uji, baris audit) dibersihkan setelahnya.

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
