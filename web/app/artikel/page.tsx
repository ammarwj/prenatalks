import { ArticleCard } from "@/components/articles/article-card";
import { ArticleFilters } from "@/components/articles/article-filters";
import { ArticlePagination } from "@/components/articles/article-pagination";
import { PublicPageHeader } from "@/components/shared/public-page-header";
import { apiServerGet } from "@/lib/api-server";
import type { ArticleSummary, Category } from "@/lib/types";

export const metadata = {
  title: "Artikel — PrenaTalks",
  description: "Artikel edukasi kehamilan, persalinan, dan pengasuhan berbasis bukti ilmiah.",
};

type Params = Record<string, string | undefined>;

export default async function ArticleListPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;

  const query = new URLSearchParams();
  if (params.life_stage) query.set("life_stage", params.life_stage);
  if (params.category) query.set("category", params.category);
  if (params.trimester) query.set("trimester", params.trimester);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", params.page);

  const [{ data: articles, meta }, { data: categories }] = await Promise.all([
    apiServerGet<ArticleSummary[]>(`/articles?${query.toString()}`),
    apiServerGet<Category[]>("/categories?type=article"),
  ]);

  const currentPage = Number(params.page ?? 1);
  const perPage = Number(meta?.per_page ?? 12);
  const total = Number(meta?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="min-h-screen bg-muted/40">
      <PublicPageHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">Artikel</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Informasi kehamilan, persalinan, dan pengasuhan yang mudah dipahami — disusun bersama
            tenaga kesehatan dan mengacu sumber ilmiah.
          </p>
        </div>

        <div className="mb-8">
          <ArticleFilters categories={categories ?? []} />
        </div>

        {!articles || articles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center text-sm text-muted-foreground">
            Tidak ada artikel yang cocok dengan filter ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        <div className="mt-10">
          <ArticlePagination currentPage={currentPage} totalPages={totalPages} searchParams={params} />
        </div>
      </main>
    </div>
  );
}
