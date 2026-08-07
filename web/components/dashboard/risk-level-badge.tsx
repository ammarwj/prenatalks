import type { RiskLevel } from "@/lib/types";

/**
 * Warna badge berasal dari `risk_level.color_hex` yang dikonfigurasi admin
 * (bukan token Tailwind tetap) — lihat AdminRiskLevelResource di backend.
 */
export function RiskLevelBadge({ level }: { level: RiskLevel | null }) {
  if (!level) {
    return (
      <span className="inline-flex w-fit items-center rounded-full bg-muted px-3 py-1 text-sm font-bold text-muted-foreground">
        Belum diklasifikasikan
      </span>
    );
  }

  return (
    <span
      className="inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-bold text-white"
      style={{ backgroundColor: level.color_hex }}
    >
      {level.name}
    </span>
  );
}
