<?php

namespace App\Jobs;

use App\Models\FormExport;
use App\Services\FormExportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

/**
 * Ekspor respon form/survei untuk data > 1.000 baris (PRD §9 F-07) —
 * dijalankan lewat queue database supaya request admin tidak menunggu
 * pembuatan berkas besar.
 */
class ExportSubmissionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $exportId) {}

    public function handle(FormExportService $service): void
    {
        $export = FormExport::find($this->exportId);

        if (! $export) {
            return;
        }

        try {
            $service->generate($export);
        } catch (Throwable $e) {
            $export->update(['status' => 'failed']);
            throw $e;
        }
    }
}
