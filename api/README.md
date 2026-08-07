# PrenaTalks API

Laravel 13 REST API described in `PRD.md` (bagian 6 — Arsitektur Sistem, bagian 13 — Struktur Proyek). Berjalan di Docker bersama PostgreSQL 16 dan Nginx — lihat `docker-compose.yml` di root repo.

## Menjalankan secara lokal

```bash
# dari root repo
docker compose up -d
docker compose exec app composer install
docker compose exec app php artisan migrate
```

API tersedia di `http://localhost:8000/api/v1`. Health check: `GET /api/v1/health`.

## Struktur

```
api/
├─ app/
│  ├─ Http/Controllers/Api/V1/   Auth, Pregnancy, Assessment, Form, Article, Admin, Health
│  ├─ Http/Requests/             validasi per endpoint
│  ├─ Http/Resources/            transformasi JSON
│  ├─ Models/
│  ├─ Services/                  PregnancyCalculator, RiskScoringService, ExportService
│  ├─ Policies/
│  ├─ Traits/                    ApiResponse — bentuk respons standar (PRD §11.1)
│  └─ Jobs/                      ExportSubmissions, SendVerificationEmail
├─ database/migrations|seeders/
└─ routes/api.php                di-prefix /api/v1 otomatis (bootstrap/app.php)
```

## Konvensi respons

Bentuk respons sukses/galat mengikuti PRD §11.1 lewat trait `App\Traits\ApiResponse`
(`$this->success($data, $message, $meta)` / `$this->error($message, $errors, $status)`),
dan galat tak tertangani (validasi, 401/403/404/429/500) dirender dalam bentuk yang sama
lewat `bootstrap/app.php`.

## Perintah lain

```bash
docker compose exec app php artisan test     # PHPUnit (pakai sqlite in-memory)
docker compose exec app ./vendor/bin/pint    # code style (Laravel Pint)
```

Lihat `IMPLEMENTATION_CHECKLIST.md` di root repo untuk task-by-task checklist per fitur.
