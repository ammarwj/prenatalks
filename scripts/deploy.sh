#!/usr/bin/env bash
#
# deploy.sh — menaikkan versi terbaru ke produksi.
#
#   ./scripts/deploy.sh            # git pull + build + recreate + migrate
#   ./scripts/deploy.sh --no-pull  # pakai kode yang sudah ada di direktori
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker-compose.prod.yml"
ENV_FILE="$ROOT/.env"
PULL=1

[ "${1:-}" = "--no-pull" ] && PULL=0

compose() { docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"; }

[ -f "$ENV_FILE" ]     || { echo "GAGAL: $ENV_FILE tidak ada — jalankan scripts/install.sh dulu." >&2; exit 1; }
[ -f "$ROOT/api/.env" ] || { echo "GAGAL: $ROOT/api/.env tidak ada (atau berupa direktori) — lihat DEPLOYMENT.md §Troubleshooting." >&2; exit 1; }

cd "$ROOT"

if [ "$PULL" = "1" ]; then
    echo "==> git pull"
    git pull --ff-only origin main
fi

# Build lebih dulu, SELAGI API versi lama masih melayani: `next build`
# mem-prerender halaman publik dari API yang hidup. Kalau API dimatikan atau
# ditaruh di maintenance mode sebelum build, halaman ter-prerender kosong.
echo "==> build image"
compose build

echo "==> menjalankan container baru"
# app lebih dulu (lihat catatan volume api_storage di scripts/install.sh),
# baru sisanya.
compose up -d --force-recreate db app
compose up -d --force-recreate queue scheduler nginx web

API_PORT="$(grep '^API_PORT=' "$ENV_FILE" | cut -d= -f2-)"
echo "==> menunggu API sehat"
for _ in $(seq 1 30); do
    curl -fs -m 5 "http://127.0.0.1:${API_PORT:-8003}/api/v1/health" >/dev/null 2>&1 && break
    sleep 2
done

echo "==> migrasi"
compose exec -T app php artisan migrate --force

echo "==> pembersihan image lama"
docker image prune -f >/dev/null

echo
echo "Deploy selesai: $(git rev-parse --short HEAD)"
curl -s "http://127.0.0.1:${API_PORT:-8003}/api/v1/health"; echo
compose ps
