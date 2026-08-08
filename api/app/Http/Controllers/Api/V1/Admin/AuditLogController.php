<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminAuditLogResource;
use App\Models\AuditLog;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Audit log — super_admin (PRD §9 F-14, §11.2 `GET /admin/audit-logs`).
 */
class AuditLogController extends Controller
{
    use ApiResponse;

    private const PER_PAGE = 25;

    public function index(Request $request)
    {
        $validated = $request->validate([
            'action' => ['nullable', Rule::in(array_keys(AuditLog::ACTION_LABELS))],
            'model_type' => ['nullable', Rule::in(array_keys(AuditLog::MODEL_LABELS))],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = AuditLog::query()->with('user');

        foreach (['action', 'model_type', 'user_id'] as $field) {
            if (! empty($validated[$field])) {
                $query->where($field, $validated[$field]);
            }
        }

        if ($from = $validated['from'] ?? null) {
            $query->where('created_at', '>=', $from);
        }

        if ($to = $validated['to'] ?? null) {
            // Batas atas inklusif: admin memilih tanggal, bukan detik.
            $query->where('created_at', '<=', $to.' 23:59:59');
        }

        $logs = $query->orderByDesc('created_at')->orderByDesc('id')->paginate(self::PER_PAGE);

        return $this->success(
            AdminAuditLogResource::collection($logs),
            meta: [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
                'actions' => AuditLog::ACTION_LABELS,
                'model_types' => AuditLog::MODEL_LABELS,
            ]
        );
    }
}
