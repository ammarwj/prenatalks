"use client";

import { useEffect, useId, useMemo, useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { FileText, ImageOff, Loader2, RotateCcw, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  buildRequirements,
  formatFileSize,
  validateFile,
  validateImageDimensions,
} from "@/lib/file-upload";
import { cn } from "@/lib/utils";

export type FileUploadProps = {
  /** Dipasang pada `<input>` asli supaya `<Label htmlFor>` di FormField nyambung. */
  id: string;
  accept?: string;
  maxSizeKb?: number;
  /** Syarat dimensi — hanya dipakai aset identitas situs. */
  minSide?: number;
  square?: boolean;

  /** Berkas yang baru dipilih pengguna. */
  value?: File;
  onChange: (file: File | undefined) => void;

  /** URL berkas yang sudah tersimpan di server (mode sunting). */
  existingUrl?: string | null;
  /** Berkas tersimpan ditandai untuk dihapus saat form disimpan. */
  removed?: boolean;
  onRemoveExisting?: () => void;
  onUndoRemove?: () => void;

  /** Galat dari skema atau server. Menggantikan baris syarat saat ada. */
  error?: string;
  /** Sedang mengunggah — dipakai pemanggil yang mengirim seketika. */
  busy?: boolean;
  disabled?: boolean;
  /** Rasio kotak pratinjau; `wide` untuk thumbnail video. */
  previewShape?: "square" | "wide" | "circle";
  className?: string;
};

const PREVIEW_SHAPES = {
  square: "size-16 rounded-xl",
  wide: "h-16 w-28 rounded-xl",
  circle: "size-16 rounded-full",
};

/**
 * Pemilih berkas bersama — menggantikan kontrol bawaan browser
 * ("Choose File / No file chosen") di seluruh aplikasi.
 *
 * Bentuknya satu zona yang berubah wujud: kotak garis putus-putus saat kosong,
 * baris pratinjau saat terisi. Cukup lega untuk jadi sasaran seret-dan-lepas,
 * tapi tetap muat di dalam dialog sempit seperti form Testimoni.
 *
 * `<input type="file">` aslinya tidak dibuang, hanya disembunyikan dengan
 * `sr-only` — bukan `hidden` atau `opacity-0` — supaya asosiasi label, fokus
 * keyboard, dan pembaca layar tetap bekerja seperti kontrol bawaan.
 *
 * Baris syarat dan pesan galat dirender di sini, bukan lewat `FormField`:
 * `FormField` hanya menampilkan salah satu dari error/hint, jadi menaruh
 * keduanya di sana akan membuat pesan validasi berkas saling menutupi.
 */
export function FileUpload({
  id,
  accept,
  maxSizeKb,
  minSide,
  square,
  value,
  onChange,
  existingUrl,
  removed = false,
  onRemoveExisting,
  onUndoRemove,
  error,
  busy = false,
  disabled = false,
  previewShape = "square",
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const describedBy = useId();

  const isImageFile = value ? value.type.startsWith("image/") : false;

  /**
   * URL pratinjau diturunkan dari `value`, bukan disimpan sebagai state yang
   * di-set dari dalam effect — effect di sini hanya melepasnya.
   *
   * Sebelum komponen ini ada, form artikel dan video memanggil
   * `createObjectURL` tanpa pernah `revokeObjectURL`, jadi tiap pemilihan
   * berkas membocorkan satu blob selama umur halaman.
   */
  const objectUrl = useMemo(
    () => (value && value.type.startsWith("image/") ? URL.createObjectURL(value) : null),
    [value]
  );

  useEffect(() => {
    if (!objectUrl) return;
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  /**
   * Dikosongkan tiap kali nilai dilepas supaya memilih berkas yang **sama**
   * dua kali tetap memicu `change`. Tanpa ini, mencoba ulang setelah menekan
   * "hapus" terasa mati — bug yang ada di form artikel & video sebelumnya.
   */
  function clearNativeInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  async function acceptFile(file: File | undefined) {
    if (!file) return;

    const message =
      validateFile(file, { accept, maxSizeKb }) ??
      (file.type.startsWith("image/")
        ? await validateImageDimensions(file, { minSide, square })
        : null);

    if (message) {
      // Nilai yang sudah sah sengaja **tidak** dibuang: menjatuhkan berkas
      // yang salah ke atas berkas yang benar tidak boleh menghapus yang benar.
      setLocalError(message);
      clearNativeInput();
      return;
    }

    setLocalError(null);
    onChange(file);
  }

  function handleRemove() {
    setLocalError(null);
    onChange(undefined);
    clearNativeInput();
    // Berkas tersimpan di server hanya ditandai untuk dihapus, bukan langsung
    // hilang: penghapusan sebenarnya terjadi saat form disimpan.
    if (!value && existingUrl && onRemoveExisting) onRemoveExisting();
  }

  /**
   * Dipasang di zona kosong **dan** baris terisi: menjatuhkan berkas ke atas
   * pratinjau untuk menggantinya adalah harapan yang wajar, dan tanpa ini
   * seret-dan-lepas berhenti bekerja begitu satu berkas terpilih.
   */
  const dragHandlers = {
    onDragOver: (event: DragEvent) => {
      if (disabled || busy) return;
      event.preventDefault();
      setDragActive(true);
    },
    onDragLeave: () => setDragActive(false),
    onDrop: (event: DragEvent) => {
      if (disabled || busy) return;
      // Tanpa preventDefault, browser membuka berkasnya sebagai halaman.
      event.preventDefault();
      setDragActive(false);
      acceptFile(event.dataTransfer.files?.[0]);
    },
  };

  const showExisting = !value && !!existingUrl && !removed;
  const hasContent = !!value || showExisting;
  const message = error ?? localError;
  const requirements = buildRequirements(accept, maxSizeKb);

  return (
    <div className={cn("space-y-1.5", className)}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        aria-describedby={describedBy}
        onChange={(event) => acceptFile(event.target.files?.[0])}
      />

      {removed ? (
        <div className="rounded-2xl border border-border bg-feature-danger-soft px-4 py-3">
          <p className="text-xs font-medium text-danger">
            Berkas akan dihapus saat disimpan.{" "}
            <button type="button" className="underline" onClick={onUndoRemove}>
              Batalkan
            </button>
          </p>
        </div>
      ) : hasContent ? (
        <div
          {...dragHandlers}
          className={cn(
            "flex items-center gap-3 rounded-2xl border bg-white p-3 transition-colors",
            dragActive ? "border-primary bg-primary-soft" : "border-border"
          )}
        >
          <FilePreview
            shape={previewShape}
            objectUrl={objectUrl}
            existingUrl={showExisting ? existingUrl : null}
            isImage={isImageFile || showExisting}
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {value ? value.name : "Berkas tersimpan"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {busy ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="size-3 animate-spin" />
                  Mengunggah...
                </span>
              ) : value ? (
                formatFileSize(value.size)
              ) : (
                "Sudah diunggah sebelumnya"
              )}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || busy}
              className="gap-1.5"
              onClick={() => inputRef.current?.click()}
            >
              <RotateCcw className="size-3.5" />
              Ganti
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled || busy}
              aria-label="Hapus berkas"
              onClick={handleRemove}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          {...dragHandlers}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed px-4 py-6 text-center outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:pointer-events-none disabled:opacity-50",
            dragActive
              ? "border-primary bg-primary-soft"
              : "border-border bg-muted/40 hover:bg-muted",
            message && !dragActive && "border-destructive"
          )}
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="size-5 text-muted-foreground" />
          )}
          <span className="text-sm font-semibold text-foreground">
            {busy ? "Mengunggah..." : "Seret berkas ke sini atau klik untuk memilih"}
          </span>
        </button>
      )}

      <p
        id={describedBy}
        className={cn(
          "text-xs",
          message ? "font-medium text-danger" : "text-muted-foreground"
        )}
      >
        {message ?? requirements ?? ""}
      </p>
    </div>
  );
}

function FilePreview({
  shape,
  objectUrl,
  existingUrl,
  isImage,
}: {
  shape: keyof typeof PREVIEW_SHAPES;
  objectUrl: string | null;
  existingUrl: string | null;
  isImage: boolean;
}) {
  const box = PREVIEW_SHAPES[shape];

  // Berkas lokal wajib lewat <img> polos: URL `blob:` tidak ada di
  // `images.remotePatterns`, jadi next/image tidak bisa memuatnya.
  if (objectUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={objectUrl} alt="" className={cn("shrink-0 object-cover", box)} />
    );
  }

  if (existingUrl) {
    return (
      <Image
        src={existingUrl}
        alt=""
        width={112}
        height={64}
        unoptimized
        className={cn("shrink-0 object-cover", box)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-muted text-muted-foreground",
        box
      )}
    >
      {isImage ? <ImageOff className="size-5" /> : <FileText className="size-5" />}
    </div>
  );
}
