<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminChecklistItemRequest;
use App\Http\Resources\Admin\AdminChecklistItemResource;
use App\Models\ChecklistItem;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Kelola template checklist persiapan — admin/super_admin
 * (PRD §8 `/admin/checklist`, §9 F-11, §5 RBAC).
 */
class ChecklistItemController extends Controller
{
    use ApiResponse;

    public function index()
    {
        return $this->success(
            AdminChecklistItemResource::collection($this->ordered()),
            meta: ['groups' => ChecklistItem::GROUPS]
        );
    }

    public function store(AdminChecklistItemRequest $request)
    {
        $data = $request->validated();

        $item = ChecklistItem::create([
            ...$data,
            'is_active' => $data['is_active'] ?? true,
            'order_index' => $this->nextOrderIndex($data['group_name']),
        ]);

        return $this->success(new AdminChecklistItemResource($item), 'Item checklist dibuat', status: 201);
    }

    public function show(ChecklistItem $checklistItem)
    {
        return $this->success(new AdminChecklistItemResource($checklistItem));
    }

    public function update(AdminChecklistItemRequest $request, ChecklistItem $checklistItem)
    {
        $data = $request->validated();

        // Pindah kelompok berarti `order_index` lama tidak lagi bermakna —
        // taruh di akhir kelompok tujuan agar tidak menyelip di posisi acak.
        if ($data['group_name'] !== $checklistItem->group_name) {
            $data['order_index'] = $this->nextOrderIndex($data['group_name']);
        }

        $checklistItem->update([
            ...$data,
            'is_active' => $data['is_active'] ?? false,
        ]);

        return $this->success(new AdminChecklistItemResource($checklistItem->fresh()), 'Item checklist diperbarui');
    }

    /**
     * Menghapus item template ikut menghapus progres pengguna atasnya
     * (`cascadeOnDelete`). Untuk menyembunyikan item tanpa kehilangan progres,
     * gunakan `is_active = false`.
     */
    public function destroy(ChecklistItem $checklistItem)
    {
        $checklistItem->delete();

        return $this->success(null, 'Item checklist dihapus');
    }

    /**
     * Persist urutan hasil drag & drop. Urutan hanya berarti di dalam satu
     * kelompok, jadi payload menyertakan `group_name` dan seluruh ID kelompok
     * itu dalam urutan akhirnya.
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'group_name' => ['required', 'string', Rule::in(ChecklistItem::GROUPS)],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:checklist_items,id'],
        ]);

        $belongToGroup = ChecklistItem::whereIn('id', $validated['ids'])
            ->where('group_name', $validated['group_name'])
            ->count();

        if ($belongToGroup !== count($validated['ids'])) {
            return $this->error('Sebagian item bukan milik kelompok yang dikirim', [
                'ids' => ['Semua item harus berasal dari kelompok yang sama'],
            ]);
        }

        DB::transaction(function () use ($validated) {
            foreach (array_values($validated['ids']) as $index => $id) {
                ChecklistItem::where('id', $id)->update(['order_index' => ($index + 1) * 10]);
            }
        });

        return $this->success(
            AdminChecklistItemResource::collection($this->ordered()),
            'Urutan item checklist diperbarui'
        );
    }

    /**
     * Seluruh item (termasuk yang nonaktif) diurut mengikuti urutan kelompok
     * di `ChecklistItem::GROUPS`, bukan alfabet.
     *
     * @return Collection<int, ChecklistItem>
     */
    private function ordered()
    {
        $items = ChecklistItem::ordered()->get();

        return collect(ChecklistItem::GROUPS)
            ->flatMap(fn (string $group) => $items->where('group_name', $group)->values())
            ->values();
    }

    private function nextOrderIndex(string $groupName): int
    {
        return (int) ChecklistItem::where('group_name', $groupName)->max('order_index') + 10;
    }
}
