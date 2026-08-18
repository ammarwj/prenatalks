# Next.js 16 — build standalone, dijalankan sebagai `node server.js`.
#
# CATATAN 1: NEXT_PUBLIC_* di-inline saat build, jadi nilainya masuk lewat
# build args di bawah. Mengubahnya = build image ulang, bukan restart.
#
# CATATAN 2: sengaja hanya package.json yang disalin, lalu `npm install` —
# bukan package-lock.json + `npm ci`. Lockfile di repo dibuat di macOS dan
# hanya memuat binary darwin-arm64 (lightningcss, @tailwindcss/oxide, swc,
# sharp); dibawa ke Linux, npm memakainya apa adanya dan build gagal dengan
# "Cannot find module '../lightningcss.linux-*.node'". Tanpa lockfile, npm
# menyelesaikan binary yang sesuai platform build.
# Kalau nanti lockfile diregenerasi di Linux (atau memuat semua platform),
# kembalikan ke `COPY web/package-lock.json` + `npm ci` supaya deterministik.
#
# CATATAN 3: basis Debian slim (glibc), bukan alpine — binary prebuilt di atas
# tersedia lengkap untuk glibc, jadi tidak ada kompilasi dadakan saat build.

FROM node:22-slim AS deps
WORKDIR /app
COPY web/package.json ./
RUN npm install --include=optional --no-audit --no-fund

FROM node:22-slim AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY web/ ./
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
