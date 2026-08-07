import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Pregnancy, PregnancyStatus } from "@/lib/types";

const STATUS_LABEL: Record<PregnancyStatus, string> = {
  active: "Aktif",
  completed: "Selesai",
  archived: "Diarsipkan",
};

const STATUS_STYLE: Record<PregnancyStatus, string> = {
  active: "bg-brand-teal-soft text-brand-teal-text",
  completed: "bg-brand-purple-soft text-brand-purple",
  archived: "bg-muted text-muted-foreground",
};

function formatDate(value: string): string {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PregnancyHistoryList({ pregnancies }: { pregnancies: Pregnancy[] }) {
  if (pregnancies.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-base font-bold text-foreground">
        Riwayat Kehamilan Sebelumnya
      </h2>
      <div className="space-y-3">
        {pregnancies.map((pregnancy) => (
          <Card key={pregnancy.id} className="rounded-2xl border border-border">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  HPHT {formatDate(pregnancy.lmp_date)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pregnancy.edd_date ? `HPL ${formatDate(pregnancy.edd_date)}` : "HPL belum dihitung"}
                </p>
              </div>
              <Badge className={`rounded-full border-0 ${STATUS_STYLE[pregnancy.status]}`}>
                {STATUS_LABEL[pregnancy.status]}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
