<?php

namespace App\Http\Resources\HealthWorker;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Hasil pencarian tenaga kesehatan yang akan diberi izin. Sengaja hanya
 * id, nama, dan email yang dicari — bukan UserResource yang membawa
 * `phone`, `last_login_at`, dan status akun ke layar orang lain.
 *
 * @mixin User
 */
class HealthWorkerDirectoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
        ];
    }
}
