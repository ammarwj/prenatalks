import { z } from "zod";

import type { AdminQuestionnaire, QuestionType } from "@/lib/types";

export const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "single_choice", label: "Pilihan tunggal" },
  { value: "multiple_choice", label: "Pilihan ganda" },
  { value: "boolean", label: "Ya/Tidak" },
  { value: "number", label: "Angka" },
];

/**
 * Field angka dari input HTML selalu string; divalidasi sebagai string
 * numerik di sini lalu dikonversi ke number tepat sebelum dikirim ke API
 * (lihat toQuestionnairePayload) — pola yang sama dipakai di
 * lib/validations/pregnancy.ts.
 */
const integerString = z
  .string()
  .refine((v) => /^-?\d+$/.test(v.trim()), "Harus berupa bilangan bulat");

const optionalIntegerString = z
  .string()
  .optional()
  .refine((v) => !v || /^-?\d+$/.test(v.trim()), "Harus berupa bilangan bulat");

const questionOptionSchema = z.object({
  label: z.string(),
  score: z.string(),
  is_danger_sign: z.boolean(),
});

/**
 * `options` divalidasi manual lewat superRefine (bukan skema item yang
 * strict) supaya pertanyaan bertipe "number" — yang memang tidak punya opsi
 * (lihat AdminQuestionnaireRequest::rules, required_unless:...,number) —
 * tidak ikut kena validasi label/skor pada baris opsi kosong bawaannya.
 */
const questionSchema = z
  .object({
    text: z.string().min(1, "Pertanyaan wajib diisi").max(255, "Maksimal 255 karakter"),
    help_text: z.string().optional(),
    type: z.enum(["single_choice", "multiple_choice", "boolean", "number"]),
    is_required: z.boolean(),
    group_label: z.string().max(100, "Maksimal 100 karakter").optional(),
    options: z.array(questionOptionSchema),
  })
  .superRefine((data, ctx) => {
    if (data.type === "number") return;

    if (data.options.length < 1) {
      ctx.addIssue({ code: "custom", message: "Minimal 1 opsi jawaban", path: ["options"] });
      return;
    }

    data.options.forEach((option, index) => {
      if (!option.label.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Label opsi wajib diisi",
          path: ["options", index, "label"],
        });
      }
      if (!option.score.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Skor wajib diisi",
          path: ["options", index, "score"],
        });
      } else if (!/^-?\d+$/.test(option.score.trim())) {
        ctx.addIssue({
          code: "custom",
          message: "Skor harus berupa bilangan bulat",
          path: ["options", index, "score"],
        });
      }
    });
  });

const riskLevelSchema = z
  .object({
    name: z.string().min(1, "Nama level wajib diisi").max(100, "Maksimal 100 karakter"),
    min_score: integerString,
    max_score: optionalIntegerString,
    color_hex: z
      .string()
      .min(1, "Warna wajib diisi")
      .max(7, "Maksimal 7 karakter")
      .regex(/^#[0-9A-Fa-f]{6}$/, "Format warna harus #RRGGBB"),
    recommendation: z.string().min(1, "Rekomendasi wajib diisi"),
  })
  .superRefine((data, ctx) => {
    if (!data.max_score?.trim()) return;
    if (Number(data.max_score) < Number(data.min_score)) {
      ctx.addIssue({
        code: "custom",
        message: "Skor maksimum harus lebih besar atau sama dengan skor minimum",
        path: ["max_score"],
      });
    }
  });

export const questionnaireSchema = z.object({
  title: z.string().min(1, "Judul kuesioner wajib diisi").max(255, "Maksimal 255 karakter"),
  description: z.string().optional(),
  is_active: z.boolean(),
  questions: z.array(questionSchema).min(1, "Kuesioner minimal punya 1 pertanyaan"),
  risk_levels: z.array(riskLevelSchema).min(1, "Kuesioner minimal punya 1 level risiko"),
});

export type QuestionnaireInput = z.infer<typeof questionnaireSchema>;

export function defaultOption() {
  return { label: "", score: "0", is_danger_sign: false };
}

export function defaultQuestion(): QuestionnaireInput["questions"][number] {
  return {
    text: "",
    help_text: "",
    type: "single_choice",
    is_required: true,
    group_label: "",
    options: [defaultOption()],
  };
}

export function defaultRiskLevel(): QuestionnaireInput["risk_levels"][number] {
  return { name: "", min_score: "0", max_score: "", color_hex: "#E11D48", recommendation: "" };
}

export function toQuestionnaireFormValues(questionnaire?: AdminQuestionnaire): QuestionnaireInput {
  if (!questionnaire) {
    return {
      title: "",
      description: "",
      is_active: false,
      questions: [defaultQuestion()],
      risk_levels: [defaultRiskLevel()],
    };
  }

  return {
    title: questionnaire.title,
    description: questionnaire.description ?? "",
    is_active: questionnaire.is_active,
    questions: questionnaire.questions.map((question) => ({
      text: question.text,
      help_text: question.help_text ?? "",
      type: question.type,
      is_required: question.is_required,
      group_label: question.group_label ?? "",
      options: question.options.map((option) => ({
        label: option.label,
        score: String(option.score),
        is_danger_sign: option.is_danger_sign,
      })),
    })),
    risk_levels: questionnaire.risk_levels.map((level) => ({
      name: level.name,
      min_score: String(level.min_score),
      max_score: level.max_score == null ? "" : String(level.max_score),
      color_hex: level.color_hex,
      recommendation: level.recommendation,
    })),
  };
}

/** Payload persis bentuk `AdminQuestionnaireRequest::rules()` di backend. */
export type QuestionnairePayload = {
  title: string;
  description?: string;
  is_active: boolean;
  questions: {
    text: string;
    help_text?: string;
    type: QuestionType;
    is_required: boolean;
    group_label?: string;
    options?: { label: string; score: number; is_danger_sign: boolean }[];
  }[];
  risk_levels: {
    name: string;
    min_score: number;
    max_score: number | null;
    color_hex: string;
    recommendation: string;
  }[];
};

export function toQuestionnairePayload(values: QuestionnaireInput): QuestionnairePayload {
  return {
    title: values.title,
    description: values.description?.trim() ? values.description : undefined,
    is_active: values.is_active,
    questions: values.questions.map((question) => ({
      text: question.text,
      help_text: question.help_text?.trim() ? question.help_text : undefined,
      type: question.type,
      is_required: question.is_required,
      group_label: question.group_label?.trim() ? question.group_label : undefined,
      options:
        question.type === "number"
          ? undefined
          : question.options.map((option) => ({
              label: option.label,
              score: Number(option.score),
              is_danger_sign: option.is_danger_sign,
            })),
    })),
    risk_levels: values.risk_levels.map((level) => ({
      name: level.name,
      min_score: Number(level.min_score),
      max_score: level.max_score?.trim() ? Number(level.max_score) : null,
      color_hex: level.color_hex,
      recommendation: level.recommendation,
    })),
  };
}
