<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Form;
use App\Models\Pregnancy;
use App\Models\RiskAssessment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

/**
 * Ringkasan dashboard pengguna — PRD §9 F-13.
 *
 * Kelima kartu disusun dalam satu tempat supaya halaman cukup satu request:
 * persona P1 memakai 4G tidak stabil (PRD §4) dan target respons p95 adalah
 * 400 ms (§12.1), jadi lima round-trip berantai justru jadi bagian paling
 * lambat dari pengalaman masuk.
 */
class DashboardService
{
    private const ARTICLE_LIMIT = 3;

    private const PENDING_FORM_LIMIT = 5;

    public function __construct(private readonly PregnancyCalculator $calculator) {}

    /**
     * @return array<string, mixed>
     */
    public function forUser(User $user, ChecklistService $checklist): array
    {
        $pregnancy = $user->pregnancies()->where('status', 'active')->latest()->first();
        $summary = $pregnancy ? $this->pregnancySummary($pregnancy) : null;

        return [
            'pregnancy' => $summary,
            'latest_assessment' => $this->latestAssessment($user),
            'checklist' => $checklist->forUser($user)['summary'],
            'pending_forms' => $this->pendingForms($user),
            'recommended_articles' => $this->recommendedArticles($summary['trimester'] ?? null),
        ];
    }

    /**
     * Usia kehamilan dihitung dari HPHT, tapi sisa hari dihitung terhadap
     * `edd_date` yang tersimpan — bukan HPL hasil rumus — supaya HPL yang
     * ditimpa manual (PRD §9 F-03) tetap dihormati di dashboard.
     *
     * @return array<string, mixed>
     */
    private function pregnancySummary(Pregnancy $pregnancy): array
    {
        $computed = $this->calculator->calculate(CarbonImmutable::parse($pregnancy->lmp_date));
        $eddDate = $pregnancy->edd_date ? CarbonImmutable::parse($pregnancy->edd_date) : null;

        return [
            'id' => $pregnancy->id,
            'lmp_date' => $pregnancy->lmp_date?->toDateString(),
            'edd_date' => $eddDate?->toDateString() ?? $computed['edd_date'],
            'edd_overridden' => (bool) $pregnancy->edd_overridden,
            'gestational_age' => $computed['gestational_age'],
            'trimester' => $computed['trimester'],
            'progress_percent' => $computed['progress_percent'],
            'days_remaining' => $eddDate
                ? max(0, (int) CarbonImmutable::today()->diffInDays($eddDate, false))
                : $computed['days_remaining'],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function latestAssessment(User $user): ?array
    {
        /** @var RiskAssessment|null $assessment */
        $assessment = $user->riskAssessments()
            ->where('status', 'completed')
            ->with('riskLevel')
            ->orderByDesc('completed_at')
            ->first();

        if (! $assessment) {
            return null;
        }

        return [
            'id' => $assessment->id,
            'total_score' => $assessment->total_score,
            'has_danger_sign' => (bool) $assessment->has_danger_sign,
            'completed_at' => $assessment->completed_at,
            'risk_level' => $assessment->riskLevel ? [
                'id' => $assessment->riskLevel->id,
                'name' => $assessment->riskLevel->name,
                'color_hex' => $assessment->riskLevel->color_hex,
                'recommendation' => $assessment->riskLevel->recommendation,
            ] : null,
        ];
    }

    /**
     * Form/survei terbit yang sedang dibuka dan belum pernah dikirim pengguna.
     *
     * Batasannya: form `is_anonymous` tidak menyimpan `user_id` bersama
     * jawaban (PRD §9 F-07), jadi pengisiannya tidak bisa diatribusikan dan
     * form itu tetap tampil di sini. Itu konsekuensi yang disengaja dari
     * janji anonimitas, bukan kekeliruan penyaringan.
     *
     * @return list<array<string, mixed>>
     */
    private function pendingForms(User $user): array
    {
        return Form::query()
            ->openNow()
            ->where('is_public', true)
            ->whereDoesntHave('submissions', fn (Builder $q) => $q->where('user_id', $user->id))
            ->orderBy('closes_at')
            ->orderByDesc('id')
            ->limit(self::PENDING_FORM_LIMIT)
            ->get()
            ->map(fn (Form $form) => [
                'id' => $form->id,
                'title' => $form->title,
                'slug' => $form->slug,
                'type' => $form->type,
                'description' => $form->description,
                'closes_at' => $form->closes_at,
            ])
            ->all();
    }

    /**
     * Artikel sesuai trimester berjalan, dilengkapi artikel terbaru bila
     * jumlahnya kurang dari tiga — kartu rekomendasi tidak boleh tampil
     * setengah kosong hanya karena satu trimester belum banyak kontennya.
     *
     * @return Collection<int, Article>
     */
    private function recommendedArticles(?int $trimester): Collection
    {
        $matched = $trimester
            ? Article::with('category')
                ->published()
                ->where('trimester', $trimester)
                ->orderByDesc('published_at')
                ->limit(self::ARTICLE_LIMIT)
                ->get()
            : new Collection;

        if ($matched->count() >= self::ARTICLE_LIMIT) {
            return $matched;
        }

        $filler = Article::with('category')
            ->published()
            ->whereNotIn('id', $matched->pluck('id'))
            ->orderByDesc('published_at')
            ->limit(self::ARTICLE_LIMIT - $matched->count())
            ->get();

        return $matched->concat($filler);
    }
}
