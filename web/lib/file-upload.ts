/**
 * Aturan berkas unggahan — satu tempat untuk komponen `FileUpload` dan skema
 * zod yang memvalidasi payload-nya.
 *
 * Angka batasnya harus sama persis dengan FormRequest di Laravel. Kalau
 * keduanya menyimpang, pengguna ditolak di sisi klien untuk berkas yang
 * sebenarnya diterima server, atau sebaliknya menunggu unggahan yang sudah
 * pasti berakhir 422.
 */

/** Nama tampil tiap tipe, dipakai menyusun baris syarat berkas. */
const TYPE_LABELS: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/jpg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/gif": "GIF",
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)} KB`;
  }

  // Satu angka di belakang koma sudah cukup untuk membedakan 1,4 MB dari 2 MB;
  // lebih dari itu hanya bising.
  return `${(kb / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}

/**
 * Ubah daftar `accept` jadi kata yang bisa dibaca orang.
 * `"image/jpeg,image/png,image/webp"` → `"JPG/PNG/WebP"`.
 */
export function describeAccept(accept?: string): string | null {
  if (!accept) {
    return null;
  }
  if (accept.trim() === "image/*") {
    return "Gambar";
  }

  const labels = accept
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) =>
      entry.startsWith(".")
        ? entry.slice(1).toUpperCase()
        : (TYPE_LABELS[entry] ?? entry.split("/").pop()?.toUpperCase() ?? entry)
    );

  // Dua entri jpeg dan jpg menghasilkan label "JPG" yang sama.
  return [...new Set(labels)].join("/") || null;
}

/**
 * `allowed_extensions` pada form builder disimpan tanpa titik (`["pdf","jpg"]`),
 * sedangkan atribut `accept` menuntut `".pdf,.jpg"`.
 */
export function acceptFromExtensions(extensions?: string[]): string | undefined {
  if (!extensions?.length) return undefined;
  return extensions.map((ext) => `.${ext.replace(/^\./, "")}`).join(",");
}

/** Baris syarat di bawah zona unggah, mis. `"JPG/PNG/WebP · maks 2 MB"`. */
export function buildRequirements(accept?: string, maxSizeKb?: number): string | null {
  const parts = [describeAccept(accept), maxSizeKb ? `maks ${formatFileSize(maxSizeKb * 1024)}` : null];
  const filled = parts.filter(Boolean);

  return filled.length > 0 ? filled.join(" · ") : null;
}

function matchesAccept(file: File, accept: string): boolean {
  const entries = accept
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (entries.length === 0) {
    return true;
  }

  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  return entries.some((entry) => {
    if (entry.startsWith(".")) {
      return name.endsWith(entry);
    }
    if (entry.endsWith("/*")) {
      return type.startsWith(entry.slice(0, -1));
    }
    return type === entry;
  });
}

/**
 * Memeriksa satu berkas terhadap `accept` dan batas ukuran.
 *
 * Mengembalikan **pesan siap tampil**, bukan boolean: "Ukuran berkas 4,2 MB
 * melebihi batas 2 MB" memberi tahu pengguna apa yang harus diperbaiki,
 * sedangkan "berkas tidak valid" memaksa mereka menebak.
 *
 * @returns pesan galat, atau `null` bila berkasnya lolos.
 */
export function validateFile(
  file: File,
  { accept, maxSizeKb }: { accept?: string; maxSizeKb?: number }
): string | null {
  if (accept && !matchesAccept(file, accept)) {
    const extension = file.name.includes(".") ? `.${file.name.split(".").pop()}` : file.type;

    // `image/*` disebutkan sebagai kategori, bukan daftar format: "gunakan
    // Gambar" tidak terbaca sebagai kalimat.
    if (accept.trim() === "image/*") {
      return `Format ${extension} tidak didukung — hanya berkas gambar yang bisa diunggah.`;
    }

    const allowed = describeAccept(accept);

    return allowed
      ? `Format ${extension} tidak didukung — gunakan ${allowed}.`
      : `Format ${extension} tidak didukung.`;
  }

  if (maxSizeKb && file.size > maxSizeKb * 1024) {
    return `Ukuran berkas ${formatFileSize(file.size)} melebihi batas ${formatFileSize(maxSizeKb * 1024)}.`;
  }

  return null;
}

/**
 * Memeriksa dimensi gambar di sisi klien.
 *
 * Dipakai halaman Identitas Situs, satu-satunya tempat backend menuntut ukuran
 * minimum dan (untuk favicon) bentuk persegi. Tanpa ini, gambar 50×50 tetap
 * terunggah penuh sebelum ditolak dengan pesan yang tidak menyebut angkanya.
 *
 * Gagal membaca gambar dianggap lolos — biar backend yang memutuskan; menolak
 * di sini hanya akan memblokir format sah yang belum dikenal browser.
 */
export function validateImageDimensions(
  file: File,
  { minSide, square }: { minSide?: number; square?: boolean }
): Promise<string | null> {
  if (!minSide && !square) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: width, naturalHeight: height } = image;

      if (minSide && (width < minSide || height < minSide)) {
        resolve(`Gambar ${width}×${height} terlalu kecil — minimal ${minSide}×${minSide} piksel.`);
        return;
      }

      // Toleransi 1% sama dengan `BrandAssetRequest::squareRule()` di backend,
      // supaya gambar yang meleset satu-dua piksel tidak ditolak dua kali
      // dengan alasan yang sama.
      if (square && Math.abs(width - height) > Math.max(width, height) * 0.01) {
        resolve(`Gambar harus persegi — saat ini ${width}×${height}.`);
        return;
      }

      resolve(null);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    image.src = url;
  });
}
