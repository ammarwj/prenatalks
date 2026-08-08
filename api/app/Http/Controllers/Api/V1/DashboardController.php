<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleSummaryResource;
use App\Services\ChecklistService;
use App\Services\DashboardService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

/**
 * Ringkasan dashboard pengguna — PRD §9 F-13, sitemap §8 (`/dashboard`).
 *
 * Endpoint ini tidak tertulis literal di PRD §11.2 (yang ada hanya
 * `GET /admin/dashboard`); dibuat sebagai padanannya untuk sisi pengguna
 * agar halaman ringkasan cukup satu request — lihat alasannya di
 * `DashboardService`.
 */
class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly DashboardService $dashboard) {}

    public function __invoke(Request $request, ChecklistService $checklist)
    {
        $data = $this->dashboard->forUser($request->user('api'), $checklist);

        return $this->success([
            ...$data,
            'recommended_articles' => ArticleSummaryResource::collection($data['recommended_articles']),
        ]);
    }
}
