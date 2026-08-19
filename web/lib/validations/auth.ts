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

/**
 * Ubah profil sendiri (`PATCH /auth/me`). Email tidak ada di sini: mengganti
 * alamat menuntut verifikasi ulang, jadi backend pun tidak menerimanya.
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(150, "Nama maksimal 150 karakter"),
  phone: z.string().max(20, "Nomor telepon maksimal 20 karakter").optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Ganti kata sandi dari dalam sesi (`POST /auth/change-password`). */
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Kata sandi saat ini wajib diisi"),
    password: passwordSchema,
    password_confirmation: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["password_confirmation"],
  })
  .refine((values) => values.password !== values.current_password, {
    message: "Kata sandi baru harus berbeda dari kata sandi saat ini",
    path: ["password"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
