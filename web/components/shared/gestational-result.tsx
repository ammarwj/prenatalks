import { CalendarHeart } from "lucide-react";

import { CircularProgress } from "@/components/shared/circular-progress";
import { formatLongDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

/**
 * Bahasa visual bersama untuk hasil usia kehamilan.
 *
 * Kalkulator dan kartu ringkasan dashboard menampilkan lima angka yang sama;
 * warna trimester dan kalimat HPL-nya tinggal di sini supaya keduanya tidak
 * pelan-pelan berbeda. Tata letaknya sendiri sengaja tetap berbeda — kalkulator
 * adalah kartu hasil, dashboard adalah banner sambutan.
 */
export const TRIMESTER_STYLE: Record<number, { ring: string; badge: string }> = {
  1: { ring: "var(--brand-teal)", badge: "border-transparent bg-brand-teal-soft text-brand-teal-text" },
  2: { ring: "var(--brand-purple)", badge: "border-transparent bg-brand-purple-soft text-brand-purple" },
  3: { ring: "var(--primary)", badge: "border-transparent bg-primary-soft text-primary-text" },
};

export function trimesterStyle(trimester: number) {
  return TRIMESTER_STYLE[trimester] ?? TRIMESTER_STYLE[1];
}

/**
 * Cincin progres — motif lingkaran turunan logo yang PRD §1.3 tugaskan
 * khusus untuk indikator progres kehamilan.
 */
export function GestationalRing({
  trimester,
  progressPercent,
  weeks,
  display,
  size = 168,
  strokeWidth = 14,
}: {
  trimester: number;
  progressPercent: number;
  weeks: number;
  /** Angka di tengah cincin: persentase (kalkulator) atau minggu (dashboard). */
  display: "percent" | "weeks";
  size?: number;
  strokeWidth?: number;
}) {
  const { ring } = trimesterStyle(trimester);

  return (
    <CircularProgress percent={progressPercent} color={ring} size={size} strokeWidth={strokeWidth}>
      <div className="flex flex-col items-center">
        <span
          className="font-display text-3xl font-extrabold tabular-nums"
          style={{ color: display === "weeks" ? ring : undefined }}
        >
          {display === "percent" ? `${progressPercent}%` : weeks}
        </span>
        <span className="text-xs font-semibold text-muted-foreground">
          {display === "percent" ? "kehamilan" : "minggu"}
        </span>
      </div>
    </CircularProgress>
  );
}

/**
 * Baris HPL. Menangani tiga hal yang sebelumnya cuma benar di satu tempat:
 * hitung mundur, sudah lewat HPL berapa lama, dan penanda HPL manual dari USG.
 */
export function DueDateSummary({
  eddDate,
  daysRemaining,
  daysPastDue,
  eddOverridden,
  className,
}: {
  eddDate: string | null;
  daysRemaining: number;
  daysPastDue: number;
  eddOverridden: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm sm:justify-start",
        className
      )}
    >
      <CalendarHeart className="size-4 shrink-0 text-brand-teal-text" />
      <span className="font-semibold text-foreground">
        HPL {eddDate ? formatLongDate(eddDate.slice(0, 10)) : "—"}
      </span>
      <span className="text-muted-foreground">
        · {daysPastDue > 0 ? `lewat ${daysPastDue} hari` : `${daysRemaining} hari lagi`}
        {eddOverridden && " (disesuaikan manual)"}
      </span>
    </div>
  );
}
