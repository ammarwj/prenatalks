<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\FaqResource;
use App\Models\Faq;
use App\Traits\ApiResponse;

/**
 * Daftar FAQ publik — PRD §9 F-10, §11.2. Dikelompokkan per kategori dan
 * dicari di sisi klien (jumlah FAQ realistis kecil, tidak perlu paginasi
 * atau endpoint pencarian terpisah).
 */
class FaqController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $faqs = Faq::with('category')->published()->orderBy('order_index')->get();

        return $this->success(FaqResource::collection($faqs));
    }
}
