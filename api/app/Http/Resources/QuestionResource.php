<?php

namespace App\Http\Resources;

use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Question */
class QuestionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'text' => $this->text,
            'help_text' => $this->help_text,
            'type' => $this->type,
            'is_required' => $this->is_required,
            'order_index' => $this->order_index,
            'group_label' => $this->group_label,
            'options' => QuestionOptionResource::collection($this->whenLoaded('options')),
        ];
    }
}
