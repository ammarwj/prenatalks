"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminChecklistItem } from "@/lib/types";

export function ChecklistItemRow({
  item,
  onEdit,
  onDelete,
}: {
  item: AdminChecklistItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
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
        className="mt-0.5 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={`Seret untuk mengubah urutan ${item.title}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground">{item.title}</p>
          {!item.is_active && <Badge variant="outline">Nonaktif</Badge>}
        </div>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onEdit}
          aria-label={`Edit ${item.title}`}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label={`Hapus ${item.title}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
