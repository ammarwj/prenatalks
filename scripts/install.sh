#!/usr/bin/env bash
#
# install.sh — pemasangan produksi PrenaTalks di satu VPS (Docker).
#
# Menjalankan langkah 3–8 DEPLOYMENT.md secara otomatis:
#   env → build API → migrasi & seed → akun admin → vhost Nginx host → SSL → build web
#
# Aman dijalankan ulang: berkas .env yang sudah ada tidak ditimpa tanpa izin,
# seeder tidak dijalankan dua kali, dan vhost yang sudah ada dibiarkan.
#
#   sudo ./scripts/install.sh                    # interaktif (disarankan)
#   sudo ./scripts/install.sh --yes              # pakai semua nilai bawaan
#   ./scripts/install.sh --help
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker-compose.prod.yml"
ENV_FILE="$ROOT/.env"
API_ENV_FILE="$ROOT/api/.env"

# ---------------------------------------------------------------- tampilan --
if [ -t 1 ]; then
    B=$'\033[1m'; R=$'\033[0m'; RED=$'\033[31m'; GRN=$'\033[32m'; YLW=$'\033[33m'; BLU=$'\033[34m'
else
    B=""; R=""; RED=""; GRN=""; YLW=""; BLU=""
fi
step()  { printf '\n%s==> %s%s\n' "$B$BLU" "$*" "$R"; }
info()  { printf '    %s\n' "$*"; }
ok()    { printf '    %s✓%s %s\n' "$GRN" "$R" "$*"; }
warn()  { printf '    %s!%s %s\n' "$YLW" "$R" "$*"; }
die()   { printf '\n%sGAGAL:%s %s\n\n' "$RED$B" "$R" "$*" >&2; exit 1; }

# ------------------------------------------------------------------ pilihan --
DOMAIN="prenatalks.id"
API_DOMAIN=""
WEB_PORT=3003
API_PORT=8003
DB_PORT_HOST=5430
DB_DATABASE="prenatalks"
DB_USERNAME="prenatalks"
DB_PASSWORD=""
ADMIN_NAME="Admin PrenaTalks"
ADMIN_EMAIL=""
ADMIN_PASSWORD=""
ADMIN_PASSWORD_GENERATED=0
LE_EMAIL=""
MAIL_HOST=""
MAIL_PORT="587"
MAIL_SCHEME="tls"
MAIL_USERNAME=""
MAIL_PASSWORD=""
MAIL_FROM=""
ASSUME_YES=0
SKIP_NGINX=0
SKIP_SSL=0
SKIP_WEB=0

usage() {
    cat <<EOF
Pemasangan produksi PrenaTalks (Docker) — lihat DEPLOYMENT.md untuk penjelasan tiap langkah.

Pemakaian: ./scripts/install.sh [opsi]

  --domain <host>          Domain web            (bawaan: $DOMAIN)
  --api-domain <host>      Domain API            (bawaan: api.<domain>)
  --web-port <n>           Port host untuk web   (bawaan: $WEB_PORT)
  --api-port <n>           Port host untuk API   (bawaan: $API_PORT)
  --db-port <n>            Port host untuk DB    (bawaan: $DB_PORT_HOST)
  --db-password <str>      Password Postgres     (bawaan: dibuat acak)
  --admin-name <str>       Nama super admin      (bawaan: $ADMIN_NAME)
  --admin-email <email>    Email super admin     (bawaan: admin@<domain>)
  --admin-password <str>   Password super admin  (bawaan: dibuat acak)
  --le-email <email>       Email pendaftaran Let's Encrypt
  --smtp-host <host>       SMTP host   --smtp-port <n>      --smtp-scheme <tls|ssl>
  --smtp-user <str>        SMTP user   --smtp-pass <str>    --mail-from <email>
  --skip-nginx             Jangan menyentuh Nginx host
  --skip-ssl               Jangan menjalankan Certbot
  --skip-web               Jangan build/jalankan container web
  -y, --yes                Non-interaktif: pakai bawaan, jangan bertanya
  -h, --help               Tampilkan bantuan ini

Nilai yang tidak diberikan lewat opsi akan ditanyakan (kecuali dengan --yes).
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        --domain)          DOMAIN="$2"; shift 2 ;;
        --api-domain)      API_DOMAIN="$2"; shift 2 ;;
        --web-port)        WEB_PORT="$2"; shift 2 ;;
        --api-port)        API_PORT="$2"; shift 2 ;;
        --db-port)         DB_PORT_HOST="$2"; shift 2 ;;
        --db-password)     DB_PASSWORD="$2"; shift 2 ;;
        --admin-name)      ADMIN_NAME="$2"; shift 2 ;;
        --admin-email)     ADMIN_EMAIL="$2"; shift 2 ;;
        --admin-password)  ADMIN_PASSWORD="$2"; shift 2 ;;
        --le-email)        LE_EMAIL="$2"; shift 2 ;;
        --smtp-host)       MAIL_HOST="$2"; shift 2 ;;
        --smtp-port)       MAIL_PORT="$2"; shift 2 ;;
        --smtp-scheme)     MAIL_SCHEME="$2"; shift 2 ;;
        --smtp-user)       MAIL_USERNAME="$2"; shift 2 ;;
        --smtp-pass)       MAIL_PASSWORD="$2"; shift 2 ;;
        --mail-from)       MAIL_FROM="$2"; shift 2 ;;
        --skip-nginx)      SKIP_NGINX=1; shift ;;
        --skip-ssl)        SKIP_SSL=1; shift ;;
        --skip-web)        SKIP_WEB=1; shift ;;
        -y|--yes)          ASSUME_YES=1; shift ;;
        -h|--help)         usage; exit 0 ;;
        *)                 usage; die "Opsi tidak dikenal: $1" ;;
    esac
done

# ------------------------------------------------------------------ utilitas --
ask() {  # ask <variabel> <pertanyaan> <bawaan>
    local __var="$1" __q="$2" __def="${3:-}" __ans=""
    if [ "$ASSUME_YES" = "1" ] || [ ! -t 0 ]; then
        printf -v "$__var" '%s' "$__def"; return
    fi
    if [ -n "$__def" ]; then
        read -r -p "    $__q [$__def]: " __ans || true
    else
        read -r -p "    $__q: " __ans || true
    fi
    printf -v "$__var" '%s' "${__ans:-$__def}"
}

confirm() {  # confirm <pertanyaan> → 0 kalau ya
    [ "$ASSUME_YES" = "1" ] && return 0
    [ -t 0 ] || return 0
    local a=""
    read -r -p "    $1 [y/N]: " a || true
    [[ "$a" =~ ^[Yy] ]]
}

# Sengaja tanpa karakter non-alfanumerik: berkas .env dibaca Docker Compose,
# yang menginterpolasi $VAR di dalam nilainya. Password ber-'$' berubah diam-diam
# (WARN "The ... variable is not set. Defaulting to a blank string") sehingga
# Postgres dan Laravel memakai password yang berbeda.
rand_pass() { openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 20; }

# '$' harus ditulis '$$' di berkas .env milik Compose supaya sampai utuh.
esc_compose() { printf '%s' "${1//\$/\$\$}"; }
unesc_compose() { printf '%s' "${1//\$\$/\$}"; }

set_env() {  # set_env <KEY> <VALUE> <FILE>
    local k="$1" v="$2" f="$3"
    if grep -q "^${k}=" "$f" 2>/dev/null; then
        awk -v k="$k" -v v="$v" '$0 ~ "^"k"=" {print k"="v; next} {print}' "$f" > "$f.tmp"
        mv "$f.tmp" "$f"
    else
        printf '%s=%s\n' "$k" "$v" >> "$f"
    fi
}

compose() { docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"; }

port_busy() { ss -ltn 2>/dev/null | grep -qE "[.:]$1[[:space:]]"; }

SUDO=""
[ "$(id -u)" -ne 0 ] && SUDO="sudo"

# =============================================================== 1. prasyarat ==
step "1/8  Memeriksa prasyarat"

[ -f "$COMPOSE_FILE" ] || die "docker-compose.prod.yml tidak ditemukan. Jalankan skrip ini dari dalam repo."

for bin in docker curl openssl awk; do
    command -v "$bin" >/dev/null 2>&1 || die "'$bin' tidak terpasang."
done
docker compose version >/dev/null 2>&1 || die "Docker Compose v2 tidak tersedia ('docker compose version' gagal)."
docker info >/dev/null 2>&1 || die "Docker daemon tidak bisa dihubungi. Jalankan dengan sudo atau nyalakan Docker."
ok "docker $(docker version --format '{{.Server.Version}}' 2>/dev/null || echo '?') + compose v2"

if [ "$SKIP_NGINX" = "0" ]; then
    command -v nginx >/dev/null 2>&1 || die "nginx tidak terpasang di host. Pasang dulu, atau jalankan dengan --skip-nginx."
    ok "nginx host tersedia"
fi
if [ "$SKIP_SSL" = "0" ] && [ "$SKIP_NGINX" = "0" ]; then
    command -v certbot >/dev/null 2>&1 || { warn "certbot tidak ditemukan — langkah SSL dilewati."; SKIP_SSL=1; }
fi

case "$ROOT" in
    /opt/prenatalks) ok "lokasi kode: $ROOT" ;;
    *) warn "kode ada di $ROOT (DEPLOYMENT.md mengasumsikan /opt/prenatalks) — tidak masalah, hanya beda jalur." ;;
esac

# ================================================================ 2. masukan ==
step "2/8  Konfigurasi"

[ "$ASSUME_YES" = "0" ] && [ -t 0 ] && info "Tekan Enter untuk memakai nilai dalam kurung."

ask DOMAIN       "Domain web" "$DOMAIN"
ask API_DOMAIN   "Domain API" "${API_DOMAIN:-api.$DOMAIN}"
ask WEB_PORT     "Port host untuk web" "$WEB_PORT"
ask API_PORT     "Port host untuk API" "$API_PORT"
ask DB_PORT_HOST "Port host untuk PostgreSQL" "$DB_PORT_HOST"
ask ADMIN_EMAIL  "Email super admin" "${ADMIN_EMAIL:-admin@$DOMAIN}"
ask ADMIN_NAME   "Nama super admin" "$ADMIN_NAME"
ask LE_EMAIL     "Email untuk Let's Encrypt" "${LE_EMAIL:-$ADMIN_EMAIL}"

[ -z "$MAIL_HOST" ] && ask MAIL_HOST "SMTP host (kosongkan kalau belum ada — email verifikasi tidak akan terkirim)" ""
if [ -n "$MAIL_HOST" ]; then
    ask MAIL_PORT     "SMTP port" "$MAIL_PORT"
    ask MAIL_SCHEME   "SMTP scheme (tls/ssl)" "$MAIL_SCHEME"
    ask MAIL_USERNAME "SMTP username" "$MAIL_USERNAME"
    ask MAIL_PASSWORD "SMTP password" "$MAIL_PASSWORD"
    ask MAIL_FROM     "Alamat pengirim" "${MAIL_FROM:-noreply@$DOMAIN}"
fi

[ -n "$DB_PASSWORD" ]    || DB_PASSWORD="$(rand_pass)"
[ -n "$ADMIN_PASSWORD" ] || { ADMIN_PASSWORD="$(rand_pass)"; ADMIN_PASSWORD_GENERATED=1; }

WEB_URL="https://$DOMAIN"
API_URL="https://$API_DOMAIN"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-$API_URL/api/v1}"
NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-$WEB_URL}"

for p in "$WEB_PORT" "$API_PORT" "$DB_PORT_HOST"; do
    if port_busy "$p"; then
        warn "port $p sudah dipakai proses lain di host."
        confirm "Tetap lanjut?" || die "Ganti port lewat --web-port/--api-port/--db-port."
    fi
done

info ""
info "  web         $WEB_URL  →  127.0.0.1:$WEB_PORT"
info "  api         $API_URL  →  127.0.0.1:$API_PORT"
info "  postgres    127.0.0.1:$DB_PORT_HOST"
info "  admin       $ADMIN_EMAIL"
info "  smtp        ${MAIL_HOST:-(belum diisi)}"
info ""
confirm "Lanjutkan dengan konfigurasi di atas?" || die "Dibatalkan."

# ============================================================ 3. berkas .env ==
step "3/8  Menulis berkas environment"

# Kalau pernah ada `docker compose up` sebelum api/.env dibuat, Docker sudah
# membuatkan DIREKTORI kosong bernama api/.env dan me-mount-nya ke container.
# Laravel lalu jalan tanpa env: APP_NAME jadi "Laravel", DB_HOST jatuh ke
# 127.0.0.1, dan /api/v1/health menjawab database "unavailable".
for stray in "$ENV_FILE" "$API_ENV_FILE"; do
    if [ -d "$stray" ]; then
        warn "$stray berupa direktori (sisa mount Docker) — container dimatikan lalu direktori dihapus"
        compose down >/dev/null 2>&1 || true
        rmdir "$stray" 2>/dev/null || die "$stray adalah direktori tidak kosong; periksa manual."
    fi
done

write_compose_env=1
if [ -f "$ENV_FILE" ]; then
    if confirm "$ENV_FILE sudah ada — tulis ulang (cadangan dibuat)?"; then
        cp "$ENV_FILE" "$ENV_FILE.bak.$(date +%s)"
    else
        write_compose_env=0
        info "memakai $ENV_FILE yang ada"
    fi
fi

if [ "$write_compose_env" = "1" ]; then
    cat > "$ENV_FILE" <<EOF
# Variabel untuk docker-compose.prod.yml — dibuat oleh scripts/install.sh
# Ini BUKAN .env Laravel (yang itu ada di api/.env).

DB_DATABASE=$DB_DATABASE
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$(esc_compose "$DB_PASSWORD")

WEB_PORT=$WEB_PORT
API_PORT=$API_PORT
DB_PORT_HOST=$DB_PORT_HOST

# Dibaca saat BUILD image web — mengubahnya berarti build ulang
NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

AUTH_COOKIE_NAME=pt_refresh
EOF
    chmod 600 "$ENV_FILE"
    ok "$ENV_FILE"
fi

# langkah berikutnya harus memakai nilai dari berkas yang benar-benar dipakai
DB_PASSWORD="$(grep '^DB_PASSWORD=' "$ENV_FILE" | cut -d= -f2-)"
case "$DB_PASSWORD" in
    *'$$'*) DB_PASSWORD="$(unesc_compose "$DB_PASSWORD")" ;;
    *'$'*)
        warn "DB_PASSWORD di $ENV_FILE memuat '\$' yang tidak di-escape."
        warn "Compose akan menginterpolasinya ('The ... variable is not set') dan password jadi berbeda dengan yang dipakai Laravel."
        info "Perbaiki: tulis setiap \$ menjadi \$\$ di $ENV_FILE, atau pakai password tanpa \$."
        confirm "Tetap lanjut?" || die "Dibatalkan."
        ;;
esac
DB_USERNAME="$(grep '^DB_USERNAME=' "$ENV_FILE" | cut -d= -f2-)"
DB_DATABASE="$(grep '^DB_DATABASE=' "$ENV_FILE" | cut -d= -f2-)"
API_PORT="$(grep '^API_PORT=' "$ENV_FILE" | cut -d= -f2-)"
WEB_PORT="$(grep '^WEB_PORT=' "$ENV_FILE" | cut -d= -f2-)"

write_api_env=1
if [ -f "$API_ENV_FILE" ]; then
    if confirm "$API_ENV_FILE sudah ada — tulis ulang (cadangan dibuat)?"; then
        cp "$API_ENV_FILE" "$API_ENV_FILE.bak.$(date +%s)"
    else
        write_api_env=0
        info "memakai $API_ENV_FILE yang ada"
    fi
fi

if [ "$write_api_env" = "1" ]; then
    cp "$ROOT/api/.env.example" "$API_ENV_FILE"

    set_env APP_NAME      "PrenaTalks"        "$API_ENV_FILE"
    set_env APP_ENV       "production"        "$API_ENV_FILE"
    set_env APP_DEBUG     "false"             "$API_ENV_FILE"
    set_env APP_URL       "$API_URL"          "$API_ENV_FILE"
    set_env APP_KEY       "base64:$(openssl rand -base64 32)" "$API_ENV_FILE"
    set_env JWT_SECRET    "$(openssl rand -hex 32)"           "$API_ENV_FILE"

    set_env LOG_STACK     "stderr"            "$API_ENV_FILE"
    set_env LOG_LEVEL     "warning"           "$API_ENV_FILE"

    set_env DB_CONNECTION "pgsql"             "$API_ENV_FILE"
    set_env DB_HOST       "db"                "$API_ENV_FILE"   # nama service compose
    set_env DB_PORT       "5432"              "$API_ENV_FILE"   # port DI DALAM jaringan docker
    set_env DB_DATABASE   "$DB_DATABASE"      "$API_ENV_FILE"
    set_env DB_USERNAME   "$DB_USERNAME"      "$API_ENV_FILE"
    set_env DB_PASSWORD   "$DB_PASSWORD"      "$API_ENV_FILE"

    set_env FRONTEND_URL  "$WEB_URL"          "$API_ENV_FILE"

    if [ -n "$MAIL_HOST" ]; then
        set_env MAIL_MAILER   "smtp"           "$API_ENV_FILE"
        set_env MAIL_HOST     "$MAIL_HOST"     "$API_ENV_FILE"
        set_env MAIL_PORT     "$MAIL_PORT"     "$API_ENV_FILE"
        set_env MAIL_SCHEME   "$MAIL_SCHEME"   "$API_ENV_FILE"
        set_env MAIL_USERNAME "$MAIL_USERNAME" "$API_ENV_FILE"
        set_env MAIL_PASSWORD "$MAIL_PASSWORD" "$API_ENV_FILE"
        set_env MAIL_FROM_ADDRESS "\"$MAIL_FROM\"" "$API_ENV_FILE"
    else
        warn "SMTP belum diisi — MAIL_MAILER dibiarkan 'log'. Email verifikasi & reset password TIDAK akan sampai ke pengguna sampai diisi."
    fi

    ok "$API_ENV_FILE (APP_KEY & JWT_SECRET dibuat acak)"
fi

# Berlaku untuk berkas yang baru ditulis MAUPUN yang dipertahankan: container
# jalan sebagai uid 1000, jadi .env milik root bermode 640 tidak akan terbaca
# dan Laravel diam-diam jalan tanpa env.
chmod 640 "$API_ENV_FILE"
if chown 1000:1000 "$API_ENV_FILE" 2>/dev/null || $SUDO chown 1000:1000 "$API_ENV_FILE" 2>/dev/null; then
    ok "$API_ENV_FILE dimiliki uid 1000 (user 'laravel' di dalam container), mode 640"
else
    warn "gagal chown $API_ENV_FILE ke uid 1000 — container mungkin tidak bisa membacanya."
fi

# ============================================================== 4. build API ==
step "4/8  Build & menjalankan sisi API"

compose build app nginx
compose up -d db app queue scheduler nginx
ok "container API jalan"

info "menunggu API sehat…"
health=""
for _ in $(seq 1 45); do
    health="$(curl -fs -m 5 "http://127.0.0.1:$API_PORT/api/v1/health" 2>/dev/null || true)"
    case "$health" in *'"database":"connected"'*) break ;; esac
    sleep 2
done
case "$health" in
    *'"database":"connected"'*) ok "GET /api/v1/health → database connected" ;;
    *) compose logs --tail 40 app; die "API tidak kunjung sehat. Lihat log di atas." ;;
esac

# ==================================================== 5. migrasi, seed, admin ==
step "5/8  Migrasi, seed, akun admin"

compose exec -T app php artisan migrate --force
ok "migrasi selesai"

settings_count="$(compose exec -T db psql -U "$DB_USERNAME" -d "$DB_DATABASE" -tAc 'select count(*) from settings' 2>/dev/null | tr -d '[:space:]' || echo 0)"
if [ "${settings_count:-0}" -gt 0 ] 2>/dev/null; then
    info "data awal sudah ada (settings=$settings_count) — seeder dilewati"
else
    # Sengaja per kelas: DatabaseSeeder memakai User::factory() yang butuh
    # fakerphp/faker (paket dev, tidak ada di image produksi) dan akan mati
    # sebelum keempat seeder di bawah sempat jalan.
    for s in QuestionnaireSeeder CategorySeeder ChecklistItemSeeder SettingSeeder; do
        compose exec -T app php artisan db:seed --force --class="$s" >/dev/null
        info "seeder $s"
    done
    ok "data awal terisi"
fi

if compose exec -T \
        -e PT_ADMIN_NAME="$ADMIN_NAME" \
        -e PT_ADMIN_EMAIL="$ADMIN_EMAIL" \
        -e PT_ADMIN_PASSWORD="$ADMIN_PASSWORD" \
        app php artisan tinker --execute='
$email = getenv("PT_ADMIN_EMAIL");
if (App\Models\User::where("email", $email)->exists()) {
    echo "ADMIN_ADA\n";
} else {
    $u = new App\Models\User;
    $u->name = getenv("PT_ADMIN_NAME");
    $u->email = $email;
    // cast `hashed` yang meng-hash; kolomnya password_hash, bukan password
    $u->password_hash = getenv("PT_ADMIN_PASSWORD");
    $u->role = "super_admin";          // tidak fillable — harus diset begini
    $u->is_active = true;
    $u->email_verified_at = now();
    $u->save();
    echo "ADMIN_BARU\n";
}' | grep -q "ADMIN_BARU"; then
    ok "super admin dibuat: $ADMIN_EMAIL"
else
    ok "super admin sudah ada: $ADMIN_EMAIL (password tidak diubah)"
    ADMIN_PASSWORD_GENERATED=0
fi

# ============================================================= 6. Nginx host ==
if [ "$SKIP_NGINX" = "1" ]; then
    step "6/8  Nginx host — dilewati (--skip-nginx)"
else
    step "6/8  Vhost Nginx host"

    api_vhost="/etc/nginx/sites-available/$API_DOMAIN"
    web_vhost="/etc/nginx/sites-available/$DOMAIN"

    if [ -e "$api_vhost" ]; then
        info "$api_vhost sudah ada — dibiarkan"
    else
        $SUDO tee "$api_vhost" >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $API_DOMAIN;

    access_log /var/log/nginx/$API_DOMAIN.access.log;
    error_log  /var/log/nginx/$API_DOMAIN.error.log;

    client_max_body_size 20m;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        # WAJIB: tanpa ini Laravel mengira skemanya http dan signed URL
        # verifikasi email tidak akan pernah cocok.
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host  \$host;
        proxy_read_timeout 120s;
    }
}
EOF
        $SUDO ln -sfn "$api_vhost" "/etc/nginx/sites-enabled/$API_DOMAIN"
        ok "$api_vhost"
    fi

    if [ -e "$web_vhost" ]; then
        info "$web_vhost sudah ada — dibiarkan"
    else
        $SUDO tee "$web_vhost" >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name www.$DOMAIN;
    return 301 https://$DOMAIN\$request_uri;
}

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    access_log /var/log/nginx/$DOMAIN.access.log;
    error_log  /var/log/nginx/$DOMAIN.error.log;

    client_max_body_size 20m;

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    location /_next/static/ {
        proxy_pass http://127.0.0.1:$WEB_PORT;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:$WEB_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade           \$http_upgrade;
        proxy_set_header Connection        'upgrade';
        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }
}
EOF
        $SUDO ln -sfn "$web_vhost" "/etc/nginx/sites-enabled/$DOMAIN"
        ok "$web_vhost"
    fi

    $SUDO nginx -t >/dev/null 2>&1 || { $SUDO nginx -t; die "konfigurasi Nginx tidak valid."; }
    $SUDO systemctl reload nginx
    ok "nginx di-reload"
fi

# ==================================================================== 7. SSL ==
if [ "$SKIP_SSL" = "1" ] || [ "$SKIP_NGINX" = "1" ]; then
    step "7/8  SSL — dilewati"
else
    step "7/8  Sertifikat Let's Encrypt"

    if $SUDO test -d "/etc/letsencrypt/live/$DOMAIN" || $SUDO test -d "/etc/letsencrypt/live/$API_DOMAIN"; then
        info "sertifikat sudah ada — Certbot dilewati"
    else
        for d in "$DOMAIN" "$API_DOMAIN"; do
            getent hosts "$d" >/dev/null 2>&1 || warn "$d belum resolve — Certbot kemungkinan gagal."
        done
        if $SUDO certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" -d "$API_DOMAIN" \
                --agree-tos -m "$LE_EMAIL" --redirect --non-interactive; then
            ok "sertifikat terbit & redirect 80→443 aktif"
        else
            warn "Certbot gagal. Perbaiki DNS lalu jalankan manual:"
            info "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN -d $API_DOMAIN --agree-tos -m $LE_EMAIL --redirect"
        fi
    fi
fi

# ============================================================== 8. build web ==
if [ "$SKIP_WEB" = "1" ]; then
    step "8/8  Web — dilewati (--skip-web)"
else
    step "8/8  Build & menjalankan web"

    # `next build` mem-prerender halaman publik dengan memanggil API sungguhan.
    # Kalau URL-nya belum terjangkau, build pasti gagal — cek dulu supaya
    # pesannya jelas.
    probe="${NEXT_PUBLIC_API_URL%/}/health"
    if curl -fs -m 10 "$probe" >/dev/null 2>&1; then
        ok "API terjangkau di $probe"
    else
        warn "API belum bisa dijangkau di $probe"
        info "next build mem-prerender halaman publik lewat URL itu dan akan gagal."
        info "Biasanya karena DNS/SSL belum selesai. Setelah beres, jalankan:"
        info "  docker compose -f docker-compose.prod.yml build web && docker compose -f docker-compose.prod.yml up -d web"
        confirm "Tetap coba build sekarang?" || SKIP_WEB=1
    fi

    if [ "$SKIP_WEB" = "0" ]; then
        compose build web
        compose up -d web
        sleep 5
        code="$(curl -s -o /dev/null -w '%{http_code}' -m 10 "http://127.0.0.1:$WEB_PORT/" || true)"
        if [ "$code" = "200" ]; then
            ok "web menjawab 200 di 127.0.0.1:$WEB_PORT"
        else
            warn "web menjawab $code — cek 'docker compose -f docker-compose.prod.yml logs web'"
        fi
    fi
fi

# ================================================================= ringkasan ==
printf '\n%s%s%s\n' "$B$GRN" "Pemasangan selesai." "$R"
cat <<EOF

  Web        $WEB_URL
  API        $API_URL/api/v1
  Admin      $ADMIN_EMAIL
EOF
[ "$ADMIN_PASSWORD_GENERATED" = "1" ] && printf '  Password   %s%s%s   ← simpan sekarang, tidak ditampilkan lagi\n' "$B" "$ADMIN_PASSWORD" "$R"
cat <<EOF

  Status     docker compose -f docker-compose.prod.yml ps
  Log        docker compose -f docker-compose.prod.yml logs -f app queue web
  Redeploy   ./scripts/deploy.sh
  Backup     ./scripts/backup.sh   (pasang di cron, lihat DEPLOYMENT.md §9)

EOF
[ -z "$MAIL_HOST" ] && printf '  %s!%s SMTP belum diisi di api/.env — email verifikasi & reset password belum akan terkirim.\n\n' "$YLW" "$R"
compose ps
