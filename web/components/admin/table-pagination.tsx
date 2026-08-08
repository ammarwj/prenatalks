"use client";

import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/lib/types";

/**
 * Paginasi tabel admin (PRD §9 F-14). Berbeda dari `ArticlePagination` yang
 * berbasis tautan `<Link>` untuk halaman publik ber-ISR: tabel admin memuat
 * data lewat klien, jadi kontrolnya memanggil balik, bukan menavigasi.
 */
export function TablePagination({
  meta,
  onPageChange,
  disabled = false,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (meta.total === 0) return null;

  const from = (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-sm text-muted-foreground">
        Menampilkan <span className="font-semibold tabular-nums text-foreground">{from}</span>–
        <span className="font-semibold tabular-nums text-foreground">{to}</span> dari{" "}
        <span className="font-semibold tabular-nums text-foreground">{meta.total}</span>
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}
        >
          Sebelumnya
        </Button>
        <span className="text-sm text-muted-foreground">
          Halaman {meta.current_page} dari {meta.last_page}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || meta.current_page >= meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
}
