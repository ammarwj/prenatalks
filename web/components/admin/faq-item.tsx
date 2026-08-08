"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminFaq } from "@/lib/types";

export function FaqItem({
  faq,
  onEdit,
  onDelete,
}: {
  faq: AdminFaq;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: faq.id,
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

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {faq.category && (
            <span className="text-xs font-semibold uppercase tracking-wide text-primary-text">
              {faq.category.name}
            </span>
          )}
          <Badge variant={faq.is_published ? "default" : "outline"}>
            {faq.is_published ? "Terbit" : "Draf"}
          </Badge>
        </div>
        <p className="mt-1 truncate font-semibold text-foreground">{faq.question}</p>
        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{faq.answer}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit FAQ">
          <Pencil className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Hapus FAQ">
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
