<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ChecklistItem;
use App\Models\UserChecklistProgress;
use App\Services\ChecklistService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

/**
 * Checklist persiapan melahirkan milik pengguna — PRD §9 F-11, §11.2.
 */
class ChecklistController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly ChecklistService $checklist) {}

    public function index(Request $request)
    {
        return $this->success($this->checklist->forUser($request->user('api')));
    }

    /**
     * `PATCH /checklist/{itemId}` — centang/lepas centang item template.
     *
     * Baris progres dibuat saat dibutuhkan (`updateOrCreate`), jadi item yang
     * baru ditambahkan admin tidak perlu di-backfill ke seluruh pengguna.
     */
    public function update(Request $request, ChecklistItem $item)
    {
        $validated = $request->validate([
            'is_checked' => ['required', 'boolean'],
        ]);

        // Item yang dinonaktifkan admin tidak muncul di `index()`, jadi
        // mencentangnya berarti klien memakai data usang.
        abort_unless($item->is_active, 404);

        $this->persistCheck(
            UserChecklistProgress::firstOrNew([
                'user_id' => $request->user('api')->id,
                'checklist_item_id' => $item->id,
            ]),
            $validated['is_checked']
        );

        return $this->success($this->checklist->forUser($request->user('api')), 'Checklist diperbarui');
    }

    /**
     * `POST /checklist/custom` — tambah item pribadi pengguna.
     */
    public function storeCustom(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
        ], [
            'title.required' => 'Judul item wajib diisi',
            'title.max' => 'Judul item maksimal 200 karakter',
        ]);

        UserChecklistProgress::create([
            'user_id' => $request->user('api')->id,
            'checklist_item_id' => null,
            'custom_title' => $validated['title'],
            'is_checked' => false,
        ]);

        return $this->success(
            $this->checklist->forUser($request->user('api')),
            'Item pribadi ditambahkan',
            status: 201
        );
    }

    /**
     * `PATCH /checklist/custom/{id}` — centang/lepas centang item pribadi.
     *
     * Terpisah dari `update()` karena item pribadi tidak punya
     * `checklist_items.id`; yang dialamatkan adalah baris progresnya sendiri.
     */
    public function updateCustom(Request $request, UserChecklistProgress $progress)
    {
        $validated = $request->validate([
            'is_checked' => ['required', 'boolean'],
        ]);

        $this->authorizeCustom($request, $progress);
        $this->persistCheck($progress, $validated['is_checked']);

        return $this->success($this->checklist->forUser($request->user('api')), 'Checklist diperbarui');
    }

    /**
     * `DELETE /checklist/custom/{id}` — hapus item pribadi pengguna.
     */
    public function destroyCustom(Request $request, UserChecklistProgress $progress)
    {
        $this->authorizeCustom($request, $progress);
        $progress->delete();

        return $this->success($this->checklist->forUser($request->user('api')), 'Item pribadi dihapus');
    }

    private function persistCheck(UserChecklistProgress $progress, bool $isChecked): void
    {
        $progress->fill([
            'is_checked' => $isChecked,
            'checked_at' => $isChecked ? now() : null,
        ])->save();
    }

    /**
     * 404 (bukan 403) supaya keberadaan item pengguna lain tidak terungkap —
     * pola yang sama dipakai `PregnancyController`.
     */
    private function authorizeCustom(Request $request, UserChecklistProgress $progress): void
    {
        abort_unless(
            $progress->user_id === $request->user('api')->id && $progress->checklist_item_id === null,
            404
        );
    }
}
