import type { MetadataRoute } from "next";

import { apiServerGet } from "@/lib/api-server";
import type { ArticleSummary } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Sitemap otomatis (PRD §9 F-08) — memuat seluruh artikel terbit. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/artikel`, changeFrequency: "daily", priority: 0.8 },
    // Kalkulator adalah halaman pencarian organik utama selain artikel; sisanya
    // halaman publik statis yang sebelumnya tidak pernah masuk sitemap.
    { url: `${SITE_URL}/kalkulator`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/video`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/tentang`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/komunitas`, changeFrequency: "monthly", priority: 0.5 },
  ];

  let page = 1;
  let totalPages = 1;

  do {
    const { data: articles, meta } = await apiServerGet<ArticleSummary[]>(`/articles?page=${page}`, 3600);

    for (const article of articles ?? []) {
      entries.push({
        url: `${SITE_URL}/artikel/${article.slug}`,
        lastModified: article.published_at ?? undefined,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }

    const perPage = Number(meta?.per_page ?? 12);
    const total = Number(meta?.total ?? 0);
    totalPages = Math.max(1, Math.ceil(total / perPage));
    page++;
  } while (page <= totalPages);

  return entries;
}
