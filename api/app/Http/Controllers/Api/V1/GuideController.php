<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\GuideResource;
use App\Models\Guide;
use App\Traits\ApiResponse;

/**
 * Panduan penggunaan publik — halaman `/panduan` di frontend.
 *
 * Dikirim utuh dalam satu permintaan tanpa paginasi, dengan alasan yang sama
 * seperti FAQ: jumlahnya realistis kecil dan halaman publiknya menampilkan
 * seluruhnya sebagai accordion bernomor.
 */
class GuideController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $guides = Guide::published()->ordered()->get();

        return $this->success(GuideResource::collection($guides));
    }
}
