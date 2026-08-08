<?php

namespace App\Http\Resources\Admin;

use App\Models\ChecklistItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ChecklistItem */
class AdminChecklistItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'group_name' => $this->group_name,
            'title' => $this->title,
            'description' => $this->description,
            'order_index' => $this->order_index,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
