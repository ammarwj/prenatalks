<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['form_id', 'format', 'status', 'file_path', 'requested_by', 'expires_at'])]
class FormExport extends Model
{
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && now()->gt($this->expires_at);
    }

    public function isDownloadable(): bool
    {
        return $this->status === 'completed' && $this->file_path !== null && ! $this->isExpired();
    }
}
