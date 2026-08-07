import type { FormResponseDistribution } from "@/lib/types";

/**
 * Distribusi jawaban per field pilihan (PRD §9 F-07, "distribusi jawaban per
 * pertanyaan"). Satu seri (jumlah jawaban), jadi tidak perlu legenda — warna
 * tunggal (primary) sudah cukup, label nilai ditaruh langsung di ujung bar.
 */
export function ResponseDistributionChart({
  distribution,
}: {
  distribution: FormResponseDistribution;
}) {
  const entries = Object.entries(distribution.counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, count]) => count), 1);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-white p-4">
      <h3 className="text-sm font-semibold text-foreground">{distribution.label}</h3>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">Belum ada jawaban</p>
      ) : (
        <ul className="space-y-2.5" aria-label={`Distribusi jawaban — ${distribution.label}`}>
          {entries.map(([option, count]) => {
            const widthPercent = Math.round((count / max) * 100);
            const share = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <li key={option} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-foreground">{option}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {count} · {share}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted" role="presentation">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
