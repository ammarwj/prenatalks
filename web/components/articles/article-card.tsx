import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";

import type { ArticleSummary } from "@/lib/types";

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <Link
      href={`/artikel/${article.slug}`}
      className="group block overflow-hidden rounded-3xl border border-border bg-white shadow-soft transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {article.cover_url ? (
          <Image
            src={article.cover_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" />
          </div>
        )}
      </div>
      <div className="space-y-2 p-5">
        {article.category && (
          <span className="text-xs font-semibold uppercase tracking-wide text-primary-text">
            {article.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 font-display text-base font-bold text-foreground">{article.title}</h3>
        {article.excerpt && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
        )}
        {article.reading_minutes && (
          <p className="text-xs text-muted-foreground">{article.reading_minutes} menit baca</p>
        )}
      </div>
    </Link>
  );
}
