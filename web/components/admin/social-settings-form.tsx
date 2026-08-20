"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@/components/shared/social-icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPut, ApiRequestError } from "@/lib/api-client";
import { PUBLIC_SETTINGS_TAG, revalidatePublicCache } from "@/lib/public-cache";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { SocialSettings } from "@/lib/types";
import {
  socialSettingsSchema,
  toSocialSettingsFormValues,
  toSocialSettingsPayload,
  type SocialSettingsInput,
  type SocialSettingsOutput,
} from "@/lib/validations/settings";

/**
 * Empat platform ini yang punya ikonnya di `components/shared/social-icons.tsx`.
 * Daftarnya tetap di kode karena yang dipetakan bukan sekadar teks: tiap baris
 * membawa komponen SVG-nya sendiri, dan itu tidak bisa hidup di database.
 */
const PLATFORMS = [
  { name: "instagramUrl", label: "Instagram", Icon: InstagramIcon, hint: "Mis. instagram.com/prenatalks" },
  { name: "facebookUrl", label: "Facebook", Icon: FacebookIcon, hint: "Mis. facebook.com/prenatalks" },
  { name: "youtubeUrl", label: "YouTube", Icon: YoutubeIcon, hint: "Mis. youtube.com/@prenatalks" },
  { name: "tiktokUrl", label: "TikTok", Icon: TiktokIcon, hint: "Mis. tiktok.com/@prenatalks" },
] as const;

export function SocialSettingsForm({ initialData }: { initialData: SocialSettings }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SocialSettingsInput, unknown, SocialSettingsOutput>({
    resolver: zodResolver(socialSettingsSchema),
    defaultValues: toSocialSettingsFormValues(initialData),
  });

  async function onSubmit(values: SocialSettingsOutput) {
    setServerError(null);
    try {
      const saved = await apiPut<SocialSettings>(
        "/admin/settings",
        toSocialSettingsPayload(values)
      );
      toast.success("Sosial media disimpan");
      // Reset dari respons server supaya tautan yang dilengkapi backend
      // (mis. ditambahi https://) ikut terlihat, dan tombol simpan
      // menonaktifkan diri lagi.
      reset(toSocialSettingsFormValues(saved));
      await revalidatePublicCache([PUBLIC_SETTINGS_TAG], accessToken);
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Gagal menyimpan tautan, coba lagi."
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft"
    >
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Sosial Media</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tampil sebagai ikon di footer. Yang tautannya kosong tidak ditampilkan sama sekali.
        </p>
      </div>

      {serverError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {PLATFORMS.map(({ name, label, Icon, hint }) => (
        <FormField
          key={name}
          label={label}
          htmlFor={name}
          error={errors[name]?.message}
          hint={`${hint} — https:// ditambahkan otomatis.`}
        >
          <div className="relative">
            <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id={name} className="h-11 rounded-xl pl-10" {...register(name)} />
          </div>
        </FormField>
      ))}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="rounded-full bg-primary text-white hover:bg-[#EC4899]"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Menyimpan..." : "Simpan Sosial Media"}
        </Button>
      </div>
    </form>
  );
}
