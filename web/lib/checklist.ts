import type { ChecklistItem, ChecklistOverview, ChecklistProgressSummary } from "@/lib/types";

/**
 * Kunci unik lintas kelompok. `id` item template dan item pribadi berasal dari
 * tabel berbeda, jadi angkanya bisa bertabrakan — tipe ikut jadi bagian kunci.
 */
export function checklistItemKey(item: ChecklistItem): string {
  return `${item.type}-${item.id}`;
}

function summarize(items: ChecklistItem[]): ChecklistProgressSummary {
  const total = items.length;
  const checked = items.filter((item) => item.is_checked).length;

  return {
    total,
    checked,
    progress_percent: total === 0 ? 0 : Math.round((checked / total) * 100),
  };
}

/**
 * Terapkan centang secara optimistis, termasuk menghitung ulang progres
 * kelompok dan total — rumusnya sengaja disamakan dengan `ChecklistService`
 * di backend supaya angka tidak melompat saat respons server tiba.
 */
export function applyChecklistToggle(
  overview: ChecklistOverview,
  target: ChecklistItem,
  isChecked: boolean
): ChecklistOverview {
  const key = checklistItemKey(target);

  const groups = overview.groups.map((group) => {
    const items = group.items.map((item) =>
      checklistItemKey(item) === key
        ? { ...item, is_checked: isChecked, checked_at: isChecked ? new Date().toISOString() : null }
        : item
    );

    return { ...group, items, ...summarize(items) };
  });

  return { groups, summary: summarize(groups.flatMap((group) => group.items)) };
}
