<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['form_id', 'label', 'description', 'type', 'placeholder', 'options', 'validation', 'is_required', 'order_index'])]
class FormField extends Model
{
    protected function casts(): array
    {
        return [
            'options' => 'array',
            'validation' => 'array',
            'is_required' => 'boolean',
        ];
    }

    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }
}
