"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPut, ApiRequestError } from "@/lib/api-client";
import { PUBLIC_SETTINGS_TAG, revalidatePublicCache } from "@/lib/public-cache";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { ContactSettings } from "@/lib/types";
import {
  contactSettingsSchema,
  toContactSettingsFormValues,
  toContactSettingsPayload,
  type ContactSettingsInput,
  type ContactSettingsOutput,
} from "@/lib/validations/settings";

/**
 * Kontak yang tampil di footer (PRD §9 F-01). Sebelumnya ditulis mati di
 * `components/shared/footer.tsx`, termasuk nomor telepon contoh dari mockup
 * yang tidak bisa dihubungi siapa pun.
 */
export function ContactSettingsForm({ initialData }: { initialData: ContactSettings }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ContactSettingsInput, unknown, ContactSettingsOutput>({
    resolver: zodResolver(contactSettingsSchema),
    defaultValues: toContactSettingsFormValues(initialData),
  });

  async function onSubmit(values: ContactSettingsOutput) {
    setServerError(null);
    try {
      const saved = await apiPut<ContactSettings>(
        "/admin/settings",
        toContactSettingsPayload(values)
      );
      toast.success("Kontak disimpan");
      reset(toContactSettingsFormValues(saved));
      await revalidatePublicCache([PUBLIC_SETTINGS_TAG], accessToken);
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Gagal menyimpan kontak, coba lagi."
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
        <h2 className="font-display text-lg font-bold text-foreground">Kontak</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tampil di kolom &quot;Kontak&quot; pada footer. Baris yang dikosongkan otomatis
          disembunyikan — lebih baik daripada memajang kontak yang tidak bisa dihubungi.
        </p>
      </div>

      {serverError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <FormField
        label="Nomor telepon"
        htmlFor="phone"
        error={errors.phone?.message}
        hint="Ditampilkan sebagai tautan yang bisa langsung ditelepon dari ponsel."
      >
        <div className="relative">
          <Phone className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="phone" className="h-11 rounded-xl pl-10" {...register("phone")} />
        </div>
      </FormField>

      <FormField label="Alamat email" htmlFor="email" error={errors.email?.message}>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" type="email" className="h-11 rounded-xl pl-10" {...register("email")} />
        </div>
      </FormField>

      <FormField
        label="Lokasi"
        htmlFor="address"
        error={errors.address?.message}
        hint="Mis. Gresik, Jawa Timur."
      >
        <div className="relative">
          <MapPin className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="address" className="h-11 rounded-xl pl-10" {...register("address")} />
        </div>
      </FormField>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="rounded-full bg-primary text-white hover:bg-[#EC4899]"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Menyimpan..." : "Simpan Kontak"}
        </Button>
      </div>
    </form>
  );
}
