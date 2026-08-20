import { z } from "zod";

import { validateFile } from "@/lib/file-upload";

/**
 * Field berkas opsional dengan batas yang sama seperti FormRequest di Laravel.
 *
 * Lapis kedua, bukan pengganti: `FileUpload` sudah menolak berkas saat dipilih,
 * dan Laravel tetap penentu akhir. Yang ditangkap di sini adalah nilai yang
 * masuk lewat jalur lain — mis. `setValue` langsung dari kode.
 */
export function optionalFileSchema(rules: { accept?: string; maxSizeKb?: number }) {
  return z
    .instanceof(File)
    .optional()
    .superRefine((file, ctx) => {
      if (!file) return;

      const message = validateFile(file, rules);
      if (message) ctx.addIssue({ code: "custom", message });
    });
}
