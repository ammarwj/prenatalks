import { z } from "zod";

import type { AdminFaq } from "@/lib/types";

export const faqSchema = z.object({
  question: z.string().min(1, "Pertanyaan wajib diisi").max(500, "Maksimal 500 karakter"),
  answer: z.string().min(1, "Jawaban wajib diisi"),
  categoryId: z.string().optional(),
  isPublished: z.boolean(),
});

export type FaqInput = z.infer<typeof faqSchema>;

export function toFaqFormValues(faq?: AdminFaq): FaqInput {
  if (!faq) {
    return { question: "", answer: "", categoryId: "", isPublished: false };
  }

  return {
    question: faq.question,
    answer: faq.answer,
    categoryId: faq.category_id ? String(faq.category_id) : "",
    isPublished: faq.is_published,
  };
}

/** Payload persis bentuk `AdminFaqRequest::rules()` di backend. */
export type FaqPayload = {
  question: string;
  answer: string;
  category_id?: number;
  is_published: boolean;
};

export function toFaqPayload(values: FaqInput): FaqPayload {
  return {
    question: values.question,
    answer: values.answer,
    category_id: values.categoryId?.trim() ? Number(values.categoryId) : undefined,
    is_published: values.isPublished,
  };
}
