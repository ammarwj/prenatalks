"use client";

import Image from "next/image";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Pencil, Trash2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminTeamMember } from "@/lib/types";

export function TeamMemberItem({
  member,
  onEdit,
  onDelete,
}: {
  member: AdminTeamMember;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: member.id,
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
        aria-label={`Seret untuk mengubah urutan ${member.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" />
      </button>

      {member.photo_url ? (
        <Image
          src={member.photo_url}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-purple-soft text-brand-purple">
          <Users className="size-5" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground">{member.name}</p>
          {!member.is_published && <Badge variant="outline">Disembunyikan</Badge>}
        </div>
        <p className="text-sm text-primary-text">{member.role_title}</p>
        {member.credential && (
          <p className="mt-0.5 text-xs font-semibold text-brand-purple">{member.credential}</p>
        )}
        {member.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{member.description}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onEdit}
          aria-label={`Edit ${member.name}`}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label={`Hapus ${member.name}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
