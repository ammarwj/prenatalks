<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminGuideRequest;
use App\Http\Resources\Admin\AdminGuideResource;
use App\Models\Guide;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * CRUD panduan penggunaan — khusus super_admin (grup `role:super_admin` di
 * routes/api.php), sejajar dengan halaman legal: keduanya teks resmi situs
 * yang ditautkan dari footer setiap halaman.
 */
class GuideController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $guides = Guide::ordered()->get();

        return $this->success(AdminGuideResource::collection($guides));
    }

    public function store(AdminGuideRequest $request)
    {
        $data = $request->validated();

        $guide = Guide::create([
            'title' => $data['title'],
            'summary' => $data['summary'] ?? null,
            'body' => $data['body'],
            'is_published' => $data['is_published'] ?? false,
            'order_index' => (int) Guide::max('order_index') + 10,
        ]);

        return $this->success(
            new AdminGuideResource($guide),
            'Panduan dibuat',
            status: 201
        );
    }

    public function show(Guide $guide)
    {
        return $this->success(new AdminGuideResource($guide));
    }

    public function update(AdminGuideRequest $request, Guide $guide)
    {
        $data = $request->validated();

        $guide->update([
            'title' => $data['title'],
            'summary' => $data['summary'] ?? null,
            'body' => $data['body'],
            'is_published' => $data['is_published'] ?? false,
        ]);

        return $this->success(
            new AdminGuideResource($guide->fresh()),
            'Panduan diperbarui'
        );
    }

    public function destroy(Guide $guide)
    {
        $guide->delete();

        return $this->success(null, 'Panduan dihapus');
    }

    /**
     * Persist urutan baru dari drag & drop di panel admin — menerima seluruh
     * daftar ID panduan dalam urutan akhirnya, sama seperti reorder FAQ,
     * item checklist, profil tim, dan testimoni.
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:guides,id'],
        ]);

        DB::transaction(function () use ($validated) {
            foreach (array_values($validated['ids']) as $index => $id) {
                Guide::where('id', $id)->update(['order_index' => ($index + 1) * 10]);
            }
        });

        $guides = Guide::ordered()->get();

        return $this->success(AdminGuideResource::collection($guides), 'Urutan panduan diperbarui');
    }
}
