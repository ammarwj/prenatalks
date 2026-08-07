import type { RiskAssessmentSummary } from "@/lib/types";

const WIDTH = 600;
const HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 28, left: 32 };

/**
 * Grafik tren skor antarwaktu (PRD §9 F-05, kriteria terima) — SVG buatan
 * tangan, bukan library chart, supaya tidak menambah dependency hanya untuk
 * satu grafik garis sederhana.
 */
export function RiskScoreTrendChart({ history }: { history: RiskAssessmentSummary[] }) {
  const points = [...history].reverse(); // riwayat datang terbaru dulu; grafik dibaca kiri ke kanan

  const scores = points.map((p) => p.total_score);
  const minScore = Math.min(...scores, 0);
  const maxScore = Math.max(...scores, 10);

  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const x = (i: number) =>
    points.length === 1
      ? PADDING.left + innerWidth / 2
      : PADDING.left + (i / (points.length - 1)) * innerWidth;
  const y = (score: number) =>
    PADDING.top + innerHeight - ((score - minScore) / (maxScore - minScore || 1)) * innerHeight;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.total_score)}`).join(" ");

  return (
    <figure>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Grafik tren skor cek risiko dari waktu ke waktu"
        className="w-full"
      >
        <line
          x1={PADDING.left}
          y1={PADDING.top + innerHeight}
          x2={WIDTH - PADDING.right}
          y2={PADDING.top + innerHeight}
          stroke="currentColor"
          strokeOpacity={0.15}
        />
        <path d={linePath} fill="none" stroke="currentColor" strokeOpacity={0.35} strokeWidth={2} />
        {points.map((p, i) => (
          <g key={p.id}>
            <circle cx={x(i)} cy={y(p.total_score)} r={5} fill={p.risk_level?.color_hex ?? "#6B7280"} />
            <text
              x={x(i)}
              y={y(p.total_score) - 10}
              textAnchor="middle"
              fontSize={11}
              fill="currentColor"
            >
              {p.total_score}
            </text>
            <text
              x={x(i)}
              y={PADDING.top + innerHeight + 18}
              textAnchor="middle"
              fontSize={9.5}
              fill="currentColor"
              opacity={0.6}
            >
              {new Date(p.completed_at).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
              })}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="sr-only">
        Grafik menunjukkan total skor cek risiko pada setiap tanggal pengisian, dari yang paling
        lama ke yang paling baru.
      </figcaption>
    </figure>
  );
}
