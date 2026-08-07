<?php

namespace App\Http\Resources;

use App\Models\QuestionOption;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * `score` dan `is_danger_sign` sengaja tidak diekspos ke pengguna saat
 * mengisi kuesioner — supaya jawaban jujur, bukan "bermain skor", dan
 * selaras nada bicara yang tidak menakut-nakuti (PRD §1.5). Info itu
 * baru muncul di hasil, lewat RiskAssessmentResource.
 *
 * @mixin QuestionOption
 */
class QuestionOptionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
        ];
    }
}
