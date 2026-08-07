<?php

namespace App\Models;

use Database\Factories\PregnancyFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'lmp_date',
    'edd_date',
    'edd_overridden',
    'gravida',
    'para',
    'abortus',
    'height_cm',
    'weight_prepregnancy_kg',
    'weight_current_kg',
    'blood_type',
    'medical_history',
    'facility_name',
    'facility_contact',
    'status',
])]
class Pregnancy extends Model
{
    /** @use HasFactory<PregnancyFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'lmp_date' => 'date',
            'edd_date' => 'date',
            'edd_overridden' => 'boolean',
            'gravida' => 'integer',
            'para' => 'integer',
            'abortus' => 'integer',
            'height_cm' => 'decimal:1',
            'weight_prepregnancy_kg' => 'decimal:1',
            'weight_current_kg' => 'decimal:1',
            'medical_history' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
