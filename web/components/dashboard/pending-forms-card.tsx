import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { SummaryCard, SummaryEmpty } from "@/components/dashboard/summary-card";
import { formMetaText } from "@/lib/forms";
import type { DashboardPendingForm } from "@/lib/types";

/**
 * Form & survei yang belum diisi (PRD §9 F-13).
 *
 * Semua form dibuka lewat halaman publik `/survei/{slug}` — mesin pengisian
 * yang sama dipakai baik untuk `type=form` maupun `type=survey` (F-06/F-07).
 *
 * Kartu ini memuat paling banyak tiga baris supaya tidak menenggelamkan dua
 * kartu di sebelahnya; daftar lengkapnya ada di `/dashboard/form`.
 */
export function PendingFormsCard({ forms }: { forms: DashboardPendingForm[] }) {
  return (
    <SummaryCard
      title="Belum Anda Isi"
      icon={ClipboardList}
      accentClassName="bg-feature-blue-soft text-feature-blue"
      actionHref="/dashboard/form"
      actionLabel={forms.length > 0 ? "Lihat semua form" : "Buka daftar form"}
    >
      {forms.length === 0 ? (
        <SummaryEmpty>
          Tidak ada form atau survei yang perlu Anda isi saat ini. Terima kasih sudah membantu!
        </SummaryEmpty>
      ) : (
        <ul className="space-y-2">
          {forms.slice(0, 3).map((form) => (
            <li key={form.id}>
              <Link
                href={`/survei/${form.slug}`}
                className="block rounded-2xl border border-border px-4 py-3 transition-colors hover:bg-muted"
              >
                <span className="block text-sm font-semibold text-foreground">{form.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {formMetaText(form)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SummaryCard>
  );
}
