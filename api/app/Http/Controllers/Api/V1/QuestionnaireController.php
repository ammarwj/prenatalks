<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuestionnaireResource;
use App\Models\Questionnaire;
use App\Traits\ApiResponse;

class QuestionnaireController extends Controller
{
    use ApiResponse;

    public function active()
    {
        $questionnaire = Questionnaire::with('questions.options')
            ->where('is_active', true)
            ->first();

        if (! $questionnaire) {
            return $this->error('Belum ada kuesioner cek risiko yang aktif', null, 404);
        }

        return $this->success(new QuestionnaireResource($questionnaire));
    }
}
