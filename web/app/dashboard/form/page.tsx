"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, ClipboardList } from "lucide-react";

import { CardGridSkeleton } from "@/components/shared/loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formMetaText } from "@/lib/forms";
import { useDashboardStore } from "@/lib/stores/dashboard-store";

/**
 * Daftar form & survei yang perlu diisi — PRD §8 (`/dashboard/form`).
 *
 * Datanya sudah ikut terbawa `GET /dashboard` yang dimuat layout, jadi
 * halaman ini tidak menambah satu permintaan pun. Semua form dibuka lewat
 * `/survei/{slug}`, mesin pengisian yang sama untuk `form` maupun `survey`
 * (F-06/F-07).
 *
 * Yang tampil di sini hanya yang **belum** diisi, dan backend membatasinya
 * lima teratas (`DashboardService::PENDING_FORM_LIMIT`). Riwayat kiriman
 * lama butuh endpoint tersendiri yang belum ada.
 */
export default function DashboardFormPage() {
  const overview = useDashboardStore((state) => state.overview);
  const loadError = useDashboardStore((state) => state.error);

  const forms = overview?.pending_forms ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Form & Survei</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Masukan Anda membantu kami menyesuaikan materi dan layanan. Pengisiannya singkat dan
          bisa dihentikan kapan saja.
        </p>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {overview === null ? (
        !loadError && (
          <CardGridSkeleton count={3} columns={1} lines={2} withIcon withAction label="Memuat daftar form" />
        )
      ) : forms.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-border bg-white p-8 text-center shadow-soft">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-teal-soft text-brand-teal-text">
            <ClipboardCheck className="size-6" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold text-foreground">
            Semua sudah Anda isi
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Tidak ada form atau survei yang menunggu saat ini. Kami akan menampilkannya di sini
            begitu ada yang baru.
          </p>
        </section>
      ) : (
        <ul className="space-y-3">
          {forms.map((form) => (
            <li key={form.id}>
              <Link
                href={`/survei/${form.slug}`}
                className="group flex items-center gap-4 rounded-3xl border border-border bg-white p-5 shadow-soft transition-colors hover:bg-muted/60"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-feature-blue-soft text-feature-blue">
                  <ClipboardList className="size-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-base font-bold text-foreground">
                    {form.title}
                  </h2>
                  <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                    {formMetaText(form)}
                  </p>
                  {form.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {form.description}
                    </p>
                  )}
                </div>

                <ArrowRight className="size-5 shrink-0 text-primary-text transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
