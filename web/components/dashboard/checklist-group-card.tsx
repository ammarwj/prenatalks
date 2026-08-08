"use client";

import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { checklistItemKey } from "@/lib/checklist";
import type { ChecklistGroup, ChecklistItem } from "@/lib/types";

/**
 * Satu kelompok checklist dengan progress bar-nya sendiri (PRD §9 F-11).
 */
export function ChecklistGroupCard({
  group,
  pendingKeys,
  onToggle,
  onRemoveCustom,
  footer,
}: {
  group: ChecklistGroup;
  pendingKeys: ReadonlySet<string>;
  onToggle: (item: ChecklistItem, isChecked: boolean) => void;
  onRemoveCustom: (item: ChecklistItem) => void;
  footer?: ReactNode;
}) {
  const isComplete = group.total > 0 && group.checked === group.total;

  return (
    <section className="rounded-3xl border border-border bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-foreground">{group.name}</h2>
        <p
          className={
            isComplete
              ? "text-sm font-semibold text-brand-teal-text"
              : "text-sm font-semibold text-muted-foreground"
          }
        >
          {group.checked}/{group.total} selesai
        </p>
      </div>

      <Progress
        value={group.progress_percent}
        aria-label={`Progres ${group.name}`}
        className={`mt-3 h-2 ${isComplete ? "**:data-[slot=progress-indicator]:bg-success" : ""}`}
      />

      {group.items.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">
          {group.is_custom
            ? "Belum ada item pribadi. Tambahkan hal lain yang ingin Anda siapkan."
            : "Belum ada item pada kelompok ini."}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {group.items.map((item) => {
            const key = checklistItemKey(item);
            const inputId = `checklist-${key}`;
            const isPending = pendingKeys.has(key);

            return (
              <li key={key} className="flex items-start gap-3 py-3">
                <Checkbox
                  id={inputId}
                  checked={item.is_checked}
                  disabled={isPending}
                  onCheckedChange={(next) => onToggle(item, next === true)}
                  className="mt-1 size-5"
                />
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={inputId}
                    className={
                      item.is_checked
                        ? "cursor-pointer text-sm font-medium text-muted-foreground line-through"
                        : "cursor-pointer text-sm font-medium text-foreground"
                    }
                  >
                    {item.title}
                  </label>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
                {item.type === "custom" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    onClick={() => onRemoveCustom(item)}
                    aria-label={`Hapus item pribadi ${item.title}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {footer}
    </section>
  );
}
