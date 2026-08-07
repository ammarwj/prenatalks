import { Info } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Teks wajib PRD §12.4 — tampil di atas & bawah halaman hasil, kalkulator,
 * dan artikel kesehatan. Jangan diubah tanpa meninjau ulang kepatuhan.
 */
export const RISK_DISCLAIMER_TEXT =
  "Informasi di PrenaTalks bersifat edukatif dan bukan pengganti pemeriksaan, diagnosis, atau nasihat tenaga kesehatan. Hasil cek risiko adalah penilaian mandiri berbasis skor, bukan diagnosis. Bila Anda mengalami tanda bahaya seperti perdarahan, nyeri hebat, demam tinggi, atau berkurangnya gerakan janin, segera hubungi bidan, dokter, atau fasilitas kesehatan terdekat.";

export function RiskDisclaimer() {
  return (
    <Alert className="rounded-xl border-border bg-muted/60">
      <Info className="size-4 text-muted-foreground" />
      <AlertDescription className="text-xs text-muted-foreground sm:text-sm">
        {RISK_DISCLAIMER_TEXT}
      </AlertDescription>
    </Alert>
  );
}
