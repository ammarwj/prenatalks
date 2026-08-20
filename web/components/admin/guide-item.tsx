"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminGuide } from "@/lib/types";

export function GuideItem({
  guide,
  step,
  onEdit,
  onDelete,
}: {
  guide: AdminGuide;
  /**
   * Nomor langkah seperti yang akan dilihat pembaca. Dihitung dari posisi
   * dalam daftar, bukan dari `order_index`, supaya angkanya tetap 1, 2, 3
   * meski jarak `order_index` antar-baris tidak rata.
   */
  step: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: guide.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4 shadow-soft"
    >
      <button
        type="button"
        className="mt-1 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Seret untuk mengubah urutan"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" />
      </button>

      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-purple-soft text-xs font-bold text-brand-purple">
        {step}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={guide.is_published ? "default" : "outline"}>
            {guide.is_published ? "Terbit" : "Draf"}
          </Badge>
        </div>
        <p className="mt-1 truncate font-semibold text-foreground">{guide.title}</p>
        {guide.summary && (
          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{guide.summary}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit panduan">
          <Pencil className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Hapus panduan">
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
