<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\PublicStatsService;
use App\Traits\ApiResponse;

/**
 * Statistik landing page — PRD §9 F-01 (`GET /api/v1/stats`, dibaca frontend
 * dengan ISR 1 jam).
 *
 * Angka datang dari `PublicStatsService`, labelnya dari `settings`. Keduanya
 * digabung di sini supaya frontend cukup memetakan `key` ke ikon dan warna —
 * satu-satunya bagian kartu yang memang tidak bisa hidup di database.
 */
class StatsController extends Controller
{
    use ApiResponse;

    public function __invoke(PublicStatsService $stats)
    {
        $settings = Setting::valuesForGroups(['stats']);
        $counts = $stats->counts();

        $items = array_map(fn (string $key) => [
            'key' => $key,
            'value' => $counts[$key],
            'display' => $stats->display($counts[$key]),
            'label' => $settings['stats_label_'.$key],
        ], PublicStatsService::KEYS);

        return $this->success([
            // Bar tetap dikirim lengkap meski dimatikan: yang memutuskan
            // menampilkannya adalah landing page, dan panel admin butuh
            // membaca angka yang sama untuk pratinjau di form pengaturan.
            'enabled' => (bool) $settings['stats_enabled'],
            'items' => $items,
        ]);
    }
}
