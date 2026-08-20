import { z } from "zod";

import { optionalFileSchema } from "@/lib/validations/file";

import type { AdminTestimonial } from "@/lib/types";

/** Testimoni landing page — PRD §9 F-01. */
export const testimonialSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(80, "Maksimal 80 karakter"),
  pregnancyAge: z.string().min(1, "Usia kehamilan wajib diisi").max(40, "Maksimal 40 karakter"),
  quote: z.string().min(1, "Kutipan wajib diisi").max(500, "Maksimal 500 karakter"),
  rating: z.number().int().min(1, "Pilih minimal 1 bintang").max(5, "Maksimal 5 bintang"),
  isPublished: z.boolean(),
  photo: optionalFileSchema({ accept: "image/jpeg,image/png,image/webp", maxSizeKb: 2048 }),
  removePhoto: z.boolean(),
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;

export function toTestimonialFormValues(testimonial?: AdminTestimonial): TestimonialInput {
  if (!testimonial) {
    return {
      name: "",
      pregnancyAge: "",
      quote: "",
      rating: 5,
      isPublished: true,
      removePhoto: false,
    };
  }

  return {
    name: testimonial.name,
    pregnancyAge: testimonial.pregnancy_age,
    quote: testimonial.quote,
    rating: testimonial.rating,
    isPublished: testimonial.is_published,
    removePhoto: false,
  };
}

export function toTestimonialFormData(values: TestimonialInput, isUpdate: boolean): FormData {
  const formData = new FormData();

  // Laravel tidak mengurai multipart pada PUT — sama seperti form video (F-09)
  // dan profil tim (F-16), request dikirim sebagai POST dengan method spoofing.
  if (isUpdate) formData.append("_method", "PUT");

  formData.append("name", values.name.trim());
  formData.append("pregnancy_age", values.pregnancyAge.trim());
  formData.append("quote", values.quote.trim());
  formData.append("rating", String(values.rating));
  formData.append("is_published", values.isPublished ? "1" : "0");
  if (values.photo) formData.append("photo", values.photo);
  if (values.removePhoto) formData.append("remove_photo", "1");

  return formData;
}
