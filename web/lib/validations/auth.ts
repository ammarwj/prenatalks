import { z } from "zod";

/**
 * Aturan password mengikuti PRD F-02: minimal 8 karakter, mengandung huruf dan angka.
 */
const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Password harus mengandung huruf dan angka");

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  phone: z.string().optional(),
  password: passwordSchema,
  agree: z.boolean().refine((v) => v === true, {
    message: "Anda harus menyetujui syarat & kebijakan privasi",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
