import Link from "next/link";

import { cn } from "@/lib/utils";

export function ArticlePagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(page));
    return `/artikel?${params.toString()}`;
  }

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <nav className="flex items-center justify-center gap-4" aria-label="Navigasi halaman artikel">
      <Link
        href={hrefFor(currentPage - 1)}
        aria-disabled={!canGoPrev}
        tabIndex={canGoPrev ? undefined : -1}
        className={cn(
          "rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted",
          !canGoPrev && "pointer-events-none opacity-40"
        )}
      >
        Sebelumnya
      </Link>
      <span className="text-sm text-muted-foreground">
        Halaman {currentPage} dari {totalPages}
      </span>
      <Link
        href={hrefFor(currentPage + 1)}
        aria-disabled={!canGoNext}
        tabIndex={canGoNext ? undefined : -1}
        className={cn(
          "rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted",
          !canGoNext && "pointer-events-none opacity-40"
        )}
      >
        Berikutnya
      </Link>
    </nav>
  );
}
