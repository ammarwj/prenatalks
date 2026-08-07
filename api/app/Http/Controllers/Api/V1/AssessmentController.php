<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Assessment\SaveAnswerRequest;
use App\Http\Resources\QuestionnaireResource;
use App\Http\Resources\RiskAssessmentResource;
use App\Http\Resources\RiskAssessmentSummaryResource;
use App\Models\Question;
use App\Models\Questionnaire;
use App\Models\RiskAnswer;
use App\Models\RiskAssessment;
use App\Services\RiskScoringService;
use App\Traits\ApiResponse;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class AssessmentController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly RiskScoringService $scoring) {}

    public function store(Request $request)
    {
        $questionnaire = Questionnaire::where('is_active', true)->first();

        if (! $questionnaire) {
            return $this->error('Belum ada kuesioner cek risiko yang aktif', null, 404);
        }

        $user = $request->user('api');
        $activePregnancyId = $user->pregnancies()->where('status', 'active')->value('id');

        $assessment = RiskAssessment::create([
            'user_id' => $user->id,
            'pregnancy_id' => $activePregnancyId,
            'questionnaire_id' => $questionnaire->id,
            'questionnaire_version' => $questionnaire->version,
            'status' => 'in_progress',
        ]);

        return $this->success([
            'assessment' => new RiskAssessmentResource($assessment),
            'questionnaire' => new QuestionnaireResource($questionnaire->load('questions.options')),
        ], 'Cek risiko dimulai', status: 201);
    }

    public function saveAnswer(SaveAnswerRequest $request, RiskAssessment $assessment)
    {
        $this->authorizeInProgress($request, $assessment);

        $data = $request->validated();
        $question = Question::where('questionnaire_id', $assessment->questionnaire_id)
            ->findOrFail($data['question_id']);

        RiskAnswer::where('assessment_id', $assessment->id)
            ->where('question_id', $question->id)
            ->delete();

        if ($question->type === 'multiple_choice') {
            foreach ($data['option_ids'] ?? [] as $optionId) {
                $option = $question->options()->findOrFail($optionId);
                RiskAnswer::create([
                    'assessment_id' => $assessment->id,
                    'question_id' => $question->id,
                    'option_id' => $option->id,
                    'score' => $option->score,
                ]);
            }
        } elseif (in_array($question->type, ['single_choice', 'boolean'], true)) {
            $option = $question->options()->findOrFail($data['option_id']);
            RiskAnswer::create([
                'assessment_id' => $assessment->id,
                'question_id' => $question->id,
                'option_id' => $option->id,
                'score' => $option->score,
            ]);
        } else {
            // type=number: belum ada aturan rentang→skor generik yang dikonfigurasi
            // admin, jadi disimpan tanpa kontribusi skor otomatis untuk saat ini.
            RiskAnswer::create([
                'assessment_id' => $assessment->id,
                'question_id' => $question->id,
                'value_number' => $data['value_number'] ?? null,
                'score' => 0,
            ]);
        }

        $scored = $this->scoring->score($assessment->fresh(['answers.option', 'questionnaire.riskLevels']));

        $triggeredDangerSign = $scored->answers
            ->where('question_id', $question->id)
            ->contains(fn ($answer) => (bool) $answer->option?->is_danger_sign);

        return $this->success([
            'total_score' => $scored->total_score,
            'has_danger_sign' => $scored->has_danger_sign,
            'triggered_danger_sign' => $triggeredDangerSign,
        ], 'Jawaban tersimpan');
    }

    public function submit(Request $request, RiskAssessment $assessment)
    {
        $this->authorizeInProgress($request, $assessment);

        $requiredQuestionIds = Question::where('questionnaire_id', $assessment->questionnaire_id)
            ->where('is_required', true)
            ->pluck('id');
        $answeredQuestionIds = $assessment->answers()->pluck('question_id')->unique();

        if ($requiredQuestionIds->diff($answeredQuestionIds)->isNotEmpty()) {
            return $this->error('Masih ada pertanyaan wajib yang belum dijawab', null, 422);
        }

        $assessment = $this->scoring->score($assessment);
        $assessment->status = 'completed';
        $assessment->completed_at = now();
        $assessment->save();

        return $this->success(
            new RiskAssessmentResource($assessment->load(['riskLevel', 'answers.question', 'answers.option'])),
            'Hasil cek risiko tersimpan'
        );
    }

    public function index(Request $request)
    {
        $assessments = $request->user('api')->riskAssessments()
            ->where('status', 'completed')
            ->with('riskLevel')
            ->orderByDesc('completed_at')
            ->get();

        return $this->success(RiskAssessmentSummaryResource::collection($assessments));
    }

    public function show(Request $request, RiskAssessment $assessment)
    {
        $this->authorizeOwnership($request, $assessment);

        return $this->success(
            new RiskAssessmentResource($assessment->load(['riskLevel', 'answers.question', 'answers.option']))
        );
    }

    /**
     * PRD §9 F-05: tombol "Unduh PDF hasil", disclaimer wajib tampil di atas
     * dan di bawah hasil (§12.4).
     */
    public function pdf(Request $request, RiskAssessment $assessment)
    {
        $this->authorizeOwnership($request, $assessment);
        abort_if($assessment->status !== 'completed', 422, 'Assessment ini belum selesai');

        $assessment->load(['riskLevel', 'answers.question', 'answers.option', 'user']);

        $contributingFactors = $assessment->answers
            ->filter(fn ($answer) => $answer->score > 0)
            ->sortByDesc('score')
            ->values()
            ->map(fn ($answer) => [
                'question_text' => $answer->question?->text,
                'answer_label' => $answer->option?->label ?? $answer->value_number ?? $answer->value_text,
                'score' => $answer->score,
            ]);

        $pdf = Pdf::loadView('pdf.risk-assessment', [
            'assessment' => $assessment,
            'riskLevel' => $assessment->riskLevel,
            'contributingFactors' => $contributingFactors,
            'userName' => $assessment->user?->name,
            'completedAt' => $assessment->completed_at?->translatedFormat('d F Y, H:i'),
            'generatedAt' => now()->translatedFormat('d F Y, H:i'),
            'disclaimer' => 'Informasi di PrenaTalks bersifat edukatif dan bukan pengganti pemeriksaan, diagnosis, atau nasihat tenaga kesehatan. Hasil cek risiko adalah penilaian mandiri berbasis skor, bukan diagnosis. Bila Anda mengalami tanda bahaya seperti perdarahan, nyeri hebat, demam tinggi, atau berkurangnya gerakan janin, segera hubungi bidan, dokter, atau fasilitas kesehatan terdekat.',
        ]);

        return $pdf->download("hasil-cek-risiko-{$assessment->id}.pdf");
    }

    private function authorizeOwnership(Request $request, RiskAssessment $assessment): void
    {
        abort_unless($assessment->user_id === $request->user('api')->id, 404);
    }

    private function authorizeInProgress(Request $request, RiskAssessment $assessment): void
    {
        $this->authorizeOwnership($request, $assessment);
        abort_if($assessment->status !== 'in_progress', 422, 'Assessment ini sudah selesai dan tidak bisa diubah');
    }
}
