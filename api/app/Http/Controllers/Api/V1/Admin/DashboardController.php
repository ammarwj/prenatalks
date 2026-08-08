<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminStatsService;
use App\Traits\ApiResponse;

/**
 * Statistik ringkas panel admin — PRD §9 F-14, §11.2
 * (`GET /admin/dashboard`), sitemap §8 (`/admin`).
 */
class DashboardController extends Controller
{
    use ApiResponse;

    public function __invoke(AdminStatsService $stats)
    {
        return $this->success($stats->summary());
    }
}
