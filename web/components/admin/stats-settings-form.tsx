"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { apiGet, apiPut, ApiRequestError } from "@/lib/api-client";
import { revalidatePublicCache, STATS_TAG } from "@/lib/public-cache";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { PublicStats, StatKey, StatsSettings } from "@/lib/types";
import {
  statsSettingsSchema,
  toStatsSettingsFormValues,
  toStatsSettingsPayload,
  type StatsSettingsInput,
} from "@/lib/validations/settings";

const CARDS: { key: StatKey; name: keyof StatsSettingsInput; label: string; source: string }[] = [
  {
    key: "mothers",
    name: "labelMothers",
    label: "Kartu 1 · Pengguna",
    source: "Dihitung dari akun aktif berperan pengguna.",
  },
  {
    key: "contents",
    name: "labelContents",
    label: "Kartu 2 · Konten",
    source: "Dihitung dari artikel + video yang sudah terbit (yang terjadwal belum ikut).",
  },
  {
    key: "assessments",
    name: "labelAssessments",
    label: "Kartu 3 · Cek risiko",
    source: "Dihitung dari cek risiko yang berstatus selesai.",
  },
  {
    key: "health_workers",
    name: "labelHealthWorkers",
    label: "Kartu 4 · Tenaga kesehatan",
    source: "Dihitung dari akun aktif berperan tenaga kesehatan.",
  },
];

/**
 * Label kartu statistik landing page (PRD §9 F-01).
 *
 * Yang bisa disunting **hanya labelnya**. Angkanya dihitung backend dari
 * database, jadi tidak ada field untuk mengetiknya — inilah yang membedakan
 * bar ini dari versi lama yang angkanya ("1000+", "200+") sekadar ditulis di
 * kode. Angka berjalan ditampilkan di samping tiap field supaya admin menulis
 * label yang cocok dengan apa yang sebenarnya dihitung.
 */
export function StatsSettingsForm({ initialData }: { initialData: StatsSettings }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<StatsSettingsInput>({
    resolver: zodResolver(statsSettingsSchema),
    defaultValues: toStatsSettingsFormValues(initialData),
  });

  const loadStats = useCallback(async () => {
    try {
      setStats(await apiGet<PublicStats>("/stats"));
    } catch {
      // Pratinjau angka bersifat informatif — formnya tetap bisa dipakai
      // menyunting label meski angkanya gagal dimuat.
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();
  }, [loadStats]);

  async function onSubmit(values: StatsSettingsInput) {
    setServerError(null);
    try {
      const saved = await apiPut<StatsSettings>("/admin/settings", toStatsSettingsPayload(values));
      toast.success("Statistik disimpan");
      reset(toStatsSettingsFormValues(saved));
      await revalidatePublicCache([STATS_TAG], accessToken);
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Gagal menyimpan statistik, coba lagi."
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
        <h2 className="font-display text-lg font-bold text-foreground">Statistik</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Empat angka di bawah hero landing page. Angkanya dihitung langsung dari database dan
          dibulatkan <strong>ke bawah</strong>, jadi tidak bisa (dan tidak perlu) diketik di sini —
          yang Anda atur hanya keterangannya.
        </p>
      </div>

      {serverError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Controller
        name="enabled"
        control={control}
        render={({ field }) => (
          <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 p-4 text-sm text-foreground">
            <Checkbox
              className="mt-0.5"
              checked={field.value}
              onCheckedChange={(next) => field.onChange(next === true)}
            />
            <span>
              Tampilkan bar statistik di landing page
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Matikan selama angkanya masih kecil — menyembunyikannya lebih jujur daripada
                memoles angka yang belum bermakna.
              </span>
            </span>
          </label>
        )}
      />

      {CARDS.map(({ key, name, label, source }) => {
        const stat = stats?.items.find((item) => item.key === key);

        return (
          <FormField
            key={key}
            label={label}
            htmlFor={name}
            error={errors[name]?.message}
            hint={source}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 min-w-24 shrink-0 items-center justify-center rounded-xl bg-brand-purple-soft px-3 font-display font-extrabold tabular-nums text-brand-purple">
                {stat ? stat.display : "—"}
              </span>
              <Input id={name} className="h-11 rounded-xl" {...register(name)} />
            </div>
            {stat && stat.display !== String(stat.value) && (
              <p className="mt-1 text-xs text-muted-foreground">
                Angka sebenarnya {stat.value.toLocaleString("id-ID")}, dibulatkan ke bawah.
              </p>
            )}
          </FormField>
        );
      })}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="rounded-full bg-primary text-white hover:bg-[#EC4899]"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Menyimpan..." : "Simpan Statistik"}
        </Button>
      </div>
    </form>
  );
}
