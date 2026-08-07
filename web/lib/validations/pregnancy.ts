import { z } from "zod";

export const MEDICAL_HISTORY_OPTIONS = [
  { value: "hipertensi", label: "Hipertensi" },
  { value: "diabetes", label: "Diabetes" },
  { value: "anemia", label: "Anemia" },
  { value: "asma", label: "Asma" },
  { value: "jantung", label: "Penyakit jantung" },
  { value: "lainnya", label: "Lainnya" },
] as const;

export const BLOOD_TYPE_OPTIONS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Tidak tahu",
] as const;

/**
 * Input HTML selalu memberi string; field angka divalidasi sebagai string
 * numerik opsional di sini, lalu dikonversi ke number tepat sebelum dikirim
 * ke API (lihat pregnancy-form.tsx) — pola ini menghindari konflik tipe
 * input/output antara `z.coerce`+`transform` dengan generic resolver RHF.
 */
const optionalNumericString = z
  .string()
  .optional()
  .refine((v) => !v || /^\d+(\.\d+)?$/.test(v), "Harus berupa angka");

/**
 * HPHT tidak boleh di masa depan dan tidak lebih dari 300 hari lalu — PRD F-03 kriteria terima.
 */
function isWithinHphtRange(value: string): boolean {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const diffDays = (Date.now() - date.getTime()) / 86_400_000;

  return diffDays >= 0 && diffDays <= 300;
}

export const pregnancySchema = z.object({
  lmp_date: z
    .string()
    .min(1, "HPHT wajib diisi")
    .refine(isWithinHphtRange, "HPHT tidak boleh di masa depan dan tidak lebih dari 300 hari lalu"),
  gravida: optionalNumericString,
  para: optionalNumericString,
  abortus: optionalNumericString,
  height_cm: optionalNumericString,
  weight_prepregnancy_kg: optionalNumericString,
  weight_current_kg: optionalNumericString,
  blood_type: z.string().optional(),
  medical_history: z.array(z.string()).optional(),
  facility_name: z.string().optional(),
  facility_contact: z.string().optional(),
});

export type PregnancyInput = z.infer<typeof pregnancySchema>;

/** Payload angka sungguhan yang dikirim ke API — lihat catatan di optionalNumericString. */
export type PregnancyPayload = Omit<
  PregnancyInput,
  "gravida" | "para" | "abortus" | "height_cm" | "weight_prepregnancy_kg" | "weight_current_kg"
> & {
  gravida?: number;
  para?: number;
  abortus?: number;
  height_cm?: number;
  weight_prepregnancy_kg?: number;
  weight_current_kg?: number;
};

export function toPregnancyPayload(values: PregnancyInput): PregnancyPayload {
  const toNumber = (v?: string) => (v ? Number(v) : undefined);

  return {
    ...values,
    gravida: toNumber(values.gravida),
    para: toNumber(values.para),
    abortus: toNumber(values.abortus),
    height_cm: toNumber(values.height_cm),
    weight_prepregnancy_kg: toNumber(values.weight_prepregnancy_kg),
    weight_current_kg: toNumber(values.weight_current_kg),
  };
}
