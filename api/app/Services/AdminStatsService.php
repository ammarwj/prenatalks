<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Faq;
use App\Models\Form;
use App\Models\FormSubmission;
use App\Models\RiskAssessment;
use App\Models\RiskLevel;
use App\Models\User;
use App\Models\Video;
use Illuminate\Support\Carbon;

/**
 * Angka kartu statistik panel admin — PRD §9 F-14, §11.2
 * (`GET /admin/dashboard`).
 */
class AdminStatsService
{
    /**
     * @return array<string, mixed>
     */
    public function summary(): array
    {
        $startOfMonth = Carbon::now()->startOfMonth();

        return [
            'users' => $this->users($startOfMonth),
            'assessments' => $this->assessments($startOfMonth),
            'risk_distribution' => $this->riskDistribution(),
            'content' => $this->content(),
            'form_responses' => $this->formResponses($startOfMonth),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function users(Carbon $startOfMonth): array
    {
        return [
            'total' => User::count(),
            'new_this_month' => User::where('created_at', '>=', $startOfMonth)->count(),
            'active' => User::where('is_active', true)->count(),
            'admins' => User::whereIn('role', ['admin', 'super_admin'])->count(),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function assessments(Carbon $startOfMonth): array
    {
        $completed = RiskAssessment::where('status', 'completed');

        return [
            'this_month' => (clone $completed)->where('completed_at', '>=', $startOfMonth)->count(),
            'total' => (clone $completed)->count(),
            'with_danger_sign' => (clone $completed)->where('has_danger_sign', true)->count(),
        ];
    }

    /**
     * Distribusi level risiko atas seluruh assessment selesai.
     *
     * Level yang belum pernah dipakai tetap dikembalikan dengan `count` 0 —
     * kalau tidak, legenda grafik berubah-ubah komposisinya seiring data
     * masuk dan admin sulit membandingkan antarwaktu.
     *
     * @return list<array<string, mixed>>
     */
    private function riskDistribution(): array
    {
        $counts = RiskAssessment::where('status', 'completed')
            ->whereNotNull('risk_level_id')
            ->selectRaw('risk_level_id, count(*) as total')
            ->groupBy('risk_level_id')
            ->pluck('total', 'risk_level_id');

        return RiskLevel::query()
            ->whereHas('questionnaire', fn ($q) => $q->where('is_active', true))
            ->orderBy('order_index')
            ->get()
            ->map(fn (RiskLevel $level) => [
                'id' => $level->id,
                'name' => $level->name,
                'color_hex' => $level->color_hex,
                'count' => (int) ($counts[$level->id] ?? 0),
            ])
            ->all();
    }

    /**
     * @return array<string, int>
     */
    private function content(): array
    {
        return [
            'articles_published' => Article::where('status', 'published')->count(),
            'articles_draft' => Article::where('status', 'draft')->count(),
            'videos_published' => Video::where('status', 'published')->count(),
            'faqs_published' => Faq::where('is_published', true)->count(),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function formResponses(Carbon $startOfMonth): array
    {
        return [
            'total' => FormSubmission::count(),
            'this_month' => FormSubmission::where('submitted_at', '>=', $startOfMonth)->count(),
            'open_forms' => Form::query()->openNow()->count(),
        ];
    }
}
