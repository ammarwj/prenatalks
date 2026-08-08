import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { SummaryCard, SummaryEmpty } from "@/components/dashboard/summary-card";
import type { DashboardPendingForm } from "@/lib/types";

function formatDeadline(value: string | null): string | null {
  if (!value) return null;

  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long" });
}

/**
 * Form & survei yang belum diisi (PRD §9 F-13).
 *
 * Semua form dibuka lewat halaman publik `/survei/{slug}` — mesin pengisian
 * yang sama dipakai baik untuk `type=form` maupun `type=survey` (F-06/F-07).
 */
export function PendingFormsCard({ forms }: { forms: DashboardPendingForm[] }) {
  return (
    <SummaryCard
      title="Belum Anda Isi"
      icon={ClipboardList}
      accentClassName="bg-feature-blue-soft text-feature-blue"
      actionHref={forms.length > 0 ? `/survei/${forms[0].slug}` : "/dashboard/persiapan"}
      actionLabel={forms.length > 0 ? "Isi sekarang" : "Lihat persiapan melahirkan"}
    >
      {forms.length === 0 ? (
        <SummaryEmpty>
          Tidak ada form atau survei yang perlu Anda isi saat ini. Terima kasih sudah membantu!
        </SummaryEmpty>
      ) : (
        <ul className="space-y-2">
          {forms.map((form) => {
            const deadline = formatDeadline(form.closes_at);

            return (
              <li key={form.id}>
                <Link
                  href={`/survei/${form.slug}`}
                  className="block rounded-2xl border border-border px-4 py-3 transition-colors hover:bg-muted"
                >
                  <span className="block text-sm font-semibold text-foreground">{form.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {form.type === "survey" ? "Survei" : "Formulir"}
                    {deadline && ` · ditutup ${deadline}`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </SummaryCard>
  );
}
