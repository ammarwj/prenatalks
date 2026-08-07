<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminFormExportResource;
use App\Jobs\ExportSubmissionsJob;
use App\Models\Form;
use App\Models\FormExport;
use App\Services\FormExportService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Export CSV/XLSX respon form/survei — PRD §9 F-07. Sinkron untuk ≤ 1.000
 * baris, lewat queue database untuk data lebih besar (business flow §7).
 */
class FormExportController extends Controller
{
    use ApiResponse;

    /** Batas jumlah baris yang masih diproses sinkron dalam request ini. */
    private const SYNC_THRESHOLD = 1000;

    public function __construct(private readonly FormExportService $exportService) {}

    public function index(Form $form)
    {
        $exports = $form->exports()->orderByDesc('created_at')->limit(20)->get();

        return $this->success(AdminFormExportResource::collection($exports));
    }

    public function store(Request $request, Form $form)
    {
        $format = $request->query('format', 'csv');

        if (! in_array($format, ['csv', 'xlsx'], true)) {
            return $this->error('Format ekspor harus csv atau xlsx', null, 422);
        }

        $export = $form->exports()->create([
            'format' => $format,
            'status' => 'processing',
            'requested_by' => $request->user('api')->id,
        ]);

        if ($form->submissions()->count() > self::SYNC_THRESHOLD) {
            ExportSubmissionsJob::dispatch($export->id);
        } else {
            $this->exportService->generate($export);
            $export->refresh();
        }

        return $this->success(new AdminFormExportResource($export), 'Ekspor diproses', status: 202);
    }

    public function download(Form $form, FormExport $export)
    {
        if ($export->form_id !== $form->id) {
            abort(404);
        }

        if (! $export->isDownloadable()) {
            return $this->error('Berkas ekspor belum siap atau sudah kedaluwarsa', null, 410);
        }

        return Storage::disk('local')->download($export->file_path, "form-{$form->slug}.{$export->format}");
    }
}
