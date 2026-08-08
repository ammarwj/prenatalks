<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminFaqRequest;
use App\Http\Resources\Admin\AdminFaqResource;
use App\Models\Faq;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * CRUD FAQ — admin/super_admin (PRD §9 F-10, §5 RBAC).
 */
class FaqController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $faqs = Faq::with('category')->orderBy('order_index')->get();

        return $this->success(AdminFaqResource::collection($faqs));
    }

    public function store(AdminFaqRequest $request)
    {
        $data = $request->validated();

        $faq = Faq::create([
            'question' => $data['question'],
            'answer' => $data['answer'],
            'category_id' => $data['category_id'] ?? null,
            'is_published' => $data['is_published'] ?? false,
            'order_index' => (int) Faq::max('order_index') + 10,
        ]);

        return $this->success(
            new AdminFaqResource($faq->load('category')),
            'FAQ dibuat',
            status: 201
        );
    }

    public function show(Faq $faq)
    {
        $faq->load('category');

        return $this->success(new AdminFaqResource($faq));
    }

    public function update(AdminFaqRequest $request, Faq $faq)
    {
        $data = $request->validated();

        $faq->update([
            'question' => $data['question'],
            'answer' => $data['answer'],
            'category_id' => $data['category_id'] ?? null,
            'is_published' => $data['is_published'] ?? false,
        ]);

        return $this->success(
            new AdminFaqResource($faq->fresh('category')),
            'FAQ diperbarui'
        );
    }

    public function destroy(Faq $faq)
    {
        $faq->delete();

        return $this->success(null, 'FAQ dihapus');
    }

    /**
     * Persist urutan baru dari drag & drop di panel admin (PRD §9 F-10) —
     * menerima seluruh daftar ID FAQ dalam urutan akhirnya.
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:faqs,id'],
        ]);

        DB::transaction(function () use ($validated) {
            foreach (array_values($validated['ids']) as $index => $id) {
                Faq::where('id', $id)->update(['order_index' => ($index + 1) * 10]);
            }
        });

        $faqs = Faq::with('category')->orderBy('order_index')->get();

        return $this->success(AdminFaqResource::collection($faqs), 'Urutan FAQ diperbarui');
    }
}
