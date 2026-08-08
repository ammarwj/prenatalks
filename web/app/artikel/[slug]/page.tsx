import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, Clock, Share2, User } from "lucide-react";

import { ArticleCard } from "@/components/articles/article-card";
import { PublicPageHeader } from "@/components/shared/public-page-header";
import { apiServerGet } from "@/lib/api-server";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";
import type { Article } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function getArticle(slug: string): Promise<Article | null> {
  const { data, status } = await apiServerGet<Article>(`/articles/${slug}`);
  if (status === 404 || !data) return null;
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Artikel tidak ditemukan — PrenaTalks" };

  const title = article.meta_title || article.title;
  const description = article.meta_description || article.excerpt || undefined;

  return {
    title: `${title} — PrenaTalks`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: article.cover_url ? [article.cover_url] : undefined,
      publishedTime: article.published_at ?? undefined,
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const publishedDate = article.published_at ? new Date(article.published_at) : null;
  const reviewedDate = new Date(article.reviewed_at);
  const shareText = encodeURIComponent(`${article.title} — ${SITE_URL}/artikel/${article.slug}`);
  const sanitizedContent = sanitizeArticleHtml(article.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt ?? undefined,
    image: article.cover_url ? [article.cover_url] : undefined,
    datePublished: article.published_at ?? undefined,
    author: article.author ? { "@type": "Person", name: article.author.name } : undefined,
    publisher: { "@type": "Organization", name: "PrenaTalks" },
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <PublicPageHeader backHref="/artikel" backLabel="Kembali ke Artikel" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <article className="rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-10">
          {article.category && (
            <span className="text-xs font-semibold uppercase tracking-wide text-primary-text">
              {article.category.name}
            </span>
          )}
          <h1 className="mt-2 font-display text-2xl font-extrabold text-foreground sm:text-3xl">
            {article.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {article.author && (
              <span className="inline-flex items-center gap-1.5">
                <User className="size-4" />
                {article.author.name}
              </span>
            )}
            {publishedDate && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-4" />
                {publishedDate.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
            {article.reading_minutes && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" />
                {article.reading_minutes} menit baca
              </span>
            )}
          </div>

          {article.cover_url && (
            <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl">
              <Image
                src={article.cover_url}
                alt={article.title}
                fill
                sizes="(min-width: 768px) 700px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          )}

          <div
            className="prose prose-sm sm:prose-base mt-6 max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          <div className="mt-8 rounded-2xl bg-brand-purple-soft p-4 text-sm text-foreground">
            <p className="font-semibold text-brand-purple">Sumber rujukan</p>
            <p className="mt-1 whitespace-pre-line">{article.source_reference}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Ditinjau terakhir:{" "}
              {reviewedDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-[#EC4899]"
          >
            <Share2 className="size-4" />
            Bagikan ke WhatsApp
          </a>
        </article>

        {article.related.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 font-display text-lg font-bold text-foreground">Artikel Terkait</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {article.related.map((related) => (
                <ArticleCard key={related.id} article={related} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
