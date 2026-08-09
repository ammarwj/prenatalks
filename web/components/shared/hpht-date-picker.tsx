"use client";

import { useMemo } from "react";

import { DatePicker, type DatePickerProps } from "@/components/ui/date-picker";
import { addDays, addMonths, gestationalAgeText, toIsoDate, today } from "@/lib/date-utils";
import { HPHT_MAX_AGE_DAYS } from "@/lib/validations/pregnancy";

/**
 * Date picker khusus HPHT: batas rentangnya mengikuti `isWithinHphtRange`
 * (lib/validations/pregnancy.ts) sehingga tanggal yang ditolak zod tidak bisa
 * diklik sejak awal. Dipakai di kalkulator dan form profil kehamilan.
 */
export function HphtDatePicker({
  value,
  onChange,
  ...props
}: Omit<DatePickerProps, "min" | "max" | "presets" | "footer">) {
  const { min, max, presets } = useMemo(() => {
    const now = today();

    return {
      // Sengaja 299, bukan 300. `isWithinHphtRange` membandingkan tengah malam
      // tanggal pilihan terhadap `Date.now()` — jam sekarang, bukan tengah malam —
      // sehingga tanggal tepat 300 hari lalu selalu terlewat beberapa jam dan
      // ditolak. Backend berperilaku sama (`after_or_equal:now()->subDays(300)`).
      // Tanggal tertua yang benar-benar diterima keduanya adalah 299 hari lalu.
      min: toIsoDate(addDays(now, -(HPHT_MAX_AGE_DAYS - 1))),
      max: toIsoDate(now),
      presets: [1, 2, 3].map((months) => ({
        label: `${months} bulan lalu`,
        value: toIsoDate(addMonths(now, -months)),
      })),
    };
  }, []);

  const age = value ? gestationalAgeText(value) : null;

  return (
    <DatePicker
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      presets={presets}
      placeholder="Pilih tanggal HPHT"
      footer={
        <p className="text-center text-xs text-muted-foreground">
          {age ? (
            <>
              Perkiraan usia kehamilan <span className="font-semibold text-primary-text">± {age}</span>
            </>
          ) : (
            "Pilih tanggal untuk melihat perkiraan usia kehamilan"
          )}
        </p>
      }
      {...props}
    />
  );
}
