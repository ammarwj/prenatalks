#!/bin/sh
set -e

# .env di-mount saat runtime, jadi cache config baru boleh dibangun di sini —
# bukan saat build image. Semua target ada di bootstrap/cache milik container
# masing-masing, jadi app/queue/scheduler tidak saling menimpa.
if [ -f /var/www/html/.env ]; then
    php artisan package:discover --quiet || true
    php artisan config:cache
    php artisan route:cache
    php artisan event:cache
    php artisan view:cache
fi

exec "$@"
