<?php

namespace App\Http\Resources\Admin;

use App\Models\QuestionOption;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin QuestionOption */
class AdminQuestionOptionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'score' => $this->score,
            'is_danger_sign' => $this->is_danger_sign,
            'order_index' => $this->order_index,
        ];
    }
}
