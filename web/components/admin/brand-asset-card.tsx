"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { Loader2, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiDelete, apiPostForm, ApiRequestError } from "@/lib/api-client";
import { revalidateBrandCache } from "@/lib/brand-cache";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { BrandAssetName, BrandSettings } from "@/lib/types";

/**
 * Satu aset identitas situs: pratinjau, unggah, dan kembalikan ke bawaan.
 *
 * Pratinjaunya ditampilkan **pada tempatnya** — logo di dalam tiruan header,
 * favicon di dalam tiruan tab browser, hero di dalam lingkaran yang sama
 * seperti di landing page. Thumbnail persegi biasa memang lebih mudah
 * dibuat, tapi tidak menjawab pertanyaan yang sebenarnya dipunyai admin saat
 * mengunggah: "nanti kelihatannya bagaimana?".
 */
export function BrandAssetCard({
  asset,
  title,
  description,
  requirements,
  produces,
  version,
  preview,
  onChanged,
}: {
  asset: BrandAssetName;
  title: string;
  description: string;
  /** Format, ukuran minimum, dan batas berkas — angka yang sama dengan backend. */
  requirements: string;
  /** Apa yang dihasilkan dari satu unggahan ini. */
  produces: string;
  version: number | null;
  preview: ReactNode;
  onChanged: (next: BrandSettings) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [busy, setBusy] = useState<"upload" | "reset" | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setBusy("upload");
    try {
      const formData = new FormData();
      formData.append("file", file);
      onChanged(await apiPostForm<BrandSettings>(`/admin/brand/${asset}`, formData));
      await revalidateBrandCache(accessToken);
      toast.success(`${title} diperbarui.`);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.detail() : "Gagal mengunggah, coba lagi.");
    } finally {
      setBusy(null);
      // Dikosongkan supaya memilih berkas yang sama dua kali tetap memicu
      // onChange — jika tidak, percobaan ulang setelah gagal terasa mati.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleReset() {
    setBusy("reset");
    try {
      onChanged(await apiDelete<BrandSettings>(`/admin/brand/${asset}`));
      await revalidateBrandCache(accessToken);
      toast.success(`${title} kembali ke bawaan.`);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.detail() : "Gagal mengembalikan, coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
          <p className="mt-0.5 max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
        {version !== null && (
          <span className="shrink-0 rounded-full bg-brand-purple-soft px-3 py-1 text-xs font-semibold text-brand-purple tabular-nums">
            versi {version}
          </span>
        )}
      </div>

      <div className="mt-5">{preview}</div>

      <dl className="mt-5 space-y-1 text-xs text-muted-foreground">
        <div>
          <dt className="sr-only">Syarat berkas</dt>
          <dd>{requirements}</dd>
        </div>
        <div>
          <dt className="sr-only">Hasil olahan</dt>
          <dd>{produces}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy !== null}
          className="h-10 gap-1.5 rounded-full px-5"
        >
          {busy === "upload" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {busy === "upload" ? "Mengunggah..." : version === null ? "Unggah" : "Ganti"}
        </Button>

        {version !== null && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={busy !== null}
            className="h-10 gap-1.5 rounded-full px-4 text-muted-foreground hover:bg-feature-danger-soft hover:text-danger"
          >
            {busy === "reset" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            Kembalikan ke bawaan
          </Button>
        )}
      </div>
    </section>
  );
}

/** Tiruan header publik — tempat logo benar-benar mendarat. */
export function LogoPreview({ url }: { url: string }) {
  return (
    <div className="rounded-2xl bg-muted p-4">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Image
            src={url}
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 object-contain"
            unoptimized
          />
          <span className="font-display text-lg font-extrabold tracking-tight">
            <span className="text-[#EC4899]">Prena</span>
            <span className="text-brand-purple">Talks</span>
          </span>
        </div>
        <div className="hidden gap-4 text-xs font-semibold text-muted-foreground sm:flex">
          <span>Beranda</span>
          <span>Artikel</span>
          <span>Video</span>
        </div>
      </div>
    </div>
  );
}

/** Tiruan tab browser — satu-satunya tempat favicon benar-benar terlihat. */
export function FaviconPreview({ url }: { url: string }) {
  return (
    <div className="rounded-2xl bg-muted p-4">
      <div className="flex items-end gap-1">
        <div className="flex items-center gap-2 rounded-t-xl border border-b-0 border-border bg-white px-3 py-2.5">
          <Image src={url} alt="" width={16} height={16} className="size-4" unoptimized />
          <span className="max-w-[160px] truncate text-xs font-semibold text-foreground">
            PrenaTalks — Teman Ibu Hamil
          </span>
        </div>
        <div className="h-7 flex-1 rounded-t-xl border border-b-0 border-border/60 bg-white/50" />
      </div>
      <div className="h-8 rounded-b-xl rounded-tr-xl border border-border bg-white" />
    </div>
  );
}

/** Tiruan lingkaran hero, gradien dan cincinnya sama persis dengan landing. */
export function HeroPreview({ url }: { url: string | null }) {
  return (
    <div className="flex justify-center rounded-2xl bg-gradient-to-br from-[#FFF1F6] via-[#FDF2F8] to-[#F5F3FF] p-6">
      <div className="relative aspect-square w-full max-w-[220px]">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-soft via-white to-brand-purple-soft blur-2xl" />
        <div className="absolute inset-4 rounded-full bg-white/60 shadow-soft ring-1 ring-white" />
        {url ? (
          <div className="absolute inset-4 overflow-hidden rounded-full shadow-soft ring-1 ring-white">
            <Image src={url} alt="" fill sizes="220px" className="object-cover" unoptimized />
          </div>
        ) : (
          <Image
            src="/brand/logo.png"
            alt=""
            fill
            sizes="220px"
            className="object-contain p-10"
          />
        )}
      </div>
    </div>
  );
}
