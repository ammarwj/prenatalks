import { z } from "zod";

import type { AdminForm, FormFieldType, FormStatus } from "@/lib/types";

export const FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: "text", label: "Teks singkat" },
  { value: "textarea", label: "Paragraf" },
  { value: "number", label: "Angka" },
  { value: "date", label: "Tanggal" },
  { value: "radio", label: "Pilihan tunggal" },
  { value: "checkbox", label: "Pilihan ganda" },
  { value: "select", label: "Dropdown" },
  { value: "scale", label: "Skala 1-5" },
  { value: "file", label: "Unggah berkas" },
];

export const FORM_STATUS_OPTIONS: { value: FormStatus; label: string }[] = [
  { value: "draft", label: "Draf" },
  { value: "published", label: "Terbit" },
  { value: "closed", label: "Tutup" },
];

const CHOICE_TYPES: FormFieldType[] = ["radio", "checkbox", "select"];
/** Batas keras backend — `FormFieldRuleBuilder` memakai `min($input, 2048)`. */
export const MAX_FILE_SIZE_KB = 2048;

/**
 * Field angka dari input HTML selalu string; divalidasi sebagai string
 * numerik lalu dikonversi ke number tepat sebelum dikirim ke API (pola yang
 * sama dipakai di lib/validations/questionnaire.ts).
 */
const optionalIntegerString = z
  .string()
  .optional()
  .refine((v) => !v || /^-?\d+$/.test(v.trim()), "Harus berupa bilangan bulat");

const fieldSchema = z
  .object({
    label: z.string().min(1, "Label wajib diisi").max(255, "Maksimal 255 karakter"),
    description: z.string().optional(),
    type: z.enum(["text", "textarea", "number", "date", "radio", "checkbox", "select", "scale", "file"]),
    placeholder: z.string().max(255, "Maksimal 255 karakter").optional(),
    is_required: z.boolean(),
    choices: z.array(z.object({ value: z.string() })),
    scale_min: z.string(),
    scale_max: z.string(),
    validation_min: optionalIntegerString,
    validation_max: optionalIntegerString,
    regex: z.string().optional(),
    max_size_kb: optionalIntegerString,
    allowed_extensions: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (CHOICE_TYPES.includes(data.type)) {
      const filled = data.choices.filter((c) => c.value.trim() !== "");
      if (filled.length < 1) {
        ctx.addIssue({ code: "custom", message: "Minimal 1 pilihan", path: ["choices"] });
      }
    }

    if (data.type === "scale") {
      const min = Number(data.scale_min);
      const max = Number(data.scale_max);
      if (!data.scale_min.trim() || !data.scale_max.trim() || !Number.isInteger(min) || !Number.isInteger(max)) {
        ctx.addIssue({ code: "custom", message: "Skala butuh nilai minimum & maksimum", path: ["scale_max"] });
      } else if (min >= max) {
        ctx.addIssue({ code: "custom", message: "Nilai minimum harus lebih kecil dari maksimum", path: ["scale_max"] });
      }
    }

    if (data.validation_min?.trim() && data.validation_max?.trim()) {
      if (Number(data.validation_min) > Number(data.validation_max)) {
        ctx.addIssue({
          code: "custom",
          message: "Maksimum harus lebih besar atau sama dengan minimum",
          path: ["validation_max"],
        });
      }
    }

    if (data.type === "text" && data.regex?.trim()) {
      try {
        new RegExp(data.regex);
      } catch {
        ctx.addIssue({ code: "custom", message: "Pola regex tidak valid", path: ["regex"] });
      }
    }

    if (data.type === "file" && data.max_size_kb?.trim() && Number(data.max_size_kb) > MAX_FILE_SIZE_KB) {
      ctx.addIssue({
        code: "custom",
        message: "Maksimal 2048 KB (2 MB)",
        path: ["max_size_kb"],
      });
    }
  });

export const formBuilderSchema = z.object({
  title: z.string().min(1, "Judul form wajib diisi").max(255, "Maksimal 255 karakter"),
  slug: z
    .string()
    .max(255, "Maksimal 255 karakter")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Hanya huruf kecil, angka, dan tanda hubung")
    .optional()
    .or(z.literal("")),
  description: z.string().optional(),
  type: z.enum(["form", "survey"]),
  is_public: z.boolean(),
  requires_login: z.boolean(),
  is_anonymous: z.boolean(),
  one_response_per_user: z.boolean(),
  status: z.enum(["draft", "published", "closed"]),
  opens_at: z.string().optional(),
  closes_at: z.string().optional(),
  fields: z.array(fieldSchema).min(1, "Form minimal punya 1 field"),
});

export type FormBuilderInput = z.infer<typeof formBuilderSchema>;
export type FormBuilderFieldInput = FormBuilderInput["fields"][number];

export function defaultField(): FormBuilderFieldInput {
  return {
    label: "",
    description: "",
    type: "text",
    placeholder: "",
    is_required: false,
    choices: [{ value: "" }],
    scale_min: "1",
    scale_max: "5",
    validation_min: "",
    validation_max: "",
    regex: "",
    max_size_kb: "2048",
    allowed_extensions: "",
  };
}

export function toFormBuilderFormValues(form?: AdminForm): FormBuilderInput {
  if (!form) {
    return {
      title: "",
      slug: "",
      description: "",
      type: "form",
      is_public: false,
      requires_login: true,
      is_anonymous: false,
      one_response_per_user: false,
      status: "draft",
      opens_at: "",
      closes_at: "",
      fields: [defaultField()],
    };
  }

  return {
    title: form.title,
    slug: form.slug,
    description: form.description ?? "",
    type: form.type,
    is_public: form.is_public,
    requires_login: form.requires_login,
    is_anonymous: form.is_anonymous,
    one_response_per_user: form.one_response_per_user,
    status: form.status,
    opens_at: form.opens_at ? form.opens_at.slice(0, 16) : "",
    closes_at: form.closes_at ? form.closes_at.slice(0, 16) : "",
    fields: form.fields.map((field) => {
      const isChoice = CHOICE_TYPES.includes(field.type);
      const scale = field.type === "scale" ? (field.options as { min: number; max: number } | null) : null;

      return {
        label: field.label,
        description: field.description ?? "",
        type: field.type,
        placeholder: field.placeholder ?? "",
        is_required: field.is_required,
        choices: isChoice
          ? (field.options as string[] | null ?? []).map((value) => ({ value }))
          : [{ value: "" }],
        scale_min: scale ? String(scale.min) : "1",
        scale_max: scale ? String(scale.max) : "5",
        validation_min: field.validation?.min != null ? String(field.validation.min) : "",
        validation_max: field.validation?.max != null ? String(field.validation.max) : "",
        regex: field.validation?.regex ?? "",
        max_size_kb: field.validation?.max_size_kb != null ? String(field.validation.max_size_kb) : "2048",
        // Sebelumnya dipaku `""`, sehingga menyunting form apa pun lalu
        // menyimpannya diam-diam menghapus daftar ekstensi yang sudah diatur —
        // dan sejak `accept` dipasang dari nilai ini, hilangnya berarti pemilih
        // berkas responden kembali menerima apa saja.
        allowed_extensions: field.validation?.allowed_extensions?.join(", ") ?? "",
      };
    }),
  };
}

/** Payload persis bentuk `AdminFormRequest::rules()` di backend. */
export type FormBuilderPayload = {
  title: string;
  slug?: string;
  description?: string;
  type: "form" | "survey";
  is_public: boolean;
  requires_login: boolean;
  is_anonymous: boolean;
  one_response_per_user: boolean;
  status: FormStatus;
  opens_at?: string;
  closes_at?: string;
  fields: {
    label: string;
    description?: string;
    type: FormFieldType;
    placeholder?: string;
    is_required: boolean;
    options?: string[] | { min: number; max: number };
    validation?: { min?: number; max?: number; regex?: string; max_size_kb?: number; allowed_extensions?: string[] };
  }[];
};

export function toFormBuilderPayload(values: FormBuilderInput): FormBuilderPayload {
  return {
    title: values.title,
    slug: values.slug?.trim() ? values.slug : undefined,
    description: values.description?.trim() ? values.description : undefined,
    type: values.type,
    is_public: values.is_public,
    requires_login: values.requires_login,
    is_anonymous: values.is_anonymous,
    one_response_per_user: values.one_response_per_user,
    status: values.status,
    opens_at: values.opens_at?.trim() ? values.opens_at : undefined,
    closes_at: values.closes_at?.trim() ? values.closes_at : undefined,
    fields: values.fields.map((field) => {
      const base = {
        label: field.label,
        description: field.description?.trim() ? field.description : undefined,
        type: field.type,
        placeholder: field.placeholder?.trim() ? field.placeholder : undefined,
        is_required: field.is_required,
      };

      if (CHOICE_TYPES.includes(field.type)) {
        return {
          ...base,
          options: field.choices.map((c) => c.value.trim()).filter(Boolean),
        };
      }

      if (field.type === "scale") {
        return {
          ...base,
          options: { min: Number(field.scale_min), max: Number(field.scale_max) },
        };
      }

      if (field.type === "file") {
        const extensions = field.allowed_extensions
          ?.split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        return {
          ...base,
          validation: {
            max_size_kb: field.max_size_kb?.trim() ? Number(field.max_size_kb) : MAX_FILE_SIZE_KB,
            ...(extensions?.length ? { allowed_extensions: extensions } : {}),
          } as FormBuilderPayload["fields"][number]["validation"],
        };
      }

      if (field.type === "text" || field.type === "number" || field.type === "textarea") {
        const validation: FormBuilderPayload["fields"][number]["validation"] = {};
        if (field.validation_min?.trim()) validation.min = Number(field.validation_min);
        if (field.validation_max?.trim()) validation.max = Number(field.validation_max);
        if (field.type === "text" && field.regex?.trim()) validation.regex = field.regex;
        return Object.keys(validation).length ? { ...base, validation } : base;
      }

      return base;
    }),
  };
}
