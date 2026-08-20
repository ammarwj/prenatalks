"use client";

import Image from "next/image";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Pencil, Star, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminTestimonial } from "@/lib/types";

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function TestimonialItem({
  testimonial,
  onEdit,
  onDelete,
}: {
  testimonial: AdminTestimonial;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: testimonial.id,
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
        className="mt-2 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={`Seret untuk mengubah urutan testimoni ${testimonial.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" />
      </button>

      {testimonial.photo_url ? (
        <Image
          src={testimonial.photo_url}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        // Cadangan yang sama seperti di landing page: inisial nama, bukan
        // ikon generik, supaya pratinjaunya jujur terhadap hasil akhirnya.
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-purple-soft font-display font-bold text-brand-purple">
          {initials(testimonial.name)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground">
            {testimonial.name}
            <span className="font-normal text-muted-foreground">, {testimonial.pregnancy_age}</span>
          </p>
          {!testimonial.is_published && <Badge variant="outline">Disembunyikan</Badge>}
        </div>

        <div
          className="mt-1 flex gap-0.5 text-star"
          aria-label={`Rating ${testimonial.rating} dari 5`}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              aria-hidden
              className={cn("size-3.5", i < testimonial.rating ? "fill-current" : "opacity-30")}
            />
          ))}
        </div>

        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onEdit}
          aria-label={`Edit testimoni ${testimonial.name}`}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label={`Hapus testimoni ${testimonial.name}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
