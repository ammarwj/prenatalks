<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminQuestionnaireRequest;
use App\Http\Resources\Admin\AdminQuestionnaireResource;
use App\Models\Questionnaire;
use App\Models\RiskAssessment;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\DB;

/**
 * CRUD kuesioner cek risiko — super_admin only (PRD §9 F-05, §5 RBAC).
 */
class QuestionnaireController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $questionnaires = Questionnaire::withCount('riskAssessments')
            ->orderByDesc('version')
            ->get();

        return $this->success(AdminQuestionnaireResource::collection($questionnaires));
    }

    public function store(AdminQuestionnaireRequest $request)
    {
        $data = $request->validated();

        $questionnaire = DB::transaction(function () use ($data, $request) {
            if (! empty($data['is_active'])) {
                Questionnaire::where('is_active', true)->update(['is_active' => false]);
            }

            $questionnaire = Questionnaire::create([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'version' => 1,
                'is_active' => $data['is_active'] ?? false,
                'published_at' => ! empty($data['is_active']) ? now() : null,
                'created_by' => $request->user('api')->id,
            ]);

            $this->syncStructure($questionnaire, $data);

            return $questionnaire;
        });

        return $this->success(
            new AdminQuestionnaireResource($questionnaire->load(['questions.options', 'riskLevels'])),
            'Kuesioner dibuat',
            status: 201
        );
    }

    public function show(Questionnaire $questionnaire)
    {
        $questionnaire->loadCount('riskAssessments')->load(['questions.options', 'riskLevels']);

        return $this->success(new AdminQuestionnaireResource($questionnaire));
    }

    /**
     * Bila kuesioner ini sudah punya riwayat hasil (pernah dipakai), edit tidak
     * menimpa di tempat — dibuat sebagai versi baru supaya riwayat lama tetap
     * tertaut ke struktur & bobot skor yang berlaku saat pengisian (PRD §9 F-05,
     * "Assessment lama tetap tertaut ke versi kuesioner saat pengisian").
     */
    public function update(AdminQuestionnaireRequest $request, Questionnaire $questionnaire)
    {
        $data = $request->validated();
        $hasHistory = RiskAssessment::where('questionnaire_id', $questionnaire->id)->exists();

        $result = DB::transaction(function () use ($data, $questionnaire, $request, $hasHistory) {
            if ($hasHistory) {
                if (! empty($data['is_active'])) {
                    Questionnaire::where('is_active', true)->update(['is_active' => false]);
                }
                $questionnaire->update(['is_active' => false]);

                $newQuestionnaire = Questionnaire::create([
                    'title' => $data['title'],
                    'description' => $data['description'] ?? null,
                    'version' => $questionnaire->version + 1,
                    'is_active' => $data['is_active'] ?? false,
                    'published_at' => ! empty($data['is_active']) ? now() : null,
                    'created_by' => $request->user('api')->id,
                ]);
                $this->syncStructure($newQuestionnaire, $data);

                return $newQuestionnaire;
            }

            if (! empty($data['is_active'])) {
                Questionnaire::where('is_active', true)->where('id', '!=', $questionnaire->id)
                    ->update(['is_active' => false]);
            }

            $questionnaire->update([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? $questionnaire->is_active,
                'published_at' => (! empty($data['is_active']) && ! $questionnaire->published_at)
                    ? now()
                    : $questionnaire->published_at,
            ]);
            $questionnaire->questions()->delete();
            $this->syncStructure($questionnaire, $data);

            return $questionnaire;
        });

        $message = $hasHistory
            ? "Kuesioner disimpan sebagai versi baru (v{$result->version}) karena versi sebelumnya sudah punya riwayat hasil"
            : 'Kuesioner diperbarui';

        return $this->success(
            new AdminQuestionnaireResource($result->load(['questions.options', 'riskLevels'])),
            $message
        );
    }

    public function destroy(Questionnaire $questionnaire)
    {
        if (RiskAssessment::where('questionnaire_id', $questionnaire->id)->exists()) {
            return $this->error(
                'Kuesioner ini sudah punya riwayat hasil cek risiko dan tidak bisa dihapus',
                null,
                409
            );
        }

        $questionnaire->delete();

        return $this->success(null, 'Kuesioner dihapus');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncStructure(Questionnaire $questionnaire, array $data): void
    {
        $order = 0;
        foreach ($data['questions'] as $questionData) {
            $order += 10;
            $question = $questionnaire->questions()->create([
                'text' => $questionData['text'],
                'help_text' => $questionData['help_text'] ?? null,
                'type' => $questionData['type'],
                'is_required' => $questionData['is_required'] ?? true,
                'order_index' => $order,
                'group_label' => $questionData['group_label'] ?? null,
            ]);

            $optionOrder = 0;
            foreach ($questionData['options'] ?? [] as $optionData) {
                $optionOrder += 10;
                $question->options()->create([
                    'label' => $optionData['label'],
                    'score' => $optionData['score'],
                    'is_danger_sign' => $optionData['is_danger_sign'] ?? false,
                    'order_index' => $optionOrder,
                ]);
            }
        }

        $questionnaire->riskLevels()->delete();
        $levelOrder = 0;
        foreach ($data['risk_levels'] as $levelData) {
            $levelOrder += 10;
            $questionnaire->riskLevels()->create([
                'name' => $levelData['name'],
                'min_score' => $levelData['min_score'],
                'max_score' => $levelData['max_score'] ?? null,
                'color_hex' => $levelData['color_hex'],
                'recommendation' => $levelData['recommendation'],
                'order_index' => $levelOrder,
            ]);
        }
    }
}
