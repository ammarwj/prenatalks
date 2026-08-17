# PrenaTalks

**Teman Ibu Hamil untuk Persalinan Aman** — platform edukasi dan skrining risiko kehamilan berbasis bukti ilmiah.

Monorepo ini berisi dua aplikasi: **API** (Laravel 13, REST + JWT) dan **Web** (Next.js 16, App Router), dengan PostgreSQL 16 sebagai basis data.

## Fitur utama

| Publik | Pengguna terdaftar | Admin |
|---|---|---|
| Landing page, Tentang, Komunitas | Data kehamilan & dashboard | CRUD artikel, video, FAQ |
| Artikel & video edukasi | Checklist risiko + hasil PDF | Form & survey builder |
| FAQ | Checklist persiapan melahirkan | Export submission (CSV/XLSX) |
| Kalkulator kehamilan | Riwayat assessment | Kelola kuesioner risiko, user, audit log |
| Survei publik | | |

Detail per fitur (F-01…F-16), skema basis data, dan spesifikasi API ada di [`PRD.md`](PRD.md).

## Struktur repo

```
prenatalks/
├─ api/                  Laravel 13 — REST API di /api/v1 (lihat api/README.md)
├─ web/                  Next.js 16 + shadcn/ui + Tailwind v4
├─ docker/               Dockerfile PHP-FPM & konfigurasi Nginx
├─ docker-compose.yml    app (PHP-FPM) · nginx :8000 · postgres :5432
├─ PRD.md                Sumber kebenaran produk: merek, fitur, skema DB, API
├─ BUSINESS_FLOWS.md     Diagram alur proses (Mermaid) per fitur
└─ IMPLEMENTATION_CHECKLIST.md   Checklist implementasi task-by-task
```

## Menjalankan secara lokal

Prasyarat: Docker + Docker Compose, Node.js 20+ (atau Bun).

### 1. API

```bash
docker compose up -d
docker compose exec app composer install
docker compose exec app cp .env.example .env
docker compose exec app php artisan key:generate
docker compose exec app php artisan jwt:secret --force
docker compose exec app php artisan migrate --seed
```

API tersedia di `http://localhost:8000/api/v1`. Cek kesehatan: `GET /api/v1/health`.

Seeder mengisi kuesioner risiko awal, kategori, item checklist, setting situs, dan satu user uji (`test@example.com`).

### 2. Web

```bash
cd web
bun install          # atau: npm install
# buat .env.local — isi variabelnya sesuai tabel di bawah
bun run dev          # atau: npm run dev
```

Web berjalan di `http://localhost:3000`.

## Variabel lingkungan

**`web/.env.local`**

| Variabel | Contoh | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Base URL API Laravel |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Dipakai untuk sitemap & metadata |
| `AUTH_COOKIE_NAME` | `prenatalks_refresh` | Nama cookie httpOnly penyimpan refresh token |

**`api/.env`** — salin dari `api/.env.example`. Nilai default sudah cocok dengan `docker-compose.yml` (`DB_HOST=db`, database/user/password `prenatalks`). Daftar lengkap variabel ada di PRD Lampiran B.

## Autentikasi

JWT dengan rotasi refresh token (lihat `BUSINESS_FLOWS.md` §2):

- `access_token` (`JWT_TTL=60` menit) disimpan **di memory** browser — tidak pernah masuk `localStorage`.
- `refresh_token` (`JWT_REFRESH_TTL=20160` menit) disimpan sebagai cookie `httpOnly; Secure; SameSite=Lax` lewat Route Handler Next.js, dan dirotasi setiap kali di-refresh (token lama masuk denylist).
- Login tidak diblokir oleh status verifikasi email; yang diblokir hanya penyimpanan hasil assessment.

## Pengujian & code style

```bash
# API
docker compose exec app php artisan test      # PHPUnit
docker compose exec app ./vendor/bin/pint     # Laravel Pint (tambahkan --test untuk cek saja)

# Web
cd web && bun run lint                        # ESLint (eslint-config-next)
cd web && bun run build                       # type-check + production build
```

CI (`.github/workflows/api-ci.yml`) menjalankan Pint, migrasi terhadap PostgreSQL 16, dan test suite pada setiap PR yang menyentuh `api/**`.

## Konvensi

- Penulisan nama merek: **PrenaTalks** (satu kata, huruf T kapital). Dalam kode gunakan `prenatalks`.
- Respons API mengikuti bentuk standar lewat trait `App\Traits\ApiResponse` (PRD §11.1) — sukses maupun galat, termasuk error yang tak tertangani.
- Taksonomi konten memakai `life_stage`: `preconception`, `pregnancy`, `birth`, `postpartum`, `parenting`. Struktur kelima tahap sudah tersedia sejak v1 meski konten v1 fokus pada kehamilan dan persalinan.
- Bila ada pertentangan antara mockup dan `PRD.md`, PRD yang menang.
