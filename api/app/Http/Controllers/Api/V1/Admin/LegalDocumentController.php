<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminLegalDocumentRequest;
use App\Http\Resources\Admin\AdminLegalDocumentResource;
use App\Models\LegalDocument;
use App\Traits\ApiResponse;

/**
 * Kelola dokumen legal — super_admin saja (PRD §12.3, Lampiran C).
 *
 * **Sengaja tanpa `store()` dan `destroy()`.** Himpunan dokumennya tetap dua
 * dan didaftarkan di `LegalDocument::SLUGS`: situs wajib selalu punya
 * kebijakan privasi, dan form pendaftaran menautkan keduanya sebagai syarat
 * persetujuan. Tombol hapus di sini hanya jalan menuju tautan yang mati.
 * Rutenya pun didaftarkan satu per satu (bukan `apiResource`) supaya
 * ketiadaan kedua aksi itu ditegakkan router, bukan sekadar disembunyikan
 * dari antarmuka.
 */
class LegalDocumentController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $documents = LegalDocument::with('updatedBy')->orderBy('id')->get();

        return $this->success(AdminLegalDocumentResource::collection($documents));
    }

    public function show(LegalDocument $legalDocument)
    {
        return $this->success(new AdminLegalDocumentResource($legalDocument->load('updatedBy')));
    }

    public function update(AdminLegalDocumentRequest $request, LegalDocument $legalDocument)
    {
        $data = $request->validated();

        $legalDocument->update([
            'title' => $data['title'],
            'body' => $data['body'],
            'effective_date' => $data['effective_date'] ?? null,
            'is_published' => $data['is_published'] ?? false,

            // Distempel di sini, bukan dikirim klien — pola yang sama dengan
            // `reviewed_by` di ArticleController.
            'updated_by' => $request->user('api')->id,
        ]);

        return $this->success(
            new AdminLegalDocumentResource($legalDocument->fresh('updatedBy')),
            'Dokumen legal diperbarui'
        );
    }
}
