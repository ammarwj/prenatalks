import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import type { ArticleSummary, DashboardPregnancy } from "@/lib/types";

/**
 * Tiga artikel rekomendasi sesuai trimester berjalan (PRD §9 F-13).
 *
 * Backend melengkapi kekurangannya dengan artikel terbaru bila trimester ini
 * belum punya tiga artikel, jadi kartu ini tidak perlu menangani jumlah yang
 * kurang — cukup keadaan benar-benar kosong.
 */
export function RecommendedArticlesCard({
  articles,
  pregnancy,
}: {
  articles: ArticleSummary[];
  pregnancy: DashboardPregnancy | null;
}) {
  return (
    <section className="rounded-3xl border border-border bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-text">
            <BookOpen className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-foreground">Bacaan untuk Anda</h2>
            <p className="text-sm text-muted-foreground">
              {pregnancy
                ? `Dipilih sesuai trimester ${pregnancy.trimester}`
                : "Artikel terbaru dari PrenaTalks"}
            </p>
          </div>
        </div>
        <Link
          href="/artikel"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-text hover:underline"
        >
          Semua artikel
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Belum ada artikel yang diterbitkan. Kami sedang menyiapkannya.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {articles.map((article) => (
            <li key={article.id}>
              <Link
                href={`/artikel/${article.slug}`}
                className="flex h-full flex-col rounded-2xl border border-border p-4 transition-colors hover:bg-muted"
              >
                {article.category && (
                  <span className="text-xs font-semibold tracking-wide text-primary-text uppercase">
                    {article.category.name}
                  </span>
                )}
                <span className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">
                  {article.title}
                </span>
                {article.excerpt && (
                  <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {article.excerpt}
                  </span>
                )}
                {article.reading_minutes && (
                  <span className="mt-auto pt-2 text-xs text-muted-foreground">
                    {article.reading_minutes} menit baca
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
