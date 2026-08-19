"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useDashboardStore } from "@/lib/stores/dashboard-store";
import { cn } from "@/lib/utils";

/**
 * Usia kehamilan di dalam kerangka navigasi — bukan di dalam salah satu
 * halaman.
 *
 * Ini pertanyaan yang dipunyai penggunanya setiap hari ("saya di minggu
 * berapa?"), tapi jawabannya selama ini hanya hidup di `PregnancySummaryCard`
 * dan lenyap begitu ia pindah halaman. Ditaruh di sini, navigasi menjawab dua
 * hal sekaligus: di mana saya di aplikasi, dan di mana saya di kehamilan ini.
 *
 * Saat data kehamilan belum diisi, chip berubah jadi ajakan mengisinya —
 * ruang kosong adalah tempat paling wajar untuk meminta data yang membuat
 * seluruh sisa aplikasi lebih akurat.
 */
export function GestationalChip({ variant }: { variant: "card" | "inline" }) {
  const overview = useDashboardStore((state) => state.overview);
  const isLoading = useDashboardStore((state) => state.isLoading);
  const isCard = variant === "card";

  // Diam selama pemuatan pertama. Skeleton di sini akan berkedip di setiap
  // perpindahan halaman, dan kerangka navigasi bukan tempat untuk berkedip.
  if (isLoading) {
    return null;
  }

  const pregnancy = overview?.pregnancy;

  if (!pregnancy) {
    return (
      <Link
        href="/dashboard/kehamilan"
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-2xl text-xs font-semibold text-muted-foreground transition-colors hover:text-primary-text",
          isCard ? "w-full border border-dashed border-border px-3 py-2.5" : "px-1"
        )}
      >
        Lengkapi data kehamilan
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    );
  }

  const { weeks, days } = pregnancy.gestational_age;
  const percent = Math.min(100, Math.max(0, pregnancy.progress_percent));

  if (!isCard) {
    return (
      <span className="flex items-baseline gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary-text tabular-nums">
        {weeks} mg {days} hr
        <span className="font-semibold text-muted-foreground">TM{pregnancy.trimester}</span>
      </span>
    );
  }

  return (
    <div className="rounded-2xl bg-primary-soft px-3.5 py-3">
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        Usia Kehamilan
      </p>
      <p className="mt-0.5 font-display text-lg leading-tight font-extrabold text-foreground tabular-nums">
        {weeks} mg {days} hr
      </p>

      {/* Bilah progres menuju HPL — konteks yang membuat angka di atasnya
          punya arti tanpa menambah satu baris teks pun. */}
      <div
        className="mt-2 h-1 overflow-hidden rounded-full bg-white"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Trimester ${pregnancy.trimester}, ${percent}% menuju HPL`}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>

      <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">
        Trimester {pregnancy.trimester} · {percent}% menuju HPL
      </p>
    </div>
  );
}
