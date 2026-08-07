import { z } from "zod";

import { isWithinHphtRange } from "@/lib/validations/pregnancy";

export const calculatorSchema = z.object({
  lmp_date: z
    .string()
    .min(1, "HPHT wajib diisi")
    .refine(isWithinHphtRange, "HPHT tidak boleh di masa depan dan tidak lebih dari 300 hari lalu"),
});

export type CalculatorInput = z.infer<typeof calculatorSchema>;
