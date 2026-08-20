<?php

namespace App\Services;

use App\Models\Article;
use App\Models\RiskAssessment;
use App\Models\User;
use App\Models\Video;

/**
 * Angka statistik landing page — PRD §9 F-01 (`GET /stats`, ISR 1 jam).
 *
 * Sengaja terpisah dari `AdminStatsService` meski beberapa query-nya mirip:
 * yang ini dibaca **tanpa login**, jadi keputusan "apa yang boleh keluar"
 * harus berada di satu berkas yang jelas, bukan hasil menyaring ulang payload
 * panel admin. Menambah metrik di sini adalah keputusan sadar untuk
 * mempublikasikannya.
 */
class PublicStatsService
{
    /**
     * Urutannya menentukan urutan kartu di landing page.
     *
     * @var list<string>
     */
    public const KEYS = ['mothers', 'contents', 'assessments', 'health_workers'];

    /**
     * @return array<string, int>
     */
    public function counts(): array
    {
        return [
            // Hanya peran `user`: admin dan tenaga kesehatan punya kartunya
            // sendiri atau tidak relevan sebagai "ibu hamil".
            'mothers' => User::where('role', 'user')->where('is_active', true)->count(),

            // `published()` — bukan sekadar `status = 'published'` seperti di
            // AdminStatsService — karena scope itu ikut menyaring `published_at`
            // di masa depan. Konten terjadwal belum bisa dibaca pengunjung,
            // jadi tidak boleh ikut diklaim di halaman depan.
            'contents' => Article::published()->count() + Video::published()->count(),

            'assessments' => RiskAssessment::where('status', 'completed')->count(),

            'health_workers' => User::where('role', 'health_worker')->where('is_active', true)->count(),
        ];
    }

    /**
     * Angka yang ditampilkan, **dibulatkan ke bawah** lalu diberi akhiran "+".
     *
     * Arahnya penting: 1.024 tampil sebagai "1.000+", tidak pernah "1.100"
     * atau "2.000". Yang dibaca pengunjung karena itu selalu klaim yang
     * benar-benar didukung data — inilah yang membedakannya dari angka
     * karangan "1000+" yang sebelumnya ditulis mati di komponen landing.
     *
     * Di bawah 10 angkanya ditampilkan apa adanya: "0+" tidak berarti apa-apa,
     * dan situs yang baru berjalan lebih baik menyembunyikan seluruh bar lewat
     * pengaturan `stats_enabled` daripada memoles angka kecil.
     */
    public function display(int $value): string
    {
        $step = match (true) {
            $value >= 1000 => 1000,
            $value >= 100 => 100,
            $value >= 10 => 10,
            default => 0,
        };

        if ($step === 0) {
            return (string) $value;
        }

        return number_format(intdiv($value, $step) * $step, 0, ',', '.').'+';
    }
}
