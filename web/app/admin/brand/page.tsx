"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";

import {
  BrandAssetCard,
  FaviconPreview,
  HeroPreview,
  LogoPreview,
} from "@/components/admin/brand-asset-card";
import { SuperAdminRestricted, useSuperAdminGuard } from "@/components/admin/super-admin-guard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import type { BrandSettings } from "@/lib/types";

/**
 * Identitas situs — logo, favicon, dan gambar hero (PRD §1.4).
 *
 * Halaman tersendiri, bukan seksi di `/admin/pengaturan`: halaman itu
 * terbuka untuk admin biasa, sedangkan endpoint di sini dijaga
 * `role:super_admin`. Menaruh seksi yang pasti ditolak di halaman yang bisa
 * dibuka semua admin hanya memancing percobaan yang gagal.
 */
export default function IdentitasSitusPage() {
  const { isSuperAdmin } = useSuperAdminGuard();
  const [brand, setBrand] = useState<BrandSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setBrand(await apiGet<BrandSettings>("/admin/settings"));
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat aset situs.");
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [isSuperAdmin, load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Identitas Situs</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Logo, favicon, dan gambar hero. Berkas otomatis diperkecil dan dikonversi, lalu
            langsung dipasang di seluruh situs. Ikon tab kadang perlu tab baru untuk berganti —
            browser menyimpannya lebih keras kepala daripada gambar biasa.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
        >
          <ExternalLink className="size-4" />
          Lihat halaman publik
        </Link>
      </div>

      {!isSuperAdmin ? (
        <SuperAdminRestricted description="Mengganti logo, favicon, dan gambar hero mengubah tampilan seluruh situs, jadi hanya Super Admin yang bisa melakukannya. Hubungi Super Admin bila aset perlu diperbarui." />
      ) : loadError ? (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : brand === null ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat aset situs...
        </div>
      ) : (
        <div className="space-y-5">
          <BrandAssetCard
            asset="logo"
            title="Logo"
            description="Tampil di header semua halaman, dashboard ibu hamil, dan panel admin."
            requirements="PNG, JPG, atau WebP · minimal 128×128 · maksimal 2 MB"
            produces="Disimpan sebagai WebP lebar 512 px. Latar transparan dipertahankan — pakai PNG bertransparansi agar menyatu dengan header putih."
            version={brand.brand_logo?.version ?? null}
            preview={<LogoPreview url={brand.brand_logo?.url ?? "/brand/logo.png"} />}
            onChanged={setBrand}
          />

          <BrandAssetCard
            asset="favicon"
            title="Favicon"
            description="Ikon kecil di tab browser, bookmark, dan layar utama ponsel."
            requirements="PNG, JPG, atau WebP · wajib persegi · minimal 128×128 · maksimal 1 MB"
            produces="Menghasilkan dua berkas: favicon.ico berisi ukuran 16, 32, dan 48 px, plus apple-touch-icon 180×180 untuk iOS. Gambar sederhana dan berkontras tinggi terbaca paling jelas di 16 px."
            version={brand.brand_favicon?.version ?? null}
            preview={<FaviconPreview url={brand.brand_favicon?.url ?? "/brand/favicon-default.ico"} />}
            onChanged={setBrand}
          />

          <BrandAssetCard
            asset="hero"
            title="Gambar Hero"
            description="Foto besar di bagian paling atas halaman depan."
            requirements="PNG, JPG, atau WebP · minimal 800×800 · maksimal 5 MB"
            produces="Menghasilkan dua berkas: WebP lebar 1200 px untuk halaman depan, dan gambar 1200×630 untuk pratinjau saat tautan dibagikan di WhatsApp. Foto dipasang dalam bingkai lingkaran, jadi letakkan subjek di tengah."
            version={brand.brand_hero?.version ?? null}
            preview={<HeroPreview url={brand.brand_hero?.url ?? null} />}
            onChanged={setBrand}
          />
        </div>
      )}
    </div>
  );
}
