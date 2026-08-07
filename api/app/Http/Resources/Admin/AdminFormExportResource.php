<?php

namespace App\Http\Resources\Admin;

use App\Models\FormExport;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin FormExport */
class AdminFormExportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'format' => $this->format,
            'status' => $this->status,
            'download_url' => $this->resource->isDownloadable()
                ? route('admin.forms.exports.download', ['form' => $this->form_id, 'export' => $this->id])
                : null,
            'expires_at' => $this->expires_at,
            'created_at' => $this->created_at,
        ];
    }
}
