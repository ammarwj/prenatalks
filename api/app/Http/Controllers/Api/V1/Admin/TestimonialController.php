<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminTestimonialRequest;
use App\Http\Resources\Admin\AdminTestimonialResource;
use App\Models\Testimonial;
use App\Services\CoverImageService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * CRUD testimoni landing page — admin/super_admin (PRD §9 F-01, §5 RBAC).
 *
 * Foto memakai ulang `CoverImageService` (dibangun di F-08) dengan direktori
 * berbeda, sama seperti profil tim di F-16 — konversi WebP-nya identik tanpa
 * menduplikasi kode.
 */
class TestimonialController extends Controller
{
    use ApiResponse;

    private const PHOTO_DIRECTORY = 'testimonials';

    public function __construct(private readonly CoverImageService $photoService) {}

    public function index()
    {
        return $this->success(
            AdminTestimonialResource::collection(Testimonial::ordered()->get())
        );
    }

    public function store(AdminTestimonialRequest $request)
    {
        $data = $request->validated();

        $testimonial = Testimonial::create([
            'name' => $data['name'],
            'pregnancy_age' => $data['pregnancy_age'],
            'quote' => $data['quote'],
            'rating' => $data['rating'],
            'is_published' => $data['is_published'] ?? true,
            'photo_path' => $request->hasFile('photo')
                ? $this->photoService->store($request->file('photo'), self::PHOTO_DIRECTORY)
                : null,
            'order_index' => (int) Testimonial::max('order_index') + 10,
        ]);

        return $this->success(
            new AdminTestimonialResource($testimonial),
            'Testimoni dibuat',
            status: 201
        );
    }

    public function show(Testimonial $testimonial)
    {
        return $this->success(new AdminTestimonialResource($testimonial));
    }

    public function update(AdminTestimonialRequest $request, Testimonial $testimonial)
    {
        $data = $request->validated();

        $photoPath = $testimonial->photo_path;
        if ($request->hasFile('photo')) {
            $this->photoService->delete($testimonial->photo_path);
            $photoPath = $this->photoService->store($request->file('photo'), self::PHOTO_DIRECTORY);
        } elseif ($request->boolean('remove_photo')) {
            $this->photoService->delete($testimonial->photo_path);
            $photoPath = null;
        }

        $testimonial->update([
            'name' => $data['name'],
            'pregnancy_age' => $data['pregnancy_age'],
            'quote' => $data['quote'],
            'rating' => $data['rating'],
            'is_published' => $data['is_published'] ?? false,
            'photo_path' => $photoPath,
        ]);

        return $this->success(
            new AdminTestimonialResource($testimonial->fresh()),
            'Testimoni diperbarui'
        );
    }

    public function destroy(Testimonial $testimonial)
    {
        $this->photoService->delete($testimonial->photo_path);
        $testimonial->delete();

        return $this->success(null, 'Testimoni dihapus');
    }

    /**
     * Persist urutan hasil drag & drop — pola yang sama dengan FAQ (F-10),
     * item checklist (F-11), dan profil tim (F-16).
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:testimonials,id'],
        ]);

        DB::transaction(function () use ($validated) {
            foreach (array_values($validated['ids']) as $index => $id) {
                Testimonial::where('id', $id)->update(['order_index' => ($index + 1) * 10]);
            }
        });

        return $this->success(
            AdminTestimonialResource::collection(Testimonial::ordered()->get()),
            'Urutan testimoni diperbarui'
        );
    }
}
