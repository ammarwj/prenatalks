import { z } from "zod";

import type { AdminGuide } from "@/lib/types";

/**
 * TipTap mengirim `<p></p>` untuk editor kosong, jadi "kosong" tidak bisa
 * diperiksa dengan `min(1)` — idiom yang sama dipakai
 * `lib/validations/legal-document.ts` dan `lib/validations/article.ts`.
 */
function isContentEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}

/**
 * Panduan penggunaan. `order_index` tidak ada di sini: urutannya diatur lewat
 * drag & drop di daftar, bukan diketik di form — sama seperti FAQ dan
 * testimoni.
 */
export const guideSchema = z.object({
  title: z.string().min(1, "Judul panduan wajib diisi").max(150, "Maksimal 150 karakter"),
  summary: z.string().max(255, "Maksimal 255 karakter"),
  body: z.string().refine((value) => !isContentEmpty(value), "Isi panduan wajib diisi"),
  isPublished: z.boolean(),
});

export type GuideInput = z.infer<typeof guideSchema>;

export function toGuideFormValues(guide?: AdminGuide): GuideInput {
  if (!guide) {
    return { title: "", summary: "", body: "", isPublished: false };
  }

  return {
    title: guide.title,
    summary: guide.summary ?? "",
    body: guide.body,
    isPublished: guide.is_published,
  };
}

/** Payload persis bentuk `AdminGuideRequest::rules()` di backend. */
export type GuidePayload = {
  title: string;
  summary: string | null;
  body: string;
  is_published: boolean;
};

export function toGuidePayload(values: GuideInput): GuidePayload {
  return {
    title: values.title.trim(),
    summary: values.summary.trim() || null,
    body: values.body,
    is_published: values.isPublished,
  };
}
