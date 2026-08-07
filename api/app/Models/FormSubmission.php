<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['form_id', 'user_id', 'submitted_at', 'ip_hash', 'user_agent'])]
class FormSubmission extends Model
{
    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }

    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(FormAnswer::class, 'submission_id');
    }
}
