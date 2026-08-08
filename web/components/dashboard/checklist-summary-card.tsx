import { ListChecks } from "lucide-react";

import { SummaryCard, SummaryEmpty } from "@/components/dashboard/summary-card";
import { Progress } from "@/components/ui/progress";
import type { ChecklistProgressSummary } from "@/lib/types";

/** Progres checklist persiapan melahirkan (PRD §9 F-13, data dari F-11). */
export function ChecklistSummaryCard({ checklist }: { checklist: ChecklistProgressSummary }) {
  const isComplete = checklist.total > 0 && checklist.checked === checklist.total;

  return (
    <SummaryCard
      title="Persiapan Melahirkan"
      icon={ListChecks}
      accentClassName="bg-brand-teal-soft text-brand-teal-text"
      actionHref="/dashboard/persiapan"
      actionLabel={checklist.checked === 0 ? "Mulai checklist" : "Lanjutkan checklist"}
    >
      {checklist.total === 0 ? (
        <SummaryEmpty>
          Checklist persiapan belum tersedia. Kami akan memberi tahu Anda begitu daftarnya siap.
        </SummaryEmpty>
      ) : (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-display text-3xl font-extrabold tabular-nums text-foreground">
              {checklist.progress_percent}%
            </span>
            <span
              className={
                isComplete
                  ? "text-sm font-semibold text-brand-teal-text"
                  : "text-sm font-semibold text-muted-foreground"
              }
            >
              {checklist.checked}/{checklist.total} item
            </span>
          </div>
          <Progress
            value={checklist.progress_percent}
            aria-label="Progres persiapan melahirkan"
            className={`h-2 ${isComplete ? "**:data-[slot=progress-indicator]:bg-success" : ""}`}
          />
          <p className="text-sm text-muted-foreground">
            {isComplete
              ? "Semua persiapan sudah tercentang. Luar biasa!"
              : `Tinggal ${checklist.total - checklist.checked} item lagi yang perlu Anda siapkan.`}
          </p>
        </div>
      )}
    </SummaryCard>
  );
}
