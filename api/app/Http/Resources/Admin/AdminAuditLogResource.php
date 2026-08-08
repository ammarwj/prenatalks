<?php

namespace App\Http\Resources\Admin;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AuditLog */
class AdminAuditLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'action_label' => AuditLog::ACTION_LABELS[$this->action] ?? $this->action,
            'model_type' => $this->model_type,
            'model_label' => AuditLog::MODEL_LABELS[$this->model_type] ?? $this->model_type,
            'model_id' => $this->model_id,
            'changes' => $this->changes,
            'ip' => $this->ip,
            'created_at' => $this->created_at,
            // Pelaku bisa null bila akunnya sudah dihapus — jejaknya sengaja
            // dipertahankan (lihat nullOnDelete di migrasi).
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ] : null),
        ];
    }
}
