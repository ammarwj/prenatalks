<?php

namespace App\Http\Resources\Admin;

use App\Models\FormField;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin FormField */
class AdminFormFieldResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'description' => $this->description,
            'type' => $this->type,
            'placeholder' => $this->placeholder,
            'options' => $this->options,
            'validation' => $this->validation,
            'is_required' => $this->is_required,
            'order_index' => $this->order_index,
        ];
    }
}
