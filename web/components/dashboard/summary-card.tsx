import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

/**
 * Kerangka kartu dashboard (PRD §9 F-13) — judul, ikon dalam lingkaran
 * (motif turunan logo, PRD §1.3), isi, dan satu tautan aksi di bawah.
 */
export function SummaryCard({
  title,
  icon: Icon,
  accentClassName = "bg-primary-soft text-primary-text",
  actionHref,
  actionLabel,
  className = "",
  children,
}: {
  title: string;
  icon: LucideIcon;
  accentClassName?: string;
  actionHref: string;
  actionLabel: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`flex flex-col rounded-3xl border border-border bg-white p-5 shadow-soft sm:p-6 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${accentClassName}`}>
          <Icon className="size-5" />
        </span>
        <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
      </div>

      <div className="mt-4 flex-1">{children}</div>

      <Link
        href={actionHref}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-text hover:underline"
      >
        {actionLabel}
        <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}

/** Keadaan kosong seragam untuk kartu yang datanya belum ada. */
export function SummaryEmpty({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>;
}
