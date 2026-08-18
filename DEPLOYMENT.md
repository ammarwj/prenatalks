# Deployment — PrenaTalks ke VPS (Docker)

Panduan menaikkan monorepo ini ke VPS yang **sudah menjalankan stack lain** (runup, flo-event), memakai pola yang sama seperti stack tersebut: semua service di Docker, port hanya di-bind ke `127.0.0.1`, dan **Nginx host** yang memegang TLS serta mem-proxy ke masing-masing stack.

| Domain | Aplikasi | Jalur |
|---|---|---|
| `prenatalks.id` (+ `www`) | `web/` — Next.js 16 | Nginx host → `127.0.0.1:3003` (container `prenatalks_web`) |
| `api.prenatalks.id` | `api/` — Laravel 13 | Nginx host → `127.0.0.1:8003` (container `prenatalks_nginx` → PHP-FPM) |

Lokasi kode: **`/opt/prenatalks`**. Port yang dipakai stack ini:

| Service | Port host | Kenapa port itu |
|---|---|---|
| Web (Next.js) | `127.0.0.1:3003` | 3000 dipakai `runup_frontend`, 3001 `flo-event-web` |
| API (Nginx→PHP-FPM) | `127.0.0.1:8003` | 8000 dipakai `runup_nginx`, 8001 `flo-event-api` |
| PostgreSQL | `127.0.0.1:5430` | 5432 dipakai `runup_db`, 5433 `flo-event-db` |

> Ketiganya **tidak** dibuka ke publik — hanya loopback, persis seperti stack lain di VPS ini. Postgres di `5430` hanya untuk `psql`/`pg_dump` dari host.

**Berkas produksi di repo** (terpisah dari `docker-compose.yml` yang untuk pengembangan):

```
docker-compose.prod.yml        app · queue · scheduler · nginx :8003 · web :3003 · db :5430
.env.prod.example              contoh .env untuk compose (bukan .env Laravel)
docker/php/Dockerfile.prod     PHP-FPM 8.4 + opcache, kode & vendor di-bake ke image
docker/php/php.prod.ini        memory_limit, batas unggah, opcache
docker/php/entrypoint.sh       config/route/event/view:cache saat container start
docker/nginx/Dockerfile.prod   Nginx container untuk API
docker/nginx/prod.conf         vhost API di dalam container
docker/web/Dockerfile          Next.js standalone (multi-stage)
```

---

## Ringkasan langkah

1. [Arahkan DNS](#1-dns)
2. [Siapkan direktori & ambil kode](#2-ambil-kode)
3. [Isi environment](#3-environment) ← paling sering jadi sumber masalah
4. [Build & jalankan sisi API](#4-build--jalankan-sisi-api)
5. [Inisialisasi aplikasi](#5-inisialisasi-aplikasi) — key, migrasi, seed, admin
6. [Nginx host](#6-nginx-host)
7. [SSL Let's Encrypt](#7-ssl)
8. [Build & jalankan web](#8-build--jalankan-web) ← **harus setelah API hidup ber-HTTPS**
9. [Backup & rotasi log](#9-backup--log)
10. [Pengerasan](#10-pengerasan)
11. [Smoke test](#11-smoke-test)
12. [Redeploy](#12-redeploy)

> **Urutannya tidak bisa ditukar.** `next build` mem-prerender halaman publik (FAQ, artikel, video, Tentang, Komunitas) dengan benar-benar memanggil API di `NEXT_PUBLIC_API_URL`. Kalau API belum hidup di `https://api.prenatalks.id` saat image web dibangun, build **gagal** dengan `TypeError: fetch failed`.

---

## Jalur cepat — `scripts/install.sh`

Seluruh langkah 3–8 (env, build, migrasi, seed, akun admin, vhost Nginx, SSL, build web) bisa dijalankan satu perintah:

```bash
cd /opt/prenatalks
sudo ./scripts/install.sh
```

Skrip bertanya domain, port, email admin, dan SMTP — tekan Enter untuk memakai nilai bawaan (`prenatalks.id`, `api.prenatalks.id`, 3003/8003/5430). Password Postgres, `APP_KEY`, `JWT_SECRET`, dan password admin dibuat acak; password admin dicetak sekali di akhir.

```bash
sudo ./scripts/install.sh --yes                       # non-interaktif, semua bawaan
sudo ./scripts/install.sh --skip-ssl --skip-web       # DNS belum siap: API dulu, web menyusul
./scripts/install.sh --help
```

Skrip aman dijalankan ulang: `.env` yang sudah ada tidak ditimpa tanpa izin (dan dicadangkan kalau ditimpa), seeder dilewati bila data awal sudah terisi, vhost yang sudah ada dibiarkan, dan Certbot dilewati bila sertifikat sudah terbit. **DNS tetap harus diarahkan lebih dulu** (langkah 1) — Certbot dan build web sama-sama bergantung padanya.

Dua skrip pendamping:

```bash
./scripts/deploy.sh        # redeploy: pull → build → recreate → migrate  (langkah 12)
./scripts/backup.sh        # dump DB + arsip volume unggahan               (langkah 9.1)
```

Sisa dokumen ini menjelaskan tiap langkah yang dikerjakan skrip tersebut — baca kalau ada yang gagal, atau kalau ingin memasang manual.

---

## 1. DNS

Di panel DNS `prenatalks.id`, buat tiga record A ke IP publik VPS:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `IP_VPS` | 300 |
| A | `www` | `IP_VPS` | 300 |
| A | `api` | `IP_VPS` | 300 |

Tunggu propagasi sebelum menjalankan Certbot (langkah 7):

```bash
dig +short prenatalks.id
dig +short api.prenatalks.id
```

Kalau memakai Cloudflare, matikan proxy (awan abu-abu) dulu saat menerbitkan sertifikat.

---

## 2. Ambil kode

```bash
sudo mkdir -p /opt/prenatalks
sudo chown "$USER":"$USER" /opt/prenatalks
git clone <URL_REPO_ANDA> /opt/prenatalks
cd /opt/prenatalks
```

Kalau repo privat: `ssh-keygen -t ed25519 -C "vps-prenatalks"`, lalu daftarkan `~/.ssh/id_ed25519.pub` sebagai Deploy Key (read-only) di GitHub.

Docker & Compose sudah terpasang di VPS ini (stack lain memakainya). Verifikasi:

```bash
docker --version && docker compose version
```

---

## 3. Environment

Ada **dua** berkas env, dan keduanya wajib:

| Berkas | Untuk apa | Dibaca kapan |
|---|---|---|
| `/opt/prenatalks/.env` | Variabel Compose: password DB, port, `NEXT_PUBLIC_*` | saat `docker compose` dijalankan (dan saat build image web) |
| `/opt/prenatalks/api/.env` | Konfigurasi Laravel | saat container app/queue/scheduler start |

### 3.1 `.env` untuk Compose

```bash
cd /opt/prenatalks
cp .env.prod.example .env
nano .env
```

```dotenv
DB_DATABASE=prenatalks
DB_USERNAME=prenatalks
DB_PASSWORD=GANTI_PASSWORD_KUAT_DI_SINI

WEB_PORT=3003
API_PORT=8003
DB_PORT_HOST=5430

NEXT_PUBLIC_API_URL=https://api.prenatalks.id/api/v1
NEXT_PUBLIC_SITE_URL=https://prenatalks.id
AUTH_COOKIE_NAME=pt_refresh
```

> **Jangan pakai `$` di dalam nilai `.env` ini.** Compose menginterpolasi `$VAR` di berkasnya sendiri, jadi `DB_PASSWORD=pa$zT8w0rd` akan berubah diam-diam menjadi `pa` + string kosong + `w0rd`, dengan peringatan `WARN The "zT8" variable is not set. Defaulting to a blank string.` Akibatnya Postgres dibuat dengan password yang berbeda dari yang dibaca Laravel, dan koneksi selalu ditolak. Kalau tetap butuh `$`, tulis dobel (`pa$$zT8w0rd`) — Compose menerjemahkannya jadi satu `$`. `scripts/install.sh` membuat password tanpa `$` untuk alasan ini.

> `NEXT_PUBLIC_*` masuk sebagai **build arg** dan di-inline ke bundle Next.js. Mengubahnya berarti `docker compose build web` ulang — restart container tidak cukup. Nilai `NEXT_PUBLIC_API_URL` juga yang menentukan `images.remotePatterns` di `web/next.config.ts`; salah isi = semua gambar dari API ditolak `next/image`.

### 3.2 `api/.env` untuk Laravel

```bash
cp api/.env.example api/.env
nano api/.env
```

Yang **berubah dari `.env.example`** ditandai:

```dotenv
APP_NAME=PrenaTalks
APP_ENV=production                      # ← berubah
APP_KEY=                                # ← diisi di langkah 5
APP_DEBUG=false                         # ← berubah (WAJIB false di produksi)
APP_URL=https://api.prenatalks.id       # ← berubah

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US
APP_MAINTENANCE_DRIVER=file

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=stderr                        # ← berubah (log ke `docker compose logs`)
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=warning                       # ← berubah

DB_CONNECTION=pgsql
DB_HOST=db                              # ← nama service compose, bukan 127.0.0.1
DB_PORT=5432                            # ← port DALAM jaringan docker (bukan 5430)
DB_DATABASE=prenatalks
DB_USERNAME=prenatalks
DB_PASSWORD=GANTI_PASSWORD_KUAT_DI_SINI # ← harus SAMA dengan DB_PASSWORD di /opt/prenatalks/.env

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
CACHE_STORE=database

# --- SMTP: WAJIB diisi. Kalau tidak, email verifikasi & reset password
#     hanya masuk log dan pengguna tidak pernah menerimanya ---
MAIL_MAILER=smtp                        # ← berubah
MAIL_HOST=smtp.provider-anda.com        # ← berubah
MAIL_PORT=587                           # ← berubah
MAIL_SCHEME=tls                         # ← berubah
MAIL_USERNAME=xxxxx                     # ← berubah
MAIL_PASSWORD=xxxxx                     # ← berubah
MAIL_FROM_ADDRESS="noreply@prenatalks.id"   # ← berubah
MAIL_FROM_NAME="${APP_NAME}"

FRONTEND_URL=https://prenatalks.id      # ← berubah

JWT_SECRET=                             # ← diisi di langkah 5
JWT_TTL=60
JWT_REFRESH_TTL=20160
```

Tiga hal yang paling sering salah, dan semuanya gagal **tanpa pesan error**:

- **`DB_HOST=db` dan `DB_PORT=5432`** — `5430` itu port di sisi *host*; dari dalam container, Postgres tetap di `db:5432`.
- **`FRONTEND_URL`** — dipakai `VerifyEmailNotification` & `ResetPasswordNotification` untuk membangun tautan. Kalau masih `http://localhost:3000`, email terkirim tapi tautannya mati.
- **`APP_URL`** — dasar signed URL verifikasi email **dan** `Storage::disk('public')->url()` (cover artikel, thumbnail video, foto tim). Kalau bukan `https://api.prenatalks.id`, gambar 404 dan `next/image` menolaknya.

```bash
chmod 640 api/.env
sudo chown 1000:1000 api/.env
```

`chown 1000:1000` **bukan hiasan.** Container PHP jalan sebagai user `laravel` (uid 1000), bukan root. Kalau `api/.env` milik `root` dengan mode `640`, uid 1000 tidak bisa membacanya, dan Laravel jalan tanpa env sama sekali — gejalanya sama persis dengan `.env` yang tidak ada. Sejak entrypoint diperketat, container berhenti dengan `FATAL: ... tidak bisa dibaca oleh user laravel (uid 1000)` daripada menyala dengan konfigurasi kosong.

---

## 4. Build & jalankan sisi API

Sisi API dulu, **tanpa** service `web` — image web baru dibangun di langkah 8, setelah API bisa diakses lewat HTTPS.

```bash
cd /opt/prenatalks
docker compose -f docker-compose.prod.yml build app nginx
docker compose -f docker-compose.prod.yml up -d db app
docker compose -f docker-compose.prod.yml up -d queue scheduler nginx
docker compose -f docker-compose.prod.yml ps
```

> `app` sengaja dinyalakan sendirian dulu. Ia yang mengisi volume `api_storage` dengan struktur `storage/app` dari image; kalau `app`, `queue`, dan `scheduler` dibuat serentak di atas volume yang masih kosong, ketiganya berebut menyalin isi awal dan Docker menggagalkan salah satunya dengan `failed to mkdir .../private/exports: file exists`. Setelah volume terisi, urutan tidak lagi penting.

Yang naik: `prenatalks_db` (`127.0.0.1:5430`), `prenatalks_app` (PHP-FPM), `prenatalks_queue`, `prenatalks_scheduler`, `prenatalks_nginx` (`127.0.0.1:8003`).

Beda penting dari `docker-compose.yml` pengembangan:

- Kode **di-bake ke image**, bukan bind mount — deploy berarti build image baru.
- `opcache.validate_timestamps=0`: PHP tidak pernah mengecek ulang berkas, jadi container **harus dibuat ulang** tiap deploy (sudah masuk skrip di langkah 12).
- `storage/app` ada di volume `api_storage` yang dibagi ke app/queue/nginx. **Tanpa volume ini semua unggahan hilang setiap build ulang**, dan berkas ekspor yang ditulis container `queue` tidak akan bisa diunduh lewat container `app`.
- Kredensial Postgres datang dari `.env`, bukan hardcode `prenatalks/prenatalks`.

Cek dari host (belum lewat domain) — `database` harus `connected`:

```bash
curl -s http://127.0.0.1:8003/api/v1/health
# {"success":true,"message":"PrenaTalks API menyala","data":{"app":"PrenaTalks","database":"connected"}}
```

---

## 5. Inisialisasi aplikasi

Semua perintah artisan dijalankan di container `app`.

```bash
cd /opt/prenatalks
C="docker compose -f docker-compose.prod.yml exec app"
```

### 5.1 Kunci aplikasi & JWT

`APP_KEY` dan `JWT_SECRET` menulis ke `api/.env` — bind mount-nya read-only, jadi generate nilainya lalu tempel manual:

```bash
$C php artisan key:generate --show     # salin hasilnya ke APP_KEY= di api/.env
$C php artisan jwt:secret --show       # salin hasilnya ke JWT_SECRET= di api/.env
nano api/.env
docker compose -f docker-compose.prod.yml restart app queue scheduler
```

Keduanya **wajib unik untuk produksi** — jangan menyalin dari mesin lokal.

### 5.2 Migrasi & seed

```bash
$C php artisan migrate --force

# Seeder dipanggil satu per satu — JANGAN `php artisan db:seed --force`
$C php artisan db:seed --force --class=QuestionnaireSeeder
$C php artisan db:seed --force --class=CategorySeeder
$C php artisan db:seed --force --class=ChecklistItemSeeder
$C php artisan db:seed --force --class=SettingSeeder
```

Seeder ini mengisi kuesioner risiko, kategori, item checklist, dan setting situs — **wajib dijalankan sekali**, karena halaman publik (Tentang, Komunitas, FAQ) membaca tabel setting.

> **Kenapa tidak `db:seed` polos.** `DatabaseSeeder` diawali `User::factory()->create(...)` untuk user uji `test@example.com`, dan factory memanggil `fake()` dari `fakerphp/faker` — paket **dev**, yang tidak ikut di image produksi (`--no-dev`). Perintahnya mati dengan `Call to undefined function Database\Factories\fake()` **sebelum** keempat seeder di atas jalan, jadi database tampak "sudah di-seed" padahal kosong dan halaman publik ikut kosong. Memanggil per kelas seperti di atas sekaligus menghilangkan user uji, jadi tidak ada yang perlu dihapus belakangan.

Verifikasi isinya:

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U prenatalks -d prenatalks -tAc \
  "select 'settings='||count(*) from settings union all select 'checklist_items='||count(*) from checklist_items;"
# settings=13
# checklist_items=32
```

### 5.3 Akun super admin

```bash
$C php artisan tinker
```
```php
$u = new App\Models\User;
$u->name = 'Admin PrenaTalks';
$u->email = 'admin@prenatalks.id';
$u->password_hash = 'PASSWORD_KUAT';   // cast `hashed` meng-hash otomatis
$u->role = 'super_admin';
$u->is_active = true;
$u->email_verified_at = now();
$u->save();
```

Perhatikan bentuknya: kolom passwordnya `password_hash` (bukan `password`), dan `role` **tidak** ada di `#[Fillable]` — `User::create([... 'role' => 'super_admin'])` akan diam-diam membuang `role` dan menghasilkan akun biasa yang tidak bisa masuk panel admin.

### 5.4 Storage

Tidak perlu `storage:link`: `docker/nginx/prod.conf` menyajikan `/storage/` langsung dari `alias /var/www/html/storage/app/public/`, jadi tidak bergantung pada symlink.

---

## 6. Nginx host

Nginx host sudah melayani stack lain — tinggal menambah dua vhost.

### 6.1 `api.prenatalks.id`

```bash
sudo nano /etc/nginx/sites-available/api.prenatalks.id
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.prenatalks.id;

    access_log /var/log/nginx/api.prenatalks.id.access.log;
    error_log  /var/log/nginx/api.prenatalks.id.error.log;

    client_max_body_size 20m;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:8003;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host  $host;
        proxy_read_timeout 120s;
    }
}
```

**`X-Forwarded-Proto` wajib.** Ada dua hop proxy sebelum PHP (Nginx host → Nginx container → PHP-FPM), jadi tanpa header ini Laravel mengira skemanya `http`; signed URL verifikasi email diperiksa terhadap URL request penuh, dan tanda tangannya tidak akan pernah cocok. Sisi Laravel-nya sudah disiapkan: `api/bootstrap/app.php` memanggil `$middleware->trustProxies(at: '*')` — aman karena satu-satunya jalan masuk ke container adalah Nginx host (port container hanya di-bind ke `127.0.0.1`).

### 6.2 `prenatalks.id`

```bash
sudo nano /etc/nginx/sites-available/prenatalks.id
```

```nginx
# www → apex
server {
    listen 80;
    listen [::]:80;
    server_name www.prenatalks.id;
    return 301 https://prenatalks.id$request_uri;
}

server {
    listen 80;
    listen [::]:80;
    server_name prenatalks.id;

    access_log /var/log/nginx/prenatalks.id.access.log;
    error_log  /var/log/nginx/prenatalks.id.error.log;

    client_max_body_size 20m;

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    # Aset build Next.js — hash di nama berkas, aman di-cache selamanya
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3003;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        'upgrade';
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
```

### 6.3 Aktifkan

```bash
sudo ln -s /etc/nginx/sites-available/api.prenatalks.id /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/prenatalks.id /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

curl -s http://api.prenatalks.id/api/v1/health
```

`http://prenatalks.id` masih akan menjawab **502** di titik ini — container `web` memang belum dibangun (langkah 8). Yang penting sekarang endpoint API sudah tembus lewat domain, karena itulah syarat build web.

---

## 7. SSL

```bash
sudo certbot --nginx \
  -d prenatalks.id -d www.prenatalks.id -d api.prenatalks.id \
  --agree-tos -m admin@prenatalks.id --redirect
```

Certbot menambahkan blok `listen 443 ssl` dan redirect 80→443 ke kedua vhost. Verifikasi perpanjangan otomatis:

```bash
sudo certbot renew --dry-run
```

Setelah HTTPS aktif, tambahkan HSTS di blok `server` port 443 milik `prenatalks.id`:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

lalu `sudo nginx -t && sudo systemctl reload nginx`.

---

## 8. Build & jalankan web

Sekarang API sudah hidup di `https://api.prenatalks.id`, jadi image web bisa dibangun.

```bash
cd /opt/prenatalks
curl -s https://api.prenatalks.id/api/v1/health     # WAJIB sukses sebelum lanjut

docker compose -f docker-compose.prod.yml build web
docker compose -f docker-compose.prod.yml up -d web
curl -sI http://127.0.0.1:3003
```

**Kenapa terakhir.** Halaman publik memakai Server Component + ISR (`web/lib/api-server.ts`), dan `next build` mem-prerender-nya dengan benar-benar memanggil `${NEXT_PUBLIC_API_URL}`. Kalau API belum bisa dijangkau, build berhenti dengan:

```
Error occurred prerendering page "/faq"
TypeError: fetch failed  ...  ERR_TLS_CERT_ALTNAME_INVALID / ECONNREFUSED
```

Konsekuensi lain yang perlu diingat: **API harus dalam keadaan melayani normal setiap kali image web dibangun.** Kalau saat build API sedang `artisan down` (503), build tetap sukses tetapi halaman publik ter-prerender **kosong** — itu sebabnya `deploy.sh` di langkah 12 tidak memakai maintenance mode sebelum build.

Kalau domain belum dipakai (misalnya ingin uji dulu tanpa DNS), build boleh diarahkan ke API lokal:

```bash
NEXT_PUBLIC_API_URL=http://<IP_INTERNAL_VPS>:8003/api/v1 \
NEXT_PUBLIC_SITE_URL=https://prenatalks.id \
docker compose -f docker-compose.prod.yml build web
```

tapi **jangan dipakai untuk produksi** — nilai itu ikut ter-inline ke bundle browser dan akan dipanggil dari komputer pengunjung.

---

## 9. Backup & log

### 9.1 Backup database

Sudah tersedia sebagai `scripts/backup.sh` (dump DB + arsip volume unggahan + retensi 14 hari):

```bash
sudo mkdir -p /var/backups/prenatalks
/opt/prenatalks/scripts/backup.sh          # uji sekali secara manual
crontab -e
```

```cron
30 2 * * * /opt/prenatalks/scripts/backup.sh >> /var/log/prenatalks-backup.log 2>&1
```

Isinya, kalau ingin membuat sendiri:

```bash
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%F-%H%M)
cd /opt/prenatalks
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U prenatalks prenatalks | gzip > "/var/backups/prenatalks/db-$STAMP.sql.gz"

# Berkas unggahan TIDAK ada di dump SQL — ikut dicadangkan dari volume.
docker run --rm -v prenatalks-prod_api_storage:/data -v /var/backups/prenatalks:/backup alpine \
  tar czf "/backup/storage-$STAMP.tar.gz" -C /data .

find /var/backups/prenatalks -name '*.gz' -mtime +14 -delete
```

```bash
chmod 700 ~/backup-prenatalks.sh
crontab -e
```

```cron
30 2 * * * /root/backup-prenatalks.sh >> /var/log/prenatalks-backup.log 2>&1
```

Backup di disk yang sama hanya melindungi dari kesalahan operasional, bukan dari kehilangan VPS — salin ke object storage terpisah kalau datanya sudah bernilai.

### 9.2 Log

`LOG_STACK=stderr` membuat log Laravel keluar ke Docker, jadi tidak ada berkas yang membengkak di dalam container:

```bash
docker compose -f docker-compose.prod.yml logs -f app queue
```

Batasi ukurannya di level daemon (berlaku untuk semua stack di VPS ini):

```bash
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "5" }
}
```

```bash
sudo systemctl restart docker    # container semua stack akan restart — pilih waktu sepi
```

---

## 10. Pengerasan

- [ ] `APP_DEBUG=false` & `APP_ENV=production` di `api/.env`, container sudah dibuat ulang setelahnya
- [ ] `APP_KEY` dan `JWT_SECRET` unik untuk produksi
- [ ] `api/.env` mode `640`, `/opt/prenatalks/.env` mode `600`, keduanya tidak masuk git
- [ ] Password DB kuat — **bukan** default `prenatalks/prenatalks` dari compose pengembangan
- [ ] Ketiga port hanya di loopback: `ss -tlnp | grep -E '3003|8003|5430'` → semuanya `127.0.0.1`
- [ ] Tidak ada user uji `test@example.com` (tidak ikut ter-seed kalau langkah 5.2 diikuti)
- [ ] `sudo ufw status` → hanya 22, 80, 443 terbuka
- [ ] SMTP sudah diuji sungguhan (langkah 11), bukan `MAIL_MAILER=log`
- [ ] SPF/DKIM domain pengirim sudah diset supaya email verifikasi tidak masuk spam

> Docker menulis aturan iptables sendiri dan **bisa melewati ufw** kalau port di-publish ke `0.0.0.0`. Di `docker-compose.prod.yml` semua `ports` sudah diawali `127.0.0.1:` — jangan menghapus prefiks itu.

---

## 11. Smoke test

```bash
curl -s https://api.prenatalks.id/api/v1/health
curl -s https://api.prenatalks.id/api/v1/tidak-ada | head      # bentuk error standar PRD §11.1
curl -sI https://prenatalks.id
curl -sI http://www.prenatalks.id | grep -i location

curl -s -I -X OPTIONS https://api.prenatalks.id/api/v1/articles \
  -H "Origin: https://prenatalks.id" \
  -H "Access-Control-Request-Method: GET" | grep -i access-control
```

Lalu lewat browser, telusuri alur yang menyentuh semua bagian bergerak:

1. Buka `https://prenatalks.id` — landing, artikel, video, FAQ tampil dan **gambar cover muncul** (membuktikan `APP_URL` + volume storage + `remotePatterns` benar).
2. Daftar akun baru → email verifikasi masuk (membuktikan SMTP + container `queue`), klik tautannya → mendarat di `prenatalks.id/verifikasi-email/...` dan sukses (membuktikan `FRONTEND_URL` + `X-Forwarded-Proto` + trustProxies).
3. Masuk → DevTools → Application → Cookies: `pt_refresh` harus **HttpOnly** dan **Secure**.
4. Isi checklist risiko → simpan → unduh PDF hasil (membuktikan dompdf + gd).
5. Masuk sebagai admin → unggah cover artikel (membuktikan batas unggah Nginx host + container + PHP) → ekspor submission CSV/XLSX, lalu **unduh hasilnya** (membuktikan volume `api_storage` benar-benar dibagi antara `queue` dan `app`).
6. Muat ulang halaman terproteksi setelah beberapa menit — sesi bertahan lewat rotasi refresh token.

Pantau saat menguji:

```bash
cd /opt/prenatalks
docker compose -f docker-compose.prod.yml logs -f app queue web
sudo tail -f /var/log/nginx/api.prenatalks.id.error.log
```

---

## 12. Redeploy

Sudah tersedia sebagai `scripts/deploy.sh` — jalankan `./scripts/deploy.sh` (atau `--no-pull` untuk memakai kode yang sudah ada). Isinya:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /opt/prenatalks

COMPOSE="docker compose -f docker-compose.prod.yml"

git pull origin main

# Build lebih dulu, SELAGI API versi lama masih melayani: `next build`
# mem-prerender halaman publik dari API yang hidup. Kalau API dimatikan atau
# ditaruh di maintenance mode sebelum build, halaman ter-prerender kosong.
$COMPOSE build

$COMPOSE up -d --force-recreate db app queue scheduler nginx web
$COMPOSE exec -T app php artisan migrate --force

docker image prune -f
echo "Deploy selesai: $(git rev-parse --short HEAD)"
```

Downtime-nya beberapa detik saat container diganti — tidak ada `artisan down` karena flag maintenance disimpan di dalam container dan hilang begitu container dibuat ulang, jadi ia hanya menambah risiko halaman kosong tanpa manfaat. Kalau ada migrasi yang merusak kompatibilitas dengan kode lama, jalankan migrasinya manual di jendela sepi, bukan lewat skrip ini.

Tiga hal yang wajib diingat di jalur Docker ini:

- **`--force-recreate` bukan `restart`.** `opcache.validate_timestamps=0` berarti PHP memegang kode lama sampai container-nya benar-benar diganti.
- **Container `queue` ikut dibuat ulang.** Worker adalah proses PHP berumur panjang; perbaikan pada job atau notifikasi tidak berlaku sampai ia di-restart.
- **Ubah `NEXT_PUBLIC_*` → `docker compose build web`.** Nilainya di-inline saat build; `up -d` saja tidak mengubah apa pun.
- **Konten publik yang berubah tidak butuh deploy.** Halaman publik memakai ISR (`revalidate` 300 detik), jadi artikel/FAQ/video baru muncul sendiri dalam ~5 menit tanpa build ulang.

---

## Troubleshooting

| Gejala | Penyebab paling mungkin | Perbaikan |
|---|---|---|
| `SQLSTATE[08006] connection refused` saat migrasi | `DB_HOST` masih `127.0.0.1`, atau `DB_PORT=5430` | Dari dalam container: `DB_HOST=db`, `DB_PORT=5432` |
| Postgres menolak login | `DB_PASSWORD` di `api/.env` ≠ di `/opt/prenatalks/.env` | Samakan; kalau volume DB sudah terlanjur dibuat dengan password lama, ganti lewat `ALTER USER` di `psql` |
| Email verifikasi tidak pernah datang | Container `queue` mati, atau `MAIL_MAILER` masih `log` | `docker compose -f docker-compose.prod.yml ps queue`; cek tabel `jobs`/`failed_jobs`; `php artisan queue:failed` |
| Tautan verifikasi selalu "tidak valid" | `X-Forwarded-Proto` tidak diteruskan Nginx host, atau `APP_URL` salah | Cek `proxy_set_header X-Forwarded-Proto $scheme;` ada di vhost API; `APP_URL=https://api.prenatalks.id` |
| Tautan email mengarah ke `localhost:3000` | `FRONTEND_URL` belum diubah | Perbaiki `api/.env` → `up -d --force-recreate app queue` |
| Perubahan `api/.env` tidak berpengaruh | Config ter-cache saat container start | Buat ulang container (`--force-recreate`), bukan sekadar `restart` |
| Container `app` restart terus, log: `FATAL: ... tidak bisa dibaca oleh user laravel (uid 1000)` (atau `grep: /var/www/html/.env: Permission denied`) | `api/.env` milik root, container jalan sebagai uid 1000 | `sudo chown 1000:1000 api/.env && sudo chmod 640 api/.env`, lalu `up -d --force-recreate` |
| `WARN The "xxx" variable is not set. Defaulting to a blank string.` saat perintah compose | Ada `$` telanjang di nilai `/opt/prenatalks/.env` — Compose menginterpolasinya | Tulis `$$` untuk setiap `$`, atau pakai nilai tanpa `$`. Kalau password DB terlanjur salah: `down -v` (kalau data masih kosong) lalu pasang ulang, atau `ALTER USER` di `psql` agar cocok dengan `api/.env` |
| `/api/v1/health` menjawab `{"app":"Laravel","database":"unavailable"}` | `.env` tidak terbaca di dalam container — hampir selalu karena `api/.env` belum ada saat `up` pertama, sehingga Docker membuatkan **direktori** kosong di jalur itu | Lihat kotak di bawah tabel |
| Perubahan `NEXT_PUBLIC_*` tidak berpengaruh | Di-inline saat build image | `docker compose -f docker-compose.prod.yml build web && up -d web` |
| Gambar cover 404 setelah deploy | Volume `api_storage` terlepas/terhapus | `docker volume ls \| grep prenatalks-prod`; pulihkan dari backup `storage-*.tar.gz` |
| Ekspor submission "siap" tapi unduhannya 404 | Volume `api_storage` tidak dibagi ke container `app` | Pastikan `app` dan `queue` sama-sama mount `api_storage` di `/var/www/html/storage/app` |
| 502 di `prenatalks.id` | Container `web` mati atau port host salah | `docker compose ... ps web`; `curl -I 127.0.0.1:3003` |
| 502 di `api.prenatalks.id` | Container `nginx` mati atau `app` belum siap | `curl -I 127.0.0.1:8003`; `docker compose ... logs nginx app` |
| Port sudah dipakai saat `up -d` | Bentrok dengan stack lain di VPS | `ss -tlnp \| grep <port>`; ganti `WEB_PORT`/`API_PORT`/`DB_PORT_HOST` di `.env` |
| 413 Request Entity Too Large saat unggah | `client_max_body_size` di Nginx host | Sudah 20m di langkah 6.1 — pastikan Nginx host sudah di-reload |
| 500 tanpa detail | `APP_DEBUG=false` (benar) menyembunyikan pesan | `docker compose -f docker-compose.prod.yml logs app` |
| `next build` terbunuh (exit 137) saat build image | Docker kehabisan memori | Aktifkan swap di VPS, atau build image di mesin lain lalu `docker save`/`load` |
| Build web gagal: `Error occurred prerendering page "/faq"`, `TypeError: fetch failed` | API belum hidup/ tidak bisa dijangkau di `NEXT_PUBLIC_API_URL` saat build | Pastikan `curl https://api.prenatalks.id/api/v1/health` sukses **dari VPS**, baru `build web` (langkah 8) |
| Halaman publik ter-deploy dalam keadaan kosong padahal datanya ada | Image web dibangun saat API 503/maintenance | Build ulang `web` selagi API melayani normal |
| Build web gagal: `Cannot find module '../lightningcss.linux-*.node'` | `web/package-lock.json` dibuat di macOS dan hanya memuat binary darwin | Sudah ditangani `docker/web/Dockerfile` (salin `package.json` saja lalu `npm install`) — jangan mengubahnya jadi `npm ci` sebelum lockfile diregenerasi di Linux |
| `db:seed` mati: `Call to undefined function Database\Factories\fake()` | `DatabaseSeeder` memakai factory (butuh `fakerphp/faker`, paket dev) | Jalankan seeder per kelas seperti di langkah 5.2 |

### `{"app":"Laravel","database":"unavailable"}`

Dua tanda dalam satu respons, dan keduanya berasal dari sebab yang sama: **container jalan tanpa `.env`**. `app` jatuh ke nilai bawaan `config/app.php` (`Laravel`, bukan `PrenaTalks`) dan `DB_HOST` jatuh ke `127.0.0.1` — yang di dalam container berarti container itu sendiri, bukan service `db`.

Penyebab tersering: `docker compose up` dijalankan **sebelum** `api/.env` dibuat. Bind mount `./api/.env:/var/www/html/.env` menunjuk berkas yang belum ada, dan Docker menyelesaikannya dengan membuatkan **direktori kosong** bernama `api/.env` di host, lalu me-mount direktori itu.

Periksa:

```bash
ls -ld /opt/prenatalks/api/.env        # kalau diawali 'd', itu direktori — inilah masalahnya
docker compose -f docker-compose.prod.yml exec app ls -la /var/www/html/.env
```

Perbaiki:

```bash
cd /opt/prenatalks
docker compose -f docker-compose.prod.yml down
rmdir api/.env                                   # buang direktori palsunya
cp api/.env.example api/.env && nano api/.env    # isi sesuai langkah 3.2
docker compose -f docker-compose.prod.yml up -d --force-recreate
curl -s http://127.0.0.1:8003/api/v1/health      # harus PrenaTalks + connected
```

Kalau `api/.env` ternyata **sudah** berupa berkas yang benar, sebabnya yang kedua: container start lebih dulu dan meng-cache config lama. `restart` tidak cukup — pakai `up -d --force-recreate app queue scheduler`.

> Sejak `docker/php/entrypoint.sh` diperketat, kasus ini tidak lagi senyap: container berhenti dengan pesan `FATAL: /var/www/html/.env adalah DIREKTORI` di `docker compose logs app`, bukan menyala dengan konfigurasi kosong.

---

---

## Lampiran A — perbedaan dengan `docker-compose.yml`

`docker-compose.yml` di root adalah setup **pengembangan** dan tidak boleh dipakai di VPS:

| | Pengembangan | Produksi (`docker-compose.prod.yml`) |
|---|---|---|
| Kode | bind mount `./api` | di-bake ke image |
| Vendor | dev-dependency ikut | `--no-dev --optimize-autoloader` |
| Opcache | mati | menyala, `validate_timestamps=0` |
| Port | `8000:80`, `5432:5432` (semua antarmuka) | `127.0.0.1:8003`, `127.0.0.1:5430` |
| Kredensial DB | hardcode `prenatalks/prenatalks` | dari `.env` |
| Web | dijalankan manual `npm run dev` | container standalone Next.js |
| Scheduler | tidak ada | service `scheduler` |
| Storage | ikut folder kerja | volume `api_storage` |

Nama project Compose-nya juga sengaja dibedakan — pengembangan memakai nama folder (`prenatalks`), produksi memakai `prenatalks-prod`. Kalau sama, menjalankan yang satu di mesin yang juga memakai yang lain akan me-**recreate** container milik tetangganya dan memperebutkan volume dengan nama yang sama. Konsekuensinya volume produksi bernama `prenatalks-prod_postgres_data` dan `prenatalks-prod_api_storage`.

## Lampiran B — kalau ingin jalur native (tanpa Docker)

Alternatifnya adalah Nginx + PM2 + PHP-FPM langsung di host (sesuai PRD §Deployment). Di VPS ini jalur Docker lebih cocok karena stack lain sudah memakai pola yang sama, tapi kalau tetap ingin native, yang berubah:

- Pasang `php8.4-fpm` + ekstensi (`pdo_pgsql`, `gd`, `zip`, `intl`, `bcmath`, `mbstring`, `xml`), Composer, Node 22, PM2, PostgreSQL di host.
- `api/.env`: `DB_HOST=127.0.0.1`, `DB_PORT=5432` (atau port instance yang dipakai).
- Vhost API memakai `fastcgi_pass unix:/run/php/php8.4-fpm.sock` — bukan `proxy_pass`. Tanpa hop proxy, `trustProxies` tidak diperlukan (tapi tidak berbahaya).
- `php artisan storage:link` **wajib**, karena `/storage/` disajikan lewat symlink di `api/public`.
- Queue worker jadi unit systemd `queue:work --queue=emails,default`, scheduler jadi entri cron `* * * * * php artisan schedule:run`.
- Setiap deploy: `composer install`, `npm run build`, `config:cache`, reload `php8.4-fpm`, restart worker, `pm2 reload`.
