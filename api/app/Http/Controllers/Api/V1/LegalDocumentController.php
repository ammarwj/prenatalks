<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\LegalDocumentResource;
use App\Models\LegalDocument;
use App\Traits\ApiResponse;

/**
 * Dokumen legal untuk halaman publik `/syarat-ketentuan` dan
 * `/kebijakan-privasi` (PRD §12.3).
 *
 * Segmen `{slug}` sudah dibatasi di rute ke `LegalDocument::SLUGS`, jadi yang
 * berakhir 404 di sini hanyalah dokumen yang memang belum diterbitkan.
 */
class LegalDocumentController extends Controller
{
    use ApiResponse;

    public function show(string $slug)
    {
        $document = LegalDocument::published()->where('slug', $slug)->first();

        if (! $document) {
            return $this->error('Dokumen tidak ditemukan', null, 404);
        }

        return $this->success(new LegalDocumentResource($document));
    }
}
