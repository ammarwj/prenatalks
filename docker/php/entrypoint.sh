#!/bin/sh
set -e

APP_ENV_FILE=/var/www/html/.env

# Mount .env yang salah adalah kegagalan paling senyap di setup ini: kalau
# ./api/.env belum ada saat `docker compose up`, Docker membuatkan DIREKTORI
# kosong di jalur itu dan me-mount-nya. Laravel lalu jalan tanpa env sama
# sekali — APP_NAME jadi "Laravel", DB_HOST jatuh ke default 127.0.0.1, dan
# /api/v1/health menjawab {"app":"Laravel","database":"unavailable"} tanpa
# satu pun pesan error. Lebih baik mati keras di sini.
if [ ! -f "$APP_ENV_FILE" ]; then
    if [ -d "$APP_ENV_FILE" ]; then
        echo "FATAL: $APP_ENV_FILE adalah DIREKTORI, bukan berkas." >&2
        echo "       Docker membuatnya otomatis karena ./api/.env belum ada saat container dinyalakan." >&2
        echo "       Perbaiki di host:" >&2
        echo "         docker compose -f docker-compose.prod.yml down" >&2
        echo "         rmdir api/.env  &&  cp api/.env.example api/.env  &&  nano api/.env" >&2
        echo "         docker compose -f docker-compose.prod.yml up -d --force-recreate" >&2
    else
        echo "FATAL: $APP_ENV_FILE tidak ada. Buat ./api/.env di host lalu jalankan ulang." >&2
    fi
    exit 1
fi

if ! grep -q '^APP_KEY=base64:' "$APP_ENV_FILE"; then
    echo "FATAL: APP_KEY di .env kosong/tidak valid. Isi dengan hasil 'php artisan key:generate --show'." >&2
    exit 1
fi

# .env di-mount saat runtime, jadi cache config baru boleh dibangun di sini —
# bukan saat build image. Semua target ada di bootstrap/cache milik container
# masing-masing, jadi app/queue/scheduler tidak saling menimpa.
php artisan package:discover --quiet || true
php artisan config:cache
php artisan route:cache
php artisan event:cache
php artisan view:cache

exec "$@"
