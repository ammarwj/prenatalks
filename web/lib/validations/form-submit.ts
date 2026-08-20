import { z } from "zod";

import { acceptFromExtensions, validateFile } from "@/lib/file-upload";
import type { PublicFormField } from "@/lib/types";
import { MAX_FILE_SIZE_KB } from "@/lib/validations/form-builder";

export type AnswerValue = string | string[] | File | undefined;
export type AnswerValues = Record<string, AnswerValue>;

function fieldKey(field: PublicFormField): string {
  return `field_${field.id}`;
}

/**
 * Skema dibangun dinamis per form — struktur field (dan aturannya) hanya
 * diketahui saat runtime dari respons `GET /forms/{slug}`, berbeda dengan
 * form admin yang bentuknya tetap (lib/validations/form-builder.ts).
 * Validasi backend (FormFieldRuleBuilder) tetap jadi sumber kebenaran; ini
 * hanya memberi umpan balik cepat sebelum request dikirim.
 */
export function buildAnswerSchema(fields: PublicFormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    shape[fieldKey(field)] = buildFieldSchema(field);
  }

  return z.object(shape);
}

const REQUIRED_MESSAGE: Partial<Record<PublicFormField["type"], string>> = {
  checkbox: "Pilih minimal 1 opsi",
  file: "Berkas wajib diunggah",
};

/**
 * Field yang belum disentuh pengguna bernilai `undefined` (bukan string
 * kosong) — divalidasi lewat tipe dasarnya langsung (mis. `z.string()`),
 * `undefined` gagal di pengecekan tipe sebelum sempat mencapai pesan
 * `.min(1, ...)` yang ramah, sehingga muncul pesan teknis Zod mentah
 * ("Invalid input: expected string, received undefined"). Nilai "kosong"
 * (undefined/""/[]) dinormalisasi ke `undefined` lebih dulu lewat
 * `z.preprocess`, tipe dasarnya selalu `.optional()` (jadi menerima
 * `undefined` secara struktural), lalu wajib-tidaknya dicek terpisah lewat
 * `.refine()` dengan pesan yang konsisten.
 */
function buildFieldSchema(field: PublicFormField): z.ZodTypeAny {
  const required = field.is_required;
  const inner = buildInnerType(field).optional();

  const normalized = z.preprocess((val) => {
    if (val === undefined || val === null) return undefined;
    if (typeof val === "string" && val.trim() === "") return undefined;
    if (Array.isArray(val) && val.length === 0) return undefined;
    return val;
  }, inner);

  if (!required) return normalized;

  return normalized.refine((val) => val !== undefined, {
    message: REQUIRED_MESSAGE[field.type] ?? "Wajib diisi",
  });
}

function buildInnerType(field: PublicFormField): z.ZodTypeAny {
  switch (field.type) {
    case "text": {
      let schema = z.string();
      if (field.validation?.min) schema = schema.min(field.validation.min, `Minimal ${field.validation.min} karakter`);
      if (field.validation?.max) schema = schema.max(field.validation.max, `Maksimal ${field.validation.max} karakter`);
      if (field.validation?.regex) {
        try {
          schema = schema.regex(new RegExp(field.validation.regex), "Format tidak sesuai");
        } catch {
          // pola regex tidak valid — lewati validasi klien, backend tetap memvalidasi ulang
        }
      }
      return schema;
    }

    case "textarea": {
      let schema = z.string();
      if (field.validation?.min) schema = schema.min(field.validation.min, `Minimal ${field.validation.min} karakter`);
      if (field.validation?.max) schema = schema.max(field.validation.max, `Maksimal ${field.validation.max} karakter`);
      return schema;
    }

    case "number": {
      let schema = z.coerce.number({ message: "Harus berupa angka" });
      if (field.validation?.min != null) schema = schema.min(field.validation.min, `Minimal ${field.validation.min}`);
      if (field.validation?.max != null) schema = schema.max(field.validation.max, `Maksimal ${field.validation.max}`);
      return schema;
    }

    case "date":
      return z.string();

    case "radio":
    case "select": {
      const options = (field.options as string[] | null) ?? [];
      return options.length > 0 ? z.enum(options as [string, ...string[]]) : z.string();
    }

    case "checkbox":
      return z.array(z.string());

    case "scale": {
      const bounds = field.options as { min: number; max: number } | null;
      let schema = z.coerce.number({ message: "Pilih salah satu nilai skala" });
      if (bounds) schema = schema.min(bounds.min).max(bounds.max);
      return schema;
    }

    case "file":
      // Batas per-field diatur admin di form builder; `min(..., MAX_FILE_SIZE_KB)`
      // mencerminkan `FormFieldRuleBuilder` yang juga membatasi nilai admin
      // ke 2048 KB, supaya pesan galat di sini tidak menjanjikan batas yang
      // lebih longgar daripada yang benar-benar diterima server.
      return z.instanceof(File, { message: "Berkas tidak valid" }).superRefine((file, ctx) => {
        const message = validateFile(file, {
          accept: acceptFromExtensions(field.validation?.allowed_extensions),
          maxSizeKb: Math.min(field.validation?.max_size_kb ?? MAX_FILE_SIZE_KB, MAX_FILE_SIZE_KB),
        });
        if (message) ctx.addIssue({ code: "custom", message });
      });

    default:
      return z.string();
  }
}

export function toSubmitFormData(fields: PublicFormField[], answers: AnswerValues): FormData {
  const formData = new FormData();

  for (const field of fields) {
    const key = fieldKey(field);
    const value = answers[key];

    if (value === undefined || value === "") continue;

    if (Array.isArray(value)) {
      value.forEach((v) => formData.append(`${key}[]`, v));
    } else {
      formData.append(key, value);
    }
  }

  return formData;
}
