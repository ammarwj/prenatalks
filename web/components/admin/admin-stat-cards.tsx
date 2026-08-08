import type { LucideIcon } from "lucide-react";
import { ClipboardList, FileText, ShieldCheck, Users } from "lucide-react";

import type { AdminStats } from "@/lib/types";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accentClassName,
}: {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  accentClassName: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-white p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${accentClassName}`}>
          <Icon className="size-5" />
        </span>
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold tabular-nums text-foreground">
        {value.toLocaleString("id-ID")}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

/**
 * Kartu statistik + distribusi level risiko — PRD §9 F-14.
 *
 * Warna batang distribusi diambil dari `color_hex` tiap level (dikonfigurasi
 * Super Admin), sama seperti `RiskLevelBadge` — bukan token Tailwind tetap.
 */
export function AdminStatCards({ stats }: { stats: AdminStats }) {
  const totalAssessments = stats.risk_distribution.reduce((sum, level) => sum + level.count, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pengguna Terdaftar"
          value={stats.users.total}
          hint={`${stats.users.new_this_month} baru bulan ini · ${stats.users.active} aktif`}
          icon={Users}
          accentClassName="bg-primary-soft text-primary-text"
        />
        <StatCard
          label="Cek Risiko Bulan Ini"
          value={stats.assessments.this_month}
          hint={`${stats.assessments.total} total · ${stats.assessments.with_danger_sign} dengan tanda bahaya`}
          icon={ShieldCheck}
          accentClassName="bg-brand-teal-soft text-brand-teal-text"
        />
        <StatCard
          label="Konten Terbit"
          value={
            stats.content.articles_published +
            stats.content.videos_published +
            stats.content.faqs_published
          }
          hint={`${stats.content.articles_published} artikel · ${stats.content.videos_published} video · ${stats.content.faqs_published} FAQ`}
          icon={FileText}
          accentClassName="bg-brand-purple-soft text-brand-purple"
        />
        <StatCard
          label="Respon Form"
          value={stats.form_responses.total}
          hint={`${stats.form_responses.this_month} bulan ini · ${stats.form_responses.open_forms} form dibuka`}
          icon={ClipboardList}
          accentClassName="bg-feature-blue-soft text-feature-blue"
        />
      </div>

      <section className="rounded-3xl border border-border bg-white p-5 shadow-soft sm:p-6">
        <h2 className="font-display text-base font-bold text-foreground">Distribusi Level Risiko</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dari seluruh cek risiko yang sudah selesai.
        </p>

        {stats.risk_distribution.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Belum ada kuesioner aktif atau belum ada hasil cek risiko.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {stats.risk_distribution.map((level) => {
              const percent = totalAssessments === 0 ? 0 : Math.round((level.count / totalAssessments) * 100);

              return (
                <li key={level.id}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-semibold text-foreground">{level.name}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {level.count} ({percent}%)
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${percent}%`, backgroundColor: level.color_hex }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
