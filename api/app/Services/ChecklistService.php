<?php

namespace App\Services;

use App\Models\ChecklistItem;
use App\Models\User;
use App\Models\UserChecklistProgress;
use Illuminate\Support\Collection;

/**
 * Menyusun checklist persiapan melahirkan seorang pengguna — PRD §9 F-11.
 *
 * Template item dan progres pengguna disimpan terpisah lalu digabung di sini,
 * bukan disalin ke tiap pengguna saat item dibuat. Itulah yang membuat item
 * baru dari admin otomatis muncul tanpa menghapus progres yang sudah ada:
 * item tanpa baris progres cukup dianggap belum tercentang.
 *
 * Dipakai juga oleh kartu "progres checklist" di dashboard pengguna (F-13).
 */
class ChecklistService
{
    /**
     * @return array{groups: list<array<string, mixed>>, summary: array<string, int>}
     */
    public function forUser(User $user): array
    {
        $items = ChecklistItem::query()->active()->ordered()->get();

        /** @var Collection<int, UserChecklistProgress> $progress */
        $progress = UserChecklistProgress::query()
            ->where('user_id', $user->id)
            ->whereNotNull('checklist_item_id')
            ->get()
            ->keyBy('checklist_item_id');

        $groups = [];

        foreach (ChecklistItem::GROUPS as $groupName) {
            $groupItems = $items
                ->where('group_name', $groupName)
                ->map(fn (ChecklistItem $item) => $this->templateItem($item, $progress->get($item->id)))
                ->values()
                ->all();

            // Kelompok kosong tetap ditampilkan supaya pengguna melihat lima
            // kelompok yang dijanjikan PRD, meski admin belum mengisi salah satu.
            $groups[] = $this->group($groupName, $groupItems, isCustom: false);
        }

        $customItems = UserChecklistProgress::query()
            ->where('user_id', $user->id)
            ->custom()
            ->orderBy('id')
            ->get()
            ->map(fn (UserChecklistProgress $row) => $this->customItem($row))
            ->all();

        $groups[] = $this->group(ChecklistItem::CUSTOM_GROUP, $customItems, isCustom: true);

        return [
            'groups' => $groups,
            'summary' => $this->summarize(array_merge(...array_column($groups, 'items'))),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @return array<string, mixed>
     */
    private function group(string $name, array $items, bool $isCustom): array
    {
        return [
            'name' => $name,
            'is_custom' => $isCustom,
            'items' => $items,
            ...$this->summarize($items),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @return array{total: int, checked: int, progress_percent: int}
     */
    private function summarize(array $items): array
    {
        $total = count($items);
        $checked = count(array_filter($items, fn (array $item) => $item['is_checked']));

        return [
            'total' => $total,
            'checked' => $checked,
            'progress_percent' => $total === 0 ? 0 : (int) round($checked / $total * 100),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function templateItem(ChecklistItem $item, ?UserChecklistProgress $progress): array
    {
        return [
            // `id` adalah checklist_items.id — nilai yang dipakai klien untuk
            // `PATCH /checklist/{itemId}` (PRD §11.2).
            'id' => $item->id,
            'type' => 'template',
            'title' => $item->title,
            'description' => $item->description,
            'is_checked' => (bool) $progress?->is_checked,
            'checked_at' => $progress?->checked_at,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function customItem(UserChecklistProgress $row): array
    {
        return [
            // Item pribadi tidak punya checklist_items.id, jadi `id`-nya adalah
            // id baris progres — dialamatkan lewat `/checklist/custom/{id}`.
            'id' => $row->id,
            'type' => 'custom',
            'title' => $row->custom_title,
            'description' => null,
            'is_checked' => $row->is_checked,
            'checked_at' => $row->checked_at,
        ];
    }
}
